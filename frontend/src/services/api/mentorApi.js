import { apiClient } from "./client";

export const mentorApi = {
  applyMentor: async (payload) => {
    const { data } = await apiClient.post("/mentors/apply", payload);
    return data;
  },
  getMentorByUserId: async (userId, email) => {
    const { data } = await apiClient.get(`/mentors/user/${userId}`, { params: { email } });
    return data;
  },
  updateMentorProfile: async (mentorId, payload) => {
    const { data } = await apiClient.put(`/mentors/${mentorId}`, payload);
    return data;
  },
  getDashboardStats: async () => {
    return { upcomingSessions: 0, activeLearners: 0, earnings: "-", rating: "-" };
  },
  getSessionRequests: async (userId, params) => {
    const { data } = await apiClient.get(`/sessions/user/${userId}`, { params });
    return data;
  },
  getMentorSessionRequests: async (mentorId, params) => {
    try {
      const { data } = await apiClient.get(`/sessions/mentor/${mentorId}`, { params });
      return data;
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) throw error;
      const { data } = await apiClient.get(`/sessions/user/${mentorId}`, { params });
      return data;
    }
  },
  getMentors: async (params) => {
    const { data } = await apiClient.get("/mentors", { params });
    return data;
  },
  getUserById: async (id) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  acceptSession: async (sessionId) => {
    const { data } = await apiClient.put(`/sessions/${sessionId}/accept`);
    return data;
  },
  declineSession: async (sessionId) => {
    const { data } = await apiClient.put(`/sessions/${sessionId}/reject`);
    return data;
  },
  completeSession: async (sessionId) => {
    const { data } = await apiClient.put(`/sessions/${sessionId}/complete`);
    return data;
  },
  updateMeetingLink: async (sessionId, meetingLink) => {
    const { data } = await apiClient.put(`/sessions/${sessionId}/meeting-link`, { meetingLink });
    return data;
  },
  getMyGroups: async (params) => {
    const { data } = await apiClient.get("/groups", { params });
    return data;
  },
  updateAvailability: async (mentorId, payload) => {
    const { data } = await apiClient.put(`/mentors/${mentorId}/availability`, payload);
    return data;
  },
};
