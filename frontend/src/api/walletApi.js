import axiosClient from './axiosClient'

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )

const walletApi = {
    getBalance: () => axiosClient.get('/wallet/balance'),
    getTransactions: (params = {}) => axiosClient.get('/wallet/transactions', { params: cleanParams(params) }),
    deposit: (payload) => axiosClient.post('/wallet/deposit', payload),
}

export default walletApi
