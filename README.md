# 🛡️ Sentinel-Zero: Agentic AI Security Analyst

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Modal](https://img.shields.io/badge/Modal-000000?style=for-the-badge&logo=serverless&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![LangGraph](https://img.shields.io/badge/LangGraph-FF4F00?style=for-the-badge&logo=langchain&logoColor=white)](#)

Sentinel-Zero is an **autonomous, agentic AI security pipeline** designed to perform static code analysis and automated vulnerability remediation. Moving beyond simple AI wrappers, Sentinel-Zero utilizes state-machine-driven LLM agents (via LangGraph) running on highly scalable serverless GPUs (via Modal) to deeply analyze entire codebases, flag critical security flaws, and—with human-in-the-loop approval—generate safe, targeted code patches.

---

## ✨ Key Features

* **🌐 Automated Repository Ingestion**: Dynamically clones and safely mounts targeted GitHub repositories into isolated severless sandboxes.
* **🧠 Multi-Agent Orchestration**: Utilizes a Two-Phase LangGraph architecture:
  * **Phase 1 (The Scanner)**: Systematically walks the codebase, bypassing large dependencies, and uses strict-schema prompt engineering to identify specific exploit vectors (XSS, SQLi, IDOR, etc.).
  * **Phase 2 (The Fixer)**: Ingests human code-review feedback alongside the vulnerable file to write a highly contextualized zero-day patch.
* **⚡ Serverless Scaling**: Python AI workers are deployed on **Modal**, allowing the pipeline to scale instantly and handle massive enterprise monorepos without timeout constraints.
* **📊 Enterprise Observability**: Fully instrumented with **LangSmith** to provide deep tracing of LLM reasoning, token usage, and graph states.
* **👨‍💻 Human-in-the-Loop (HITL)**: Architecture ensures that AIs augment development rather than blindly modifying production code. AI remediation is strictly gated by human approval.

---

## 🏗️ System Architecture

![Sentinel-Zero Pipeline Architecture](https://via.placeholder.com/900x450?text=Insert+Architecture+Diagram+Here+(Scanner+%E2%9E%A1+DB+%E2%9E%A1+Human+Review+%E2%9E%A1+Fixer))
> *Placeholder: A flow diagram showing the Express Backend communicating with Supabase, dispatching serverless triggers to Modal, and the LangGraph agents reading physical code to update the database.*

### Tech Stack
- **Backend**: Express.js, TypeScript, Node.js
- **AI Agents**: Python, LangChain, LangGraph
- **LLM Engine**: Meta Llama-3.3-70B-Instruct-fast (hosted via Nebius AI)
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Modal (Serverless Python functions & webhooks)
- **Telemetry**: LangSmith

---

## 📸 Project Showcase

### 1. The Dashboard (WIP)
![Dashboard UI Placeholder](https://via.placeholder.com/800x400?text=Insert+Screenshot+of+Frontend+Dashboard)
> *The central hub where engineers can view scanned vulnerabilities and provide HITL feedback.*

### 2. LangSmith Trace (Agentic Reasoning)
![LangSmith Telemetry Placeholder](https://via.placeholder.com/800x400?text=Insert+Screenshot+of+LangSmith+Trace+showing+LLM+Tokens/Steps)
> *Deep observability showing the LangGraph state machine tracking agent execution steps.*

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Accounts for Supabase, Modal, Nebius AI, and LangSmith.

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/sentinel-zero.git
cd sentinel-zero
npm install
```

### 2. Configure Environment variables
Create a `.env` file at the root:
```ini
PORT=3001
SUPABASE_URL=<YOUR_SUPABASE_URL>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_ROLE_KEY>
NEBIUS_API_KEY=<YOUR_NEBIUS_KEY>
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<YOUR_LANGCHAIN_KEY>
LANGCHAIN_PROJECT=sentinel-zero
```

### 3. Deploy the AI Workers to Modal
```bash
cd workers
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt # Make sure you have one!
modal deploy sandbox.py
```
*Note: Update the webhook URLs in `src/modules/scans/scan.service.ts` with the new Modal domains after deployment.*

### 4. Run the Backend API
```bash
# Return to root directory
npm run dev
```

### 5. Trigger a Scan
```bash
# Scan a live repository
npx ts-node src/modules/scripts/test-scan.ts https://github.com/psf/requests
```

---

## 🔮 Future Roadmap
- [ ] **Git Operations Integration**: Grant the Fixer Agent the ability to autonomously create Git Branches and submit standard GitHub Pull Requests.
- [ ] **Frontend Application**: Complete a robust React/Next.js dashboard to visualize findings.
- [ ] **AST Parsing**: Move beyond Regex/Text splitting and implement precise Abstract Syntax Tree (AST) parsing for targeted line-by-line remediation.

---
*Built by Sumedh-6504. Designed to show the power of Serverless Stateful Agents.*
