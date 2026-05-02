import { AppShell } from "@/components/AppShell";
import { BarChart3, Bell, Calendar, LayoutDashboard, Settings, ShieldCheck, Sparkles, Star, Users } from "lucide-react";

const navSections = [
  { items: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Manage Users", icon: Users },
    { to: "/admin/sessions", label: "All Sessions", icon: Calendar },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/reviews", label: "Reviews", icon: Star },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Platform", items: [
    { to: "/admin/skills", label: "Skills", icon: Sparkles },
    { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
  ]},
];

export function AdminLayout() {
  return <AppShell portal="Admin" navSections={navSections} avatarTone="blue" />;
}
