import { AppShell } from "@/components/AppShell";
import { Bell, BookOpen, Calendar, ChartNoAxesCombined, LayoutDashboard, Settings, Star, User, Users } from "lucide-react";

const navSections = [
  { items: [
    { to: "/learner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/learner/mentors", label: "Find Mentors", icon: Users },
    { to: "/learner/sessions", label: "My Sessions", icon: Calendar },
    { to: "/learner/progress", label: "Progress", icon: ChartNoAxesCombined },
    { to: "/learner/groups", label: "Learning Groups", icon: BookOpen },
    { to: "/learner/reviews", label: "Reviews", icon: Star },
    { to: "/learner/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Account", items: [
    { to: "/learner/profile", label: "My Profile", icon: User },
    { to: "/learner/settings", label: "Settings", icon: Settings },
  ]},
];

export function LearnerLayout() {
  return <AppShell portal="Learner" navSections={navSections} avatarTone="rose" />;
}
