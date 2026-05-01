import axios from 'axios'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request Interceptor — tự động đính token vào mỗi request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response Interceptor — xử lý lỗi tập trung
axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status
        if (status === 401) {
            localStorage.removeItem('accessToken')
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