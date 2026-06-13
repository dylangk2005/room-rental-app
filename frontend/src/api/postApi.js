import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const postApi = {
    getPosts: (params = {}) => axiosClient.get('/posts', { params: cleanParams(params) }),
    searchPosts: (params = {}) => axiosClient.get('/posts/search', { params: cleanParams(params) }),
    getLocations: () => axiosClient.get('/posts/locations'),
    getPostTypes: () => axiosClient.get('/post-types'),
    getPostDetail: (id) => axiosClient.get(`/posts/${id}`),
    getPostContact: (id) => axiosClient.get(`/posts/${id}/contact`, { skipAuthRedirect: true }),
    getMyPosts: (params = {}) => axiosClient.get('/posts/my-posts', { params: cleanParams(params) }),
    createPost: (payload) =>
        axiosClient.post('/posts', payload, {
            timeout: 180000,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    createAndPayPost: (payload) =>
        axiosClient.post('/posts/pay', payload, {
            timeout: 180000,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
}

export default postApi
