"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  History, 
  Settings,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "Scan Center", icon: Search, href: "/scan" },
  { name: "Vulnerabilities", icon: AlertTriangle, href: "/vulnerabilities" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

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

      {/* User Logic */}
      <div className="p-4 space-y-2 border-t border-white/5 mx-2 mb-4">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/5 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              {user.user_metadata.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full rounded-full" />
              ) : (
                <UserIcon className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-100 truncate">{user.user_metadata.user_name || user.email?.split('@')[0]}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Operator</span>
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Terminate Session</span>
        </button>
        
        <button className="flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-xl transition-all">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
