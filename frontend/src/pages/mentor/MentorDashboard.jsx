import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Calendar, IndianRupee, Star, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Card, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { mentorApi } from "@/services/api/mentorApi";
import { userApi } from "@/services/api/userApi";

const toList = (payload) => payload?.content || payload || [];
const clean = (value) => String(value || "").trim().toLowerCase();
const sameNumber = (left, right) => Number(left) && Number(left) === Number(right);
const genericMentorNames = new Set(["mentor", "mentor 1", "mentor 2", "mentor 3"]);

function readableName(value) {
  const normalized = clean(value);
  return normalized && !genericMentorNames.has(normalized) ? normalized : "";
}

function profileName(profile) {
  return readableName(profile?.displayName || profile?.name || profile?.fullName);
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function learnerNameForSession(session, learnersById) {
  const learner = learnersById.get(Number(session.learnerId));
  const resolvedName = learner?.fullName || learner?.name || learner?.displayName;
  if (resolvedName && !/^learner\s*\d*$/i.test(String(resolvedName).trim())) return resolvedName;
  if (session.learnerName && !/^learner\s*\d*$/i.test(String(session.learnerName).trim())) return session.learnerName;
  return nameFromEmail(learner?.email) || (session.learnerId ? `Learner ${session.learnerId}` : "Learner");
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function MentorDashboard() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const first = user?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "Mentor";
  const now = new Date();
  const hour = now.getHours();
  const dayPart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const formattedDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);

  const { data: mentorData } = useQuery({
    queryKey: ["mentorProfilesForDashboard", userId, user?.email],
    queryFn: () => mentorApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
  });

  const mentorProfiles = useMemo(() => {
    const currentEmail = clean(user?.email);
    const currentName = readableName(user?.name || user?.displayName || user?.fullName);
    const profiles = toList(mentorData);
    const directMatches = profiles.filter((profile) => {
      const emailMatches = currentEmail && clean(profile.email) === currentEmail;
      const nameMatches = currentName && profileName(profile) === currentName;
      return emailMatches || nameMatches;
    });
    if (directMatches.length > 0) return directMatches;
    return profiles.filter((profile) => {
      const belongsToUser = sameNumber(profile.userId, userId);
      return belongsToUser;
    });
  }, [mentorData, user?.email, userId]);

  const requestLookupIds = useMemo(() => {
    const ids = mentorProfiles
      .map((profile) => profile.id)
      .filter(Boolean)
      .map(Number)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [mentorProfiles]);

  const mentorProfileIdSet = useMemo(() => new Set(requestLookupIds), [requestLookupIds]);
  const primaryMentorProfile = mentorProfiles[0];

  const requestQueries = useQueries({
    queries: requestLookupIds.map((id) => ({
      queryKey: ["mentorDashboardRequests", id],
      queryFn: () => mentorApi.getMentorSessionRequests(id, { page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
      enabled: Boolean(id),
    })),
  });

  const mentorSessions = useMemo(() => {
    const byId = new Map();
    requestQueries.forEach((query) => {
      toList(query.data).forEach((session) => {
        if (session?.id && mentorProfileIdSet.has(Number(session.mentorId))) byId.set(session.id, session);
      });
    });
    return [...byId.values()];
  }, [mentorProfileIdSet, requestQueries]);

  const requests = useMemo(
    () => mentorSessions.filter((session) => String(session.status || "").toUpperCase() === "REQUESTED").slice(0, 5),
    [mentorSessions]
  );

  const dashboardStats = useMemo(() => {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const activeStatuses = new Set(["REQUESTED", "ACCEPTED", "COMPLETED"]);
    const activeLearnerIds = new Set();
    let upcomingSessions = 0;
    let completedThisMonth = 0;

    mentorSessions.forEach((session) => {
      const status = String(session.status || "").toUpperCase();
      if (activeStatuses.has(status) && session.learnerId) {
        activeLearnerIds.add(Number(session.learnerId));
      }

      const sessionDate = new Date(session.sessionDateTime || session.dateTime || session.date || "");
      const hasValidDate = !Number.isNaN(sessionDate.getTime());
      if (status === "ACCEPTED" && hasValidDate && sessionDate >= now) {
        upcomingSessions += 1;
      }
      if (status === "COMPLETED" && hasValidDate && sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
        completedThisMonth += 1;
      }
    });

    const rate = Number(primaryMentorProfile?.hourlyRate || 0);
    const averageRating = Number(primaryMentorProfile?.averageRating || 0);

    return {
      upcomingSessions,
      activeLearners: activeLearnerIds.size,
      earnings: completedThisMonth > 0 && rate > 0 ? `₹${completedThisMonth * rate}` : "₹0",
      rating: averageRating > 0 ? averageRating.toFixed(1) : "0.0",
    };
  }, [mentorSessions, now, primaryMentorProfile]);

  const learnerIds = useMemo(() => {
    const ids = requests.map((session) => Number(session.learnerId)).filter(Boolean);
    return [...new Set(ids)];
  }, [requests]);

  const learnerQueries = useQueries({
    queries: learnerIds.map((id) => ({
      queryKey: ["mentorDashboardLearner", id],
      queryFn: () => userApi.resolveByAuthUserId(id),
      enabled: Boolean(id),
      retry: false,
    })),
  });

  const learnersById = useMemo(() => {
    const lookup = new Map();
    learnerIds.forEach((id, index) => {
      const learner = learnerQueries[index]?.data;
      if (learner) lookup.set(Number(id), learner);
    });
    return lookup;
  }, [learnerIds, learnerQueries]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Good ${dayPart}, ${first}!`} description={`${formattedDate} - Here's your mentoring overview`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} value={dashboardStats.upcomingSessions} label="Upcoming Sessions" tone="emerald" />
        <StatCard icon={Users} value={dashboardStats.activeLearners} label="Active Learners" tone="blue" />
        <StatCard icon={IndianRupee} value={dashboardStats.earnings} label="Monthly Earnings" tone="orange" />
        <StatCard icon={Star} value={dashboardStats.rating} label="Average Rating" tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-extrabold text-slate-950">Recent Session Requests</h2></div>
        {requests.length === 0 ? <EmptyState title="No session requests" description="Incoming learner requests will appear here." /> : (
          <table><thead><tr><th>Learner</th><th>Topic</th><th>Date & Time</th><th>Status</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td className="font-extrabold">{learnerNameForSession(request, learnersById)}</td><td>{request.topic || "Mentoring Session"}</td><td>{formatDateTime(request.sessionDateTime)}</td><td><StatusBadge status={request.status || "Pending"} /></td></tr>)}</tbody></table>
        )}
      </Card>
    </div>
  );
}
