import { apiClient } from "./client";

export const adminApi = {
  getUsers: async (params) => {
    const { data } = await apiClient.get("/users", { params });
    return data;
  },
  getMentors: async (params) => {
    const { data } = await apiClient.get("/mentors", { params });
    return data;
  },
  approveMentor: async (mentorId) => {
    const { data } = await apiClient.put(`/mentors/${mentorId}/approve`);
    return data;
  },
  rejectMentor: async (mentorId, reason) => {
    const { data } = await apiClient.put(`/mentors/${mentorId}/reject`, reason ? { reason } : {});
    return data;
  },
  deleteMentor: async (mentorId) => {
    await apiClient.delete(`/mentors/${mentorId}`);
  },
  getSkills: async (params) => {
    const { data } = await apiClient.get("/skills", { params });
    return data;
  },
  createSkill: async (payload) => {
    const { data } = await apiClient.post("/skills", payload);
    return data;
  },
  getSessionsByUser: async (userId, params) => {
    const { data } = await apiClient.get(`/sessions/user/${userId}`, { params });
    return data;
  },
  getSessionsByMentor: async (mentorId, params) => {
    const { data } = await apiClient.get(`/sessions/mentor/${mentorId}`, { params });
    return data;
  },
  getSessions: async (params) => {
    const { data } = await apiClient.get("/sessions", { params });
    return data;
  },
  deleteUser: async (userId) => {
    await apiClient.delete(`/users/${userId}`);
  },
};
