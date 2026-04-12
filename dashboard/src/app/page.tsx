"use client";

import { useEffect, useState } from "react";
import { 
  SentinelClient, 
  StatSummary, 
  Vulnerability 
} from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import { StatCard } from "@/components/StatCard";
import { 
  ShieldAlert, 
  Bug, 
  CheckCircle2, 
  Globe, 
  ArrowRight 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatSummary | null>(null);
  const [recentVulns, setRecentVulns] = useState<Vulnerability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const loadData = async () => {
    try {
      const [s, v] = await Promise.all([
        SentinelClient.getStats(),
        SentinelClient.listVulnerabilities()
      ]);
      setStats(s);
      setRecentVulns(v.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("dashboard-pulse")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vulnerabilities",
        },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scan_jobs",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Pulse <span className="text-cyan-400">Overview</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Operational telemetry for the Sentinel-Zero agentic network.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Target Repos" 
          value={stats?.repositories || 0} 
          icon={<Globe className="w-6 h-6" />} 
          color="cyan" 
        />
        <StatCard 
          label="Defects Detected" 
          value={stats?.total_vulnerabilities || 0} 
          icon={<Bug className="w-6 h-6" />} 
          color="amber" 
        />
        <StatCard 
          label="Critical Threats" 
          value={stats?.critical || 0} 
          icon={<ShieldAlert className="w-6 h-6" />} 
          color="crimson" 
        />
        <StatCard 
          label="AI Remedied" 
          value={stats?.fixed || 0} 
          icon={<CheckCircle2 className="w-6 h-6" />} 
          color="emerald" 
        />
      </div>

      {/* Recent Feed */}
      <section className="glass rounded-3xl p-8 border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Recent Findings</h2>
          <Link href="/vulnerabilities" className="text-cyan-400 flex items-center gap-2 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentVulns.map((vuln, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={vuln.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  vuln.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">{vuln.issue_type}</h4>
                  <p className="text-sm text-slate-500 font-mono">{vuln.file_path}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  vuln.status === 'open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  vuln.status === 'fix_ready' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {vuln.status}
                </span>
                <Link 
                  href={`/vulnerabilities/${vuln.id}`}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </Link>
              </div>
            </motion.div>
          ))}
          {recentVulns.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No vulnerabilities detected yet. Initiate a scan to begin.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
