import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination, StatusBadge, ConfirmModal, FilterBar } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage, formatRole, formatStatusLabel } from '../../utils/backOfficeFormatters'

const initialForm = { fullName: '', email: '', phoneNumber: '', role: 'MODERATOR' }

const buildEditForm = (user) => ({
    id: user.id,
    fullName: user.fullName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role || 'MODERATOR',
    status: user.status || 'ACTIVE',
    password: '',
})

const cleanEditPayload = (form) => {
    const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
        status: form.status,
    }

    if (form.password.trim()) {
        payload.password = form.password
    }

    return payload
}

const roleOptions = [
    { value: 'MODERATOR', label: 'Kiểm duyệt viên' },
    { value: 'MANAGER', label: 'Quản lý' },
    { value: 'ADMIN', label: 'Quản trị viên' },
]

const statusOptions = [
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

const InternalUsersPage = () => {
    const [form, setForm] = useState(initialForm)
    const [editForm, setEditForm] = useState(null)
    const [filters, setFilters] = useState({ role: '', status: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState({ open: false, loading: false, userName: '' })

    const loadInternalUsers = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await adminApi.getInternalUsers(nextFilters)
            setPageData(response.data || { users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được tài khoản nội bộ.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadInternalUsers()
    }, [])

    const createInternalUser = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        try {
            await adminApi.createInternalUser(form)
            setForm(initialForm)
            setMessage('Tạo tài khoản nội bộ thành công.')
            loadInternalUsers({ ...filters, page: 0 })
        } catch (createError) {
            setError(getErrorMessage(createError, 'Không tạo được tài khoản nội bộ.'))
        }
    }

    const updateInternalUser = async (event) => {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        setError('')
        try {
            await adminApi.updateInternalUser(editForm.id, cleanEditPayload(editForm))
            setEditForm(null)
            setMessage('Cập nhật tài khoản nội bộ thành công.')
            loadInternalUsers(filters)
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Không cập nhật được tài khoản nội bộ.'))
        } finally {
            setSaving(false)
        }
    }

    const openDeleteConfirm = (user) => {
        setConfirmDelete({ open: true, loading: false, userName: user.fullName, userId: user.id })
    }

    const handleDelete = async () => {
        setConfirmDelete((s) => ({ ...s, loading: true }))
        try {
            await adminApi.deleteInternalUser(confirmDelete.userId)
            setConfirmDelete({ open: false, loading: false, userName: '', userId: null })
            setEditForm(null)
            setMessage('Xóa tài khoản nội bộ thành công.')
            loadInternalUsers({ ...filters, page: 0 })
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Không xóa được tài khoản nội bộ.'))
            setConfirmDelete((s) => ({ ...s, loading: false }))
        }
    }

    const submitFilters = (event) => {
        event.preventDefault()
        const nextFilters = { ...filters, page: 0 }
        setFilters(nextFilters)
        loadInternalUsers(nextFilters)
    }

    return (
        <BackOfficeLayout title="Tài khoản nội bộ" subtitle="Tạo, theo dõi và cập nhật tài khoản kiểm duyệt viên, quản lý, quản trị viên.">
            <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-5" onSubmit={createInternalUser}>
                <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" placeholder="Họ tên" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
                <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" placeholder="Số điện thoại" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} required />
                <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                    {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]" type="submit">Tạo tài khoản</button>
            </form>

            <form onSubmit={submitFilters}>
                <FilterBar className="mb-5 flex-nowrap overflow-x-auto">
                    <select
                        className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.role}
                        onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                    >
                        <option value="">Tất cả vai trò</option>
                        {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select
                        className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.status}
                        onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    >
                        <option value="">Tất cả trạng thái</option>
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
                    <EmptyState message="Chưa có tài khoản nội bộ." />
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
                                                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all duration-200 hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md active:scale-[0.98]"
                                                type="button"
                                                onClick={() => setEditForm(buildEditForm(user))}
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const nextFilters = { ...filters, page }
                setFilters(nextFilters)
                loadInternalUsers(nextFilters)
            }} />

            {editForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
                    <form className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onSubmit={updateInternalUser}>
                        <div className="border-b border-slate-100 p-5">
                            <h2 className="text-xl font-black text-slate-950">Cập nhật tài khoản nội bộ</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">ID #{editForm.id}. Để trống mật khẩu nếu không muốn đổi.</p>
                        </div>
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            <label className="text-sm font-bold text-slate-700">
                                Họ tên
                                <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" value={editForm.fullName} onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Email
                                <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Số điện thoại
                                <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" value={editForm.phoneNumber} onChange={(event) => setEditForm((current) => ({ ...current, phoneNumber: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Mật khẩu mới
                                <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" placeholder="Không đổi nếu để trống" type="password" value={editForm.password} onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))} minLength={6} />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Vai trò
                                <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" value={editForm.role} onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}>
                                    {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Trạng thái
                                <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors" value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}>
                                    {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition-all duration-200 hover:scale-[1.03] hover:bg-red-100 hover:shadow-md active:scale-[0.98]"
                                type="button"
                                onClick={() => openDeleteConfirm(editForm)}
                                disabled={saving}
                            >
                                Xóa tài khoản
                            </button>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-all duration-200 hover:scale-[1.03] hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
                                    type="button"
                                    onClick={() => setEditForm(null)}
                                >
                                    Đóng
                                </button>
                                <button
                                    className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {confirmDelete.open && (
                <ConfirmModal
                    title="Xóa tài khoản nội bộ"
                    message={`Bạn có chắc chắn muốn xóa tài khoản của "${confirmDelete.userName}" không? Hành động này không thể hoàn tác.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete({ open: false, loading: false, userName: '', userId: null })}
                    loading={confirmDelete.loading}
                    confirmLabel="Xóa"
                    variant="danger"
                />
            )}
        </BackOfficeLayout>
    )
}

export default InternalUsersPage
