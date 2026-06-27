import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import reportApi from '../../api/reportApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, StatusBadge, ActionButton, Pagination, Toast } from '../../components/BackOfficeParts'
import { formatDateTime, formatRelativeTime, getErrorMessage, getAvatarUrl, formatStatusLabel } from '../../utils/backOfficeFormatters'

const FlagIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
)
const ImageIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
)
const CheckCircleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
)
const XCircleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
)

const statusTabs = [
    { value: 'PENDING', label: 'Chờ xử lý', variant: 'warning' },
    { value: 'RESOLVED', label: 'Đã xử lý', variant: 'success' },
    { value: '', label: 'Tất cả', variant: 'neutral' },
]

const getReportBadgeVariant = (status) => {
    switch (status) {
        case 'PENDING': return 'warning'
        case 'RESOLVED': return 'success'
        default: return 'neutral'
    }
}

const ReportDetailModal = ({ report, onClose, onResolve, resolving, resolveError }) => {
    const [selectedImage, setSelectedImage] = useState(0)
    const [postAction, setPostAction] = useState('')
    const [resolutionNote, setResolutionNote] = useState('')

    if (!report) return null

    const images = report.imageUrls || []

    const handleResolve = async (e) => {
        e.preventDefault()
        await onResolve({
            decision: 'RESOLVED',
            postAction: postAction || null,
            resolutionNote,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-4 sm:px-4 sm:py-8" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <style>{`
                @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .modal-animate { animation: modalIn 0.25s ease-out forwards; }
            `}</style>
            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl modal-animate" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <StatusBadge label={formatStatusLabel(report.status)} variant={getReportBadgeVariant(report.status)} />
                            <span className="text-sm font-bold text-slate-400">#{report.id}</span>
                        </div>
                        <h2 className="mt-2 text-xl font-black text-slate-950">Báo cáo: {report.reason}</h2>
                    </div>
                    <button
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl font-black text-slate-400 transition-all duration-150 hover:scale-105 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="grid max-h-[calc(100vh-14rem)] gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    {/* Left */}
                    <div className="space-y-5">
                        {/* Report content */}
                        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                            <h3 className="text-sm font-black uppercase tracking-wide text-red-700">Nội dung báo cáo</h3>
                            <p className="mt-3 text-base font-black text-slate-950">{report.reason}</p>
                            {report.description && (
                                <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-600">
                                    {report.description}
                                </p>
                            )}
                            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                                <SafeImage
                                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                                    src={report.reporterAvatar}
                                    fallbackSrc={getAvatarUrl(report.reporterName, 40)}
                                    alt={report.reporterName}
                                />
                                <span>Báo cáo bởi <strong className="text-slate-600">{report.reporterName}</strong></span>
                                <span>·</span>
                                <span>{formatDateTime(report.createdAt)}</span>
                            </div>
                        </div>

                        {/* Post info */}
                        {report.postId && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Tin đăng</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                    <span className="font-bold text-slate-950">#{report.postId}</span>{' '}
                                    {report.postTitle || 'Tin đăng không còn tồn tại'}
                                </p>
                            </div>
                        )}

                        {/* Evidence images */}
                        {images.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Bằng chứng ({images.length})</h3>
                                <div className="space-y-3">
                                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
                                        <SafeImage
                                            className="h-full w-full object-cover"
                                            src={images[selectedImage]}
                                            fallbackSrc="https://picsum.photos/seed/report-ev/800/500"
                                            alt="Bằng chứng báo cáo"
                                        />
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                                    type="button"
                                                    onClick={() => setSelectedImage((s) => (s - 1 + images.length) % images.length)}
                                                >‹</button>
                                                <button
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                                    type="button"
                                                    onClick={() => setSelectedImage((s) => (s + 1) % images.length)}
                                                >›</button>
                                            </>
                                        )}
                                    </div>
                                    {images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {images.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${idx === selectedImage ? 'border-emerald-500 shadow-md' : 'border-transparent hover:border-slate-200'}`}
                                                    type="button"
                                                    onClick={() => setSelectedImage(idx)}
                                                >
                                                    <SafeImage className="h-full w-full object-cover" src={url} fallbackSrc="https://picsum.photos/seed/report-thumb/100/100" alt="" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Related post info */}
                        {report.postId && (
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Tin đăng liên quan</h3>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs font-bold text-slate-500">Mã tin</p>
                                        <p className="mt-1 font-black text-slate-950">#{report.postId}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs font-bold text-slate-500">Trạng thái tin</p>
                                        <p className="mt-1 font-black text-slate-950">{formatStatusLabel(report.postStatus) || '-'}</p>
                                    </div>
                                    {report.postOwnerName && (
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs font-bold text-slate-500">Chủ tin</p>
                                            <p className="mt-1 font-black text-slate-950">{report.postOwnerName}</p>
                                        </div>
                                    )}
                                    {report.resolutionNote && (
                                        <div className="col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                            <p className="text-xs font-bold text-emerald-700">Kết quả xử lý</p>
                                            <p className="mt-1 text-sm font-semibold text-emerald-800">{report.resolutionNote}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Người báo cáo</h3>
                            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2.5">
                                    <SafeImage
                                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                                        src={report.reporterAvatar}
                                        fallbackSrc={getAvatarUrl(report.reporterName, 72)}
                                        alt={report.reporterName}
                                    />
                                    <div>
                                        <p className="text-sm font-black text-slate-950">{report.reporterName || '-'}</p>
                                        <p className="text-xs font-semibold text-slate-500">{report.reporterEmail || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resolution form */}
                        {report.status === 'PENDING' && (
                            <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleResolve}>
                                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Hành động</h3>

                                {resolveError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{resolveError}</div>
                                )}

                                <div className="mt-4 space-y-2">
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 transition-all has-[:checked]:border-emerald-400 has-[:checked]:ring-1 has-[:checked]:ring-emerald-300 has-[:checked]:bg-emerald-100">
                                        <input type="radio" name="postAction" value="" checked={postAction === ''} onChange={(e) => setPostAction(e.target.value)} className="accent-emerald-600" />
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-bold text-slate-700">Giữ nguyên tin</span>
                                        </div>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-200 p-3 transition-all hover:bg-red-50 has-[:checked]:border-red-400 has-[:checked]:bg-red-50 has-[:checked]:ring-1 has-[:checked]:ring-red-300">
                                        <input type="radio" name="postAction" value="DELETED" checked={postAction === 'DELETED'} onChange={(e) => setPostAction(e.target.value)} className="accent-red-600" />
                                        <div className="flex items-center gap-2">
                                            <XCircleIcon className="h-4 w-4 text-red-600" />
                                            <span className="text-sm font-bold text-slate-700">Xóa tin (gửi thông báo)</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="mt-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Ghi chú xử lý
                                    </label>
                                    <textarea
                                        className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                                        placeholder="Mô tả kết quả xử lý (tùy chọn)..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                    />
                                </div>

                                <ActionButton
                                    label="Lưu kết quả"
                                    variant="primary"
                                    type="submit"
                                    loading={resolving}
                                    className="mt-4 w-full"
                                />
                            </form>
                        )}

                        {report.status !== 'PENDING' && report.resolutionNote && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <h3 className="text-sm font-black text-emerald-800">Đã xử lý</h3>
                                <p className="mt-2 text-sm font-semibold text-emerald-700">{report.resolutionNote}</p>
                                {report.moderatorName && (
                                    <p className="mt-2 text-xs font-semibold text-emerald-600">Bởi: {report.moderatorName}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ReportsPage = () => {
    const [filters, setFilters] = useState({ status: 'PENDING', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ reports: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [selectedReport, setSelectedReport] = useState(null)
    const [loading, setLoading] = useState(false)
    const [resolving, setResolving] = useState(false)
    const [resolveError, setResolveError] = useState('')
    const [toast, setToast] = useState(null)

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const loadReports = async (nextFilters = filters) => {
        setLoading(true)
        try {
            const response = await reportApi.getReports(nextFilters)
            setPageData(response.data || { reports: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            showToast('error', getErrorMessage(loadError, 'Không tải được danh sách báo cáo.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        flushSync(() => { loadReports() })
    }, [])

    const openReport = async (id) => {
        setResolveError('')
        try {
            const response = await reportApi.getReportDetail(id)
            setSelectedReport(response.data)
        } catch {
            showToast('error', 'Không tải được chi tiết báo cáo.')
        }
    }

    const resolveReport = async ({ postAction, resolutionNote }) => {
        setResolving(true)
        setResolveError('')
        try {
            await reportApi.resolveReport(selectedReport.id, { decision: 'RESOLVED', postAction, resolutionNote })
            setSelectedReport(null)
            showToast('success', postAction === 'DELETED' ? 'Đã xóa tin và gửi thông báo.' : 'Đã xử lý báo cáo.')
            loadReports()
        } catch (err) {
            setResolveError(getErrorMessage(err, 'Không xử lý được báo cáo.'))
        } finally {
            setResolving(false)
        }
    }

    const setStatus = (status) => {
        const next = { ...filters, status, page: 0 }
        setFilters(next)
        loadReports(next)
    }

    return (
        <BackOfficeLayout section="moderator" title="Quản lý báo cáo" subtitle="Xem và xử lý các báo cáo từ người dùng về tin đăng vi phạm.">
            {/* Header with status tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.value}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                            filters.status === tab.value
                                ? tab.variant === 'warning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' :
                                  tab.variant === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' :
                                  'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        type="button"
                        onClick={() => setStatus(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows rows={5} /></div>
                ) : pageData.reports.length === 0 ? (
                    <EmptyState message="Không có báo cáo phù hợp." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Mã</th>
                                    <th className="px-4 py-3">Người báo cáo</th>
                                    <th className="px-4 py-3">Tin đăng</th>
                                    <th className="px-4 py-3">Lý do</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="cursor-pointer transition-colors hover:bg-slate-50"
                                        onClick={() => openReport(report.id)}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                                #{report.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-950 leading-tight">{report.reporterName}</p>
                                            <p className="text-xs text-slate-400">{report.reporterEmail}</p>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="line-clamp-1 font-semibold text-slate-700">{report.postTitle || 'Tin đăng không còn tồn tại'}</p>
                                            {report.postId && (
                                                <p className="text-xs text-slate-400">#{report.postId}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="line-clamp-2 text-slate-600">{report.reason}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge
                                                label={formatStatusLabel(report.status)}
                                                variant={getReportBadgeVariant(report.status)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                            {formatRelativeTime(report.createdAt)}
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
                loadReports(nextFilters)
            }} />

            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onResolve={resolveReport}
                    resolving={resolving}
                    resolveError={resolveError}
                />
            )}
        </BackOfficeLayout>
    )
}

export default ReportsPage
