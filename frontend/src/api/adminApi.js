/**
 * Admin API - Quản trị hệ thống
 */
import axiosClient from './axiosClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

// ─── API Methods ──────────────────────────────────────────────────────────────

const adminApi = {
    // ── Dashboard ────────────────────────────────────────────────────────
    getDashboardStats: () => axiosClient.get('/admin/stats'),

    // ── User Management ─────────────────────────────────────────────────
    getUsers: (params = {}) => axiosClient.get('/admin/users', { params: cleanParams(params) }),
    updateUserStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }),

    // ── Internal Users (Admin/Manager/Moderator) ─────────────────────────
    getInternalUsers: (params = {}) => axiosClient.get('/admin/internal-users', { params: cleanParams(params) }),
    createInternalUser: (payload) => axiosClient.post('/admin/internal-users', payload),
    updateInternalUser: (id, payload) => axiosClient.put(`/admin/internal-users/${id}`, payload),
    deleteInternalUser: (id) => axiosClient.delete(`/admin/internal-users/${id}`),

    // ── Backups ─────────────────────────────────────────────────────────
    runBackup: () => axiosClient.post('/admin/backups/run'),

    // ── Audit Logs ──────────────────────────────────────────────────────
    getAuditLogs: (params = {}) => axiosClient.get('/admin/audit-logs', { params: cleanParams(params) }),

    // ── Shared Views ────────────────────────────────────────────────────
    getPosts: (params = {}) => axiosClient.get('/posts', { params: cleanParams(params) }),
    getReports: (params = {}) => axiosClient.get('/reports', { params: cleanParams(params) }),
}

export default adminApi
