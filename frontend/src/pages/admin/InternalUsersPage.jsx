import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

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

const InternalUsersPage = () => {
    const [form, setForm] = useState(initialForm)
    const [editForm, setEditForm] = useState(null)
    const [filters, setFilters] = useState({ role: '', status: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

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

    const deleteInternalUser = async () => {
        const confirmed = window.confirm('Bạn chắc chắn muốn xóa tài khoản nội bộ này?')
        if (!confirmed) return

        setDeleting(true)
        setMessage('')
        setError('')
        try {
            await adminApi.deleteInternalUser(editForm.id)
            setEditForm(null)
            setMessage('Xóa tài khoản nội bộ thành công.')
            loadInternalUsers({ ...filters, page: 0 })
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Không xóa được tài khoản nội bộ.'))
        } finally {
            setDeleting(false)
        }
    }

    return (
        <BackOfficeLayout title="Tài khoản nội bộ" subtitle="Tạo, theo dõi và cập nhật tài khoản kiểm duyệt viên, quản lý, quản trị viên.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-5" onSubmit={createInternalUser}>
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Họ tên" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Số điện thoại" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} required />
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
                <button className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white" type="submit">Tạo tài khoản</button>
            </form>

            <div className="mt-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.users.length === 0 ? (
                    <EmptyState message="Chưa có tài khoản nội bộ." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Tài khoản</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Ngày tạo</th>
                                    <th className="px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-black text-slate-950">{user.fullName}</p>
                                            <p className="text-xs font-semibold text-slate-500">{user.email} | {user.phoneNumber}</p>
                                        </td>
                                        <td className="px-4 py-3 font-bold">{user.role}</td>
                                        <td className="px-4 py-3 font-bold">{user.status}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(user.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100" type="button" onClick={() => setEditForm(buildEditForm(user))}>
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
                    <form className="w-full max-w-2xl rounded-lg bg-white shadow-xl" onSubmit={updateInternalUser}>
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="text-xl font-black text-slate-950">Cập nhật tài khoản nội bộ</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">ID #{editForm.id}. Để trống mật khẩu nếu không muốn đổi.</p>
                        </div>
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            <label className="text-sm font-bold text-slate-700">
                                Họ tên
                                <input className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={editForm.fullName} onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Email
                                <input className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Số điện thoại
                                <input className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={editForm.phoneNumber} onChange={(event) => setEditForm((current) => ({ ...current, phoneNumber: event.target.value }))} required />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Mật khẩu mới
                                <input className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Không đổi nếu để trống" type="password" value={editForm.password} onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))} minLength={6} />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Role
                                <select className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={editForm.role} onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}>
                                    <option value="MODERATOR">MODERATOR</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Trạng thái
                                <select className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="BANNED">BANNED</option>
                                </select>
                            </label>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <button className="h-10 rounded-lg bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60" type="button" onClick={deleteInternalUser} disabled={deleting || saving}>
                                {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                            </button>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setEditForm(null)}>Đóng</button>
                                <button className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-60" type="submit" disabled={saving || deleting}>
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </BackOfficeLayout>
    )
}

export default InternalUsersPage
