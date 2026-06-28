/**
 * Favorite API - Quản lý bài đăng yêu thích
 */
import axiosClient from './axiosClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

// ─── API Methods ──────────────────────────────────────────────────────────────

const favoriteApi = {
    // ── Add/Remove ─────────────────────────────────────────────────────────
    addFavorite: (postId) => axiosClient.post(`/favorites/${postId}`),
    removeFavorite: (postId) => axiosClient.delete(`/favorites/${postId}`),

    // ── List ───────────────────────────────────────────────────────────────
    getFavorites: (params = {}) => axiosClient.get('/favorites', { params: cleanParams(params) }),
}

export default favoriteApi
