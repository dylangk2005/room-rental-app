import { useEffect, useState } from 'react'
import moderationApi from '../../api/moderationApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'
import ModerationTargetDetailModal from './ModerationTargetDetailModal'

const MyModerationLogsPage = () => {
    const [filters, setFilters] = useState({ action: '', targetType: '', targetId: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [detailState, setDetailState] = useState({ open: false, loading: false, error: '', detail: null })

    const loadLogs = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await moderationApi.getMyLogs(nextFilters)
            setPageData(response.data || { logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được nhật ký kiểm duyệt của bạn.'))
        } finally {
            setLoading(false)
        }
    }

    const openTargetDetail = async (log) => {
        if (!log.targetType || !log.targetId) return

        setDetailState({ open: true, loading: true, error: '', detail: { targetType: log.targetType, targetId: log.targetId } })
        try {
            const response = await moderationApi.getMyLogTargetDetail({ targetType: log.targetType, targetId: log.targetId })
            setDetailState({ open: true, loading: false, error: '', detail: response.data || response })
        } catch (detailError) {
            setDetailState((current) => ({
                ...current,
                loading: false,
                error: getErrorMessage(detailError, 'Không tải được chi tiết đối tượng kiểm duyệt.'),
            }))
        }
    }

    useEffect(() => {
        loadLogs()
    }, [])

    return (
        <BackOfficeLayout section="manager" title="Nhật ký kiểm duyệt" subtitle="Xem lại các thao tác kiểm duyệt bạn đã thực hiện.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4" onSubmit={(event) => {
                event.preventDefault()
                const nextFilters = { ...filters, page: 0 }
                setFilters(nextFilters)
                loadLogs(nextFilters)
            }}>
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}>
                    <option value="">Tất cả thao tác</option>
                    <option value="ACCEPT_POST">ACCEPT_POST</option>
                    <option value="REJECT_POST">REJECT_POST</option>
                    <option value="HIDDEN_POST">HIDDEN_POST</option>
                    <option value="REMOVE_POST">REMOVE_POST</option>
                    <option value="ACCEPT_REPORT">ACCEPT_REPORT</option>
                    <option value="REJECT_REPORT">REJECT_REPORT</option>
                    <option value="WARNING">WARNING</option>
                    <option value="LOCK_POST">LOCK_POST</option>
                    <option value="BAN_ACCOUNT">BAN_ACCOUNT</option>
                </select>
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={filters.targetType} onChange={(event) => setFilters((current) => ({ ...current, targetType: event.target.value }))}>
                    <option value="">Tất cả đối tượng</option>
                    <option value="POST">POST</option>
                    <option value="REPORT">REPORT</option>
                    <option value="USER">USER</option>
                </select>
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="ID đối tượng" value={filters.targetId} onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))} />
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white" type="submit">Lọc</button>
            </form>

            <div className="mt-4">{error && <Message type="error">{error}</Message>}</div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.logs.length === 0 ? (
                    <EmptyState message="Bạn chưa có nhật ký kiểm duyệt." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Thao tác</th>
                                    <th className="px-4 py-3">Đối tượng</th>
                                    <th className="px-4 py-3">Lý do</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 font-black">{log.action}</td>
                                        <td className="px-4 py-3">
                                            {log.targetType && log.targetId ? (
                                                <button
                                                    className="font-black text-emerald-700 underline-offset-4 hover:underline"
                                                    type="button"
                                                    onClick={() => openTargetDetail(log)}
                                                >
                                                    {log.targetType} #{log.targetId}
                                                </button>
                                            ) : '-'}
                                        </td>
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
            {detailState.open && (
                <ModerationTargetDetailModal
                    detail={detailState.detail}
                    loading={detailState.loading}
                    error={detailState.error}
                    onClose={() => setDetailState({ open: false, loading: false, error: '', detail: null })}
                />
            )}
        </BackOfficeLayout>
    )
}

export default MyModerationLogsPage
