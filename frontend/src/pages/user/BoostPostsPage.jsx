import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authApi from '../../api/authApi'
import membershipApi from '../../api/membershipApi'
import paymentApi from '../../api/paymentApi'
import postApi from '../../api/postApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const VAT_PERCENT = 8

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatDateTime = (value) => {
    if (!value) return 'Chưa đẩy lần nào'
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
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

    return {
        base,
        discount,
        subtotal,
        tax,
        finalFee: subtotal + tax,
    }
}

const getPostImage = (post) =>
    post.thumbnailUrl || post.imageUrls?.[0] || `https://picsum.photos/seed/taytro-boost-${post.id}/640/420`

const LoadingState = () => (
    <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg bg-slate-200" />
        {Array.from({ length: 3 }).map((_, index) => (
            <div className="h-52 animate-pulse rounded-lg bg-slate-200" key={index} />
        ))}
    </div>
)

const BoostConfirmModal = ({ post, balance, membership, isSubmitting, onClose, onConfirm }) => {
    if (!post) return null

    const cost = calculateBoostCost(post.postTypePushPrice, membership?.discountPercent)
    const hasEnoughBalance = Number(balance || 0) >= cost.finalFee

    return (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-950/50 p-4 sm:items-center sm:justify-center">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">Xác nhận đẩy tin</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Tin sẽ được cập nhật thời gian đẩy mới và có cơ hội lên cao hơn trong danh sách tìm kiếm.
                        </p>
                    </div>
                    <button
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xl font-black text-slate-500 hover:bg-slate-100"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="line-clamp-2 font-black text-slate-950">{post.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{post.postTypeName || 'Tin thường'}</p>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-500">Phí đẩy tin</span>
                        <strong>{formatMoney(cost.base)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-500">Ưu đãi thành viên</span>
                        <strong className="text-emerald-700">-{formatMoney(cost.discount)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-500">VAT {VAT_PERCENT}%</span>
                        <strong>{formatMoney(cost.tax)}</strong>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-black text-slate-950">Tổng thanh toán dự kiến</span>
                            <strong className="text-xl text-emerald-700">{formatMoney(cost.finalFee)}</strong>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-500">Số dư ví</span>
                        <strong className={hasEnoughBalance ? 'text-slate-950' : 'text-red-600'}>{formatMoney(balance)}</strong>
                    </div>
                </div>

                {!hasEnoughBalance && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        Số dư ví không đủ để đẩy tin này.
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Để sau
                    </button>
                    {hasEnoughBalance ? (
                        <button
                            className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            type="button"
                            onClick={onConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang thanh toán...' : 'Thanh toán và đẩy tin'}
                        </button>
                    ) : (
                        <Link
                            className="flex h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
                            to={ROUTES.USER_DEPOSIT}
                        >
                            Nạp tiền vào ví
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

const BoostPostsPage = () => {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const [balance, setBalance] = useState(0)
    const [membership, setMembership] = useState(null)
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPost, setSelectedPost] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

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

            const [postsResult, balanceResult, membershipResult] = await Promise.allSettled([
                postApi.getMyPosts({ page: 0, size: 50 }),
                walletApi.getBalance(),
                membershipApi.getMyLevel(),
            ])

            if (postsResult.status !== 'fulfilled') {
                throw postsResult.reason
            }

            setPosts(postsResult.value.data?.posts || [])
            setBalance(balanceResult.status === 'fulfilled' ? balanceResult.value.data?.balance || 0 : 0)
            setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value.data : null)
        } catch (loadError) {
            if (loadError.response?.status === 401) {
                navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.BOOST_POSTS } })
                return
            }

            setError(getErrorMessage(loadError, 'Không tải được danh sách tin có thể đẩy. Vui lòng thử lại.'))
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadPage()
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [loadPage])

    const handleConfirmBoost = async () => {
        if (!selectedPost) return

        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            await paymentApi.boostPost({ postId: selectedPost.id })
            setSuccess(`Đẩy tin "${selectedPost.title}" thành công.`)
            setSelectedPost(null)
            await loadPage()
        } catch (boostError) {
            setError(getErrorMessage(boostError, 'Không đẩy được tin. Vui lòng kiểm tra trạng thái tin và số dư ví.'))
            setSelectedPost(null)
            await loadPage()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AccountLayout
            balance={balance}
            activeKey="boost"
            title="Đẩy tin đăng"
            subtitle="Cập nhật thời gian đẩy để tin đang hoạt động có cơ hội xuất hiện cao hơn trong danh sách tìm kiếm."
            actions={
                <Link
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-100"
                    to={ROUTES.MY_POSTS}
                >
                    Quản lý bài đăng
                </Link>
            }
        >
            {isLoading && <LoadingState />}

            {!isLoading && (
                <div className="space-y-5">
                    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                        <h2 className="text-lg font-black text-slate-950">Đẩy tin hoạt động như thế nào?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            Mỗi lần đẩy tin sẽ trừ phí từ ví và cập nhật thời gian đẩy mới. Tin cùng nhóm ưu tiên sẽ được sắp xếp theo thời gian đẩy mới nhất.
                        </p>
                    </section>

                    {success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                            {error.toLowerCase().includes('số dư') && (
                                <Link className="ml-2 underline" to={ROUTES.USER_DEPOSIT}>
                                    Nạp tiền
                                </Link>
                            )}
                        </div>
                    )}

                    {activePosts.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                            <h2 className="text-xl font-black text-slate-950">Chưa có tin đang hoạt động để đẩy</h2>
                            <p className="mt-2 text-slate-500">
                                Tin cần được duyệt và đang hoạt động thì mới có thể đẩy lên danh sách tìm kiếm.
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-3">
                                <Link
                                    className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                                    to={ROUTES.MY_POSTS}
                                >
                                    Xem bài đăng của tôi
                                </Link>
                                <Link
                                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-100"
                                    to={ROUTES.CREATE_POST}
                                >
                                    Đăng tin mới
                                </Link>
                            </div>
                        </div>
                    )}

                    {activePosts.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            {activePosts.map((post) => {
                                const cost = calculateBoostCost(post.postTypePushPrice, membership?.discountPercent)
                                const hasEnoughBalance = Number(balance || 0) >= cost.finalFee

                                return (
                                    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={post.id}>
                                        <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
                                            <Link className="block min-h-48 bg-slate-100" to={`/posts/${post.id}`}>
                                                <img className="h-full min-h-48 w-full object-cover" src={getPostImage(post)} alt={post.title} />
                                            </Link>
                                            <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3
                                                            className="line-clamp-2 text-lg font-black leading-7 text-slate-950"
                                                            style={{
                                                                color: post.postTypeTitleColor || undefined,
                                                                fontSize: post.postTypeTitleSize
                                                                    ? `${Math.min(post.postTypeTitleSize + 2, 22)}px`
                                                                    : undefined,
                                                            }}
                                                        >
                                                            {post.title}
                                                        </h3>
                                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                                            {post.district}, {post.province}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                                        {post.postTypeName || 'Tin thường'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                                    <div className="rounded-lg bg-slate-50 p-3">
                                                        <span className="block text-xs font-bold uppercase text-slate-500">Hết hạn</span>
                                                        <strong className="mt-1 block text-sm text-slate-950">{formatDateTime(post.endAt)}</strong>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 p-3">
                                                        <span className="block text-xs font-bold uppercase text-slate-500">Lần đẩy gần nhất</span>
                                                        <strong className="mt-1 block text-sm text-slate-950">{formatDateTime(post.pushTime)}</strong>
                                                    </div>
                                                    <div className="rounded-lg bg-emerald-50 p-3">
                                                        <span className="block text-xs font-bold uppercase text-emerald-700">Phí đẩy</span>
                                                        <strong className="mt-1 block text-sm text-emerald-800">{formatMoney(cost.base)}</strong>
                                                    </div>
                                                    <div className="rounded-lg bg-amber-50 p-3">
                                                        <span className="block text-xs font-bold uppercase text-amber-700">Tạm tính</span>
                                                        <strong className="mt-1 block text-sm text-amber-800">{formatMoney(cost.finalFee)}</strong>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-sm font-semibold text-slate-500">
                                                        Đã gồm VAT {VAT_PERCENT}%{membership?.discountPercent ? `, giảm ${membership.discountPercent}% hạng thành viên` : ''}.
                                                    </p>
                                                    {hasEnoughBalance ? (
                                                        <button
                                                            className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                                                            type="button"
                                                            onClick={() => setSelectedPost(post)}
                                                        >
                                                            Đẩy tin
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            className="flex h-11 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700"
                                                            to={ROUTES.USER_DEPOSIT}
                                                        >
                                                            Nạp tiền để đẩy
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <BoostConfirmModal
                post={selectedPost}
                balance={balance}
                membership={membership}
                isSubmitting={isSubmitting}
                onClose={() => setSelectedPost(null)}
                onConfirm={handleConfirmBoost}
            />
        </AccountLayout>
    )
}

export default BoostPostsPage
