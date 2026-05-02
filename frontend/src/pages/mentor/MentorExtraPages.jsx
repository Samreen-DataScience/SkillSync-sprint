import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Info, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { groupApi } from "@/services/api/groupApi";
import { mentorApi } from "@/services/api/mentorApi";
import { userApi } from "@/services/api/userApi";
import { useAuthStore } from "@/store/auth-store";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function MentorGroups() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.userId;
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [message, setMessage] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["mentorGroups"],
    queryFn: () => groupApi.getGroups({ page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
  });
  const { data: mentorData } = useQuery({
    queryKey: ["groupMentorProfiles"],
    queryFn: () => mentorApi.getMentors({ status: "ALL", page: 0, size: 100, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });
  const groups = useMemo(() => toList(data), [data]);
  const mentorByUserId = useMemo(() => {
    const map = new Map();
    toList(mentorData).forEach((mentor) => {
      if (Number.isFinite(Number(mentor.userId))) {
        map.set(Number(mentor.userId), mentor);
      }
    });
    return map;
  }, [mentorData]);
  const memberQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["groupMembers", group.id],
      queryFn: () => groupApi.getMembers(group.id),
      enabled: Boolean(group.id),
      retry: false,
    })),
  });
  const membershipByGroupId = useMemo(() => {
    const map = new Map();
    groups.forEach((group, index) => {
      map.set(Number(group.id), toList(memberQueries[index]?.data).map((member) => Number(member.userId)));
    });
    return map;
  }, [groups, memberQueries]);
  const mentorGroups = useMemo(() => groups.map((group) => {
    const memberIds = membershipByGroupId.get(Number(group.id)) || [];
    return {
      ...group,
      displayName: groupName(group),
      isMine: Number(group.createdBy) === Number(userId) || memberIds.includes(Number(userId)),
      memberCount: Math.max(Number(group.memberCount || 0), memberIds.length),
    };
  }).filter((group) => group.isMine), [groups, membershipByGroupId, userId]);
  const selectedGroup = useMemo(() => mentorGroups.find((group) => Number(group.id) === Number(selectedGroupId)), [mentorGroups, selectedGroupId]);
  const listedMentorGroups = useMemo(() => {
    if (!selectedGroupId) return mentorGroups;
    return mentorGroups.filter((group) => Number(group.id) !== Number(selectedGroupId));
  }, [mentorGroups, selectedGroupId]);
  const selectedMembers = useMemo(() => membershipByGroupId.get(Number(selectedGroupId)) || [], [membershipByGroupId, selectedGroupId]);
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["groupMessages", selectedGroupId],
    queryFn: () => groupApi.getMessages(selectedGroupId, { page: 0, size: 30, sortBy: "createdAt", sortDir: "asc" }),
    enabled: Boolean(selectedGroupId),
  });
  const messages = useMemo(() => toList(messagesData).sort(compareMessages), [messagesData]);
  const userIds = useMemo(() => [...new Set([...selectedMembers, ...messages.map((item) => Number(item.userId))].filter(Number.isFinite))], [selectedMembers, messages]);
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["groupUser", id],
      queryFn: () => userApi.resolveByAuthUserId(id),
      enabled: Boolean(id),
      retry: false,
    })),
  });
  const userById = useMemo(() => new Map(userIds.map((id, index) => [id, userQueries[index]?.data]).filter(([, profile]) => Boolean(profile))), [userIds, userQueries]);

  const createGroup = useMutation({
    mutationFn: (payload) => groupApi.createGroup(payload),
    onSuccess: () => {
      toast.success("Group created");
      setForm({ name: "", description: "" });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["mentorGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers"] });
    },
    onError: () => toast.error("Unable to create group"),
  });

  const sendMessage = useMutation({
    mutationFn: ({ groupId, text }) => groupApi.addMessage(groupId, { userId: Number(userId), message: text }),
    onSuccess: () => {
      setMessage("");
      toast.success("Message posted");
      queryClient.invalidateQueries({ queryKey: ["groupMessages", selectedGroupId] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to post message"),
  });

  const create = () => {
    if (!userId) {
      toast.error("Please login as mentor first");
      return;
    }
    setShowCreateForm(true);
  };

  const submitCreate = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    createGroup.mutate({
      name: form.name.trim(),
      description: form.description.trim() || "Practice and discussion group",
      createdBy: Number(userId),
    });
  };

  const submitMessage = (event) => {
    event.preventDefault();
    if (!selectedGroup) return;
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    sendMessage.mutate({ groupId: selectedGroup.id, text: message.trim() });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Groups" description="Groups you created or joined" action={<Button onClick={create}>Create Group</Button>} />
      {showCreateForm && (
        <Card className="p-5">
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Create Mentor Group</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Create a subject or practice group that learners can join.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                Group Name
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Example: Python beginners" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                Description
                <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Example: Weekly practice and learner doubts" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={createGroup.isPending}>{createGroup.isPending ? "Creating..." : "Create Group"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {selectedGroup && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{selectedGroup.displayName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedGroup.description || "No description"}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{selectedMembers.length} members</p>
              </div>
              <Button variant="secondary" onClick={() => setSelectedGroupId(null)}>Close</Button>
            </div>
          </div>
          <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3 p-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold">Pinned group purpose</p>
                    <p className="mt-1">{selectedGroup.description || "Use this group to answer learner doubts, share practice prompts, and keep the discussion focused."}</p>
                  </div>
                </div>
              </div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-500"><MessageSquare size={16} /> Group Chat</h3>
              {messagesLoading ? (
                <p className="text-sm font-semibold text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500 dark:border-slate-800">No messages yet. Learner doubts and mentor replies will appear here.</div>
              ) : (
                <div className="max-h-80 space-y-3 overflow-auto rounded-xl bg-slate-50 p-4 pr-2 dark:bg-slate-950">
                  {messages.map((item) => {
                    const mine = Number(item.userId) === Number(userId);
                    return (
                      <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-sm bg-rose-600 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-200"}`}>
                          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-extrabold ${mine ? "text-rose-100" : "text-slate-500"}`}>
                            <span>{mine ? "You" : displayNameForMember(item.userId, selectedGroup, userById, mentorByUserId)}</span>
                            <span className={mine ? "text-rose-100/80" : "text-slate-400"}>{memberRole(item.userId, selectedGroup, mentorByUserId)}</span>
                            <span className={mine ? "text-rose-100/80" : "text-slate-400"}>{formatMessageTime(item.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold">{item.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <form onSubmit={submitMessage} className="flex flex-col gap-3 sm:flex-row">
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Reply to learners..." className="h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <Button type="submit" disabled={sendMessage.isPending}>{sendMessage.isPending ? "Posting..." : "Post"}</Button>
              </form>
            </div>
            <div className="border-t border-slate-200 p-5 dark:border-slate-800 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Members</h3>
              <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{selectedMembers.length}</p>
              <div className="mt-4 space-y-2">
                {selectedMembers.map((memberId) => (
                  <div key={memberId} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-extrabold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{initials(displayNameForMember(memberId, selectedGroup, userById, mentorByUserId))}</div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{Number(memberId) === Number(userId) ? `${displayNameForMember(memberId, selectedGroup, userById, mentorByUserId)} (You)` : displayNameForMember(memberId, selectedGroup, userById, mentorByUserId)}</p>
                      <p className="text-xs font-semibold text-slate-500">{memberRole(memberId, selectedGroup, mentorByUserId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
      {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading groups...</p> : listedMentorGroups.length === 0 && !selectedGroup ? (
        <EmptyState title="No groups yet" description="Create a group for learners to join and ask doubts." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {listedMentorGroups.map((group) => (
            <Card key={group.id} className="p-5">
              <h3 className="font-extrabold text-slate-950 dark:text-white">{group.displayName}</h3>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{group.description || "No description"}</p>
              <p className="mt-4 text-sm font-extrabold text-slate-900 dark:text-white">{group.memberCount || 0} members</p>
              <Button className="mt-4" variant="secondary" onClick={() => setSelectedGroupId(group.id)}>Open Group</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Availability() {
  const user = useAuthStore((state) => state.user);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [draftSlot, setDraftSlot] = useState({ dayOfWeek: "MONDAY", startTime: "10:00", endTime: "11:00" });
  const [slots, setSlots] = useState([]);

  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ["mentorAvailabilityProfiles"],
    queryFn: () => mentorApi.getMentors({ status: "ALL", page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
    retry: false,
  });

  const mentorProfiles = useMemo(() => {
    const profiles = mentorsData?.content || mentorsData || [];
    return profiles.filter((profile) => {
      const sameUser = Number(profile.userId) === Number(user?.userId);
      const sameEmail = profile.email && user?.email && profile.email.toLowerCase() === user.email.toLowerCase();
      return sameUser || sameEmail;
    });
  }, [mentorsData, user?.email, user?.userId]);
  const profileUserIds = useMemo(() => [...new Set(mentorProfiles.map((profile) => Number(profile.userId)).filter(Number.isFinite))], [mentorProfiles]);
  const profileUserQueries = useQueries({
    queries: profileUserIds.map((id) => ({
      queryKey: ["availabilityUserProfile", id],
      queryFn: () => mentorApi.getUserById(id),
      retry: false,
    })),
  });
  const profileUserById = useMemo(() => new Map(profileUserIds.map((id, index) => [id, profileUserQueries[index]?.data]).filter(([, profile]) => Boolean(profile))), [profileUserIds, profileUserQueries]);
  const selectedMentor = mentorProfiles.find((profile) => String(profile.id) === selectedMentorId);

  useEffect(() => {
    if (!selectedMentorId && mentorProfiles.length > 0) {
      setSelectedMentorId(String(mentorProfiles[0].id));
    }
  }, [mentorProfiles, selectedMentorId]);

  useEffect(() => {
    const nextSlots = (selectedMentor?.availabilitySlots || [])
      .filter((slot) => slot.available !== false)
      .map((slot) => ({
        dayOfWeek: String(slot.dayOfWeek || "MONDAY").toUpperCase(),
        startTime: normalizeTime(slot.startTime),
        endTime: normalizeTime(slot.endTime),
        available: true,
      }));
    setSlots(nextSlots);
  }, [selectedMentor?.id, selectedMentor?.availabilitySlots]);

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => mentorApi.updateAvailability(id, payload),
    onSuccess: () => toast.success("Availability updated"),
    onError: () => toast.error("Unable to update availability"),
  });

  const addSlot = () => {
    if (!selectedMentorId) {
      toast.error("Approved mentor profile is required");
      return;
    }
    if (!draftSlot.startTime || !draftSlot.endTime || draftSlot.startTime >= draftSlot.endTime) {
      toast.error("Choose a valid start and end time");
      return;
    }
    const alreadyExists = slots.some((slot) =>
      slot.dayOfWeek === draftSlot.dayOfWeek &&
      slot.startTime === draftSlot.startTime &&
      slot.endTime === draftSlot.endTime
    );
    if (alreadyExists) {
      toast.error("This slot is already added");
      return;
    }
    setSlots((current) => [...current, { ...draftSlot, available: true }].sort(compareSlots));
  };

  const removeSlot = (slotToRemove) => {
    setSlots((current) => current.filter((slot) => !sameSlot(slot, slotToRemove)));
  };

  const submit = () => {
    if (!selectedMentorId) {
      toast.error("Approved mentor profile is required");
      return;
    }
    if (slots.length === 0) {
      toast.error("Add at least one weekly slot");
      return;
    }
    mutation.mutate({
      id: selectedMentorId,
      payload: {
        slots,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Availability" description="Build your weekly booking calendar for learners" />
      <Card className="p-5">
        {isLoading ? (
          <p className="text-sm font-semibold text-slate-500">Loading mentor profile...</p>
        ) : mentorProfiles.length === 0 ? (
          <EmptyState title="No approved mentor profile found" description="Create a mentor profile first and ask admin to approve it. Then availability can be saved here." />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                Mentor Name
                <select value={selectedMentorId} onChange={(event) => setSelectedMentorId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                  {mentorProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{getMentorProfileName(profile, profileUserById, user)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-rose-500" />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Add Weekly Slot</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  Day
                  <select
                    value={draftSlot.dayOfWeek}
                    onChange={(event) => setDraftSlot((current) => ({ ...current, dayOfWeek: event.target.value }))}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {DAYS.map((day) => <option key={day}>{day}</option>)}
                  </select>
                </label>
                <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  Start
                  <input
                    type="time"
                    value={draftSlot.startTime}
                    onChange={(event) => setDraftSlot((current) => ({ ...current, startTime: event.target.value }))}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  End
                  <input
                    type="time"
                    value={draftSlot.endTime}
                    onChange={(event) => setDraftSlot((current) => ({ ...current, endTime: event.target.value }))}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <Button type="button" onClick={addSlot}>
                  <Plus size={16} />
                  Add Slot
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-7">
              {DAYS.map((day) => {
                const daySlots = slots.filter((slot) => slot.dayOfWeek === day);
                return (
                  <div key={day} className="min-h-36 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-extrabold uppercase text-slate-500">{dayLabel(day)}</p>
                    <div className="mt-3 space-y-2">
                      {daySlots.length ? daySlots.map((slot) => (
                        <div key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`} className="rounded-lg bg-rose-50 p-2 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold">
                              <Clock size={13} />
                              {formatSlotTime(slot)}
                            </span>
                            <button type="button" onClick={() => removeSlot(slot)} className="rounded-md p-1 text-rose-500 hover:bg-rose-500/10" aria-label={`Remove ${formatSlotTime(slot)} on ${day}`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs font-semibold text-slate-400">No slots</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedMentor && (
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Saving {slots.length} slot{slots.length === 1 ? "" : "s"} for {getMentorProfileName(selectedMentor, profileUserById, user)}.
              </p>
            )}
            <Button className="mt-4" onClick={submit} disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Weekly Calendar"}</Button>
          </>
        )}
      </Card>
    </div>
  );
}

function getMentorProfileName(profile, profileUserById, authUser) {
  const profileUser = profileUserById.get(Number(profile.userId));
  const displayName = String(profile.displayName || "").trim();
  const authName = String(authUser?.name || "").trim();
  if (isRealMentorName(displayName)) return displayName;
  if (isRealMentorName(profileUser?.fullName)) return profileUser.fullName;
  if (isRealMentorName(profileUser?.name)) return profileUser.name;
  if (isRealMentorName(authName)) return authName;
  if (profile.email) return nameFromEmail(profile.email);
  if (profileUser?.email) return nameFromEmail(profileUser.email);
  if (authUser?.email) return nameFromEmail(authUser.email);
  return `Mentor ${profile.id}`;
}

function normalizeTime(value) {
  return String(value || "").slice(0, 5) || "10:00";
}

function compareSlots(left, right) {
  return DAYS.indexOf(left.dayOfWeek) - DAYS.indexOf(right.dayOfWeek) || left.startTime.localeCompare(right.startTime);
}

function sameSlot(left, right) {
  return left.dayOfWeek === right.dayOfWeek && left.startTime === right.startTime && left.endTime === right.endTime;
}

function dayLabel(day) {
  return day.slice(0, 3);
}

function formatSlotTime(slot) {
  return `${normalizeTime(slot.startTime)}-${normalizeTime(slot.endTime)}`;
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function compareMessages(left, right) {
  const leftTime = new Date(left?.createdAt || 0).getTime();
  const rightTime = new Date(right?.createdAt || 0).getTime();
  if (leftTime !== rightTime) return leftTime - rightTime;
  return Number(left?.id || 0) - Number(right?.id || 0);
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupName(group) {
  return String(group?.name || group?.title || "Untitled Group").trim();
}

function userName(user, fallbackId) {
  return String(user?.fullName || user?.name || nameFromEmail(user?.email) || `Learner ${fallbackId}`).trim();
}

function initials(name) {
  return String(name || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function displayNameForMember(memberId, group, userById, mentorByUserId) {
  const id = Number(memberId);
  const mentor = mentorByUserId.get(id);
  if (mentor || Number(group?.createdBy) === id) {
    return mentorName(mentor, id);
  }
  return userName(userById.get(id), id);
}

function memberRole(memberId, group, mentorByUserId) {
  const id = Number(memberId);
  return mentorByUserId.has(id) || Number(group?.createdBy) === id ? "Mentor" : "Learner";
}

function mentorName(mentor, fallbackId) {
  return String(mentor?.displayName || mentor?.name || nameFromEmail(mentor?.email) || `Mentor ${fallbackId}`).trim();
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
