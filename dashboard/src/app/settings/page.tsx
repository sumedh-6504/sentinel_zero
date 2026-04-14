"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { 
  User as UserIcon, 
  Shield, 
  GitBranch, 
  Mail, 
  Globe, 
  Key, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Smartphone,
  CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 blur-lg bg-cyan-500/20 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">System Settings</h1>
        <p className="text-slate-400">Manage your identity, integration parameters, and security protocols.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Profile Section */}
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserIcon className="w-32 h-32 text-cyan-400" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  {user?.user_metadata.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-cyan-400" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-xl border-4 border-slate-950 shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100 mb-1">
                  {user?.user_metadata.user_name || user?.user_metadata.full_name || "Operator"}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 uppercase tracking-widest">
                    Level 1 Clearance
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Smartphone className="w-4 h-4" />
                    Device Authenticated
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-slate-300">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Account UUID</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-slate-500 font-mono text-xs">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="truncate">{user?.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/10">
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Connected Integrations
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <GitBranch className="w-6 h-6 text-slate-100" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">GitHub</p>
                    <p className="text-xs text-slate-500">Source code remediation pipeline</p>
                  </div>
                </div>
                {user?.app_metadata.provider === 'github' ? (
                  <span className="flex items-center gap-2 text-green-400 text-xs font-bold px-3 py-1 bg-green-400/10 rounded-full border border-green-400/20 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors">
                    Link Account <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Google</p>
                    <p className="text-xs text-slate-500">SSO & Identity management</p>
                  </div>
                </div>
                {user?.app_metadata.provider === 'google' ? (
                  <span className="flex items-center gap-2 text-green-400 text-xs font-bold px-3 py-1 bg-green-400/10 rounded-full border border-green-400/20 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors">
                    Link Account <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Actions */}
        <motion.div variants={item} className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Environment</h3>
            
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">API Endpoint</p>
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <span className="text-sm text-slate-300 truncate font-mono">http://localhost:3001</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Region</p>
                <p className="text-sm text-slate-300">Local Instance (Dev)</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Actions</h3>
             
             <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-slate-100 font-medium group">
               Change Password
               <Key className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
             </button>

             <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-slate-100 font-medium group text-left">
               Request Data Export
               <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
             </button>

             <div className="pt-4 mt-4 border-t border-white/10">
               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-red-400 font-bold group"
               >
                 Terminate Session
                 <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
          </div>
          
          <div className="p-4 flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-slate-600 justify-center">
            <Shield className="w-3 h-3" />
            Sentinel-Zero v0.1.0-alpha
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
