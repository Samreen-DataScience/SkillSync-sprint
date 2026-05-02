import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";
import { useAuthStore } from "@/store/auth-store";

const toList = (payload) => payload?.content || payload || [];

function mentorName(mentor) {
  return mentor?.displayName || mentor?.name || mentor?.email || (mentor?.id ? `Mentor ${mentor.id}` : "Mentor");
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

export default function Reviews() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const [drafts, setDrafts] = useState({});

  const { data: mentorData } = useQuery({
    queryKey: ["learnerReviewMentors"],
    queryFn: () => learnerApi.getMentors({ status: "APPROVED", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["learnerCompletedSessions", userId],
    queryFn: () => learnerApi.getMySessions(userId, { page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
    retry: false,
  });

  const mentors = toList(mentorData);
  const mentorsById = useMemo(() => new Map(mentors.map((mentor) => [Number(mentor.id), mentor])), [mentors]);
  const sessions = toList(sessionData);
  const completedSessions = useMemo(
    () => sessions.filter((session) => String(session.status || "").toUpperCase() === "COMPLETED"),
    [sessions]
  );

  const mentorIdsWithCompletedSessions = useMemo(
    () => [...new Set(completedSessions.map((session) => Number(session.mentorId)).filter(Boolean))],
    [completedSessions]
  );

  const reviewQueries = useQueries({
    queries: mentorIdsWithCompletedSessions.map((mentorId) => ({
      queryKey: ["learnerExistingReviews", mentorId],
      queryFn: () => learnerApi.getMentorReviews(mentorId, { page: 0, size: 100, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentorId),
      retry: false,
    })),
  });

  const existingReviews = useMemo(
    () => reviewQueries.flatMap((query) => toList(query.data)).filter((review) => Number(review.userId) === Number(userId)),
    [reviewQueries, userId]
  );

  const reviewedSessionIds = useMemo(
    () => new Set(existingReviews.map((review) => Number(review.sessionId)).filter(Boolean)),
    [existingReviews]
  );

  const pendingReviewSessions = useMemo(
    () => completedSessions.filter((session) => !reviewedSessionIds.has(Number(session.id))),
    [completedSessions, reviewedSessionIds]
  );

  const submitMutation = useMutation({
    mutationFn: learnerApi.submitReview,
    onSuccess: () => {
      setDrafts({});
      toast.success("Review submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["learnerExistingReviews"] });
      queryClient.invalidateQueries({ queryKey: ["learnerCompletedSessions"] });
      queryClient.invalidateQueries({ queryKey: ["adminMentorReviews"] });
      queryClient.invalidateQueries({ queryKey: ["mentorReviews"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || "Unable to submit review right now";
      toast.error(message);
    },
  });

  const updateDraft = (sessionId, patch) => {
    setDrafts((current) => ({
      ...current,
      [sessionId]: {
        rating: 5,
        comment: "",
        ...(current[sessionId] || {}),
        ...patch,
      },
    }));
  };

  const submitReview = (session) => {
    const draft = drafts[session.id] || { rating: 5, comment: "" };
    const comment = String(draft.comment || "").trim();
    if (!comment) {
      toast.error("Please add feedback before submitting the rating");
      return;
    }
    submitMutation.mutate({
      mentorId: Number(session.mentorId),
      userId: Number(userId),
      sessionId: Number(session.id),
      rating: Number(draft.rating || 5),
      comment,
    });
  };

  const isLoading = sessionsLoading || reviewQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reviews" description="Rate mentors after your completed sessions" />
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-slate-950 dark:text-white">Sessions Waiting For Rating</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              A review is available only after the mentor marks your session as completed.
            </p>
          </div>
          <StatusBadge status={`${pendingReviewSessions.length} pending`} />
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading completed sessions...</p>
      ) : completedSessions.length === 0 ? (
        <EmptyState title="No completed sessions yet" description="Completed sessions will appear here for ratings." />
      ) : pendingReviewSessions.length === 0 ? (
        <EmptyState title="All caught up" description="You have already reviewed every completed session." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {pendingReviewSessions.map((session) => {
            const mentor = mentorsById.get(Number(session.mentorId));
            const draft = drafts[session.id] || { rating: 5, comment: "" };
            return (
              <Card key={session.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{session.topic || "Mentoring Session"}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {mentorName(mentor)} - {formatDateTime(session.sessionDateTime)}
                    </p>
                  </div>
                  <CalendarCheck className="text-emerald-500" size={22} />
                </div>
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateDraft(session.id, { rating: value })}
                      className={value <= Number(draft.rating || 5) ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star fill="currentColor" size={24} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={draft.comment || ""}
                  onChange={(event) => updateDraft(session.id, { comment: event.target.value })}
                  className="mt-4 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholder={`Share feedback for ${mentorName(mentor)}`}
                />
                <Button className="mt-4 w-full" disabled={submitMutation.isPending} onClick={() => submitReview(session)}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Rating"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
