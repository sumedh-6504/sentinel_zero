import os
import shutil
import subprocess
from fastapi import FastAPI, BackgroundTasks
from supabase import create_client, Client
from dotenv import load_dotenv

import blaxel
from blaxel.telemetry import telemetry_manager

# Ensure blaxel telemetry is initialized correctly with env variables
blaxel.autoload()

try:
    from brain import sentinel_brain
except ImportError:
    from .brain import sentinel_brain

# Load local .env for local testing
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(env_path)

app = FastAPI(title="Sentinel Zero Blaxel Agent")

def clone_and_inspect(repo_url: str, job_id: str):
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    target_path = f"/tmp/repos/{repo_name}"

    try:
        # Clean up existing repo inside ephemeral container
        if os.path.exists(target_path):
            print(f"Cleaning up existing path: {target_path}")
            shutil.rmtree(target_path)
            
        # Make sure directory exists
        os.makedirs(target_path, exist_ok=True)

        print(f"Cloning {repo_url} into {target_path}...")
        
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
        # Telemetry is automatically propagated since we are inside a FastAPI route
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


@app.post("/")
def trigger_scan_webhook(data: dict, background_tasks: BackgroundTasks):
    repo_url = data.get("repo_url")
    job_id = data.get("job_id")
    
    # Spawn in the background instantly
    background_tasks.add_task(clone_and_inspect, repo_url, job_id)
    return {"message": "Job received and processing in background on Blaxel"}
