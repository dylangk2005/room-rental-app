import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const favoriteApi = {
    addFavorite: (postId) => axiosClient.post(`/favorites/${postId}`),
    removeFavorite: (postId) => axiosClient.delete(`/favorites/${postId}`),
    getFavorites: (params = {}) => axiosClient.get('/favorites', { params: cleanParams(params) }),
}

export default favoriteApi
