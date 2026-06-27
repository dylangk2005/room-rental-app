/**
 * Membership API - Hạng thành viên
 */
import axiosClient from './axiosClient'

const membershipApi = {
    // ── Levels ────────────────────────────────────────────────────────────
    getMyLevel: () => axiosClient.get('/membership/my-level'),
    getLevels: () => axiosClient.get('/membership/levels'),

    // ── Cache ───────────────────────────────────────────────────────────
    refreshCache: () => axiosClient.post('/membership/levels/refresh'),
}

export default membershipApi
