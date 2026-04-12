"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  History, 
  Settings 
} from "lucide-react";

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "Scan Center", icon: Search, href: "/scan" },
  { name: "Vulnerabilities", icon: AlertTriangle, href: "/vulnerabilities" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen glass border-r border-white/10 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 glow-cyan">
          <Shield className="w-6 h-6 text-cyan-400" />
        </div>
        <span className="text-xl font-bold tracking-tight gradient-text">
          Sentinel-Zero
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "group-hover:text-cyan-400"}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 mx-2 mb-4">
        <button className="flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
