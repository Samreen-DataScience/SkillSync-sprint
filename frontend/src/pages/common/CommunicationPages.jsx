import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCheck, Clock3, Filter, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { adminApi } from "@/services/api/adminApi";
import { learnerApi } from "@/services/api/learnerApi";
import { mentorApi } from "@/services/api/mentorApi";
import { notificationApi } from "@/services/api/notificationApi";
import { useAuthStore } from "@/store/auth-store";

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

function displayProfileName(profile) {
  return String(profile?.displayName || profile?.name || profile?.fullName || "").trim();
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatNotificationMessage(message, mentorNameById) {
  return String(message || "-").replace(/mentor profile (\d+)/gi, (_, id) => {
    const mentorName = mentorNameById.get(Number(id));
    return mentorName ? `mentor ${mentorName}` : `mentor profile ${id}`;
  });
}

function isAdminVisibleNotification(item) {
  const message = String(item?.message || item?.content || "").toLowerCase();
  return !message.startsWith("your ") && !message.includes("please give a rating") && !message.includes("request sent");
}

export function NotificationsPage({ role = "Learner" }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const [filter, setFilter] = useState("all");
  const isAdmin = role.toLowerCase() === "admin";
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", role, userId],
    queryFn: () =>
      isAdmin
        ? notificationApi.getAllNotifications({ page: 0, size: 30, sortBy: "createdAt", sortDir: "desc" })
        : notificationApi.getUserNotifications(userId, { page: 0, size: 20, sortBy: "createdAt", sortDir: "desc" }),
    enabled: isAdmin || Boolean(userId),
    retry: false,
  });
  const { data: adminMentorData } = useQuery({
    queryKey: ["notificationMentors", role],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: isAdmin,
    retry: false,
  });

  const items = isAdmin ? toList(data).filter(isAdminVisibleNotification) : toList(data);
  const mentorNameById = useMemo(() => {
    const lookup = new Map();
    toList(adminMentorData).forEach((mentor) => {
      const name = displayProfileName(mentor) || nameFromEmail(mentor.email) || `Mentor ${mentor.id}`;
      lookup.set(Number(mentor.id), name);
    });
    return lookup;
  }, [adminMentorData]);
  const unreadItems = items.filter((item) => String(item.status || "").toUpperCase() === "SENT");
  const readItems = items.filter((item) => String(item.status || "").toUpperCase() === "READ");
  const visibleItems = items.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    if (filter === "unread") return status === "SENT";
    if (filter === "read") return status === "READ";
    return true;
  });

  const readMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      toast.success("Notification marked as read");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
    },
    onError: () => toast.error("Unable to mark notification as read"),
  });

  const markAllMutation = useMutation({
    mutationFn: async () => Promise.all(unreadItems.map((item) => notificationApi.markRead(item.id))),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
    },
    onError: () => toast.error("Unable to mark all notifications as read"),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        description={isAdmin ? "Platform-wide session, mentor, and review updates" : `Important ${role.toLowerCase()} updates and activity`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => refetch()}>
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="secondary" disabled={unreadItems.length === 0 || markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
              <CheckCheck size={16} /> Mark all read
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <Card className="grid gap-3 p-4 sm:grid-cols-3">
          <NotificationStat label="All" value={items.length} />
          <NotificationStat label="Unread" value={unreadItems.length} tone="rose" />
          <NotificationStat label="Read" value={readItems.length} tone="emerald" />
        </Card>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            ["all", "All"],
            ["unread", "Unread"],
            ["read", "Read"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-extrabold transition ${
                filter === value
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Filter size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading notifications...</p>
      ) : items.length === 0 ? (
        <EmptyState title="No notifications yet" description="Only notifications created for your account will appear here." />
      ) : visibleItems.length === 0 ? (
        <EmptyState title={`No ${filter} notifications`} description="Try another filter or refresh after new activity." />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isUnread = String(item.status || "").toUpperCase() === "SENT";
            const event = notificationMeta(item.eventType || item.type);
            return (
              <Card key={item.id} className={`p-4 ${isUnread ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/10" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${event.tone}`}>
                      <event.icon size={16} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{event.label}</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Clock3 size={13} />
                          {formatNotificationTime(item.createdAt || item.eventTime)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{formatNotificationMessage(item.message || item.content || "-", mentorNameById)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={isUnread ? "Unread" : item.status || "Read"} />
                    {isUnread && (
                      <Button size="sm" variant="secondary" disabled={readMutation.isPending} onClick={() => readMutation.mutate(item.id)}>
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationStat({ label, value, tone = "slate" }) {
  const tones = {
    slate: "text-slate-950 dark:text-white",
    rose: "text-rose-600 dark:text-rose-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function notificationMeta(type) {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("COMPLETED")) {
    return { label: "Session Completed", icon: CheckCheck, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" };
  }
  if (normalized.includes("ACCEPTED")) {
    return { label: "Session Accepted", icon: CheckCheck, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" };
  }
  if (normalized.includes("REJECTED") || normalized.includes("CANCELLED")) {
    return { label: "Session Update", icon: BellRing, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" };
  }
  if (normalized.includes("MEETING_LINK")) {
    return { label: "Meeting Link Added", icon: BellRing, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" };
  }
  if (normalized.includes("BOOKED") || normalized.includes("REQUESTED")) {
    return { label: "Session Request", icon: BellRing, tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" };
  }
  if (normalized.includes("REVIEW")) {
    return { label: "Review Update", icon: Star, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" };
  }
  if (normalized.includes("MENTOR")) {
    return { label: "Mentor Update", icon: BellRing, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" };
  }
  return { label: "Notification", icon: BellRing, tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
}

function formatNotificationTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const absolute = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return `Just now (${absolute})`;
  if (minutes < 60) return `${minutes} min ago (${absolute})`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago (${absolute})`;
  return absolute;
}

export function MentorReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const { data: mentorData, isLoading: profilesLoading } = useQuery({
    queryKey: ["mentorReviewProfiles", userId, user?.email],
    queryFn: () => mentorApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
    retry: false,
  });

  const mentorProfiles = useMemo(() => {
    const currentEmail = clean(user?.email);
    const currentName = readableName(user?.name || user?.displayName || user?.fullName);
    const profiles = toList(mentorData).filter((profile) => String(profile.status || "").toUpperCase() === "APPROVED");
    const directMatches = profiles.filter((profile) => {
      const emailMatches = currentEmail && clean(profile.email) === currentEmail;
      const nameMatches = currentName && profileName(profile) === currentName;
      return emailMatches || nameMatches;
    });
    if (directMatches.length > 0) return directMatches;
    return profiles.filter((profile) => sameNumber(profile.userId, userId));
  }, [mentorData, user?.email, user?.name, user?.displayName, user?.fullName, userId]);

  const mentorIds = useMemo(
    () => [...new Set(mentorProfiles.map((profile) => Number(profile.id)).filter(Boolean))],
    [mentorProfiles]
  );

  const reviewQueries = useQueries({
    queries: mentorIds.map((mentorId) => ({
      queryKey: ["mentorReviews", mentorId],
      queryFn: () => learnerApi.getMentorReviews(mentorId, { page: 0, size: 50, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentorId),
      retry: false,
    })),
  });

  const reviews = useMemo(() => {
    const byId = new Map();
    reviewQueries.forEach((query) => {
      toList(query.data).forEach((review) => {
        if (review?.id) byId.set(review.id, review);
      });
    });
    return [...byId.values()];
  }, [reviewQueries]);
  const mentorNameById = useMemo(() => {
    const lookup = new Map();
    mentorProfiles.forEach((mentor) => {
      lookup.set(Number(mentor.id), displayProfileName(mentor) || nameFromEmail(mentor.email) || `Mentor ${mentor.id}`);
    });
    return lookup;
  }, [mentorProfiles]);

  const isLoading = profilesLoading || reviewQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Reviews" description="Read-only learner feedback for your completed sessions" />
      {isLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading reviews...</p>
      ) : mentorIds.length === 0 ? (
        <EmptyState title="Approved mentor profile not found" description="Reviews appear after your mentor profile is approved and learners submit feedback." />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Learner feedback will appear after completed sessions are reviewed." />
      ) : (
        <>
          <ReviewSummary reviews={reviews} title="Your Review Summary" />
          <ReviewList reviews={reviews} mentorNameById={mentorNameById} />
        </>
      )}
    </div>
  );
}

export function AdminReviewsPage() {
  const [selectedMentor, setSelectedMentor] = useState("");
  const { data: mentorData, isLoading: mentorsLoading } = useQuery({
    queryKey: ["adminReviewMentors"],
    queryFn: () => adminApi.getMentors({ status: "APPROVED", page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const mentors = toList(mentorData);
  const mentorIds = useMemo(() => mentors.map((mentor) => Number(mentor.id)).filter(Boolean), [mentors]);
  const reviewQueries = useQueries({
    queries: mentorIds.map((mentorId) => ({
      queryKey: ["adminMentorReviews", mentorId],
      queryFn: () => learnerApi.getMentorReviews(mentorId, { page: 0, size: 100, sortBy: "createdAt", sortDir: "desc" }),
      enabled: Boolean(mentorId),
      retry: false,
    })),
  });
  const mentorNameById = useMemo(() => {
    const lookup = new Map();
    mentors.forEach((mentor) => {
      lookup.set(Number(mentor.id), displayProfileName(mentor) || nameFromEmail(mentor.email) || `Mentor ${mentor.id}`);
    });
    return lookup;
  }, [mentors]);
  const allReviews = useMemo(() => {
    const byId = new Map();
    reviewQueries.forEach((query) => {
      toList(query.data).forEach((review) => {
        if (review?.id) byId.set(review.id, review);
      });
    });
    return [...byId.values()].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  }, [reviewQueries]);
  const reviews = selectedMentor ? allReviews.filter((review) => Number(review.mentorId) === Number(selectedMentor)) : allReviews;
  const mentorBreakdown = useMemo(() => {
    return mentors.map((mentor) => {
      const mentorReviews = allReviews.filter((review) => Number(review.mentorId) === Number(mentor.id));
      return {
        id: mentor.id,
        name: mentorNameById.get(Number(mentor.id)),
        count: mentorReviews.length,
        average: averageRatingValue(mentorReviews),
      };
    }).filter((item) => item.count > 0).sort((left, right) => right.average - left.average || right.count - left.count);
  }, [allReviews, mentorNameById, mentors]);
  const isReviewsLoading = reviewQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Review Insights" description="Learner ratings, latest comments, and mentor-wise review history" />
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Mentor Filter
            <select
              value={selectedMentor}
              onChange={(event) => setSelectedMentor(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {mentors.length === 0 && <option value="">No approved mentors</option>}
              {mentors.length > 0 && <option value="">All mentors</option>}
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>{mentorNameById.get(Number(mentor.id))}</option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-500">Showing</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{reviews.length} reviews</p>
          </div>
        </div>
      </Card>

      {mentorsLoading || isReviewsLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading reviews...</p>
      ) : mentors.length === 0 ? (
        <EmptyState title="No approved mentors" description="Approve mentor profiles before review insights can appear." />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Reviews for the selected mentor will appear here." />
      ) : (
        <>
          <ReviewSummary reviews={reviews} title={selectedMentor ? `${mentorNameById.get(Number(selectedMentor))} Review Summary` : "Platform Review Summary"} />
          {mentorBreakdown.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Mentor-Wise Review History</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {mentorBreakdown.map((mentor) => (
                  <button
                    key={mentor.id}
                    type="button"
                    onClick={() => setSelectedMentor(String(mentor.id))}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-rose-300 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-rose-500/50 dark:hover:bg-rose-500/10"
                  >
                    <p className="text-sm font-extrabold text-slate-950 dark:text-white">{mentor.name}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-2xl font-black text-amber-500">{mentor.average.toFixed(1)}</span>
                      <span className="text-xs font-bold uppercase text-slate-500">{mentor.count} review{mentor.count === 1 ? "" : "s"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
          <ReviewList reviews={reviews} mentorNameById={mentorNameById} />
        </>
      )}
    </div>
  );
}

function ReviewSummary({ reviews, title }) {
  const average = averageRatingValue(reviews);
  const total = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Number(review.rating) === rating).length,
  }));
  const latest = [...reviews].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0];

  return (
    <Card className="p-5">
      <div className="grid gap-5 xl:grid-cols-[280px_1fr_280px]">
        <div className="rounded-xl bg-amber-50 p-5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="text-sm font-extrabold uppercase tracking-wide">{title}</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black">{average ? average.toFixed(1) : "-"}</span>
            <span className="pb-2 text-lg font-extrabold">/ 5</span>
          </div>
          <div className="mt-3 flex gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={20} fill={value <= Math.round(average) ? "currentColor" : "none"} />)}
          </div>
          <p className="mt-3 text-sm font-semibold">{total} learner review{total === 1 ? "" : "s"}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Rating Distribution</h3>
          {distribution.map((item) => {
            const percent = total ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.rating} className="grid grid-cols-[48px_1fr_48px] items-center gap-3">
                <span className="text-sm font-extrabold text-slate-600 dark:text-slate-300">{item.rating} star</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-right text-sm font-extrabold text-slate-500">{item.count}</span>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Latest Comment</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">{latest?.comment || latest?.feedback || "No comment added."}</p>
          <p className="mt-3 text-xs font-bold text-slate-500">{formatReviewDate(latest?.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
}

function ReviewList({ reviews, mentorNameById }) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {mentorNameById?.get(Number(review.mentorId)) && <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-rose-600">{mentorNameById.get(Number(review.mentorId))}</p>}
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} size={17} fill={value <= Number(review.rating || 0) ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{review.comment || review.feedback || "-"}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {review.sessionId ? `Session #${review.sessionId}` : "Session not linked"} {formatReviewDate(review.createdAt) ? `- ${formatReviewDate(review.createdAt)}` : ""}
              </p>
            </div>
            <StatusBadge status={review.status || "Published"} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function averageRatingValue(reviews) {
  const ratings = reviews.map((review) => Number(review.rating || 0)).filter(Boolean);
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
