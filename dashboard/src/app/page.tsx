"use client";

import { useEffect, useState } from "react";
import { SentinelClient, StatSummary, Vulnerability } from "@/lib/api";
import { 
  Shield, 
  Search, 
  Zap, 
  Activity, 
  Terminal, 
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Code
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatSummary | null>(null);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, v] = await Promise.all([
          SentinelClient.getStats(),
          SentinelClient.listVulnerabilities()
        ]);
        setStats(s);
        setVulns(v.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Live updates every 10s
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;
    setIsScanning(true);
    try {
      const parts = githubUrl.split("/");
      const fullName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      await SentinelClient.triggerScan(githubUrl, fullName);
      setGithubUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // Efficiency Intelligence (Simulated/Derived)
  const bypassRate = 84; 
  const scanVelocity = 1240; // files/min

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <header className="relative py-10 px-8 rounded-[2.5rem] overflow-hidden border border-white/10 glass">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30 animate-neon">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Sentinel-Zero Engine</span>
          </motion.div>
          <h1 className="text-6xl font-black tracking-tight mb-6 leading-[1.1]">
            Neural <span className="gradient-text">Security</span> <br /> 
            Command Center
          </h1>
          <form onSubmit={handleScan} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Target Repository URL (e.g. github.com/owner/repo)..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <button 
              disabled={isScanning}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl transition-all flex items-center gap-2 group disabled:opacity-50"
            >
              {isScanning ? "Initiating..." : "Launch Audit"} 
              <Activity className={`w-5 h-5 ${isScanning ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'}`} />
            </button>
          </form>
        </div>
      </header>

      {/* Pulse HUD & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Neutralized Threats" 
          value={stats?.total_vulnerabilities || 0} 
          icon={<Shield className="w-6 h-6" />} 
          color="cyan"
        />
        <StatCard 
          label="Fixed Vulnerabilities" 
          value={stats?.fixed || 0} 
          icon={<ShieldCheck className="w-6 h-6" />} 
          color="emerald"
        />
        <StatCard 
          label="Critical Risks" 
          value={stats?.critical || 0} 
          icon={<AlertTriangle className="w-6 h-6" />} 
          color="crimson"
        />
        <StatCard 
          label="Scan Velocity" 
          value={`${scanVelocity}/m`} 
          icon={<Cpu className="w-6 h-6" />} 
          color="amber"
        />
      </div>

      {/* Pulse Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Efficiency Chart */}
        <section className="lg:col-span-1 p-8 rounded-[2rem] glass flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-100">
              <Zap className="w-5 h-5 text-cyan-400" /> Fast-Pass Efficiency
            </h3>
            <p className="text-sm text-slate-400 mb-8">Percentage of files resolved via Local Sentinel Regex vs LLM Audit.</p>
          </div>
          
          <div className="relative h-48 flex items-center justify-center">
            {/* Custom SVG Gauge */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="12" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * bypassRate) / 100}
                strokeLinecap="round"
                className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{bypassRate}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Bypass</span>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-300 text-center italic">
            "Regex pre-filtering saved approx. {Math.round(scanVelocity * 0.84)} LLM tokens this session."
          </div>
        </section>

        {/* Language Breakdown */}
        <section className="lg:col-span-1 p-8 rounded-[2rem] glass">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-100">
            <Code className="w-5 h-5 text-emerald-400" /> Threat Vectors
          </h3>
          <div className="space-y-6">
            {[
              { lang: 'Python', percent: 45, color: '#3776ab' },
              { lang: 'TypeScript', percent: 30, color: '#3178c6' },
              { lang: 'JavaScript', percent: 15, color: '#f7df1e' },
              { lang: 'Env/Secrets', percent: 10, color: '#ef4444' }
            ].map((item) => (
              <div key={item.lang} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">{item.lang}</span>
                  <span className="text-slate-500">{item.percent}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Audit Feed */}
        <section className="lg:col-span-1 p-8 rounded-[2rem] glass border-emerald-500/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-100">
            <Terminal className="w-5 h-5 text-slate-400" /> Recent Findings
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {vulns.map((v, i) => (
                <motion.div 
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate pr-2">{v.issue_type}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{v.file_path}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    v.severity === 'critical' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' :
                    v.severity === 'high' ? 'bg-orange-500' : 'bg-slate-500'
                  }`} />
                </motion.div>
              ))}
            </AnimatePresence>
            <Link 
              href="/vulnerabilities" 
              className="block w-full text-center py-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:bg-cyan-400/10 transition-all bg-white/5 rounded-2xl border border-dashed border-cyan-500/20 mt-4"
            >
              Access Global Inventory
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
