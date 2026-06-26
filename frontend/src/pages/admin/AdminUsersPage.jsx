import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination, StatusBadge, ConfirmModal, FilterBar } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage, formatRole, formatStatusLabel } from '../../utils/backOfficeFormatters'

const defaultFilters = { keyword: '', role: '', status: '', page: 0, size: 10 }

const roleOptions = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'USER', label: 'Người dùng' },
    { value: 'MODERATOR', label: 'Kiểm duyệt viên' },
    { value: 'MANAGER', label: 'Quản lý' },
    { value: 'ADMIN', label: 'Quản trị viên' },
]

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'BANNED', label: 'Bị cấm' },
]

const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'ACTIVE': return 'success'
        case 'INACTIVE': return 'warning'
        case 'BANNED': return 'danger'
        default: return 'neutral'
    }
}

const AdminUsersPage = () => {
    const [filters, setFilters] = useState(defaultFilters)
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [confirmState, setConfirmState] = useState({ open: false, loading: false, userId: null, newStatus: null, userName: '' })

    const loadUsers = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await adminApi.getUsers(nextFilters)
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

    const openConfirmModal = (user) => {
        const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED'
        const action = newStatus === 'BANNED' ? 'cấm' : 'bỏ cấm'
        setConfirmState({
            open: true,
            loading: false,
            userId: user.id,
            newStatus,
            userName: user.fullName,
            action,
        })
    }

    const handleConfirm = async () => {
        setConfirmState((s) => ({ ...s, loading: true }))
        try {
            await adminApi.updateUserStatus(confirmState.userId, confirmState.newStatus)
            setMessage(`${confirmState.newStatus === 'BANNED' ? 'Cấm' : 'Bỏ cấm'} tài khoản thành công.`)
            setConfirmState({ open: false, loading: false, userId: null, newStatus: null, userName: '', action: '' })
            loadUsers()
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Không cập nhật được trạng thái.'))
            setConfirmState((s) => ({ ...s, loading: false }))
        }
    }

    return (
        <BackOfficeLayout title="Quản lý người dùng" subtitle="Tìm kiếm, lọc và cập nhật trạng thái tài khoản người dùng.">
            <form onSubmit={submitFilters}>
                <FilterBar className="mb-5 flex-nowrap overflow-x-auto">
                    <input
                        className="h-10 min-w-52 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors sm:max-w-72"
                        placeholder="Tìm theo tên, email, số điện thoại"
                        value={filters.keyword}
                        onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                    />
                    <select
                        className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.role}
                        onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                    >
                        {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select
                        className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.status}
                        onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    >
                        {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <button
                        className="h-10 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                        type="submit"
                    >
                        Lọc
                    </button>
                </FilterBar>
            </form>

            <div className="mb-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows rows={5} /></div>
                ) : pageData.users.length === 0 ? (
                    <EmptyState message="Không có người dùng phù hợp." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Tài khoản</th>
                                    <th className="px-4 py-3">Vai trò</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Ngày tạo</th>
                                    <th className="px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.users.map((user) => (
                                    <tr key={user.id} className="group transition-colors hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-black text-slate-950">{user.fullName}</p>
                                            <p className="text-xs font-semibold text-slate-500">{user.email} | {user.phoneNumber}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge label={formatRole(user.role)} variant="neutral" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge label={formatStatusLabel(user.status)} variant={getStatusBadgeVariant(user.status)} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(user.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                className={`h-10 rounded-xl border px-4 text-sm font-bold transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] ${
                                                    user.status === 'BANNED'
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                                type="button"
                                                onClick={() => openConfirmModal(user)}
                                            >
                                                {user.status === 'BANNED' ? 'Bỏ cấm' : 'Cấm'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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

            {confirmState.open && (
                <ConfirmModal
                    title={confirmState.newStatus === 'BANNED' ? 'Cấm tài khoản' : 'Bỏ cấm tài khoản'}
                    message={`Bạn có chắc chắn muốn ${confirmState.action} tài khoản của "${confirmState.userName}" không?`}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmState({ open: false, loading: false, userId: null, newStatus: null, userName: '', action: '' })}
                    loading={confirmState.loading}
                    confirmLabel={confirmState.newStatus === 'BANNED' ? 'Cấm' : 'Bỏ cấm'}
                    variant={confirmState.newStatus === 'BANNED' ? 'danger' : 'success'}
                />
            )}
        </BackOfficeLayout>
    )
}

export default AdminUsersPage
