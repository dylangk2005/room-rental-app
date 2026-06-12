import axiosClient from './axiosClient'
import { setAccessToken, clearAccessToken } from './accessTokenStore'

const storeAuthResponse = (response) => {
    const authData = response?.data
    setAccessToken(authData?.accessToken)
    return {
        ...response,
        data: authData?.user,
    }
}

const authApi = {
    login: async (payload) => storeAuthResponse(await axiosClient.post('/auth/login', payload)),
    register: (payload) => axiosClient.post('/auth/register', payload),
    verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
    forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
    resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
    refresh: async () => storeAuthResponse(await axiosClient.post('/auth/refresh')),
    logout: async () => {
        try {
            return await axiosClient.post('/auth/logout')
        } finally {
            clearAccessToken()
        }
    },
    requestChangePasswordOtp: () => axiosClient.post('/auth/change-password/otp'),
    changePassword: (payload) => axiosClient.put('/auth/change-password', payload),
}

export default authApi
