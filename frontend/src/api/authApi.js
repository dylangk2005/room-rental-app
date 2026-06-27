/**
 * Auth API - Xử lý đăng nhập, đăng ký, OTP và đăng xuất
 */
import axiosClient from './axiosClient'
import { setAccessToken, clearAccessToken } from './accessTokenStore'

const USER_STORAGE_KEY = 'taytro_user'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract user from auth response and store token */
const storeAuthResponse = (response) => {
    const authData = response?.data
    setAccessToken(authData?.accessToken)
    return {
        ...response,
        data: authData?.user,
    }
}

/** Refresh session and sync user to localStorage */
const refreshSession = async () => {
    try {
        const response = storeAuthResponse(await axiosClient.post('/auth/refresh', {}, { skipAuthRedirect: true }))
        const user = response.data || null

        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
        } else {
            clearAccessToken()
            localStorage.removeItem(USER_STORAGE_KEY)
        }

        return user
    } catch {
        clearAccessToken()
        localStorage.removeItem(USER_STORAGE_KEY)
        return null
    }
}

// ─── API Methods ──────────────────────────────────────────────────────────────

const authApi = {
    // ── Authentication ──────────────────────────────────────────────────────
    login: async (payload) => storeAuthResponse(await axiosClient.post('/auth/login', payload)),
    register: (payload) => axiosClient.post('/auth/register', payload),
    logout: async () => {
        try {
            return await axiosClient.post('/auth/logout')
        } finally {
            clearAccessToken()
        }
    },
    refresh: async () => storeAuthResponse(await axiosClient.post('/auth/refresh', {}, { skipAuthRedirect: true })),
    refreshSession,

    // ── OTP ────────────────────────────────────────────────────────────────
    verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),

    // ── Password Reset ─────────────────────────────────────────────────────
    forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
    resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),

    // ── Password Change ────────────────────────────────────────────────────
    requestChangePasswordOtp: () => axiosClient.post('/auth/change-password/otp'),
    changePassword: (payload) => axiosClient.put('/auth/change-password', payload),
}

export default authApi
