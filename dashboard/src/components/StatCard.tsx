"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "cyan" | "crimson" | "amber" | "emerald";
}

const colorMap = {
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  crimson: "text-red-400 bg-red-500/10 border-red-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function StatCard({ label, value, icon, color = "cyan" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`p-6 rounded-3xl border glass glass-hover flex items-center justify-between group transition-all duration-300 ${colorMap[color]}`}
    >
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 group-hover:opacity-100 transition-opacity">
          {label}
        </p>
        <h3 className="text-4xl font-extrabold tracking-tighter tabular-nums drop-shadow-sm">
          {value}
        </h3>
      </div>
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all ${color === 'cyan' ? 'animate-neon' : ''}`}>
        {icon}
      </div>

      {/* Subtle Glow Backdrop */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity pointer-events-none ${
        color === 'cyan' ? 'bg-cyan-400 blur-2xl' : 
        color === 'crimson' ? 'bg-red-400 blur-2xl' : 
        color === 'emerald' ? 'bg-emerald-400 blur-2xl' : 
        'bg-amber-400 blur-2xl'
      }`} />
    </motion.div>
  );
}
