import axiosClient from './axiosClient'

const notificationApi = {
    getNotifications: (params = {}) => axiosClient.get('/notifications', { params }),
    getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
    markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => axiosClient.put('/notifications/read-all'),
}

export default notificationApi
