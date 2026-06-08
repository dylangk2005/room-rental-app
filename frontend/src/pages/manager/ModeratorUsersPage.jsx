import { useEffect, useState } from 'react'
import moderationApi from '../../api/moderationApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

const initialPenalty = { user: null, action: 'NONE', reason: '', lockDays: 7 }

const penaltyOptions = [
    { value: 'NONE', label: 'Không xử phạt' },
    { value: 'WARNING', label: 'Cảnh cáo' },
    { value: 'LOCK_POST', label: 'Khóa chức năng đăng tin' },
    { value: 'BAN_7_DAYS', label: 'Ban 7 ngày' },
    { value: 'BAN_FOREVER', label: 'Ban vĩnh viễn' },
]

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

const penaltyLabels = {
    WARNING: 'Cảnh cáo',
    LOCK_POST: 'Khóa đăng tin',
    BAN_ACCOUNT: 'Ban tài khoản',
}

const penaltyBadgeClasses = {
    WARNING: 'bg-amber-50 text-amber-700 ring-amber-200',
    LOCK_POST: 'bg-orange-50 text-orange-700 ring-orange-200',
    BAN_ACCOUNT: 'bg-red-50 text-red-700 ring-red-200',
}

const getActivePenalties = (user) => user?.activePenalties || []

const formatPenaltyLabel = (penalty) => {
    const label = penaltyLabels[penalty.type] || penalty.type || 'Hình phạt'
    return penalty.endDate ? `${label} đến ${formatDateTime(penalty.endDate)}` : label
}

const ModeratorUsersPage = () => {
    const [filters, setFilters] = useState({ keyword: '', status: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [penalty, setPenalty] = useState(initialPenalty)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadUsers = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await moderationApi.getUsers(nextFilters)
            setPageData(response.data || { users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được danh sách người dùng.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const submitFilters = (event) => {
        event.preventDefault()
        const nextFilters = { ...filters, page: 0 }
        setFilters(nextFilters)
        loadUsers(nextFilters)
    }

    const submitPenalty = async (event) => {
        event.preventDefault()

        if (
            penalty.action === 'NONE'
            && getActivePenalties(penalty.user).length === 0
            && penalty.user?.status !== 'BANNED'
        ) {
            setPenalty(initialPenalty)
            return
        }

        setSaving(true)
        setMessage('')
        setError('')
        try {
            if (penalty.action === 'NONE') {
                await moderationApi.clearUserPenalties(penalty.user.id)
                setMessage('Đã gỡ tất cả hình phạt hiện hữu của người dùng.')
            } else {
                await moderationApi.banUser(penalty.user.id, buildPenaltyPayload(penalty))
                setMessage('Xử phạt người dùng thành công.')
            }
            setPenalty(initialPenalty)
            loadUsers(filters)
        } catch (penaltyError) {
            setError(getErrorMessage(penaltyError, 'Không xử lý được người dùng.'))
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

        if (!action) {
            setPenalty(initialPenalty)
            return
        }

        setPenalty({ ...initialPenalty, user, action })
    }

    return (
        <BackOfficeLayout section="manager" title="Quản lý người dùng" subtitle="Kiểm duyệt viên theo dõi người dùng thường và áp dụng cảnh cáo, khóa đăng tin hoặc ban tài khoản.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto]" onSubmit={submitFilters}>
                <input
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    placeholder="Tìm theo tên, email, số điện thoại"
                    value={filters.keyword}
                    onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                />
                <select
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BANNED">BANNED</option>
                </select>
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white" type="submit">
                    Lọc
                </button>
            </form>

            <div className="mt-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.users.length === 0 ? (
                    <EmptyState message="Không có người dùng phù hợp." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Ngày tạo</th>
                                    <th className="px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.users.map((user) => {
                                    const activePenalties = getActivePenalties(user)

                                    return (
                                        <tr key={user.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-black text-slate-950">{user.fullName}</p>
                                                <p className="text-xs font-semibold text-slate-500">{user.email} | {user.phoneNumber}</p>
                                            </td>
                                            <td className="px-4 py-3 font-bold">{user.status}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(user.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-3">
                                                    <div className="flex max-w-sm flex-wrap gap-2">
                                                        {activePenalties.length > 0 ? (
                                                            activePenalties.map((item) => (
                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${penaltyBadgeClasses[item.type] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}
                                                                    key={item.id}
                                                                    title={item.reason || ''}
                                                                >
                                                                    {formatPenaltyLabel(item)}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-500">Không có hình phạt hiện hữu</span>
                                                        )}
                                                    </div>
                                                    <select
                                                        className="h-10 min-w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"
                                                        value={penalty.user?.id === user.id ? penalty.action : ''}
                                                        onChange={(event) => handlePenaltyActionChange(user, event.target.value)}
                                                    >
                                                        <option value="">Chọn thao tác</option>
                                                        {penaltyOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            <Pagination
                pageInfo={pageData}
                onPageChange={(page) => {
                    const nextFilters = { ...filters, page }
                    setFilters(nextFilters)
                    loadUsers(nextFilters)
                }}
            />

            {penalty.user && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
                    <form className="w-full max-w-xl rounded-lg bg-white shadow-xl" onSubmit={submitPenalty}>
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="text-xl font-black text-slate-950">
                                {penalty.action === 'NONE' ? 'Gỡ hình phạt người dùng' : 'Xử phạt người dùng'}
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                {penalty.user.fullName} | {penalty.user.email}
                            </p>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-black text-slate-800">Hình phạt hiện hữu</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {getActivePenalties(penalty.user).length > 0 ? (
                                        getActivePenalties(penalty.user).map((item) => (
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${penaltyBadgeClasses[item.type] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}
                                                key={item.id}
                                                title={item.reason || ''}
                                            >
                                                {formatPenaltyLabel(item)}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-semibold text-slate-500">Không có hình phạt hiện hữu</span>
                                    )}
                                </div>
                            </div>
                            <label className="block text-sm font-bold text-slate-700">
                                Hình thức xử phạt
                                <select className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={penalty.action} onChange={(event) => setPenalty((current) => ({ ...current, action: event.target.value, reason: event.target.value === 'NONE' ? '' : current.reason }))}>
                                    {penaltyOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            {penalty.action === 'NONE' && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                                    Lưu thao tác này sẽ gỡ tất cả hình phạt hiện hữu của người dùng. Nếu tài khoản đang bị ban, trạng thái sẽ được chuyển về ACTIVE.
                                </div>
                            )}
                            {penalty.action === 'LOCK_POST' && (
                                <label className="block text-sm font-bold text-slate-700">
                                    Số ngày khóa đăng tin
                                    <input className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="number" min="1" value={penalty.lockDays} onChange={(event) => setPenalty((current) => ({ ...current, lockDays: event.target.value }))} required />
                                </label>
                            )}
                            {penalty.action !== 'NONE' && (
                                <label className="block text-sm font-bold text-slate-700">
                                    Lý do
                                    <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" value={penalty.reason} onChange={(event) => setPenalty((current) => ({ ...current, reason: event.target.value }))} required />
                                </label>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setPenalty(initialPenalty)}>Đóng</button>
                            <button className={`h-10 rounded-lg px-4 text-sm font-black text-white disabled:opacity-60 ${penalty.action === 'NONE' ? 'bg-emerald-600' : 'bg-red-600'}`} type="submit" disabled={saving}>
                                {saving ? 'Đang lưu...' : (penalty.action === 'NONE' ? 'Gỡ hình phạt' : 'Lưu')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </BackOfficeLayout>
    )
}

export default ModeratorUsersPage
