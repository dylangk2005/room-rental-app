import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/postFormatters'
import {
    getPostTypeTitleColor,
    getPostTypeCategory,
    isVipCategory,
    getPostTypeMaxImageLimit,
    shouldShowRecommendTag,
    shouldUppercaseTitle,
    getRecommendTagGradient,
} from '../../utils/postTypeStyles'

const MapPinIcon = ({ className = 'h-3.5 w-3.5' }) => (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
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

const AreaIcon = ({ className = 'h-4 w-4' }) => (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const PriceIcon = ({ className = 'h-4 w-4' }) => (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
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

const getOwnerInitials = (name) => {
    if (!name) return 'U'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const OwnerAvatar = ({ name, avatarUrl }) => {
    const initials = getOwnerInitials(name)
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name || 'Người đăng'}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                loading="lazy"
            />
        )
    }
    return (
        <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-black text-white ring-1 ring-emerald-200"
            aria-hidden="true"
        >
            {initials}
        </span>
    )
}

const renderImageTile = (src, index, className = '') => (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`} key={`${src}-${index}`}>
        <img
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            src={src}
            alt={`ảnh ${index + 1}`}
            loading="lazy"
        />
    </div>
)

const PostImageGallery = ({ post }) => {
    const fallbackUrl = `https://picsum.photos/seed/taytro-${post.id}/900/650`
    const sourceImages =
        Array.isArray(post.imageUrls) && post.imageUrls.length > 0
            ? post.imageUrls
            : [post.thumbnailUrl].filter(Boolean)
    const images = (sourceImages.length > 0 ? sourceImages : [fallbackUrl]).slice(0, getPostTypeMaxImageLimit(post))
    const showImageCount = images.length > 1

    const imageCountBadge = showImageCount ? (
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-950/85 px-2.5 py-1 text-xs font-black text-white shadow-md ring-1 ring-white/20 backdrop-blur-sm">
            <span className="mr-1">📷</span>
            {images.length}
        </span>
    ) : null

    const gradientOverlay = (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    )

    if (images.length === 1) {
        return (
            <Link to={`/posts/${post.id}`} className="relative block h-full min-h-56 overflow-hidden bg-slate-100">
                {renderImageTile(images[0], 0, 'h-full min-h-56')}
                {gradientOverlay}
            </Link>
        )
    }

    if (images.length === 2) {
        return (
            <Link to={`/posts/${post.id}`} className="relative grid h-full min-h-64 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1">
                {images.map((src, index) => renderImageTile(src, index, 'min-h-64'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    if (images.length === 3) {
        return (
            <Link to={`/posts/${post.id}`} className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1">
                {renderImageTile(images[0], 0, 'col-span-2 min-h-40 md:col-span-1 md:row-span-2 md:min-h-0')}
                {images.slice(1).map((src, index) => renderImageTile(src, index + 1, 'min-h-28'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    if (images.length === 4) {
        return (
            <Link to={`/posts/${post.id}`} className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1">
                {images.map((src, index) => renderImageTile(src, index, 'min-h-36 md:min-h-0'))}
                {imageCountBadge}
                {gradientOverlay}
            </Link>
        )
    }

    return (
        <Link to={`/posts/${post.id}`} className="relative grid h-full min-h-72 grid-cols-2 gap-1 overflow-hidden bg-slate-100 p-1 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
            {renderImageTile(images[0], 0, 'col-span-2 min-h-44 md:col-span-1 md:row-span-2 md:min-h-0')}
            {images.slice(1).map((src, index) => renderImageTile(src, index + 1, 'min-h-24 md:min-h-0'))}
            {imageCountBadge}
            {gradientOverlay}
        </Link>
    )
}

const PostCardNormal = ({ post, index = 0, isFavorited = false, onToggleFavorite, onRequireAuth }) => {
    const category = getPostTypeCategory(post.postTypeName, post.postTypePriority)
    const isVip = isVipCategory(category)
    const titleColor = post.postTypeTitleColor || getPostTypeTitleColor(post.postTypeName)

    const handleFavoriteClick = async () => {
        if (typeof onRequireAuth === 'function' && !onRequireAuth()) return
        if (typeof onToggleFavorite !== 'function') return
        await onToggleFavorite(post, !isFavorited)
    }

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{
                animationDelay: `${Math.min(index, 8) * 50}ms`,
                animationDuration: '380ms',
            }}
        >
            <div
                className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                style={{ background: `linear-gradient(90deg, ${titleColor}, ${titleColor}aa, ${titleColor})` }}
            />

            <div className="absolute right-3 top-3 z-30">
                <FavoriteButton isFavorited={isFavorited} onToggle={handleFavoriteClick} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="relative overflow-hidden">
                    <PostImageGallery post={post} />
                    {shouldShowRecommendTag(post) ? <RecommendTag gradient={getRecommendTagGradient(post)} /> : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-4 sm:p-5">
                    <Link to={`/posts/${post.id}`} className="group/title relative block min-w-0">
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

                    <div className="grid grid-cols-2 gap-2">
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-2.5 ring-1 ring-emerald-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                <PriceIcon className="h-3.5 w-3.5" />
                                <span>Giá thuê</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-emerald-800">
                                {formatCurrency(post.rentalPrice)}
                            </strong>
                        </div>
                        <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 p-2.5 ring-1 ring-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm">
                            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                <AreaIcon className="h-3.5 w-3.5" />
                                <span>Diện tích</span>
                            </span>
                            <strong className="block truncate text-sm font-black text-slate-950">
                                {post.area} m²
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
                            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
                                <OwnerAvatar name={post.ownerName} avatarUrl={post.ownerAvatar} />
                                <span className="hidden truncate text-xs font-semibold text-slate-700 sm:inline max-w-[120px]">
                                    {post.ownerName || 'Người đăng'}
                                </span>
                            </div>
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

export default PostCardNormal
