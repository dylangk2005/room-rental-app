/**
 * User API - Quản lý thông tin người dùng
 */
import axiosClient from './axiosClient'

const userApi = {
    // ── Profile ────────────────────────────────────────────────────────────
    getProfile: () => axiosClient.get('/users/profile'),
    updateProfile: (payload) => axiosClient.put('/users/profile', payload),

    // ── Avatar ────────────────────────────────────────────────────────────
    uploadAvatar: (file) => {
        const formData = new FormData()
        formData.append('avatar', file)

        return axiosClient.post('/users/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export default userApi
