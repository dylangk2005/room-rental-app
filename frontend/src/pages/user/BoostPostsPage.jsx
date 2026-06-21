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

const calculateBoostCost = (baseFee, discountPercent = 0) => {
    const base = Number(baseFee || 0)
    const discount = Math.round((base * Number(discountPercent || 0)) / 100)
    const subtotal = Math.max(0, base - discount)
    const tax = Math.round((subtotal * VAT_PERCENT) / 100)
    return { base, discount, subtotal, tax, finalFee: subtotal + tax }
}

const getPostImage = (post) =>
    post.thumbnailUrl || post.imageUrls?.[0] || `https://picsum.photos/seed/taytro-boost-${post.id}/640/420`

const getDaysRemaining = (endAt) => {
    if (!endAt) return null
    const end = new Date(endAt)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
}

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffHours < 1) return 'Vừa xong'
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

const getExpiryColor = (days) => {
    if (!days) return 'text-slate-400'
    if (days <= 1) return 'text-red-600 font-black'
    if (days <= 3) return 'text-amber-600 font-bold'
    return 'text-emerald-600 font-bold'
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, className = '' }) => {
    const map = {
        rocket: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c3 5 5 9 5 14a7 7 0 1 1-14 0c0-5 2-9 5-14" />
                <path d="M12 16v4M10 20h4" />
            </svg>
        ),
        flame: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
        clock: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
            </svg>
        ),
        calendar: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
        zap: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        star: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
        refresh: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
            </svg>
        ),
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2" />
                <path d="M16 12h4" />
                <path d="M2 10h14" />
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
    }
    return <span className={`inline-flex items-center ${className}`}>{map[name] || null}</span>
}

// ─── How It Works Step ────────────────────────────────────────────────────────
const HowItWorksStep = ({ icon, step, title, description, index }) => (
    <div
        className="relative flex flex-col items-center text-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
    >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 mb-4">
            <Icon name={icon} size={22} />
        </div>
        <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white shadow">
            {step}
        </div>
        <h3 className="font-black text-slate-900 text-sm">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
)

// ─── Post Boost Card ──────────────────────────────────────────────────────────
const BoostCard = ({ post, membership, balance, onBoost, index }) => {
    const cost = calculateBoostCost(post.postTypePushPrice, membership?.discountPercent)
    const hasEnoughBalance = Number(balance || 0) >= cost.finalFee
    const daysRemaining = getDaysRemaining(post.endAt)
    const lastPush = formatRelativeTime(post.pushTime)
    const accentColor = post.postTypeTitleColor || '#7c3aed'
    const isExpiring = daysRemaining !== null && daysRemaining <= 3

    return (
        <article
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
            style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both',
            }}
            key={post.id}
        >
            {/* Top accent line */}
            <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
                style={{ backgroundColor: accentColor }}
            />

            {/* Glow effect on hover */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ boxShadow: `0 0 32px 0 ${accentColor}18` }}
            />

            <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <Link
                    className="relative block shrink-0 overflow-hidden sm:w-48"
                    to={`/posts/${post.id}`}
                >
                    <img
                        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full"
                        src={getPostImage(post)}
                        alt={post.title}
                        loading="lazy"
                    />
                    {/* Post type badge on image */}
                    <div className="absolute bottom-2 left-2">
                        <span
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm"
                            style={{
                                backgroundColor: `${accentColor}cc`,
                                borderColor: `${accentColor}66`,
                            }}
                        >
                            {post.postTypeName || 'Tin thường'}
                        </span>
                    </div>
                    {isExpiring && daysRemaining !== null && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
                            <Icon name="flame" size={10} />
                            Còn {daysRemaining}d
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h3
                                className="line-clamp-2 font-black leading-tight text-slate-900 group-hover:text-opacity-80"
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
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center transition-colors group-hover:border-violet-100">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Hết hạn</span>
                            {daysRemaining !== null ? (
                                <>
                                    <span className={`text-sm font-black ${getExpiryColor(daysRemaining)}`}>
                                        {daysRemaining}d
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(post.endAt))}
                                    </span>
                                </>
                            ) : (
                                <span className="text-sm font-bold text-slate-400">—</span>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center transition-colors group-hover:border-violet-100">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Đẩy gần nhất</span>
                            {lastPush ? (
                                <>
                                    <span className="text-sm font-black text-violet-600">{lastPush}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-slate-400">Chưa đẩy</span>
                                </>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-violet-100 bg-violet-50/60 p-2.5 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Phí đẩy</span>
                            <span className="text-sm font-black text-violet-700">{formatMoney(cost.base)}</span>
                            {membership?.discountPercent > 0 && (
                                <span className="text-[10px] font-bold text-violet-400">-{membership.discountPercent}%</span>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Thanh toán</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-900">{formatMoney(cost.finalFee)}</span>
                                {cost.discount > 0 && (
                                    <span className="text-xs font-bold text-emerald-600">-{formatMoney(cost.discount)}</span>
                                )}
                            </div>
                        </div>

                        {hasEnoughBalance ? (
                            <button
                                className="group/btn relative flex h-11 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl hover:shadow-violet-300 active:scale-95 disabled:opacity-60"
                                type="button"
                                onClick={() => onBoost(post)}
                            >
                                {/* Shimmer effect */}
                                <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                                <Icon name="rocket" size={16} className="relative transition-transform duration-300 group-hover/btn:-translate-y-1" />
                                <span className="relative">Đẩy tin</span>
                            </button>
                        ) : (
                            <Link
                                className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-lg shadow-red-200 transition-all duration-300 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-300 active:scale-95"
                                to={ROUTES.USER_DEPOSIT}
                            >
                                <Icon name="wallet" size={16} />
                                <span>Nạp tiền</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}

// ─── Boost Confirm Modal ──────────────────────────────────────────────────────
const BoostModal = ({ post, membership, balance, isSubmitting, onClose, onConfirm }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !isSubmitting) onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isSubmitting, onClose])

    if (!post) return null

    const cost = calculateBoostCost(post.postTypePushPrice, membership?.discountPercent)
    const hasEnoughBalance = Number(balance || 0) >= cost.finalFee
    const accentColor = post.postTypeTitleColor || '#7c3aed'

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
                                <Icon name="rocket" size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black">Đẩy tin lên cao</h2>
                                <p className="text-xs font-semibold text-white/80">
                                    Tin sẽ được ưu tiên hiển thị trong nhóm của nó
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

                {/* Post info */}
                <div className="p-5 space-y-4">
                    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                            <img className="h-full w-full object-cover" src={getPostImage(post)} alt={post.title} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black text-white"
                                    style={{ backgroundColor: accentColor, borderColor: `${accentColor}66` }}
                                >
                                    {post.postTypeName || 'Tin thường'}
                                </span>
                            </div>
                            <p className="mt-1 line-clamp-2 font-black text-slate-900 text-sm leading-snug">{post.title}</p>
                            <p className="text-xs text-slate-400">{post.district}, {post.province}</p>
                        </div>
                    </div>

                    {/* Cost breakdown */}
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 font-bold text-slate-500">
                                <Icon name="zap" size={14} className="text-violet-500" />
                                Phí đẩy tin
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
                                <strong className="text-xl font-black text-violet-700">{formatMoney(cost.finalFee)}</strong>
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
                                <Icon name="shield" size={14} />
                            </span>
                            <div>
                                <p className="text-sm font-black text-red-800">Số dư ví không đủ</p>
                                <p className="mt-0.5 text-xs font-semibold text-red-700">
                                    Bạn cần nạp thêm {formatMoney(cost.finalFee - Number(balance || 0))} để đẩy tin.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Để sau
                        </button>
                        {hasEnoughBalance ? (
                            <button
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all duration-200 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl hover:shadow-violet-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                type="button"
                                onClick={onConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        <span>Đang đẩy tin...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="rocket" size={16} />
                                        <span>Đẩy tin ngay</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <Link
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-lg shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-300 active:scale-95"
                                to={ROUTES.USER_DEPOSIT}
                            >
                                <Icon name="wallet" size={16} />
                                <span>Nạp tiền vào ví</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Success Modal ────────────────────────────────────────────────────────────
const SuccessModal = ({ post, onClose }) => {
    useEffect(() => {
        const timer = window.setTimeout(onClose, 2800)
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
                            <Icon name="check" size={32} className="text-white" />
                        </div>
                        <h2 className="text-xl font-black">Đẩy tin thành công!</h2>
                        <p className="mt-2 text-sm font-semibold text-emerald-100">
                            "{post?.title}" đã được đẩy lên cao trong danh sách.
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

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ posts, membership, balance }) => {
    const totalPosts = posts.length
    const pushablePosts = posts.filter(p => Number(p.postTypePushPrice || 0) > 0).length
    const recentlyPushed = posts.filter(p => {
        if (!p.pushTime) return false
        const diff = new Date() - new Date(p.pushTime)
        return diff < 24 * 60 * 60 * 1000
    }).length

    const stats = [
        {
            icon: 'rocket',
            label: 'Tin hoạt động',
            value: totalPosts,
            color: 'text-violet-600',
            bg: 'bg-violet-50 border-violet-100',
        },
        {
            icon: 'flame',
            label: 'Có thể đẩy',
            value: pushablePosts,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-100',
        },
        {
            icon: 'zap',
            label: 'Đã đẩy hôm nay',
            value: recentlyPushed,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-100',
        },
        {
            icon: 'wallet',
            label: 'Số dư ví',
            value: formatMoney(balance),
            color: 'text-slate-900',
            bg: 'bg-slate-50 border-slate-100',
            isText: true,
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, i) => (
                <div
                    key={stat.label}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 ${stat.bg} animate-in fade-in slide-in-from-bottom-2`}
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${stat.color}`}>
                        <Icon name={stat.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
                        {stat.isText ? (
                            <p className={`text-sm font-black ${stat.color} truncate`}>{stat.value}</p>
                        ) : (
                            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingState = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
            ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-44 w-48 animate-pulse rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3 pt-4">
                    <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
                    <div className="grid grid-cols-3 gap-2">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
                    </div>
                    <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200 ml-auto" />
                </div>
            </div>
        ))}
    </div>
)

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center animate-in fade-in zoom-in-95">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <Icon name="rocket" size={36} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-700">Chưa có tin để đẩy</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
            Tin cần có loại tin (VIP) và đang hoạt động mới có thể đẩy lên cao. Hãy đăng tin VIP để trải nghiệm tính năng này.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-xl active:scale-95"
                to={ROUTES.CREATE_POST}
            >
                <Icon name="rocket" size={16} />
                Đăng tin mới
            </Link>
            <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                to={ROUTES.POST_PRICING}
            >
                <Icon name="crown" size={16} />
                Xem bảng giá
            </Link>
        </div>
    </div>
)

// ─── Main Page ─────────────────────────────────────────────────────────────────
const BoostPostsPage = () => {
    const { user, login } = useAuth()
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [membership, setMembership] = useState(null)
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPost, setSelectedPost] = useState(null)
    const [successPost, setSuccessPost] = useState(null)
    const [error, setError] = useState('')

    const activePosts = useMemo(
        () => posts.filter((post) => post.status === 'ACTIVE' && Number(post.postTypePushPrice || 0) > 0),
        [posts]
    )

    const loadPage = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const refreshResponse = await authApi.refresh()
            login(refreshResponse.data)

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
            if (loadError.response?.status === 401) {
                navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.BOOST_POSTS } })
                return
            }
            setError(getErrorMessage(loadError, 'Không tải được danh sách. Vui lòng thử lại.'))
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        const timer = window.setTimeout(loadPage, 0)
        return () => window.clearTimeout(timer)
    }, [loadPage])

    const handleConfirmBoost = async () => {
        if (!selectedPost) return
        setIsSubmitting(true)
        try {
            await paymentApi.boostPost({ postId: selectedPost.id })
            setSuccessPost(selectedPost)
            setSelectedPost(null)
            await loadPage()
        } catch (boostError) {
            setError(getErrorMessage(boostError, 'Không đẩy được tin. Vui lòng kiểm tra số dư ví.'))
            setSelectedPost(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AccountLayout
            balance={balance}
            activeKey="boost"
            title="Đẩy tin đăng"
            subtitle="Đẩy tin để tăng thứ hạng hiển thị trong danh sách tìm kiếm."
            actions={null}
        >
            {isLoading && <LoadingState />}

            {!isLoading && (
                <div className="space-y-5">
                    {/* Stats bar */}
                    <StatsBar posts={activePosts} membership={membership} balance={balance} />

                    {/* How it works */}
                    <div className="space-y-3">
                        <h2 className="flex items-center gap-2 text-base font-black text-slate-800">
                            <Icon name="shield" size={18} className="text-violet-500" />
                            Đẩy tin hoạt động như thế nào?
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <HowItWorksStep
                                index={0}
                                step={1}
                                icon="zap"
                                title="Chọn tin đăng"
                                description="Chọn tin đang hoạt động có phí đẩy tin. Tin VIP càng cao, phí càng lớn."
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
                                icon="rocket"
                                title="Tin lên cao"
                                description="Tin được đẩy lên đầu danh sách trong cùng nhóm ưu tiên. Hiệu quả ngay."
                            />
                        </div>
                    </div>

                    {/* Alert: error */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Icon name="shield" size={14} />
                            </span>
                            <div className="flex-1 text-sm font-semibold text-red-700">
                                <p className="font-black text-red-800">Đẩy tin chưa thành công</p>
                                <p className="mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Posts grid */}
                    {activePosts.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {activePosts.map((post, index) => (
                                <BoostCard
                                    key={post.id}
                                    post={post}
                                    membership={membership}
                                    balance={balance}
                                    onBoost={setSelectedPost}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <BoostModal
                post={selectedPost}
                membership={membership}
                balance={balance}
                isSubmitting={isSubmitting}
                onClose={() => setSelectedPost(null)}
                onConfirm={handleConfirmBoost}
            />

            {successPost && (
                <SuccessModal post={successPost} onClose={() => setSuccessPost(null)} />
            )}
        </AccountLayout>
    )
}

export default BoostPostsPage
