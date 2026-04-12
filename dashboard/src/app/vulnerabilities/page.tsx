"use client";

import { useEffect, useState } from "react";
import { SentinelClient, Vulnerability } from "@/lib/api";
import { 
  Bug, 
  AlertCircle, 
  Shield, 
  Search, 
  Filter, 
  Eye,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await SentinelClient.listVulnerabilities();
        setVulns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredVulns = vulns.filter(v => 
    (v.issue_type || "").toLowerCase().includes(filter.toLowerCase()) ||
    (v.file_path || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Vulnerability <span className="text-cyan-400">Inventory</span>
          </h1>
          <p className="text-slate-400">Total of {vulns.length} actionable security findings identified.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by type or file path..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none"
          />
        </div>
        <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <span>Filters</span>
        </button>
      </div>

      {/* Table Section */}
      <section className="glass rounded-3xl overflow-hidden border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Target</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vulnerability</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Severity</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredVulns.map((v, i) => (
              <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                key={v.id} 
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">{v.scan_jobs?.repositories?.full_name || 'N/A'}</span>
                    <span className="text-xs font-mono text-slate-500 truncate max-w-xs">{v.file_path}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-slate-400" />
                    <span>{v.issue_type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    v.severity === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                    v.severity === 'high' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' :
                    'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                  }`}>
                    {v.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    v.status === 'open' ? 'text-amber-400' : 
                    v.status === 'fix_ready' ? 'text-cyan-400' :
                    'text-emerald-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      v.status === 'open' ? 'bg-amber-400' : 
                      v.status === 'fix_ready' ? 'bg-cyan-400' :
                      'bg-emerald-400'
                    }`} />
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/vulnerabilities/${v.id}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:bg-cyan-400/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Review <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {isLoading && (
          <div className="p-20 text-center text-slate-500 italic">
            Scanning Database...
          </div>
        )}
        
        {!isLoading && filteredVulns.length === 0 && (
          <div className="p-20 text-center text-slate-500 italic">
            No vulnerabilities match your criteria.
          </div>
        )}
      </section>
    </div>
  );
}
