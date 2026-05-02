import { Outlet } from "react-router-dom";
import { CalendarCheck, Star, Target, Users } from "lucide-react";

const features = [
  { icon: Target, text: "Find expert mentors matched to your goals" },
  { icon: CalendarCheck, text: "Book 1-on-1 sessions at your convenience" },
  { icon: Users, text: "Join peer learning groups and communities" },
  { icon: Star, text: "Track growth with ratings and reviews" },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#020617_0%,#172554_45%,#7f1d1d_100%)]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(90deg,rgba(244,63,94,0.42),rgba(249,115,22,0.3),rgba(20,184,166,0.26))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(90deg,rgba(14,165,233,0.18),rgba(16,185,129,0.14),rgba(249,115,22,0.12))]" />
        <div className="relative mx-auto max-w-md">
          <h1 className="text-5xl font-black tracking-normal"><span>Skill</span><span className="text-orange-500">Sync</span></h1>
          <p className="mt-3 text-base font-semibold text-slate-200">Peer Learning and Mentor Matching Platform</p>
          <div className="mt-12 space-y-5">
            {features.map((item) => (
              <div key={item.text} className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 text-orange-200 ring-1 ring-white/15"><item.icon size={20} /></div>
                <p className="text-sm font-semibold text-slate-200">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(90deg,rgba(225,29,72,0.12),rgba(14,165,233,0.1),rgba(16,185,129,0.1))]" />
        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
