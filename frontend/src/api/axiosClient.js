import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './accessTokenStore'
import { normalizeApiText } from '../utils/textEncoding'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

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

axiosClient.interceptors.request.use((config) => {
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

        if (status === 401 && originalRequest && !originalRequest._retry && !isAuthUrl(originalRequest.url) && !skipAuthRedirect) {
            originalRequest._retry = true

            try {
                const refreshResponse = await refreshClient.post('/auth/refresh')
                const normalizedRefresh = normalizeApiText(refreshResponse.data)
                const newAccessToken = normalizedRefresh?.data?.accessToken
                if (newAccessToken) {
                    setAccessToken(newAccessToken)
                    originalRequest.headers = originalRequest.headers || {}
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                }
                return axiosClient(originalRequest)
            } catch (refreshError) {
                clearAccessToken()
                localStorage.removeItem('taytro_user')
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            }
        }

        if (status === 401 && !isAuthUrl(originalRequest?.url) && !skipAuthRedirect && window.location.pathname !== '/login') {
            clearAccessToken()
            localStorage.removeItem('taytro_user')
            window.location.href = '/login'
        }
        if (status === 403) {
            console.error('Bạn không có quyền thực hiện thao tác này')
        }
        if (status === 500) {
            console.error('Lỗi server, vui lòng thử lại sau')
        }

        return Promise.reject(error)
    }
)

export default axiosClient
