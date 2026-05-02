import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const cls = (...classes) => classes.filter(Boolean).join(" ");

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight text-slate-950 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const variants = {
    primary: "bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:bg-rose-700 focus-visible:ring-rose-200",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200",
    danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 focus-visible:ring-rose-200 dark:bg-slate-900 dark:border-rose-900/50 dark:hover:bg-rose-950/20",
    dark: "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
  };
  const sizes = { sm: "h-9 px-3 text-xs", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-sm" };
  return (
    <button
      className={cls("inline-flex items-center justify-center gap-2 rounded-lg font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <section className={cls("rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900", className)}>{children}</section>;
}

export function StatCard({ icon: Icon, label, value, helper, tone = "rose" }) {
  const tones = {
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">{value}</p>
          {helper && <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{helper}</p>}
        </div>
        <div className={cls("flex h-11 w-11 items-center justify-center rounded-xl transition-colors", tones[tone])}>{Icon && <Icon size={21} />}</div>
      </div>
    </Card>
  );
}

export function Avatar({ name, tone = "rose", size = "md" }) {
  const initials = (name || "SkillSync").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const tones = {
    rose: "from-rose-600 to-orange-500",
    blue: "from-blue-600 to-cyan-500",
    emerald: "from-emerald-600 to-teal-500",
    violet: "from-violet-600 to-fuchsia-500",
    amber: "from-amber-500 to-orange-600",
  };
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" };
  return <div className={cls("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-white", tones[tone], sizes[size])}>{initials}</div>;
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  };
  return <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors", tones[tone])}>{children}</span>;
}

export function StatusBadge({ status }) {
  const value = String(status || "Pending").toLowerCase();
  if (value.includes("accept") || value.includes("complete") || value.includes("join") || value.includes("approve")) return <Badge tone="emerald">{status}</Badge>;
  if (value.includes("decline") || value.includes("reject") || value.includes("cancel")) return <Badge tone="rose">{status}</Badge>;
  if (value.includes("progress") || value.includes("requested")) return <Badge tone="blue">{status}</Badge>;
  return <Badge tone="orange">{status}</Badge>;
}

export function EmptyState({ icon: Icon = Clock, title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center transition-colors dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Icon size={22} /></div>
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ label, value, tone = "rose" }) {
  const colors = { rose: "bg-rose-600", orange: "bg-orange-500", emerald: "bg-emerald-600", blue: "bg-blue-600" };
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300"><span>{label}</span><span>{value}%</span></div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800"><div className={cls("h-full rounded-full", colors[tone])} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function ToastIcon({ type }) {
  if (type === "success") return <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={18} />;
  if (type === "error") return <XCircle className="text-rose-600 dark:text-rose-400" size={18} />;
  return <Clock className="text-blue-600 dark:text-blue-400" size={18} />;
}

