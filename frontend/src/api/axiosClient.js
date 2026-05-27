import axios from 'axios'

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

axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status

        if (status === 401 && originalRequest && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {
            originalRequest._retry = true

            try {
                await refreshClient.post('/auth/refresh')
                return axiosClient(originalRequest)
            } catch (refreshError) {
                localStorage.removeItem('taytro_user')
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            }
        }

        if (status === 401 && !isAuthUrl(originalRequest?.url) && window.location.pathname !== '/login') {
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
