import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import blaxel

# ---------------------------------------------------------
# 1. DEFINE THE MEMORY (The Agent's Clipboard)
# ---------------------------------------------------------
class AgentState(TypedDict):
    repo_path: str
    files_to_scan: List[str]
    current_file_index: int
    vulnerabilities: List[dict]
    logs: List[str]

# ---------------------------------------------------------
# 3. DEFINE THE NODES (The Factory Rooms)
# ---------------------------------------------------------

def node_gather_files(state: AgentState):
    """Finds all Python/JS/TS files in the cloned repo."""
    state["logs"].append("Gathering files to scan...")
    target_files =[]
    
    # Walk through the directory Modal created
    for root, _, files in os.walk(state["repo_path"]):
        for file in files:
            if file.endswith((".py", ".ts", ".js")):
                target_files.append(os.path.join(root, file))
    
    # FOR SAFETY & COST: We only scan the first 3 files during development
    state["files_to_scan"] = target_files[:3] 
    return state

def node_analyze_code(state: AgentState):
    """Reads a file and asks Nebius if it is vulnerable."""
    idx = state["current_file_index"]
    file_path = state["files_to_scan"][idx]
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
            
        prompt = f"""
        You are a Senior AppSec Engineer. Analyze the following code.
        If there is a critical vulnerability (SQLi, XSS, Hardcoded Secrets), reply strictly in this JSON format:
        {{"vulnerable": true, "type": "bug_type", "description": "brief details"}}
        If it is safe, reply strictly: {{"vulnerable": false}}
        
        CODE:
        {code_content}
        """
        
        # Lazily instantiate the LLM at run-time so Modal Secrets are available
        llm = ChatOpenAI(
            base_url="https://api.studio.nebius.ai/v1/",
            api_key=os.getenv("NEBIUS_API_KEY"),
            model="meta-llama/Llama-3.3-70B-Instruct-fast",
            temperature=0.1
        )

        response = llm.invoke([
            SystemMessage(content="You output only valid JSON."),
            HumanMessage(content=prompt)
        ])
        
        # In production, we parse this JSON properly. For now, we store the raw output.
        if "true" in response.content.lower():
            state["vulnerabilities"].append({"file": file_path, "finding": response.content})
            state["logs"].append(f"🚨 Vulnerability found in {file_path}")
        else:
            state["logs"].append(f"✅ {file_path} is safe.")
            
    except Exception as e:
        state["logs"].append(f"Error reading {file_path}: {str(e)}")
        
    state["current_file_index"] += 1
    return state

def node_report(state: AgentState):
    """Final step: format the results."""
    state["logs"].append(f"Finished scanning. Found {len(state['vulnerabilities'])} bugs.")
    return state

# ---------------------------------------------------------
# 4. DEFINE THE ROUTING (The Manager's Decisions)
# ---------------------------------------------------------
def router_continue_or_stop(state: AgentState):
    """Checks if we have scanned all files."""
    if state["current_file_index"] < len(state["files_to_scan"]):
        return "analyze_code" # Go back to the LLM
    return "report" # We are done

# ---------------------------------------------------------
# 5. BUILD THE GRAPH (Connecting the rooms)
# ---------------------------------------------------------
workflow = StateGraph(AgentState)

workflow.add_node("gather_files", node_gather_files)
workflow.add_node("analyze_code", node_analyze_code)
workflow.add_node("report", node_report)

workflow.set_entry_point("gather_files")
workflow.add_edge("gather_files", "analyze_code")
workflow.add_conditional_edges("analyze_code", router_continue_or_stop)
workflow.add_edge("report", END)

# Compile the Brain!
sentinel_brain = workflow.compile()