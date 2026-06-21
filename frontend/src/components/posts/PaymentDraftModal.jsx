import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import ROUTES from '../../constants/routes'

const VAT_PERCENT = 8

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const calculateCost = (baseFee, discountPercent = 0) => {
    const base = Number(baseFee || 0)
    const discount = Math.round((base * Number(discountPercent || 0)) / 100)
    const subtotal = Math.max(0, base - discount)
    const tax = Math.round((subtotal * VAT_PERCENT) / 100)
    return { base, discount, subtotal, tax, finalFee: subtotal + tax }
}

const PaymentDraftModal = ({ post, membership, isSubmitting, onClose, onConfirm }) => {
    const { balance } = useWallet()

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isSubmitting, onClose])

    if (!post) return null

    const pricePerDay = Number(post.pricePerDay || post.pricePerDay == null ? 5000 : post.pricePerDay)
    const durations = [
        { days: 7, label: '7 ngày' },
        { days: 15, label: '15 ngày' },
        { days: 30, label: '30 ngày' },
    ]
    const [selectedDuration, setSelectedDuration] = useState(durations[0].days)
    const cost = calculateCost(pricePerDay * selectedDuration, membership?.discountPercent)
    const hasEnoughBalance = Number(balance || 0) >= cost.finalFee

    const handleSubmit = () => {
        onConfirm?.({ postId: post.id, durationDays: selectedDuration })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:justify-center"
            onClick={() => !isSubmitting && onClose()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 text-white">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black">Thanh toán tin nháp</h2>
                                <p className="mt-1 text-sm font-semibold text-emerald-100">
                                    Chọn thời hạn hiển thị để đăng tin của bạn.
                                </p>
                            </div>
                            <button
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg font-black text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tin đăng</span>
                        </div>
                        <div className="p-4">
                            <p className="line-clamp-2 font-black text-slate-900">{post.title || 'Không có tiêu đề'}</p>
                            <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span>{post.district}, {post.province}</span>
                                {post.area && <><span className="text-slate-300">·</span><span>{post.area} m²</span></>}
                                {post.rentalPrice && <><span className="text-slate-300">·</span><span className="text-emerald-700 font-black">{formatMoney(post.rentalPrice)}/tháng</span></>}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Chọn thời hạn hiển thị</p>
                        <div className="grid grid-cols-3 gap-2">
                            {durations.map((d) => (
                                <button
                                    key={d.days}
                                    type="button"
                                    onClick={() => setSelectedDuration(d.days)}
                                    className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${selectedDuration === d.days
                                        ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-4 ring-emerald-100'
                                        : 'border-slate-200 bg-white hover:border-emerald-300'
                                    }`}
                                >
                                    {selectedDuration === d.days && (
                                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    )}
                                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">{d.label}</span>
                                    <span className="text-base font-black text-emerald-700">{formatMoney(pricePerDay * d.days)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-slate-500">Phí hiển thị</span>
                            <strong className="font-black text-slate-900">{formatMoney(cost.base)}</strong>
                        </div>
                        {cost.discount > 0 && (
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-500">Ưu đãi thành viên</span>
                                <strong className="font-black text-emerald-700">-{formatMoney(cost.discount)}</strong>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-slate-500">VAT {VAT_PERCENT}%</span>
                            <strong className="font-black text-slate-900">{formatMoney(cost.tax)}</strong>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-black text-slate-950">Tổng thanh toán</span>
                                <strong className="text-xl font-black text-emerald-700">{formatMoney(cost.finalFee)}</strong>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-slate-500">Số dư ví</span>
                            <strong className={`font-black ${hasEnoughBalance ? 'text-slate-900' : 'text-red-600'}`}>
                                {formatMoney(balance)}
                            </strong>
                        </div>
                    </div>

                    {!hasEnoughBalance && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3.5">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-sm font-black text-red-800">Số dư ví không đủ</p>
                                <p className="mt-0.5 text-xs font-semibold text-red-700">Bạn cần nạp thêm {formatMoney(cost.finalFee - Number(balance || 0))} để thanh toán tin nháp.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Để sau
                        </button>
                        {hasEnoughBalance ? (
                            <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        <span>Đang thanh toán...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        Thanh toán ngay
                                    </>
                                )}
                            </button>
                        ) : (
                            <Link
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-md shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-lg active:scale-95"
                                to={ROUTES.USER_DEPOSIT}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Nạp tiền vào ví
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentDraftModal
