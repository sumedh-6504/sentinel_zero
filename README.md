# 🛡️ Sentinel-Zero: Agentic AI Security Analyst

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Modal](https://img.shields.io/badge/Modal-000000?style=for-the-badge&logo=serverless&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![LangGraph](https://img.shields.io/badge/LangGraph-FF4F00?style=for-the-badge&logo=langchain&logoColor=white)](#)
[![Nebius AI](https://img.shields.io/badge/Nebius%20AI-04F0FF?style=for-the-badge)](#)

Sentinel-Zero is a **fully autonomous, agentic AI security pipeline** (Backend MVP) designed for automated vulnerability detection and remediation. By combining state-machine-driven agents (LangGraph) with elastic serverless compute (Modal), Sentinel-Zero moves beyond basic scanning by generating and deploying production-ready code patches via GitHub Pull Requests.

---

## ✨ Key Features

*   **⚡ Ephemeral Source-Code Ingestion**: Efficiently clones targeted GitHub repositories into isolated, serverless environments using **Modal Shared Volumes**—bypassing traditional container instantiation overhead.

*   **🧠 Stateful Agentic Orchestration**: Leverages **LangGraph** to manage a complex, multi-step state machine. Our agents don't just "predict"; they reason through codebases, manage scan states, and iteratively refine findings.

*   **🔍 High-Precision Vulnerability Detection**: Uses a fine-tuned **Llama-3.3-70B** model on **Nebius AI** with strict schema-enforced analysis to eliminate hallucinations and prioritize real-world exploit vectors like SQLi and DOM-XSS.

*   **🚀 Autonomous Remediation (Phase 5)**: The "End-to-End" loop. Once a fix is verified, the agent uses **Octokit** to autonomously fork the target repository, create a dedicated security branch, commit the patch, and open a Pull Request (PR) against the upstream repository.

*   **🕵️ Full-Spectrum Observability**: Integrated with **LangSmith** for granular tracing of every LLM reasoning step. Every Pull Request includes a link to the unique AI reasoning trace, providing developers with full transparency on *why* a fix was generated.

*   **🛡️ Human-Gated Remediation**: Implements a strict **Human-in-the-loop (HITL)** architecture. No AI-generated code is added to the system without explicit developer approval, ensuring safety and reliability.

---

## 🏗️ System Architecture

https://app.eraser.io/workspace/kSVn0IOp5bZgDmAFQBwl?elements=cGuhCbKPTHcU-F6cSIbJGw
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
https://smith.langchain.com/public/2e86e1af-d88e-4a7b-a18a-f17be7d24fcc/r
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
- [ ] **Interactive Frontend Dashboard**: Complete the React/Next.js "Control Center" for real-time scan visualization and one-click remediation approval.
- [ ] **AST Parsing**: Move beyond Regex/Text splitting and implement precise Abstract Syntax Tree (AST) parsing for targeted line-by-line remediation.
- [ ] **GitHub Webhook Sync**: Listen for PR merges to automatically close vulnerabilities in the database.

---
*Built by Sumedh-6504. Designed to show the power of Serverless Stateful Agents.*
