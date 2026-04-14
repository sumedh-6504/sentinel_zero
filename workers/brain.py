import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

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
    """Finds all Python/JS/TS files in the cloned repo, ignoring dependencies."""
    state["logs"].append("Gathering files to scan...")
    target_files = []
    
    # Directories we DO NOT want to scan
    ignore_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build"}
    
    for root, dirs, files in os.walk(state["repo_path"]):
        # Modify the 'dirs' list in-place to prevent os.walk from entering ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            if file.endswith((".py", ".ts", ".js", ".tsx", ".jsx")):
                target_files.append(os.path.join(root, file))
    
    # Remove the `[:3]` slice so it scans ALL valid files!
    state["files_to_scan"] = target_files
    state["logs"].append(f"Found {len(target_files)} source files to scan.")
    return state


import json # Make sure to add 'import json' at the very top of brain.py

def node_analyze_code(state: AgentState):
    """Reads a file and asks Nebius if it is vulnerable using the user's specific prompt."""
    idx = state["current_file_index"]
    file_path = state["files_to_scan"][idx]
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
            
        prompt = f"""
    You are an elite Application Security Engineer performing static analysis.
    Analyze the following code for critical vulnerabilities (SQL Injection, XSS, Path Traversal, Hardcoded Secrets, Command Injection).
    
    RULES:
    1. Ignore best-practice warnings (e.g., missing docstrings) or minor linting issues.
    2. Focus ONLY on exploitable security flaws.
    3. You must respond ONLY with a raw JSON object. Do not include markdown formatting, backticks, or conversational text.
    
    JSON SCHEMA:
    {{
        "vulnerable": boolean,
        "type": "string (e.g., SQLi, XSS) or null",
        "description": "string (Detailed explanation of the exploit vector) or null"
    }}
    
    CODE TO ANALYZE:
    {code_content}
        """
        
        llm = ChatOpenAI(
            base_url="https://api.studio.nebius.ai/v1/",
            api_key=os.getenv("NEBIUS_API_KEY"),
            model="meta-llama/Llama-3.3-70B-Instruct",
            temperature=0.0
        )

        response = llm.invoke([
            SystemMessage(content="You are a strict JSON security auditor. Output MUST be valid JSON."),
            HumanMessage(content=prompt)
        ])
        
        # Clean the response
        clean_json_str = response.content.replace("```json", "").replace("```", "").strip()
        
        try:
            result = json.loads(clean_json_str)
            
            if result.get("vulnerable") is True:
                state["vulnerabilities"].append({
                    "file": file_path, 
                    "finding": result.get("description", "Unknown vulnerability"),
                    "type": result.get("type", "Unknown")
                })
                state["logs"].append(f"🚨 Security vulnerability found in {file_path}")
            else:
                state["logs"].append(f"✅ {file_path} is safe.")
                
        except json.JSONDecodeError:
             state["logs"].append(f"⚠️ Error: LLM returned invalid JSON for {file_path}")
            
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