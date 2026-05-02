import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, cls } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { notificationApi } from "@/services/api/notificationApi";

const portalTheme = {
  learner: {
    sidebar: "from-slate-950 via-slate-950 to-rose-950",
    active: "bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-sm shadow-rose-900/30",
    header: "from-rose-50 via-white to-orange-50",
    darkHeader: "dark:from-slate-950 dark:via-slate-950 dark:to-rose-950",
    ring: "bg-rose-600",
  },
  mentor: {
    sidebar: "from-slate-950 via-slate-950 to-emerald-950",
    active: "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-900/30",
    header: "from-emerald-50 via-white to-cyan-50",
    darkHeader: "dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950",
    ring: "bg-emerald-600",
  },
  admin: {
    sidebar: "from-slate-950 via-slate-950 to-blue-950",
    active: "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-sm shadow-blue-900/30",
    header: "from-blue-50 via-white to-indigo-50",
    darkHeader: "dark:from-slate-950 dark:via-slate-950 dark:to-blue-950",
    ring: "bg-blue-600",
  },
};

export function AppShell({ portal = "Learner", navSections = [], avatarTone = "rose" }) {
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")?.[0] || portal;
  const base = portal.toLowerCase();
  const theme = portalTheme[base] || portalTheme.learner;
  const userId = user?.userId;
  const { data: unreadData } = useQuery({
    queryKey: ["notificationUnreadCount", base, userId],
    queryFn: () => (base === "admin" ? notificationApi.getAdminUnreadCount() : notificationApi.getUnreadCount(userId)),
    enabled: base === "admin" || Boolean(userId),
    retry: false,
    refetchInterval: 30000,
  });
  const unreadCount = Number(unreadData?.unreadCount || unreadData?.count || 0);

  const logout = () => {
    clearAuth();
    navigate("/auth/login");
  };

  const sidebar = (
    <aside className={`flex h-full w-64 flex-col border-r border-white/10 bg-gradient-to-b ${theme.sidebar} text-white`}>
      <div className="border-b border-white/10 px-5 py-5">
        <Link to={`/${base}/dashboard`} className="text-2xl font-black tracking-normal">
          <span className="text-white">Skill</span><span className="text-orange-500">Sync</span>
        </Link>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{portal} Portal</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label || "main"} className="mb-5">
            {section.label && <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{section.label}</p>}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cls(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold transition",
                    isActive 
                      ? theme.active
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-2">
          <Avatar name={user?.name || firstName} tone={avatarTone} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">{user?.name || firstName}</p>
            <p className="truncate text-xs font-semibold text-slate-400">{user?.email || `${base}@skillsync.dev`}</p>
          </div>
        </div>
        <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-rose-200 transition hover:bg-white/10 hover:text-white">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className={`sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-gradient-to-r ${theme.header} ${theme.darkHeader} px-4 backdrop-blur transition-colors duration-300 sm:px-6 dark:border-slate-800`}>
          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden dark:border-slate-800 dark:text-slate-400" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><span className={`h-2 w-2 rounded-full ${theme.ring}`} />{portal}</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Welcome, {firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={`/${base}/notifications`} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800" title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link to={`/${base}/settings`} className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800" title="Settings">
              <Settings size={18} />
            </Link>
            <Link to={`/${base}/profile`} title="Profile"><Avatar name={user?.name || firstName} tone={avatarTone} size="sm" /></Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

