import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import moderationApi from '../../api/moderationApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, FilterBar, StatusBadge, ActionButton, Pagination, Toast } from '../../components/BackOfficeParts'
import { formatDateTime, formatRelativeTime, getErrorMessage, getAvatarUrl, formatStatusLabel } from '../../utils/backOfficeFormatters'

const initialPenalty = { user: null, action: 'NONE', reason: '', lockDays: 7, hasTimedBan: false }

const penaltyOptions = [
    { value: 'NONE', label: 'Không xử phạt', description: 'Gỡ tất cả hình phạt hiện tại', variant: 'neutral' },
    { value: 'WARNING', label: 'Cảnh cáo', description: 'Cảnh cáo bằng lời nhắn', variant: 'warning' },
    { value: 'LOCK_POST', label: 'Khóa đăng tin', description: 'Tạm khóa chức năng đăng tin', variant: 'amber' },
    { value: 'BAN_7_DAYS', label: 'Ban 7 ngày', description: 'Cấm tài khoản trong 7 ngày', variant: 'danger' },
    { value: 'BAN_FOREVER', label: 'Ban vĩnh viễn', description: 'Cấm tài khoản vĩnh viễn', variant: 'danger' },
]

const penaltyLabel = {
    WARNING: 'Cảnh cáo',
    LOCK_POST: 'Khóa đăng tin',
    BAN_ACCOUNT: 'Ban tài khoản',
}

const buildPenaltyPayload = (penalty) => {
    if (penalty.action === 'LOCK_POST') {
        return { type: 'LOCK_POST', reason: penalty.reason, durationDays: Number(penalty.lockDays) || 7 }
    }
    if (penalty.action === 'BAN_7_DAYS') {
        return { type: 'BAN_ACCOUNT', reason: penalty.reason, durationDays: 7 }
    }
    if (penalty.action === 'BAN_FOREVER') {
        return { type: 'BAN_ACCOUNT', reason: penalty.reason }
    }
    return { type: 'WARNING', reason: penalty.reason }
}

const getActivePenalties = (user) => user?.activePenalties || []

const formatPenaltyLabel = (penalty) => {
    const label = penaltyLabel[penalty.type] || penalty.type || 'Hình phạt'
    return penalty.startDate ? `${label} — ${formatDateTime(penalty.startDate)}` : label
}

const SearchIcon = () => (
    <svg className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
)

const UserCard = ({ user, onPenaltyClick, onDetailClick }) => {
    const activePenalties = getActivePenalties(user)
    const statusVariant = user.status === 'ACTIVE' ? 'success' : user.status === 'BANNED' ? 'danger' : 'neutral'

    return (
        <div className="group rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5">
            {/* Main info row */}
            <div className="flex items-center gap-4 p-4">
                {/* Avatar */}
                <SafeImage
                    className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
                    src={user.avatar}
                    fallbackSrc={getAvatarUrl(user.fullName, 80)}
                    alt={user.fullName}
                />

                {/* Info columns */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 truncate">{user.fullName}</p>
                    <p className="text-xs font-semibold text-slate-500 truncate">{user.email}</p>
                    <p className="text-xs font-semibold text-slate-400">{user.phoneNumber || '—'}</p>
                </div>

                {/* Status */}
                <StatusBadge label={formatStatusLabel(user.status)} variant={statusVariant} />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <ActionButton
                        label="Chi tiết"
                        variant="secondary"
                        onClick={() => onDetailClick(user)}
                        className="h-8 px-3 text-xs shrink-0"
                    />
                    <ActionButton
                        label="Xử phạt"
                        variant="secondary"
                        onClick={() => onPenaltyClick(user)}
                        className="h-8 px-3 text-xs shrink-0"
                    />
                </div>
            </div>
        </div>
    )
}

const PenaltyModal = ({ penalty, setPenalty, onSubmit, saving, initialPenalty }) => {
    const isClearing = penalty.action === 'NONE'
    const activePenalties = getActivePenalties(penalty.user)
    const historyPenalties = penalty.historyPenalties || []
    const isPermanentBan = penalty.isPermanentBan
    const displayPenaltyOptions = penalty.hasTimedBan
        ? penaltyOptions.filter(o => o.value === 'NONE' || o.value === 'BAN_FOREVER')
        : penaltyOptions

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            {isClearing ? 'Gỡ hình phạt' : 'Xử phạt người dùng'}
                        </h2>
                        <div className="mt-1 flex items-center gap-2">
                            <SafeImage
                                className="h-8 w-8 shrink-0 rounded-xl object-cover"
                                src={penalty.user?.avatar}
                                fallbackSrc={getAvatarUrl(penalty.user?.fullName, 64)}
                                alt={penalty.user?.fullName}
                            />
                            <div>
                                <p className="text-sm font-black text-slate-950">{penalty.user?.fullName}</p>
                                <p className="text-xs font-semibold text-slate-500">{penalty.user?.email}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl font-black text-slate-400 transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                        type="button"
                        onClick={() => setPenalty(initialPenalty)}
                    >×</button>
                </div>

                <div className="space-y-4 p-5">
                    {/* Active penalty */}
                    {activePenalties.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Hình phạt hiện tại</h3>
                            {(() => {
                                const item = activePenalties[0]
                                return (
                                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                                            item.type === 'WARNING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                            item.type === 'LOCK_POST' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                            'bg-red-50 text-red-700 ring-1 ring-red-200'
                                        }`}>
                                            {penaltyLabel[item.type] || item.type}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">{formatPenaltyLabel(item)}</span>
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {/* Penalty type */}
                    {!isPermanentBan && (
                        <div>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Hình thức xử phạt</h3>
                            <div className="space-y-2">
                                {displayPenaltyOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                                            penalty.action === option.value
                                                ? option.variant === 'danger'
                                                    ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                                                    : option.variant === 'amber'
                                                      ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                                                      : option.variant === 'warning'
                                                        ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                                                        : 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="penaltyAction"
                                            value={option.value}
                                            checked={penalty.action === option.value}
                                            onChange={() => setPenalty((p) => ({ ...p, action: option.value, reason: option.value === 'NONE' ? '' : p.reason }))}
                                            className="accent-emerald-600"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-950">{option.label}</p>
                                            <p className="text-xs font-semibold text-slate-500">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Only NONE option for permanent ban */}
                    {isPermanentBan && (
                        <div>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Hình thức xử phạt</h3>
                            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 ring-2 ring-emerald-200`}>
                                <input
                                    type="radio"
                                    name="penaltyAction"
                                    value="NONE"
                                    checked={penalty.action === 'NONE'}
                                    onChange={() => setPenalty((p) => ({ ...p, action: 'NONE' }))}
                                    className="accent-emerald-600"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-950">Không xử phạt</p>
                                    <p className="text-xs font-semibold text-slate-500">Gỡ tất cả hình phạt hiện tại</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Clearing warning */}
                    {isClearing && activePenalties.length > 0 && !isPermanentBan && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="flex items-start gap-2 text-sm font-bold text-amber-800">
                                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                Thao tác này sẽ gỡ tất cả hình phạt hiện tại. Nếu tài khoản đang bị cấm, trạng thái sẽ được chuyển về Hoạt động.
                            </p>
                        </div>
                    )}

                    {/* Penalty history */}
                    {historyPenalties.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Lịch sử xử phạt</h3>
                            <div className="mt-3 space-y-2">
                                {historyPenalties.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                                            item.type === 'WARNING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                            item.type === 'LOCK_POST' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                            'bg-red-50 text-red-700 ring-1 ring-red-200'
                                        }`}>
                                            {penaltyLabel[item.type] || item.type}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-slate-500">{formatPenaltyLabel(item)}</span>
                                            {item.reason && <p className="text-[10px] text-slate-400 mt-0.5">{item.reason}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lock duration */}
                    {penalty.action === 'LOCK_POST' && (
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">
                                Số ngày khóa đăng tin
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                                value={penalty.lockDays}
                                onChange={(e) => setPenalty((p) => ({ ...p, lockDays: e.target.value }))}
                                required
                            />
                        </div>
                    )}

                    {/* Reason */}
                    {penalty.action !== 'NONE' && (
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">
                                Lý do <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                                placeholder="Nhập lý do xử phạt người dùng..."
                                value={penalty.reason}
                                onChange={(e) => setPenalty((p) => ({ ...p, reason: e.target.value }))}
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 border-t border-slate-100 p-4">
                    <ActionButton
                        label="Hủy"
                        variant="secondary"
                        onClick={() => setPenalty(initialPenalty)}
                        className="flex-1"
                    />
                    <ActionButton
                        label={isClearing ? 'Gỡ hình phạt' : 'Lưu'}
                        variant={isClearing ? 'primary' : 'danger'}
                        onClick={onSubmit}
                        loading={saving}
                        className="flex-1"
                        disabled={penalty.action !== 'NONE' && !penalty.reason.trim()}
                    />
                </div>
            </div>
        </div>
    )
}

const UserDetailModal = ({ user, onClose }) => {
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true)
            try {
                const response = await moderationApi.getUserDetail(user.id)
                setDetail(response.data.users[0])
            } catch (error) {
                console.error('Failed to load user detail:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [user.id])

    const displayUser = detail || user
    const penalties = displayUser.activePenalties || []

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <h2 className="text-xl font-black text-slate-950">Chi tiết người dùng</h2>
                    <button
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl font-black text-slate-400 transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                        type="button"
                        onClick={onClose}
                    >×</button>
                </div>

                <div className="space-y-4 p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {/* User info */}
                            <div className="flex items-center gap-4">
                                <SafeImage
                                    className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-sm"
                                    src={displayUser.avatar}
                                    fallbackSrc={getAvatarUrl(displayUser.fullName, 128)}
                                    alt={displayUser.fullName}
                                />
                                <div>
                                    <p className="text-lg font-black text-slate-950">{displayUser.fullName}</p>
                                    <p className="text-sm font-semibold text-slate-500">{displayUser.email}</p>
                                    <p className="text-sm font-semibold text-slate-400">{displayUser.phoneNumber || '—'}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">Trạng thái</span>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                        displayUser.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        displayUser.status === 'BANNED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {formatStatusLabel(displayUser.status)}
                                    </span>
                                </div>
                            </div>

                            {/* Penalty history */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Lịch sử xử phạt</h3>
                                {penalties.length > 0 ? (
                                    <div className="mt-3 space-y-2">
                                        {penalties.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                                                    item.type === 'WARNING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                                    item.type === 'LOCK_POST' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                                    'bg-red-50 text-red-700 ring-1 ring-red-200'
                                                }`}>
                                                    {penaltyLabel[item.type] || item.type}
                                                </span>
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold text-slate-500">{formatPenaltyLabel(item)}</span>
                                                    {item.reason && <p className="text-[10px] text-slate-400 mt-0.5">{item.reason}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm font-semibold text-slate-400">Không có lịch sử xử phạt</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const ModeratorUsersPage = () => {
    const [filters, setFilters] = useState({ keyword: '', status: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [penalty, setPenalty] = useState(initialPenalty)
    const [detailUser, setDetailUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const loadUsers = async (nextFilters = filters) => {
        setLoading(true)
        try {
            const response = await moderationApi.getUsers(nextFilters)
            setPageData(response.data || { users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            showToast('error', getErrorMessage(loadError, 'Không tải được danh sách người dùng.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        flushSync(() => { loadUsers() })
    }, [])

    const submitFilters = (e) => {
        e.preventDefault()
        setFilters((f) => ({ ...f, page: 0 }))
        loadUsers({ ...filters, page: 0 })
    }

    const submitPenalty = async (e) => {
        e.preventDefault()

        if (
            penalty.action === 'NONE'
            && getActivePenalties(penalty.user).length === 0
            && penalty.user?.status !== 'BANNED'
        ) {
            setPenalty(initialPenalty)
            return
        }

        setSaving(true)
        try {
            if (penalty.action === 'NONE') {
                await moderationApi.clearUserPenalties(penalty.user.id)
                showToast('success', 'Đã gỡ tất cả hình phạt của người dùng.')
            } else {
                await moderationApi.banUser(penalty.user.id, buildPenaltyPayload(penalty))
                showToast('success', 'Xử phạt người dùng thành công.')
            }
            setPenalty(initialPenalty)
            loadUsers(filters)
        } catch (penaltyError) {
            showToast('error', getErrorMessage(penaltyError, 'Không xử lý được người dùng.'))
        } finally {
            setSaving(false)
        }
    }

    const handlePenaltyActionChange = (user) => {
        const activePenalties = getActivePenalties(user)
        const hasPermanentBan = activePenalties.some(p => p.type === 'BAN_ACCOUNT' && !p.endDate)
        const hasTimedBan = activePenalties.some(p => p.type === 'BAN_ACCOUNT' && p.endDate)

        setPenalty({
            ...initialPenalty,
            user,
            action: 'NONE',
            isPermanentBan: hasPermanentBan,
            hasTimedBan: hasTimedBan,
            historyPenalties: user.penalties || []
        })
    }

    const statusTabs = [
        { value: '', label: 'Tất cả' },
        { value: 'ACTIVE', label: 'Đang hoạt động' },
        { value: 'BANNED', label: 'Ban tài khoản' },
    ]

    return (
        <BackOfficeLayout section="manager" title="Quản lý người dùng" subtitle="Theo dõi và xử lý người dùng thường — cảnh cáo, khóa đăng tin hoặc ban tài khoản.">
            {/* Filter */}
            <form onSubmit={submitFilters}>
                <FilterBar className="mb-5">
                    <div className="relative flex-1">
                        <SearchIcon />
                        <input
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-semibold placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            value={filters.keyword}
                            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                        />
                    </div>
                    <select
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.status}
                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    >
                        {statusTabs.map((tab) => (
                            <option key={tab.value} value={tab.value}>{tab.label}</option>
                        ))}
                    </select>
                    <button
                        className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                        type="submit"
                    >
                        Lọc
                    </button>
                </FilterBar>
            </form>

            {/* Status tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.value}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                            filters.status === tab.value
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        type="button"
                        onClick={() => {
                            const next = { ...filters, status: tab.value, page: 0 }
                            setFilters(next)
                            loadUsers(next)
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* User list */}
            <div className="space-y-3">
                {loading ? (
                    <LoadingRows rows={4} />
                ) : pageData.users.length === 0 ? (
                    <EmptyState message="Không có người dùng phù hợp." />
                ) : (
                    pageData.users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onPenaltyClick={(u) => handlePenaltyActionChange(u)}
                            onDetailClick={(u) => setDetailUser(u)}
                        />
                    ))
                )}
            </div>

            <Pagination
                pageInfo={pageData}
                onPageChange={(page) => {
                    const next = { ...filters, page }
                    setFilters(next)
                    loadUsers(next)
                }}
            />

            {penalty.user && (
                <PenaltyModal
                    penalty={penalty}
                    setPenalty={setPenalty}
                    onSubmit={submitPenalty}
                    saving={saving}
                    initialPenalty={initialPenalty}
                />
            )}

            {detailUser && (
                <UserDetailModal
                    user={detailUser}
                    onClose={() => setDetailUser(null)}
                />
            )}
        </BackOfficeLayout>
    )
}

export default ModeratorUsersPage
