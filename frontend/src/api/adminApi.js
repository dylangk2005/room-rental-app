import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const adminApi = {
    getUsers: (params = {}) => axiosClient.get('/admin/users', { params: cleanParams(params) }),
    getInternalUsers: (params = {}) => axiosClient.get('/admin/internal-users', { params: cleanParams(params) }),
    createInternalUser: (payload) => axiosClient.post('/admin/internal-users', payload),
    updateInternalUser: (id, payload) => axiosClient.put(`/admin/internal-users/${id}`, payload),
    deleteInternalUser: (id) => axiosClient.delete(`/admin/internal-users/${id}`),
    updateUserStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }),
    runBackup: () => axiosClient.post('/admin/backups/run'),
    getAuditLogs: (params = {}) => axiosClient.get('/admin/audit-logs', { params: cleanParams(params) }),
}

export default adminApi
