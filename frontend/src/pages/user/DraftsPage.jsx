import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import membershipApi from '../../api/membershipApi'
import paymentApi from '../../api/paymentApi'
import AccountLayout from '../../components/AccountLayout'
import PaymentDraftModal from '../../components/posts/PaymentDraftModal'
import MyPostCardActions from '../../components/posts/MyPostCardActions'
import { Icon, formatMoney } from '../../components/posts/PostFormComponents'
import ROUTES from '../../constants/routes'

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được danh sách tin nháp.'

const formatDate = (value) => {
    if (!value) return null
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(value))
    } catch {
        return null
    }
}

const getPostImage = (post) =>
    post.thumbnailUrl || post.imageUrls?.[0] || `https://picsum.photos/seed/draft-${post.id}/640/420`

const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white" key={i}>
                <div className="h-40 w-56 shrink-0 animate-pulse bg-slate-200 sm:h-full sm:w-52" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="mt-auto flex gap-2">
                        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                    </div>
                </div>
            </div>
        ))}
    </div>
)

const DraftCard = ({ post, loading, onDelete, onPay }) => {
    const imageUrl = getPostImage(post)
    const createdDate = formatDate(post.createdAt || post.createdDate)
    const updatedDate = formatDate(post.updatedAt || post.updatedDate)

    return (
        <article className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/30">
            {/* Blue accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

            <div className="flex flex-col sm:flex-row">

                {/* ── Image ── */}
                <div className="relative shrink-0 overflow-hidden bg-slate-100 sm:w-52 md:w-64 lg:w-56 xl:w-64">
                    <div className="aspect-[4/3] sm:aspect-auto sm:h-full">
                        <img
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            src={imageUrl}
                            alt={post.title || 'Hình ảnh tin nháp'}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/draft-${post.id}/640/420` }}
                        />
                    </div>
                    {/* Draft badge */}
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md">
                        Bản nháp
                    </span>
                </div>

                {/* ── Content ── */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                    {/* Address */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <svg className="h-3.5 w-3.5 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="truncate">
                            {[post.district, post.province].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                        </span>
                    </div>

                    {/* Title + description */}
                    <div className="flex flex-col gap-1">
                        <Link
                            to={`/posts/${post.id}`}
                            className="group/title"
                        >
                            <h3 className="line-clamp-2 text-[15px] font-black leading-5 text-slate-950 transition-colors duration-200 group-hover/title:text-blue-600">
                                {post.title || 'Không có tiêu đề'}
                            </h3>
                        </Link>
                        {post.description && (
                            <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 font-medium">
                                {post.description}
                            </p>
                        )}
                    </div>

                    {/* Bottom row */}
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        {/* Left: price + area + dates */}
                        <div className="flex flex-wrap items-end gap-2">
                            {post.rentalPrice && (
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-3.5 py-2.5 ring-1 ring-emerald-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                                    <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                            <path d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
                                        </svg>
                                        <span>Giá thuê</span>
                                    </span>
                                    <strong className="block text-base font-black text-emerald-800">
                                        {formatMoney(post.rentalPrice)}
                                        <span className="ml-0.5 text-[11px] font-semibold text-emerald-600">/tháng</span>
                                    </strong>
                                </div>
                            )}
                            {post.area && (
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 px-3.5 py-2.5 ring-1 ring-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                                    <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                            <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
                                        </svg>
                                        <span>Diện tích</span>
                                    </span>
                                    <strong className="block text-base font-black text-slate-950">{post.area} m²</strong>
                                </div>
                            )}
                            {/* Timestamps */}
                            <div className="flex flex-col gap-0.5 text-[11px] font-semibold text-slate-400">
                                {createdDate && <span>Tạo: {createdDate}</span>}
                                {updatedDate && <span>Cập nhật: {updatedDate}</span>}
                            </div>
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
                            <button
                                type="button"
                                onClick={() => onPay?.(post)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-md active:scale-95"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                </svg>
                                Thanh toán
                            </button>
                            <Link
                                to={ROUTES.EDIT_POST.replace(':id', post.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-100 hover:text-blue-700 active:scale-95"
                                title="Chỉnh sửa"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L19.862 7.487M16.862 4.487 6.348 14.998a2.25 2.25 0 0 0-.578.978l-1.226 3.272a.375.375 0 0 0 .464.464l3.272-1.226a2.25 2.25 0 0 0 .978-.578L19.862 7.487M16.862 4.487 19.862 7.487" />
                                </svg>
                            </Link>
                            <button
                                type="button"
                                onClick={() => onDelete?.(post)}
                                disabled={loading}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-red-100 bg-red-50 text-red-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Xóa tin nháp"
                            >
                                {loading ? (
                                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

const EmptyState = () => (
    <div className="group/empty relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-white p-10 text-center transition-all duration-300 hover:border-blue-300 hover:shadow-lg sm:flex-row sm:p-14 sm:text-left">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-50 opacity-50 blur-2xl transition-all duration-500 group-hover/empty:scale-125" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-gradient-to-tr from-white via-blue-50 to-white opacity-60 blur-2xl" />
        <div className="pointer-events-none mx-auto mb-5 flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-50 text-blue-700 shadow-md ring-1 ring-white/40 transition-transform duration-500 group-hover/empty:scale-110 group-hover/empty:rotate-3 sm:mx-0 sm:mb-0">
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        </div>
        <div className="relative flex flex-1 flex-col items-center sm:items-start">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Không có tin nháp nào</h2>
            <p className="mt-2 max-w-md text-sm font-semibold text-slate-500 sm:max-w-sm">
                Các tin bạn tạo nhưng chưa thanh toán sẽ xuất hiện ở đây.
            </p>
        </div>
    </div>
)

const ConfirmDeleteModal = ({ post, isSubmitting, onCancel, onConfirm }) => {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onCancel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isSubmitting, onCancel])

    if (!post) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:justify-center"
            onClick={() => !isSubmitting && onCancel()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-rose-600 p-5 text-white">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                    <div className="relative flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
                            <Icon name="trash" className="h-6 w-6" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">Xóa tin nháp?</h3>
                            <p className="mt-0.5 text-sm font-semibold text-red-100">Hành động này không thể hoàn tác.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 p-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="line-clamp-2 text-sm font-black text-slate-900">{post.title || 'Không có tiêu đề'}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            {post.district}, {post.province}
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                        Tin nháp sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?
                    </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-md shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                <span>Đang xóa...</span>
                            </>
                        ) : (
                            <>
                                <Icon name="trash" className="h-4 w-4" />
                                <span>Xóa tin nháp</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

const Toast = ({ toast }) => {
    if (!toast.message) return null
    const isSuccess = toast.type === 'success'
    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-3.5 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-4 ${isSuccess
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                : 'border-red-200 bg-red-50/95 text-red-700'
            }`}
            role="status"
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ${isSuccess
                ? 'bg-emerald-500 text-white ring-emerald-200'
                : 'bg-red-500 text-white ring-red-200'
            }`}>
                <Icon name={isSuccess ? 'check' : 'info'} className="h-4 w-4" />
            </span>
            <p className="flex-1 text-sm font-bold">{toast.message}</p>
        </div>
    )
}

const DraftsPage = () => {
    const { login } = useAuth()
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [membership, setMembership] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState('')
    const [deletingPostId, setDeletingPostId] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [payModal, setPayModal] = useState({ open: false, post: null })
    const [isPaying, setIsPaying] = useState(false)
    const [toast, setToast] = useState({ type: '', message: '' })

    const loadDrafts = useCallback(
        async () => {
            setIsLoading(true)
            setError('')
            try {
                const [postsResult, membershipResult] = await Promise.allSettled([
                    postApi.getMyPosts({ page: 0, size: 100 }),
                    membershipApi.getMyLevel(),
                ])

                const allPosts = postsResult.status === 'fulfilled' ? (postsResult.value.data?.posts || []) : []
                const draftPosts = allPosts.filter((p) => p.status === 'DRAFT')
                setPosts(draftPosts)

                if (membershipResult.status === 'fulfilled') {
                    setMembership(membershipResult.value.data ?? null)
                }
            } catch (e) {
                setError(getErrorMessage(e))
            } finally {
                setIsLoading(false)
            }
        },
        [navigate]
    )

    useEffect(() => {
        loadDrafts()
    }, [loadDrafts])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await authApi.refresh()
                if (!cancelled) login(res.data)
            } catch {
                if (!cancelled) navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.DRAFTS } })
                return
            } finally {
                if (!cancelled) setIsVerifying(false)
            }
        })()
        return () => { cancelled = true }
    }, [login, navigate])

    if (isVerifying) return null

    useEffect(() => {
        if (!toast.message) return
        const t = setTimeout(() => setToast({ type: '', message: '' }), 4000)
        return () => clearTimeout(t)
    }, [toast])

    const handleAskDelete = (post) => setConfirmDelete(post)

    const handleCancelDelete = () => {
        if (deletingPostId) return
        setConfirmDelete(null)
    }

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return
        const post = confirmDelete
        setDeletingPostId(post.id)
        try {
            await postApi.deletePost(post.id)
            setToast({ type: 'success', message: `Đã xóa tin nháp "${(post.title || '').slice(0, 40)}${(post.title?.length || 0) > 40 ? '…' : ''}".` })
            setConfirmDelete(null)
            await loadDrafts()
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.message || 'Không xóa được tin nháp.' })
        } finally {
            setDeletingPostId('')
        }
    }

    const handlePay = (post) => setPayModal({ open: true, post })

    const handleClosePayModal = () => {
        if (isPaying) return
        setPayModal({ open: false, post: null })
    }

    const handleConfirmPay = async ({ postId, durationDays }) => {
        setIsPaying(true)
        try {
            await paymentApi.payPost({ postId, durationDays })
            setToast({ type: 'success', message: 'Thanh toán thành công! Tin của bạn đang chờ duyệt.' })
            setPayModal({ open: false, post: null })
            await loadDrafts()
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.message || 'Không thanh toán được. Vui lòng thử lại.' })
        } finally {
            setIsPaying(false)
        }
    }

    return (
        <AccountLayout
            balance={balance}
            activeKey="drafts"
            title="Tin nháp đã lưu"
            subtitle={
                posts.length > 0
                    ? `Bạn có ${posts.length} tin nháp chưa thanh toán. Hoàn tất thanh toán để tin được đăng lên hệ thống.`
                    : 'Các tin bạn tạo nhưng chưa thanh toán sẽ xuất hiện ở đây.'
            }
            actions={null}
        >
            <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4 sm:top-24">
                <Toast toast={toast} />
            </div>

            {isLoading && <LoadingSkeleton />}

            {!isLoading && error && (
                <div className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm">
                    <div className="flex items-start gap-3 p-6">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm">
                            <Icon name="info" className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-black text-red-800">Không tải được tin nháp</h2>
                            <p className="mt-1 text-sm font-semibold">{error}</p>
                        </div>
                    </div>
                    <div className="border-t border-red-200 bg-white/50 px-6 pb-5">
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-red-700 active:scale-95"
                            type="button"
                            onClick={loadDrafts}
                        >
                            <Icon name="back" className="h-4 w-4" />
                            Thử lại
                        </button>
                    </div>
                </div>
            )}

            {!isLoading && !error && posts.length === 0 && <EmptyState />}

            {!isLoading && !error && posts.length > 0 && (
                <div className="flex flex-col gap-4">
                    {posts.map((post) => (
                        <DraftCard
                            key={post.id}
                            post={post}
                            loading={deletingPostId === post.id}
                            onDelete={handleAskDelete}
                            onPay={handlePay}
                        />
                    ))}
                </div>
            )}

            <PaymentDraftModal
                post={payModal.post}
                membership={membership}
                isSubmitting={isPaying}
                onClose={handleClosePayModal}
                onConfirm={handleConfirmPay}
            />

            <ConfirmDeleteModal
                post={confirmDelete}
                isSubmitting={Boolean(deletingPostId)}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </AccountLayout>
    )
}

export default DraftsPage
