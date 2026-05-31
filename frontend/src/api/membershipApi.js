import axiosClient from './axiosClient'

const membershipApi = {
    getMyLevel: () => axiosClient.get('/membership/my-level'),
    getLevels: () => axiosClient.get('/membership/levels'),
}

export default membershipApi
