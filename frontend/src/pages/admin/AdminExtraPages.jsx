import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, Bell, CalendarCheck, Clock, RefreshCw, Save, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Star, Users } from "lucide-react";
import { adminApi } from "@/services/api/adminApi";
import { userApi } from "@/services/api/userApi";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";

function deleteErrorMessage(error, target, serviceName) {
  const status = error?.response?.status;
  const rawMessage = error?.response?.data?.message || error?.response?.data?.error || "";
  const genericServerError = !rawMessage || rawMessage.toLowerCase() === "internal server error";
  const restartHint = `Restart ${serviceName} and try again.`;

  if (status === 404 || status === 405) {
    return `Delete failed for ${target}. The backend delete API is not running yet. ${restartHint}`;
  }

  if (status === 409) {
    return rawMessage || `Delete failed for ${target}. Related records still exist in the database. Remove those records first, then try again.`;
  }

  if (status === 500 || genericServerError) {
    return `Delete failed for ${target}. The running ${serviceName} is still using old code or the database has related records blocking deletion. ${restartHint}`;
  }

  return rawMessage || `Delete failed for ${target}. Please check ${serviceName} logs for the exact database error.`;
}

export function AdminUsers() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["adminUsers"], queryFn: () => adminApi.getUsers({ page: 0, size: 50 }) });
  const users = data?.content || data || [];
  const userById = useMemo(() => {
    const entries = users.flatMap((user) => [
      [Number(user.id), user],
      [Number(user.userId), user],
      [Number(user.authUserId), user],
    ]);
    return new Map(entries.filter(([id]) => Number.isFinite(id)));
  }, [users]);
  const { data: mentorData, isLoading: mentorsLoading, refetch: refetchMentors } = useQuery({
    queryKey: ["mentorApplications"],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: skillData } = useQuery({
    queryKey: ["adminUserSkills"],
    queryFn: () => adminApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
    retry: false,
  });
  const mentorApplications = mentorData?.content || mentorData || [];
  const skills = skillData?.content || skillData || [];
  const skillById = useMemo(
    () => new Map(skills.map((skill) => [Number(skill.id), skill.name])),
    [skills]
  );
  const mentorCounts = useMemo(() => {
    const approved = mentorApplications.filter((mentor) => String(mentor.status).toUpperCase() === "APPROVED").length;
    const pending = mentorApplications.filter((mentor) => String(mentor.status).toUpperCase() === "PENDING").length;
    const rejected = mentorApplications.filter((mentor) => String(mentor.status).toUpperCase() === "REJECTED").length;
    return { approved, pending, rejected, total: mentorApplications.length };
  }, [mentorApplications]);

  const skillNames = (mentor) => {
    const names = (mentor.skillIds || []).map((id) => skillById.get(Number(id)) || `Skill ${id}`);
    return names.length ? names.join(", ") : "-";
  };

  const availabilityText = (mentor) => {
    const slots = mentor.availabilitySlots || [];
    if (!slots.length) return "Not set";
    return slots
      .filter((slot) => slot.available !== false)
      .map((slot) => `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`)
      .slice(0, 2)
      .join(", ") || "Not set";
  };

  const mentorEmail = (mentor) => {
    const applicant = userById.get(Number(mentor.userId));
    return mentor.email || applicant?.email || "";
  };

  const mentorName = (mentor) => {
    const applicant = userById.get(Number(mentor.userId));
    return mentor.displayName || applicant?.fullName || applicant?.name || `Mentor ${mentor.id}`;
  };

  const mentorForEmail = useMemo(() => {
    const priority = { APPROVED: 3, PENDING: 2, REJECTED: 1 };
    const lookup = new Map();
    mentorApplications.forEach((mentor) => {
      const email = String(mentorEmail(mentor) || "").trim().toLowerCase();
      if (!email) return;
      const current = lookup.get(email);
      const currentPriority = priority[String(current?.status || "").toUpperCase()] || 0;
      const nextPriority = priority[String(mentor.status || "").toUpperCase()] || 0;
      if (!current || nextPriority > currentPriority) lookup.set(email, mentor);
    });
    return lookup;
  }, [mentorApplications, userById]);

  const mentorProfilesByEmail = useMemo(() => {
    const lookup = new Map();
    mentorApplications.forEach((mentor) => {
      const email = String(mentorEmail(mentor) || "").trim().toLowerCase();
      if (!email) return;
      const current = lookup.get(email) || [];
      lookup.set(email, [...current, mentor]);
    });
    return lookup;
  }, [mentorApplications, userById]);

  const platformUsers = useMemo(() => {
    const rows = [];
    const seenEmails = new Set();

    users.forEach((user) => {
      const email = String(user.email || "").trim().toLowerCase();
      const mentor = mentorForEmail.get(email);
      const mentorStatus = String(mentor?.status || "").toUpperCase();
      const isApprovedMentor = mentorStatus === "APPROVED";
      const isPendingMentor = mentorStatus === "PENDING";
      const isRejectedMentor = mentorStatus === "REJECTED";
      rows.push({
        id: `user-${user.id || user.userId || email}`,
        userId: user.id || user.userId,
        canDeleteUser: Boolean(user.id || user.userId),
        mentorProfiles: mentorProfilesByEmail.get(email) || [],
        name: user.fullName || user.name || mentor?.displayName || `User ${user.id}`,
        email: user.email || mentor?.email || "-",
        role: isApprovedMentor ? "Mentor" : user.role || (mentor ? "Mentor Applicant" : "-"),
        status: isApprovedMentor ? "Active Mentor" : isPendingMentor ? "Pending Approval" : isRejectedMentor ? "Rejected Mentor" : user.status || "Active",
      });
      if (email) seenEmails.add(email);
    });

    mentorApplications.forEach((mentor) => {
      const email = String(mentorEmail(mentor) || "").trim().toLowerCase();
      if (email && seenEmails.has(email)) return;
      const status = String(mentor.status || "").toUpperCase();
      rows.push({
        id: `mentor-${mentor.id}`,
        userId: null,
        canDeleteUser: false,
        mentorProfiles: [mentor],
        name: mentorName(mentor),
        email: mentorEmail(mentor) || "-",
        role: status === "APPROVED" ? "Mentor" : "Mentor Applicant",
        status: status === "APPROVED" ? "Active Mentor" : status === "PENDING" ? "Pending Approval" : status === "REJECTED" ? "Rejected Mentor" : mentor.status || "Active",
      });
    });

    return rows;
  }, [mentorApplications, mentorForEmail, mentorProfilesByEmail, users]);

  const approveMentor = useMutation({
    mutationFn: adminApi.approveMentor,
    onSuccess: () => {
      toast.success("Mentor application approved");
      refetchMentors();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Unable to approve mentor";
      toast.error(msg);
    },
  });

  const deleteMentor = useMutation({
    mutationFn: ({ mentorId }) => adminApi.deleteMentor(mentorId),
    onSuccess: (_, variables) => {
      toast.success(`${variables.label} mentor profile deleted from database`);
      refetchMentors();
    },
    onError: (err, variables) => {
      toast.error(deleteErrorMessage(err, variables?.label || "this mentor profile", "mentor-service"), { duration: 9000 });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async ({ userId, mentorProfiles = [] }) => {
      for (const mentor of mentorProfiles) {
        await adminApi.deleteMentor(mentor.id);
      }
      await adminApi.deleteUser(userId);
    },
    onSuccess: (_, variables) => {
      const mentorCount = variables.mentorProfiles?.length || 0;
      toast.success(`${variables.label} deleted from database${mentorCount ? ` with ${mentorCount} mentor profile(s)` : ""}`);
      refetch();
      refetchMentors();
    },
    onError: (err, variables) => {
      const serviceName = variables?.mentorProfiles?.length ? "mentor-service/user-service" : "user-service";
      toast.error(deleteErrorMessage(err, variables?.label || "this user profile", serviceName), { duration: 9000 });
    },
  });

  const confirmDeleteMentor = (mentor) => {
    const label = `${mentorName(mentor)} (${mentorEmail(mentor) || "no email"})`;
    const message = [
      `Delete mentor profile: ${label}`,
      "",
      "This removes the mentor profile row from mentor-service database, including selected skills and availability.",
      "It does not delete the user's login account.",
      "",
      "This cannot be undone. Continue?",
    ].join("\n");
    if (window.confirm(message)) {
      deleteMentor.mutate({ mentorId: mentor.id, label });
    }
  };

  const confirmDeleteUser = (user) => {
    const label = `${user.name} (${user.email})`;
    const mentorCount = user.mentorProfiles?.length || 0;
    const message = [
      `Delete user profile: ${label}`,
      "",
      "This removes the user profile row from user-service database.",
      mentorCount ? `It will also delete ${mentorCount} linked mentor profile(s) from mentor-service database first.` : "No linked mentor profiles were found for this user.",
      "It does not delete the auth/login account.",
      "",
      "This cannot be undone. Continue?",
    ].join("\n");
    if (window.confirm(message)) {
      deleteUser.mutate({ userId: user.userId, label, mentorProfiles: user.mentorProfiles || [] });
    }
  };

  const rejectMentor = useMutation({
    mutationFn: (mentorId) => adminApi.rejectMentor(mentorId, "Mentor application rejected by admin"),
    onSuccess: () => {
      toast.success("Mentor application rejected");
      refetchMentors();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Unable to reject mentor";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Manage Users" description="Review learners, mentors, and administrators" />
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Mentor Registry</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Complete list of registered mentor profiles and approval status</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-extrabold">
              <Badge tone="blue">{mentorCounts.total} total</Badge>
              <Badge tone="emerald">{mentorCounts.approved} approved</Badge>
              <Badge tone="orange">{mentorCounts.pending} pending</Badge>
              <Badge tone="rose">{mentorCounts.rejected} rejected</Badge>
            </div>
          </div>
        </div>
        {mentorsLoading ? (
          <p className="p-4 text-sm font-semibold text-slate-500">Loading mentor registry...</p>
        ) : mentorApplications.length === 0 ? (
          <EmptyState title="No mentors registered" description="When mentors apply, every profile will appear here." />
        ) : (
          <table>
            <thead>
              <tr><th>Mentor</th><th>Email</th><th>Skills</th><th>Experience</th><th>Rate</th><th>Availability</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {mentorApplications.map((mentor) => {
                const applicantName = mentorName(mentor);
                const isPending = (mentor.status || "PENDING").toUpperCase() === "PENDING";
                return (
                  <tr key={mentor.id}>
                    <td className="font-extrabold">{applicantName}</td>
                    <td>{mentorEmail(mentor) || "-"}</td>
                    <td>{skillNames(mentor)}</td>
                    <td>{mentor.experienceYears ?? "-"} yrs</td>
                    <td>{mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : "-"}</td>
                    <td>{availabilityText(mentor)}</td>
                    <td><StatusBadge status={mentor.status || "PENDING"} /></td>
                    <td>
                      {isPending ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="success" disabled={approveMentor.isPending} onClick={() => approveMentor.mutate(mentor.id)}>Approve</Button>
                          <Button size="sm" variant="danger" disabled={rejectMentor.isPending} onClick={() => rejectMentor.mutate(mentor.id)}>Reject</Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-400">Done</span>
                          <Button size="sm" variant="danger" disabled={deleteMentor.isPending} onClick={() => confirmDeleteMentor(mentor)}>Delete</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Platform Users</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Learners and mentors with live mentor status applied</p>
        </div>
        {isLoading || mentorsLoading ? <p className="p-4 text-sm font-semibold text-slate-500">Loading users...</p> : platformUsers.length === 0 ? <EmptyState title="No users found" description="User and mentor profiles will appear here." /> : (
          <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{platformUsers.map((u) => <tr key={u.id}><td className="font-extrabold">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td><StatusBadge status={u.status} /></td><td>{u.canDeleteUser ? <Button size="sm" variant="danger" disabled={deleteUser.isPending} onClick={() => confirmDeleteUser(u)}>Delete</Button> : <span className="text-sm font-bold text-slate-400">-</span>}</td></tr>)}</tbody></table>
        )}
      </Card>
    </div>
  );
}

export function AdminSessions() {
  const { data, isLoading, refetch, isFetching, isError } = useQuery({
    queryKey: ["adminAllSessions"],
    queryFn: () => adminApi.getSessions({ page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const { data: usersData } = useQuery({
    queryKey: ["adminSessionUsers"],
    queryFn: () => adminApi.getUsers({ page: 0, size: 100 }),
    retry: false,
  });
  const { data: mentorsData } = useQuery({
    queryKey: ["adminSessionMentors"],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
    });
    const users = usersData?.content || usersData || [];
    const mentors = mentorsData?.content || mentorsData || [];
    const usersById = useMemo(() => {
      const rows = users.flatMap((user) => [
        [Number(user.id), user],
        [Number(user.userId), user],
        [Number(user.authUserId), user],
      ]);
      return new Map(rows.filter(([id]) => Number.isFinite(id)));
    }, [users]);
    const mentorsById = useMemo(() => new Map(mentors.map((mentor) => [Number(mentor.id), mentor])), [mentors]);
    const mentorSessionQueries = useQueries({
      queries: mentors
      .map((mentor) => Number(mentor.id))
      .filter(Boolean)
      .map((mentorId) => ({
        queryKey: ["adminMentorSessions", mentorId],
        queryFn: () => adminApi.getSessionsByMentor(mentorId, { page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
        enabled: Boolean(mentorId),
        retry: false,
      })),
  });
  const sessions = useMemo(() => {
    const byId = new Map();
    (data?.content || data || []).forEach((session) => {
      if (session?.id) byId.set(Number(session.id), session);
    });
    mentorSessionQueries.forEach((query) => {
      (query.data?.content || query.data || []).forEach((session) => {
        if (session?.id) byId.set(Number(session.id), session);
      });
    });
      return [...byId.values()]
        .filter((session) => {
          const mentor = mentorsById.get(Number(session.mentorId));
          const mentorLabel = String(mentor?.displayName || mentor?.name || mentor?.email || "").trim().toLowerCase();
          const placeholderMentor = ["mentor", "mentor 1", "mentor 2", "mentor 3"].includes(mentorLabel);
          return mentor && !placeholderMentor;
        })
        .sort((left, right) => Number(right.id || 0) - Number(left.id || 0));
    }, [data, mentorSessionQueries, mentorsById]);

  const sessionLearnerIds = useMemo(
    () => [...new Set(sessions.map((session) => Number(session.learnerId)).filter(Number.isFinite))],
    [sessions]
  );
  const learnerProfileQueries = useQueries({
    queries: sessionLearnerIds.map((learnerId) => ({
      queryKey: ["adminSessionLearnerProfile", learnerId],
      queryFn: () => userApi.resolveByAuthUserId(learnerId),
      enabled: Boolean(learnerId),
      retry: false,
    })),
  });
  const learnerProfilesByAuthId = useMemo(
    () => new Map(sessionLearnerIds.map((learnerId, index) => [learnerId, learnerProfileQueries[index]?.data]).filter(([, profile]) => Boolean(profile))),
    [learnerProfileQueries, sessionLearnerIds]
  );

  const statusCounts = useMemo(() => {
    return sessions.reduce(
      (counts, session) => {
        const status = String(session.status || "REQUESTED").toUpperCase();
        counts.total += 1;
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      },
      { total: 0 }
    );
  }, [sessions]);

  const learnerName = (session) => {
    const learner = learnerProfilesByAuthId.get(Number(session.learnerId)) || usersById.get(Number(session.learnerId));
    return learner?.fullName || learner?.name || learner?.email || (session.learnerId ? `Learner ${session.learnerId}` : "-");
  };

  const mentorName = (session) => {
    const mentor = mentorsById.get(Number(session.mentorId));
    return mentor?.displayName || mentor?.email || (session.mentorId ? `Mentor ${session.mentorId}` : "-");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Session History"
        description="All learner bookings and mentor decisions across SkillSync"
        action={(
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} />
            {isFetching || mentorSessionQueries.some((query) => query.isFetching) ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={CalendarCheck} label="Total Sessions" value={statusCounts.total} tone="blue" />
        <StatCard icon={Clock} label="Requested" value={statusCounts.REQUESTED || 0} tone="orange" />
        <StatCard icon={Sparkles} label="Accepted" value={statusCounts.ACCEPTED || 0} tone="emerald" />
        <StatCard icon={Star} label="Completed" value={statusCounts.COMPLETED || 0} tone="violet" />
        <StatCard icon={ShieldCheck} label="Rejected" value={statusCounts.REJECTED || 0} tone="rose" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">All Sessions</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Latest session records from admin and mentor history endpoints.
            </p>
            {isError && (
              <p className="mt-2 text-xs font-bold text-amber-500">
                Admin all-sessions endpoint is not active yet, showing records collected from mentor histories.
              </p>
            )}
          </div>
        {isLoading || mentorSessionQueries.some((query) => query.isLoading) ? <p className="p-4 text-sm font-semibold text-slate-500">Loading sessions...</p> : sessions.length === 0 ? <EmptyState title="No session history" description="Learner bookings will appear here after sessions are requested." /> : (
          <table>
            <thead><tr><th>Session</th><th>Learner</th><th>Mentor</th><th>Topic</th><th>Date & Time</th><th>Duration</th><th>Status</th><th>Meeting</th></tr></thead>
            <tbody>{sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-extrabold">#{session.id}</td>
                <td>{learnerName(session)}</td>
                <td>{mentorName(session)}</td>
                <td>{session.topic || "Mentoring Session"}</td>
                <td>{formatDateTime(session.sessionDateTime)}</td>
                <td>{session.durationMinutes || 60} min</td>
                <td><StatusBadge status={session.status || "REQUESTED"} /></td>
                <td>{session.meetingLink ? <a className="font-extrabold text-rose-600 hover:underline" href={session.meetingLink} target="_blank" rel="noreferrer">Open</a> : "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function AdminSkills() {
  const [form, setForm] = useState({ name: "", category: "Backend" });
  const token = useAuthStore((s) => s.token);
  const isLocalLogin = token === "local-login-token";
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminSkills"],
    queryFn: () => adminApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
  });
  const skills = data?.content || data || [];

  const createSkill = useMutation({
    mutationFn: adminApi.createSkill,
    onSuccess: () => {
      toast.success("Skill created");
      setForm({ name: "", category: form.category });
      refetch();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Unable to create skill";
      toast.error(msg);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (isLocalLogin) {
      toast.error("You are logged in with local demo account. Register/login with backend admin account to create skills.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }
    createSkill.mutate({ name: form.name.trim(), category: form.category.trim() });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Skills" description="Create platform skills before mentors apply" />
      {isLocalLogin && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          You are using a local demo login. Backend writes like creating skills need a real backend admin token.
        </Card>
      )}
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Skill Name
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Java"
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-semibold"
            />
          </label>
          <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Category
            <input
              value={form.category}
              onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
              placeholder="Backend"
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-semibold"
            />
          </label>
          <Button type="submit" disabled={createSkill.isPending}>
            {createSkill.isPending ? "Saving..." : "Create Skill"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-sm font-semibold text-slate-500">Loading skills...</p>
        ) : skills.length === 0 ? (
          <EmptyState title="No skills yet" description="Create skills here, then mentors can select them in mentor application." />
        ) : (
          <table>
            <thead>
              <tr><th>Skill</th><th>Category</th><th>Skill Id</th></tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td className="font-extrabold">{skill.name}</td>
                  <td><Badge tone="blue">{skill.category}</Badge></td>
                  <td>{skill.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function AdminReports() {
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ["reportUsers"],
    queryFn: () => adminApi.getUsers({ page: 0, size: 100 }),
    retry: false,
  });
  const { data: mentorData, isLoading: mentorsLoading } = useQuery({
    queryKey: ["reportMentors"],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const { data: skillData, isLoading: skillsLoading } = useQuery({
    queryKey: ["reportSkills"],
    queryFn: () => adminApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
    retry: false,
  });

  const users = userData?.content || userData || [];
  const mentors = mentorData?.content || mentorData || [];
  const skills = skillData?.content || skillData || [];
  const approvedMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "APPROVED").length;
  const pendingMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "PENDING").length;
  const rejectedMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "REJECTED").length;
  const averageRate = mentors.length
    ? Math.round(mentors.reduce((sum, mentor) => sum + Number(mentor.hourlyRate || 0), 0) / mentors.length)
    : 0;
  const isLoading = usersLoading || mentorsLoading || skillsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reports" description="Platform overview from users, mentors, and skills" />

      {isLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading reports...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Users" value={users.length} tone="blue" />
            <StatCard icon={Star} label="Mentor Applications" value={mentors.length} helper={`${approvedMentors} approved`} tone="emerald" />
            <StatCard icon={Sparkles} label="Skills" value={skills.length} tone="violet" />
            <StatCard icon={BarChart3} label="Average Rate" value={averageRate ? `₹${averageRate}/hr` : "-"} tone="orange" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Mentor Status</h2>
              <div className="mt-4 space-y-3">
                <ReportLine label="Approved" value={approvedMentors} total={mentors.length} tone="bg-emerald-600" />
                <ReportLine label="Pending" value={pendingMentors} total={mentors.length} tone="bg-orange-500" />
                <ReportLine label="Rejected" value={rejectedMentors} total={mentors.length} tone="bg-rose-600" />
              </div>
            </Card>

            <Card className="overflow-hidden">
              {mentors.length === 0 ? (
                <EmptyState title="No mentor data" description="Mentor application reports will appear after mentors apply." />
              ) : (
                <table>
                  <thead>
                    <tr><th>Mentor</th><th>Email</th><th>Experience</th><th>Rate</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {mentors.slice(0, 8).map((mentor) => (
                      <tr key={mentor.id}>
                        <td className="font-extrabold">{mentor.displayName || `Mentor ${mentor.id}`}</td>
                        <td>{mentor.email || "-"}</td>
                        <td>{mentor.experienceYears ?? "-"} yrs</td>
                        <td>{mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : "-"}</td>
                        <td><StatusBadge status={mentor.status || "PENDING"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ReportLine({ label, value, total, tone }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span>{value} ({percent}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "SkillSync",
    defaultSessionDuration: 60,
    mentorAutoApprove: false,
    requireSkillSelection: true,
    emailNotifications: true,
    applicationAlerts: true,
    maintenanceMode: false,
  });

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = (event) => {
    event.preventDefault();
    toast.success("Settings saved");
  };

  return (
    <form onSubmit={saveSettings} className="space-y-6 animate-fade-in">
      <PageHeader
        title="Platform Settings"
        description="Manage admin preferences and platform defaults"
        action={(
          <Button type="submit">
            <Save size={17} />
            Save Changes
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Settings size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">General</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Basic platform details</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
              Platform Name
              <input
                value={settings.platformName}
                onChange={(event) => updateSetting("platformName", event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
              Default Session Duration
              <select
                value={settings.defaultSessionDuration}
                onChange={(event) => updateSetting("defaultSessionDuration", Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Approvals</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Mentor application rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingToggle
              label="Auto approve mentors"
              description="Skip manual review for new mentor applications."
              checked={settings.mentorAutoApprove}
              onChange={(value) => updateSetting("mentorAutoApprove", value)}
            />
            <SettingToggle
              label="Require skills"
              description="Mentors must choose at least one skill while applying."
              checked={settings.requireSkillSelection}
              onChange={(value) => updateSetting("requireSkillSelection", value)}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
              <Bell size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Notifications</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Admin alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingToggle
              label="Email notifications"
              description="Send platform updates to admins by email."
              checked={settings.emailNotifications}
              onChange={(value) => updateSetting("emailNotifications", value)}
            />
            <SettingToggle
              label="Mentor application alerts"
              description="Notify admins when a mentor application is submitted."
              checked={settings.applicationAlerts}
              onChange={(value) => updateSetting("applicationAlerts", value)}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <SlidersHorizontal size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">System</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Operational controls</p>
            </div>
          </div>

          <SettingToggle
            label="Maintenance mode"
            description="Temporarily block learner and mentor access."
            checked={settings.maintenanceMode}
            onChange={(value) => updateSetting("maintenanceMode", value)}
          />
        </Card>
      </div>
    </form>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <span>
        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">{label}</span>
        <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-rose-600"
      />
    </label>
  );
}
