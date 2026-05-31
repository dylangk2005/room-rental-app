import axiosClient from './axiosClient'

const paymentApi = {
    payPost: (payload) => axiosClient.post('/payments/post', payload),
    boostPost: (payload) => axiosClient.post('/payments/boost', payload),
}

export default paymentApi
