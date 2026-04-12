"use client";

import { useState } from "react";
import { SentinelClient } from "@/lib/api";
import { 
  Search, 
  Terminal as TerminalIcon, 
  Loader2, 
  ShieldCheck, 
  ChevronRight,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setStatus(["[SYSTEM] Initializing Agent Layer...", "[SYSTEM] Connecting to Modal Serverless Infrastructure..."]);

    try {
      // Small delay for effect
      await new Promise(r => setTimeout(r, 1000));
      setStatus(prev => [...prev, `[INFO] Targeting: ${url}`]);
      
      const repoName = url.split("github.com/")[1]?.split("/").slice(0, 2).join("/") || "generic-repo";
      
      const res = await SentinelClient.triggerScan(url, repoName);
      
      setStatus(prev => [...prev, `[SUCCESS] Job created: ${res.id}`, "[INFO] Modal Webhook dispatched. Scan in progress..."]);
    } catch (err: any) {
      setStatus(prev => [...prev, `[ERROR] Failed to trigger scan: ${err.message}`]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 gradient-text">
          Scan Ingestion Center
        </h1>
        <p className="text-slate-400 text-lg">
          Deploy Sentinel-Zero agents to any public GitHub repository.
        </p>
      </header>

      {/* Input Section */}
      <section className="glass p-10 rounded-3xl border border-white/10 shadow-2xl">
        <form onSubmit={handleScan} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <GitBranch className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
          
          <button
            type="submit"
            disabled={isScanning}
            className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-2xl transition-all shadow-lg glow-cyan flex items-center justify-center gap-2 group"
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
            )}
            {isScanning ? "Engaging Agents..." : "Initiate Autonomous Scan"}
          </button>
        </form>
      </section>

      {/* Logic Trace Terminal */}
      <section className="bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <TerminalIcon className="w-4 h-4" />
            AGENT_LOGIC_TRACE.log
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
        </div>
        
        <div className="p-6 font-mono text-sm space-y-2 min-h-[300px] max-h-[400px] overflow-y-auto bg-slate-950/50">
          <AnimatePresence>
            {status.map((line, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i}
                className={
                  line.includes("[ERROR]") ? "text-red-400" :
                  line.includes("[SUCCESS]") ? "text-emerald-400" :
                  line.includes("[SYSTEM]") ? "text-cyan-400 font-bold" :
                  "text-slate-400"
                }
              >
                <span className="opacity-30 mr-2">$</span>
                {line}
              </motion.div>
            ))}
          </AnimatePresence>
          {status.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-700 italic pt-20">
              Awaiting target ingestion...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
