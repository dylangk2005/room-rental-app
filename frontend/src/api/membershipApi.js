import axiosClient from './axiosClient'

const membershipApi = {
    getMyLevel: () => axiosClient.get('/membership/my-level'),
    getLevels: () => axiosClient.get('/membership/levels'),
    refreshCache: () => axiosClient.post('/membership/levels/refresh'),
}

export default membershipApi
