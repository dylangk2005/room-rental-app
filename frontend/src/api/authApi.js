import axiosClient from './axiosClient'

const authApi = {
    login: (payload) => axiosClient.post('/auth/login', payload),
    register: (payload) => axiosClient.post('/auth/register', payload),
    verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
    forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
    resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
    refresh: () => axiosClient.post('/auth/refresh'),
    logout: () => axiosClient.post('/auth/logout'),
    requestChangePasswordOtp: () => axiosClient.post('/auth/change-password/otp'),
    changePassword: (payload) => axiosClient.put('/auth/change-password', payload),
}

export default authApi
