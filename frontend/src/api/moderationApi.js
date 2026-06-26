import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const moderationApi = {
    getPendingPosts: (params = {}) => axiosClient.get('/moderation/posts', { params: cleanParams(params) }),
    getPostDetail: (id) => axiosClient.get(`/moderation/posts/${id}`),
    approvePost: (id) => axiosClient.put(`/moderation/posts/${id}/approve`),
    rejectPost: (id, reason) => axiosClient.put(`/moderation/posts/${id}/reject`, { reason }),
    getUsers: (params = {}) => axiosClient.get('/moderation/users', { params: cleanParams(params) }),
    getUserDetail: (id) => axiosClient.get(`/moderation/users/${id}`),
    banUser: (id, payload) => axiosClient.put(`/moderation/users/${id}/ban`, payload),
    clearUserPenalties: (id) => axiosClient.put(`/moderation/users/${id}/penalties/clear`),
    getMyLogs: (params = {}) => axiosClient.get('/moderation-logs/my-history', { params: cleanParams(params) }),
    getLogs: (params = {}) => axiosClient.get('/moderation-logs', { params: cleanParams(params) }),
    getMyLogTargetDetail: (params = {}) => axiosClient.get('/moderation-logs/my-history/target-detail', { params: cleanParams(params) }),
    getLogTargetDetail: (params = {}) => axiosClient.get('/moderation-logs/target-detail', { params: cleanParams(params) }),
}

export default moderationApi
