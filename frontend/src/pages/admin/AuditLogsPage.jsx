import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

const initialFilters = { action: '', actorId: '', targetType: '', targetId: '', page: 0, size: 10 }

const normalizeFilters = (filters) => ({
    ...filters,
    action: filters.action.trim(),
    actorId: filters.actorId ? Number(filters.actorId) : '',
    targetId: filters.targetId ? Number(filters.targetId) : '',
})

const AuditLogsPage = () => {
    const [filters, setFilters] = useState(initialFilters)
    const [pageData, setPageData] = useState({ logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadLogs = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await adminApi.getAuditLogs(normalizeFilters(nextFilters))
            setPageData(response.data || { logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được nhật ký hệ thống.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLogs()
    }, [])

    return (
        <BackOfficeLayout title="Nhật ký hệ thống" subtitle="Theo dõi các thao tác quản trị hệ thống.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5" onSubmit={(event) => {
                event.preventDefault()
                const nextFilters = { ...filters, page: 0 }
                setFilters(nextFilters)
                loadLogs(nextFilters)
            }}>
                <input
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    placeholder="Thao tác"
                    value={filters.action}
                    onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}
                />
                <input
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    placeholder="ID người thao tác"
                    type="number"
                    min="1"
                    value={filters.actorId}
                    onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value }))}
                />
                <select
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    value={filters.targetType}
                    onChange={(event) => setFilters((current) => ({ ...current, targetType: event.target.value }))}
                >
                    <option value="">Tất cả đối tượng</option>
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="USER">USER</option>
                    <option value="POST">POST</option>
                    <option value="TRANSACTION">TRANSACTION</option>
                    <option value="REPORT">REPORT</option>
                    <option value="DEPOSIT">DEPOSIT</option>
                    <option value="MEMBERSHIP">MEMBERSHIP</option>
                </select>
                <input
                    className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                    placeholder="ID đối tượng"
                    type="number"
                    min="1"
                    value={filters.targetId}
                    onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))}
                />
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white" type="submit">
                    Lọc
                </button>
            </form>

            <div className="mt-4">{error && <Message type="error">{error}</Message>}</div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.logs.length === 0 ? (
                    <EmptyState message="Chưa có nhật ký hệ thống." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Thao tác</th>
                                    <th className="px-4 py-3">Người thao tác</th>
                                    <th className="px-4 py-3">Đối tượng</th>
                                    <th className="px-4 py-3">Mô tả</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 font-black">{log.action}</td>
                                        <td className="px-4 py-3">
                                            {log.actorName || '-'}
                                            <p className="text-xs text-slate-500">{log.actorEmail || ''}</p>
                                        </td>
                                        <td className="px-4 py-3">{log.targetType || '-'} {log.targetId ? `#${log.targetId}` : ''}</td>
                                        <td className="px-4 py-3 max-w-md text-slate-600">{log.reason || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
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
                loadLogs(nextFilters)
            }} />
        </BackOfficeLayout>
    )
}

export default AuditLogsPage
