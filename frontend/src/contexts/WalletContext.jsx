import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import walletApi from '../api/walletApi'
import { useAuth } from './AuthContext'

const WalletContext = createContext(null)

export const WalletProvider = ({ children }) => {
    const { user } = useAuth()
    const [balance, setBalance] = useState(0)
    const [isLoadingBalance, setIsLoadingBalance] = useState(false)

    const loadBalance = useCallback(async () => {
        setIsLoadingBalance(true)
        try {
            const response = await walletApi.getBalance()
            setBalance(response.data?.balance || 0)
        } catch {
            // Silent fail — keep current balance
        } finally {
            setIsLoadingBalance(false)
        }
    }, [])

    useEffect(() => {
        if (user) {
            loadBalance()
        }
    }, [user, loadBalance])

    return (
        <WalletContext.Provider value={{ balance, setBalance, loadBalance, isLoadingBalance }}>
            {children}
        </WalletContext.Provider>
    )
}

export const useWallet = () => {
    const ctx = useContext(WalletContext)
    if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
    return ctx
}
