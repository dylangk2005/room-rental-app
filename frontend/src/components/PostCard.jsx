import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/postFormatters'
import {
    getPostTypeTitleColor,
    getPostTypeCategory,
    isVipCategory,
    getPostTypeMaxImageLimit,
    shouldShowRecommendTag,
    shouldUppercaseTitle,
    getRecommendTagGradient,
} from '../utils/postTypeStyles'

const normalizeText = (value = '') =>
    value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

const postStatusMeta = {
    ACTIVE: {
        label: 'Đang hoạt động',
        className: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    },
    EXPIRED: {
        label: 'Đã hết hạn',
        className: 'bg-slate-200 text-slate-700 ring-slate-300',
    },
    PENDING: {
        label: 'Chờ duyệt',
        className: 'bg-amber-100 text-amber-800 ring-amber-200',
    },
    DRAFT: {
        label: 'Bản nháp',
        className: 'bg-blue-100 text-blue-700 ring-blue-200',
    },
    REJECTED: {
        label: 'Bị từ chối',
        className: 'bg-red-100 text-red-700 ring-red-200',
    },
    HIDDEN: {
        label: 'Đã ẩn',
        className: 'bg-purple-100 text-purple-800 ring-purple-200',
    },
    DELETED: {
        label: 'Đã xóa',
        className: 'bg-zinc-200 text-zinc-700 ring-zinc-300',
    },
}

const getPostStatusMeta = (status) =>
    postStatusMeta[String(status || '').toUpperCase()] || {
        label: 'Đang cập nhật',
        className: 'bg-slate-100 text-slate-700 ring-slate-200',
    }

const getDaysUntilExpiry = (endAt) => {
    if (!endAt) return null
    const target = new Date(endAt)
    if (Number.isNaN(target.getTime())) return null
    const diff = target.getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const PriceIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const AreaIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const CalendarIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const MapPinIcon = () => (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
        <path
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const ArrowRightIcon = () => (
    <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24">
        <path
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
        />
    </svg>
)

const HeartIcon = ({ filled }) => (
    <svg aria-hidden="true" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24">
        <path
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const FavoriteButton = ({ isFavorited, onToggle }) => {
    const [isPopping, setIsPopping] = useState(false)

    const handleClick = async (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsPopping(true)
        window.setTimeout(() => setIsPopping(false), 320)
        try {
            await onToggle?.()
        } catch (error) {
            console.error('Favorite toggle failed:', error)
        }
    }

    return (
        <button
            type="button"
            aria-label={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
            aria-pressed={isFavorited}
            onClick={handleClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-slate-200 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 ${
                isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
            } ${isPopping ? 'animate-[heart-pop_320ms_ease-out]' : ''}`}
        >
            <HeartIcon filled={isFavorited} />
        </button>
    )
}

const ExpiryBadge = ({ endAt }) => {
    const days = getDaysUntilExpiry(endAt)
    if (days === null) return null
    if (days < 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700 ring-1 ring-slate-300">
                Đã hết hạn
            </span>
        )
    }
    if (days <= 7) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-black text-red-700 ring-1 ring-red-200">
                Còn {days} ngày
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">
            Còn {days} ngày
        </span>
    )
}

const RecommendSparkleIcon = ({ className = 'h-3 w-3' }) => (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2 14 8.5 21 10.5 15.5 14 17 21 12 17 7 21 8.5 14 3 10.5 10 8.5 12 2Z" />
    </svg>
)

const RecommendTag = ({ gradient = 'bg-gradient-to-r from-red-500 via-orange-500 to-pink-500' }) => (
    <div className={`pointer-events-none absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full ${gradient} px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md ring-1 ring-white/30 backdrop-blur-sm`}>
        <RecommendSparkleIcon />
        <span>Đề xuất</span>
    </div>
)

const PostImageGallery = ({ post }) => {
    const limit = getPostTypeMaxImageLimit(post)
    const fallbackUrl = `https://picsum.photos/seed/taytro-${post.id}/900/650`
    const sourceImages = Array.isArray(post.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls
        : [post.thumbnailUrl].filter(Boolean)
    const previewImages = (sourceImages.length > 0 ? sourceImages : [fallbackUrl]).slice(0, limit)
    const showImageCount = previewImages.length > 1

    const renderImage = (src, index, className = '') => (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`} key={`${src}-${index}`}>
            <img
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                src={src}
                alt={`${post.title} - ảnh ${index + 1}`}
                loading="lazy"
            />
        </div>
    )

    const imageCountBadge = showImageCount && (
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-950/85 px-2.5 py-1 text-xs font-black text-white shadow-md ring-1 ring-white/20 backdrop-blur-sm">
            <span className="mr-1">📷</span>
            {previewImages.length}
        </span>
    )

    const gradientOverlay = (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    )

    if (previewImages.length === 1) {
        return (
            <Link to={`/posts/${post.id}`} className="relative block h-full min-h-56 overflow-hidden bg-slate-100">
                {renderImage(previewImages[0], 0, 'h-full min-h-56')}
                {gradientOverlay}
            </Link>
        )
    }

    if (previewImages.length === 2) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-64 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1"
            >
                {previewImages.map((imageUrl, index) => renderImage(imageUrl, index, 'min-h-64'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    if (previewImages.length === 3) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1"
            >
                {renderImage(previewImages[0], 0, 'col-span-2 min-h-40 md:col-span-1 md:row-span-2 md:min-h-0')}
                {previewImages.slice(1).map((imageUrl, index) => renderImage(imageUrl, index + 1, 'min-h-28'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    if (previewImages.length === 4) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1"
            >
                {previewImages.map((imageUrl, index) => renderImage(imageUrl, index, 'min-h-36 md:min-h-0'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    return (
        <Link
            to={`/posts/${post.id}`}
            className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2"
        >
            {renderImage(previewImages[0], 0, 'col-span-2 min-h-44 md:col-span-1 md:row-span-2 md:min-h-0')}
            {previewImages.slice(1).map((imageUrl, index) =>
                renderImage(imageUrl, index + 1, 'min-h-24 md:min-h-0')
            )}
            {imageCountBadge}
            {gradientOverlay}
        </Link>
    )
}

const PostCard = ({ post, index = 0, isFavorited = false, onToggleFavorite, onRequireAuth }) => {
    const statusMeta = getPostStatusMeta(post.status)
    const category = getPostTypeCategory(post.postTypeName, post.postTypePriority)
    const isVip = isVipCategory(category)
    const titleColor = getPostTypeTitleColor(post.postTypeName, post.postTypeTitleColor)

    const handleFavoriteClick = async () => {
        if (typeof onRequireAuth === 'function' && !onRequireAuth()) return
        if (typeof onToggleFavorite !== 'function') return
        await onToggleFavorite(post, !isFavorited)
    }

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDelay: `${Math.min(index, 6) * 60}ms`, animationDuration: '400ms' }}
        >
            <div className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 transition-transform duration-500 group-hover:scale-x-100" />

            <div className="absolute right-3 top-3 z-30">
                {onToggleFavorite ? (
                    <FavoriteButton
                        isFavorited={isFavorited}
                        onToggle={handleFavoriteClick}
                    />
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="relative overflow-hidden">
                    <PostImageGallery post={post} />
                    {shouldShowRecommendTag(post) ? <RecommendTag gradient={getRecommendTagGradient(post)} /> : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link
                            to={`/posts/${post.id}`}
                            className="group/title relative min-w-0 flex-1"
                        >
                            <h3
                                className={`line-clamp-2 font-black leading-7 transition-colors duration-200 ${
                                    shouldUppercaseTitle(post) ? 'uppercase tracking-wide' : ''
                                }`}
                                style={{
                                    color: titleColor,
                                    fontSize: post.postTypeTitleSize
                                        ? `${post.postTypeTitleSize}px`
                                        : undefined,
                                }}
                            >
                                {post.title}
                                <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-current transition-all duration-300 group-hover/title:w-12" />
                            </h3>
                        </Link>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                            <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusMeta.className}`}
                            >
                                {statusMeta.label}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-2.5 ring-1 ring-emerald-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                <PriceIcon />
                                <span>Giá thuê</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-emerald-800">
                                {formatCurrency(post.rentalPrice)}
                            </strong>
                        </div>
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 p-2.5 ring-1 ring-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                <AreaIcon />
                                <span>Diện tích</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-slate-950">
                                {post.area} m²
                            </strong>
                        </div>
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 ring-1 ring-slate-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <CalendarIcon />
                                <span>Hết hạn</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-slate-950">
                                {formatDate(post.endAt)}
                            </strong>
                        </div>
                    </div>

                    {post.description ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 font-medium">{post.description}</p>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-1.5 text-xs text-slate-600">
                            <span className="mt-0.5 shrink-0 text-emerald-600">
                                <MapPinIcon />
                            </span>
                            <span className="line-clamp-2 font-semibold">
                                {post.districtName || post.district}, {post.provinceName || post.province}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <ExpiryBadge endAt={post.endAt} />
                            <Link
                                className="group/btn relative inline-flex h-9 w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-emerald-600 px-3.5 text-xs font-black text-white transition-all duration-200 hover:scale-[1.04] hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200 active:scale-95 sm:w-auto"
                                to={`/posts/${post.id}`}
                            >
                                <span className="relative z-10">Xem chi tiết</span>
                                <ArrowRightIcon />
                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-700 to-teal-600 transition-transform duration-300 group-hover/btn:translate-x-0" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default PostCard
