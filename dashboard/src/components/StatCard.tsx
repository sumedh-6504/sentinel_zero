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
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 glow-cyan",
  crimson: "text-red-400 bg-red-500/10 border-red-500/20 glow-crimson",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function StatCard({ label, value, icon, color = "cyan" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border glass flex items-center justify-between ${colorMap[color]}`}
    >
      <div>
        <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-white/5`}>
        {icon}
      </div>
    </motion.div>
  );
}
