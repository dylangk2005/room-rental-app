import { useEffect, useState } from 'react'
import reportApi from '../../api/reportApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

const statusClasses = {
    PENDING: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
}

const Pill = ({ children }) => (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasses[children] || 'bg-slate-100 text-slate-700'}`}>
        {children}
    </span>
)

const InfoBox = ({ label, value }) => (
    <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-1 break-words font-black text-slate-950">{value || '-'}</p>
    </div>
)

const ReportsPage = () => {
    const [filters, setFilters] = useState({ status: 'PENDING', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ reports: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [selectedReport, setSelectedReport] = useState(null)
    const [resolution, setResolution] = useState({ decision: 'RESOLVED', postAction: '', resolutionNote: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadReports = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await reportApi.getReports(nextFilters)
            setPageData(response.data || { reports: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được danh sách báo cáo.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReports()
    }, [])

    const openReport = async (id) => {
        setError('')
        try {
            const response = await reportApi.getReportDetail(id)
            setSelectedReport(response.data)
            setResolution({ decision: 'RESOLVED', postAction: '', resolutionNote: '' })
        } catch (detailError) {
            setError(getErrorMessage(detailError, 'Không tải được chi tiết báo cáo.'))
        }
    }

    const resolveReport = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        try {
            await reportApi.resolveReport(selectedReport.id, {
                decision: resolution.decision,
                postAction: resolution.postAction || null,
                resolutionNote: resolution.resolutionNote,
            })
            setSelectedReport(null)
            setMessage('Xử lý báo cáo thành công.')
            loadReports()
        } catch (resolveError) {
            setError(getErrorMessage(resolveError, 'Không xử lý được báo cáo.'))
        }
    }

    return (
        <BackOfficeLayout section="manager" title="Quản lý báo cáo" subtitle="Xem bằng chứng, người báo cáo và chủ tin trước khi lưu kết quả xử lý.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[240px_auto]" onSubmit={(event) => {
                event.preventDefault()
                const nextFilters = { ...filters, page: 0 }
                setFilters(nextFilters)
                loadReports(nextFilters)
            }}>
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="RESOLVED">Đã xử lý</option>
                    <option value="REJECTED">Từ chối</option>
                </select>
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white md:w-fit" type="submit">Lọc</button>
            </form>

            <div className="mt-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.reports.length === 0 ? (
                    <EmptyState message="Không có báo cáo phù hợp." />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {pageData.reports.map((report) => (
                            <button className="block w-full p-4 text-left hover:bg-slate-50" key={report.id} type="button" onClick={() => openReport(report.id)}>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-base font-black text-slate-950">Báo cáo #{report.id}: {report.reason}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">{report.postTitle || 'Tin đăng không còn tồn tại'} | Trạng thái tin: {report.postStatus || '-'}</p>
                                    </div>
                                    <Pill>{report.status}</Pill>
                                </div>
                                <p className="mt-2 text-xs font-semibold text-slate-500">Người báo cáo: {report.reporterName || '-'} | {formatDateTime(report.createdAt)} | {report.imageCount || 0} ảnh</p>
                            </button>
                        ))}
                    </div>
                )}
            </section>
            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const nextFilters = { ...filters, page }
                setFilters(nextFilters)
                loadReports(nextFilters)
            }} />

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-4 sm:px-4 sm:py-8">
                    <div className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                            <div>
                                <Pill>{selectedReport.status}</Pill>
                                <h2 className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">Báo cáo #{selectedReport.id}</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedReport.postTitle}</p>
                            </div>
                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setSelectedReport(null)}>Đóng</button>
                        </div>

                        <div className="grid max-h-[calc(100vh-9rem)] gap-5 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-5">
                            <div className="space-y-5">
                                <section className="rounded-lg border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-black uppercase text-slate-500">Nội dung báo cáo</h3>
                                    <p className="mt-3 text-base font-black text-slate-950">{selectedReport.reason}</p>
                                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-700">{selectedReport.description || '-'}</p>
                                </section>
                                {selectedReport.imageUrls?.length > 0 && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {selectedReport.imageUrls.map((url) => <SafeImage className="h-56 w-full rounded-lg object-cover" key={url} src={url} fallbackSrc="https://picsum.photos/seed/report-img/640/420" alt="Bằng chứng báo cáo" />)}
                                    </div>
                                )}
                            </div>

                            <aside className="space-y-4">
                                <section className="rounded-lg border border-slate-200 bg-white p-4">
                                    <h3 className="text-base font-black text-slate-950">Thông tin liên quan</h3>
                                    <div className="mt-3 grid gap-3">
                                        <InfoBox label="Người báo cáo" value={selectedReport.reporterName} />
                                        <InfoBox label="Email báo cáo" value={selectedReport.reporterEmail} />
                                        <InfoBox label="Chủ tin" value={selectedReport.postOwnerName} />
                                        <InfoBox label="Trạng thái tin" value={selectedReport.postStatus} />
                                    </div>
                                </section>
                                <form className="rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={resolveReport}>
                                    <h3 className="text-base font-black text-slate-950">Kết quả xử lý</h3>
                                    <div className="mt-4 grid gap-3">
                                        <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={resolution.decision} onChange={(event) => setResolution((current) => ({ ...current, decision: event.target.value }))}>
                                            <option value="RESOLVED">Chấp nhận báo cáo</option>
                                            <option value="REJECTED">Từ chối báo cáo</option>
                                        </select>
                                        <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={resolution.postAction} onChange={(event) => setResolution((current) => ({ ...current, postAction: event.target.value }))}>
                                            <option value="">Không đổi trạng thái tin</option>
                                            <option value="HIDDEN">Ẩn tin</option>
                                            <option value="ACTIVE">Mở lại tin</option>
                                        </select>
                                    </div>
                                    <textarea className="mt-3 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" placeholder="Mô tả kết quả xử lý" value={resolution.resolutionNote} onChange={(event) => setResolution((current) => ({ ...current, resolutionNote: event.target.value }))} />
                                    <button className="mt-3 h-11 w-full rounded-lg bg-emerald-600 px-4 text-sm font-black text-white" type="submit">Lưu kết quả</button>
                                </form>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </BackOfficeLayout>
    )
}

export default ReportsPage
