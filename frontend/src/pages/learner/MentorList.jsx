import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { CalendarClock, GraduationCap, IndianRupee, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { learnerApi } from "@/services/api/learnerApi";

const DAYS = ["All", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function MentorList() {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("All");
  const [minRating, setMinRating] = useState("0");
  const [maxPrice, setMaxPrice] = useState("");
  const [minExperience, setMinExperience] = useState("0");
  const [availabilityDay, setAvailabilityDay] = useState("All");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["mentors"], queryFn: learnerApi.getMentors });
  const { data: skillData } = useQuery({
    queryKey: ["learnerSkills"],
    queryFn: () => learnerApi.getSkills({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }),
    retry: false,
  });

  const mentors = toList(data);
  const allSkills = toList(skillData);
  const skillById = useMemo(() => new Map(allSkills.map((item) => [Number(item.id), item])), [allSkills]);

  const userIds = useMemo(() => [...new Set(mentors.map((mentor) => Number(mentor.userId)).filter(Number.isFinite))], [mentors]);
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["mentorUserProfile", id],
      queryFn: () => learnerApi.getUserById(id),
      retry: false,
    })),
  });
  const userById = useMemo(() => new Map(userIds.map((id, index) => [id, userQueries[index]?.data]).filter(([, user]) => Boolean(user))), [userIds, userQueries]);

  const mentorIds = useMemo(() => [...new Set(mentors.map((mentor) => Number(mentor.id)).filter(Number.isFinite))], [mentors]);
  const reviewQueries = useQueries({
    queries: mentorIds.map((mentorId) => ({
      queryKey: ["mentorReviews", mentorId],
      queryFn: () => learnerApi.getReviewsByMentor(mentorId),
      retry: false,
    })),
  });
  const reviewStatsByMentorId = useMemo(() => {
    const stats = new Map();
    mentorIds.forEach((mentorId, index) => {
      const reviews = toList(reviewQueries[index]?.data).filter((review) => Number(review.rating) > 0);
      const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
      stats.set(mentorId, {
        average: reviews.length ? total / reviews.length : 0,
        count: reviews.length,
      });
    });
    return stats;
  }, [mentorIds, reviewQueries]);

  const skillOptions = useMemo(() => {
    const names = new Set();
    mentors.forEach((mentor) => getMentorSkills(mentor, skillById).forEach((item) => names.add(item.name)));
    return ["All", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [mentors, skillById]);

  const suggestions = useMemo(() => {
    const options = [];
    mentors.forEach((mentor) => {
      const name = getMentorName(mentor, userById);
      options.push({ type: "Mentor", label: name, value: name });
      getMentorSkills(mentor, skillById).forEach((item) => options.push({ type: "Skill", label: item.name, value: item.name }));
    });
    const unique = options.filter((item, index, list) => list.findIndex((entry) => entry.type === item.type && entry.label === item.label) === index);
    const q = query.trim().toLowerCase();
    return unique.filter((item) => !q || item.label.toLowerCase().includes(q)).slice(0, 8);
  }, [mentors, query, skillById, userById]);

  const rankedMentors = useMemo(() => mentors.map((mentor) => {
    const skills = getMentorSkills(mentor, skillById).map((item) => item.name);
    const text = `${getMentorName(mentor, userById)} ${getMentorEmail(mentor, userById)} ${mentor.bio || ""} ${mentor.role || ""} ${skills.join(" ")}`.toLowerCase();
    const queryParts = query.toLowerCase().split(/[ ,]+/).filter(Boolean);
    const rating = getAverageRating(mentor, reviewStatsByMentorId);
    const rate = Number(mentor.hourlyRate || mentor.rate || 0);
    const experienceYears = Number(mentor.experienceYears || mentor.experience || 0);
    const queryMatch = queryParts.length === 0 || queryParts.some((part) => text.includes(part));
    const skillMatch = skill === "All" || skills.some((name) => name.toLowerCase().includes(skill.toLowerCase()));
    const ratingMatch = Number(minRating) === 0 || rating >= Number(minRating);
    const priceMatch = !maxPrice || (rate > 0 && rate <= Number(maxPrice));
    const experienceMatch = Number(minExperience) === 0 || experienceYears >= Number(minExperience);
    const availabilityMatch = availabilityDay === "All" || hasAvailabilityOnDay(mentor, availabilityDay);
    const isMatch = queryMatch && skillMatch && ratingMatch && priceMatch && experienceMatch && availabilityMatch;
    return { mentor, isMatch, rating };
  }).sort((a, b) => {
    if (Number(b.isMatch) !== Number(a.isMatch)) return Number(b.isMatch) - Number(a.isMatch);
    return b.rating - a.rating;
  }), [availabilityDay, maxPrice, mentors, minExperience, minRating, query, reviewStatsByMentorId, skill, skillById, userById]);

  const hasSearch = Boolean(query.trim()) || skill !== "All" || minRating !== "0" || Boolean(maxPrice) || minExperience !== "0" || availabilityDay !== "All";
  const visibleMentors = hasSearch ? rankedMentors.filter((item) => item.isMatch) : rankedMentors;
  const matchCount = visibleMentors.length;

  const clearFilters = () => {
    setQuery("");
    setSkill("All");
    setMinRating("0");
    setMaxPrice("");
    setMinExperience("0");
    setAvailabilityDay("All");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Find a Mentor" description="Search approved mentors by name, skill, rating, price, availability, and experience." />
      <Card className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="Search mentor, skill, Java, Spring, backend..."
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[54px] z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
                {suggestions.map((item) => (
                  <button
                    key={`${item.type}-${item.label}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(item.type === "Mentor" ? item.value : "");
                      if (item.type === "Skill") setSkill(item.value);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span>{item.label}</span>
                    <Badge tone={item.type === "Skill" ? "blue" : "emerald"}>{item.type}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {skillOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Minimum Rating" value={minRating} onChange={setMinRating} options={[["0", "Any rating"], ["3", "3+ stars"], ["4", "4+ stars"], ["4.5", "4.5+ stars"]]} />
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-slate-500">Maximum Price</span>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="Example: 500"
            />
          </label>
          <FilterSelect label="Experience" value={minExperience} onChange={setMinExperience} options={[["0", "Any experience"], ["1", "1+ years"], ["2", "2+ years"], ["3", "3+ years"], ["5", "5+ years"]]} />
          <FilterSelect label="Availability" value={availabilityDay} onChange={setAvailabilityDay} options={DAYS.map((day) => [day, day === "All" ? "Any day" : titleCase(day)])} />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={16} className="text-slate-400" />
        {query && <button type="button" onClick={() => setQuery("")} className="filter-chip active">{query}<X size={13} /></button>}
        {skill !== "All" && <button type="button" onClick={() => setSkill("All")} className="filter-chip active">{skill}<X size={13} /></button>}
        {minRating !== "0" && <button type="button" onClick={() => setMinRating("0")} className="filter-chip active">{minRating}+ stars<X size={13} /></button>}
        {maxPrice && <button type="button" onClick={() => setMaxPrice("")} className="filter-chip active">Up to ₹{maxPrice}<X size={13} /></button>}
        {minExperience !== "0" && <button type="button" onClick={() => setMinExperience("0")} className="filter-chip active">{minExperience}+ yrs<X size={13} /></button>}
        {availabilityDay !== "All" && <button type="button" onClick={() => setAvailabilityDay("All")} className="filter-chip active">{titleCase(availabilityDay)}<X size={13} /></button>}
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {hasSearch ? `${matchCount} matching mentor${matchCount === 1 ? "" : "s"}` : `${mentors.length} approved mentor${mentors.length === 1 ? "" : "s"}`}
        </span>
        {hasSearch && <button type="button" onClick={clearFilters} className="text-sm font-extrabold text-rose-600 hover:text-rose-700">Clear filters</button>}
      </div>

      {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading mentors...</p> : mentors.length === 0 ? (
        <EmptyState title="No approved mentors yet" description="After a mentor creates a profile and admin approves it, that mentor will appear here." />
      ) : visibleMentors.length === 0 ? (
        <EmptyState title="No mentors match these filters" description="Try a different skill, rating, price, availability, or experience filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMentors.map(({ mentor, isMatch }) => (
            <MentorCard
              key={mentor.id || mentor.userId}
              mentor={mentor}
              skillById={skillById}
              userById={userById}
              reviewStatsByMentorId={reviewStatsByMentorId}
              isMatch={hasSearch && isMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      >
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function MentorCard({ mentor, skillById, userById, reviewStatsByMentorId, isMatch }) {
  const mentorId = mentor.id || mentor.userId;
  const name = getMentorName(mentor, userById);
  const email = getMentorEmail(mentor, userById);
  const skills = getMentorSkills(mentor, skillById);
  const rate = mentor.hourlyRate || mentor.rate;
  const availability = formatAvailability(mentor.availabilitySlots);
  const subject = skills.length ? skills.map((item) => item.name).join(", ") : "Subject not listed";
  const reviewStats = reviewStatsByMentorId.get(Number(mentor.id)) || { average: Number(mentor.averageRating || 0), count: 0 };

  return (
    <Card className={`flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${isMatch ? "border-rose-400 ring-2 ring-rose-500/30" : ""}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{name}</h3>
          {isMatch && <Badge tone="rose">Match</Badge>}
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">{email || "Approved mentor"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-500">
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" />
            {reviewStats.average ? reviewStats.average.toFixed(1) : "New"}
          </span>
          <span>{reviewStats.count} review{reviewStats.count === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ProfileRow icon={GraduationCap} label="Subject" value={subject} />
        <ProfileRow icon={CalendarClock} label="Availability" value={availability} />
        <ProfileRow icon={IndianRupee} label="Rate" value={rate ? `₹${rate}/hr` : "Rate not set"} />
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Experience</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">{mentor.experience || (mentor.experienceYears ? `${mentor.experienceYears} yrs` : "Not set")}</p>
        </div>
      </div>

      {mentor.bio && <p className="mt-4 line-clamp-2 text-sm font-medium text-slate-600 dark:text-slate-400">{mentor.bio}</p>}

      <div className="mt-4 flex min-h-8 flex-wrap gap-2">
        {skills.length ? skills.slice(0, 4).map((item) => <Badge key={`${mentorId}-${item.id || item.name}`}>{item.name}</Badge>) : <Badge>No skills listed</Badge>}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Link to={`/learner/mentors/${mentorId}`}>
          <Button size="sm" variant="secondary">View Profile</Button>
        </Link>
        <Link to={`/learner/mentors/${mentorId}/book`}>
          <Button size="sm">Book</Button>
        </Link>
      </div>
    </Card>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function getMentorSkills(mentor, skillById) {
  const directSkills = (mentor.skills || []).map((skill) => {
    if (typeof skill === "string") return { name: skill };
    return skill;
  }).filter((item) => item?.name);
  const idSkills = (mentor.skillIds || []).map((id) => {
    const skill = skillById.get(Number(id));
    return skill || { id, name: `Skill ${id}` };
  });
  return [...directSkills, ...idSkills].filter((skill, index, list) => list.findIndex((item) => item.name === skill.name) === index);
}

function getMentorName(mentor, userById) {
  const user = userById?.get(Number(mentor.userId));
  if (isRealMentorName(mentor.displayName)) return mentor.displayName;
  if (isRealMentorName(mentor.name)) return mentor.name;
  if (isRealMentorName(mentor.fullName)) return mentor.fullName;
  if (isRealMentorName(user?.fullName)) return user.fullName;
  if (isRealMentorName(user?.name)) return user.name;
  if (mentor.email) return nameFromEmail(mentor.email);
  if (user?.email) return nameFromEmail(user.email);
  return `Mentor ${mentor.id || mentor.userId}`;
}

function getMentorEmail(mentor, userById) {
  const user = userById?.get(Number(mentor.userId));
  return mentor.email || user?.email || "";
}

function getAverageRating(mentor, reviewStatsByMentorId) {
  const stats = reviewStatsByMentorId.get(Number(mentor.id));
  if (stats?.average) return stats.average;
  return Number(mentor.averageRating || 0);
}

function hasAvailabilityOnDay(mentor, day) {
  return (mentor.availabilitySlots || []).some((slot) => slot.available !== false && String(slot.dayOfWeek || "").toUpperCase() === day);
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

function titleCase(value) {
  const lower = String(value || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatAvailability(slots = []) {
  const availableSlots = slots.filter((slot) => slot.available !== false);
  if (availableSlots.length === 0) return "Not set by mentor";
  return availableSlots.slice(0, 2).map((slot) => {
    const day = titleCase(slot.dayOfWeek || "");
    return `${day || "Day"} ${slot.startTime || "-"}-${slot.endTime || "-"}`;
  }).join(", ");
}
