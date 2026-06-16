import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'

const USER_STORAGE_KEY = 'taytro_user'

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser())
    const [isAuthReady, setIsAuthReady] = useState(true)

    useEffect(() => {
        const handleStorageChange = () => {
            setUser(getStoredUser())
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const login = useCallback((userData) => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
        setUser(userData)
    }, [])

    const logout = useCallback(async () => {
        try {
            await authApi.logout()
        } finally {
            localStorage.removeItem(USER_STORAGE_KEY)
            setUser(null)
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthReady }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}

export { USER_STORAGE_KEY }
