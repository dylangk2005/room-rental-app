import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import ExportModal from '../../components/ExportModal'
import { Message, StatCard } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const ManagerDashboardPage = () => {
    const [range, setRange] = useState({ from: '', to: '' })
    const [stats, setStats] = useState({ users: {}, posts: {}, revenue: {} })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)

    const loadStats = async () => {
        setLoading(true)
        setError('')
        try {
            const [users, posts, revenue] = await Promise.all([
                managerApi.getUserStats(range),
                managerApi.getPostStats(range),
                managerApi.getRevenueStats(range),
            ])
            setStats({
                users: users.data || {},
                posts: posts.data || {},
                revenue: revenue.data || {},
            })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được thống kê.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStats()
    }, [])

    return (
        <BackOfficeLayout section="manager" title="Tổng quan quản lý" subtitle="Thống kê vận hành, doanh thu, giá tin đăng và hạng thành viên. Quản lý không xử lý duyệt tin hoặc báo cáo.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[180px_180px_auto]" onSubmit={(event) => {
                event.preventDefault()
                loadStats()
            }}>
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} />
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} />
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white disabled:opacity-60" type="submit" disabled={loading}>
                    {loading ? 'Đang tải...' : 'Cập nhật'}
                </button>
            </form>

            <div className="mt-4 space-y-3">
                {error && <Message type="error">{error}</Message>}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Người dùng mới" value={stats.users.newUsers ?? '-'} />
                <StatCard label="Tin mới" value={stats.posts.newPosts ?? '-'} />
                <StatCard label="Doanh thu net" value={formatMoney(stats.revenue.netRevenue)} tone="emerald" />
                <StatCard label="Tin đang hoạt động" value={stats.posts.activePosts ?? '-'} tone="amber" />
            </div>

            <div className="mt-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-950">Xuất báo cáo</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Xuất danh sách chi tiết với bộ lọc tùy chỉnh</p>
                        </div>
                        <button
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-black text-emerald-700 transition-all hover:scale-[1.03] hover:bg-emerald-100 hover:shadow"
                            type="button"
                            onClick={() => setShowExportModal(true)}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Xuất Excel
                        </button>
                    </div>
                </section>
            </div>

            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-black text-slate-950">Thống kê theo loại tin</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(stats.posts.byPostType || []).map((item) => (
                        <StatCard key={item.postTypeName} label={item.postTypeName} value={item.totalPosts} />
                    ))}
                </div>
            </section>

            {showExportModal && (
                <ExportModal
                    onClose={() => setShowExportModal(false)}
                    userRole="MANAGER"
                />
            )}
        </BackOfficeLayout>
    )
}

export default ManagerDashboardPage
