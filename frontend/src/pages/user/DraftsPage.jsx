import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={i}>
                <div className="h-44 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-4">
                    <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                    <div className="flex gap-2 pt-1">
                        <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
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
        <article className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40">
            <div className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transition-transform duration-500 group-hover/card:scale-x-100" />

            <div className="relative overflow-hidden">
                <img
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    src={imageUrl}
                    alt={post.title || 'Hình ảnh tin nháp'}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/draft-${post.id}/640/420` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
                <div className="absolute left-2 top-2 z-20 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                    Bản nháp
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
                <div className="min-w-0">
                    <Link
                        to={ROUTES.EDIT_POST.replace(':id', post.id)}
                        className="group/title line-clamp-2 text-base font-black leading-6 text-slate-950 transition-colors duration-200 hover:text-blue-700"
                    >
                        {post.title || 'Không có tiêu đề'}
                        <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-current transition-all duration-300 group-hover/title:w-12" />
                    </Link>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    {post.rentalPrice && (
                        <span className="flex items-center gap-1 font-black text-emerald-700">
                            <Icon name="spark" className="h-3.5 w-3.5" />
                            {formatMoney(post.rentalPrice)}
                        </span>
                    )}
                    {post.area && (
                        <span className="flex items-center gap-1">
                            <Icon name="grid" className="h-3.5 w-3.5" />
                            {post.area} m²
                        </span>
                    )}
                    {post.district && (
                        <span className="flex items-center gap-1">
                            <Icon name="map" className="h-3.5 w-3.5" />
                            {post.district}
                        </span>
                    )}
                </div>

                {post.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 font-medium">
                        {post.description}
                    </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-semibold text-slate-400">
                        {updatedDate ? `Cập nhật: ${updatedDate}` : createdDate ? `Tạo: ${createdDate}` : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onPay?.(post)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-md active:scale-95"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Thanh toán
                        </button>
                        <MyPostCardActions
                            post={post}
                            loading={loading}
                            onDelete={onDelete}
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}

const EmptyState = () => (
    <div className="group/empty relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-white p-10 text-center transition-all duration-300 hover:border-blue-300 hover:shadow-lg sm:p-14">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-50 opacity-50 blur-2xl transition-all duration-500 group-hover/empty:scale-125" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-gradient-to-tr from-white via-blue-50 to-white opacity-60 blur-2xl" />
        <div className="relative">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-50 text-blue-700 shadow-md ring-1 ring-white/40 transition-transform duration-500 group-hover/empty:scale-110 group-hover/empty:rotate-3">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Không có tin nháp nào</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
                Các tin bạn tạo nhưng chưa thanh toán sẽ xuất hiện ở đây. Tạo tin mới hoặc tiếp tục chỉnh sửa các tin nháp có sẵn.
            </p>
            <Link
                className="group/cta mt-6 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-[1.04] hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-200 active:scale-95"
                to={ROUTES.CREATE_POST}
            >
                <span className="relative z-10 flex items-center gap-2">
                    <Icon name="plus" className="h-4 w-4" />
                    Tạo tin mới
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-blue-700 to-indigo-700 transition-transform duration-500 group-hover/cta:translate-x-0" />
            </Link>
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
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [membership, setMembership] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
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
                await authApi.refresh()
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
                if (e.response?.status === 401) {
                    navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.DRAFTS } })
                    return
                }
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
            actions={
                <Link
                    className="group/new relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-black text-white shadow-md shadow-blue-200 transition-all duration-300 hover:scale-[1.04] hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-200 active:scale-95"
                    to={ROUTES.CREATE_POST}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Icon name="plus" className="h-4 w-4" />
                        Tạo tin mới
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-blue-700 to-indigo-700 transition-transform duration-500 group-hover/new:translate-x-0" />
                </Link>
            }
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
