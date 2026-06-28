import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import membershipApi from '../../api/membershipApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Toast } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const TIER_CONFIG = {
    'Sắt': {
        gradient: 'from-slate-400 to-gray-500',
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        iconBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
        iconColor: 'text-white',
        accent: 'text-slate-600',
    },
    'Đồng': {
        gradient: 'from-orange-400 to-red-500',
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
        iconColor: 'text-white',
        accent: 'text-orange-600',
    },
    'Bạc': {
        gradient: 'from-gray-300 to-slate-400',
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        iconBg: 'bg-gradient-to-br from-gray-300 to-gray-500',
        iconColor: 'text-white',
        accent: 'text-gray-600',
    },
    'Vàng': {
        gradient: 'from-yellow-400 to-amber-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
        iconColor: 'text-white',
        accent: 'text-amber-600',
    },
    'Kim cương': {
        gradient: 'from-cyan-400 to-blue-600',
        bg: 'bg-cyan-50',
        border: 'border-cyan-300',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
        iconColor: 'text-white',
        accent: 'text-blue-600',
    },
}

const TierIcon = ({ name, className }) => {
    if (name === 'Kim cương') return (
        <svg className={className} viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M6 3h12l4 6-10 13L2 9l4-6z" fill="currentColor" opacity="0.25" />
            <path d="M6 3h12l4 6-10 13L2 9l4-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M2 9h20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 9v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M8.5 3l3.5 6 3.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    )
    if (name === 'Vàng') return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
    )
    if (name === 'Bạc') return (
        <svg className={className} viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M2 18l3-9 5 4 2-8 2 8 5-4 3 9H2z" fill="currentColor" opacity="0.25" />
            <path d="M2 18l3-9 5 4 2-8 2 8 5-4 3 9H2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 18h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 18v2M12 18v2M17 18v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
    if (name === 'Đồng') return (
        <svg className={className} viewBox="0 0 24 24" fill="none" width="28" height="28">
            <circle cx="12" cy="14" r="6" fill="currentColor" opacity="0.25" />
            <circle cx="12" cy="14" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10.5 13l1 1.5 2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4Z" fill="currentColor" opacity="0.25" />
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const TierCard = ({ level, onSave }) => {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ minSpent: level.minSpent, discountPercent: level.discountPercent })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const config = TIER_CONFIG[level.name] || TIER_CONFIG['Sắt']

    const handleSave = async () => {
        setSaving(true)
        setToast(null)
        try {
            await onSave(level.id, {
                minSpent: Number(form.minSpent),
                discountPercent: Number(form.discountPercent),
            })
            setEditing(false)
            setToast({ type: 'success', message: 'Cập nhật thành công!' })
        } catch {
            setToast({ type: 'error', message: 'Không lưu được. Thử lại.' })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setForm({ minSpent: level.minSpent, discountPercent: level.discountPercent })
        setEditing(false)
    }

    return (
        <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 ${config.border} ${config.bg} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.iconBg} shadow-lg`}>
                    <TierIcon name={level.name} className={config.iconColor} />
                </div>

                <div className="min-w-0 flex-1 pe-12 space-y-1">
                    <h3 className={`text-lg font-black ${config.accent}`}>{level.name}</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Ngưỡng:</span>
                        <span className="whitespace-nowrap text-sm font-bold text-slate-800">{formatMoney(level.minSpent)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Giảm:</span>
                        <span className={`text-sm font-black ${config.accent}`}>{level.discountPercent}%</span>
                    </div>
                </div>
            </div>

            {!editing && (
                <button
                    className="absolute right-4 top-4 shrink-0 rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 backdrop-blur-sm transition-all hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
                    type="button"
                    onClick={() => setEditing(true)}
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
            )}

            {editing && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-black text-slate-500 uppercase tracking-wide">
                                Ngưỡng chi tiêu (đ)
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                type="number"
                                min="0"
                                value={form.minSpent}
                                onChange={(e) => setForm((f) => ({ ...f, minSpent: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-black text-slate-500 uppercase tracking-wide">
                                Giảm giá (%)
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                type="number"
                                min="0"
                                max="100"
                                value={form.discountPercent}
                                onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
                            type="button"
                            onClick={handleCancel}
                        >
                            Hủy
                        </button>
                        <button
                            className="h-10 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white transition-all hover:scale-[1.02] hover:bg-emerald-700 hover:shadow active:scale-[0.98] disabled:opacity-60"
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const MembershipPage = () => {
    const [levels, setLevels] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadLevels = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await membershipApi.getLevels()
            setLevels((response.data || []).sort((a, b) => a.minSpent - b.minSpent))
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được hạng thành viên.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLevels()
    }, [])

    const updateLevel = async (id, data) => {
        await managerApi.updateMembershipLevel(id, data)
        await loadLevels()
    }

    return (
        <BackOfficeLayout section="manager" title="Hạng thành viên" subtitle="Quản lý ngưỡng chi tiêu và ưu đãi của từng hạng.">
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {error}
                </div>
            )}

            <section className="mt-4 space-y-4">
                {loading ? (
                    <LoadingRows rows={3} />
                ) : levels.length === 0 ? (
                    <EmptyState message="Chưa có hạng thành viên." />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                        {levels.map((level) => (
                            <TierCard key={level.id} level={level} onSave={updateLevel} />
                        ))}
                    </div>
                )}
            </section>
        </BackOfficeLayout>
    )
}

export default MembershipPage
