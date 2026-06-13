import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import notificationApi from '../api/notificationApi'
import ROUTES from '../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'
const QUICK_NOTIFICATION_LIMIT = 4
const ALL_NOTIFICATION_PAGE_SIZE = 10

const getInitial = (name = '') => {
    const trimmedName = name.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

const accountLinks = [
    { label: 'Quản lý tài khoản', to: ROUTES.PROFILE },
    { label: 'Nạp tiền vào tài khoản', to: ROUTES.USER_DEPOSIT },
    { label: 'Quản lý bài đăng', to: ROUTES.MY_POSTS },
    { label: 'Đẩy tin đăng', to: ROUTES.BOOST_POSTS },
    { label: 'Quản lý nạp tiền & thanh toán', to: ROUTES.USER_TRANSACTIONS },
    { label: 'Danh sách yêu thích', to: ROUTES.FAVORITES },
]

const getBackOfficeLinks = (role) => {
    if (role === 'ADMIN') {
        return [{ label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD }]
    }

    if (role === 'MANAGER') {
        return [{ label: 'Dashboard', to: ROUTES.MANAGER_DASHBOARD }]
    }

    if (role === 'MODERATOR') {
        return [{ label: 'Dashboard', to: ROUTES.MANAGER_MODERATION_POSTS }]
    }

    return []
}

const notificationTypeLabels = {
    POST_INFORMATION: 'Tin đăng',
    POST_EXPIRING: 'Tin đăng',
    REPORT_INFORMATION: 'Báo cáo',
    PAYMENT_INFORMATION: 'Thanh toán',
    WALLET_INFORMATION: 'Ví tiền',
    SYSTEM_INFORMATION: 'Hệ thống',
    ACCOUNT_INFORMATION: 'Tài khoản',
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

const getNotificationTypeLabel = (type) => notificationTypeLabels[type] || 'Thông báo'

const BellIcon = () => (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
            d="M15 17H9m9-6a6 6 0 0 0-12 0c0 3-1.3 4.7-2 5.5-.3.4 0 .5.5.5h15c.5 0 .8-.1.5-.5-.7-.8-2-2.5-2-5.5ZM13.7 20a2 2 0 0 1-3.4 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const NotificationItem = ({ notification, onClick }) => (
    <button
        className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-slate-100 ${notification.isRead ? 'bg-white' : 'bg-emerald-50'
            }`}
        type="button"
        onClick={() => onClick(notification)}
    >
        <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-300' : 'bg-emerald-600'
                }`}
        />
        <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-700">
                    {getNotificationTypeLabel(notification.type)}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                    {formatNotificationTime(notification.createdAt)}
                </span>
            </span>
            <span className="mt-1 line-clamp-2 block text-sm font-bold leading-5 text-slate-800">
                {notification.message}
            </span>
        </span>
    </button>
)

const AppHeader = ({ user, onUserChange }) => {
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
    }, [user])

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
        try {
            await authApi.logout()
        } finally {
            localStorage.removeItem(USER_STORAGE_KEY)
            onUserChange?.(null)
            setIsMenuOpen(false)
            setIsNotificationOpen(false)
            setIsAllNotificationsOpen(false)
            setSelectedNotification(null)
            navigate(ROUTES.HOME)
        }
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

                <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
                    <a href={`${ROUTES.HOME}#search`} className="hover:text-emerald-700">
                        Tìm phòng
                    </a>
                    <Link to={ROUTES.POST_PRICING} className="hover:text-emerald-700">
                        Tin đăng
                    </Link>
                    <Link to={ROUTES.CREATE_POST} className="hover:text-emerald-700">
                        Đăng tin
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <button
                                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 ring-offset-2 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                type="button"
                                onClick={openQuickNotifications}
                                aria-label="Mở thông báo"
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <div className="relative" ref={menuRef}>
                                <button
                                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-700 ring-offset-2 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen((current) => !current)
                                        setIsNotificationOpen(false)
                                    }}
                                    aria-label="Mở menu tài khoản"
                                    aria-expanded={isMenuOpen}
                                >
                                    {user.avatar ? (
                                        <img
                                            className="h-full w-full object-cover"
                                            src={user.avatar}
                                            alt={user.fullName || 'Tài khoản'}
                                        />
                                    ) : (
                                        getInitial(user.fullName)
                                    )}
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                        <div className="border-b border-slate-200 p-4">
                                            <p className="truncate text-sm font-black text-slate-950">
                                                {user.fullName || 'Người dùng'}
                                            </p>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                {user.email || 'Tài khoản TAYTRO'}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            {[...getBackOfficeLinks(user.role), ...accountLinks].map((item) => (
                                                <Link
                                                    className="flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
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
                                                className="flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
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
                        <Link
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
                            to={ROUTES.LOGIN}
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>

            {isNotificationOpen && portalRoot && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-slate-950/45" aria-hidden="true" />
                    <div className="fixed left-1/2 top-16 z-50 w-full max-w-lg -translate-x-1/2 px-4 pt-3">
                        <div className="relative w-full rounded-lg bg-white shadow-xl">
                            <button
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                type="button"
                                onClick={() => setIsNotificationOpen(false)}
                                aria-label="Đóng thông báo"
                            >
                                ×
                            </button>
                            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 pr-14">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">Thông báo mới</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
                                    </p>
                                </div>
                            </div>

                            {notificationError && (
                                <div className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
                                    {notificationError}
                                </div>
                            )}

                            <div className="p-3">
                                {isNotificationLoading && (
                                    <div className="space-y-2 p-2">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div className="h-16 animate-pulse rounded-lg bg-slate-100" key={index} />
                                        ))}
                                    </div>
                                )}

                                {!isNotificationLoading && notifications.length === 0 && (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-500">
                                        Chưa có thông báo nào.
                                    </div>
                                )}

                                {!isNotificationLoading && (
                                    <div className="space-y-1">
                                        {notifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={handleNotificationClick}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
                                {unreadCount > 0 && (
                                    <button
                                        className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Đọc tất cả
                                    </button>
                                )}
                                <button
                                    className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
                                    type="button"
                                    onClick={openAllNotifications}
                                >
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                portalRoot
            )}

            {selectedNotification && portalRoot && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-slate-950/45" aria-hidden="true" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                        <div className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
                            <button
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                type="button"
                                onClick={() => setSelectedNotification(null)}
                                aria-label="Đóng thông báo"
                            >
                                ×
                            </button>
                            <div className="border-b border-slate-200 p-5 pr-14">
                                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                                    {getNotificationTypeLabel(selectedNotification.type)}
                                </p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Chi tiết thông báo</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {formatNotificationTime(selectedNotification.createdAt)}
                                </p>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                <p className="whitespace-pre-wrap break-words text-base font-bold leading-7 text-slate-800">
                                    {selectedNotification.message}
                                </p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
                                <button
                                    className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                                    type="button"
                                    onClick={() => setSelectedNotification(null)}
                                >
                                    Đóng
                                </button>
                                <button
                                    className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
                                    type="button"
                                    onClick={openAllNotifications}
                                >
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                portalRoot
            )}

            {isAllNotificationsOpen && portalRoot && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-slate-950/45" aria-hidden="true" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                        <div className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
                            <button
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                type="button"
                                onClick={() => setIsAllNotificationsOpen(false)}
                                aria-label="Đóng thông báo"
                            >
                                ×
                            </button>
                            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 pr-14">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">Tất cả thông báo</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {allPageInfo.totalElements} thông báo trong tài khoản của bạn
                                    </p>
                                </div>
                            </div>

                            {notificationError && (
                                <div className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
                                    {notificationError}
                                </div>
                            )}

                            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                                {isAllNotificationsLoading && allNotifications.length === 0 && (
                                    <div className="space-y-2 p-2">
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div className="h-16 animate-pulse rounded-lg bg-slate-100" key={index} />
                                        ))}
                                    </div>
                                )}

                                {!isAllNotificationsLoading && allNotifications.length === 0 && (
                                    <div className="p-10 text-center text-sm font-semibold text-slate-500">
                                        Chưa có thông báo nào.
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {allNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onClick={handleNotificationClick}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 p-4">
                                {hasMoreNotifications ? (
                                    <button
                                        className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        type="button"
                                        onClick={() => loadAllNotifications(allPageInfo.currentPage + 1, true)}
                                        disabled={isAllNotificationsLoading}
                                    >
                                        {isAllNotificationsLoading ? 'Đang tải...' : 'Tải thêm thông báo'}
                                    </button>
                                ) : (
                                    <p className="text-center text-sm font-semibold text-slate-500">
                                        Bạn đã xem hết thông báo.
                                    </p>
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
