import { useEffect, useState } from 'react'
import membershipApi from '../../api/membershipApi'
import AccountLayout from '../../components/AccountLayout'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const TIERS = [
    {
        name: 'Đồng',
        color: 'from-orange-400 to-amber-500',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        border: 'border-amber-200',
        iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
        badge: 'bg-amber-100 text-amber-700',
    },
    {
        name: 'Bạc',
        color: 'from-slate-400 to-gray-500',
        bg: 'bg-gradient-to-br from-slate-50 to-gray-100',
        border: 'border-slate-300',
        iconBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
        badge: 'bg-slate-100 text-slate-600',
    },
    {
        name: 'Vàng',
        color: 'from-yellow-400 to-amber-500',
        bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        border: 'border-yellow-300',
        iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
        badge: 'bg-yellow-100 text-amber-700',
    },
    {
        name: 'Kim cương',
        color: 'from-sky-400 to-blue-600',
        bg: 'bg-gradient-to-br from-sky-50 to-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
        badge: 'bg-blue-100 text-blue-700',
    },
]

const CrownIcon = ({ className = '' }) => (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path d="M2 18l3-9 5 4 2-8 2 8 5-4 3 9H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 18h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const UserMembershipPage = () => {
    const [myLevel, setMyLevel] = useState(null)
    const [levels, setLevels] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadData = async () => {
        setLoading(true)
        setError('')
        try {
            const [levelRes, levelsRes] = await Promise.all([
                membershipApi.getMyLevel(),
                membershipApi.getLevels(),
            ])
            setMyLevel(levelRes.data || null)
            setLevels(levelsRes.data || [])
        } catch (err) {
            setError('Không tải được thông tin hạng thành viên.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const currentTier = TIERS.find((t) => t.name === myLevel?.levelName) || TIERS[0]
    const nextTier = (() => {
        if (!myLevel || levels.length === 0) return null
        const sorted = [...levels].sort((a, b) => a.minSpent - b.minSpent)
        return sorted.find((l) => l.minSpent > myLevel.totalSpent) || null
    })()

    const progress = (() => {
        if (!myLevel || levels.length === 0) return 0
        const sorted = [...levels].sort((a, b) => a.minSpent - b.minSpent)
        const currentIdx = sorted.findIndex((l) => l.name === myLevel.levelName)
        if (currentIdx === -1) return 0
        const prevSpent = currentIdx > 0 ? sorted[currentIdx - 1].minSpent : 0
        const nextSpent = nextTier ? nextTier.minSpent : sorted[sorted.length - 1].minSpent
        const range = nextSpent - prevSpent
        if (range <= 0) return 100
        return Math.min(100, Math.round(((myLevel.totalSpent - prevSpent) / range) * 100))
    })()

    return (
        <AccountLayout activeKey="membership" title="Hạng thành viên" subtitle="Quyền lợi và cấp bậc của bạn tại TAYTRO.">
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── Current Tier Hero ─────────────────────────────────── */}
                    <div className={`overflow-hidden rounded-2xl border ${currentTier.border} ${currentTier.bg} p-6`}>
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                            {/* Icon */}
                            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${currentTier.iconBg} text-white shadow-lg`}>
                                <CrownIcon />
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Hạng hiện tại</p>
                                <p className="mt-1 text-3xl font-black text-slate-900">{myLevel?.levelName || 'Đồng'}</p>
                                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${currentTier.badge}`}>
                                    <span>Chi tiêu: {formatMoney(myLevel?.totalSpent || 0)}</span>
                                </div>
                            </div>

                            {/* Discount badge */}
                            <div className="shrink-0 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-center shadow-sm">
                                <p className="text-xs font-bold text-emerald-600">Giảm giá</p>
                                <p className="mt-1 text-3xl font-black text-emerald-600">{myLevel?.discountPercent || 0}%</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500">khi đăng tin</p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        {nextTier && (
                            <div className="mt-5">
                                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
                                    <span>Tiến trình lên {nextTier.name}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${currentTier.color} transition-all duration-700`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-center text-xs font-semibold text-slate-500">
                                    Cần thêm {formatMoney(nextTier.minSpent - (myLevel?.totalSpent || 0))} để đạt hạng {nextTier.name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Tier Comparison ───────────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-black text-slate-900">Bảng so sánh hạng thành viên</h2>
                            <p className="mt-0.5 text-sm font-semibold text-slate-500">Quyền lợi giảm giá theo từng cấp bậc</p>
                        </div>

                        {levels.length === 0 ? (
                            <div className="p-8 text-center text-sm font-semibold text-slate-500">
                                Chưa có dữ liệu hạng thành viên.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3">Hạng</th>
                                            <th className="px-5 py-3">Ngưỡng chi tiêu tối thiểu</th>
                                            <th className="px-5 py-3">Giảm giá đăng tin</th>
                                            <th className="px-5 py-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[...levels]
                                            .sort((a, b) => a.minSpent - b.minSpent)
                                            .map((level) => {
                                                const tier = TIERS.find((t) => t.name === level.name) || TIERS[0]
                                                const isActive = myLevel?.levelName === level.name
                                                const isReached = (myLevel?.totalSpent || 0) >= level.minSpent
                                                return (
                                                    <tr key={level.id} className={isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tier.iconBg} text-white`}>
                                                                    <span className="text-xs font-black">{level.name.charAt(0)}</span>
                                                                </div>
                                                                <span className={`font-black ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                                    {level.name}
                                                                </span>
                                                                {isActive && (
                                                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                                                                        HIỆN TẠI
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 font-semibold text-slate-700">
                                                            Từ {formatMoney(level.minSpent)}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${
                                                                isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                -{level.discountPercent}%
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {isReached ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                                    <CheckIcon /> Đạt
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-slate-400">Chưa đạt</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── How to level up ──────────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-black text-slate-900">Làm sao để thăng hạng?</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Chi tiêu càng nhiều trên TAYTRO, hạng của bạn càng cao và được giảm giá đăng tin càng lớn.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-2xl font-black text-emerald-600">1</p>
                                <p className="mt-1 text-sm font-black text-slate-800">Nạp tiền vào ví</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Nạp tiền qua ZaloPay hoặc VNPay</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-2xl font-black text-emerald-600">2</p>
                                <p className="mt-1 text-sm font-black text-slate-800">Đăng tin nhiều hơn</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Mỗi lần thanh toán đăng tin đều được tích lũy</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-2xl font-black text-emerald-600">3</p>
                                <p className="mt-1 text-sm font-black text-slate-800">Hưởng ưu đãi</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Hạng càng cao, giảm giá càng lớn</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AccountLayout>
    )
}

export default UserMembershipPage
