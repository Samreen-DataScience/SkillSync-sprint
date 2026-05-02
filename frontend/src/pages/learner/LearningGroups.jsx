import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, MessageSquare, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { groupApi } from "@/services/api/groupApi";
import { mentorApi } from "@/services/api/mentorApi";
import { userApi } from "@/services/api/userApi";
import { useAuthStore } from "@/store/auth-store";

export default function LearningGroups() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.userId;
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All Groups");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
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

  const enrichedGroups = useMemo(() => groups.map((group) => {
    const memberIds = membershipByGroupId.get(Number(group.id)) || [];
    return {
      ...group,
      displayName: groupName(group),
      joined: memberIds.includes(Number(userId)),
      memberCount: Math.max(Number(group.memberCount || 0), memberIds.length),
    };
  }), [groups, membershipByGroupId, userId]);

  const visible = useMemo(() => enrichedGroups.filter((group) => {
    const text = `${group.displayName} ${group.description || ""}`.toLowerCase();
    const queryMatch = text.includes(query.toLowerCase());
    const myGroup = tab !== "My Groups" || group.joined;
    return queryMatch && myGroup;
  }), [enrichedGroups, query, tab]);
  const selectedGroup = useMemo(() => enrichedGroups.find((group) => Number(group.id) === Number(selectedGroupId)), [enrichedGroups, selectedGroupId]);
  const listedGroups = useMemo(() => {
    if (tab !== "My Groups" || !selectedGroupId) return visible;
    return visible.filter((group) => Number(group.id) !== Number(selectedGroupId));
  }, [selectedGroupId, tab, visible]);

  useEffect(() => {
    if (tab !== "My Groups") {
      setSelectedGroupId(null);
      return;
    }
    if (selectedGroup && !selectedGroup.joined) {
      setSelectedGroupId(null);
    }
  }, [selectedGroup, tab]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["groupMessages", selectedGroupId],
    queryFn: () => groupApi.getMessages(selectedGroupId, { page: 0, size: 30, sortBy: "createdAt", sortDir: "asc" }),
    enabled: Boolean(selectedGroupId),
  });
  const messages = useMemo(() => toList(messagesData).sort(compareMessages), [messagesData]);
  const selectedMembers = useMemo(() => membershipByGroupId.get(Number(selectedGroupId)) || [], [membershipByGroupId, selectedGroupId]);
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

  const refreshGroups = () => {
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["groupMembers"] });
  };

  const joinGroup = useMutation({
    mutationFn: ({ groupId }) => groupApi.joinGroup(groupId, userId),
    onSuccess: () => {
      toast.success("Joined group");
      refreshGroups();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to join group"),
  });

  const leaveGroup = useMutation({
    mutationFn: ({ groupId }) => groupApi.leaveGroup(groupId, userId),
    onSuccess: () => {
      toast.success("Left group");
      refreshGroups();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to leave group"),
  });

  const sendMessage = useMutation({
    mutationFn: ({ groupId, text }) => groupApi.addMessage(groupId, { userId: Number(userId), message: text }),
    onSuccess: () => {
      setMessage("");
      toast.success("Message posted");
      queryClient.invalidateQueries({ queryKey: ["groupMessages", selectedGroupId] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Join the group before posting"),
  });

  const toggleMembership = (group) => {
    if (!userId) {
      toast.error("Please login as learner first");
      return;
    }
    if (group.joined) {
      if (Number(selectedGroupId) === Number(group.id)) {
        setSelectedGroupId(null);
      }
      leaveGroup.mutate({ groupId: group.id });
    } else {
      joinGroup.mutate({ groupId: group.id });
    }
  };

  const openGroup = (group) => {
    if (!group.joined) {
      toast.info("Join this group first, then you can open the chat.");
      return;
    }
    if (tab !== "My Groups") {
      setTab("My Groups");
    }
    setSelectedGroupId(group.id);
  };

  const submitMessage = (event) => {
    event.preventDefault();
    if (!selectedGroup?.joined) {
      toast.error("Join this group before posting");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    sendMessage.mutate({ groupId: selectedGroup.id, text: message.trim() });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Learning Groups" description="Join mentor-created groups, post doubts, and learn with peers" />
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups by name or topic..." className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white" /></div>
      <div className="flex gap-5 border-b border-slate-200 dark:border-slate-800">{["All Groups", "My Groups"].map((t) => <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-1 pb-3 text-sm font-extrabold ${tab === t ? "border-rose-600 text-rose-600" : "border-transparent text-slate-400"}`}>{t}</button>)}</div>

      {tab === "My Groups" && selectedGroup && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{selectedGroup.displayName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedGroup.description || "No description"}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{selectedGroup.memberCount || 0} members</p>
              </div>
              <div className="flex gap-2">
                {!selectedGroup.joined && <Button onClick={() => toggleMembership(selectedGroup)} disabled={joinGroup.isPending}>Join Group</Button>}
                <Button variant="secondary" onClick={() => setSelectedGroupId(null)}>Close</Button>
              </div>
            </div>
          </div>
          <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3 p-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold">Group description</p>
                    <p className="mt-1">{selectedGroup.description || "Use this group to ask doubts, share practice updates, and learn with your mentor and peers."}</p>
                  </div>
                </div>
              </div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-500"><MessageSquare size={16} /> Group Chat</h3>
              {messagesLoading ? (
                <p className="text-sm font-semibold text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500 dark:border-slate-800">No messages yet. Post your first doubt in this group.</div>
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
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a doubt or reply to the group..." className="h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
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

      {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading groups...</p> : listedGroups.length === 0 && !selectedGroup ? (
        <EmptyState title={tab === "My Groups" ? "You have not joined any groups yet" : "No groups available"} description={tab === "My Groups" ? "Join a group from All Groups to see it here." : "Mentor-created groups will appear here."} />
      ) : (
        <div className="space-y-4">{listedGroups.map((group) => <Card key={group.id} className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10"><Users size={20} /></div><div className="flex-1"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-extrabold text-slate-950 dark:text-white">{group.displayName}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{group.memberCount || 0} members</p></div><GroupActions group={group} tab={tab} onJoin={() => toggleMembership(group)} onLeave={() => toggleMembership(group)} onOpen={() => openGroup(group)} joining={joinGroup.isPending} leaving={leaveGroup.isPending} /></div><p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">{group.description || "No description"}</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{group.joined ? "Joined" : "Available to join"}</Badge>{tab === "My Groups" && <Badge tone="blue">Chat enabled</Badge>}</div></div></div></Card>)}</div>
      )}
    </div>
  );
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

function nameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const spaced = localPart.replace(/[._-]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
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

function GroupActions({ group, tab, onJoin, onLeave, onOpen, joining, leaving }) {
  if (tab === "My Groups") {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onOpen}>Open Chat</Button>
        <Button variant="danger" onClick={onLeave} disabled={leaving}>Leave</Button>
      </div>
    );
  }

  if (group.joined) {
    return <Badge tone="emerald">Already joined</Badge>;
  }

  return <Button onClick={onJoin} disabled={joining}>Join</Button>;
}
