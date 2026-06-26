import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authApi from '../api/authApi'
import notificationApi from '../api/notificationApi'
import SafeImage from './common/SafeImage'
import ROUTES from '../constants/routes'

const QUICK_NOTIFICATION_LIMIT = 4
const ALL_NOTIFICATION_PAGE_SIZE = 10

const getInitial = (name) => {
    const safeName = name ?? ''
    const trimmedName = safeName.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

const accountLinks = [
    { label: 'Hồ sơ cá nhân', to: ROUTES.PROFILE },
    { label: 'Tin đăng của tôi', to: ROUTES.MY_POSTS },
    { label: 'Nạp tiền vào ví', to: ROUTES.USER_DEPOSIT },
    { label: 'Hạng & quyền lợi', to: ROUTES.USER_MEMBERSHIP },
    { label: 'Bảng giá gói tin', to: ROUTES.POST_PRICING },
    { label: 'Tin yêu thích', to: ROUTES.FAVORITES },
]

const getBackOfficeLinks = (role) => {
    if (role === 'ADMIN') {
        return [{ label: 'Đi tới dashboard', to: ROUTES.ADMIN_DASHBOARD, highlight: true }]
    }

    if (role === 'MANAGER') {
        return [{ label: 'Đi tới dashboard', to: ROUTES.MANAGER_DASHBOARD, highlight: true }]
    }

    if (role === 'MODERATOR') {
        return [{ label: 'Đi tới dashboard', to: ROUTES.MODERATOR_HOME, highlight: true }]
    }

    return []
}

const notificationTypeConfig = {
    POST_INFORMATION: {
        label: 'Tin đăng',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12h6M9 8h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    POST_EXPIRING: {
        label: 'Tin sắp hết hạn',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    REPORT_INFORMATION: {
        label: 'Báo cáo',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M4 15l4-8 4 4 4-7 4 11H4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    PAYMENT_INFORMATION: {
        label: 'Thanh toán',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
    },
    WALLET_INFORMATION: {
        label: 'Ví tiền',
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-600',
        borderColor: 'border-violet-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M17 8h1a3 3 0 0 1 0 6h-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 8h14V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    SYSTEM_INFORMATION: {
        label: 'Hệ thống',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-300',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    ACCOUNT_INFORMATION: {
        label: 'Tài khoản',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-200',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
}

const getNotificationTypeConfig = (type) =>
    notificationTypeConfig[type] || {
        label: 'Thông báo',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-300',
        Icon: ({ className }) => (
            <svg className={className} viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    }

const formatNotificationTime = (value) => {
    if (!value) return ''
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

const formatMessage = (message) => {
    if (!message) return []
    return message.split(/(?<=[.;])\s+/).filter(Boolean)
}

const formatRelativeTime = (value) => {
    if (!value) return ''
    const now = new Date()
    const date = new Date(value)
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
    return formatNotificationTime(value)
}

const CheckIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ArrowRightIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const BellOffIcon = () => (
    <svg className="h-14 w-14 text-slate-300" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

const BellIcon = () => (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const PlusIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="M12 5v14m-7-7h14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
        />
    </svg>
)

const NotificationItem = ({ notification, onClick, compact = false }) => {
    const config = getNotificationTypeConfig(notification.type)
    const { Icon } = config
    const lines = formatMessage(notification.message)
    const showAsList = !compact && lines.length > 1

    return (
        <button
            className={`group flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                notification.isRead
                    ? 'bg-white hover:bg-slate-50'
                    : `${config.bgColor} ${config.borderColor} border hover:scale-[1.02]`
            }`}
            type="button"
            onClick={() => onClick(notification)}
        >
            <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor} ${config.textColor} ${config.borderColor} border transition-transform duration-200 group-hover:scale-110`}
            >
                <Icon />
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-black ${config.textColor}`}>
                        {config.label}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                </span>
                {showAsList ? (
                    <ul className="mt-1 space-y-0.5 pl-4 text-sm font-semibold leading-5 text-slate-700 marker:text-slate-400">
                        {lines.map((line, i) => (
                            <li key={i}>{line}</li>
                        ))}
                    </ul>
                ) : (
                    <span className={`mt-1 block text-sm font-semibold leading-5 text-slate-700 ${compact ? 'line-clamp-2' : ''}`}>
                        {compact ? lines[0] : notification.message}
                    </span>
                )}
            </span>

            {!notification.isRead && (
                <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500" />
            )}
        </button>
    )
}

const AppHeader = () => {
    const { user, logout, isAuthReady } = useAuth()
    const navigate = useNavigate()
    const menuRef = useRef(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [selectedNotification, setSelectedNotification] = useState(null)
    const [isNotificationLoading, setIsNotificationLoading] = useState(false)
    const [notificationError, setNotificationError] = useState('')
    const [isAllNotificationsOpen, setIsAllNotificationsOpen] = useState(false)
    const [allNotifications, setAllNotifications] = useState([])
    const [allPageInfo, setAllPageInfo] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
    })
    const [isAllNotificationsLoading, setIsAllNotificationsLoading] = useState(false)
    const portalRoot = typeof document !== 'undefined' ? document.body : null

    useEffect(() => {
        if (!isMenuOpen) return undefined

        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
        }
    }, [isMenuOpen])

    useEffect(() => {
        const hasOpenPanel = isNotificationOpen || isAllNotificationsOpen || !!selectedNotification
        if (!hasOpenPanel) return undefined

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsNotificationOpen(false)
                setIsAllNotificationsOpen(false)
                setSelectedNotification(null)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isNotificationOpen, isAllNotificationsOpen, selectedNotification])

    useEffect(() => {
        if (!user) return undefined

        let ignore = false

        const loadInitialNotifications = async () => {
            const [listResult, countResult] = await Promise.allSettled([
                notificationApi.getNotifications({ page: 0, size: QUICK_NOTIFICATION_LIMIT }),
                notificationApi.getUnreadCount(),
            ])

            if (ignore) return

            if (listResult.status === 'fulfilled') {
                setNotifications(listResult.value.data?.notifications || [])
            }

            if (countResult.status === 'fulfilled') {
                setUnreadCount(countResult.value.data?.unreadCount || 0)
            }
        }

        loadInitialNotifications()

        return () => {
            ignore = true
        }
    }, [user, isAuthReady])

    const loadQuickNotifications = async () => {
        setIsNotificationLoading(true)
        setNotificationError('')

        try {
            const [listResult, countResult] = await Promise.all([
                notificationApi.getNotifications({ page: 0, size: QUICK_NOTIFICATION_LIMIT }),
                notificationApi.getUnreadCount(),
            ])

            setNotifications(listResult.data?.notifications || [])
            setUnreadCount(countResult.data?.unreadCount || 0)
        } catch {
            setNotificationError('Không tải được thông báo. Vui lòng thử lại.')
        } finally {
            setIsNotificationLoading(false)
        }
    }

    const loadAllNotifications = async (page = 0, append = false) => {
        setIsAllNotificationsLoading(true)
        setNotificationError('')

        try {
            const response = await notificationApi.getNotifications({
                page,
                size: ALL_NOTIFICATION_PAGE_SIZE,
            })
            const data = response.data || {}

            setAllNotifications((current) =>
                append ? [...current, ...(data.notifications || [])] : data.notifications || []
            )
            setAllPageInfo({
                currentPage: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0,
            })
        } catch {
            setNotificationError('Không tải được danh sách thông báo.')
        } finally {
            setIsAllNotificationsLoading(false)
        }
    }

    const openQuickNotifications = () => {
        setIsMenuOpen(false)
        setIsNotificationOpen(true)
        loadQuickNotifications()
    }

    const openAllNotifications = () => {
        setIsNotificationOpen(false)
        setSelectedNotification(null)
        setIsAllNotificationsOpen(true)
        loadAllNotifications(0, false)
    }

    const syncReadNotification = (notificationId) => {
        setNotifications((current) =>
            current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
        )
        setAllNotifications((current) =>
            current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
        )
        setUnreadCount((current) => Math.max(current - 1, 0))
    }

    const handleLogout = async () => {
        setIsMenuOpen(false)
        setIsNotificationOpen(false)
        setIsAllNotificationsOpen(false)
        setSelectedNotification(null)
        await logout()
        navigate(ROUTES.HOME)
    }

    const handleNotificationClick = async (notification) => {
        setIsNotificationOpen(false)
        setIsAllNotificationsOpen(false)
        setSelectedNotification(notification)

        if (notification.isRead) return

        try {
            await notificationApi.markAsRead(notification.id)
            syncReadNotification(notification.id)
            setSelectedNotification({ ...notification, isRead: true })
        } catch {
            setNotificationError('Không cập nhật được trạng thái thông báo.')
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
            setAllNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
            setUnreadCount(0)
            setSelectedNotification((current) => (current ? { ...current, isRead: true } : current))
        } catch {
            setNotificationError('Không đánh dấu được tất cả thông báo.')
        }
    }

    const hasMoreNotifications = allPageInfo.currentPage + 1 < allPageInfo.totalPages

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link to={ROUTES.HOME} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white">
                        T
                    </span>
                    <span className="text-xl font-black text-slate-950">TAYTRO</span>
                </Link>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                className="group hidden h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-black text-emerald-700 transition-all duration-200 hover:scale-[1.04] hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md active:scale-95 sm:inline-flex"
                                to={ROUTES.CREATE_POST}
                            >
                                <PlusIcon />
                                <span>Đăng tin</span>
                            </Link>

                            <button
                                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 ring-offset-2 transition-all duration-200 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95"
                                type="button"
                                onClick={openQuickNotifications}
                                aria-label="Mở thông báo"
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white shadow-sm ring-2 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <div className="relative" ref={menuRef}>
                                <button
                                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-700 ring-offset-2 transition-all duration-200 hover:scale-105 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95"
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen((current) => !current)
                                        setIsNotificationOpen(false)
                                    }}
                                    aria-label="Mở menu tài khoản"
                                    aria-expanded={isMenuOpen}
                                >
                                    {user.avatar ? (
                                        <SafeImage
                                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                                            src={user.avatar}
                                            fallbackSrc="https://picsum.photos/seed/avatar-header/200/200"
                                            alt={user.fullName || 'Tài khoản'}
                                        />
                                    ) : (
                                        getInitial(user.fullName)
                                    )}
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-80 origin-top-right animate-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl fade-in slide-in-from-top-2 duration-200">
                                        <div className="border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                                            <p className="truncate text-sm font-black text-slate-950">
                                                {user.fullName || 'Người dùng'}
                                            </p>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                {user.email || 'Tài khoản TAYTRO'}
                                            </p>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto p-2">
                                            {[...getBackOfficeLinks(user.role), ...accountLinks].map((item) => (
                                                <Link
                                                    className={item.highlight
                                                        ? 'mb-1 flex min-h-10 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 transition-all duration-150 hover:translate-x-1 hover:bg-emerald-100'
                                                        : 'flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition-all duration-150 hover:translate-x-1 hover:bg-emerald-50 hover:text-emerald-700'}
                                                    key={item.to}
                                                    to={item.to}
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-200 p-2">
                                            <button
                                                className="flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-black text-red-600 transition-colors duration-150 hover:bg-red-50"
                                                type="button"
                                                onClick={handleLogout}
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                className="group hidden h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-black text-emerald-700 transition-all duration-200 hover:scale-[1.04] hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md active:scale-95 sm:inline-flex"
                                to={ROUTES.CREATE_POST}
                            >
                                <PlusIcon />
                                <span>Đăng tin</span>
                            </Link>
                            <Link
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-slate-800 hover:shadow-md active:scale-95"
                                to={ROUTES.LOGIN}
                            >
                                Đăng nhập
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {isNotificationOpen && portalRoot && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200"
                        aria-hidden="true"
                        onClick={() => setIsNotificationOpen(false)}
                    />
                    <div className="fixed left-1/2 top-16 z-50 w-full max-w-md -translate-x-1/2 px-4 pt-3">
                        <div
                            className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200"
                            style={{ animation: 'slideDown 200ms ease-out' }}
                        >
                            <style>{`
                                @keyframes slideDown {
                                    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                                    to   { opacity: 1; transform: translateY(0) scale(1); }
                                }
                                @keyframes shimmer {
                                    0%   { background-position: -200% 0; }
                                    100% { background-position: 200% 0; }
                                }
                                .skeleton {
                                    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                                    background-size: 200% 100%;
                                    animation: shimmer 1.5s infinite;
                                }
                            `}</style>

                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">Thông báo</h2>
                                        <p className="text-xs font-semibold text-slate-500">
                                            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-slate-400 transition-all duration-150 hover:scale-110 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                                    type="button"
                                    onClick={() => setIsNotificationOpen(false)}
                                    aria-label="Đóng thông báo"
                                >
                                    ×
                                </button>
                            </div>

                            {notificationError && (
                                <div className="mx-5 mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                                    {notificationError}
                                </div>
                            )}

                            <div className="max-h-96 overflow-y-auto p-3">
                                {isNotificationLoading && (
                                    <div className="space-y-2">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex gap-3 rounded-xl p-3.5">
                                                <div className="h-9 w-9 shrink-0 rounded-full skeleton" />
                                                <div className="flex-1 space-y-2 pt-1">
                                                    <div className="h-3 w-20 rounded-full skeleton" />
                                                    <div className="h-4 w-full rounded-full skeleton" />
                                                    <div className="h-4 w-3/4 rounded-full skeleton" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isNotificationLoading && notifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <BellOffIcon />
                                        <p className="mt-4 text-sm font-semibold text-slate-500">Chưa có thông báo nào</p>
                                        <p className="mt-1 text-xs text-slate-400">Thông báo từ hệ thống sẽ xuất hiện ở đây</p>
                                    </div>
                                )}

                                {!isNotificationLoading && notifications.length > 0 && (
                                    <div className="space-y-1.5">
                                        {notifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={handleNotificationClick}
                                                compact
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                                {unreadCount > 0 ? (
                                    <button
                                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        <CheckIcon />
                                        Đánh dấu đã đọc
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <button
                                    className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition-all duration-150 hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
                                    type="button"
                                    onClick={openAllNotifications}
                                >
                                    Xem tất cả
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                portalRoot
            )}

            {selectedNotification && portalRoot && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200"
                        aria-hidden="true"
                        onClick={() => setSelectedNotification(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                        <div
                            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200"
                            style={{ animation: 'scaleIn 200ms ease-out' }}
                        >
                            <style>{`
                                @keyframes scaleIn {
                                    from { opacity: 0; transform: scale(0.95); }
                                    to   { opacity: 1; transform: scale(1); }
                                }
                            `}</style>

                            {(() => {
                                const config = getNotificationTypeConfig(selectedNotification.type)
                                const { Icon } = config
                                return (
                                    <div className={`flex items-center gap-4 border-b border-slate-100 px-6 py-5 ${config.bgColor}`}>
                                        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
                                            <Icon className="!h-7 !w-7" />
                                        </span>
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase tracking-wide ${config.textColor}`}>
                                                {config.label}
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-400">
                                                {formatNotificationTime(selectedNotification.createdAt)}
                                            </p>
                                        </div>
                                        <button
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl font-black text-slate-400 transition-all duration-150 hover:scale-110 hover:bg-white/60 hover:text-slate-600 active:scale-95"
                                            type="button"
                                            onClick={() => setSelectedNotification(null)}
                                            aria-label="Đóng thông báo"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )
                            })()}

                            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                                {(() => {
                                    const lines = formatMessage(selectedNotification.message)
                                    return lines.length > 1 ? (
                                        <ul className="space-y-2 text-[15px] font-semibold leading-7 text-slate-700 marker:text-slate-400">
                                            {lines.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-7 text-slate-700">
                                            {selectedNotification.message}
                                        </p>
                                    )
                                })()}
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                                <button
                                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                    type="button"
                                    onClick={() => setSelectedNotification(null)}
                                >
                                    Đóng
                                </button>
                                <button
                                    className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition-all duration-150 hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
                                    type="button"
                                    onClick={openAllNotifications}
                                >
                                    Xem tất cả thông báo
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                portalRoot
            )}

            {isAllNotificationsOpen && portalRoot && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200"
                        aria-hidden="true"
                        onClick={() => setIsAllNotificationsOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                        <div
                            className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200"
                            style={{ animation: 'scaleIn 200ms ease-out' }}
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">Tất cả thông báo</h2>
                                        <p className="text-xs font-semibold text-slate-500">
                                            {allPageInfo.totalElements > 0
                                                ? `${allPageInfo.totalElements} thông báo`
                                                : 'Chưa có thông báo nào'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-black text-slate-400 transition-all duration-150 hover:scale-110 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                                    type="button"
                                    onClick={() => setIsAllNotificationsOpen(false)}
                                    aria-label="Đóng thông báo"
                                >
                                    ×
                                </button>
                            </div>

                            {notificationError && (
                                <div className="mx-5 mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                                    {notificationError}
                                </div>
                            )}

                            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                                {isAllNotificationsLoading && allNotifications.length === 0 && (
                                    <div className="space-y-2">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-3 rounded-xl p-3.5">
                                                <div className="h-9 w-9 shrink-0 rounded-full skeleton" />
                                                <div className="flex-1 space-y-2 pt-1">
                                                    <div className="h-3 w-20 rounded-full skeleton" />
                                                    <div className="h-4 w-full rounded-full skeleton" />
                                                    <div className="h-4 w-3/4 rounded-full skeleton" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isAllNotificationsLoading && allNotifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <BellOffIcon />
                                        <p className="mt-4 text-sm font-semibold text-slate-500">Chưa có thông báo nào</p>
                                        <p className="mt-1 text-xs text-slate-400">Thông báo từ hệ thống sẽ xuất hiện ở đây</p>
                                    </div>
                                )}

                                {allNotifications.length > 0 && (
                                    <div className="space-y-1.5">
                                        {allNotifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={handleNotificationClick}
                                                compact
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                                {unreadCount > 0 && (
                                    <button
                                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        <CheckIcon />
                                        Đánh dấu đã đọc
                                    </button>
                                )}
                                <div className="flex-1" />
                                {hasMoreNotifications ? (
                                    <button
                                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                        type="button"
                                        onClick={() => loadAllNotifications(allPageInfo.currentPage + 1, true)}
                                        disabled={isAllNotificationsLoading}
                                    >
                                        {isAllNotificationsLoading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                                Đang tải...
                                            </>
                                        ) : (
                                            <>
                                                Tải thêm
                                                <ArrowRightIcon />
                                            </>
                                        )}
                                    </button>
                                ) : allNotifications.length > 0 ? (
                                    <p className="flex h-10 items-center text-sm font-semibold text-slate-400">
                                        Đã xem hết thông báo
                                    </p>
                                ) : (
                                    <div />
                                )}
                            </div>
                        </div>
                    </div>
                </>,
                portalRoot
            )}
        </header>
    )
}

export default AppHeader
