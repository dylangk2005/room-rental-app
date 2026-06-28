import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination, StatusBadge, FilterBar, Modal } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage, formatAuditAction, formatAuditTargetType, getAuditActionVariant } from '../../utils/backOfficeFormatters'

const initialFilters = { action: '', actorId: '', targetType: '', targetId: '', page: 0, size: 10 }

const normalizeFilters = (filters) => ({
    ...filters,
    actorId: filters.actorId ? Number(filters.actorId) : '',
    targetId: filters.targetId ? Number(filters.targetId) : '',
})

const targetTypeOptions = [
    { value: '', label: 'Tất cả đối tượng' },
    { value: 'SYSTEM', label: 'Hệ thống' },
    { value: 'USER', label: 'Người dùng' },
    { value: 'POST', label: 'Tin đăng' },
    { value: 'TRANSACTION', label: 'Giao dịch' },
    { value: 'REPORT', label: 'Báo cáo' },
    { value: 'DEPOSIT', label: 'Nạp tiền' },
    { value: 'MEMBERSHIP', label: 'Gói thành viên' },
    { value: 'INTERNAL_USER', label: 'Tài khoản nội bộ' },
    { value: 'BACKUP', label: 'Sao lưu' },
]

const actionOptions = [
    { value: '', label: 'Tất cả thao tác' },
    { value: 'LOGIN', label: 'Đăng nhập' },
    { value: 'LOGOUT', label: 'Đăng xuất' },
    { value: 'CREATE', label: 'Tạo mới' },
    { value: 'UPDATE', label: 'Cập nhật' },
    { value: 'DELETE', label: 'Xóa' },
    { value: 'BAN', label: 'Cấm' },
    { value: 'UNBAN', label: 'Bỏ cấm' },
    { value: 'APPROVE', label: 'Phê duyệt' },
    { value: 'REJECT', label: 'Từ chối' },
    { value: 'RESOLVE', label: 'Giải quyết' },
    { value: 'BACKUP', label: 'Sao lưu' },
    { value: 'RESTORE', label: 'Khôi phục' },
]

const AuditLogsPage = () => {
    const [filters, setFilters] = useState(initialFilters)
    const [pageData, setPageData] = useState({ logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedLog, setSelectedLog] = useState(null)

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

    const handleFilter = (event) => {
        event.preventDefault()
        const nextFilters = { ...filters, page: 0 }
        setFilters(nextFilters)
        loadLogs(nextFilters)
    }

    const handleRowClick = (log) => {
        setSelectedLog(log)
    }

    const closeModal = () => {
        setSelectedLog(null)
    }

    return (
        <BackOfficeLayout title="Nhật ký hệ thống" subtitle="Theo dõi các thao tác quản trị hệ thống.">
            <form onSubmit={handleFilter}>
                <FilterBar className="mb-5 flex-nowrap overflow-x-auto">
                    <select
                        className="h-10 min-w-44 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors sm:max-w-56"
                        value={filters.action}
                        onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}
                    >
                        {actionOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <input
                        className="h-10 min-w-36 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors sm:max-w-44"
                        placeholder="ID người thao tác"
                        type="number"
                        min="1"
                        value={filters.actorId}
                        onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value }))}
                    />
                    <select
                        className="h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.targetType}
                        onChange={(event) => setFilters((current) => ({ ...current, targetType: event.target.value }))}
                    >
                        {targetTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <input
                        className="h-10 min-w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors sm:max-w-36"
                        placeholder="ID đối tượng"
                        type="number"
                        min="1"
                        value={filters.targetId}
                        onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))}
                    />
                    <button
                        className="h-10 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                        type="submit"
                    >
                        Lọc
                    </button>
                </FilterBar>
            </form>

            <div className="mb-4">{error && <Message type="error">{error}</Message>}</div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows rows={5} /></div>
                ) : pageData.logs.length === 0 ? (
                    <EmptyState message="Chưa có nhật ký hệ thống." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Người thao tác</th>
                                    <th className="px-4 py-3">Thao tác</th>
                                    <th className="px-4 py-3">Đối tượng</th>
                                    <th className="px-4 py-3">Chi tiết</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="cursor-pointer transition-colors hover:bg-slate-50"
                                        onClick={() => handleRowClick(log)}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-950">{log.actorName || 'Hệ thống'}</p>
                                            {log.actorEmail && (
                                                <p className="text-xs text-slate-500">{log.actorEmail}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                label={formatAuditAction(log.action)}
                                                variant={getAuditActionVariant(log.action)}
                                                showIcon
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                                    {formatAuditTargetType(log.targetType)}
                                                </span>
                                                {log.targetId && (
                                                    <span className="font-bold text-slate-600">#{log.targetId}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="line-clamp-2 text-slate-600">{log.reason || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {formatDateTime(log.createdAt)}
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
                loadLogs(nextFilters)
            }} />

            <Modal isOpen={!!selectedLog} onClose={closeModal} title="Chi tiết nhật ký">
                {selectedLog && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-500">Người thực hiện</p>
                                <p className="font-semibold text-slate-950">{selectedLog.actorName || 'Hệ thống'}</p>
                                {selectedLog.actorEmail && (
                                    <p className="text-sm text-slate-600">{selectedLog.actorEmail}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-500">Mã thao tác</p>
                                <p className="font-mono text-sm text-slate-700">{selectedLog.action}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Mô tả</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                {selectedLog.reason || 'Không có mô tả.'}
                            </p>
                        </div>

                        {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-500">Dữ liệu bổ sung</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {selectedLog.ipAddress && (
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase text-slate-500">IP</p>
                                    <p className="font-mono text-xs text-slate-700">{selectedLog.ipAddress}</p>
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase text-slate-500">Thời gian</p>
                                <p className="text-sm text-slate-700">{formatDateTime(selectedLog.createdAt)}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-300"
                                onClick={closeModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </BackOfficeLayout>
    )
}

export default AuditLogsPage
