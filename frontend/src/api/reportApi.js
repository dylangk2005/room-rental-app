import axiosClient from './axiosClient'

const reportApi = {
    createReport: ({ postId, reason, description, images = [] }) => {
        const formData = new FormData()
        formData.append('postId', postId)
        formData.append('reason', reason)
        if (description) {
            formData.append('description', description)
        }
        images.forEach((image) => {
            formData.append('images', image)
        })

        return axiosClient.post('/reports', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export default reportApi
