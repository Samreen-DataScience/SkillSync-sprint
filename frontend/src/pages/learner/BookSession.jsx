import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, CalendarClock, ChevronLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageHeader } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";
import { useAuthStore } from "@/store/auth-store";

export default function BookSession() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [sessionDateTime, setSessionDateTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [topic, setTopic] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const { data: mentor } = useQuery({ queryKey: ["mentor", id], queryFn: () => learnerApi.getMentorById(id), enabled: Boolean(id) });
  const mentorName = mentor?.displayName || mentor?.name || mentor?.fullName || mentor?.email || `Mentor ${id}`;
  const slotOptions = useMemo(() => {
    return (mentor?.availabilitySlots || [])
      .filter((slot) => slot.available !== false)
      .map((slot) => {
        const startTime = normalizeTime(slot.startTime);
        const endTime = normalizeTime(slot.endTime);
        return {
          key: `${slot.dayOfWeek}-${startTime}-${endTime}`,
          dayOfWeek: slot.dayOfWeek,
          startTime,
          endTime,
          dateTime: nextDateTimeForSlot(slot.dayOfWeek, startTime),
          duration: durationFromSlot(startTime, endTime),
        };
      })
      .sort(compareSlotOptions);
  }, [mentor?.availabilitySlots]);

  const bookMutation = useMutation({
    mutationFn: learnerApi.bookSession,
    onSuccess: () => toast.success("Session request created"),
    onError: () => toast.error("Unable to create session request"),
  });

  const chooseSlot = (slot) => {
    setSelectedSlotKey(slot.key);
    setSessionDateTime(slot.dateTime);
    setDurationMinutes(slot.duration);
  };

  const confirm = () => {
    if (!user?.userId) return toast.error("Learner account required");
    if (!sessionDateTime || !topic.trim()) return toast.error("Date/time and topic are required");
    bookMutation.mutate({
      mentorId: Number(id),
      learnerId: user.userId,
      sessionDateTime,
      durationMinutes: Number(durationMinutes),
      topic,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/learner/mentors" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-rose-600">
        <ChevronLeft size={16} /> Back to Mentors
      </Link>
      <PageHeader title="Book a Session" description={`Send a session request to ${mentorName}`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-extrabold text-slate-950 dark:text-white">
            <Calendar size={18} /> Session Details
          </h2>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            Choose an available mentor slot or request a custom time.
          </div>
          {slotOptions.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">
                <CalendarClock size={17} />
                Available Mentor Slots
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {slotOptions.map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => chooseSlot(slot)}
                    className={`rounded-lg border p-3 text-left text-sm font-extrabold transition ${
                      selectedSlotKey === slot.key
                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-rose-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    }`}
                  >
                    <span className="block uppercase">{formatDay(slot.dayOfWeek)}</span>
                    <span className="mt-1 block text-xs text-slate-500">{slot.startTime} - {slot.endTime}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Date & Time
            <input
              type="datetime-local"
              value={sessionDateTime}
              onChange={(e) => {
                setSessionDateTime(e.target.value);
                setSelectedSlotKey("");
              }}
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Duration Minutes
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {[30, 60, 90, 120].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Topic
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="What do you want to learn?"
            />
          </label>
        </Card>
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-extrabold text-slate-950 dark:text-white">Session Summary</h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Mentor: {mentorName}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Availability: {selectedSlotKey ? "Mentor slot selected" : "Custom request"}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Learner: {user?.name || user?.email || "-"}</p>
          <Button className="mt-6 w-full" onClick={confirm} disabled={bookMutation.isPending}>
            <CreditCard size={16} /> {bookMutation.isPending ? "Submitting..." : "Confirm Booking"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

const DAY_INDEX = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function normalizeTime(value) {
  return String(value || "").slice(0, 5) || "10:00";
}

function nextDateTimeForSlot(dayOfWeek, time) {
  const now = new Date();
  const targetDay = DAY_INDEX[String(dayOfWeek || "").toUpperCase()] ?? now.getDay();
  const [hour, minute] = normalizeTime(time).split(":").map(Number);
  const date = new Date(now);
  const daysAhead = (targetDay - now.getDay() + 7) % 7;
  date.setDate(now.getDate() + daysAhead);
  date.setHours(hour || 0, minute || 0, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 7);
  return toDateTimeLocal(date);
}

function toDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function durationFromSlot(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return duration > 0 ? duration : 60;
}

function compareSlotOptions(left, right) {
  return (DAY_INDEX[left.dayOfWeek] ?? 0) - (DAY_INDEX[right.dayOfWeek] ?? 0) || left.startTime.localeCompare(right.startTime);
}

function formatDay(day) {
  return String(day || "").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}
