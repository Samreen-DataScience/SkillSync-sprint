import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, PageHeader } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";
import { mentorApi } from "@/services/api/mentorApi";
import { apiClient } from "@/services/api/client";

export default function MentorProfileApplyPage() {
  const user = useAuthStore((s) => s.user);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(500);
  const [selectedSkillNames, setSelectedSkillNames] = useState([]);
  const [manualSkillNames, setManualSkillNames] = useState("");

  const { data: existingProfile } = useQuery({
    queryKey: ["mentor-profile-by-user", user?.userId],
    queryFn: async () => {
      try {
        return await mentorApi.getMentorByUserId(user.userId, user.email);
      } catch (error) {
        if (error?.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(user?.userId && user?.email),
  });

  const { data: skillsResp, isLoading: skillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data } = await apiClient.get("/skills", { params: { page: 0, size: 100 } });
      return data;
    },
  });

  const skills = skillsResp?.content || skillsResp || [];

  const skillNameToId = useMemo(() => {
    const map = new Map();
    skills.forEach((s) => {
      const name = String(s?.name || "").trim().toLowerCase();
      if (name) map.set(name, s.id);
    });
    return map;
  }, [skills]);

  const skillIdToName = useMemo(() => {
    const map = new Map();
    skills.forEach((s) => {
      if (s?.id) map.set(Number(s.id), s.name || `Skill ${s.id}`);
    });
    return map;
  }, [skills]);

  useEffect(() => {
    if (!existingProfile) return;

    setDisplayName(existingProfile.displayName || user?.name || "");
    setBio(existingProfile.bio || "");
    setExperienceYears(existingProfile.experienceYears ?? 1);
    setHourlyRate(existingProfile.hourlyRate ?? 500);

    const knownSkillNames = [];
    const unknownSkillNames = [];
    (existingProfile.skillIds || []).forEach((skillId) => {
      const skillName = skillIdToName.get(Number(skillId));
      if (skillName) knownSkillNames.push(skillName);
      else unknownSkillNames.push(String(skillId));
    });

    setSelectedSkillNames(knownSkillNames);
    setManualSkillNames(unknownSkillNames.join(", "));
  }, [existingProfile, skillIdToName, user?.name]);

  const applyMutation = useMutation({
    mutationFn: (payload) => {
      if (existingProfile?.id) return mentorApi.updateMentorProfile(existingProfile.id, payload);
      return mentorApi.applyMentor(payload);
    },
    onSuccess: () => toast.success(existingProfile?.id ? "Mentor profile updated" : "Mentor profile submitted for approval"),
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Unable to submit mentor application";
      toast.error(msg);
    },
  });

  const toggleSkillName = (name) => {
    setSelectedSkillNames((current) =>
      current.includes(name) ? current.filter((v) => v !== name) : [...current, name]
    );
  };

  const submit = () => {
    const manualNames = manualSkillNames
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const mergedNames = Array.from(new Set([...selectedSkillNames, ...manualNames]));

    if (!user?.userId) return toast.error("User not found");
    if (!displayName.trim() || displayName.trim().toLowerCase() === "mentor") return toast.error("Enter your real mentor name");
    if (!bio.trim()) return toast.error("Bio is required");
    if (mergedNames.length === 0) return toast.error("Add at least one skill name");

    const missingNames = mergedNames.filter((name) => !skillNameToId.has(name.toLowerCase()));
    if (missingNames.length > 0) {
      toast.error(`Skills not found in backend: ${missingNames.join(", ")}`);
      return;
    }

    const skillIds = mergedNames.map((name) => skillNameToId.get(name.toLowerCase()));

    applyMutation.mutate({
      userId: user.userId,
      displayName: displayName.trim(),
      email: user.email,
      bio,
      experienceYears: Number(experienceYears),
      hourlyRate: Number(hourlyRate),
      skillIds,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Mentor Application" description="Create your mentor profile and submit for admin approval" />
      <Card className="space-y-4 p-6">
        <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Mentor Name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
        </label>

        <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 p-4 font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Experience Years
            <input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
          </label>
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Hourly Rate
            <input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white" />
          </label>
        </div>

        <div>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Skills</p>
          {skillsLoading ? (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading skills...</p>
          ) : skills.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-500">No skills returned from backend. Restart skill-service or ask admin to create skills first.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s) => {
                const skillName = s.name || `Skill ${s.id}`;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkillName(skillName)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${selectedSkillNames.includes(skillName) ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"}`}
                  >
                    {skillName}
                  </button>
                );
              })}
            </div>
          )}

          <label className="mt-3 block text-xs font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Existing Skill Names (comma separated)
            <input
              value={manualSkillNames}
              onChange={(e) => setManualSkillNames(e.target.value)}
              placeholder="Java, Spring Boot"
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            />
          </label>
        </div>

        {existingProfile?.status && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Existing mentor profile found. Current status: {existingProfile.status}
          </p>
        )}

        <Button onClick={submit} disabled={applyMutation.isPending}>
          {applyMutation.isPending ? "Saving..." : existingProfile?.id ? "Update Mentor Profile" : "Submit Mentor Profile"}
        </Button>
      </Card>
    </div>
  );
}
