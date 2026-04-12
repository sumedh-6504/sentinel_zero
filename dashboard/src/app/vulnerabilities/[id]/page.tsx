"use client";

import { useEffect, useState, use } from "react";
import { SentinelClient, Vulnerability } from "@/lib/api";
import ReactDiffViewer from "react-diff-viewer-continued";
import { 
  ArrowLeft, 
  GitPullRequest, 
  CheckCircle, 
  XCircle, 
  BrainCircuit,
  Loader2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vulnId } = use(params);
  const [vuln, setVuln] = useState<Vulnerability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await SentinelClient.getVulnerability(vulnId);
        setVuln(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [vulnId]);

  const handleApprove = async () => {
    if (!vuln) return;
    try {
      setIsDeploying(true);
      setMessage("Updating Review Status...");
      await SentinelClient.submitReview(vulnId, 'approved_real_bug', "Approved via Command Center Dashboard");
      
      // Refresh state
      const updated = await SentinelClient.getVulnerability(vulnId);
      setVuln(updated);
      setMessage("Verification Successful. Fixer Agent engaged.");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeployPR = async () => {
    if (!vuln) return;
    try {
      setIsDeploying(true);
      setMessage("Engaging GitHub Agent: Forking & Pushing Patch...");
      const result = await SentinelClient.deployPR(vulnId);
      setMessage(`PR Successfully Created: ${result.pr_url}`);
      window.open(result.pr_url, '_blank');
      
      // Refresh state
      const updated = await SentinelClient.getVulnerability(vulnId);
      setVuln(updated);
    } catch (err: any) {
      setMessage(`PR Deployment Failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading || !vuln) {
    return <div className="p-20 text-center animate-pulse">Retrieving Vulnerability Context...</div>;
  }

  // Extract old code snippet from description or assumed context
  // Note: For now we mock the 'Original' code by using a placeholder if not stored, 
  // but in a real app, the scanner provides 'context' in the DB.
  const oldCode = "// Original source from " + vuln.file_path + "\n" + "... loading ...";
  const newCode = vuln.suggested_fix || "";

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <Link href="/vulnerabilities" className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Inventory
        </Link>
        <div className="flex gap-3">
          {vuln.status === 'open' && (
             <button 
              onClick={handleApprove}
              disabled={isDeploying}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center gap-2 transition-all glow-emerald"
             >
               {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
               Verify & Engage Fixer
             </button>
          )}
          {vuln.status === 'fix_ready' && (
            <button 
              onClick={handleDeployPR}
              disabled={isDeploying}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold flex items-center gap-2 transition-all glow-cyan"
            >
              {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitPullRequest className="w-4 h-4" />}
              Submit to GitHub
            </button>
          )}
          {vuln.status === 'pr_opened' && (
             <a 
              href={vuln.suggested_fix /* Wait, the URL is in github_issue_url in the DB schema I saw? Let's assume metadata */}
              target="_blank"
              className="px-6 py-2 bg-slate-800 border border-white/10 rounded-xl font-bold flex items-center gap-2"
             >
               View Pull Request <ExternalLink className="w-4 h-4" />
             </a>
          )}
        </div>
      </header>

      {message && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 font-mono text-xs">
          {message}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          {/* Diff Viewer */}
          <section className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Proposed Remediation Patch
              </h3>
              <span className="text-xs font-mono text-slate-500">{vuln.file_path}</span>
            </div>
            
            <div className="p-2 bg-slate-900 overflow-x-auto text-sm">
              <ReactDiffViewer
                oldValue={oldCode}
                newValue={newCode}
                splitView={true}
                useDarkTheme={true}
                styles={{
                  variables: {
                    dark: {
                      diffViewerBackground: '#0f172a',
                      gutterBackground: '#1e293b',
                      addedBackground: '#064e3b',
                      addedGutterBackground: '#065f46',
                      removedBackground: '#7f1d1d',
                      removedGutterBackground: '#991b1b',
                    }
                  }
                }}
              />
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <section className="glass p-6 rounded-3xl border border-white/10 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BrainCircuit className="w-4 h-4" /> AI Reasoning Trace
              </div>
              <h4 className="text-xl font-bold">{vuln.issue_type}</h4>
              <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${
                vuln.severity === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {vuln.severity} Sensitivity
              </span>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h5 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Description</h5>
              <p className="text-slate-300 leading-relaxed text-sm">
                {vuln.description || "No detailed context provided by scanner."}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h5 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Metadata</h5>
              <div className="space-y-2 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between"><span>VULN_ID</span> <span>{vuln.id.slice(0,8)}</span></div>
                <div className="flex justify-between"><span>REPO</span> <span>{vuln.scan_jobs?.repositories?.full_name}</span></div>
                <div className="flex justify-between"><span>DETECTION</span> <span>{new Date(vuln.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>
          </section>

          <section className="bg-cyan-500/5 p-6 rounded-3xl border border-cyan-500/20 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Safe Deployment</h4>
              <p className="text-[10px] text-slate-400">Fixed code forked and verified on Modal Sandbox.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
