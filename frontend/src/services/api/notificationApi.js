import { apiClient } from "./client";

export const notificationApi = {
  getAllNotifications: async (params) => {
    const { data } = await apiClient.get("/notifications", { params });
    return data;
  },
  getUserNotifications: async (userId, params) => {
    const { data } = await apiClient.get(`/notifications/user/${userId}`, { params });
    return data;
  },
  getAdminUnreadCount: async () => {
    const { data } = await apiClient.get("/notifications/unread-count");
    return data;
  },
  getUnreadCount: async (userId) => {
    const { data } = await apiClient.get(`/notifications/user/${userId}/unread-count`);
    return data;
  },
  markRead: async (id) => {
    const { data } = await apiClient.put(`/notifications/${id}/read`);
    return data;
  },
};
