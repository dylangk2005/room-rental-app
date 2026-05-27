import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import ROUTES from '../../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'

const initialFilters = {
    province: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
}

const priceRanges = [
    { label: 'Tất cả mức giá', minPrice: '', maxPrice: '' },
    { label: 'Dưới 2 triệu', minPrice: '', maxPrice: '2000000' },
    { label: '2 - 4 triệu', minPrice: '2000000', maxPrice: '4000000' },
    { label: '4 - 7 triệu', minPrice: '4000000', maxPrice: '7000000' },
    { label: 'Trên 7 triệu', minPrice: '7000000', maxPrice: '' },
]

const areaRanges = [
    { label: 'Tất cả diện tích', minArea: '', maxArea: '' },
    { label: 'Dưới 20 m2', minArea: '', maxArea: '20' },
    { label: '20 - 35 m2', minArea: '20', maxArea: '35' },
    { label: '35 - 60 m2', minArea: '35', maxArea: '60' },
    { label: 'Trên 60 m2', minArea: '60', maxArea: '' },
]

const formatCurrency = (value) => {
    const number = Number(value || 0)
    if (number >= 1000000) {
        return `${(number / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/tháng`
    }
    return `${number.toLocaleString('vi-VN')} đ/tháng`
}

const formatDate = (value) => {
    if (!value) return 'Đang cập nhật'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng kiểm tra backend và thử lại.'

const PostCard = ({ post }) => (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <Link to={`/posts/${post.id}`} className="block">
            <div className="aspect-[4/3] bg-slate-100">
                <img
                    className="h-full w-full object-cover"
                    src={post.thumbnailUrl || `https://picsum.photos/seed/taytro-${post.id}/900/650`}
                    alt={post.title}
                    loading="lazy"
                />
            </div>
        </Link>
        <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
                <Link to={`/posts/${post.id}`} className="min-w-0">
                    <h3
                        className="line-clamp-2 text-base font-black leading-6 hover:text-emerald-700"
                        style={{
                            color: post.postTypeTitleColor || undefined,
                            fontSize: post.postTypeTitleSize ? `${Math.min(post.postTypeTitleSize + 2, 20)}px` : undefined,
                        }}
                    >
                        {post.title}
                    </h3>
                </Link>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                    {post.postTypeName || 'Tin thường'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span className="block text-slate-500">Giá thuê</span>
                    <strong className="text-base text-emerald-700">{formatCurrency(post.rentalPrice)}</strong>
                </div>
                <div>
                    <span className="block text-slate-500">Diện tích</span>
                    <strong className="text-base text-slate-950">{post.area} m2</strong>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
                <p className="line-clamp-1 font-semibold text-slate-800">
                    {post.district}, {post.province}
                </p>
                <p>Hết hạn: {formatDate(post.endAt)}</p>
            </div>

            <Link
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-600 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                to={`/posts/${post.id}`}
            >
                Xem chi tiết
            </Link>
        </div>
    </article>
)

const LoadingGrid = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={index}>
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                <div className="space-y-4 p-4">
                    <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 animate-pulse rounded bg-slate-200" />
                </div>
            </div>
        ))}
    </div>
)

const PostListPage = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(readStoredUser)
    const [filters, setFilters] = useState(initialFilters)
    const [posts, setPosts] = useState([])
    const [pageInfo, setPageInfo] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter((value) => value !== '').length,
        [filters]
    )
    const selectedPriceRange = useMemo(
        () =>
            Math.max(
                0,
                priceRanges.findIndex(
                    (range) => range.minPrice === filters.minPrice && range.maxPrice === filters.maxPrice
                )
            ),
        [filters.maxPrice, filters.minPrice]
    )
    const selectedAreaRange = useMemo(
        () =>
            Math.max(
                0,
                areaRanges.findIndex((range) => range.minArea === filters.minArea && range.maxArea === filters.maxArea)
            ),
        [filters.maxArea, filters.minArea]
    )

    const loadPosts = async (params = { page: 0, size: 9 }, useSearch = false) => {
        await Promise.resolve()
        setIsLoading(true)
        setError('')

        try {
            const response = useSearch
                ? await postApi.searchPosts({ ...params, size: 9 })
                : await postApi.getPosts({ ...params, size: 9 })
            const data = response.data || {}

            setPosts(data.posts || [])
            setPageInfo({
                currentPage: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0,
            })
        } catch (loadError) {
            setError(getErrorMessage(loadError))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        let ignore = false

        const refreshUser = async () => {
            try {
                const response = await authApi.refresh()
                if (ignore) return
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data))
                setUser(response.data)
            } catch {
                if (ignore) return
                localStorage.removeItem(USER_STORAGE_KEY)
                setUser(null)
            }
        }

        const loadInitialPosts = async () => {
            try {
                const response = await postApi.getPosts({ page: 0, size: 9 })
                if (ignore) return
                const data = response.data || {}

                setPosts(data.posts || [])
                setPageInfo({
                    currentPage: data.currentPage || 0,
                    totalPages: data.totalPages || 0,
                    totalElements: data.totalElements || 0,
                })
            } catch (loadError) {
                if (ignore) return
                setError(getErrorMessage(loadError))
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        refreshUser()
        loadInitialPosts()

        return () => {
            ignore = true
        }
    }, [])

    const handleFilterChange = (event) => {
        const { name, value } = event.target
        setFilters((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handlePriceRangeChange = (event) => {
        const range = priceRanges[Number(event.target.value)]
        setFilters((current) => ({
            ...current,
            minPrice: range.minPrice,
            maxPrice: range.maxPrice,
        }))
    }

    const handleAreaRangeChange = (event) => {
        const range = areaRanges[Number(event.target.value)]
        setFilters((current) => ({
            ...current,
            minArea: range.minArea,
            maxArea: range.maxArea,
        }))
    }

    const handleSearch = (event) => {
        event.preventDefault()
        setHasSearched(true)
        loadPosts({ ...filters, page: 0, size: 9 }, true)
    }

    const handleReset = () => {
        setFilters(initialFilters)
        setHasSearched(false)
        loadPosts({ page: 0, size: 9 }, false)
    }

    const handleLogout = async () => {
        try {
            await authApi.logout()
        } finally {
            localStorage.removeItem(USER_STORAGE_KEY)
            setUser(null)
            navigate(ROUTES.HOME)
        }
    }

    const loadPage = (nextPage) => {
        if (nextPage < 0 || nextPage >= pageInfo.totalPages) return
        loadPosts({ ...(hasSearched ? filters : {}), page: nextPage, size: 9 }, hasSearched)
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link to={ROUTES.HOME} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white">
                            T
                        </span>
                        <span className="text-xl font-black text-slate-950">TAYTRO</span>
                    </Link>

                    <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
                        <a href="#search" className="hover:text-emerald-700">
                            Tìm phòng
                        </a>
                        <Link to={ROUTES.POSTS} className="hover:text-emerald-700">
                            Tin đăng
                        </Link>
                        <Link to={ROUTES.CREATE_POST} className="hover:text-emerald-700">
                            Đăng tin
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">
                        {user ? (
                            <>
                                <Link
                                    className="hidden max-w-40 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800 sm:block"
                                    to={ROUTES.PROFILE}
                                    title={user.fullName}
                                >
                                    {user.fullName}
                                </Link>
                                <button
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                                    type="button"
                                    onClick={handleLogout}
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <Link
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                                to={ROUTES.LOGIN}
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
                    <div>
                        <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
                            Phòng trọ rõ thông tin, tìm kiếm nhanh
                        </p>
                        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                            Tìm phòng phù hợp ngân sách và khu vực của bạn.
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                            TAYTRO ưu tiên tin đăng đang hoạt động, hiển thị giá, diện tích và khu vực để người thuê
                            ra quyết định nhanh hơn.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                                href="#search"
                            >
                                Tìm phòng ngay
                            </a>
                            <Link
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-800 hover:bg-slate-100"
                                to={ROUTES.CREATE_POST}
                            >
                                Đăng tin cho thuê
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                            <strong className="block text-3xl text-slate-950">{pageInfo.totalElements || posts.length}</strong>
                            <span className="text-sm font-semibold text-slate-500">Tin đăng phù hợp</span>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                            <strong className="block text-3xl text-slate-950">3</strong>
                            <span className="text-sm font-semibold text-slate-500">Gói ưu tiên</span>
                        </div>
                        <div className="col-span-2 overflow-hidden rounded-lg border border-slate-200">
                            <img
                                className="h-56 w-full object-cover"
                                src="https://picsum.photos/seed/taytro-home/1000/520"
                                alt="Phòng trọ sạch sáng"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="search">
                <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Tỉnh thành</span>
                            <input
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                name="province"
                                value={filters.province}
                                onChange={handleFilterChange}
                                placeholder="VD: TP. Ho Chi Minh"
                            />
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Quận huyện</span>
                            <input
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                name="district"
                                value={filters.district}
                                onChange={handleFilterChange}
                                placeholder="VD: Binh Thanh"
                            />
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Khoảng giá</span>
                            <select
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                onChange={handlePriceRangeChange}
                                value={selectedPriceRange}
                            >
                                {priceRanges.map((range, index) => (
                                    <option key={range.label} value={index}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Diện tích</span>
                            <select
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                onChange={handleAreaRangeChange}
                                value={selectedAreaRange}
                            >
                                {areaRanges.map((range, index) => (
                                    <option key={range.label} value={index}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-end gap-2">
                            <button
                                className="h-11 flex-1 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
                                type="submit"
                            >
                                Tìm kiếm
                            </button>
                            <button
                                className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                                type="button"
                                onClick={handleReset}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-950">Phòng trọ đang hiển thị</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {hasSearched
                                ? `${pageInfo.totalElements} kết quả tìm kiếm, ${activeFilterCount} bộ lọc đang áp dụng`
                                : 'Danh sách tin đang hoạt động mới nhất từ backend'}
                        </p>
                    </div>
                    {error && (
                        <button
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                            type="button"
                            onClick={() => loadPosts({ ...(hasSearched ? filters : {}), page: pageInfo.currentPage, size: 9 }, hasSearched)}
                        >
                            Thử lại
                        </button>
                    )}
                </div>

                <div className="mt-5">
                    {isLoading && <LoadingGrid />}

                    {!isLoading && error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                            <h3 className="font-black">Không tải được danh sách phòng</h3>
                            <p className="mt-2 text-sm">{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && posts.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                            <h3 className="text-xl font-black text-slate-950">Chưa có phòng phù hợp</h3>
                            <p className="mt-2 text-slate-500">Thử nới rộng khu vực, giá hoặc diện tích để xem thêm tin.</p>
                        </div>
                    )}

                    {!isLoading && !error && posts.length > 0 && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>

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
            </section>
        </main>
    )
}

export default PostListPage
