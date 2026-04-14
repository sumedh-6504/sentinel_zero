import os
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
        model="meta-llama/Llama-3.3-70B-Instruct",
        temperature=0.1
    )
    prompt = f"""
    You are a Principal Security Engineer. Your task is to fix a security vulnerability without breaking the build.
    
    VULNERABILITY: {state['ai_finding']}
    HUMAN REVIEW FEEDBACK: "{state['human_feedback']}"
    
    STRICT RULES:
    1. DO NOT introduce new libraries that are not already imported in the original code.
    2. ENSURE all variables you use (like 'username' or 'slug') are available in the current scope.
    3. PRESERVE the original coding style and indentation.
    4. If a fix requires a new import, you MUST add the import statement at the top.
    
    ORIGINAL CODE:
    {state['original_code']}
    
    Output ONLY the complete, fixed file content. Wrap your code in ```[language] ... ``` blocks so I can extract it properly.
    Do not add explanations or talk. Just code.
    """
    
    response = llm.invoke([
        SystemMessage(content="You are a professional software engineer. You provide complete, buildable, and secure file contents."),
        HumanMessage(content=prompt)
    ])
    
    # Extract code from Markdown blocks
    content = response.content
    if "```" in content:
        import re
        code_blocks = re.findall(r"```(?:\w+)?\n(.*?)\n```", content, re.DOTALL)
        if code_blocks:
            content = code_blocks[0]
            
    state["fixed_code"] = content
    return state

# Build the small Fixer Graph
fixer_workflow = StateGraph(FixerState)
fixer_workflow.add_node("generate_patch", node_generate_patch)
fixer_workflow.set_entry_point("generate_patch")
fixer_workflow.add_edge("generate_patch", END)

sentinel_fixer = fixer_workflow.compile()