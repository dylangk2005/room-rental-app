import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const postApi = {
    getPosts: (params = {}) => axiosClient.get('/posts', { params: cleanParams(params) }),
    searchPosts: (params = {}) => axiosClient.get('/posts/search', { params: cleanParams(params) }),
}

export default postApi
