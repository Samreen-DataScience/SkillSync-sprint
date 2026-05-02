import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageSquareText,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { adminApi } from "@/services/api/adminApi";
import { learnerApi } from "@/services/api/learnerApi";
import { Button, Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";

const toList = (payload) => payload?.content || payload || [];

export default function AdminDashboard() {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const { data: usersResp, isLoading: usersLoading } = useQuery({
    queryKey: ["dashboardUsers"],
    queryFn: () => adminApi.getUsers({ page: 0, size: 100 }),
    retry: false,
  });
  const { data: mentorsResp, isLoading: mentorsLoading } = useQuery({
    queryKey: ["dashboardMentors"],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const { data: skillsResp, isLoading: skillsLoading } = useQuery({
    queryKey: ["dashboardSkills"],
    queryFn: () => adminApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
    retry: false,
  });
  const { data: sessionsResp, isLoading: sessionsLoading } = useQuery({
    queryKey: ["dashboardSessions"],
    queryFn: () => adminApi.getSessions({ page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });

  const users = toList(usersResp);
  const mentors = toList(mentorsResp);
  const skills = toList(skillsResp);
  const approvedMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "APPROVED");
  const pendingMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "PENDING");
  const rejectedMentors = mentors.filter((mentor) => String(mentor.status).toUpperCase() === "REJECTED");
  const averageRate = mentors.length
    ? Math.round(mentors.reduce((sum, mentor) => sum + Number(mentor.hourlyRate || 0), 0) / mentors.length)
    : 0;

  const mentorById = useMemo(() => new Map(mentors.map((mentor) => [Number(mentor.id), mentor])), [mentors]);
  const skillById = useMemo(() => new Map(skills.map((skill) => [Number(skill.id), skill.name || `Skill ${skill.id}`])), [skills]);

  const mentorSessionQueries = useQueries({
    queries: approvedMentors.slice(0, 50).map((mentor) => ({
      queryKey: ["dashboardMentorSessions", mentor.id],
      queryFn: () => adminApi.getSessionsByMentor(mentor.id, { page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
      enabled: Boolean(mentor.id),
      retry: false,
    })),
  });

  const sessions = useMemo(() => {
    const byId = new Map();
    toList(sessionsResp).forEach((session) => {
      if (session?.id) byId.set(Number(session.id), session);
    });
    mentorSessionQueries.forEach((query) => {
      toList(query.data).forEach((session) => {
        if (session?.id) byId.set(Number(session.id), session);
      });
    });
    return [...byId.values()]
      .filter((session) => {
        const mentor = mentorById.get(Number(session.mentorId));
        return mentor && !isPlaceholderMentor(mentor);
      })
      .sort((left, right) => Number(right.id || 0) - Number(left.id || 0));
  }, [mentorById, mentorSessionQueries, sessionsResp]);

  const completedSessions = sessions.filter((session) => sessionStatus(session) === "COMPLETED");
  const requestedSessions = sessions.filter((session) => sessionStatus(session) === "REQUESTED");
  const acceptedSessions = sessions.filter((session) => sessionStatus(session) === "ACCEPTED");
  const approvedMentorEmails = new Set(approvedMentors.map((mentor) => String(mentor.email || "").trim().toLowerCase()).filter(Boolean));
  const totalLearners = users.filter((user) => {
    const roleText = String(user.role || user.roles?.join(" ") || "").toUpperCase();
    const email = String(user.email || "").trim().toLowerCase();
    if (roleText.includes("ADMIN")) return false;
    if (roleText.includes("MENTOR") || approvedMentorEmails.has(email)) return false;
    return true;
  }).length;
  const revenueEstimate = completedSessions.reduce((sum, session) => {
    const mentor = mentorById.get(Number(session.mentorId));
    const rate = Number(mentor?.hourlyRate || mentor?.rate || 0);
    const hours = Number(session.durationMinutes || 60) / 60;
    return sum + rate * hours;
  }, 0);

  const mostRequestedSkills = useMemo(() => {
    const counts = new Map();
    const source = sessions.length ? sessions : approvedMentors.map((mentor) => ({ mentorId: mentor.id }));
    source.forEach((session) => {
      const mentor = mentorById.get(Number(session.mentorId));
      getMentorSkillNames(mentor, skillById).forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
    });
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [approvedMentors, mentorById, sessions, skillById]);

  const monthlySessionGrowth = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return { key: monthKey(month), label: monthLabel(month), count: 0 };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));
    sessions.forEach((session) => {
      const date = getSessionDate(session);
      const entry = date ? monthMap.get(monthKey(date)) : null;
      if (entry) entry.count += 1;
    });
    const max = Math.max(1, ...months.map((month) => month.count));
    return months.map((month) => ({
      ...month,
      width: month.count ? Math.max(8, Math.round((month.count / max) * 100)) : 0,
    }));
  }, [now, sessions]);

  const approvalRate = mentors.length ? Math.round((approvedMentors.length / mentors.length) * 100) : 0;
  const rejectedRate = mentors.length ? Math.round((rejectedMentors.length / mentors.length) * 100) : 0;
  const skillCoverage = Math.min(skills.length * 6, 100);
  const reviewQueries = useQueries({
    queries: approvedMentors.slice(0, 20).map((mentor) => ({
      queryKey: ["adminDashboardReviews", mentor.id],
      queryFn: () => learnerApi.getMentorReviews(mentor.id, { page: 0, size: 20, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentor.id),
      retry: false,
    })),
  });
  const reviews = reviewQueries.flatMap((query) => toList(query.data));
  const topRatedMentors = useMemo(() => {
    const grouped = new Map();
    reviews.forEach((review) => {
      const mentorId = Number(review.mentorId);
      if (!mentorId) return;
      const current = grouped.get(mentorId) || { count: 0, total: 0 };
      grouped.set(mentorId, { count: current.count + 1, total: current.total + Number(review.rating || 0) });
    });
    return [...grouped.entries()]
      .map(([mentorId, value]) => {
        const mentor = mentorById.get(mentorId);
        return {
          id: mentorId,
          name: mentorDisplayName(mentor, mentorId),
          count: value.count,
          rating: value.count ? value.total / value.count : 0,
        };
      })
      .sort((left, right) => right.rating - left.rating || right.count - left.count)
      .slice(0, 3);
  }, [mentorById, reviews]);
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : "-";
  const fiveStarReviews = reviews.filter((review) => Number(review.rating) === 5).length;
  const reviewedMentorIds = new Set(reviews.map((review) => Number(review.mentorId)).filter(Boolean));
  const latestReviews = reviews
    .slice()
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 3);
  const isLoading = usersLoading || mentorsLoading || skillsLoading || sessionsLoading || mentorSessionQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Admin Console" description={`Platform overview - ${formattedDate}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} value={totalLearners} label="Total Learners" tone="blue" />
        <StatCard icon={CheckCircle2} value={approvedMentors.length} label="Active Mentors" tone="emerald" />
        <StatCard icon={CalendarCheck} value={completedSessions.length} label="Completed Sessions" tone="violet" />
        <StatCard icon={IndianRupee} value={formatCurrency(revenueEstimate)} label="Revenue Estimate" tone="orange" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_1.1fr]">
        <Card className="p-5">
          <AnalyticsTitle icon={Target} title="Most Requested Skills" description="Based on bookings and approved mentors" tone="blue" />
          <div className="mt-5 space-y-3">
            {mostRequestedSkills.length ? mostRequestedSkills.map((skill, index) => (
              <RankedRow key={skill.name} rank={index + 1} label={skill.name} value={`${skill.count} match${skill.count === 1 ? "" : "es"}`} tone="blue" />
            )) : (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-slate-800">No skill demand data yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <AnalyticsTitle icon={Award} title="Top Rated Mentors" description="Learner rating leaders" tone="amber" />
          <div className="mt-5 space-y-3">
            {topRatedMentors.length ? topRatedMentors.map((mentor, index) => (
              <RankedRow
                key={mentor.id}
                rank={index + 1}
                label={mentor.name}
                value={`${mentor.rating.toFixed(1)} / 5 (${mentor.count})`}
                tone="amber"
              />
            )) : (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-slate-800">No mentor ratings yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <AnalyticsTitle icon={TrendingUp} title="Monthly Session Growth" description="Last 6 months" tone="emerald" />
            <StatusBadge status={`${sessions.length} total`} />
          </div>
          <div className="space-y-3">
            {monthlySessionGrowth.map((month) => (
              <GrowthRow key={month.key} label={month.label} count={month.count} width={month.width} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Action Required</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Approve or reject mentor applications from Manage Users.
              </p>
            </div>
            <StatusBadge status={pendingMentors.length ? "Pending" : "Complete"} />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <MiniMetric icon={Clock} label="Pending" value={pendingMentors.length} tone="text-orange-500" />
            <MiniMetric icon={CheckCircle2} label="Approved" value={approvedMentors.length} tone="text-emerald-500" />
            <MiniMetric icon={XCircle} label="Rejected" value={rejectedMentors.length} tone="text-rose-500" />
          </div>

          <Link to="/admin/users" className="mt-5 block">
            <Button type="button" variant="secondary" className="w-full">
              Open Mentor Applications
            </Button>
          </Link>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Platform Performance</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Current health based on live platform records.
              </p>
            </div>
            <BarChart3 className="text-slate-400" size={22} />
          </div>

          {isLoading ? (
            <p className="text-sm font-semibold text-slate-500">Loading performance...</p>
          ) : (
            <div className="space-y-4">
              <PerformanceLine label="Mentor approval rate" value={approvalRate} helper={`${approvedMentors.length} of ${mentors.length} applications approved`} tone="bg-emerald-600" />
              <PerformanceLine label="Rejected applications" value={rejectedRate} helper={`${rejectedMentors.length} rejected`} tone="bg-rose-600" />
              <PerformanceLine label="Skill coverage" value={skillCoverage} helper={`${skills.length} skills available`} tone="bg-blue-600" />
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <MetricBox label="Average Mentor Rate" value={averageRate ? `₹${averageRate}/hr` : "-"} />
                <MetricBox label="Estimated Revenue" value={formatCurrency(revenueEstimate)} />
                <MetricBox label="Requested Sessions" value={requestedSessions.length} />
                <MetricBox label="Accepted Sessions" value={acceptedSessions.length} />
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/45">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-400">
                <Star fill="currentColor" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Review Activity</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Learner feedback from completed sessions, grouped into quick quality signals.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ReviewMetric label="Average Rating" value={averageRating} helper={reviews.length ? "Across all reviews" : "No reviews yet"} tone="amber" />
              <ReviewMetric label="Total Reviews" value={reviews.length} helper={`${reviewedMentorIds.size} mentors reviewed`} tone="blue" />
              <ReviewMetric label="5 Star Reviews" value={fiveStarReviews} helper="Best learner feedback" tone="emerald" />
            </div>
          </div>
        </div>
        {reviewQueries.some((query) => query.isLoading) ? (
          <p className="p-5 text-sm font-semibold text-slate-500">Loading reviews...</p>
        ) : latestReviews.length === 0 ? (
          <div className="p-5">
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
              <MessageSquareText className="mx-auto text-slate-400" size={28} />
              <p className="mt-3 text-sm font-extrabold text-slate-700 dark:text-slate-300">No learner reviews yet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Completed sessions will create review requests for learners.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {latestReviews.map((review) => {
              const mentor = mentors.find((item) => Number(item.id) === Number(review.mentorId));
              return (
                <div key={review.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Mentor</p>
                      <p className="mt-1 font-extrabold text-slate-950 dark:text-white">{mentorDisplayName(mentor, review.mentorId)}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400">
                      <div className="flex items-center gap-1 font-extrabold">
                        <Star fill="currentColor" size={16} />
                        {review.rating || "-"}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 min-h-12 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{review.comment || "-"}</p>
                  <p className="mt-3 text-xs font-bold uppercase text-slate-500">Session #{review.sessionId || "-"}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function AnalyticsTitle({ icon: Icon, title, description, tone }) {
  const tones = {
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.blue}`}>
        <Icon size={19} />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">{title}</h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function ReviewMetric({ label, value, helper, tone }) {
  const tones = {
    amber: "text-amber-400 bg-amber-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
  };
  return (
    <div className="min-w-40 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone] || tones.blue}`}>
        <Star fill="currentColor" size={15} />
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <Icon className={tone} size={18} />
      <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function RankedRow({ rank, label, value, tone }) {
  const tones = {
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
  };
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${tones[tone] || tones.blue}`}>
          {rank}
        </span>
        <span className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-200">{label}</span>
      </div>
      <span className="shrink-0 text-xs font-bold text-slate-500">{value}</span>
    </div>
  );
}

function GrowthRow({ label, count, width }) {
  return (
    <div className="grid grid-cols-[58px_1fr_34px] items-center gap-3">
      <span className="text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
      </div>
      <span className="text-right text-sm font-extrabold text-slate-800 dark:text-slate-200">{count}</span>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function PerformanceLine({ label, value, helper, tone }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

function sessionStatus(session) {
  return String(session?.status || "REQUESTED").toUpperCase();
}

function getSessionDate(session) {
  const rawValue = session?.sessionDateTime || session?.createdAt || session?.updatedAt;
  if (!rawValue) return null;
  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function formatCurrency(value) {
  return value ? `₹${Math.round(value).toLocaleString("en-IN")}` : "₹0";
}

function mentorDisplayName(mentor, fallbackId) {
  return mentor?.displayName || mentor?.fullName || mentor?.name || mentor?.email || `Mentor ${fallbackId}`;
}

function isPlaceholderMentor(mentor) {
  const label = String(mentor?.displayName || mentor?.name || mentor?.email || "").trim().toLowerCase();
  return ["mentor", "mentor 1", "mentor 2", "mentor 3"].includes(label);
}

function getMentorSkillNames(mentor, skillById) {
  if (!mentor) return [];
  const names = [
    ...(mentor.skills || []).map((skill) => skill?.name || skill).filter(Boolean),
    ...(mentor.skillNames || []),
    ...(mentor.skillIds || []).map((id) => skillById.get(Number(id)) || `Skill ${id}`),
  ];
  return [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];
}
