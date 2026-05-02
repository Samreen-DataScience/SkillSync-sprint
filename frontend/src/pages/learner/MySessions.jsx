import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";
import { useAuthStore } from "@/store/auth-store";

export default function MySessions() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ["mySessions", userId],
    queryFn: () => learnerApi.getMySessions(userId, { page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    enabled: Boolean(userId),
    retry: false,
  });
  const { data: mentorsResponse } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => learnerApi.getMentors({ status: "APPROVED", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });

  const sessions = useMemo(() => toList(data), [data]);
  const mentors = useMemo(() => toList(mentorsResponse), [mentorsResponse]);
  const mentorsById = useMemo(() => {
    const lookup = new Map();
    mentors.forEach((mentor) => {
      if (mentor.id) lookup.set(Number(mentor.id), mentor);
      if (mentor.userId) lookup.set(Number(mentor.userId), mentor);
    });
    return lookup;
  }, [mentors]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Sessions" description="Track upcoming, requested, accepted, and completed sessions" action={<Link to="/learner/mentors"><Button><CalendarPlus size={16} /> Book Session</Button></Link>} />
      <Card className="overflow-hidden">
        {isLoading ? <p className="p-5 text-sm font-semibold text-slate-500">Loading sessions...</p> : sessions.length === 0 ? (
          <EmptyState title="No sessions yet" description="Book your first mentor session to start learning." />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Topic</th><th>Mentor</th><th>Date & Time</th><th>Status</th><th>Meeting</th></tr></thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="font-extrabold text-slate-900">{session.topic || "Mentoring Session"}</td>
                    <td>{mentorNameForSession(session, mentorsById)}</td>
                    <td>{formatSessionDate(session)}</td>
                    <td><StatusBadge status={session.status || "Pending"} /></td>
                    <td><MeetingAction session={session} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function MeetingAction({ session }) {
  const status = String(session.status || "").toUpperCase();
  if (status === "COMPLETED") {
    return <span className="font-extrabold text-emerald-600">Already completed</span>;
  }
  if (["CANCELLED", "REJECTED", "DECLINED"].includes(status)) {
    return <span className="font-semibold text-slate-400">Not available</span>;
  }
  if (!session.meetingLink) {
    return <span className="font-semibold text-slate-400">Waiting for link</span>;
  }
  return (
    <a className="font-extrabold text-rose-600 hover:underline" href={session.meetingLink} target="_blank" rel="noreferrer">
      Join
    </a>
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
