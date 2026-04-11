# 🛡️ Sentinel-Zero: Agentic AI Security Analyst

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Modal](https://img.shields.io/badge/Modal-000000?style=for-the-badge&logo=serverless&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![LangGraph](https://img.shields.io/badge/LangGraph-FF4F00?style=for-the-badge&logo=langchain&logoColor=white)](#)
[![Nebius AI](https://img.shields.io/badge/Nebius%20AI-04F0FF?style=for-the-badge)](#)

Sentinel-Zero is an **autonomous, agentic AI security pipeline** designed to perform static code analysis and automated vulnerability remediation. Moving beyond simple AI wrappers, Sentinel-Zero utilizes state-machine-driven LLM agents (via LangGraph) running on highly scalable serverless GPUs (via Modal) to deeply analyze entire codebases, flag critical security flaws, and—with human-in-the-loop approval—generate safe, targeted code patches.

---

## ✨ Key Features

*   **⚡ Ephemeral Source-Code Ingestion**: Efficiently clones targeted GitHub repositories into isolated, serverless environments using **Modal Shared Volumes**—bypassing traditional container instantiation overhead.
*   **🧠 Stateful Agentic Orchestration**: Leverages **LangGraph** to manage a complex, multi-step state machine. Our agents don't just "predict"; they reason through codebases, manage scan states, and iteratively refine findings.
*   **🔍 High-Precision Vulnerability Detection**: Uses a fine-tuned **Llama-3.3-70B** model on **Nebius AI** with strict schema-enforced analysis to eliminate hallucinations and prioritize real-world exploit vectors like SQLi and DOM-XSS.
*   **🛠️ Automated Patch Generation (The Fixer)**: A secondary agent dedicated to remediation. It ingests original code, identified vulnerabilities, and human reviewer feedback to generate production-ready code patches.
*   **🕵️ Full-Spectrum Observability**: Integrated with **LangSmith** for granular tracing of every LLM reasoning step. This allows for deep performance auditing and debugging of agentic state transitions.
*   **🛡️ Human-Gated Remediation**: Implements a strict **Human-in-the-loop (HITL)** architecture. No AI-generated code is added to the system without explicit developer approval, ensuring safety and reliability.

---

## 🏗️ System Architecture

![Sentinel-Zero Pipeline Architecture](https://app.eraser.io/workspace/kSVn0IOp5bZgDmAFQBwl?elements=cGuhCbKPTHcU-F6cSIbJGw)
> *A flow diagram showing the Express Backend communicating with Supabase, dispatching serverless triggers to Modal, and the LangGraph agents reading physical code to update the database.*

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
![LangSmith Telemetry Placeholder](https://smith.langchain.com/public/2e86e1af-d88e-4a7b-a18a-f17be7d24fcc/r)
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
