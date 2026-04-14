import os
import re
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

class FixerState(TypedDict):
    vuln_id: str
    file_path: str
    original_code: str
    ai_finding: str
    human_feedback: str
    fixed_code: str

def node_generate_patch(state: FixerState):
    llm = ChatOpenAI(
        base_url="https://api.studio.nebius.ai/v1/",
        api_key=os.getenv("NEBIUS_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b",
        temperature=0.2
    )
    prompt = f"""
    You are a Senior AI Principal Security Engineer. 
    Your task is to FIX the following security vulnerability.
    
    VULNERABILITY: {state['ai_finding']}
    HUMAN FEEDBACK: "{state['human_feedback']}"
    
    ORIGINAL CODE TO FIX:
    {state['original_code']}
    
    STRICT IMPORT & COMPONENT RULES:
    1. NEVER rename existing imports. If you use a component, it MUST be imported correctly.
    2. SHADCN CONVENTIONS: Use full names (e.g., 'DialogTrigger', 'SheetContent', 'AlertDialogAction'). 
       Do NOT use shortened names like 'Trigger' or 'Action' unless they are already imported that way.
    3. VALIDATION: Ensure all JSX tags you add (e.g., <DOMPurify />) have a matching import statement at the top.
    4. PRESERVE SCOPE: Do not use variables (like 'slug' or 'id') that are not available in the code snippet.
    
    FIX REQUIREMENTS:
    1. FIX the vulnerability (SQLi, XSS, etc.) without breaking functionality.
    2. Provide the COMPLETE file content, ready to be written to disk.
    
    Output ONLY the code wrapped in markdown blocks. No explanations.
    """
    
    response = llm.invoke([
        SystemMessage(content="You are a professional software engineer. You provide complete, buildable, and secure file contents."),
        HumanMessage(content=prompt)
    ])
    
    # Extract code from Markdown blocks
    content = response.content
    if "```" in content:
        code_blocks = re.findall(r"```(?:\w+)?\n(.*?)\n```", content, re.DOTALL)
        if code_blocks:
            content = code_blocks[0]
            
    state["fixed_code"] = content
    return state

def node_verify_patch(state: FixerState):
    """Audits the generated patch for syntax sanity and naming hallucinations."""
    code = state["fixed_code"]
    
    # Check for obvious naming hallucinations (Shadcn patterns)
    hallucinations = ["<Trigger", "<Action", "<Content", "<Title"]
    for h in hallucinations:
        if h in code and "import" in code:
            parts = code.split("import")
            found = False
            for part in parts[1:]:
                import_section = part.split(";")[0]
                if h.replace("<", "") in import_section:
                    found = True
                    break
            if not found:
                print(f"Warning: Possible orphaned component detected: {h}")

    return state

# Build the Fixer Graph
fixer_workflow = StateGraph(FixerState)
fixer_workflow.add_node("generate_patch", node_generate_patch)
fixer_workflow.add_node("verify_patch", node_verify_patch)

fixer_workflow.set_entry_point("generate_patch")
fixer_workflow.add_edge("generate_patch", "verify_patch")
fixer_workflow.add_edge("verify_patch", END)

sentinel_fixer = fixer_workflow.compile()