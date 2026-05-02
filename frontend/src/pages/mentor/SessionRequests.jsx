import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { mentorApi } from "@/services/api/mentorApi";
import { userApi } from "@/services/api/userApi";
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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getLearnerName(session, learnersById) {
  const learner = learnersById.get(Number(session.learnerId));
  const resolvedName = learner?.fullName || learner?.name || learner?.displayName;
  if (resolvedName && !/^learner\s*\d*$/i.test(String(resolvedName).trim())) {
    return resolvedName;
  }
  if (session.learnerName && !/^learner\s*\d*$/i.test(String(session.learnerName).trim())) {
    return session.learnerName;
  }
  return (
    nameFromEmail(learner?.email) ||
    (session.learnerId ? `Learner ${session.learnerId}` : "Learner")
  );
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function isPendingStatus(status) {
  const normalized = String(status || "").toUpperCase();
  return normalized.includes("PENDING") || normalized.includes("REQUESTED");
}

function isAcceptedStatus(status) {
  return String(status || "").toUpperCase() === "ACCEPTED";
}

export default function SessionRequests() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const [meetingLinks, setMeetingLinks] = useState({});

  const {
    data: mentorData,
    isLoading: isLoadingProfiles,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["mentorProfilesForRequests", userId, user?.email],
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

  const requestQueries = useQueries({
    queries: requestLookupIds.map((id) => ({
      queryKey: ["mentorSessionRequests", id],
      queryFn: () => mentorApi.getMentorSessionRequests(id, { page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
      enabled: Boolean(id),
    })),
  });

  const allSessions = useMemo(() => {
    const byId = new Map();
    requestQueries.forEach((query) => {
      toList(query.data).forEach((session) => {
        if (session?.id) byId.set(session.id, session);
      });
    });
    return [...byId.values()];
  }, [requestQueries]);

  const learnerIds = useMemo(() => {
    const ids = allSessions.map((session) => session.learnerId).filter(Boolean).map(Number);
    return [...new Set(ids)];
  }, [allSessions]);

  const learnerQueries = useQueries({
    queries: learnerIds.map((id) => ({
      queryKey: ["sessionLearner", id],
      queryFn: () => userApi.resolveByAuthUserId(id),
      enabled: Boolean(id),
      retry: false,
    })),
  });

  const learnersById = useMemo(() => {
    const lookup = new Map();
    learnerIds.forEach((id, index) => {
      const query = learnerQueries[index];
      const learner = query.data;
      if (learner) lookup.set(Number(id), learner);
    });
    return lookup;
  }, [learnerIds, learnerQueries]);

  const requests = useMemo(
    () =>
      allSessions.filter((session) => {
        const belongsToThisMentor = mentorProfileIdSet.has(Number(session.mentorId));
        return belongsToThisMentor && isPendingStatus(session.status);
      }),
    [allSessions, mentorProfileIdSet]
  );

  const history = useMemo(
    () =>
      allSessions.filter((session) => {
        const belongsToThisMentor = mentorProfileIdSet.has(Number(session.mentorId));
        return belongsToThisMentor && !isPendingStatus(session.status);
      }),
    [allSessions, mentorProfileIdSet]
  );

  const refreshRequests = async () => {
    await refetchProfiles();
    await Promise.all(requestQueries.map((query) => query.refetch()));
    await queryClient.invalidateQueries({ queryKey: ["mentorDashboardRequests"] });
    await queryClient.invalidateQueries({ queryKey: ["mentorSessionRequests"] });
  };

  const acceptMutation = useMutation({
    mutationFn: mentorApi.acceptSession,
    onSuccess: () => {
      toast.success("Session accepted");
      refreshRequests();
    },
    onError: () => toast.error("Unable to accept session"),
  });

  const declineMutation = useMutation({
    mutationFn: mentorApi.declineSession,
    onSuccess: () => {
      toast.success("Session rejected");
      refreshRequests();
    },
    onError: () => toast.error("Unable to reject session"),
  });

  const completeMutation = useMutation({
    mutationFn: mentorApi.completeSession,
    onSuccess: () => {
      toast.success("Session completed");
      queryClient.invalidateQueries({ queryKey: ["adminAllSessions"] });
      queryClient.invalidateQueries({ queryKey: ["learnerCompletedSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      refreshRequests();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Only accepted sessions can be completed";
      toast.error(msg);
    },
  });

  const meetingLinkMutation = useMutation({
    mutationFn: ({ sessionId, meetingLink }) => mentorApi.updateMeetingLink(sessionId, meetingLink),
    onSuccess: () => {
      toast.success("Meeting link saved");
      queryClient.invalidateQueries({ queryKey: ["adminAllSessions"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
      refreshRequests();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Unable to save meeting link";
      toast.error(msg);
    },
  });

  const saveMeetingLink = (session) => {
    const meetingLink = String(meetingLinks[session.id] ?? session.meetingLink ?? "").trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(meetingLink)) {
      toast.error("Enter a valid meeting link starting with http or https");
      return;
    }
    meetingLinkMutation.mutate({ sessionId: session.id, meetingLink });
  };

  const isLoading = isLoadingProfiles || requestQueries.some((query) => query.isLoading);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Session Requests" description="Review and respond to incoming learner bookings" />
      {isLoading ? (
        <p className="text-sm font-semibold text-slate-500">Loading requests...</p>
      ) : requestLookupIds.length === 0 ? (
        <EmptyState title="Mentor profile not found" description="Create or approve this mentor profile before learner requests can appear here." />
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Pending Requests</h2>
              <p className="text-sm font-semibold text-slate-500">Approve or decline learner booking requests.</p>
            </div>
            {requests.length === 0 ? (
              <EmptyState title="No pending requests" description="New learner requests will appear here." />
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-950">{request.topic || "Mentoring Session"}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {getLearnerName(request, learnersById)} - {formatDateTime(request.sessionDateTime)} -{" "}
                          {request.durationMinutes || 60} min
                        </p>
                        <div className="mt-3"><StatusBadge status={request.status || "Pending"} /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate(request.id)}>Approve</Button>
                        <Button variant="danger" size="sm" disabled={declineMutation.isPending} onClick={() => declineMutation.mutate(request.id)}>Decline</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Session History</h2>
              <p className="text-sm font-semibold text-slate-500">Accepted, rejected, and completed sessions for this mentor.</p>
            </div>
            {history.length === 0 ? (
              <EmptyState title="No session history" description="Accepted or rejected sessions will appear here." />
            ) : (
              <div className="space-y-4">
                {history.map((session) => {
                  const linkValue = meetingLinks[session.id] ?? session.meetingLink ?? "";
                  return (
                  <Card key={session.id} className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-950">{session.topic || "Mentoring Session"}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {getLearnerName(session, learnersById)} - {formatDateTime(session.sessionDateTime)} -{" "}
                          {session.durationMinutes || 60} min
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={session.status || "Accepted"} />
                        {isAcceptedStatus(session.status) && (
                          <Button
                            variant="success"
                            size="sm"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate(session.id)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                    {isAcceptedStatus(session.status) && (
                      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1fr_auto]">
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                          Meeting link
                          <input
                            value={linkValue}
                            onChange={(event) => setMeetingLinks((current) => ({ ...current, [session.id]: event.target.value }))}
                            placeholder="https://meet.google.com/..."
                            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          />
                        </label>
                        <div className="flex flex-wrap items-end gap-2">
                          {session.meetingLink && (
                            <a
                              href={session.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-slate-700 hover:bg-white dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                              Open Link
                            </a>
                          )}
                          <Button
                            size="sm"
                            disabled={meetingLinkMutation.isPending}
                            onClick={() => saveMeetingLink(session)}
                          >
                            Save Link
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  </Card>
                );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
