import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import AccountLayout from '../../components/AccountLayout'
import SafeImage from '../../components/common/SafeImage'
import ROUTES from '../../constants/routes'
import { formatCurrency } from '../../utils/postFormatters'
import {
    getPostTypeColorLabel,
    getPostTypeTitleColor,
    getPostTypeCategory,
    getPostTypeMaxImageLimit,
    shouldShowRecommendTag,
    shouldUppercaseTitle,
    getRecommendTagGradient,
} from '../../utils/postTypeStyles'

const VAT_PERCENT = 8
const PRICE_DURATIONS = [5, 10, 15, 30]

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatPostTypeName = (name = '') =>
    name
        .replace(/vip/gi, 'VIP')
        .replace(/nổi bật/gi, 'Nổi Bật')
        .replace(/thường/gi, 'thường')

const getDisplayPrice = (value, includeVat) => {
    const amount = Number(value || 0)
    return includeVat ? Math.round(amount * (1 + VAT_PERCENT / 100)) : amount
}

const getPriceByDuration = (postType, duration) =>
    postType?.prices?.find((price) => Number(price.days) === Number(duration))?.price || 0

const getPlanTone = (index) =>
    [
        'bg-red-600 text-white',
        'bg-pink-600 text-white',
        'bg-green-600 text-white',
        'bg-slate-900 text-white',
        'bg-blue-600 text-white',
    ][index] || 'bg-emerald-700 text-white'

const getSizeLabel = (size) => {
    const numericSize = Number(size || 0)
    if (numericSize >= 18) return 'Rất lớn'
    if (numericSize >= 16) return 'Lớn'
    if (numericSize >= 15) return 'Trung bình'
    return 'Nhỏ'
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ArrowRightIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const PriceIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
)

const AreaIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
)

const MapPinIcon = () => (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
)

const RecommendSparkleIcon = ({ className = 'h-3 w-3' }) => (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2 14 8.5 21 10.5 15.5 14 17 21 12 17 7 21 8.5 14 3 10.5 10 8.5 12 2Z" />
    </svg>
)

const RecommendTag = ({ gradient = 'bg-gradient-to-r from-red-500 via-orange-500 to-pink-500' }) => (
    <div className={`pointer-events-none absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md ring-1 ring-white/30 backdrop-blur-sm ${gradient}`}>
        <RecommendSparkleIcon />
        <span>Đề xuất</span>
    </div>
)

const TrendUpIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

// ─── Preview Image Gallery ──────────────────────────────────────────────────────

const PreviewImageGallery = ({ images, maxImages, title }) => {
    const limit = Math.min(images.length, maxImages || 1)
    const previewImages = images.slice(0, limit)

    const renderImage = (src, index, className = '') => (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`} key={`${src}-${index}`}>
            <SafeImage
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                src={src}
                fallbackSrc={`https://picsum.photos/seed/preview-img-${index}/900/650`}
                alt={`${title} - ảnh ${index + 1}`}
                loading="lazy"
            />
        </div>
    )

    const gradientOverlay = (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    )

    const Wrapper = ({ children }) => (
        <div className="relative block h-full overflow-hidden bg-slate-100">
            {children}
            {gradientOverlay}
        </div>
    )

    if (previewImages.length === 1) {
        return (
            <Wrapper>
                {renderImage(previewImages[0], 0, 'h-full min-h-56')}
            </Wrapper>
        )
    }

    if (previewImages.length === 2) {
        return (
            <Wrapper>
                <div className="grid h-full min-h-64 grid-cols-2 gap-1 p-1">
                    {previewImages.map((src, index) => renderImage(src, index, 'min-h-64'))}
                </div>
            </Wrapper>
        )
    }

    if (previewImages.length === 3) {
        return (
            <Wrapper>
                <div className="grid h-full min-h-72 grid-cols-2 gap-1 p-1">
                    {renderImage(previewImages[0], 0, 'col-span-2 min-h-40 md:col-span-1 md:row-span-2 md:min-h-0')}
                    {previewImages.slice(1).map((src, index) => renderImage(src, index + 1, 'min-h-28'))}
                </div>
            </Wrapper>
        )
    }

    if (previewImages.length === 4) {
        return (
            <Wrapper>
                <div className="grid h-full min-h-72 grid-cols-2 gap-1 p-1">
                    {previewImages.map((src, index) => renderImage(src, index, 'min-h-36 md:min-h-0'))}
                </div>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
            <div className="grid h-full min-h-72 grid-cols-2 gap-1 p-1 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
                {renderImage(previewImages[0], 0, 'col-span-2 min-h-44 md:col-span-1 md:row-span-2 md:min-h-0')}
                {previewImages.slice(1).map((src, index) => renderImage(src, index + 1, 'min-h-24 md:min-h-0'))}
            </div>
        </Wrapper>
    )
}

// ─── Preview Card ───────────────────────────────────────────────────────────────

const PREVIEW_IMAGES = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=450&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=450&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=450&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=450&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=450&h=300&fit=crop',
]

const PREVIEW_TITLE = 'Căn hộ mini full nội thất Q.7, sầm uất, dễ di chuyển'

const PreviewCard = ({ postType, titleColor, titleSize, isUppercase, hasRecommend, maxImages }) => {
    const gradient = `linear-gradient(90deg, ${titleColor}, ${titleColor}aa, ${titleColor})`

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDelay: '0ms', animationDuration: '400ms' }}
        >
            {/* Top gradient bar — animated on hover */}
            <div
                className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                style={{ background: gradient }}
            />

            {/* Horizontal layout: image left + content right */}
            <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
                {/* Image gallery */}
                <div className="relative overflow-hidden">
                    <PreviewImageGallery images={PREVIEW_IMAGES} maxImages={maxImages} title={PREVIEW_TITLE} />
                    {hasRecommend && <RecommendTag gradient={getRecommendTagGradient({ postTypeName: postType?.name, postTypePriority: postType?.priority })} />}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-4 sm:p-5">
                    {/* Title */}
                    <div className="group/title relative min-w-0 flex-1">
                        <h3
                            className={`line-clamp-2 font-black leading-7 transition-colors duration-200 ${
                                isUppercase ? 'uppercase tracking-wide' : ''
                            }`}
                            style={{ color: titleColor, fontSize: `${titleSize}px` }}
                        >
                            {PREVIEW_TITLE}
                            <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-current transition-all duration-300 group-hover/title:w-12" />
                        </h3>
                    </div>

                    {/* 2-column meta: Giá / Diện tích */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-2.5 ring-1 ring-emerald-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                <PriceIcon />
                                <span>Giá thuê</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-emerald-800">4.500.000</strong>
                        </div>
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 p-2.5 ring-1 ring-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                <AreaIcon />
                                <span>Diện tích</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-slate-950">28 m²</strong>
                        </div>
                    </div>

                    {/* Description preview */}
                    <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">
                        Phòng trọ mới xây, gần trường học, chợ, bệnh viện. An ninh tốt, camera 24/7, có máy giặt, điều hòa, nóng lạnh.
                    </p>

                    {/* Footer: location + owner avatar + CTA */}
                    <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-1.5 text-xs text-slate-600">
                            <span className="mt-0.5 shrink-0 text-emerald-600">
                                <MapPinIcon />
                            </span>
                            <span className="line-clamp-2 font-semibold">Quận 7, Hồ Chí Minh</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Owner avatar */}
                            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-black text-white ring-1 ring-emerald-200">
                                    LĐ
                                </span>
                                <span className="hidden truncate text-xs font-semibold text-slate-700 sm:inline max-w-[120px]">
                                    Lan Đặng
                                </span>
                            </div>
                            {/* CTA Button */}
                            <button
                                type="button"
                                className="group/btn relative inline-flex h-9 w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-emerald-600 px-3.5 text-xs font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200 active:scale-95 sm:w-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="relative z-10">Xem chi tiết</span>
                                <ArrowRightIcon />
                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-700 to-teal-600 transition-transform duration-300 group-hover/btn:translate-x-0" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

// ─── Loading State ────────────────────────────────────────────────────────────

const LoadingState = () => (
    <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={index} />
            ))}
        </div>
        <div className="h-[520px] animate-pulse rounded-lg bg-slate-200" />
    </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const PostPricingPage = () => {
    const { user, login } = useAuth()
    const [postTypes, setPostTypes] = useState([])
    const [includeVat, setIncludeVat] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const sortedPostTypes = useMemo(
        () =>
            [...postTypes]
                .sort((first, second) => Number(first.priority || 0) - Number(second.priority || 0))
                .filter((item, index, arr) => arr.findIndex((t) => t.name === item.name) === index),
        [postTypes]
    )

    const loadPricing = async () => {
        setIsLoading(true)
        setError('')

        try {
            const [userResult, postTypesResult] = await Promise.allSettled([authApi.refresh(), postApi.getPostTypes()])

            if (userResult.status === 'fulfilled') {
                login(userResult.value.data)
            }

            if (postTypesResult.status !== 'fulfilled') {
                throw postTypesResult.reason
            }

            setPostTypes(postTypesResult.value.data || [])
        } catch {
            setError('Không tải được bảng giá tin đăng. Vui lòng thử lại.')
            setPostTypes([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadPricing()
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [])

    return (
        <AccountLayout
            activeKey="pricing"
            title="Bảng giá gói tin"
            subtitle="So sánh giá đăng tin, giá đẩy tin, màu tiêu đề và kích thước hiển thị trước khi thanh toán bằng ví."
            actions={
                <div className="flex flex-wrap gap-3">
                    <Link
                        className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                        to={ROUTES.CREATE_POST}
                    >
                        Đăng tin ngay
                    </Link>
                    <Link
                        className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition-all duration-200 hover:scale-105 hover:bg-slate-100 active:scale-95"
                        to={ROUTES.USER_DEPOSIT}
                    >
                        Nạp tiền vào ví
                    </Link>
                </div>
            }
        >
            <div className="space-y-6">
                {/* VAT toggle */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 sm:flex-row sm:items-center sm:justify-between hover:shadow-md">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Bảng giá chi tiết</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {includeVat ? `Giá đang bao gồm VAT ${VAT_PERCENT}%` : 'Giá chưa bao gồm VAT'}
                        </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-black text-slate-700">
                        <span className="text-slate-500">Chưa VAT</span>
                        <span className="relative h-8 w-14 shrink-0">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                checked={includeVat}
                                onChange={(event) => setIncludeVat(event.target.checked)}
                            />
                            <span className={`absolute inset-0 block rounded-full transition-all duration-300 ${includeVat ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                            <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${includeVat ? 'translate-x-6' : 'translate-x-0'}`} />
                        </span>
                        <span className="text-emerald-600">Có VAT</span>
                    </label>
                </div>

                {/* Pricing table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-[900px] w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                <th className="w-48 border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-black text-slate-700">
                                    Hạng mục
                                </th>
                                {sortedPostTypes.map((postType, index) => (
                                    <th className={`border-b border-r border-slate-200 px-4 py-4 text-center ${getPlanTone(index)}`} key={postType.id}>
                                        <span className="block text-base font-black">{formatPostTypeName(postType.name)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PRICE_DURATIONS.map((duration) => (
                                <tr key={duration} className="transition-colors duration-150 hover:bg-slate-50">
                                    <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                        Giá {duration} ngày
                                    </th>
                                    {sortedPostTypes.map((postType) => (
                                        <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-${duration}`}>
                                            {formatMoney(getDisplayPrice(getPriceByDuration(postType, duration), includeVat))}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    Giá đẩy tin
                                </th>
                                {sortedPostTypes.map((postType) => (
                                    <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-push`}>
                                        {formatMoney(getDisplayPrice(postType.pushPrice, includeVat))}
                                    </td>
                                ))}
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    Màu sắc tiêu đề
                                </th>
                                {sortedPostTypes.map((postType) => {
                                    const titleColor = getPostTypeTitleColor(postType.name, postType.titleColor) || '#0f172a'
                                    return (
                                        <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-color`}>
                                            <span className="inline-flex items-center gap-2" style={{ color: titleColor }}>
                                                <span className="h-4 w-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: titleColor }} />
                                                {getPostTypeColorLabel(postType.name, postType.titleColor)}
                                            </span>
                                        </td>
                                    )
                                })}
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    Kích thước tiêu đề
                                </th>
                                {sortedPostTypes.map((postType) => (
                                    <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-semibold" key={`${postType.id}-size`}>
                                        {getSizeLabel(postType.titleSize)} ({postType.titleSize}px)
                                    </td>
                                ))}
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    In hoa tiêu đề
                                </th>
                                {sortedPostTypes.map((postType) => {
                                    const isUp = shouldUppercaseTitle({ postTypeName: postType.name, postTypePriority: postType.priority, postTypeIsUppercase: postType.isUppercase })
                                    return (
                                        <td className="border-b border-r border-slate-200 px-4 py-4 text-center" key={`${postType.id}-upper`}>
                                            {isUp ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                                    Có
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">Không</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    Tag đề xuất
                                </th>
                                {sortedPostTypes.map((postType) => {
                                    const hasTag = shouldShowRecommendTag({ postTypeName: postType.name, postTypePriority: postType.priority, postTypeHasRecommendTag: postType.hasRecommendTag })
                                    return (
                                        <td className="border-b border-r border-slate-200 px-4 py-4 text-center" key={`${postType.id}-rec`}>
                                            {hasTag ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2.5 py-1 text-xs font-black text-white">
                                                    <RecommendSparkleIcon className="h-3 w-3" />
                                                    Có
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">Không</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-slate-50">
                                <th className="border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                    Vị trí hiển thị
                                </th>
                                {sortedPostTypes.map((postType) => {
                                    const priority = Number(postType.priority || 0)
                                    return (
                                        <td className="border-r border-slate-200 px-4 py-4 text-center" key={`${postType.id}-pos`}>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                                                <TrendUpIcon />
                                                #{priority}
                                            </span>
                                        </td>
                                    )
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* All previews comparison */}
                <div>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-7 w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
                        <div>
                            <h2 className="text-lg font-black text-slate-900">So sánh trực quan các loại tin</h2>
                            <p className="text-sm text-slate-500">Xem trước giao diện thẻ tin đăng của từng loại tin trên trang danh sách</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {sortedPostTypes.map((postType) => {
                            const titleColor = postType.titleColor || getPostTypeTitleColor(postType.name) || '#111827'
                            const titleSize = postType.titleSize || 15
                            const isUppercase = postType.isUppercase ?? shouldUppercaseTitle({ postTypeName: postType.name, postTypePriority: postType.priority })
                            const hasRecommend = postType.hasRecommendTag ?? shouldShowRecommendTag({ postTypeName: postType.name, postTypePriority: postType.priority })
                            const maxImages = postType.maxImageLimit || getPostTypeMaxImageLimit({ postTypeName: postType.name, postTypePriority: postType.priority })
                            const displayName = formatPostTypeName(postType.name)
                            const category = getPostTypeCategory(postType.name, postType.priority)
                            const gradients = {
                                HOT_VIP: 'from-red-500 to-pink-500',
                                VIP1: 'from-violet-500 to-purple-500',
                                VIP2: 'from-blue-500 to-indigo-500',
                                NORMAL: 'from-emerald-500 to-teal-500',
                            }
                            const gradient = gradients[category] || gradients.NORMAL

                            return (
                                <div key={postType.id} className="group">
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${gradient} px-3 py-1.5 text-sm font-black text-white shadow`}>
                                            {displayName}
                                        </div>
                                        <div className="flex flex-1 items-center gap-2">
                                            <div className={`h-px flex-1 bg-gradient-to-r ${gradient} opacity-20`} />
                                            <span className="text-xs font-semibold text-slate-400">
                                                {formatMoney(getDisplayPrice(getPriceByDuration(postType, 30), includeVat))}/30 ngày
                                            </span>
                                            <div className={`h-px flex-1 bg-gradient-to-l ${gradient} opacity-20`} />
                                        </div>
                                    </div>
                                    <PreviewCard
                                        postType={postType}
                                        titleColor={titleColor}
                                        titleSize={titleSize}
                                        isUppercase={isUppercase}
                                        hasRecommend={hasRecommend}
                                        maxImages={maxImages}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </AccountLayout>
    )
}

export default PostPricingPage
