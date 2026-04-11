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
        model="meta-llama/Llama-3.3-70B-Instruct-fast",
        temperature=0.2
    )
    prompt = f"""
    You are a Senior Security Engineer. You found this vulnerability: {state['ai_finding']}.
    The Senior Human Reviewer approved this and added this feedback: "{state['human_feedback']}".
    
    ORIGINAL CODE:
    {state['original_code']}
    
    Output ONLY the fixed code. Do not include markdown blocks or explanations. Just the safe code.
    """
    
    response = llm.invoke([
        SystemMessage(content="You are an expert coder. Output raw code only."),
        HumanMessage(content=prompt)
    ])
    
    state["fixed_code"] = response.content
    return state

# Build the small Fixer Graph
fixer_workflow = StateGraph(FixerState)
fixer_workflow.add_node("generate_patch", node_generate_patch)
fixer_workflow.set_entry_point("generate_patch")
fixer_workflow.add_edge("generate_patch", END)

sentinel_fixer = fixer_workflow.compile()