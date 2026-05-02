import { apiClient } from "./client";

export const userApi = {
  getById: async (id) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  getByAuthUserId: async (authUserId) => {
    const { data } = await apiClient.get(`/users/auth/${authUserId}`);
    return data;
  },
  getByAuthUserIdWithToken: async (authUserId, token) => {
    const { data } = await apiClient.get(`/users/auth/${authUserId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  },
  resolveByAuthUserId: async (authUserId) => {
    try {
      const { data } = await apiClient.get(`/users/auth/${authUserId}`);
      return data;
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) throw error;
      try {
        const { data } = await apiClient.get(`/users/${authUserId}`);
        return data;
      } catch (profileError) {
        const profileStatus = profileError?.response?.status;
        if (profileStatus !== 404 && profileStatus !== 405) throw profileError;
        const { data } = await apiClient.get(`/auth/users/${authUserId}`);
        return data;
      }
    }
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/users", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data;
  },
};
