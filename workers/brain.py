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

import json
import re

# Elite Language-Specific Security Patterns
EXTENSION_PATTERNS = {
    ".py": [
        r"eval\(", r"exec\(", r"os\.system", r"subprocess\.(?:run|call|Popen|check_output)",  # Code/Command Injection
        r"pickle\.load", r"yaml\.(?:load|unsafe_load)", r"getattr\(", r"setattr\(",             # Insecure Deserialization
        r"cursor\.execute\(.*f?[\"\'].*\{", r"db\.execute\(.*f?[\"\'].*\{",                   # SQLi in Python
        r"SECRET_KEY\s*=", r"PASSWORD\s*=", r"API_KEY\s*="                                   # Secrets
    ],
    ".js": [
        r"innerHTML", r"document\.write\(", r"dangerouslySetInnerHTML",                      # XSS
        r"eval\(", r"new Function\(", r"setTimeout\(.*[\"\'].*\(",                           # Code Injection
        r"localStorage\.setItem\(", r"sessionStorage\.setItem\(",                            # Insecure Storage
        r"postMessage\(", r"window\.location", r"XMLHttpRequest", r"fetch\(.*http:"         # Comms
    ],
    ".jsx": [
         r"dangerouslySetInnerHTML", r"eval\(", r"innerHTML",                                # React XSS
         r"api[-_]?key", r"secret", r"password"                                              # Sensitive data in JSX
    ],
    ".ts": [
        r"innerHTML", r"dangerouslySetInnerHTML", r"eval\(", r"new Function\(",              # JS Vulns
        r"as any", r"interface.*\{.*\[key: string\]: any",                                    # Type bypass
        r"process\.env\.", r"SECRET", r"TOKEN", r"KEY"                                       # Environment
    ],
    ".tsx": [
         r"dangerouslySetInnerHTML", r"eval\(", r"innerHTML",                                # React/TS XSS
         r"as any", r"api[-_]?key", r"token"                                                  # TSX specific
    ],
    ".env": [
        r"AWS_", r"STRIPE_", r"SUPABASE_", r"DATABASE_URL", r"JWT_SECRET",                   # Cloud Keys
        r"PASSWORD", r"TOKEN", r"SECRET", r"KEY", r"PRIVATE"                                 # Generic Secrets
    ],
    "global": [
        r"eval\(", r"exec\(", r"system\(", r"chmod", r"chown", r"sudo",                      # Command Injection
        r"api[-_]?key", r"secret", r"password", r"TOKEN"                                     # Universal Secrets
    ]
}

def is_potentially_vulnerable(code: str, file_path: str) -> bool:
    """Uses Language-Aware patterns to perform a high-speed pre-audit."""
    _, ext = os.path.splitext(file_path.lower())
    patterns = EXTENSION_PATTERNS.get(ext, EXTENSION_PATTERNS["global"])
    
    # Merge with global patterns for maximum safety
    all_patterns = list(set(patterns + EXTENSION_PATTERNS["global"]))
        
    for pattern in all_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            return True
    return False

def node_gather_files(state: AgentState):
    """Finds all Python/JS/TS files in the cloned repo, ignoring dependencies."""
    state["logs"].append("Gathering files and applying first-pass filters...")
    target_files = []
    
    ignore_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build", ".next", ".cache"}
    
    for root, dirs, files in os.walk(state["repo_path"]):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            if file.endswith((".py", ".ts", ".js", ".tsx", ".jsx", ".env")):
                target_files.append(os.path.join(root, file))
    
    state["files_to_scan"] = target_files
    state["logs"].append(f"Discovered {len(target_files)} core source files.")
    return state


import concurrent.futures

def node_analyze_code(state: AgentState):
    """Processes a batch of files using a Hybrid Regex filter and Unified LLM Batching."""
    idx = state["current_file_index"]
    batch_files = state["files_to_scan"][idx : idx + 10] # Batch up to 10 for better trace grouping
    nebius_key = os.getenv("NEBIUS_API_KEY")
    
    state["logs"].append(f"🔍 Analyzing batch of {len(batch_files)} files...")
    
    # 1. High-Speed Regex Filtering
    risky_files = []
    for file_path in batch_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            if is_potentially_vulnerable(content, file_path):
                risky_files.append({"path": file_path, "content": content})
            else:
                state["logs"].append(f"✅ Fast-Pass Clean (Regex): {file_path}")
        except Exception as e:
            state["logs"].append(f"⚠️ Error reading {file_path}: {str(e)}")

    # 2. Unified LLM Batch Call (for the risky ones)
    if risky_files:
        state["logs"].append(f"🧠 Dispatching {len(risky_files)} files to Nemotron for Deep Scan...")
        llm = ChatOpenAI(
            base_url="https://api.studio.nebius.ai/v1/",
            api_key=nebius_key,
            model="nvidia/nemotron-3-super-120b-a12b", # Using your preferred 120B model
            temperature=0.2
        )
        
        # Prepare batch inputs
        batch_inputs = []
        for rf in risky_files:
            prompt = f"""
            You are an elite Application Security Engineer.
            Analyze this code that was flagged by a pre-filter. Perform a forensic audit.
            
            RULES: Focus ONLY on critical exploits. Response must be raw JSON.
            JSON SCHEMA: {{"vulnerable": boolean, "type": string, "description": string}}
            
            CODE:
            {rf['content']}
            """
            batch_inputs.append([
                SystemMessage(content="You are a strict JSON security auditor. Output raw JSON ONLY."),
                HumanMessage(content=prompt)
            ])
            
        try:
            # UNIFIED TRACING: Explicitly naming the run so LangSmith groups them as one unit
            responses = llm.batch(
                batch_inputs, 
                config={"run_name": f"Deep-Audit: {len(risky_files)} Files"}
            )
            
            for rf, resp in zip(risky_files, responses):
                content = resp.content.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                    
                result = json.loads(content)
                if result.get("vulnerable"):
                    state["vulnerabilities"].append({
                        "file": rf["path"],
                        "finding": result.get("description", "Vulnerability detected."),
                        "type": result.get("type", "Security Bug")
                    })
                    state["logs"].append(f"🚨 ALERT: {result.get('type')} in {rf['path']}")
                else:
                    state["logs"].append(f"✅ Deep-Scan Clean (LLM): {rf['path']}")
        except Exception as e:
            state["logs"].append(f"❌ Batch LLM Error: {str(e)}")

    state["current_file_index"] += len(batch_files)
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