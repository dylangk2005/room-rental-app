/**
 * Wallet API - Quản lý ví và giao dịch
 */
import axiosClient from './axiosClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

// ─── API Methods ──────────────────────────────────────────────────────────────

const walletApi = {
    // ── Balance ───────────────────────────────────────────────────────────
    getBalance: () => axiosClient.get('/wallet/balance'),

    // ── Transactions ──────────────────────────────────────────────────────
    getTransactions: (params = {}) => axiosClient.get('/wallet/transactions', { params: cleanParams(params) }),

    // ── Deposits ──────────────────────────────────────────────────────────
    deposit: (payload) => axiosClient.post('/wallet/deposit', payload),
}

export default walletApi
