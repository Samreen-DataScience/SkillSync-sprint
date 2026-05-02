import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GraduationCap, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { authApi } from "@/services/api/auth-api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ROLE_LEARNER" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created. Please log in.");
      navigate("/auth/login");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Backend registration failed. Check backend services and try again.";
      toast.error(msg);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    registerMutation.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      roles: [form.role],
    });
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
          <UserPlus size={22} />
        </div>
        <h2 className="text-3xl font-black text-slate-950">Create account</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">Join SkillSync as a learner or mentor.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Full Name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} className={`h-11 w-full rounded-lg border px-4 text-sm font-semibold ${errors.name ? "border-rose-500" : "border-slate-200"}`} placeholder="Rahul Sharma" />
          {errors.name && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Email Address</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={`h-11 w-full rounded-lg border px-4 text-sm font-semibold ${errors.email ? "border-rose-500" : "border-slate-200"}`} placeholder="you@example.com" />
          {errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Password</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className={`h-11 w-full rounded-lg border px-4 text-sm font-semibold ${errors.password ? "border-rose-500" : "border-slate-200"}`} placeholder="Minimum 8 characters" />
          {errors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.password}</p>}
        </div>
        <div>
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Create account as</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => update("role", "ROLE_LEARNER")} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border text-sm font-extrabold transition ${form.role === "ROLE_LEARNER" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <GraduationCap size={17} /> Learner
            </button>
            <button type="button" onClick={() => update("role", "ROLE_MENTOR")} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border text-sm font-extrabold transition ${form.role === "ROLE_MENTOR" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <UsersRound size={17} /> Mentor
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating..." : "Create Account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm font-medium text-slate-500">Already have an account? <Link to="/auth/login" className="font-extrabold text-rose-600">Sign in</Link></p>
    </div>
  );
}
