"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  GitBranch,
  Globe,
  User,
  Mail, 
  Lock, 
  ShieldCheck, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    // Supabase signup with user_name metadata for the trigger to pick up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: username,
          full_name: username, // Fallback
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      if (data.session) {
        window.location.href = "/";
      } else {
        setMessage("Activation signal sent. Please check your email to verify your terminal credentials.");
        setIsLoading(false);
      }
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/20 glow-cyan mb-2">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            Initialize Account
          </h1>
          <p className="text-slate-400">Join the autonomous security grid.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Operator Alias (Username)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cyber_operator_01"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Email Terminal</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@sentinel.ai"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Access Code (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg glow-cyan flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bootstrap Account"}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-slate-500">Secure Channels</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold"
          >
            <GitBranch className="w-5 h-5" />
            GitHub
          </button>
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold"
          >
            <Globe className="w-5 h-5" />
            Google
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Already an operator? {" "}
          <a href="/login" className="text-cyan-400 hover:underline font-bold">Authorize Here</a>
        </p>
      </motion.div>
    </div>
  );
}
