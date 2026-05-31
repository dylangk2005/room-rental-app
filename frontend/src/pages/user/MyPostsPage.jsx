import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import PostCard from '../../components/PostCard'
import ROUTES from '../../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được danh sách bài đăng. Vui lòng thử lại.'

const LoadingGrid = () => (
    <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={index}>
                <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
                    <div className="min-h-56 animate-pulse bg-slate-200" />
                    <div className="space-y-4 p-5">
                        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="h-20 animate-pulse rounded-lg bg-slate-200" />
                            <div className="h-20 animate-pulse rounded-lg bg-slate-200" />
                            <div className="col-span-2 h-20 animate-pulse rounded-lg bg-slate-200 sm:col-span-1" />
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
)

const MyPostsPage = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(readStoredUser)
    const [balance, setBalance] = useState(0)
    const [posts, setPosts] = useState([])
    const [pageInfo, setPageInfo] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const loadPosts = useCallback(
        async (page = 0) => {
            setIsLoading(true)
            setError('')

            try {
                const refreshResponse = await authApi.refresh()
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(refreshResponse.data))
                setUser(refreshResponse.data)

                const [postsResult, balanceResult] = await Promise.allSettled([
                    postApi.getMyPosts({ page, size: 8 }),
                    walletApi.getBalance(),
                ])

                if (postsResult.status !== 'fulfilled') {
                    throw postsResult.reason
                }

                const data = postsResult.value.data || {}
                setPosts(data.posts || [])
                setPageInfo({
                    currentPage: data.currentPage || 0,
                    totalPages: data.totalPages || 0,
                    totalElements: data.totalElements || 0,
                })

                if (balanceResult.status === 'fulfilled') {
                    setBalance(balanceResult.value.data?.balance || 0)
                }
            } catch (loadError) {
                if (loadError.response?.status === 401) {
                    navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.MY_POSTS } })
                    return
                }

                setError(getErrorMessage(loadError))
            } finally {
                setIsLoading(false)
            }
        },
        [navigate]
    )

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadPosts(0)
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [loadPosts])

    const loadPage = (nextPage) => {
        if (nextPage < 0 || nextPage >= pageInfo.totalPages) return
        loadPosts(nextPage)
    }

    return (
        <AccountLayout
            user={user}
            onUserChange={setUser}
            balance={balance}
            activeKey="posts"
            title="Quản lý bài đăng"
            subtitle={`${pageInfo.totalElements} bài đăng của bạn trên hệ thống.`}
            actions={
                <Link
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                    to={ROUTES.CREATE_POST}
                >
                    Đăng tin mới
                </Link>
            }
        >
            {isLoading && <LoadingGrid />}

            {!isLoading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                    <h2 className="font-black">Không tải được bài đăng</h2>
                    <p className="mt-2 text-sm">{error}</p>
                    <button
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
                        type="button"
                        onClick={() => loadPosts(pageInfo.currentPage)}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!isLoading && !error && posts.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                    <h2 className="text-xl font-black text-slate-950">Bạn chưa có bài đăng nào</h2>
                    <p className="mt-2 text-slate-500">Tạo bài đăng đầu tiên để bắt đầu cho thuê phòng.</p>
                    <Link
                        className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                        to={ROUTES.CREATE_POST}
                    >
                        Đăng tin mới
                    </Link>
                </div>
            )}

            {!isLoading && !error && posts.length > 0 && (
                <div className="grid grid-cols-1 gap-5">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {!isLoading && !error && pageInfo.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                        className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        onClick={() => loadPage(pageInfo.currentPage - 1)}
                        disabled={pageInfo.currentPage <= 0}
                    >
                        Trước
                    </button>
                    <span className="text-sm font-bold text-slate-600">
                        Trang {pageInfo.currentPage + 1} / {pageInfo.totalPages}
                    </span>
                    <button
                        className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        onClick={() => loadPage(pageInfo.currentPage + 1)}
                        disabled={pageInfo.currentPage + 1 >= pageInfo.totalPages}
                    >
                        Sau
                    </button>
                </div>
            )}
        </AccountLayout>
    )
}

export default MyPostsPage
