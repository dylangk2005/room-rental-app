import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import postApi from '../../api/postApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message, Toast } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'
import {
    getPostTypeTitleColor,
    getPostTypeCategory,
    shouldShowRecommendTag,
    shouldUppercaseTitle,
} from '../../utils/postTypeStyles'

const PRIORITY_DURATIONS = [5, 10, 15, 30]

const getCategoryGradient = (name, priority) => {
    const category = getPostTypeCategory(name, priority)
    const map = {
        HOT_VIP: 'from-red-500 via-rose-500 to-pink-500',
        VIP1: 'from-violet-500 via-purple-500 to-fuchsia-500',
        VIP2: 'from-blue-500 via-indigo-500 to-violet-500',
        NORMAL: 'from-emerald-500 via-teal-500 to-cyan-500',
    }
    return map[category] || map.NORMAL
}

const getCategoryBg = (name, priority) => {
    const category = getPostTypeCategory(name, priority)
    const map = {
        HOT_VIP: 'bg-red-50',
        VIP1: 'bg-violet-50',
        VIP2: 'bg-blue-50',
        NORMAL: 'bg-emerald-50',
    }
    return map[category] || map.NORMAL
}

const EditPriceModal = ({ type, onClose, onSave }) => {
    const [prices, setPrices] = useState(
        type.prices.reduce((acc, p) => ({ ...acc, [p.days]: p.price }), {})
    )
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const handleSave = async () => {
        setSaving(true)
        setToast(null)
        try {
            for (const [days, price] of Object.entries(prices)) {
                if (price > 0) {
                    await managerApi.updatePostTypePrice({
                        postTypeId: type.id,
                        days: Number(days),
                        price: Number(price),
                    })
                }
            }
            setToast({ type: 'success', message: 'Lưu giá thành công!' })
            setTimeout(() => onSave(), 800)
        } catch {
            setToast({ type: 'error', message: 'Không lưu được giá. Thử lại.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className={`rounded-t-2xl bg-gradient-to-r ${getCategoryGradient(type.name, type.priority)} p-4`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-white">Sửa giá</h2>
                            <p className="mt-0.5 text-sm font-semibold text-white/80">{type.name}</p>
                        </div>
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 active:scale-95"
                            type="button"
                            onClick={onClose}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

                    <div className="space-y-3">
                        {PRIORITY_DURATIONS.map((days) => (
                            <div key={days} className="flex items-center gap-3">
                                <div className="w-24 shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-center">
                                    <span className="text-sm font-black text-slate-700">{days} ngày</span>
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        type="number"
                                        min="0"
                                        value={prices[days] || ''}
                                        onChange={(e) => setPrices((p) => ({ ...p, [days]: e.target.value }))}
                                        placeholder="Nhập giá..."
                                    />
                                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">đ</span>
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center gap-3 pt-2">
                            <div className="w-24 shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-center">
                                <span className="text-sm font-black text-slate-700">Push</span>
                            </div>
                            <div className="relative flex-1">
                                <input
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    type="number"
                                    min="0"
                                    value={type.pushPrice || ''}
                                    readOnly
                                />
                                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">đ</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            className="h-11 shrink-0 rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-700 transition-all hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98]"
                            type="button"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                        <button
                            className="h-11 shrink-0 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white transition-all hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu giá'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PostTypeCard = ({ type, onEdit }) => {
    const gradient = getCategoryGradient(type.name, type.priority)
    const bgClass = getCategoryBg(type.name, type.priority)
    const titleColor = type.titleColor || getPostTypeTitleColor(type.name) || '#0f172a'
    const isUppercase = type.isUppercase ?? shouldUppercaseTitle({ postTypeName: type.name, postTypePriority: type.priority })
    const hasRecommend = type.hasRecommendTag ?? shouldShowRecommendTag({ postTypeName: type.name, postTypePriority: type.priority })

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
            <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-950 truncate">{type.name}</h3>
                            {hasRecommend && (
                                <span className="shrink-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2 py-0.5 text-[10px] font-black text-white">
                                    Đề xuất
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {type.priority != null && type.priority > 0 && (
                                <span className={`inline-flex items-center gap-1 rounded-full ${bgClass} px-2 py-0.5 text-xs font-bold text-slate-600`}>
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                    </svg>
                                    Priority #{type.priority}
                                </span>
                            )}
                            {type.titleSize && type.titleSize !== 14 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: titleColor }} />
                                    {type.titleSize}px
                                </span>
                            )}
                            {isUppercase && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                    UPPERCASE
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="absolute right-4 top-4 shrink-0 rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 backdrop-blur-sm transition-all hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
                        type="button"
                        onClick={() => onEdit(type)}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                </div>

                <div className="mt-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Bảng giá</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(type.prices || []).map((price) => (
                            <div
                                key={price.days}
                                className="group/price relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 text-center transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{price.days} ngày</span>
                                <span className="mt-1 block font-black text-slate-800">{formatMoney(price.price)}</span>
                                <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-200 group-hover/price:opacity-100`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-xs font-semibold text-slate-500">Giá đẩy tin</span>
                    <span className="font-black text-slate-800">{formatMoney(type.pushPrice)}</span>
                </div>
            </div>
        </div>
    )
}

const PricingPage = () => {
    const [postTypes, setPostTypes] = useState([])
    const [loading, setLoading] = useState(false)
    const [editing, setEditing] = useState(null)
    const [toast, setToast] = useState(null)
    const [error, setError] = useState('')

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const loadPostTypes = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await postApi.getPostTypes()
            setPostTypes(response.data || [])
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được bảng giá.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPostTypes()
    }, [])

    const handleEditSave = () => {
        setEditing(null)
        loadPostTypes()
        showToast('success', 'Cập nhật giá thành công!')
    }

    return (
        <BackOfficeLayout section="manager" title="Giá tin đăng" subtitle="Quản lý giá theo loại tin và số ngày hiển thị.">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

            <section className="mt-4">
                {loading ? (
                    <LoadingRows rows={3} />
                ) : postTypes.length === 0 ? (
                    <EmptyState message="Chưa có loại tin." />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                        {postTypes.map((type) => (
                            <PostTypeCard key={type.id} type={type} onEdit={setEditing} />
                        ))}
                    </div>
                )}
            </section>

            {editing && (
                <EditPriceModal
                    type={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleEditSave}
                />
            )}
        </BackOfficeLayout>
    )
}

export default PricingPage
