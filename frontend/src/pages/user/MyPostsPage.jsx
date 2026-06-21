import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import AccountLayout from '../../components/AccountLayout'
import { Icon } from '../../components/posts/PostFormComponents'
import ROUTES from '../../constants/routes'

const TABS = [
    { key: 'ALL', label: 'Tất cả', statuses: null },
    { key: 'ACTIVE', label: 'Đang hoạt động', statuses: ['ACTIVE'] },
    { key: 'HIDDEN', label: 'Đã ẩn', statuses: ['HIDDEN'] },
    { key: 'PENDING', label: 'Chờ duyệt', statuses: ['PENDING'] },
    { key: 'EXPIRED', label: 'Hết hạn', statuses: ['EXPIRED'] },
    { key: 'REJECTED', label: 'Bị từ chối', statuses: ['REJECTED'] },
]

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const fmtDate = (v) => {
    if (!v) return null
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v))
    } catch { return null }
}
const getDaysLeft = (endAt) => {
    if (!endAt) return null
    return Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000)
}
const getImage = (p) => p.thumbnailUrl || p.imageUrls?.[0] || `https://picsum.photos/seed/post${p.id}/640/420`
const getErrorMessage = (e) => e.response?.data?.message || 'Không tải được danh sách. Vui lòng thử lại.'

// ─── Tab bar ─────────────────────────────────────────────────────────────────
const TabBar = ({ activeTab, counts, onChange }) => (
    <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const count = counts[tab.key] ?? 0
            const colors = {
                ALL: isActive ? 'from-slate-600 to-slate-700' : 'from-white to-slate-50 border-slate-200 text-slate-600',
                ACTIVE: isActive ? 'from-emerald-500 to-emerald-600' : 'from-white to-emerald-50 border-emerald-200 text-emerald-700',
                HIDDEN: isActive ? 'from-purple-500 to-purple-600' : 'from-white to-purple-50 border-purple-200 text-purple-700',
                PENDING: isActive ? 'from-amber-500 to-amber-600' : 'from-white to-amber-50 border-amber-200 text-amber-700',
                EXPIRED: isActive ? 'from-slate-500 to-slate-600' : 'from-white to-slate-50 border-slate-200 text-slate-600',
                REJECTED: isActive ? 'from-red-500 to-red-600' : 'from-white to-red-50 border-red-200 text-red-600',
            }
            return (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={`group inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all duration-300 ${
                        isActive
                            ? `bg-gradient-to-r ${colors[tab.key]} text-white shadow-lg`
                            : `border bg-gradient-to-r ${colors[tab.key]} shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-95`
                    }`}
                >
                    <span>{tab.label}</span>
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black transition-colors duration-300 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>{count}</span>
                </button>
            )
        })}
    </div>
)

// ─── Post card ────────────────────────────────────────────────────────────────
const PriceIcon = () => (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>
)

const AreaIcon = () => (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>
)

const PostCard = ({ post, onDelete, onToggleVisibility, loading }) => {
    const upper = String(post.status || '').toUpperCase()
    const canEdit = upper !== 'DELETED'
    const daysLeft = getDaysLeft(post.endAt)
    const expiryDate = fmtDate(post.endAt)
    const imageUrl = getImage(post)

    const statusConfig = {
        ACTIVE: { label: 'Đang hoạt động', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-500' },
        HIDDEN: { label: 'Đã ẩn', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', badge: 'bg-purple-500' },
        DRAFT: { label: 'Bản nháp', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-500' },
        PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-500' },
        EXPIRED: { label: 'Đã hết hạn', color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', dot: 'bg-slate-400', badge: 'bg-slate-400' },
        REJECTED: { label: 'Bị từ chối', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', badge: 'bg-red-500' },
    }
    const sc = statusConfig[upper] || statusConfig.EXPIRED

    return (
        <article className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/30">
            {/* Status accent bar */}
            <div className={`h-0.5 w-full ${sc.color}`} />

            <div className="flex flex-col sm:flex-row">

                {/* ── Image ── */}
                <div className="relative shrink-0 overflow-hidden bg-slate-100 sm:w-52 md:w-64 lg:w-56 xl:w-64">
                    <div className="aspect-[4/3] sm:aspect-auto sm:h-full">
                        <img
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            src={imageUrl}
                            alt={post.title || 'Tin đăng'}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/post${post.id}/640/420` }}
                        />
                    </div>
                    {/* Post type */}
                    {post.postTypeName && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                            {post.postTypeName}
                        </span>
                    )}
                    {/* Status badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                        </span>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                    {/* Top: address */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="truncate">{post.district}{post.district && post.province ? ', ' : ''}{post.province}</span>
                    </div>

                    {/* Middle: title + description */}
                    <div className="flex flex-col gap-1">
                        <Link to={`/posts/${post.id}`} className="group/title">
                            <h3 className="line-clamp-2 text-[15px] font-black leading-5 text-slate-950 transition-colors duration-200 group-hover/title:text-emerald-700">
                                {post.title || 'Không có tiêu đề'}
                            </h3>
                        </Link>
                        {post.description && (
                            <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 font-medium">{post.description}</p>
                        )}
                    </div>

                    {/* Bottom row */}
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        {/* Left: price + area */}
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-3.5 py-2.5 ring-1 ring-emerald-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                                <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    <PriceIcon />
                                    <span>Giá thuê</span>
                                </span>
                                <strong className="block text-base font-black text-emerald-800">{fmtMoney(post.rentalPrice)}<span className="ml-0.5 text-[11px] font-semibold text-emerald-600">/tháng</span></strong>
                            </div>
                            {post.area && (
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 px-3.5 py-2.5 ring-1 ring-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                                    <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                        <AreaIcon />
                                        <span>Diện tích</span>
                                    </span>
                                    <strong className="block text-base font-black text-slate-950">{post.area} m²</strong>
                                </div>
                            )}
                            {daysLeft !== null && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                                    {daysLeft < 0 ? (
                                        <span className="text-slate-400">Đã hết hạn</span>
                                    ) : daysLeft <= 7 ? (
                                        <span className="rounded-full bg-red-100 px-2.5 py-1 font-black text-red-700 ring-1 ring-red-200">
                                            Còn {daysLeft} ngày
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700 ring-1 ring-emerald-200">
                                            Còn {daysLeft} ngày
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/posts/${post.id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-slate-800 active:scale-95"
                            >
                                Xem chi tiết
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                                </svg>
                            </Link>
                            {canEdit && (
                                <Link
                                    to={ROUTES.EDIT_POST.replace(':id', post.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 active:scale-95"
                                    title="Chỉnh sửa"
                                >
                                    <Icon name="edit" className="h-3.5 w-3.5" />
                                </Link>
                            )}
                            {(upper === 'ACTIVE' || upper === 'HIDDEN') && (
                                <button
                                    type="button"
                                    onClick={() => onToggleVisibility?.(post)}
                                    disabled={loading}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 shadow-sm transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                                        upper === 'ACTIVE'
                                            ? 'border-purple-200 bg-purple-50 text-purple-600 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-purple-100'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100'
                                    }`}
                                    title={upper === 'ACTIVE' ? 'Ẩn tin' : 'Hiện tin'}
                                >
                                    {loading ? (
                                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : upper === 'ACTIVE' ? (
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onDelete?.(post)}
                                disabled={loading}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-red-100 bg-red-50 text-red-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Xóa"
                            >
                                {loading ? (
                                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <Icon name="trash" className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyState = ({ activeTab }) => {
    const configs = {
        ALL: { title: 'Chưa có tin đăng nào', desc: 'Tạo tin đăng đầu tiên để bắt đầu cho thuê phòng.', color: 'from-emerald-100 to-teal-100', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        ACTIVE: { title: 'Không có tin đang hoạt động', desc: 'Các tin đang hiển thị sẽ xuất hiện ở đây.', color: 'from-emerald-100 to-emerald-50', icon: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z' },
        PENDING: { title: 'Không có tin nào đang chờ duyệt', desc: 'Các tin vừa đăng sẽ hiển thị ở đây khi chờ duyệt.', color: 'from-amber-100 to-yellow-100', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
        EXPIRED: { title: 'Không có tin nào đã hết hạn', desc: 'Các tin đã hết hạn sẽ xuất hiện tại đây.', color: 'from-slate-200 to-slate-100', icon: 'M6 18L18 6M6 6l12 12' },
        REJECTED: { title: 'Không có tin nào bị từ chối', desc: 'Các tin bị từ chối sẽ xuất hiện ở đây. Bạn có thể chỉnh sửa và gửi duyệt lại.', color: 'from-red-100 to-rose-100', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
    }
    const cfg = configs[activeTab] || configs.ALL
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center transition-all duration-300 hover:border-emerald-300 hover:shadow-lg">
            <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${cfg.color} text-emerald-700 shadow-lg ring-1 ring-white/40`}>
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={cfg.icon} />
                </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900">{cfg.title}</h2>
            <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">{cfg.desc}</p>
            <Link
                className="group/cta mt-6 inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:scale-[1.04] hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl active:scale-95"
                to={ROUTES.CREATE_POST}
            >
                <span className="flex items-center gap-2">
                    <Icon name="plus" className="h-4 w-4" />
                    Đăng tin mới
                </span>
            </Link>
        </div>
    )
}

// ─── Delete modal ─────────────────────────────────────────────────────────────
const DeleteModal = ({ post, isSubmitting, onCancel, onConfirm }) => {
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape' && !isSubmitting) onCancel() }
        window.addEventListener('keydown', fn)
        return () => window.removeEventListener('keydown', fn)
    }, [isSubmitting, onCancel])

    if (!post) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => !isSubmitting && onCancel()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow">
                            <Icon name="trash" className="h-5 w-5" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">Xóa tin đăng?</h3>
                            <p className="text-sm font-semibold text-red-100">Hành động không thể hoàn tác.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3 p-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="line-clamp-2 text-sm font-black text-slate-900">{post.title || 'Không có tiêu đề'}</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{post.district}, {post.province}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Tin đăng sẽ bị xóa mềm và không còn hiển thị trên hệ thống.</p>
                </div>
                <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4">
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="flex-1 rounded-xl border-2 border-slate-300 bg-white py-2.5 text-sm font-black text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95 disabled:opacity-50">
                        Hủy
                    </button>
                    <button type="button" onClick={onConfirm} disabled={isSubmitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-sm font-black text-white shadow-md shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-rose-700 active:scale-95 disabled:opacity-50">
                        {isSubmitting ? (
                            <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang xóa...</>
                        ) : (
                            <><Icon name="trash" className="h-4 w-4" />Xóa tin đăng</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
    if (!toast.message) return null
    const ok = toast.type === 'success'
    return (
        <div className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-3.5 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-4 fade-in ${
            ok ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800' : 'border-red-200 bg-red-50/95 text-red-700'
        }`} role="status">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                <Icon name={ok ? 'check' : 'info'} className="h-4 w-4" />
            </span>
            <p className="text-sm font-bold">{toast.message}</p>
        </div>
    )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <div className="flex gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1" key={i}>
                <div className="w-52 shrink-0 animate-pulse bg-slate-200 sm:w-64" style={{ aspectRatio: '4/3' }} />
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                    <div className="space-y-2">
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        <div className="space-y-1">
                            <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
                            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
                            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const MyPostsPage = () => {
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [pageInfo, setPageInfo] = useState({ currentPage: 0, totalPages: 0, totalElements: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('ALL')
    const [deletingId, setDeletingId] = useState('')
    const [deletingPost, setDeletingPost] = useState(null)
    const [togglingId, setTogglingId] = useState('')
    const [toast, setToast] = useState({ type: '', message: '' })

    const loadPosts = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            await authApi.refresh()
            // Fetch ALL pages at once so filtering by status works correctly
            let allPosts = []
            let page = 0
            let totalPages = 1
            while (page < totalPages) {
                const res = await postApi.getMyPosts({ page, size: 20 })
                const data = res.data || {}
                allPosts = allPosts.concat(data.posts || [])
                totalPages = data.totalPages || 1
                page++
            }
            setPosts(allPosts)
            setPageInfo({ currentPage: 0, totalPages: 1, totalElements: allPosts.length })
        } catch (e) {
            if (e.response?.status === 401) { navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.MY_POSTS } }); return }
            setError(getErrorMessage(e))
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => { loadPosts() }, [loadPosts])

    useEffect(() => {
        if (!toast.message) return
        const t = setTimeout(() => setToast({ type: '', message: '' }), 4000)
        return () => clearTimeout(t)
    }, [toast])

    const tabCounts = useMemo(() => {
        const visible = posts.filter((p) => {
            const s = String(p.status || '').toUpperCase()
            return s !== 'DELETED' && s !== 'DRAFT'
        })
        const m = { ALL: visible.length }
        TABS.forEach((t) => {
            if (!t.statuses) return
            m[t.key] = visible.filter((p) => t.statuses.includes(String(p.status || '').toUpperCase())).length
        })
        return m
    }, [posts])

    const filtered = useMemo(() => {
        const tab = TABS.find((t) => t.key === activeTab)
        if (!tab || !tab.statuses) {
            // "Tất cả" = mọi thứ TRỪ đã xóa và nháp
            return posts.filter((p) => {
                const s = String(p.status || '').toUpperCase()
                return s !== 'DELETED' && s !== 'DRAFT'
            })
        }
        return posts.filter((p) => tab.statuses.includes(String(p.status || '').toUpperCase()))
    }, [posts, activeTab])

    const handleDeleteAsk = (post) => setDeletingPost(post)
    const handleDeleteCancel = () => { if (!deletingId) setDeletingPost(null) }
    const handleDeleteConfirm = async () => {
        if (!deletingPost) return
        const targetId = deletingPost.id
        setDeletingId(targetId)
        setPosts((prev) => prev.filter((p) => String(p.id) !== String(targetId)))
        setDeletingPost(null)
        try {
            await postApi.deletePost(targetId)
            setToast({ type: 'success', message: `Đã xóa tin đăng thành công.` })
        } catch (e) {
            await loadPosts()
            setToast({ type: 'error', message: e.response?.data?.message || 'Không xóa được tin đăng.' })
        } finally {
            setDeletingId('')
        }
    }

    const handleToggleVisibility = async (post) => {
        const isHiding = post.status === 'ACTIVE'
        setTogglingId(post.id)
        try {
            await postApi.toggleVisibility(post.id)
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id
                        ? { ...p, status: isHiding ? 'HIDDEN' : 'ACTIVE' }
                        : p
                )
            )
            setToast({ type: 'success', message: isHiding ? 'Đã ẩn tin đăng khỏi danh sách công khai.' : 'Đã hiện lại tin đăng.' })
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.message || 'Không cập nhật được trạng thái.' })
        } finally {
            setTogglingId('')
        }
    }

    return (
        <AccountLayout
            balance={balance}
            activeKey="posts"
            title="Quản lý tin đăng"
            subtitle="Toàn bộ tin đăng phòng trọ của bạn."
            actions={
                <Link
                    className="group/new relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all duration-300 hover:scale-[1.04] hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                    to={ROUTES.CREATE_POST}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Icon name="plus" className="h-4 w-4" />
                        Đăng tin mới
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-700 to-teal-700 transition-transform duration-500 group-hover/new:translate-x-0" />
                </Link>
            }
        >
            {/* Floating toast */}
            <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4 sm:top-24">
                <Toast toast={toast} />
            </div>

            {/* Tab bar */}
            <TabBar activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />

            {/* Error */}
            {!isLoading && error && (
                <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm">
                        <Icon name="info" className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                        <p className="font-black text-red-800">Không tải được tin đăng</p>
                        <p className="text-sm font-semibold text-red-700">{error}</p>
                    </div>
                    <button className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-red-700 active:scale-95"
                        type="button" onClick={() => loadPosts()}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && <LoadingSkeleton />}

            {/* Empty state */}
            {!isLoading && !error && filtered.length === 0 && <EmptyState activeTab={activeTab} />}

            {/* Post list */}
            {!isLoading && !error && filtered.length > 0 && (
                <div className="flex flex-col gap-4">
                    {filtered.map((post, i) => (
                        <div
                            key={post.id}
                            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                        >
                            <PostCard
                                post={post}
                                loading={deletingId === post.id || togglingId === post.id}
                                onDelete={handleDeleteAsk}
                                onToggleVisibility={handleToggleVisibility}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Delete modal */}
            <DeleteModal
                post={deletingPost}
                isSubmitting={Boolean(deletingId)}
                onCancel={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />
        </AccountLayout>
    )
}

export default MyPostsPage
