import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import AppHeader from '../../components/AppHeader'
import PostCard from '../../components/PostCard'
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

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng kiểm tra backend và thử lại.'

const LoadingGrid = () => (
    <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={index}>
                <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="min-h-64 animate-pulse bg-slate-200 md:min-h-72" />
                    <div className="space-y-4 p-4 sm:p-5">
                        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="h-20 animate-pulse rounded-lg bg-slate-200" />
                            <div className="h-20 animate-pulse rounded-lg bg-slate-200" />
                            <div className="col-span-2 h-20 animate-pulse rounded-lg bg-slate-200 sm:col-span-1" />
                        </div>
                        <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200 sm:w-36" />
                    </div>
                </div>
            </div>
        ))}
    </div>
)

const PostListPage = ({ user, onUserChange }) => {
    const [filters, setFilters] = useState(initialFilters)
    const [locations, setLocations] = useState([])
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
    const selectedProvince = useMemo(
        () => locations.find((location) => location.province === filters.province),
        [filters.province, locations]
    )
    const districtOptions = selectedProvince?.districts || []

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
                onUserChange?.(response.data)
            } catch {
                if (ignore) return
                localStorage.removeItem(USER_STORAGE_KEY)
                onUserChange?.(null)
            }
        }

        const loadLocations = async () => {
            try {
                const response = await postApi.getLocations()
                if (!ignore) {
                    setLocations(response.data || [])
                }
            } catch {
                if (!ignore) {
                    setLocations([])
                }
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
        loadLocations()
        loadInitialPosts()

        return () => {
            ignore = true
        }
    }, [])

    const handleProvinceChange = (event) => {
        const province = event.target.value
        setFilters((current) => ({
            ...current,
            province,
            district: '',
        }))
    }

    const handleDistrictChange = (event) => {
        setFilters((current) => ({
            ...current,
            district: event.target.value,
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

    const loadPage = (nextPage) => {
        if (nextPage < 0 || nextPage >= pageInfo.totalPages) return
        loadPosts({ ...(hasSearched ? filters : {}), page: nextPage, size: 9 }, hasSearched)
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <AppHeader user={user} onUserChange={onUserChange} />

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8 lg:py-14">
                    <div>
                        <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
                            Phòng trọ rõ thông tin, xem ảnh nhanh
                        </p>
                        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                            Tìm phòng phù hợp ngân sách và khu vực của bạn.
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                            TAYTRO ưu tiên tin đăng đang hoạt động, hiển thị giá, diện tích, khu vực và ảnh phòng rõ ràng
                            để người thuê ra quyết định nhanh hơn.
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

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 lg:self-end">
                        <img
                            className="h-64 w-full object-cover sm:h-80 lg:h-72"
                            src="https://picsum.photos/seed/taytro-home/1000/520"
                            alt="Phòng trọ sạch sáng"
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="search">
                <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Tỉnh thành</span>
                            <select
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                value={filters.province}
                                onChange={handleProvinceChange}
                            >
                                <option value="">Tất cả tỉnh thành</option>
                                {locations.map((location) => (
                                    <option key={location.province} value={location.province}>
                                        {location.province}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span className="mb-2 block text-sm font-black text-slate-800">Quận huyện</span>
                            <select
                                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                value={filters.district}
                                onChange={handleDistrictChange}
                                disabled={!filters.province}
                            >
                                <option value="">{filters.province ? 'Tất cả quận huyện' : 'Chọn tỉnh thành trước'}</option>
                                {districtOptions.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
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
                                : 'Tin nổi bật hiển thị nhiều ảnh hơn để bạn xem phòng nhanh hơn'}
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
                        <div className="grid grid-cols-1 gap-5">
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
