import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Star,
  User,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const navSections = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/mentors",   label: "Find Mentors", icon: Users },
      { to: "/sessions",  label: "My Sessions", icon: Calendar },
      { to: "/groups",    label: "Learning Groups", icon: BookOpen },
      { to: "/reviews",   label: "Reviews", icon: Star },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { to: "/profile",       label: "My Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings",      label: "Settings", icon: Settings },
    ],
  },
];

export function AppLayout() {
  const { user, clearAuth, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const isMentor = hasRole(["ROLE_MENTOR"]);
  const isAdmin = hasRole(["ROLE_ADMIN"]);

  const handleLogout = () => {
    clearAuth();
    navigate("/auth/login");
  };

  // Build initials from name
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex min-h-screen" style={{ background: "#f4f6fa" }}>
      {/* ─── Sidebar ─── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col sticky top-0 h-screen"
        style={{ background: "#0f0f23" }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-2xl font-black">
            <span className="text-white">Skill</span>
            <span style={{ color: "#f97316" }}>Sync</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "pt-4" : ""}>
              {section.label && (
                <p
                  className="text-xs font-semibold px-3 mb-2 tracking-widest"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {section.label}
                </p>
              )}
              {section.items
                .filter(item => item.to === "/mentors" ? !isMentor && !isAdmin : true)
                .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Admin link */}
          {isAdmin && (
            <div className="pt-4">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <ShieldCheck size={16} />
                Admin Panel
              </NavLink>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{user?.name ?? "User"}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {user?.roles?.[0]?.replace("ROLE_", "") ?? "Learner"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left"
            style={{ color: "rgba(255,100,100,0.8)" }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200"
          style={{ background: "#fff" }}
        >
          <div />
          <div className="flex items-center gap-4">
            {/* Bell */}
            <Link to="/notifications" className="relative cursor-pointer block">
              <Bell size={20} className="text-slate-500" />
              <span className="notif-dot">3</span>
            </Link>
            {/* Avatar */}
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-md transition-shadow"
              style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
