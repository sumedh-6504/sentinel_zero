import modal
import os
import shutil
import subprocess
from supabase import create_client, Client
from dotenv import load_dotenv
from brain import sentinel_brain

# load local .env if running locally (for deployment)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(env_path)

# 1. Image Definition
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install("supabase", "python-dotenv", "fastapi[standard]", "langgraph", "langchain", "langchain-openai")
    .add_local_python_source("brain")
)

app = modal.App("sentinel-zero-worker")
volume = modal.Volume.from_name("repo-storage", create_if_missing=True)

# 2. Secrets (inject into Modal container)
modal_secrets = modal.Secret.from_dict({
    "SUPABASE_URL": os.environ.get("SUPABASE_URL", ""),
    "SUPABASE_SERVICE_ROLE_KEY": os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
    "NEBIUS_API_KEY": os.environ.get("NEBIUS_API_KEY", "")
})

# 3. The Core Worker Function
@app.function(image=image, volumes={"/repos": volume}, secrets=[modal_secrets], timeout=600)
def clone_and_inspect(repo_url: str, job_id: str):
    # Read from the container's environment (injected via secrets)
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    target_path = f"/repos/{repo_name}"

    try:
        # Clean up existing repo
        if os.path.exists(target_path):
            print(f"Cleaning up existing path: {target_path}")
            shutil.rmtree(target_path)

        print(f"Cloning {repo_url}...")
        
        # Execute Git Clone
        process = subprocess.run(["git", "clone", "--depth", "1", repo_url, target_path],
            check=True,
            capture_output=True,
            text=True
        )

        # Success - Update Supabase
        supabase.table("scan_jobs").update({
            "status": "analyzing",
            "logs":[{"event": "clone_success", "output": process.stdout}]
        }).eq("id", job_id).execute()

        print("✅ Clone successful and Supabase updated!")
        
        # Wake up the Brain!
        initial_state = {
            "repo_path": target_path,
            "files_to_scan": [],
            "current_file_index": 0,
            "vulnerabilities":[],
            "logs": ["Brain initialized."]
        }
        
        # Run the LangGraph Agent
        final_state = sentinel_brain.invoke(initial_state)

        # Send the findings back to Supabase
        supabase.table("scan_jobs").update({
            "status": "completed",
            "logs": final_state["logs"]
        }).eq("id", job_id).execute()

        # If bugs found, insert them into the Vulnerabilities table
        for vuln in final_state["vulnerabilities"]:
            supabase.table("vulnerabilities").insert({
                "job_id": job_id,
                "file_path": vuln["file"],
                "description": vuln["finding"],
                "severity": "high",
                "status": "open"
            }).execute()

        return {"status": "success", "bugs_found": len(final_state["vulnerabilities"])}

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        print(f"❌ Clone failed: {error_msg}")
        
        # Failed - Update Supabase
        supabase.table("scan_jobs").update({
            "status": "failed",
            "logs": [{"event": "clone_failed", "error": error_msg}]
        }).eq("id", job_id).execute()
        
        return {"status": "error", "message": error_msg}

# 4. The Webhook (For your TypeScript API)
@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def trigger_scan_webhook(data: dict):
    repo_url = data.get("repo_url")
    job_id = data.get("job_id")
    
    # .spawn() runs the function in the background so the webhook returns a 200 OK instantly
    clone_and_inspect.spawn(repo_url, job_id)
    return {"message": "Job received and processing in sandbox"}

# 5. Local Entrypoint (For CLI Testing)
@app.local_entrypoint()
def main(repo_url: str = "https://github.com/fastapi/fastapi", job_id: str = "test-job"):
    print(f"🚀 Manually triggering scan for {repo_url}")
    # .remote() runs it synchronously so you can see the output in your terminal
    clone_and_inspect.remote(repo_url, job_id)