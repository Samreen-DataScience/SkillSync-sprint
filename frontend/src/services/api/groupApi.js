import { apiClient } from "./client";

export const groupApi = {
  getGroups: async (params) => {
    const { data } = await apiClient.get("/groups", { params });
    return data;
  },
  createGroup: async (payload) => {
    const { data } = await apiClient.post("/groups", payload);
    return data;
  },
  getMembers: async (groupId) => {
    const { data } = await apiClient.get(`/groups/${groupId}/members`);
    return data;
  },
  joinGroup: async (groupId, userId) => {
    const { data } = await apiClient.post(`/groups/${groupId}/join`, null, { params: { userId } });
    return data;
  },
  leaveGroup: async (groupId, userId) => {
    const { data } = await apiClient.post(`/groups/${groupId}/leave`, null, { params: { userId } });
    return data;
  },
  getMessages: async (groupId, params) => {
    const { data } = await apiClient.get(`/groups/${groupId}/messages`, { params });
    return data;
  },
  addMessage: async (groupId, payload) => {
    const { data } = await apiClient.post(`/groups/${groupId}/messages`, payload);
    return data;
  },
};
