import { apiClient } from "./client";

export const learnerApi = {
  getMentors: async (params) => {
    const { data } = await apiClient.get("/mentors", { params });
    return data;
  },
  getMentorById: async (id) => {
    const { data } = await apiClient.get(`/mentors/${id}`);
    return data;
  },
  bookSession: async (payload) => {
    const { data } = await apiClient.post("/sessions", payload);
    return data;
  },
  getMySessions: async (userId, params) => {
    const { data } = await apiClient.get(`/sessions/user/${userId}`, { params });
    return data;
  },
  submitReview: async (payload) => {
    const { data } = await apiClient.post("/reviews", payload);
    return data;
  },
  getMentorReviews: async (mentorId, params) => {
    const { data } = await apiClient.get(`/reviews/mentor/${mentorId}`, { params });
    return data;
  },
  getSkills: async (params) => {
    const { data } = await apiClient.get("/skills", { params });
    return data;
  },
  getUserById: async (id) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
};
