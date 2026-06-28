/**
 * Payment API - Thanh toán bài đăng
 */
import axiosClient from './axiosClient'

const paymentApi = {
    // ── Post Payments ─────────────────────────────────────────────────────
    payPost: (payload) => axiosClient.post('/payments/post', payload),

    // ── Post Extension ────────────────────────────────────────────────────
    renewPost: (payload) => axiosClient.post('/payments/renew', payload),

    // ── Post Boosting ─────────────────────────────────────────────────────
    boostPost: (payload) => axiosClient.post('/payments/boost', payload),
}

export default paymentApi
