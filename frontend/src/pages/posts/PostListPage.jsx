import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import favoriteApi from '../../api/favoriteApi'
import postApi from '../../api/postApi'
import AppHeader from '../../components/AppHeader'
import PostListTabs from '../../components/posts/PostListTabs'
import { useAuth } from '../../contexts/AuthContext'
import ROUTES from '../../constants/routes'

const initialFilters = {
    provinceId: '',
    districtId: '',
    provinceName: '',
    districtName: '',
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
    { label: 'Dưới 20 m²', minArea: '', maxArea: '20' },
    { label: '20 - 35 m²', minArea: '20', maxArea: '35' },
    { label: '35 - 60 m²', minArea: '35', maxArea: '60' },
    { label: 'Trên 60 m²', minArea: '60', maxArea: '' },
]

const buildSearchParams = (filters = {}) => {
    const params = {
        page: filters.page ?? 0,
        size: filters.size ?? 9,
    }
    if (filters.provinceId) params.provinceId = filters.provinceId
    if (filters.districtId) params.districtId = filters.districtId
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice
    if (filters.minArea) params.minArea = filters.minArea
    if (filters.maxArea) params.maxArea = filters.maxArea
    return params
}

const formatPriceValue = (value) => {
    if (!value) return ''
    const num = Number(value)
    if (Number.isNaN(num)) return ''
    if (num >= 1_000_000) return `${num / 1_000_000}tr`
    if (num >= 1_000) return `${num / 1_000}k`
    return String(num)
}

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng kiểm tra backend và thử lại.'

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

const CloseIcon = () => (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
        <path
            d="M6 18 18 6M6 6l12 12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
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

const SpinnerIcon = () => (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const EmptyStateIllustration = () => (
    <svg aria-hidden="true" className="mx-auto h-24 w-24 text-slate-300" fill="none" viewBox="0 0 64 64">
        <rect x="8" y="14" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M8 24h48" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="34" r="3" fill="currentColor" />
        <path d="M28 38l8-6 8 6 6-4 8 6v12H8V38l6 4 6-4Z" fill="currentColor" opacity="0.3" />
    </svg>
)

const ErrorIllustration = () => (
    <svg aria-hidden="true" className="mx-auto h-24 w-24 text-red-300" fill="none" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5" />
        <path d="M32 18v16M32 40v.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
)

const LoadingGrid = () => (
    <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
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

const PostListPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [filters, setFilters] = useState(initialFilters)
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [posts, setPosts] = useState([])
    const [favoritedIds, setFavoritedIds] = useState(() => new Set())
    const [pageInfo, setPageInfo] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const [lastSearchParams, setLastSearchParams] = useState({})
    const [favoriteToast, setFavoriteToast] = useState(null)

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
        () => provinces.find((p) => String(p.id) === String(filters.provinceId)),
        [filters.provinceId, provinces]
    )
    const districtOptions = districts

    const loadPosts = async (params = { page: 0, size: 9 }, useSearch = false) => {
        await Promise.resolve()
        setIsLoading(true)
        setError('')

        try {
            const response = useSearch
                ? await postApi.searchPosts(buildSearchParams(params))
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
            setIsSearching(false)
        }
    }

    useEffect(() => {
        let ignore = false

        const loadLocations = async () => {
            try {
                const data = await postApi.getProvinces()
                if (!ignore) {
                    setProvinces(Array.isArray(data) ? data : (data?.data || []))
                }
            } catch {
                if (!ignore) {
                    setProvinces([])
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

        loadLocations()
        loadInitialPosts()

        return () => {
            ignore = true
        }
    }, [])

    useEffect(() => {
        let ignore = false
        const loadFavorites = async () => {
            if (!user) {
                setFavoritedIds(new Set())
                return
            }
            try {
                const response = await favoriteApi.getFavorites({ page: 0, size: 100 })
                if (ignore) return
                const list = response.data?.posts || response.data?.items || []
                const ids = new Set()
                list.forEach((post) => {
                    if (post?.id != null) ids.add(post.id)
                })
                setFavoritedIds(ids)
            } catch (loadError) {
                if (ignore) return
                setFavoritedIds(new Set())
            }
        }
        loadFavorites()
        return () => {
            ignore = true
        }
    }, [user])

    const openLoginPrompt = useCallback(() => {
        navigate(ROUTES.LOGIN, { state: { from: ROUTES.HOME } })
    }, [navigate])

    const showFavoriteToast = useCallback((message) => {
        setFavoriteToast({ message, key: Date.now() })
    }, [])

    useEffect(() => {
        if (!favoriteToast) return undefined
        const timer = window.setTimeout(() => {
            setFavoriteToast(null)
        }, 2400)
        return () => window.clearTimeout(timer)
    }, [favoriteToast])

    const handleToggleFavorite = useCallback(
        async (post, shouldFavorite) => {
            if (!user) {
                openLoginPrompt()
                return
            }
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
                    showFavoriteToast(`Đã thêm "${post.title || 'tin này'}" vào yêu thích`)
                } else {
                    await favoriteApi.removeFavorite(postId)
                    showFavoriteToast(`Đã bỏ yêu thích "${post.title || 'tin này'}"`)
                }
            } catch (toggleError) {
                setFavoritedIds((current) => {
                    const next = new Set(current)
                    if (wasFavorited) next.add(postId)
                    else next.delete(postId)
                    return next
                })
                const message =
                    toggleError.response?.data?.message || 'Không thể cập nhật yêu thích. Vui lòng thử lại.'
                showFavoriteToast(message)
            }
        },
        [favoritedIds, openLoginPrompt, showFavoriteToast, user]
    )

    const handleRequireAuth = useCallback(() => Boolean(user), [user])

    const handleProvinceChange = (event) => {
        const value = event.target.value
        const selected = provinces.find((p) => String(p.id) === value)
        setFilters((current) => ({
            ...current,
            provinceId: value,
            provinceName: selected ? selected.name : '',
            districtId: '',
            districtName: '',
        }))
        if (selected) {
            postApi.getDistrictsByProvince(selected.id)
                .then((data) => setDistricts(Array.isArray(data) ? data : (data?.data || [])))
                .catch(() => setDistricts([]))
        } else {
            setDistricts([])
        }
    }

    const handleDistrictChange = (event) => {
        const value = event.target.value
        const selected = districts.find((d) => String(d.id) === value)
        setFilters((current) => ({
            ...current,
            districtId: value,
            districtName: selected ? selected.name : '',
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
        setLastSearchParams(filters)
        setHasSearched(true)
        setIsSearching(true)
        loadPosts({ ...filters, page: 0, size: 9 }, true)
    }

    const handleReset = () => {
        setFilters(initialFilters)
        setHasSearched(false)
        setIsSearching(true)
        loadPosts({ page: 0, size: 9 }, false)
    }

    const clearFilter = (key) => {
        setFilters((current) => ({ ...current, [key]: '' }))
    }

    const clearAllFilters = () => {
        setFilters(initialFilters)
    }

    const loadPage = (nextPage) => {
        if (nextPage < 0 || nextPage >= pageInfo.totalPages) return
        const useSearch = hasSearched
        const baseParams = useSearch ? lastSearchParams : {}
        loadPosts({ ...baseParams, page: nextPage, size: 9 }, useSearch)
    }

    const activeFilterChips = useMemo(() => {
        const chips = []
        if (filters.provinceName) {
            chips.push({ key: 'province', label: filters.provinceName, value: filters.provinceName })
        }
        if (filters.districtName) {
            chips.push({ key: 'district', label: filters.districtName, value: filters.districtName })
        }
        if (filters.minPrice || filters.maxPrice) {
            const min = formatPriceValue(filters.minPrice)
            const max = formatPriceValue(filters.maxPrice)
            let label = ''
            if (min && max) label = `${min} - ${max} đ`
            else if (min) label = `Từ ${min} đ`
            else label = `Dưới ${max} đ`
            chips.push({ key: 'price', label, value: 'price' })
        }
        if (filters.minArea || filters.maxArea) {
            const min = filters.minArea
            const max = filters.maxArea
            let label = ''
            if (min && max) label = `${min} - ${max} m²`
            else if (min) label = `Từ ${min} m²`
            else label = `Dưới ${max} m²`
            chips.push({ key: 'area', label, value: 'area' })
        }
        return chips
    }, [filters])

    const removeChip = (chip) => {
        if (chip.key === 'price') {
            setFilters((current) => ({ ...current, minPrice: '', maxPrice: '' }))
        } else if (chip.key === 'area') {
            setFilters((current) => ({ ...current, minArea: '', maxArea: '' }))
        } else if (chip.key === 'district') {
            setFilters((current) => ({ ...current, districtId: '', districtName: '' }))
        } else if (chip.key === 'province') {
            setFilters((current) => ({
                ...current,
                provinceId: '',
                districtId: '',
                provinceName: '',
                districtName: '',
            }))
            setDistricts([])
        } else {
            setFilters((current) => ({
                ...current,
                provinceId: '',
                districtId: '',
                provinceName: '',
                districtName: '',
            }))
        }
    }

    const pageNumbers = useMemo(() => {
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
    }, [pageInfo.currentPage, pageInfo.totalPages])

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-950">
            <AppHeader />

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="search">
                <form
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5"
                    onSubmit={handleSearch}
                >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
                        <div>
                            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Tỉnh thành
                            </span>
                            <div className="relative">
                                <select
                                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-800 outline-none transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    value={filters.provinceId}
                                    onChange={handleProvinceChange}
                                >
                                    <option value="">Tất cả tỉnh thành</option>
                                    {provinces.map((p) => (
                                        <option key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
                                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Quận huyện
                            </span>
                            <div className="relative">
                                <select
                                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-800 outline-none transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    value={filters.districtId}
                                    onChange={handleDistrictChange}
                                    disabled={!filters.provinceId}
                                >
                                    <option value="">{filters.provinceId ? 'Tất cả quận huyện' : 'Chọn tỉnh thành trước'}</option>
                                    {districtOptions.map((district) => (
                                        <option key={district.id} value={String(district.id)}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                                <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
                                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Khoảng giá
                            </span>
                            <div className="relative">
                                <select
                                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-800 outline-none transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    onChange={handlePriceRangeChange}
                                    value={selectedPriceRange}
                                >
                                    {priceRanges.map((range, index) => (
                                        <option key={range.label} value={index}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                                <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
                                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Diện tích
                            </span>
                            <div className="relative">
                                <select
                                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-800 outline-none transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    onChange={handleAreaRangeChange}
                                    value={selectedAreaRange}
                                >
                                    {areaRanges.map((range, index) => (
                                        <option key={range.label} value={index}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                                <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
                                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                className="group inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                                type="submit"
                                disabled={isSearching}
                            >
                                {isSearching ? (
                                    <>
                                        <SpinnerIcon />
                                        <span>Đang tìm</span>
                                    </>
                                ) : (
                                    <>
                                        <SearchIcon />
                                        <span>Tìm kiếm</span>
                                    </>
                                )}
                            </button>
                            <button
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition-all duration-200 hover:scale-[1.03] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                                type="button"
                                onClick={handleReset}
                                title="Xóa bộ lọc"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {activeFilterChips.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Đang lọc:
                            </span>
                            {activeFilterChips.map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => removeChip(chip)}
                                    className="group/chip inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition-all duration-150 hover:scale-[1.04] hover:bg-emerald-100 hover:ring-emerald-300 active:scale-95"
                                >
                                    <span>{chip.label}</span>
                                    <span className="rounded-full bg-emerald-200/60 p-0.5 transition-colors group-hover/chip:bg-emerald-300/70">
                                        <CloseIcon />
                                    </span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="text-xs font-bold text-slate-500 underline-offset-2 transition-colors duration-150 hover:text-red-600 hover:underline"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-8">
                    <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
                        Tìm phòng phù hợp với bạn
                    </h2>
                </div>

                <div className="mt-6">
                    {isLoading && <LoadingGrid />}

                    {!isLoading && error && (
                        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 text-center">
                            <ErrorIllustration />
                            <h3 className="mt-4 text-lg font-black text-red-900">Không tải được danh sách phòng</h3>
                            <p className="mt-2 text-sm text-red-700">{error}</p>
                            <button
                                className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-red-700 hover:shadow-md active:scale-95"
                                type="button"
                                onClick={() => loadPosts({ ...(hasSearched ? lastSearchParams : {}), page: pageInfo.currentPage, size: 9 }, hasSearched)}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Thử lại</span>
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && posts.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <EmptyStateIllustration />
                            <h3 className="mt-4 text-lg font-black text-slate-950">Chưa có phòng phù hợp</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Thử nới rộng khu vực, giá hoặc diện tích để xem thêm tin.
                            </p>
                            {hasSearched && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-5 text-sm font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-slate-800 active:scale-95"
                                >
                                    <span>Xóa bộ lọc</span>
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoading && !error && posts.length > 0 && (
                        <PostListTabs
                            posts={posts}
                            isAuthenticated={Boolean(user)}
                            favoritedIds={favoritedIds}
                            onToggleFavorite={handleToggleFavorite}
                            onRequireAuth={handleRequireAuth}
                            onOpenLogin={openLoginPrompt}
                        />
                    )}

                    {favoriteToast ? (
                        <div
                            key={favoriteToast.key}
                            className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
                        >
                            <div className="pointer-events-auto inline-flex max-w-md items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2 text-sm font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
                                <svg
                                    aria-hidden="true"
                                    className="h-4 w-4 text-rose-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                                <span className="line-clamp-1">{favoriteToast.message}</span>
                            </div>
                        </div>
                    ) : null}
                </div>

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
            </section>
        </main>
    )
}

export default PostListPage
