import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const getErrorMessage = (error, fallback = 'Không xử lý được.') => {
    const response = error.response?.data
    const fieldErrors = response?.data
    if (fieldErrors && typeof fieldErrors === 'object') return Object.values(fieldErrors).join('. ')
    return response?.message || fallback
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, className = '' }) => {
    const map = {
        deposit: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
        creditCard: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
        x: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
            </svg>
        ),
        clock: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
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
        chevronLeft: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        ),
        chevronRight: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
            </svg>
        ),
        vnpay: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h18M5 10V8l7-4 7 4v2M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16" />
            </svg>
        ),
        bank: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
        ),
        post: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
        ),
        rocket: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c3 5 5 9 5 14a7 7 0 1 1-14 0c0-5 2-9 5-14M12 16v4M10 20h4" />
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
        tag: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z" />
                <path d="M7 7h.01" />
            </svg>
        ),
    }
    return <span className={`inline-flex items-center ${className}`}>{map[name] || null}</span>
}

// ─── Deposit Type Config ──────────────────────────────────────────────────────
const DEPOSIT_METHOD_CONFIG = {
    VNPAY: { label: 'VNPAY', icon: 'vnpay', bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-200' },
    BANK_TRANSFER: { label: 'Chuyển khoản', icon: 'bank', bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-200' },
}

const PAYMENT_TYPE_CONFIG = {
    POST_PAYMENT: { label: 'Thanh toán đăng tin', icon: 'post', bg: 'bg-violet-50', color: 'text-violet-600', border: 'border-violet-200' },
    EXTEND: { label: 'Gia hạn tin', icon: 'repeat', bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-200' },
    PUSH: { label: 'Đẩy tin', icon: 'rocket', bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-200' },
    REFUND: { label: 'Hoàn tiền', icon: 'refresh', bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-200' },
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const config = {
        SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
        FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
    }
    const s = config[status] || config.PENDING
    const labels = { SUCCESS: 'Thành công', PENDING: 'Đang chờ', FAILED: 'Thất bại', CANCELLED: 'Đã hủy' }
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${s.bg} ${s.text} ${s.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {labels[status] || status}
        </span>
    )
}

// ─── Deposit Row ───────────────────────────────────────────────────────────────
const DepositRow = ({ tx, onClick, index }) => {
    const methodConfig = DEPOSIT_METHOD_CONFIG[tx.method] || DEPOSIT_METHOD_CONFIG.VNPAY
    const isPositive = Number(tx.amount || 0) > 0

    return (
        <tr
            className="group cursor-pointer border-b border-slate-100 transition-all duration-150 hover:bg-emerald-50/30 active:bg-emerald-50/60"
            onClick={() => onClick?.(tx)}
        >
            {/* Ngày giờ */}
            <td className="px-4 py-3.5">
                <div>
                    <p className="text-sm font-semibold text-slate-700">
                        {tx.createdAt
                            ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.createdAt))
                            : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {tx.createdAt
                            ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(tx.createdAt))
                            : ''}
                    </p>
                </div>
            </td>
            {/* Số tiền nạp */}
            <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-black text-slate-800">{formatMoney(tx.amount)}</span>
            </td>
            {/* Thuế / VAT */}
            <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-semibold text-slate-500">{formatMoney(tx.tax)}</span>
            </td>
            {/* Thực nhận */}
            <td className="px-4 py-3.5 text-right">
                <span className={`text-sm font-black ${isPositive ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {formatMoney(tx.netAmount)}
                </span>
            </td>
            {/* Phương thức */}
            <td className="px-4 py-3.5">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${methodConfig.bg} ${methodConfig.color} ${methodConfig.border}`}>
                    <Icon name={methodConfig.icon} size={12} />
                    {methodConfig.label}
                </div>
            </td>
            {/* Trạng thái */}
            <td className="px-4 py-3.5">
                <StatusBadge status={tx.status} />
            </td>
            {/* Arrow */}
            <td className="px-4 py-3.5 pr-5">
                <span className="text-slate-200 transition-colors group-hover:text-slate-400">
                    <Icon name="chevronRight" size={14} />
                </span>
            </td>
        </tr>
    )
}

// ─── Payment Row ──────────────────────────────────────────────────────────────
const PaymentRow = ({ tx, onClick, index }) => {
    const typeConfig = PAYMENT_TYPE_CONFIG[tx.transactionType] || PAYMENT_TYPE_CONFIG.POST_PAYMENT
    const isPositive = Number(tx.amount || 0) >= 0

    return (
        <tr
            className="group cursor-pointer border-b border-slate-100 transition-all duration-150 hover:bg-violet-50/30 active:bg-violet-50/60"
            onClick={() => onClick?.(tx)}
        >
            {/* Thời gian */}
            <td className="px-4 py-3.5">
                <div>
                    <p className="text-sm font-semibold text-slate-700">
                        {tx.createdAt
                            ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.createdAt))
                            : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {tx.createdAt
                            ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(tx.createdAt))
                            : ''}
                    </p>
                </div>
            </td>
            {/* Loại giao dịch */}
            <td className="px-4 py-3.5">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                    <Icon name={typeConfig.icon} size={12} />
                    {typeConfig.label}
                </div>
            </td>
            {/* Bài đăng */}
            <td className="px-4 py-3.5 max-w-[180px]">
                {tx.postTitle ? (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{tx.postTitle}</p>
                        {tx.postId && <p className="text-xs text-slate-400">#{tx.postId}</p>}
                    </div>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                )}
            </td>
            {/* Số tiền thanh toán */}
            <td className="px-4 py-3.5 text-right">
                <span className={`text-sm font-black ${isPositive ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatMoney(tx.finalFee)}
                </span>
            </td>
            {/* Giảm giá */}
            <td className="px-4 py-3.5 text-right">
                {tx.discountPercent > 0 ? (
                    <span className="text-sm font-black text-emerald-600">-{tx.discountPercent}%</span>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                )}
            </td>
            {/* Hạn sử dụng */}
            <td className="px-4 py-3.5">
                {tx.dayEnd ? (
                    <span className="text-sm font-semibold text-slate-700">
                        {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.dayEnd))}
                    </span>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                )}
            </td>
            {/* Arrow */}
            <td className="px-4 py-3.5 pr-5">
                <span className="text-slate-200 transition-colors group-hover:text-slate-400">
                    <Icon name="chevronRight" size={14} />
                </span>
            </td>
        </tr>
    )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ tx, isDeposit, onClose }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    if (!tx) return null

    const methodConfig = DEPOSIT_METHOD_CONFIG[tx.method] || DEPOSIT_METHOD_CONFIG.VNPAY
    const typeConfig = PAYMENT_TYPE_CONFIG[tx.transactionType] || PAYMENT_TYPE_CONFIG.POST_PAYMENT

    const depositRows = [
        { label: 'Mã giao dịch', value: tx.gatewayTransactionNo || '—', mono: true },
        { label: 'Mã đơn hàng', value: tx.transactionRef || `#${tx.id}`, mono: true },
        { label: 'Thời gian', value: tx.createdAt ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.createdAt)) : '—' },
        { label: 'Phương thức', render: <span className={`inline-flex items-center gap-1.5 text-sm font-black ${methodConfig.color}`}><Icon name={methodConfig.icon} size={14} />{methodConfig.label}</span> },
        { label: 'Trạng thái', render: <StatusBadge status={tx.status} /> },
        { label: 'Số tiền nạp', value: formatMoney(tx.amount), bold: true },
        { label: 'VAT', value: formatMoney(tx.tax) },
        { label: 'Số tiền thực nhận', value: formatMoney(tx.netAmount), bold: true, green: true },
        { label: 'Số dư trước', value: formatMoney(tx.openingBalance) },
        { label: 'Số dư sau', value: formatMoney(tx.closingBalance), bold: true },
        ...(tx.description && tx.description !== tx.note ? [{ label: 'Ghi chú', value: tx.description }] : []),
    ]

    const paymentSections = [
        {
            title: 'Thông tin giao dịch',
            rows: [
                { label: 'Loại giao dịch', render: <span className={`inline-flex items-center gap-1.5 text-sm font-black ${typeConfig.color}`}><Icon name={typeConfig.icon} size={14} />{typeConfig.label}</span> },
                { label: 'Thời gian thanh toán', value: tx.createdAt ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.createdAt)) : '—' },
                ...(tx.postTitle ? [{ label: 'Bài đăng liên quan', render: <div className="text-right"><span className="text-sm font-semibold text-slate-700">{tx.postTitle}</span><span className="ml-1.5 text-xs text-slate-400">#{tx.postId}</span></div> }] : []),
                ...(tx.days ? [{ label: 'Số ngày sử dụng', value: `${tx.days} ngày` }] : []),
                ...(tx.dayEnd ? [{ label: 'Ngày hết hạn', value: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.dayEnd)) }] : []),
            ]
        },
        {
            title: 'Chi tiết chi phí',
            rows: [
                { label: 'Phí gốc', value: formatMoney(tx.baseFee) },
                { label: 'Thuế VAT', value: formatMoney(tx.tax) },
                ...(tx.discountPercent > 0 ? [{ label: 'Giảm giá thành viên', value: `-${tx.discountPercent}%`, green: true }] : []),
                { label: 'Tổng thanh toán', value: formatMoney(tx.finalFee), bold: true, ...(tx.transactionType === 'REFUND' ? { green: true } : { red: true }) },
            ]
        },
        {
            title: 'Biến động số dư',
            rows: [
                { label: 'Số dư trước giao dịch', value: formatMoney(tx.openingBalance) },
                { label: 'Số dư sau giao dịch', value: formatMoney(tx.closingBalance), bold: true },
            ]
        },
    ]

    const headerBg = isDeposit ? 'from-emerald-600 to-teal-600' : 'from-violet-600 to-purple-600'
    const headerIcon = isDeposit ? 'deposit' : 'creditCard'
    const headerSubtitle = isDeposit
        ? (tx.gatewayTransactionNo || tx.transactionRef || `#${tx.id}`)
        : (tx.postId ? `#${tx.postId}` : typeConfig.label)

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm transition-all duration-300 sm:items-center sm:justify-center"
            onClick={() => onClose()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${headerBg} p-5 text-white`}>
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <Icon name={headerIcon} size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black">Chi tiết giao dịch</h2>
                                <p className="text-xs font-semibold text-white/70">{headerSubtitle}</p>
                            </div>
                        </div>
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg font-black text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
                            type="button"
                            onClick={onClose}
                        >×</button>
                    </div>
                </div>

                {/* Detail rows */}
                <div className="p-5 space-y-4">
                    {isDeposit ? (
                        depositRows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                                <span className="text-sm font-bold text-slate-500">{row.label}</span>
                                {row.render || (
                                    <strong className={`text-sm font-black ${row.mono ? 'font-mono text-xs' : ''} ${
                                        row.green ? 'text-emerald-700' : row.red ? 'text-red-600' : row.bold ? 'text-slate-900' : 'text-slate-600'
                                    }`}>
                                        {row.value}
                                    </strong>
                                )}
                            </div>
                        ))
                    ) : (
                        paymentSections.map((section) => (
                            <div key={section.title}>
                                <p className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{section.title}</p>
                                <div className="space-y-1.5">
                                    {section.rows.map((row) => (
                                        <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                                            <span className="text-sm font-bold text-slate-500">{row.label}</span>
                                            {row.render || (
                                                <strong className={`text-sm font-black ${
                                                    row.green ? 'text-emerald-700' : row.red ? 'text-red-600' : row.bold ? 'text-slate-900' : 'text-slate-600'
                                                }`}>
                                                    {row.value}
                                                </strong>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                    <button
                        className="mt-3 w-full h-11 rounded-xl border-2 border-slate-200 bg-white text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                        type="button"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, totalElements, size, onPage }) => {
    if (totalPages <= 0) return null
    const pages = []
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            if (pages[pages.length - 1] !== i && pages[pages.length - 1] !== '...') {
                if (typeof pages[pages.length - 1] === 'number' && i - pages[pages.length - 1] > 1) pages.push('...')
                pages.push(i)
            }
        }
    }

    return (
        <div className="flex items-center justify-between gap-4 px-1 py-4">
            <p className="text-xs font-semibold text-slate-400">
                Hiển thị {currentPage * size + 1}–{Math.min((currentPage + 1) * size, totalElements)} / {totalElements} giao dịch
            </p>
            <div className="flex items-center gap-1">
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    type="button" onClick={() => onPage(currentPage - 1)} disabled={currentPage <= 0}
                >
                    <Icon name="chevronLeft" size={14} />
                </button>
                {pages.map((p, i) =>
                    p === '...'
                        ? <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-sm font-bold text-slate-400">…</span>
                        : (
                            <button
                                key={p}
                                className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-black transition-all ${
                                    p === currentPage
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                                type="button" onClick={() => onPage(p)}
                            >
                                {p + 1}
                            </button>
                        )
                )}
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    type="button" onClick={() => onPage(currentPage + 1)} disabled={currentPage + 1 >= totalPages}
                >
                    <Icon name="chevronRight" size={14} />
                </button>
            </div>
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ isDeposit }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center animate-in fade-in zoom-in-95">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <Icon name={isDeposit ? 'deposit' : 'creditCard'} size={36} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-700">
            {isDeposit ? 'Chưa có lịch sử nạp tiền' : 'Chưa có lịch sử thanh toán'}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
            {isDeposit
                ? 'Các giao dịch nạp tiền qua cổng VNPAY sẽ xuất hiện tại đây.'
                : 'Các khoản thanh toán đăng tin, gia hạn và đẩy tin sẽ xuất hiện tại đây.'}
        </p>
    </div>
)

// ─── Table Skeleton ─────────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left"><div className="h-2.5 w-20 rounded bg-slate-200" /></th>
                    <th className="px-4 py-3 text-right"><div className="h-2.5 w-24 rounded bg-slate-200 ml-auto" /></th>
                    <th className="px-4 py-3 text-right"><div className="h-2.5 w-16 rounded bg-slate-200 ml-auto" /></th>
                    <th className="px-4 py-3 text-right"><div className="h-2.5 w-20 rounded bg-slate-200 ml-auto" /></th>
                    <th className="px-4 py-3 text-left"><div className="h-2.5 w-16 rounded bg-slate-200" /></th>
                    <th className="px-4 py-3 text-left"><div className="h-2.5 w-16 rounded bg-slate-200" /></th>
                    <th className="w-10 px-4 py-3" />
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                        <td className="px-4 py-3.5"><div className="h-3 w-20 rounded bg-slate-200" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-24 rounded bg-slate-200 ml-auto" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-16 rounded bg-slate-200 ml-auto" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-20 rounded bg-slate-200 ml-auto" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-16 rounded bg-slate-200" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-16 rounded bg-slate-200" /></td>
                        <td className="px-4 py-3.5"><div className="h-3 w-6 rounded bg-slate-200 ml-auto" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

// ─── Deposit Table Header ─────────────────────────────────────────────────────
const DepositTableHead = () => (
    <thead>
        <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Ngày giờ</th>
            <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Số tiền nạp</th>
            <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Thuế / VAT</th>
            <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Thực nhận</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Phương thức</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Trạng thái</th>
            <th className="w-10 px-4 py-3.5" />
        </tr>
    </thead>
)

// ─── Payment Table Header ─────────────────────────────────────────────────────
const PaymentTableHead = () => (
    <thead>
        <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Thời gian</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Loại giao dịch</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Bài đăng</th>
            <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Số tiền thanh toán</th>
            <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Giảm giá</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Hạn sử dụng</th>
            <th className="w-10 px-4 py-3.5" />
        </tr>
    </thead>
)

// ─── Main Page ─────────────────────────────────────────────────────────────────
const WalletPage = () => {
    const { login } = useAuth()
    const { loadBalance } = useWallet()
    const navigate = useNavigate()
    const location = useLocation()

    const [transactions, setTransactions] = useState([])
    const [pageInfo, setPageInfo] = useState({ currentPage: 0, totalPages: 0, totalElements: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTx, setSelectedTx] = useState(null)
    const [depositResult, setDepositResult] = useState('')

    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
    const tabParam = searchParams.get('tab')
    const activeTab = tabParam === 'payments' ? 'payments' : 'deposits'

    const loadPage = useCallback(async (page = 0) => {
        setIsLoading(true)
        try {
            await authApi.refresh().then((r) => login(r.data))
            const txType = activeTab === 'deposits' ? 'DEPOSIT' : 'PAYMENT'
            const result = await walletApi.getTransactions({ page, size: 15, type: txType })
            const data = result.data || {}
            setTransactions(data.transactions || [])
            setPageInfo({
                currentPage: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0,
            })
        } catch (err) {
            if (err.response?.status === 401) {
                navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.WALLET } })
            }
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, navigate])

    useEffect(() => {
        const result = searchParams.get('deposit')
        if (result) {
            setDepositResult(result)
            navigate(ROUTES.WALLET + `?tab=${activeTab}`, { replace: true })
            loadBalance()
        }
    }, [location.search])

    useEffect(() => {
        const timer = window.setTimeout(loadPage, 0)
        return () => window.clearTimeout(timer)
    }, [loadPage, location.search])

    const handleTabChange = (tab) => {
        setTransactions([])
        navigate(`${ROUTES.WALLET}?tab=${tab}`)
    }

    const handlePageChange = (page) => {
        loadPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const tabs = [
        { key: 'deposits', label: 'Lịch sử nạp tiền', icon: 'deposit' },
        { key: 'payments', label: 'Lịch sử thanh toán', icon: 'creditCard' },
    ]

    return (
        <AccountLayout
            activeKey="transactions"
            title="Lịch sử giao dịch"
            subtitle="Theo dõi toàn bộ giao dịch nạp tiền và thanh toán dịch vụ."
        >
            {/* Result alerts */}
            {depositResult === 'success' && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <Icon name="check" size={16} />
                    </span>
                    <div className="flex-1">
                        <p className="font-black text-emerald-800">Nạp tiền thành công!</p>
                        <p className="text-sm font-semibold text-emerald-700">Số dư ví sẽ được cập nhật sau khi hệ thống xác nhận.</p>
                    </div>
                    <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors" type="button" onClick={() => setDepositResult('')}>
                        <Icon name="x" size={14} />
                    </button>
                </div>
            )}
            {depositResult === 'failed' && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <Icon name="x" size={14} />
                    </span>
                    <div className="flex-1">
                        <p className="font-black text-red-800">Nạp tiền chưa thành công</p>
                        <p className="text-sm font-semibold text-red-700">Giao dịch bị hủy hoặc thất bại.</p>
                    </div>
                    <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-100 transition-colors" type="button" onClick={() => setDepositResult('')}>
                        <Icon name="x" size={14} />
                    </button>
                </div>
            )}

            {/* Tab bar */}
            <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key
                        const tabAccents = isActive ? {
                            deposits: 'text-emerald-700',
                            payments: 'text-violet-700',
                        }[tab.key] : 'text-slate-400'

                        return (
                            <button
                                key={tab.key}
                                className={`relative flex flex-1 items-center justify-center gap-2.5 py-3.5 text-sm font-black transition-all duration-300 ${
                                    isActive ? 'text-slate-900 bg-white' : 'text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100'
                                }`}
                                style={isActive ? {
                                    boxShadow: `0 -2px 0 0 ${
                                        tab.key === 'deposits' ? '#10b981' : '#7c3aed'
                                    } inset`
                                } : undefined}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                            >
                                <Icon name={tab.icon} size={17} className={isActive ? {
                                    deposits: 'text-emerald-600',
                                    payments: 'text-violet-600',
                                }[tab.key] : ''} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <Skeleton />
            ) : transactions.length === 0 ? (
                <EmptyState isDeposit={activeTab === 'deposits'} />
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-in fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                {activeTab === 'deposits' ? <DepositTableHead /> : <PaymentTableHead />}
                                <tbody>
                                    {activeTab === 'deposits'
                                        ? transactions.map((tx, index) => (
                                            <DepositRow key={tx.id} tx={tx} index={index} onClick={setSelectedTx} />
                                        ))
                                        : transactions.map((tx, index) => (
                                            <PaymentRow key={tx.id} tx={tx} index={index} onClick={setSelectedTx} />
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination
                        currentPage={pageInfo.currentPage}
                        totalPages={pageInfo.totalPages}
                        totalElements={pageInfo.totalElements}
                        size={15}
                        onPage={handlePageChange}
                    />
                </>
            )}

            {/* Detail modal */}
            {selectedTx && (
                <DetailModal
                    tx={selectedTx}
                    isDeposit={activeTab === 'deposits'}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </AccountLayout>
    )
}

export default WalletPage
