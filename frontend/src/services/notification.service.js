import { apiService } from './api.service';

export const notificationService = {
  // Get all notifications for a user
  getAll: async (uid) => {
    try {
      return await apiService.get(`/notifications/${uid}`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        return { data: [] };
      }
      throw error;
    }
  },

  // Get unread notifications
  getUnread: async (uid) => {
    try {
      return await apiService.get(`/notifications/${uid}/unread`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        return { data: [] };
      }
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async (uid) => {
    try {
      return await apiService.get(`/notifications/${uid}/count`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        return { data: 0 };
      }
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: (id) => apiService.put(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: (uid) => apiService.put(`/notifications/${uid}/read-all`)
};
