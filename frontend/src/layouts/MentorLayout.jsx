import { AppShell } from "@/components/AppShell";
import { Bell, BookOpen, Calendar, Clock, LayoutDashboard, Settings, Star, User } from "lucide-react";

const navSections = [
  { items: [
    { to: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/mentor/requests", label: "Session Requests", icon: Calendar },
    { to: "/mentor/groups", label: "My Groups", icon: BookOpen },
    { to: "/mentor/availability", label: "Availability", icon: Clock },
    { to: "/mentor/reviews", label: "Reviews", icon: Star },
    { to: "/mentor/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Account", items: [
    { to: "/mentor/profile", label: "Mentor Profile", icon: User },
    { to: "/mentor/settings", label: "Settings", icon: Settings },
  ]},
];

export function MentorLayout() {
  return <AppShell portal="Mentor" navSections={navSections} avatarTone="emerald" />;
}
