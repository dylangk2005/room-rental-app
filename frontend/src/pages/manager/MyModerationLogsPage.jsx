import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import moderationApi from '../../api/moderationApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, FilterBar, StatusBadge, Pagination, Toast } from '../../components/BackOfficeParts'
import { formatRelativeTime, formatActionLabel, formatTargetType, getErrorMessage } from '../../utils/backOfficeFormatters'
import ModerationTargetDetailModal from './ModerationTargetDetailModal'

const initialFilters = { action: '', targetType: '', targetId: '', page: 0, size: 10 }

const actionFilters = [
    { value: '', label: 'Tất cả' },
    { value: 'ACCEPT_POST', label: 'Duyệt tin' },
    { value: 'REJECT_POST', label: 'Từ chối tin' },
    { value: 'HIDDEN_POST', label: 'Ẩn tin' },
    { value: 'ACCEPT_REPORT', label: 'Chấp nhận báo cáo' },
    { value: 'REJECT_REPORT', label: 'Từ chối báo cáo' },
    { value: 'WARNING', label: 'Cảnh cáo' },
    { value: 'LOCK_POST', label: 'Khóa đăng tin' },
    { value: 'BAN_ACCOUNT', label: 'Ban tài khoản' },
]

const targetTypeFilters = [
    { value: '', label: 'Tất cả' },
    { value: 'POST', label: 'Tin đăng' },
    { value: 'REPORT', label: 'Báo cáo' },
    { value: 'USER', label: 'Người dùng' },
]

const actionBadgeVariant = {
    ACCEPT_POST: 'success',
    REJECT_POST: 'danger',
    HIDDEN_POST: 'warning',
    REMOVE_POST: 'danger',
    ACCEPT_REPORT: 'info',
    REJECT_REPORT: 'neutral',
    WARNING: 'amber',
    LOCK_POST: 'amber',
    BAN_ACCOUNT: 'danger',
}

const LogEntry = ({ log, onDetailClick }) => (
    <div className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5">
        <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                    label={formatActionLabel(log.action)}
                    variant={actionBadgeVariant[log.action] || 'neutral'}
                />
                <span className="text-xs font-semibold text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-400">{formatRelativeTime(log.createdAt)}</span>
            </div>

            {log.reason && (
                <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-500">{log.reason}</p>
            )}
        </div>

        <div className="shrink-0">
            {log.targetType && log.targetId ? (
                <button
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all duration-150 hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
                    type="button"
                    onClick={() => onDetailClick(log)}
                >
                    <span className="text-[10px] font-black uppercase text-slate-400">{formatTargetType(log.targetType)}</span>
                    <span className="font-black">#{log.targetId}</span>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            ) : (
                <span className="text-xs font-semibold text-slate-400">-</span>
            )}
        </div>
    </div>
)

const MyModerationLogsPage = () => {
    const [filters, setFilters] = useState(initialFilters)
    const [pageData, setPageData] = useState({ logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [detailState, setDetailState] = useState({ open: false, loading: false, error: '', detail: null })

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const loadLogs = async (nextFilters = filters) => {
        setLoading(true)
        try {
            const response = await moderationApi.getMyLogs(nextFilters)
            setPageData(response.data || { logs: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            showToast('error', getErrorMessage(loadError, 'Không tải được nhật ký kiểm duyệt của bạn.'))
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
        flushSync(() => { loadLogs() })
    }, [])

    const handleFilter = (e) => {
        e.preventDefault()
        setFilters((f) => ({ ...f, page: 0 }))
        loadLogs({ ...filters, page: 0 })
    }

    return (
        <BackOfficeLayout section="manager" title="Nhật ký kiểm duyệt" subtitle="Xem lại các thao tác kiểm duyệt bạn đã thực hiện.">
            {/* Filter */}
            <form onSubmit={handleFilter}>
                <FilterBar className="mb-5 flex-nowrap overflow-x-auto">
                    <select
                        className="h-10 min-w-40 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.action}
                        onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                    >
                        {actionFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                        className="h-10 min-w-36 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        value={filters.targetType}
                        onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value }))}
                    >
                        {targetTypeFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <input
                        className="h-10 min-w-28 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors sm:max-w-40"
                        placeholder="ID đối tượng"
                        type="number"
                        min="1"
                        value={filters.targetId}
                        onChange={(e) => setFilters((f) => ({ ...f, targetId: e.target.value }))}
                    />
                    <button
                        className="h-10 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                        type="submit"
                    >
                        Lọc
                    </button>
                </FilterBar>
            </form>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Log list */}
            <div className="space-y-3">
                {loading ? (
                    <LoadingRows rows={5} />
                ) : pageData.logs.length === 0 ? (
                    <EmptyState message="Bạn chưa có nhật ký kiểm duyệt." />
                ) : (
                    pageData.logs.map((log) => (
                        <LogEntry key={log.id} log={log} onDetailClick={openTargetDetail} />
                    ))
                )}
            </div>

            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const next = { ...filters, page }
                setFilters(next)
                loadLogs(next)
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
