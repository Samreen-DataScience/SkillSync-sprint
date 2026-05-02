import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, Button, Card, PageHeader } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";
import { userApi } from "@/services/api/userApi";
import { authApi } from "@/services/api/auth-api";
import { useTheme } from "@/app/providers/theme-provider";

export function ProfilePage({ role = "Learner", tone = "rose" }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const userId = user?.userId;

  const { data } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      try {
        return await userApi.getByAuthUserId(userId);
      } catch (error) {
        if (error?.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(userId),
  });

  const [name, setName] = useState(user?.name || `${role} User`);
  const [email, setEmail] = useState(user?.email || `${role.toLowerCase()}@skillsync.dev`);
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.fullName || user?.name || `${role} User`);
    setEmail(data.email || user?.email || `${role.toLowerCase()}@skillsync.dev`);
    setBio(data.bio || "");
  }, [data, role, user?.email, user?.name]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        authUserId: Number(userId),
        fullName: name,
        email,
        bio,
        skills: data?.skills || [],
        professionalTitle: data?.professionalTitle || "",
        profileImageUrl: data?.profileImageUrl || "",
      };
      if (data?.id) return userApi.update(data.id, payload);
      return userApi.create(payload);
    },
    onSuccess: (savedProfile) => {
      updateUser({
        name: savedProfile?.fullName || name,
        email: savedProfile?.email || email,
      });
      toast.success("Profile saved");
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (typeof message === "string") toast.error(message);
      else toast.error("Unable to save profile");
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Profile" description="Keep your SkillSync profile current" />
      <Card className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <Avatar name={name} tone={tone} size="lg" />
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Full Name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white" /></label>
            <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Email<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white" /></label>
            <label className="md:col-span-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 p-4 font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-white" placeholder="Tell us about yourself" /></label>
            <div className="md:col-span-2"><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Profile"}</Button></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function SettingsPage({ role = "Learner" }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [publicProfile, setPublicProfile] = useState(role !== "Admin");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const { theme, setTheme } = useTheme();
  const passwordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed. Use the new password next time you sign in.");
    },
    onError: (error) => {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      const message =
        backendMessage && backendMessage !== "Internal server error"
          ? backendMessage
          : "Password change failed. Check your current password and make sure auth-service is running.";
      toast.error(message);
    },
  });

  const updatePassword = (key, value) => {
    setPasswords((current) => ({ ...current, [key]: value }));
  };

  const submitPasswordChange = (event) => {
    event.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error("Fill current password, new password, and confirmation");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    passwordMutation.mutate(passwords);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="Manage notifications, privacy, and account preferences" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white px-1">Notifications & Privacy</h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {[["Email notifications", emailAlerts, setEmailAlerts], ["Session reminders", sessionReminders, setSessionReminders], ["Public profile", publicProfile, setPublicProfile]].map(([label, value, setValue]) => (
              <div key={label} className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white">{label}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{value ? "Enabled" : "Disabled"}</p>
                </div>
                <button onClick={() => setValue(!value)} className={`h-7 w-12 rounded-full p-1 transition ${value ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white px-1">Appearance</h2>
          <Card className="p-5">
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white">App Theme</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Choose how SkillSync looks on your device</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={theme === "light" ? "primary" : "secondary"} 
                  size="sm" 
                  onClick={() => setTheme("light")}
                >
                  Light Mode
                </Button>
                <Button 
                  variant={theme === "dark" ? "primary" : "secondary"} 
                  size="sm" 
                  onClick={() => setTheme("dark")}
                >
                  Dark Mode
                </Button>
              </div>
            </div>
          </Card>

          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white px-1">Security</h2>
          <Card className="p-5">
            <form onSubmit={submitPasswordChange} className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white">Change Password</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Update the password for this signed-in account.</p>
              </div>
              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
                Current Password
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) => updatePassword("currentPassword", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
                New Password
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(event) => updatePassword("newPassword", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
                Confirm New Password
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(event) => updatePassword("confirmPassword", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
      </div>
    </div>
  );
}

