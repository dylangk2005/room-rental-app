/**
 * Post API - Quản lý bài đăng
 */
import axiosClient from './axiosClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

// ─── API Methods ──────────────────────────────────────────────────────────────

const postApi = {
    // ── Public ─────────────────────────────────────────────────────────────
    getPosts: (params = {}) => axiosClient.get('/posts', { params: cleanParams(params) }),
    searchPosts: (params = {}) => axiosClient.get('/posts/search', { params: cleanParams(params) }),
    getPostDetail: (id) => axiosClient.get(`/posts/${id}`, { skipAuthRedirect: true }),
    getPostContact: (id) => axiosClient.get(`/posts/${id}/contact`, { skipAuthRedirect: true }),

    // ── Locations ──────────────────────────────────────────────────────────
    getLocations: () => axiosClient.get('/posts/locations'),
    getProvinces: () => axiosClient.get('/provinces'),
    getDistrictsByProvince: (provinceId) => axiosClient.get(`/provinces/${provinceId}/districts`),

    // ── Post Types & Pricing ──────────────────────────────────────────────
    getPostTypes: () => axiosClient.get('/post-types'),

    // ── User Posts ────────────────────────────────────────────────────────
    getMyPosts: (params = {}) => axiosClient.get('/posts/my-posts', { params: cleanParams(params) }),

    // ── CRUD ───────────────────────────────────────────────────────────────
    createPost: (payload) =>
        axiosClient.post('/posts', payload, {
            headers: { 'Content-Type': undefined },
            timeout: 180000,
        }),
    createAndPayPost: (payload) =>
        axiosClient.post('/posts/pay', payload, {
            headers: { 'Content-Type': undefined },
            timeout: 180000,
        }),
    updatePost: (id, payload) =>
        axiosClient.put(`/posts/${id}`, payload, {
            headers: { 'Content-Type': undefined },
            timeout: 180000,
        }),
    toggleVisibility: (id) => axiosClient.patch(`/posts/${id}/visibility`),
    deletePost: (id) => axiosClient.delete(`/posts/${id}`),
}

export default postApi
