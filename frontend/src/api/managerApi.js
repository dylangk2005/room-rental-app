import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const downloadBlob = async (url, params, fileName, method = 'GET') => {
    let response;
    if (method === 'POST') {
        response = await axiosClient.post(url, params, {
            responseType: 'blob',
        })
    } else {
        response = await axiosClient.get(url, {
            params: cleanParams(params),
            responseType: 'blob',
        })
    }

    const blobUrl = window.URL.createObjectURL(response)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
}

const managerApi = {
    getUserStats: (params = {}) => axiosClient.get('/manager/stats/users', { params: cleanParams(params) }),
    getPostStats: (params = {}) => axiosClient.get('/manager/stats/posts', { params: cleanParams(params) }),
    getRevenueStats: (params = {}) => axiosClient.get('/manager/stats/revenue', { params: cleanParams(params) }),
    getModerationStats: (params = {}) => axiosClient.get('/manager/stats/moderation', { params: cleanParams(params) }),
    exportStats: ({ type, from, to }) => downloadBlob('/manager/stats/export', { type, from, to }, `${type.toLowerCase()}-stats.xlsx`),

    // List exports (POST with body)
    exportPostList: (request) => {
        const dateStr = new Date().toISOString().split('T')[0];
        return downloadBlob('/manager/stats/export/posts', request, `danh-sach-tin-dang-${dateStr}.xlsx`, 'POST');
    },
    exportUserList: (request) => {
        const dateStr = new Date().toISOString().split('T')[0];
        return downloadBlob('/manager/stats/export/users', request, `danh-sach-nguoi-dung-${dateStr}.xlsx`, 'POST');
    },
    exportTransactionList: (request) => {
        const dateStr = new Date().toISOString().split('T')[0];
        return downloadBlob('/manager/stats/export/transactions', request, `giao-dich-${dateStr}.xlsx`, 'POST');
    },
    exportReportList: (request) => {
        const dateStr = new Date().toISOString().split('T')[0];
        return downloadBlob('/manager/stats/export/reports', request, `bao-cao-vi-pham-${dateStr}.xlsx`, 'POST');
    },

    updatePostTypePrice: (payload) => axiosClient.put('/manager/post-type-prices', payload),
    updateMembershipLevel: (id, payload) => axiosClient.put(`/manager/membership-levels/${id}`, payload),
}

export default managerApi
