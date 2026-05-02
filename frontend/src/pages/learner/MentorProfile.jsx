import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, GraduationCap, IndianRupee, Mail, MessageSquareText, Star, UserRoundCheck } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";

const toList = (payload) => payload?.content || payload || [];

export default function MentorProfile() {
  const { id } = useParams();
  const { data: mentor, isLoading: mentorLoading } = useQuery({
    queryKey: ["learnerMentorProfile", id],
    queryFn: () => learnerApi.getMentorById(id),
    enabled: Boolean(id),
    retry: false,
  });
  const { data: skillsResp } = useQuery({
    queryKey: ["learnerProfileSkills"],
    queryFn: () => learnerApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
    retry: false,
  });
  const { data: userProfile } = useQuery({
    queryKey: ["learnerMentorProfileUser", mentor?.userId],
    queryFn: () => learnerApi.getUserById(mentor.userId),
    enabled: Boolean(mentor?.userId),
    retry: false,
  });
  const { data: reviewResp, isLoading: reviewsLoading } = useQuery({
    queryKey: ["learnerPublicMentorReviews", id],
    queryFn: () => learnerApi.getMentorReviews(id, { page: 0, size: 20, sortBy: "createdAt", sortDir: "desc" }),
    enabled: Boolean(id),
    retry: false,
  });

  const skills = toList(skillsResp);
  const skillById = useMemo(() => new Map(skills.map((skill) => [Number(skill.id), skill])), [skills]);
  const mentorSkills = useMemo(() => getMentorSkills(mentor || {}, skillById), [mentor, skillById]);
  const reviews = toList(reviewResp);
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : "-";
  const mentorName = getMentorName(mentor || {}, userProfile);
  const mentorEmail = mentor?.email || userProfile?.email || "";
  const availability = formatAvailability(mentor?.availabilitySlots || []);
  const rate = mentor?.hourlyRate || mentor?.rate;

  if (mentorLoading) {
    return <p className="text-sm font-semibold text-slate-500">Loading mentor profile...</p>;
  }

  if (!mentor) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link to="/learner/mentors" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-rose-600">
          <ChevronLeft size={16} /> Back to Mentors
        </Link>
        <EmptyState title="Mentor not found" description="This mentor profile is not available right now." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/learner/mentors" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-rose-600">
        <ChevronLeft size={16} /> Back to Mentors
      </Link>
      <PageHeader
        title={mentorName}
        description="Review this mentor profile before booking a session"
        action={(
          <Link to={`/learner/mentors/${id}/book`}>
            <Button>Book Session</Button>
          </Link>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 via-orange-50 to-cyan-50 p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={mentorName} tone="rose" size="lg" />
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">{mentorName}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Mail size={15} /> {mentorEmail || "Email not listed"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="emerald">Approved Mentor</Badge>
                  <Badge tone="blue">{mentor?.experienceYears || mentor?.experience || "Experience not set"} yrs experience</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <ProfileMetric icon={GraduationCap} label="Subject" value={mentorSkills.length ? mentorSkills.map((skill) => skill.name).join(", ") : "Not listed"} />
            <ProfileMetric icon={CalendarClock} label="Availability" value={availability} />
            <ProfileMetric icon={IndianRupee} label="Rate" value={rate ? `₹${rate}/hr` : "Rate not set"} />
          </div>

          <div className="border-t border-slate-200 p-6 dark:border-slate-800">
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">About Mentor</h3>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
              {mentor?.bio || "This mentor has not added a bio yet."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {mentorSkills.length ? mentorSkills.map((skill) => (
                <Badge key={skill.id || skill.name} tone="rose">{skill.name}</Badge>
              )) : <Badge>No skills listed</Badge>}
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Average Rating</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{averageRating}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                <Star fill="currentColor" size={24} />
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500">{reviews.length} learner review{reviews.length === 1 ? "" : "s"}</p>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-extrabold text-slate-950 dark:text-white">
              <UserRoundCheck size={18} /> Booking Flow
            </h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <p>1. Pick a date, time, and topic.</p>
              <p>2. Mentor accepts or declines your request.</p>
              <p>3. After completion, you can submit a rating.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Learner Reviews</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Feedback appears after completed sessions.</p>
          </div>
          <MessageSquareText className="text-slate-400" size={22} />
        </div>
        {reviewsLoading ? (
          <p className="text-sm font-semibold text-slate-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet" description="This mentor has not received learner feedback yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <div key={review.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} fill="currentColor" size={16} className={value <= Number(review.rating || 0) ? "" : "text-slate-300 dark:text-slate-700"} />
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">{review.comment || "No comment added."}</p>
                <p className="mt-3 text-xs font-bold uppercase text-slate-500">Session #{review.sessionId || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ProfileMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <Icon className="text-rose-500" size={20} />
      <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold leading-6 text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function getMentorSkills(mentor, skillById) {
  const directSkills = (mentor.skills || []).map((skill) => {
    if (typeof skill === "string") return { name: skill };
    return skill;
  }).filter((skill) => skill?.name);
  const idSkills = (mentor.skillIds || []).map((id) => {
    const skill = skillById.get(Number(id));
    return skill || { id, name: `Skill ${id}` };
  });
  return [...directSkills, ...idSkills].filter((skill, index, list) => list.findIndex((item) => item.name === skill.name) === index);
}

function getMentorName(mentor, userProfile) {
  if (isRealMentorName(mentor.displayName)) return mentor.displayName;
  if (isRealMentorName(mentor.name)) return mentor.name;
  if (isRealMentorName(mentor.fullName)) return mentor.fullName;
  if (isRealMentorName(userProfile?.fullName)) return userProfile.fullName;
  if (isRealMentorName(userProfile?.name)) return userProfile.name;
  if (mentor.email) return nameFromEmail(mentor.email);
  if (userProfile?.email) return nameFromEmail(userProfile.email);
  return `Mentor ${mentor.id || mentor.userId || ""}`.trim();
}

function isRealMentorName(value) {
  const name = String(value || "").trim();
  return Boolean(name) && !/^mentor(?:\s*\d+)?$/i.test(name);
}

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatAvailability(slots = []) {
  const availableSlots = slots.filter((slot) => slot.available !== false);
  if (availableSlots.length === 0) return "Not set by mentor";
  return availableSlots.slice(0, 3).map((slot) => {
    const day = String(slot.dayOfWeek || "").toLowerCase();
    const label = day ? day.charAt(0).toUpperCase() + day.slice(1) : "Day";
    return `${label} ${slot.startTime || "-"}-${slot.endTime || "-"}`;
  }).join(", ");
}
