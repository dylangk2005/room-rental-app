/**
 * Report API - Báo cáo bài đăng vi phạm
 */
import axiosClient from './axiosClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

// ─── API Methods ──────────────────────────────────────────────────────────────

const reportApi = {
    // ── Create ───────────────────────────────────────────────────────────
    createReport: ({ postId, reason, description, images = [] }) => {
        const formData = new FormData()
        formData.append('postId', postId)
        formData.append('reason', reason)
        if (description) {
            formData.append('description', description)
        }
        images.forEach((image) => {
            formData.append('images', image)
        })

        return axiosClient.post('/reports', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    // ── List ────────────────────────────────────────────────────────────
    getReports: (params = {}) => axiosClient.get('/reports', { params: cleanParams(params) }),
    getMyReports: (params = {}) => axiosClient.get('/reports/my-history', { params: cleanParams(params) }),
    getReportDetail: (id) => axiosClient.get(`/reports/${id}`),

    // ── Moderator Actions ───────────────────────────────────────────────
    resolveReport: (id, payload) => axiosClient.put(`/reports/${id}/resolve`, payload),
}

export default reportApi
