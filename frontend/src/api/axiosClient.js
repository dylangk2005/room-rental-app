import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './accessTokenStore'
import { normalizeApiText } from '../utils/textEncoding'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const USER_STORAGE_KEY = 'taytro_user'

let refreshPromise = null

const refreshAccessToken = async () => {
    if (refreshPromise) return refreshPromise
    refreshPromise = (async () => {
        try {
            const response = await refreshClient.post('/auth/refresh')
            const normalized = normalizeApiText(response.data)
            const payload = normalized?.data
            if (payload?.user && payload?.accessToken) {
                setAccessToken(payload.accessToken)
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user))
                return payload.accessToken
            }
            return null
        } catch {
            return null
        } finally {
            refreshPromise = null
        }
    })()
    return refreshPromise
}

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

const isAuthUrl = (url = '') => url.includes('/auth/login') || url.includes('/auth/refresh')

// ─── Init: restore session from stored user ────────────────────────────────
if (typeof window !== 'undefined') {
    if (!window.__taytroAuthReady) {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY)
            if (storedUser && !getAccessToken()) {
                window.__taytroAuthReady = refreshAccessToken().then((token) => {
                    if (!token) {
                        // Refresh failed — clear stale session so user sees login screen
                        clearAccessToken()
                        localStorage.removeItem(USER_STORAGE_KEY)
                    }
                    return !!token
                })
            } else {
                window.__taytroAuthReady = Promise.resolve(true)
            }
        } catch {
            window.__taytroAuthReady = Promise.resolve(true)
        }
    }
}

// ─── Request interceptor: wait for token to be ready ──────────────────────
axiosClient.interceptors.request.use(async (config) => {
    // Block all requests until the init-phase refresh completes (or fails)
    if (window.__taytroAuthReady) {
        await window.__taytroAuthReady
    }

    const token = getAccessToken()
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

axiosClient.interceptors.response.use(
    (response) => normalizeApiText(response.data),
    async (error) => {
        if (error.response?.data) {
            error.response.data = normalizeApiText(error.response.data)
        }

        const originalRequest = error.config
        const status = error.response?.status
        const skipAuthRedirect = originalRequest?.skipAuthRedirect

        const hasToken = !!getAccessToken()

        // ── 401 or 403 → attempt token refresh ─────────────────────────────
        const shouldRefresh =
            !originalRequest._retry &&
            !isAuthUrl(originalRequest?.url) &&
            !skipAuthRedirect &&
            (status === 401 || status === 403)

        if (shouldRefresh) {
            originalRequest._retry = true

            try {
                const newAccessToken = await refreshAccessToken()
                if (newAccessToken) {
                    originalRequest.headers = originalRequest.headers || {}
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return axiosClient(originalRequest)
                }
                throw new Error('Refresh token không hợp lệ hoặc đã hết hạn')
            } catch (refreshError) {
                clearAccessToken()
                localStorage.removeItem(USER_STORAGE_KEY)
                return Promise.reject(refreshError)
            }
        }

        // ── Log non-retry errors ──────────────────────────────────────────
        if (status === 403) {
            console.error('[API 403] Token không hợp lệ hoặc hết phiên:', originalRequest?.url, error.response?.data)
        }
        if (status === 401 && !isAuthUrl(originalRequest?.url)) {
            console.error('[API 401] Phiên đăng nhập hết hạn hoặc token không hợp lệ:', originalRequest?.url, error.response?.data)
        }
        if (status === 500) {
            console.error('[API 500] Lỗi server, vui lòng thử lại sau:', originalRequest?.url, error.response?.data)
        }

        return Promise.reject(error)
    }
)

export const authReadyPromise = window.__taytroAuthReady || Promise.resolve(true)
export const waitForAuth = () => authReadyPromise

export default axiosClient
