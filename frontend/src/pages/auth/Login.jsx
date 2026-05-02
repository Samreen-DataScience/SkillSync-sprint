import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/services/api/auth-api";
import { userApi } from "@/services/api/userApi";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const authUser = await authApi.login(payload);
      try {
        const profile = await userApi.getByAuthUserIdWithToken(authUser.userId, authUser.token);
        return {
          ...authUser,
          name: profile?.fullName || profile?.name || authUser.name,
          email: profile?.email || authUser.email,
        };
      } catch (error) {
        const status = error?.response?.status;
        if (![401, 403, 404, 405].includes(status)) throw error;
        return authUser;
      }
    },
    onSuccess: (data) => {
      const user = { userId: data.userId, name: data.name, email: data.email, roles: data.roles };
      setAuth(data.token, user);
      toast.success("Welcome back to SkillSync");
      navigate("/welcome");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Login failed. Check your email and password.";
      toast.error(msg);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    loginMutation.mutate({ email, password, remember });
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-lg shadow-rose-500/20">
          <LockKeyhole size={22} />
        </div>
        <h2 className="text-3xl font-black text-slate-950">Welcome back</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Sign in once and choose your approved SkillSync workspace.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Email Address</label>
          <input className={`h-11 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-slate-900 ${errors.email ? "border-rose-500" : "border-slate-200"}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Password</label>
          <div className="relative">
            <input className={`h-11 w-full rounded-lg border bg-white px-4 pr-11 text-sm font-semibold text-slate-900 ${errors.password ? "border-rose-500" : "border-slate-200"}`} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Show password">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
          {errors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between text-xs font-bold">
          <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-rose-600" /> Remember me</label>
          <button type="button" onClick={() => toast.info("Password reset link sent if this email exists.")} className="text-rose-600 hover:text-rose-700">Forgot Password?</button>
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>{loginMutation.isPending && <Loader2 size={16} className="animate-spin" />} Sign In</Button>
      </form>
      <p className="mt-6 text-center text-sm font-medium text-slate-500">Don't have an account? <Link to="/auth/register" className="font-extrabold text-rose-600">Create one free</Link></p>
    </div>
  );
}
