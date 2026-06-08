import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

const defaultFilters = { keyword: '', role: '', status: '', page: 0, size: 10 }

const AdminUsersPage = () => {
    const [filters, setFilters] = useState(defaultFilters)
    const [pageData, setPageData] = useState({ users: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

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

    const updateStatus = async (userId, status) => {
        setMessage('')
        setError('')
        try {
            await adminApi.updateUserStatus(userId, status)
            setMessage('Cập nhật trạng thái tài khoản thành công.')
            loadUsers()
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Không cập nhật được trạng thái.'))
        }
    }

    const submitFilters = (event) => {
        event.preventDefault()
        const nextFilters = { ...filters, page: 0 }
        setFilters(nextFilters)
        loadUsers(nextFilters)
    }

    return (
        <BackOfficeLayout title="Quản lý người dùng" subtitle="Tìm kiếm, lọc và cập nhật trạng thái tài khoản.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_160px_160px_auto]" onSubmit={submitFilters}>
                <input
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    placeholder="Tìm theo tên, email, số điện thoại"
                    value={filters.keyword}
                    onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                />
                <select
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    value={filters.role}
                    onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="USER">USER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
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
                                            <select
                                                className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold"
                                                value={user.status}
                                                onChange={(event) => updateStatus(user.id, event.target.value)}
                                            >
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                                <option value="BANNED">BANNED</option>
                                            </select>
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
        </BackOfficeLayout>
    )
}

export default AdminUsersPage
