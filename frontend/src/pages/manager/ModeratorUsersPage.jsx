import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import moderationApi from '../../api/moderationApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, FilterBar, StatusBadge, ActionButton, Pagination, Toast } from '../../components/BackOfficeParts'
import { formatDateTime, formatRelativeTime, getErrorMessage, getAvatarUrl, formatStatusLabel } from '../../utils/backOfficeFormatters'

const initialPenalty = { user: null, action: 'NONE', reason: '', lockDays: 7 }

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
    return penalty.endDate ? `${label} — ${formatDateTime(penalty.endDate)}` : label
}

const SearchIcon = () => (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
)

const UserCard = ({ user, onPenaltyClick }) => {
    const activePenalties = getActivePenalties(user)
    const statusVariant = user.status === 'ACTIVE' ? 'success' : user.status === 'BANNED' ? 'danger' : 'neutral'

    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <SafeImage
                    className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm"
                    src={user.avatar}
                    fallbackSrc={getAvatarUrl(user.fullName, 96)}
                    alt={user.fullName}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-base font-black text-slate-950">{user.fullName}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{user.email}</p>
                            <p className="text-xs font-semibold text-slate-400">{user.phoneNumber}</p>
                        </div>
                        <StatusBadge label={formatStatusLabel(user.status)} variant={statusVariant} />
                    </div>

                    {/* Penalties */}
                    {activePenalties.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {activePenalties.map((item) => (
                                <span
                                    key={item.id}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                                        item.type === 'WARNING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                        item.type === 'LOCK_POST' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                        'bg-red-50 text-red-700 ring-1 ring-red-200'
                                    }`}
                                    title={item.reason || ''}
                                >
                                    {penaltyLabel[item.type] || item.type}
                                    {item.endDate && <span className="opacity-70"> — {formatRelativeTime(item.endDate)}</span>}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-xs font-semibold text-emerald-600">Không có hình phạt</p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-slate-400">
                            Tham gia: {formatRelativeTime(user.createdAt)}
                        </p>
                        <ActionButton
                            label="Xử phạt"
                            variant="secondary"
                            onClick={() => onPenaltyClick(user)}
                            className="h-8 px-3 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const PenaltyModal = ({ penalty, setPenalty, onSubmit, saving, initialPenalty }) => {
    const isClearing = penalty.action === 'NONE'
    const activePenalties = getActivePenalties(penalty.user)

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
                    {/* Current penalties */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Hình phạt hiện tại</h3>
                        {activePenalties.length > 0 ? (
                            <div className="mt-3 space-y-2">
                                {activePenalties.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                                            item.type === 'WARNING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                            item.type === 'LOCK_POST' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                                            'bg-red-50 text-red-700 ring-1 ring-red-200'
                                        }`}>
                                            {penaltyLabel[item.type] || item.type}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">{formatPenaltyLabel(item)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-sm font-semibold text-slate-400">Không có hình phạt hiện tại</p>
                        )}
                    </div>

                    {/* Penalty type */}
                    <div>
                        <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Hình thức xử phạt</h3>
                        <div className="space-y-2">
                            {penaltyOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.01] ${
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

                    {/* Clearing warning */}
                    {isClearing && activePenalties.length > 0 && (
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

const ModeratorUsersPage = () => {
    const [filters, setFilters] = useState({ keyword: '', status: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [penalty, setPenalty] = useState(initialPenalty)
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

    const handlePenaltyActionChange = (user, action) => {
        if (action === 'NONE') {
            if (getActivePenalties(user).length > 0) {
                setPenalty({ ...initialPenalty, user, action })
                return
            }
            setPenalty(initialPenalty)
            return
        }
        if (!action) { setPenalty(initialPenalty); return }
        setPenalty({ ...initialPenalty, user, action })
    }

    const statusTabs = [
        { value: '', label: 'Tất cả' },
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Không hoạt động' },
        { value: 'BANNED', label: 'Bị cấm' },
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
                            onPenaltyClick={(u) => handlePenaltyActionChange(u, 'WARNING')}
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
        </BackOfficeLayout>
    )
}

export default ModeratorUsersPage
