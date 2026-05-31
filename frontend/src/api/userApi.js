import axiosClient from './axiosClient'

const userApi = {
    getProfile: () => axiosClient.get('/users/profile'),
    updateProfile: (payload) => axiosClient.put('/users/profile', payload),
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
