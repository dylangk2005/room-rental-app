import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import ExportModal from '../../components/ExportModal'
import { Message, StatCard } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

const DateInput = ({ value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false)
    const today = new Date()
    const [viewDate, setViewDate] = useState(() => {
        if (!value) return new Date(today.getFullYear(), today.getMonth(), 1)
        const [y, m, d] = value.split('-')
        return new Date(parseInt(y), parseInt(m) - 1, 1)
    })

    const displayValue = formatDateDisplay(value)

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const daysInMonth = getDaysInMonth(viewDate)
    const firstDay = getFirstDayOfMonth(viewDate)

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

    const handleSelectDate = (day) => {
        const y = viewDate.getFullYear()
        const m = String(viewDate.getMonth() + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        onChange(`${y}-${m}-${d}`)
        setOpen(false)
    }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

    return (
        <div className="relative h-11">
            <input
                className="h-full w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                type="text"
                value={displayValue}
                readOnly
                placeholder={placeholder}
                onClick={() => setOpen(true)}
            />
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-sm font-semibold">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {days.map(d => <div key={d} className="text-xs font-semibold text-slate-500 py-1">{d}</div>)}
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                const isSelected = value === dateStr
                                const isToday = todayStr === dateStr
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleSelectDate(day)}
                                        className={`h-8 w-8 rounded-full text-sm ${isSelected ? 'bg-emerald-500 text-white' : isToday ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100'}`}
                                    >
                                        {day}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

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
        <BackOfficeLayout section="manager" title="Tổng quan quản lý" subtitle="Thống kê vận hành, doanh thu, giá tin đăng và hạng thành viên.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
                event.preventDefault()
                loadStats()
            }}>
                <DateInput value={range.from} onChange={(val) => setRange(r => ({ ...r, from: val }))} placeholder="dd/mm/yyyy" />
                <DateInput value={range.to} onChange={(val) => setRange(r => ({ ...r, to: val }))} placeholder="dd/mm/yyyy" />
                <button className="h-11 whitespace-nowrap rounded-lg bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-60" type="submit" disabled={loading}>
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
                    {(stats.posts.byPostType || []).map((item) => {
                        const name = item.postTypeName || ''
                        const priority = item.priority || 0
                        const tierMap = {
                            'Tin thường': { desc: 'Tin được đăng', gradient: 'from-emerald-400 to-teal-500', icon: '📋' },
                            'Tin VIP2': { desc: 'Tin VIP2 cao cấp', gradient: 'from-blue-500 to-indigo-600', icon: '🌟' },
                            'Tin VIP1': { desc: 'Tin VIP1 nổi bật', gradient: 'from-pink-500 via-rose-500 to-red-500', icon: '💎' },
                            'Tin VIP Nổi Bật': { desc: 'Tin nổi bật nhất', gradient: 'from-red-500 via-rose-500 to-pink-500', icon: '🔥' },
                        }
                        const tier = tierMap[name] || {
                            desc: name,
                            gradient: priority === 1 ? 'from-red-500 via-rose-500 to-pink-500'
                                : priority === 2 ? 'from-pink-500 via-rose-500 to-red-500'
                                    : priority === 3 ? 'from-blue-500 to-indigo-600'
                                        : 'from-emerald-400 to-teal-500',
                            icon: priority === 1 ? '🔥' : priority === 2 ? '💎' : priority === 3 ? '🌟' : '📌',
                        }
                        return (
                            <div
                                key={item.postTypeName}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5"
                            >
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tier.gradient}`} />
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg" role="img" aria-hidden="true">{tier.icon}</span>
                                            <h3 className="font-black text-slate-950 truncate">{item.postTypeName}</h3>
                                        </div>
                                    </div>
                                    <div className="shrink-0 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 px-3 py-1.5 text-center shadow-sm ring-1 ring-slate-200">
                                        <span className="block text-lg font-black text-slate-800 leading-tight">{item.totalPosts}</span>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">tin</span>
                                    </div>
                                </div>
                                <div className={`mt-3 h-1 w-full rounded-full bg-gradient-to-r ${tier.gradient} opacity-10`} />
                            </div>
                        )
                    })}
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
