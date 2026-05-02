import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Star, Users } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { groupApi } from "@/services/api/groupApi";
import { learnerApi } from "@/services/api/learnerApi";

export default function LearnerDashboard() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const first = user?.name?.split(" ")[0] || "Learner";
  const now = new Date();
  const hour = now.getHours();
  const dayPart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const { data: sessionResponse } = useQuery({
    queryKey: ["mySessions", userId],
    queryFn: () => learnerApi.getMySessions(userId, { page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
    retry: false,
  });
  const { data: mentorsResponse } = useQuery({
    queryKey: ["mentors", "approved", "dashboard"],
    queryFn: () => learnerApi.getMentors({ status: "APPROVED", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const { data: groupsResponse } = useQuery({
    queryKey: ["dashboardGroups"],
    queryFn: () => groupApi.getGroups({ page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });

  const sessions = useMemo(() => toList(sessionResponse), [sessionResponse]);
  const mentors = Array.isArray(mentorsResponse) ? mentorsResponse : mentorsResponse?.content || [];
  const mentorUserIds = useMemo(
    () => [...new Set(mentors.map((mentor) => Number(mentor.userId)).filter(Number.isFinite))],
    [mentors]
  );
  const mentorUserQueries = useQueries({
    queries: mentorUserIds.map((id) => ({
      queryKey: ["learnerDashboardMentorUser", id],
      queryFn: () => learnerApi.getUserById(id),
      enabled: Boolean(id),
      retry: false,
    })),
  });
  const mentorUsersById = useMemo(() => {
    const lookup = new Map();
    mentorUserQueries.forEach((query) => {
      const profile = query.data;
      const authId = Number(profile?.authUserId || profile?.userId || profile?.id);
      if (Number.isFinite(authId)) lookup.set(authId, profile);
    });
    return lookup;
  }, [mentorUserQueries]);
  const mentorsById = useMemo(() => {
    const lookup = new Map();
    mentors.forEach((mentor) => {
      if (mentor.id) lookup.set(Number(mentor.id), mentor);
      if (mentor.userId) lookup.set(Number(mentor.userId), mentor);
    });
    return lookup;
  }, [mentors]);
  const groups = useMemo(() => toList(groupsResponse), [groupsResponse]);

  const groupMemberQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["groupMembers", group.id],
      queryFn: () => groupApi.getMembers(group.id),
      enabled: Boolean(group.id && userId),
      retry: false,
    })),
  });

  const activeGroups = useMemo(
    () => groups.filter((group, index) => toList(groupMemberQueries[index]?.data).some((member) => Number(member.userId) === Number(userId))),
    [groups, groupMemberQueries, userId]
  );
  const completedSessions = useMemo(
    () => sessions.filter((session) => String(session.status || "").toUpperCase() === "COMPLETED"),
    [sessions]
  );
  const upcomingSessions = useMemo(
    () => sessions.filter((session) => !["COMPLETED", "REJECTED", "DECLINED", "CANCELLED"].includes(String(session.status || "").toUpperCase())),
    [sessions]
  );
  const mentorIdsWithCompletedSessions = useMemo(
    () => [...new Set(completedSessions.map((session) => Number(session.mentorId)).filter(Boolean))],
    [completedSessions]
  );

  const reviewQueries = useQueries({
    queries: mentorIdsWithCompletedSessions.map((mentorId) => ({
      queryKey: ["learnerDashboardReviews", mentorId],
      queryFn: () => learnerApi.getMentorReviews(mentorId, { page: 0, size: 100, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentorId && userId),
      retry: false,
    })),
  });

  const reviewsGiven = useMemo(() => {
    const reviewedSessionIds = new Set(
      reviewQueries
        .flatMap((query) => toList(query.data))
        .filter((review) => Number(review.userId) === Number(userId))
        .map((review) => Number(review.sessionId))
        .filter(Boolean)
    );
    return reviewedSessionIds.size;
  }, [reviewQueries, userId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Good ${dayPart}, ${first}!`} description={`${formattedDate} - Here's your learning overview`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} value={upcomingSessions.length} label="Upcoming Sessions" helper="Live from your account" tone="rose" />
        <StatCard icon={Users} value={mentors.length} label="Available Mentors" helper="Fetched from backend" tone="blue" />
        <StatCard icon={BookOpen} value={activeGroups.length} label="Active Groups" helper="Groups you joined" tone="emerald" />
        <StatCard icon={Star} value={reviewsGiven} label="Reviews Given" helper="Ratings you submitted" tone="orange" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Mentors</h2><Link className="text-sm font-extrabold text-rose-600" to="/learner/mentors">View all</Link></div>
        {mentors.length === 0 ? (
          <EmptyState title="No mentors found yet" description="When mentors are available in backend, they will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">{mentors.slice(0, 3).map((mentor) => <MentorMini key={mentor.id || mentor.userId} mentor={mentor} userProfile={mentorUsersById.get(Number(mentor.userId))} />)}</div>
        )}
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-extrabold text-slate-950">Upcoming Sessions</h2></div>
        {upcomingSessions.length === 0 ? <p className="p-5 text-sm font-semibold text-slate-500">No sessions booked yet.</p> : (
          <div className="overflow-x-auto">
            <table><thead><tr><th>Date & Time</th><th>Mentor</th><th>Topic</th><th>Status</th></tr></thead><tbody>{upcomingSessions.slice(0, 5).map((s) => <tr key={s.id}><td>{formatSessionDate(s)}</td><td className="font-bold">{mentorNameForSession(s, mentorsById)}</td><td>{s.topic || "Mentoring Session"}</td><td><StatusBadge status={s.status || "Pending"} /></td></tr>)}</tbody></table>
          </div>
        )}
      </Card>
    </div>
  );
}

function MentorMini({ mentor, userProfile }) {
  const mentorId = mentor.id || mentor.userId;
  const name = mentor.displayName || mentor.name || mentor.fullName || userProfile?.fullName || userProfile?.name || mentor.email || userProfile?.email || `Mentor ${mentorId}`;
  const skills = mentor.skills || [];
  const rate = mentor.hourlyRate || mentor.rate;
  return (
    <Card className="p-5">
      <h3 className="font-extrabold text-slate-950">{name}</h3>
      <p className="mt-1 text-xs font-semibold text-slate-500">{mentor.experience || mentor.experienceYears ? `${mentor.experience || mentor.experienceYears} yrs experience` : "Profile available"}</p>
      <div className="mt-3 flex flex-wrap gap-2">{skills.slice(0, 4).map((s, i) => <Badge key={`${name}-${i}`}>{typeof s === "string" ? s : s?.name}</Badge>)}</div>
      <div className="mt-5 flex items-center justify-between">
        <p className="font-black text-slate-950">{rate ? `₹${rate}/hr` : "Rate not set"}</p>
        <Link to={`/learner/mentors/${mentorId}/book`}>
          <Button size="sm">View</Button>
        </Link>
      </div>
    </Card>
  );
}

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function formatSessionDate(session) {
  const value = session.sessionDateTime || session.dateTime || session.date;
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${session.date || "-"} ${session.time || ""}`.trim();
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mentorNameForSession(session, mentorsById) {
  const directName = session.mentorName || session.mentor || session.displayName;
  if (directName && !/^mentor\s*\d*$/i.test(String(directName).trim())) {
    return directName;
  }
  const mentor = mentorsById.get(Number(session.mentorId)) || mentorsById.get(Number(session.mentorUserId));
  return mentor?.displayName || mentor?.name || mentor?.fullName || nameFromEmail(mentor?.email) || directName || "-";
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
