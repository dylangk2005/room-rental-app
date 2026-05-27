import axiosClient from './axiosClient'

const authApi = {
    login: (payload) => axiosClient.post('/auth/login', payload),
    register: (payload) => axiosClient.post('/auth/register', payload),
    verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
    refresh: () => axiosClient.post('/auth/refresh'),
    logout: () => axiosClient.post('/auth/logout'),
}

export default authApi
