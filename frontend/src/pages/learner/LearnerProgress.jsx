import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Award, BookOpenCheck, CalendarCheck, Flame, Star, Users } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";
import { useAuthStore } from "@/store/auth-store";

const toList = (payload) => payload?.content || payload || [];

export default function LearnerProgress() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;

  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["learnerProgressSessions", userId],
    queryFn: () => learnerApi.getMySessions(userId, { page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
    retry: false,
  });
  const { data: mentorData } = useQuery({
    queryKey: ["learnerProgressMentors"],
    queryFn: () => learnerApi.getMentors({ status: "APPROVED", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });

  const sessions = useMemo(() => toList(sessionData), [sessionData]);
  const mentors = useMemo(() => toList(mentorData), [mentorData]);
  const mentorsById = useMemo(() => new Map(mentors.map((mentor) => [Number(mentor.id), mentor])), [mentors]);
  const completedSessions = useMemo(
    () => sessions.filter((session) => String(session.status || "").toUpperCase() === "COMPLETED"),
    [sessions]
  );
  const acceptedSessions = useMemo(
    () => sessions.filter((session) => String(session.status || "").toUpperCase() === "ACCEPTED"),
    [sessions]
  );
  const connectedMentorIds = useMemo(
    () => [...new Set(sessions.map((session) => Number(session.mentorId)).filter(Boolean))],
    [sessions]
  );
  const completedMentorIds = useMemo(
    () => [...new Set(completedSessions.map((session) => Number(session.mentorId)).filter(Boolean))],
    [completedSessions]
  );

  const reviewQueries = useQueries({
    queries: completedMentorIds.map((mentorId) => ({
      queryKey: ["learnerProgressReviews", mentorId],
      queryFn: () => learnerApi.getMentorReviews(mentorId, { page: 0, size: 100, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentorId && userId),
      retry: false,
    })),
  });
  const reviewsGiven = useMemo(
    () => reviewQueries.flatMap((query) => toList(query.data)).filter((review) => Number(review.userId) === Number(userId)),
    [reviewQueries, userId]
  );
  const topics = useMemo(() => {
    const values = completedSessions
      .map((session) => String(session.topic || "").trim())
      .filter(Boolean)
      .map((topic) => titleCase(topic));
    return [...new Set(values)];
  }, [completedSessions]);
  const streakDays = useMemo(() => calculateLearningStreak(completedSessions), [completedSessions]);
  const reviewCompletion = completedSessions.length ? Math.round((reviewsGiven.length / completedSessions.length) * 100) : 0;
  const completionRate = sessions.length ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

  const isLoading = sessionsLoading || reviewQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Learning Progress"
        description="Track your completed sessions, skills learned, mentors connected, and review activity"
        action={<Link to="/learner/mentors"><Button>Find More Mentors</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={CalendarCheck} label="Completed Sessions" value={completedSessions.length} tone="emerald" />
        <StatCard icon={Users} label="Mentors Connected" value={connectedMentorIds.length} tone="blue" />
        <StatCard icon={BookOpenCheck} label="Topics Learned" value={topics.length} tone="violet" />
        <StatCard icon={Star} label="Reviews Given" value={reviewsGiven.length} tone="orange" />
        <StatCard icon={Flame} label="Learning Streak" value={`${streakDays} days`} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Progress Summary</h2>
          <div className="mt-5 space-y-5">
            <ProgressBar label="Session completion" value={completionRate} tone="emerald" />
            <ProgressBar label="Review completion" value={reviewCompletion} tone="orange" />
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-950 dark:text-white">{progressTitle(completedSessions.length)}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{progressMessage(completedSessions.length, acceptedSessions.length)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Skills & Topics Learned</h2>
          {topics.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Completed session topics will appear here.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => <Badge key={topic} tone="blue">{topic}</Badge>)}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Completed Session History</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Your finished learning sessions and review state.</p>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm font-semibold text-slate-500">Loading progress...</p>
        ) : completedSessions.length === 0 ? (
          <EmptyState title="No completed sessions yet" description="After a mentor marks a session complete, your progress will update here." />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Date</th><th>Mentor</th><th>Topic</th><th>Status</th><th>Review</th></tr>
              </thead>
              <tbody>
                {completedSessions.map((session) => {
                  const reviewed = reviewsGiven.some((review) => Number(review.sessionId) === Number(session.id));
                  return (
                    <tr key={session.id}>
                      <td>{formatDateTime(session.sessionDateTime)}</td>
                      <td className="font-extrabold">{mentorName(mentorsById.get(Number(session.mentorId)))}</td>
                      <td>{session.topic || "Mentoring Session"}</td>
                      <td><StatusBadge status={session.status || "Completed"} /></td>
                      <td>{reviewed ? <StatusBadge status="Reviewed" /> : <Link className="font-extrabold text-rose-600 hover:underline" to="/learner/reviews">Give review</Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function mentorName(mentor) {
  return mentor?.displayName || mentor?.name || mentor?.fullName || nameFromEmail(mentor?.email) || "Mentor";
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
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

function titleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function calculateLearningStreak(sessions) {
  const days = [...new Set(sessions.map((session) => {
    const date = new Date(session.sessionDateTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }).filter(Boolean))].sort().reverse();
  if (days.length === 0) return 0;
  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(days[index - 1]);
    const current = new Date(days[index]);
    const diffDays = Math.round((previous - current) / 86400000);
    if (diffDays === 1) streak += 1;
    else break;
  }
  return streak;
}

function progressTitle(completedCount) {
  if (completedCount >= 10) return "Strong learning momentum";
  if (completedCount >= 5) return "Growing steadily";
  if (completedCount > 0) return "Progress started";
  return "Ready to begin";
}

function progressMessage(completedCount, acceptedCount) {
  if (completedCount > 0) return `${completedCount} completed session${completedCount === 1 ? "" : "s"} recorded in your learning history.`;
  if (acceptedCount > 0) return "You have accepted sessions coming up. Complete them to build progress.";
  return "Book a mentor session to start building your progress record.";
}
