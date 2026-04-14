import modal
import os
import shutil
import subprocess
from supabase import create_client, Client
from dotenv import load_dotenv
from brain import sentinel_brain
from brain_fixer import sentinel_fixer

# load local .env if running locally (for deployment)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(env_path)

# 1. Image Definition
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install("supabase", "python-dotenv", "fastapi[standard]", "langgraph", "langchain", "langchain-openai")
    .add_local_python_source("brain")
    .add_local_python_source("brain_fixer")
)

app = modal.App("sentinel-zero-worker")
volume = modal.Volume.from_name("repo-storage", create_if_missing=True)

# 2. Secrets (inject into Modal container)
modal_secrets = modal.Secret.from_dict({
    "SUPABASE_URL": os.environ.get("SUPABASE_URL", ""),
    "SUPABASE_SERVICE_ROLE_KEY": os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
    "NEBIUS_API_KEY": os.environ.get("NEBIUS_API_KEY", ""),
    "LANGCHAIN_TRACING_V2": "true",
    "LANGCHAIN_API_KEY": os.environ.get("LANGCHAIN_API_KEY", ""),
    "LANGCHAIN_PROJECT": os.environ.get("LANGCHAIN_PROJECT", "sentinel-zero"),
    "LANGCHAIN_ENDPOINT": "https://api.smith.langchain.com"
})

# 3. The Core Worker Function
@app.function(image=image, volumes={"/repos": volume}, secrets=[modal_secrets], timeout=600)
def clone_and_inspect(repo_url: str, job_id: str):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    target_path = f"/repos/{repo_name}"

    try:
        if os.path.exists(target_path):
            shutil.rmtree(target_path)

        subprocess.run(["git", "clone", "--depth", "1", repo_url, target_path], check=True)

        supabase.table("scan_jobs").update({"status": "analyzing"}).eq("id", job_id).execute()

        # 1. RUN THE BRAIN SEQUENTIALLY (File by File)
        initial_state = {
            "repo_path": target_path,
            "files_to_scan": [],
            "current_file_index": 0,
            "vulnerabilities": [],
            "logs": []
        }
        
        # This will run gather_files -> analyze_code (loop) -> report
        # UNIFIED TRACING: Naming the parent trace for LangSmith
        final_state = sentinel_brain.invoke(
            initial_state,
            config={"run_name": f"Sentinel-Scan: {repo_name}"}
        )
        all_vulnerabilities = final_state["vulnerabilities"]
        file_paths = final_state["files_to_scan"]

        # 2. Aggregate Results
        supabase.table("scan_jobs").update({
            "status": "completed",
            "logs": [f"Scanned {len(file_paths)} files sequentially. Found {len(all_vulnerabilities)} bugs."]
        }).eq("id", job_id).execute()

        for vuln in all_vulnerabilities:
            supabase.table("vulnerabilities").insert({
                "job_id": job_id,
                "file_path": vuln["file"],
                "description": vuln["finding"],
                "severity": vuln.get("severity", "high"),
                "status": "open"
            }).execute()

        return {"status": "success", "bugs_found": len(all_vulnerabilities)}

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        supabase.table("scan_jobs").update({"status": "failed", "logs": [{"error": str(e)}]}).eq("id", job_id).execute()
        return {"status": "error", "message": str(e)}

# 4. The Webhook (For your TypeScript API)
@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def trigger_scan_webhook(data: dict):
    repo_url = data.get("repo_url")
    job_id = data.get("job_id")
    clone_and_inspect.spawn(repo_url, job_id)
    return {"message": "Job received and processing in sandbox"}

# 5. Fixer Modal Agent
@app.function(image=image, volumes={"/repos": volume}, secrets=[modal_secrets], timeout=600)
def generate_and_save_fix(vuln_id: str):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    vuln = supabase.table("vulnerabilities").select("*").eq("id", vuln_id).execute().data[0]
    
    with open(vuln["file_path"], "r") as f:
        original_code = f.read()
        
    initial_state = {
        "vuln_id": vuln_id,
        "file_path": vuln["file_path"],
        "original_code": original_code,
        "ai_finding": vuln["description"],
        "human_feedback": vuln["human_feedback"],
        "fixed_code": ""
    }
    
    from brain_fixer import sentinel_fixer
    final_state = sentinel_fixer.invoke(initial_state)
    
    supabase.table("vulnerabilities").update({
        "suggested_fix": final_state["fixed_code"],
        "status": "fix_ready"
    }).eq("id", vuln_id).execute()

    # Notify backend of the new fix (Graceful failure for cloud-to-local calls)
    try:
        import requests
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:3001")
        print(f"📡 Notifying backend at {backend_url}...")
        requests.post(f"{backend_url}/api/v1/scans/deploy-pr/{vuln_id}", timeout=5)
    except Exception as e:
        print(f"⚠️ Note: Could not reach backend at {os.environ.get('BACKEND_URL', 'localhost:3001')}. Fix was still saved to Supabase.")

# The Webhook that TS calls
@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def trigger_fix_webhook(data: dict):
    generate_and_save_fix.spawn(data.get("vulnerability_id"))
    return {"message": "Human approval received. Fixer Agent deployed."}

# 6. Local Entrypoint (For CLI Testing)
@app.local_entrypoint()
def main(repo_url: str = "https://github.com/pallets/flask", job_id: str = "00000000-0000-0000-0000-000000000000"):
    import os
    from supabase import create_client
    from dotenv import load_dotenv
    load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(supabase_url, supabase_key)
    
    repo_name_full = repo_url.split("/")[-2] + "/" + repo_url.split("/")[-1].replace(".git", "")

    # 1. Upsert Repository first to get a valid repo_id
    print(f"📡 Syncing Repository {repo_name_full}...")
    repo_res = supabase.table("repositories").upsert({
        "github_id": repo_url,
        "full_name": repo_name_full
    }, on_conflict="github_id").execute()
    
    repo_id = repo_res.data[0]["id"]

    # 2. Create the dummy job linked to that repo
    print(f"📡 Registering test job {job_id}...")
    supabase.table("scan_jobs").upsert({
        "id": job_id,
        "repo_id": repo_id,
        "status": "queued"
    }).execute()

    print(f"🚀 Manually triggering scan for {repo_url}")
    clone_and_inspect.remote(repo_url, job_id)