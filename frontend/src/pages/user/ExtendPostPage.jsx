import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import membershipApi from '../../api/membershipApi'
import paymentApi from '../../api/paymentApi'
import postApi from '../../api/postApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const VAT_PERCENT = 8

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const getErrorMessage = (error, fallback = 'Không xử lý được. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data
    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }
    return response?.message || fallback
}

const getPostImage = (post) =>
    post.thumbnailUrl || post.imageUrls?.[0] || `https://picsum.photos/seed/taytro-extend-${post.id}/640/420`

const getDaysRemaining = (endAt) => {
    if (!endAt) return null
    const end = new Date(endAt)
    const now = new Date()
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(dateStr))
}

const getExpiryColor = (days) => {
    if (days === null) return 'text-slate-400'
    if (days <= 0) return 'text-red-600 font-black'
    if (days <= 3) return 'text-amber-600 font-bold'
    return 'text-emerald-600 font-bold'
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, className = '' }) => {
    const map = {
        calendar: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
        clock: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
            </svg>
        ),
        repeat: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m17 2 4 4-4 4" />
                <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="m7 22-4-4 4-4" />
                <path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
        ),
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2" />
                <path d="M16 12h4M2 10h14" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        image: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
            </svg>
        ),
        crown: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                <path d="M3 20h18" />
            </svg>
        ),
        chevronRight: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
            </svg>
        ),
        alert: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4M12 17h.01" />
            </svg>
        ),
    }
    return <span className={`inline-flex items-center ${className}`}>{map[name] || null}</span>
}

// ─── How It Works Step ────────────────────────────────────────────────────────
const HowItWorksStep = ({ icon, step, title, description, index }) => (
    <div
        className="relative flex flex-col items-center text-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
    >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200 mb-4">
            <Icon name={icon} size={22} />
        </div>
        <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-black text-white shadow">
            {step}
        </div>
        <h3 className="font-black text-slate-900 text-sm">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
)

// ─── Extend Card ─────────────────────────────────────────────────────────────
const ExtendCard = ({ post, membership, balance, onExtend, index }) => {
    const daysRemaining = getDaysRemaining(post.endAt)
    const isExpired = daysRemaining !== null && daysRemaining <= 0
    const isActive = post.status === 'ACTIVE'
    const accentColor = post.postTypeTitleColor || '#0d9488'
    const prices = post.prices || []

    const getCheapestPrice = () => {
        if (prices.length === 0) return null
        return prices.reduce((min, p) => Number(p.price) < Number(min.price) ? p : min, prices[0])
    }

    const cheapest = getCheapestPrice()

    return (
        <article
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
            style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both',
            }}
            onClick={() => onExtend(post, cheapest)}
        >
            {/* Top accent line */}
            <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
                style={{ backgroundColor: accentColor }}
            />

            {/* Glow effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ boxShadow: `0 0 32px 0 ${accentColor}18` }}
            />

            <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <Link
                    className="relative block shrink-0 overflow-hidden"
                    to={`/posts/${post.id}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full sm:w-48"
                        src={getPostImage(post)}
                        alt={post.title}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/post${post.id}/640/420` }}
                    />
                    {/* Post type badge */}
                    <div className="absolute bottom-2 left-2">
                        <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm"
                            style={{
                                backgroundColor: `${accentColor}cc`,
                                borderColor: `${accentColor}66`,
                            }}
                        >
                            {post.postTypeName || 'Tin thường'}
                        </span>
                    </div>
                    {/* Status badge */}
                    {isExpired && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
                            <Icon name="alert" className="h-3.5 w-3.5" />
                            Đã hết hạn
                        </div>
                    )}
                    {!isExpired && isActive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
                            <Icon name="clock" className="h-3.5 w-3.5" />
                            Còn {daysRemaining}d
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                    {/* Title */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h3
                                className="line-clamp-2 font-black leading-tight text-slate-900"
                                style={{
                                    color: post.postTypeTitleColor || undefined,
                                    fontSize: post.postTypeTitleSize ? `${Math.min(post.postTypeTitleSize + 2, 22)}px` : undefined,
                                }}
                            >
                                {post.title}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                <Icon name="image" size={12} />
                                {post.district}, {post.province}
                            </p>
                        </div>
                        <span className="text-slate-200 transition-colors group-hover:text-slate-400 shrink-0">
                            <Icon name="chevronRight" size={16} />
                        </span>
                    </div>

                    {/* Expiry info */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center transition-colors group-hover:border-teal-100">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ngày hết hạn</span>
                            <span className={`text-sm font-black ${getExpiryColor(daysRemaining)}`}>
                                {post.endAt ? formatDate(post.endAt) : '—'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-teal-100 bg-teal-50/60 p-2.5 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-500">Giá gia hạn</span>
                            <span className="text-sm font-black text-teal-700">
                                {cheapest ? `${cheapest.days} ngày` : '—'}
                            </span>
                            {cheapest && (
                                <span className="text-[10px] font-bold text-teal-400">{formatMoney(cheapest.price)}</span>
                            )}
                        </div>
                    </div>

                    {/* CTA hint */}
                    <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-2.5 text-center transition-all group-hover:border-teal-200 group-hover:bg-teal-50/50">
                        <Icon name="repeat" size={14} className="text-teal-500" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 transition-colors">
                            Nhấn để gia hạn
                        </span>
                    </div>
                </div>
            </div>
        </article>
    )
}

// ─── Extend Modal ────────────────────────────────────────────────────────────
const ExtendModal = ({ post, membership, balance, isSubmitting, onClose, onConfirm }) => {
    const [confirmed, setConfirmed] = useState(false)

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !isSubmitting) onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isSubmitting, onClose])

    const prices = post?.prices || []
    const [selectedDays, setSelectedDays] = useState(null)

    useEffect(() => {
        const defaultChoice = prices.find(p => p.days === 7) || prices[0]
        setSelectedDays(defaultChoice?.days || null)
    }, [post])

    useEffect(() => { if (!post) setConfirmed(false) }, [post])

    if (!post) return null

    const selectedPrice = prices.find(p => p.days === selectedDays)

    const calcCost = (basePrice) => {
        if (!basePrice) return null
        const base = Number(basePrice)
        const discount = Math.round((base * Number(membership?.discountPercent || 0)) / 100)
        const subtotal = Math.max(0, base - discount)
        const tax = Math.round((subtotal * VAT_PERCENT) / 100)
        return { base, discount, subtotal, tax, finalFee: subtotal + tax }
    }

    const cost = calcCost(selectedPrice?.price)
    const hasEnoughBalance = cost && Number(balance || 0) >= cost.finalFee
    const accentColor = post.postTypeTitleColor || '#0d9488'

    const handleConfirm = () => {
        if (selectedDays) onConfirm(post, selectedDays)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm transition-all duration-300 sm:items-center sm:justify-center"
            onClick={() => !isSubmitting && onClose()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="relative overflow-hidden p-5 text-white"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
                >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <Icon name={confirmed ? 'check' : 'repeat'} size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black">{confirmed ? 'Xác nhận gia hạn' : 'Gia hạn tin đăng'}</h2>
                                <p className="text-xs font-semibold text-white/80">
                                    {confirmed ? 'Hành động không thể hoàn tác' : 'Chọn số ngày muốn gia hạn'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg font-black text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {!confirmed ? (
                        <>
                            {/* Post info */}
                            <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                                    <img className="h-full w-full object-cover" src={getPostImage(post)} alt={post.title} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/post${post.id}/200/200` }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span
                                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black text-white"
                                            style={{ backgroundColor: accentColor, borderColor: `${accentColor}66` }}
                                        >
                                            {post.postTypeName || 'Tin thường'}
                                        </span>
                                        {post.status === 'EXPIRED' && (
                                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600">
                                                Đã hết hạn
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 line-clamp-2 font-black text-slate-900 text-sm leading-snug">{post.title}</p>
                                    <p className="text-xs text-slate-400">{post.district}, {post.province}</p>
                                </div>
                            </div>

                            {/* Day chips */}
                            {prices.length > 0 && (
                                <div>
                                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                        Chọn số ngày gia hạn
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {prices.map((item) => {
                                            const itemCost = calcCost(item.price)
                                            const isSelected = selectedDays === item.days
                                            const isAffordable = itemCost && Number(balance || 0) >= itemCost.finalFee

                                            return (
                                                <button
                                                    key={item.days}
                                                    className={`relative flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all duration-200 active:scale-95 ${
                                                        isSelected
                                                            ? 'border-teal-500 bg-teal-50 shadow-sm'
                                                            : isAffordable
                                                                ? 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                                                                : 'border-red-100 bg-red-50 opacity-60 cursor-not-allowed'
                                                    }`}
                                                    type="button"
                                                    onClick={() => isAffordable && setSelectedDays(item.days)}
                                                    disabled={!isAffordable || isSubmitting}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white shadow">
                                                            <Icon name="check" className="h-3.5 w-3.5" />
                                                        </span>
                                                    )}
                                                    <span className={`text-lg font-black ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>
                                                        {item.days}
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-500' : 'text-slate-400'}`}>
                                                        ngày
                                                    </span>
                                                    <span className={`text-[11px] font-black mt-1 ${isSelected ? 'text-teal-700' : 'text-slate-600'}`}>
                                                        {formatMoney(item.price)}
                                                    </span>
                                                    {itemCost && itemCost.discount > 0 && (
                                                        <span className="mt-0.5 text-[10px] font-bold text-emerald-500">
                                                            -{membership.discountPercent}%
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {prices.length === 0 && (
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                                    <Icon name="alert" className="h-6 w-6 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-500">Chưa có bảng giá cho loại tin này</p>
                                </div>
                            )}

                            {/* Cost breakdown */}
                            {cost && selectedPrice && (
                                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-500">
                                            <Icon name="calendar" size={14} className="text-teal-500" />
                                            Phí gia hạn ({selectedDays} ngày)
                                        </span>
                                        <strong className="font-black text-slate-900">{formatMoney(cost.base)}</strong>
                                    </div>
                                    {cost.discount > 0 && (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-1.5 font-bold text-slate-500">
                                                <Icon name="crown" size={14} className="text-amber-500" />
                                                Ưu đãi thành viên ({membership.discountPercent}%)
                                            </span>
                                            <strong className="font-black text-emerald-600">-{formatMoney(cost.discount)}</strong>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">VAT {VAT_PERCENT}%</span>
                                        <strong className="font-black text-slate-900">{formatMoney(cost.tax)}</strong>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-black text-slate-950">Tổng thanh toán</span>
                                            <strong className="text-xl font-black text-teal-700">{formatMoney(cost.finalFee)}</strong>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Số dư ví</span>
                                        <strong className={`font-black ${hasEnoughBalance ? 'text-slate-900' : 'text-red-600'}`}>
                                            {formatMoney(balance)}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            {!hasEnoughBalance && cost && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3.5">
                                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
                                        <Icon name="shield" size={14} />
                                    </span>
                                    <div>
                                        <p className="text-sm font-black text-red-800">Số dư ví không đủ</p>
                                        <p className="mt-0.5 text-xs font-semibold text-red-700">
                                            Bạn cần nạp thêm {formatMoney(cost.finalFee - Number(balance || 0))} để gia hạn.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Để sau
                                </button>
                                {hasEnoughBalance && (
                                    <button
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-teal-200 transition-all duration-200 hover:from-teal-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-teal-300 active:scale-95"
                                        type="button"
                                        onClick={() => setConfirmed(true)}
                                    >
                                        <Icon name="repeat" size={16} />
                                        <span>Gia hạn {selectedDays} ngày</span>
                                    </button>
                                )}
                                {!hasEnoughBalance && (
                                    <Link
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-lg shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-300 active:scale-95"
                                        to={ROUTES.USER_DEPOSIT}
                                    >
                                        <Icon name="wallet" size={16} />
                                        <span>Nạp tiền vào ví</span>
                                    </Link>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Confirmation screen */}
                            <div className="flex flex-col items-center gap-4 py-2 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                                    <Icon name="alert" className="h-7 w-7 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900">Xác nhận gia hạn "{post.title}"?</p>
                                    <p className="mt-1.5 text-sm text-slate-500">
                                        <strong className="font-black text-teal-600">{formatMoney(cost?.finalFee)}</strong> sẽ được trừ từ ví của bạn. Hành động này không thể hoàn tác.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                    type="button"
                                    onClick={() => setConfirmed(false)}
                                    disabled={isSubmitting}
                                >
                                    Quay lại
                                </button>
                                <button
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-teal-200 transition-all duration-200 hover:from-teal-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-teal-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            <span>Đang gia hạn...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="check" className="h-4 w-4" />
                                            <span>Xác nhận gia hạn</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Success Modal ────────────────────────────────────────────────────────────
const SuccessModal = ({ post, days, onClose }) => {
    useEffect(() => {
        const timer = window.setTimeout(onClose, 3000)
        return () => window.clearTimeout(timer)
    }, [onClose])

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <Icon name="check" className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-black">Gia hạn thành công!</h2>
                        <p className="mt-2 text-sm font-semibold text-emerald-100">
                            "{post?.title}" đã được gia hạn thêm {days} ngày.
                        </p>
                        <p className="mt-1 text-xs text-emerald-200">
                            Đang chuyển hướng...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Loading State ────────────────────────────────────────────────────────────
const LoadingState = () => (
    <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-44 w-48 animate-pulse rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3 pt-4">
                    <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
                    </div>
                    <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
                </div>
            </div>
        ))}
    </div>
)

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ isExpired }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center animate-in fade-in zoom-in-95">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <Icon name="repeat" size={36} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-700">
            {isExpired ? 'Không có tin đã hết hạn' : 'Không có tin đang hoạt động'}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
            {isExpired
                ? 'Tất cả tin đăng của bạn vẫn còn hiệu lực.'
                : 'Không có tin nào đang hoạt động. Hãy đăng tin mới hoặc gia hạn tin đã hết hạn.'}
        </p>
    </div>
)

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ExtendPostPage = () => {
    const { user, login } = useAuth()
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [membership, setMembership] = useState(null)
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPost, setSelectedPost] = useState(null)
    const [selectedDays, setSelectedDays] = useState(null)
    const [successData, setSuccessData] = useState(null)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('active')

    const extendablePosts = useMemo(() => {
        return posts.filter(post =>
            (post.status === 'ACTIVE' || post.status === 'EXPIRED') && post.prices?.length > 0
        )
    }, [posts])

    const activePosts = useMemo(
        () => extendablePosts.filter(p => p.status === 'ACTIVE'),
        [extendablePosts]
    )

    const expiredPosts = useMemo(
        () => extendablePosts.filter(p => p.status === 'EXPIRED'),
        [extendablePosts]
    )

    const displayedPosts = activeTab === 'active' ? activePosts : expiredPosts

    const loadPage = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const [postsResult, membershipResult] = await Promise.allSettled([
                postApi.getMyPosts({ page: 0, size: 50 }),
                membershipApi.getMyLevel(),
            ])

            if (postsResult.status !== 'fulfilled') {
                throw postsResult.reason
            }

            setPosts(postsResult.value.data?.posts || [])
            setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value.data : null)
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được danh sách. Vui lòng thử lại.'))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(loadPage, 0)
        return () => window.clearTimeout(timer)
    }, [loadPage])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await authApi.refresh()
                if (!cancelled) login(res.data)
            } catch {
                if (!cancelled) navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.EXTEND_POSTS } })
                return
            } finally {
                if (!cancelled) setIsVerifying(false)
            }
        })()
        return () => { cancelled = true }
    }, [login, navigate])

    if (isVerifying) return null

    const handleExtend = (post, defaultDays) => {
        setSelectedPost(post)
        setSelectedDays(defaultDays?.days || null)
    }

    const handleConfirmExtend = async (post, days) => {
        if (!post || !days) return
        setIsSubmitting(true)
        try {
            await paymentApi.renewPost({ postId: post.id, durationDays: days })
            setSuccessData({ post, days })
            setSelectedPost(null)
            setSelectedDays(null)
            await loadPage()
        } catch (renewError) {
            setError(getErrorMessage(renewError, 'Không gia hạn được. Vui lòng kiểm tra số dư ví.'))
            setSelectedPost(null)
            setSelectedDays(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setSelectedPost(null)
            setSelectedDays(null)
        }
    }

    const tabs = [
        { key: 'active', label: 'Đang hoạt động', count: activePosts.length },
        { key: 'expired', label: 'Đã hết hạn', count: expiredPosts.length },
    ]

    return (
        <AccountLayout
            balance={balance}
            activeKey="extend"
            title="Gia hạn tin đăng"
            subtitle="Gia hạn thời gian hiển thị để tin của bạn không bị gỡ khỏi danh sách."
            actions={null}
        >
            {isLoading && <LoadingState />}

            {!isLoading && (
                <div className="space-y-5">
                    {/* Error alert */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Icon name="shield" size={14} />
                            </span>
                            <div className="flex-1 text-sm font-semibold text-red-700">
                                <p className="font-black text-red-800">Gia hạn chưa thành công</p>
                                <p className="mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* How it works */}
                    <div className="space-y-3">
                        <h2 className="flex items-center gap-2 text-base font-black text-slate-800">
                            <Icon name="shield" size={18} className="text-teal-500" />
                            Gia hạn tin hoạt động như thế nào?
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <HowItWorksStep
                                index={0}
                                step={1}
                                icon="calendar"
                                title="Chọn tin đăng"
                                description="Chọn tin đang hoạt động hoặc đã hết hạn. Giá gia hạn được tính theo ngày."
                            />
                            <HowItWorksStep
                                index={1}
                                step={2}
                                icon="wallet"
                                title="Thanh toán phí"
                                description="Phí được trừ từ ví. Thành viên VIP được giảm giá theo hạng mức."
                            />
                            <HowItWorksStep
                                index={2}
                                step={3}
                                icon="repeat"
                                title="Thời hạn tăng thêm"
                                description="Ngày hết hạn được cộng thêm. Tin đã hết hạn sẽ quay lại trạng thái hoạt động."
                            />
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key
                                return (
                                    <button
                                        key={tab.key}
                                        className={`relative flex flex-1 items-center justify-center gap-2.5 py-3.5 text-sm font-black transition-all duration-300 ${
                                            isActive ? 'text-teal-700 bg-white' : 'text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100'
                                        }`}
                                        style={isActive ? { boxShadow: '0 -2px 0 0 #0d9488 inset' } : undefined}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        <Icon name={tab.key === 'active' ? 'clock' : 'alert'} size={17} className={isActive ? {
                                            active: 'text-teal-600',
                                            expired: 'text-red-600',
                                        }[tab.key] : ''} />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                                                isActive
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Posts grid */}
                    {displayedPosts.length === 0 ? (
                        <EmptyState isExpired={activeTab === 'expired'} />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {displayedPosts.map((post, index) => (
                                <ExtendCard
                                    key={post.id}
                                    post={post}
                                    membership={membership}
                                    balance={balance}
                                    onExtend={handleExtend}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Extend Modal */}
            <ExtendModal
                post={selectedPost}
                membership={membership}
                balance={balance}
                isSubmitting={isSubmitting}
                onClose={handleCloseModal}
                onConfirm={handleConfirmExtend}
            />

            {/* Success Modal */}
            {successData && (
                <SuccessModal
                    post={successData.post}
                    days={successData.days}
                    onClose={() => setSuccessData(null)}
                />
            )}
        </AccountLayout>
    )
}

export default ExtendPostPage
