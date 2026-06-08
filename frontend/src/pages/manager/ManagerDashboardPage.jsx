import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { Message, StatCard } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const exportTypes = ['USERS', 'POSTS', 'REVENUE']

const ManagerDashboardPage = () => {
    const [range, setRange] = useState({ from: '', to: '' })
    const [stats, setStats] = useState({ users: {}, posts: {}, revenue: {} })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                    <h2 className="text-lg font-black text-slate-950">Xuất báo cáo</h2>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {exportTypes.map((type) => (
                            <button
                                className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                                key={type}
                                type="button"
                                onClick={() => managerApi.exportStats({ type, ...range })}
                            >
                                Export {type}
                            </button>
                        ))}
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
        </BackOfficeLayout>
    )
}

export default ManagerDashboardPage
