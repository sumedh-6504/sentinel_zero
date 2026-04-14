"use client";

import { useEffect, useState, useCallback } from "react";
import { SentinelClient, Vulnerability } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import { 
  Bug, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye,
  Activity
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const loadVulns = useCallback(async () => {
    try {
      const data = await SentinelClient.listVulnerabilities();
      setVulns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVulns();

    const channel = supabase
      .channel("vulnerabilities-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vulnerabilities" },
        () => loadVulns()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadVulns]);

  const filteredVulns = vulns.filter(v => 
    (v.issue_type || "").toLowerCase().includes(filter.toLowerCase()) ||
    (v.file_path || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Threat <span className="gradient-text">Inventory</span>
          </h1>
          <p className="text-slate-500 font-medium">Real-time surveillance of {vulns.length} identified security vulnerabilities.</p>
        </div>
      </header>

      {/* Severity Pulse HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: vulns.filter(v => v.severity === 'critical').length, color: 'crimson', icon: <AlertCircle className="w-4 h-4" /> },
          { label: 'High Risk', count: vulns.filter(v => v.severity === 'high').length, color: 'amber', icon: <Bug className="w-4 h-4" /> },
          { label: 'Fixed', count: vulns.filter(v => v.status === 'fixed').length, color: 'emerald', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Scanning', count: vulns.length, color: 'cyan', icon: <Activity className="w-4 h-4" /> },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl glass border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{stat.label}</p>
              <p className="text-2xl font-black tabular-nums">{stat.count}</p>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 ${
              stat.color === 'crimson' ? 'text-red-400 group-hover:animate-neon' :
              stat.color === 'amber' ? 'text-amber-400' :
              stat.color === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search target vectors, file paths, or issue types..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 flex items-center gap-2 group transition-all">
          <Filter className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span className="font-bold text-sm">Fine-Tune</span>
        </button>
      </div>

      {/* Tactical Table Section */}
      <section className="glass rounded-[2.5rem] overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 border-b border-white/10">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Environment</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vulnerability Type</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Threat Level</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVulns.map((v, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  key={v.id} 
                  className="hover:bg-cyan-500/[0.03] transition-all group relative"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{v.scan_jobs?.repositories?.full_name || 'N/A'}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{v.file_path}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
                        <Bug className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{v.issue_type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      v.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-neon' :
                      v.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-3 text-xs font-bold uppercase tracking-tighter ${
                      v.status === 'open' ? 'text-amber-400' : 
                      v.status === 'fix_ready' ? 'text-cyan-400' :
                      'text-emerald-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        v.status === 'open' ? 'bg-amber-400 animate-pulse glow-amber' : 
                        v.status === 'fix_ready' ? 'bg-cyan-400 animate-neon glow-cyan' :
                        'bg-emerald-400 glow-emerald'
                      }`} />
                      {v.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      href={`/vulnerabilities/${v.id}`}
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 px-4 py-2 rounded-xl transition-all border border-cyan-400/20 hover:border-cyan-400"
                    >
                      Audit <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isLoading && (
          <div className="p-20 text-center text-slate-500 italic font-medium animate-pulse">
            Synchronizing with Neural Scan Nodes...
          </div>
        )}
        
        {!isLoading && filteredVulns.length === 0 && (
          <div className="p-20 text-center text-slate-500 italic font-medium">
            Scan complete. No matching threat vectors detected.
          </div>
        )}
      </section>
    </div>
  );
}
