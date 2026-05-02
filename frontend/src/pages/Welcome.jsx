import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/services/api/client";
import { userApi } from "@/services/api/userApi";

const portalCards = [
  {
    role: "ROLE_LEARNER",
    title: "Learner Portal",
    description: "Find mentors, book sessions, join groups, and track your learning progress.",
    to: "/learner/dashboard",
    icon: GraduationCap,
    accent: "from-rose-500 to-orange-500",
  },
  {
    role: "ROLE_MENTOR",
    title: "Mentor Portal",
    description: "Manage learner requests, availability, groups, reviews, and mentoring activity.",
    to: "/mentor/dashboard",
    icon: UsersRound,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    role: "ROLE_ADMIN",
    title: "Admin Portal",
    description: "Review mentor approvals, sessions, reports, platform users, and audit records.",
    to: "/admin/dashboard",
    icon: ShieldCheck,
    accent: "from-blue-500 to-indigo-500",
  },
];

const highlights = [
  {
    title: "Personal mentorship",
    text: "Learners connect with approved mentors based on skills, goals, and session needs.",
    icon: GraduationCap,
  },
  {
    title: "Guided learning",
    text: "Sessions, groups, reviews, and notifications stay connected to one account.",
    icon: BookOpenCheck,
  },
  {
    title: "Trusted platform",
    text: "Admins review mentor profiles and keep platform activity visible and organized.",
    icon: ShieldCheck,
  },
];

const rolePriority = ["ROLE_ADMIN", "ROLE_MENTOR", "ROLE_LEARNER"];

const roleContent = {
  ROLE_LEARNER: {
    label: "Learner workspace",
    gradient: "from-rose-500 via-orange-500 to-amber-400",
  },
  ROLE_MENTOR: {
    label: "Mentor workspace",
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
  },
  ROLE_ADMIN: {
    label: "Admin workspace",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
  },
};

export default function WelcomePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const { data: freshUser } = useQuery({
    queryKey: ["welcomeAuthUser", user?.userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/auth/users/${user.userId}`);
      try {
        const profile = await userApi.resolveByAuthUserId(user.userId);
        const mergedUser = {
          ...data,
          name: profile?.fullName || profile?.name || data.name,
          email: profile?.email || data.email,
        };
        updateUser({ name: mergedUser.name, email: mergedUser.email, roles: mergedUser.roles });
        return mergedUser;
      } catch (error) {
        if (error?.response?.status !== 404) throw error;
        updateUser({ name: data.name, email: data.email, roles: data.roles });
        return data;
      }
    },
    enabled: Boolean(user?.userId),
    staleTime: 0,
  });

  const displayUser = freshUser ? { ...user, ...freshUser } : user;
  const roles = displayUser?.roles || [];
  const availablePortals = portalCards.filter((portal) => roles.includes(portal.role));
  const primaryRole = rolePriority.find((role) => roles.includes(role)) || "ROLE_LEARNER";
  const activeContent = roleContent[primaryRole];
  const userName = displayUser?.name || "SkillSync User";
  const primaryPortal = availablePortals[0];

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative min-h-screen px-5 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#122033_46%,#312e81_100%)]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(90deg,rgba(244,63,94,0.35),rgba(249,115,22,0.26),rgba(20,184,166,0.18),rgba(37,99,235,0.20))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${activeContent.gradient} shadow-lg shadow-black/30`}>
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-xl font-black tracking-normal">Skill<span className="text-orange-300">Sync</span></p>
                <p className="text-xs font-black uppercase tracking-wide text-slate-300">{activeContent.label}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 backdrop-blur">
              Signed in as <span className="text-orange-200">{displayUser?.email || "your account"}</span>
            </div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-100 backdrop-blur">
                <CheckCircle2 size={15} />
                Welcome to SkillSync
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Learn better with the right mentor, at the right time.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-200 sm:text-lg">
                Hi {userName}, SkillSync brings learners and mentors into one trusted space for skill discovery, guided sessions, peer groups, feedback, and progress tracking.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryPortal ? (
                  <Link
                    to={primaryPortal.to}
                    className={`inline-flex items-center gap-3 rounded-xl bg-gradient-to-r ${primaryPortal.accent} px-6 py-4 text-base font-black text-white shadow-lg shadow-black/25 transition hover:-translate-y-0.5`}
                  >
                    Continue to {primaryPortal.title}
                    <ArrowRight size={20} />
                  </Link>
                ) : (
                  <div className="rounded-xl border border-rose-200/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-100">
                    No approved workspace role was found for this account.
                  </div>
                )}
                <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-black text-slate-100">
                  {activeContent.label}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-wide text-orange-200">Our Mission</p>
              <h2 className="mt-2 text-3xl font-black">Make skill learning personal, practical, and connected.</h2>
              <p className="mt-4 text-base font-semibold leading-8 text-slate-200">
                SkillSync helps learners find guidance, mentors manage their teaching journey, and admins maintain a trusted learning platform.
              </p>
              <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/55 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Our Vision</p>
                <p className="mt-2 text-lg font-extrabold leading-7">
                  A peer learning community where every learner can reach the right mentor and every mentor can support real growth.
                </p>
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200">What SkillSync Offers</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-slate-950/55 p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${activeContent.gradient}`}>
                    <item.icon size={21} />
                  </div>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
