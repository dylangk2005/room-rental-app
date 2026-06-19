import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from './AppHeader'
import { useAuth } from '../contexts/AuthContext'
import ROUTES from '../constants/routes'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const getInitial = (name) => {
    const safeName = name ?? ''
    const trimmedName = safeName.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

// ─── Inline SVG Icons ──────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
    const icons = {
        user: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M2 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        plus: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
        ),
        home: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 9.5V21h14V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="9" y="15" width="6" height="6" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        rocket: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2c3 5 5 9 5 14a7 7 0 1 1-14 0c0-5 2-9 5-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16v4M10 20h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        history: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        heart: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        chevronRight: (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        chevronLeft: (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        loading: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    }

    return icons[name] || null
}

const accountMenuItems = [
    { key: 'account', label: 'Hồ sơ cá nhân', to: ROUTES.PROFILE, icon: 'user' },
    { key: 'deposit', label: 'Nạp tiền', to: ROUTES.USER_DEPOSIT, icon: 'plus' },
    { key: 'posts', label: 'Bài đăng của tôi', to: ROUTES.MY_POSTS, icon: 'home' },
    { key: 'boost', label: 'Đẩy tin đăng', to: ROUTES.BOOST_POSTS, icon: 'rocket' },
    { key: 'transactions', label: 'Lịch sử giao dịch', to: ROUTES.USER_TRANSACTIONS, icon: 'history' },
    { key: 'favorites', label: 'Yêu thích', to: ROUTES.FAVORITES, icon: 'heart' },
]

// ─── Mobile Menu Item ──────────────────────────────────────────────────────
const MobileMenuItem = ({ item, isActive, onClick }) => (
    <Link
        to={item.to}
        onClick={onClick}
        className={`group relative flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-200 ${
            isActive
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-500 hover:bg-slate-100 active:scale-95'
        }`}
    >
        <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}>
            <Icon name={item.icon} size={20} />
        </span>
        <span className={`whitespace-nowrap text-xs font-bold transition-colors ${isActive ? 'text-white' : 'group-hover:text-emerald-600'}`}>
            {item.label}
        </span>
        {isActive && (
            <span className="absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-emerald-800" />
        )}
    </Link>
)

// ─── Desktop Nav Item ──────────────────────────────────────────────────────
const DesktopNavItem = ({ item, isActive, isHovered, onMouseEnter, onMouseLeave, onClick }) => (
    <Link
        to={item.to}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
            isActive
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-200'
                : 'hover:bg-slate-100'
        }`}
    >
        <span className={`transition-colors duration-200 ${isActive ? 'text-white' : isHovered ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Icon name={item.icon} size={20} />
        </span>
        <span className={`flex-1 text-sm font-bold transition-colors duration-200 ${isActive ? 'text-white' : isHovered ? 'text-emerald-700' : 'text-slate-600'}`}>
            {item.label}
        </span>
        <span className={`transition-all duration-200 ${isActive ? 'text-white opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <Icon name="chevronRight" size={14} />
        </span>
    </Link>
)

// ─── AccountLayout ─────────────────────────────────────────────────────────
const AccountLayout = ({ balance = 0, activeKey, title, subtitle, children, actions }) => {
    const { user } = useAuth()
    const scrollRef = useRef(null)
    const [hoveredKey, setHoveredKey] = useState(null)

    // Scroll active menu item into view on mount
    useEffect(() => {
        if (!scrollRef.current || !activeKey) return
        const activeEl = scrollRef.current.querySelector(`[data-key="${activeKey}"]`)
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }, [activeKey])

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader />

            {/* ── Mobile Header Bar ──────────────────────────────────────── */}
            <div className="sticky top-16 z-10 border-b border-slate-200 bg-white lg:hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-sm">
                        {user?.avatar ? (
                            <img className="h-full w-full object-cover" src={user.avatar} alt={user.fullName || 'Tài khoản'} />
                        ) : (
                            <span className="text-sm font-black text-emerald-700">{getInitial(user?.fullName)}</span>
                        )}
                    </div>

                    {/* Name + Account */}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{user?.fullName || 'Người dùng'}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{user?.phoneNumber || user?.email || 'Tài khoản TAYTRO'}</p>
                    </div>

                    {/* Balance pill */}
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 shadow-sm">
                        <span className="text-amber-500">
                            <Icon name="wallet" size={15} />
                        </span>
                        <span className="text-sm font-black text-amber-700">{formatMoney(balance)}</span>
                    </div>
                </div>

                {/* Horizontal scrollable menu */}
                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none"
                >
                    {accountMenuItems.map((item) => (
                        <div key={item.key} data-key={item.key}>
                            <MobileMenuItem
                                item={item}
                                isActive={item.key === activeKey}
                                onClick={() => {}}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Page Body ──────────────────────────────────────────────── */}
            <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6 lg:px-4">
                {/* ── Desktop Sidebar ─────────────────────────────────────── */}
                <aside className="hidden w-64 shrink-0 flex-col pt-6 lg:flex">
                    {/* User card */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Banner */}
                        <div className="relative h-20 bg-gradient-to-br from-emerald-500 to-emerald-700">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                        </div>

                        {/* Avatar + Info */}
                        <div className="relative px-5 pb-5">
                            <div className="-mt-10 mb-3">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-md">
                                    {user?.avatar ? (
                                        <img className="h-full w-full object-cover" src={user.avatar} alt={user.fullName || 'Tài khoản'} />
                                    ) : (
                                        <span className="text-xl font-black text-emerald-700">{getInitial(user?.fullName)}</span>
                                    )}
                                </div>
                            </div>
                            <p className="text-base font-black text-slate-900">{user?.fullName || 'Người dùng'}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{user?.phoneNumber || user?.email || 'Tài khoản TAYTRO'}</p>
                            {user?.id && (
                                <p className="mt-1 text-[11px] font-semibold text-slate-400">#{user.id}</p>
                            )}
                        </div>
                    </div>

                    {/* Balance card */}
                    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-600">Số dư ví</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{formatMoney(balance)}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm">
                                <Icon name="wallet" size={18} />
                            </div>
                        </div>
                        <Link
                            to={ROUTES.USER_DEPOSIT}
                            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-xs font-black text-amber-900 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-amber-500 hover:shadow-md active:scale-[0.98]"
                        >
                            <Icon name="plus" size={14} />
                            Nạp tiền
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Quản lý tài khoản</p>
                        </div>
                        <nav className="flex flex-col gap-0.5 p-2">
                            {accountMenuItems.map((item) => (
                                <DesktopNavItem
                                    key={item.key}
                                    item={item}
                                    isActive={item.key === activeKey}
                                    isHovered={hoveredKey === item.key}
                                    onMouseEnter={() => setHoveredKey(item.key)}
                                    onMouseLeave={() => setHoveredKey(null)}
                                    onClick={() => {}}
                                />
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* ── Main Content ────────────────────────────────────────── */}
                <main className="min-w-0 flex-1 px-4 pt-6 pb-10 lg:px-0 lg:pt-8">
                    {/* Page header */}
                    {(title || subtitle || actions) && (
                        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                {title && (
                                    <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{title}</h1>
                                )}
                                {subtitle && (
                                    <p className="mt-1.5 text-sm font-semibold text-slate-500">{subtitle}</p>
                                )}
                            </div>
                            {actions && <div className="shrink-0">{actions}</div>}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AccountLayout
