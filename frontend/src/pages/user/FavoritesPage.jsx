import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import favoriteApi from '../../api/favoriteApi'
import AccountLayout from '../../components/AccountLayout'
import PostCardNormal from '../../components/posts/PostCardNormal'
import ROUTES from '../../constants/routes'

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được danh sách yêu thích. Vui lòng thử lại.'

const SpinnerIcon = () => (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const HeartEmptyIcon = () => (
    <svg aria-hidden="true" className="h-16 w-16 text-rose-200" fill="none" viewBox="0 0 24 24">
        <path
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
        />
    </svg>
)

const SearchIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
        />
    </svg>
)

const RefreshIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ArrowLeftIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
)

const ArrowRightSmallIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
)

const LoadingGrid = () => (
    <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={index}>
                <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="min-h-64 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
                    <div className="space-y-3 p-4 sm:p-5">
                        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="grid grid-cols-3 gap-2">
                            <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
                            <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
                            <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                        <div className="h-9 w-full animate-pulse rounded-lg bg-slate-200 sm:w-40" />
                    </div>
                </div>
            </div>
        ))}
    </div>
)

const FavoritesPage = () => {
    const { user, login } = useAuth()
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [favoritedIds, setFavoritedIds] = useState(new Set())
    const [pageInfo, setPageInfo] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState('')
    const [unfavoriteToast, setUnfavoriteToast] = useState(null)

    const loadFavorites = useCallback(
        async (page = 0) => {
            setIsLoading(true)
            setError('')
            try {
                const response = await favoriteApi.getFavorites({ page, size: 9 })
                const data = response.data || {}
                const list = data.posts || []
                setPosts(list)
                setPageInfo({
                    currentPage: data.currentPage || 0,
                    totalPages: data.totalPages || 0,
                    totalElements: data.totalElements || 0,
                })
                const ids = new Set()
                list.forEach((post) => {
                    if (post?.id != null) ids.add(post.id)
                })
                setFavoritedIds(ids)
            } catch (loadError) {
                setError(getErrorMessage(loadError))
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        const timer = window.setTimeout(() => { loadFavorites(0) }, 0)
        return () => { window.clearTimeout(timer) }
    }, [loadFavorites])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setIsVerifying(true)
            try {
                const res = await authApi.refresh()
                if (!cancelled) login(res.data)
            } catch {
                if (!cancelled) navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.FAVORITES } })
                return
            } finally {
                if (!cancelled) setIsVerifying(false)
            }
        })()
        return () => { cancelled = true }
    }, [login, navigate])

    useEffect(() => {
        if (!unfavoriteToast) return undefined
        const timer = window.setTimeout(() => {
            setUnfavoriteToast(null)
        }, 2400)
        return () => window.clearTimeout(timer)
    }, [unfavoriteToast])

    const handleToggleFavorite = useCallback(
        async (post, shouldFavorite) => {
            if (!post?.id) return
            const postId = post.id
            const wasFavorited = favoritedIds.has(postId)
            if (shouldFavorite === wasFavorited) return

            setFavoritedIds((current) => {
                const next = new Set(current)
                if (shouldFavorite) next.add(postId)
                else next.delete(postId)
                return next
            })

            try {
                if (shouldFavorite) {
                    await favoriteApi.addFavorite(postId)
                } else {
                    await favoriteApi.removeFavorite(postId)
                    setPosts((current) => current.filter((p) => p.id !== postId))
                    setUnfavoriteToast({ message: `Đã bỏ yêu thích "${post.title || 'tin này'}"`, key: Date.now() })
                }
            } catch (toggleError) {
                setFavoritedIds((current) => {
                    const next = new Set(current)
                    if (wasFavorited) next.add(postId)
                    else next.delete(postId)
                    return next
                })
                const message =
                    toggleError.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.'
                setUnfavoriteToast({ message, key: Date.now() })
            }
        },
        [favoritedIds]
    )

    if (isVerifying) return null

    const loadPage = (nextPage) => {
        if (nextPage < 0 || nextPage >= pageInfo.totalPages) return
        loadFavorites(nextPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const pageNumbers = (() => {
        const total = pageInfo.totalPages
        const current = pageInfo.currentPage
        if (total <= 7) return Array.from({ length: total }, (_, i) => i)
        const pages = new Set([0, total - 1, current, current - 1, current + 1])
        const list = Array.from(pages).filter((p) => p >= 0 && p < total).sort((a, b) => a - b)
        const result = []
        for (let i = 0; i < list.length; i += 1) {
            result.push(list[i])
            if (i < list.length - 1 && list[i + 1] - list[i] > 1) {
                result.push('...')
            }
        }
        return result
    })()

    return (
        <AccountLayout
            balance={balance}
            activeKey="favorites"
            title="Tin yêu thích"
            subtitle={`${pageInfo.totalElements} tin đã lưu để bạn xem lại khi cần.`}
            actions={
                <Link
                    className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-95"
                    to={ROUTES.HOME}
                >
                    <SearchIcon />
                    <span>Tìm thêm phòng</span>
                </Link>
            }
        >
            {isLoading && <LoadingGrid />}

            {!isLoading && error && (
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <svg aria-hidden="true" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24">
                            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-red-900">Không tải được danh sách yêu thích</h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                    <button
                        className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-red-700 hover:shadow-md active:scale-95"
                        type="button"
                        onClick={() => loadFavorites(pageInfo.currentPage)}
                    >
                        <RefreshIcon />
                        <span>Thử lại</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && posts.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                        <HeartEmptyIcon />
                    </div>
                    <h3 className="text-xl font-black text-slate-950">Bạn chưa lưu tin nào</h3>
                    <p className="mt-3 max-w-sm mx-auto text-sm text-slate-500 leading-relaxed">
                        Nhấn biểu tượng trái tim trên các tin đăng để lưu lại những phòng bạn quan tâm.
                    </p>
                    <Link
                        className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-95"
                        to={ROUTES.HOME}
                    >
                        <SearchIcon />
                        <span>Tìm phòng ngay</span>
                    </Link>
                </div>
            )}

            {!isLoading && !error && posts.length > 0 && (
                <div className="flex flex-col gap-5">
                    {posts.map((post, index) => (
                        <PostCardNormal
                            key={post.id}
                            post={post}
                            index={index}
                            isFavorited={favoritedIds.has(post.id)}
                            onToggleFavorite={handleToggleFavorite}
                            onRequireAuth={() => true}
                        />
                    ))}
                </div>
            )}

            {!isLoading && !error && pageInfo.totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    <button
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition-all duration-200 hover:scale-[1.04] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                        type="button"
                        onClick={() => loadPage(pageInfo.currentPage - 1)}
                        disabled={pageInfo.currentPage <= 0}
                    >
                        <ArrowLeftIcon />
                        <span>Trước</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {pageNumbers.map((page, index) =>
                            page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-2 text-sm font-bold text-slate-400">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => loadPage(page)}
                                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-black transition-all duration-200 hover:scale-[1.06] active:scale-95 ${
                                        page === pageInfo.currentPage
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/60'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    {page + 1}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition-all duration-200 hover:scale-[1.04] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                        type="button"
                        onClick={() => loadPage(pageInfo.currentPage + 1)}
                        disabled={pageInfo.currentPage + 1 >= pageInfo.totalPages}
                    >
                        <span>Sau</span>
                        <ArrowRightSmallIcon />
                    </button>
                </div>
            )}

            {unfavoriteToast ? (
                <div
                    key={unfavoriteToast.key}
                    className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
                >
                    <div className="pointer-events-auto inline-flex max-w-md items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2.5 text-sm font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4 text-rose-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span className="line-clamp-1">{unfavoriteToast.message}</span>
                    </div>
                </div>
            ) : null}
        </AccountLayout>
    )
}

export default FavoritesPage
