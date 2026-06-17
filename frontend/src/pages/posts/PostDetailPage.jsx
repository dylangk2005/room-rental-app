import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth, USER_STORAGE_KEY } from '../../contexts/AuthContext'
import authApi from '../../api/authApi'
import favoriteApi from '../../api/favoriteApi'
import postApi from '../../api/postApi'
import reportApi from '../../api/reportApi'
import AppHeader from '../../components/AppHeader'
import ImageLightbox from '../../components/common/ImageLightbox'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import ToastContainer, { useToast } from '../../components/common/Toast'
import { copyText } from '../../components/common/clipboard'
import zaloIcon from '../../assets/sharing/zalo.png'
import ROUTES from '../../constants/routes'
import { formatCurrency, formatDate } from '../../utils/postFormatters'
import { getPostTypeTitleColor, shouldUppercaseTitle } from '../../utils/postTypeStyles'

const MAX_REPORT_IMAGES = 5

const reportReasons = [
    'Thông tin sai sự thật',
    'Tin trùng lặp hoặc spam',
    'Giá hoặc địa chỉ không đúng',
    'Nội dung lừa đảo hoặc đáng ngờ',
    'Khác',
]

const getErrorMessage = (error) =>
    error.response?.data?.message || 'Không tải được tin đăng. Vui lòng kiểm tra backend và thử lại.'

const buildAddress = (post) =>
    [post?.address, post?.district, post?.province]
        .filter(Boolean)
        .join(', ')

const buildMapUrl = (address) =>
    `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

const buildMapOpenUrl = (address) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

const buildMapDirectionsUrl = (address) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

const buildShareUrl = (postId) =>
    `${window.location.origin}/posts/${postId}`

const isExpiredPost = (post) => {
    if (String(post?.status || '').toUpperCase() === 'EXPIRED') {
        return true
    }

    if (!post?.endAt) {
        return false
    }

    const endAtTime = new Date(post.endAt).getTime()
    return Number.isFinite(endAtTime) && endAtTime <= Date.now()
}

const isStaffUser = (user) => ['ADMIN', 'MANAGER', 'MODERATOR'].includes(String(user?.role || '').toUpperCase())

const normalizeVietnamPhoneForZalo = (phone) => {
    const digits = (phone ?? '').toString().replace(/\D/g, '')

    if (digits.startsWith('0')) {
        return `84${digits.slice(1)}`
    }

    if (digits.startsWith('84')) {
        return digits
    }

    return digits
}

const DetailSkeleton = () => (
    <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="h-8 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div className="h-20 animate-pulse rounded-xl bg-slate-200" key={index} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
                </div>
            </div>
        </div>
    </main>
)

const ImageGallery = ({ post, isExpired, onOpenLightbox }) => {
    if (!post || post.id == null) return null
    const fallbackUrl = `https://picsum.photos/seed/taytro-detail-${post.id}/1200/800`
    const images = useMemo(
        () => (Array.isArray(post.imageUrls) && post.imageUrls.length > 0 ? post.imageUrls : [fallbackUrl]),
        [fallbackUrl, post.imageUrls]
    )
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [trackIndex, setTrackIndex] = useState(1)
    const [isTrackResetting, setIsTrackResetting] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const hasMultipleImages = images.length > 1
    const carouselImages = hasMultipleImages
        ? [images[images.length - 1], ...images, images[0]]
        : images
    const activeTrackIndex = hasMultipleImages ? trackIndex : 0

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            setSelectedIndex(0)
            setTrackIndex(hasMultipleImages ? 1 : 0)
            setIsTrackResetting(false)
            setIsAnimating(false)
        })

        return () => cancelAnimationFrame(frameId)
    }, [hasMultipleImages, images, post.id])

    const showPreviousImage = () => {
        if (!hasMultipleImages || isAnimating) return

        setIsAnimating(true)
        setSelectedIndex((current) => (current === 0 ? images.length - 1 : current - 1))
        setTrackIndex((current) => Math.max(current - 1, 0))
    }

    const showNextImage = () => {
        if (!hasMultipleImages || isAnimating) return

        setIsAnimating(true)
        setSelectedIndex((current) => (current === images.length - 1 ? 0 : current + 1))
        setTrackIndex((current) => Math.min(current + 1, images.length + 1))
    }

    const selectImage = (index) => {
        if (isAnimating) return

        setSelectedIndex(index)
        setTrackIndex(hasMultipleImages ? index + 1 : 0)
    }

    const handleTrackTransitionEnd = () => {
        if (!hasMultipleImages) {
            setIsAnimating(false)
            return
        }

        if (trackIndex === 0) {
            setIsTrackResetting(true)
            setTrackIndex(images.length)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsTrackResetting(false)
                    setIsAnimating(false)
                })
            })
            return
        }

        if (trackIndex === images.length + 1) {
            setIsTrackResetting(true)
            setTrackIndex(1)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsTrackResetting(false)
                    setIsAnimating(false)
                })
            })
            return
        }

        setIsAnimating(false)
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {isExpired && <ExpiredPostBanner />}
            <div className="relative aspect-[4/3] cursor-zoom-in bg-slate-100 sm:aspect-[16/10]">
                <button
                    type="button"
                    aria-label={hasMultipleImages ? `Xem ảnh ${selectedIndex + 1} - ${images.length}` : 'Xem ảnh'}
                    className="absolute inset-0 z-10 h-full w-full cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-emerald-300"
                    onClick={() => onOpenLightbox?.(selectedIndex)}
                />
                <div
                    className={`flex h-full ${isTrackResetting ? '' : 'transition-transform duration-500 ease-out'}`}
                    style={{ transform: `translateX(-${activeTrackIndex * 100}%)` }}
                    onTransitionEnd={handleTrackTransitionEnd}
                >
                    {carouselImages.map((imageUrl, index) => (
                        <img
                            className="h-full w-full shrink-0 select-none object-cover"
                            src={imageUrl}
                            alt={`${post.title ?? 'Tin đăng'} - ảnh ${hasMultipleImages ? ((index + images.length - 1) % images.length) + 1 : index + 1}`}
                            key={`${imageUrl}-${index}`}
                            draggable={false}
                        />
                    ))}
                </div>
                {hasMultipleImages && (
                    <>
                        <div className="pointer-events-none absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-black text-white shadow-lg">
                            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5l3.5-3.5h11L21 7.5M3 7.5v11l3.5 3.5M3 7.5h18M21 7.5v11l-3.5 3.5M21 18.5H6" />
                            </svg>
                            {selectedIndex + 1}/{images.length}
                        </div>
                        <button
                            aria-label="Xem ảnh trước"
                            className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white shadow-lg transition hover:scale-110 hover:bg-slate-950/75 focus:outline-none focus:ring-4 focus:ring-white/60"
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                showPreviousImage()
                            }}
                            disabled={isAnimating}
                        >
                            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                            </svg>
                        </button>
                        <button
                            aria-label="Xem ảnh tiếp theo"
                            className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white shadow-lg transition hover:scale-110 hover:bg-slate-950/75 focus:outline-none focus:ring-4 focus:ring-white/60"
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                showNextImage()
                            }}
                            disabled={isAnimating}
                        >
                            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
            {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
                    {images.map((imageUrl, index) => (
                        <button
                            className={`aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg border bg-slate-100 transition hover:scale-105 ${
                                selectedIndex === index
                                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                                    : 'border-slate-200 hover:border-emerald-300'
                            }`}
                            key={`${imageUrl}-${index}`}
                            type="button"
                            onClick={() => {
                                selectImage(index)
                                onOpenLightbox?.(index)
                            }}
                            aria-label={`Xem ảnh ${index + 1}`}
                            disabled={isAnimating}
                        >
                            <img className="h-full w-full object-cover" src={imageUrl} alt={`${post.title} - ảnh ${index + 1}`} />
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}

const StatCard = ({ label, value, tone = 'slate', icon }) => {
    const toneClass =
        tone === 'emerald'
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 text-emerald-900 ring-1 ring-emerald-100'
            : 'bg-slate-50 text-slate-950 ring-1 ring-slate-100'

    return (
        <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                {icon}
                {label}
            </span>
            <strong className="mt-1.5 block text-lg font-black leading-tight">{value}</strong>
        </div>
    )
}

const StatIcon = ({ name }) => {
    switch (name) {
        case 'price':
            return (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        case 'area':
            return (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            )
        case 'calendar':
            return (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            )
        case 'expire':
            return (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        default:
            return null
    }
}

const ExpiredPostBanner = () => (
    <div className="flex w-full flex-col border-b border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-black">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Tin đăng này đã hết hạn
            </h2>
            <p className="mt-1 text-sm leading-5">Thông tin liên hệ có thể không còn khả dụng.</p>
        </div>
        <Link
            className="mt-3 inline-flex h-9 w-fit shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] sm:mt-0"
            to={ROUTES.POSTS}
        >
            Xem tin còn hiệu lực
        </Link>
    </div>
)

const HeartIcon = ({ filled }) => (
    <svg aria-hidden="true" className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24">
        <path
            d="M20.8 4.6c-2.1-2-5.4-1.9-7.4.2L12 6.2l-1.4-1.4c-2-2.1-5.3-2.2-7.4-.2-2.3 2.2-2.4 5.8-.2 8.1l8.1 8.1c.5.5 1.3.5 1.8 0l8.1-8.1c2.2-2.3 2.1-5.9-.2-8.1Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        />
    </svg>
)

const FavoriteButton = ({ isFavoriteLoading, isFavorited, onFavoriteToggle }) => (
    <button
        aria-label={isFavorited ? 'Bỏ yêu thích tin này' : 'Yêu thích tin này'}
        aria-pressed={isFavorited}
        title={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-90 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            isFavorited
                ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-md shadow-rose-200/50 hover:bg-rose-100 focus:ring-rose-100'
                : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:ring-rose-100'
        }`}
        type="button"
        onClick={onFavoriteToggle}
        disabled={isFavoriteLoading}
    >
        <span key={String(isFavorited)} className={isFavorited ? 'inline-block animate-[heart-pop_0.3s]' : 'inline-block'}>
            <HeartIcon filled={isFavorited} />
        </span>
    </button>
)

const buildShareDescription = (post) => {
    const parts = []
    if (post?.rentalPrice) parts.push(`Giá: ${formatCurrency(post.rentalPrice)}`)
    if (post?.area) parts.push(`Diện tích: ${post.area} m2`)
    const fullAddress = [post?.address, post?.district, post?.province].filter(Boolean).join(', ')
    if (fullAddress) parts.push(`Địa chỉ: ${fullAddress}`)
    if (post?.description) {
        const snippet = post.description.length > 240 ? `${post.description.slice(0, 240).trim()}…` : post.description
        parts.push(snippet)
    }
    parts.push('--- Xem chi tiết trên TayTro ---')
    return parts.join('\n')
}

const SharePanel = ({ post, onCopied }) => {
    const shareUrl = useMemo(() => buildShareUrl(post.id), [post.id])
    const [showFullText, setShowFullText] = useState(false)

    const handleCopyLink = async () => {
        const success = await copyText(shareUrl)
        if (success) {
            onCopied?.('Đã sao chép liên kết vào bộ nhớ tạm.')
        } else {
            onCopied?.('Không thể sao chép. Vui lòng thử lại.', 'error')
        }
    }

    const handleCopyAll = async () => {
        const lines = [
            post.title || 'Tin đăng trên TayTro',
            buildShareDescription(post),
            shareUrl,
        ]
        const text = lines.filter(Boolean).join('\n\n')
        const success = await copyText(text)
        if (success) {
            onCopied?.('Đã sao chép tiêu đề, mô tả và liên kết. Bạn có thể dán vào bất kỳ đâu.')
        } else {
            onCopied?.('Không thể sao chép. Vui lòng thử lại.', 'error')
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-slate-950">Chia sẻ tin đăng</h2>
                    <p className="text-xs leading-4 text-slate-500">Sao chép liên kết rồi gửi cho bạn bè hoặc đăng lên mạng xã hội.</p>
                </div>
            </div>

            <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50/60 p-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700" title={shareUrl}>
                        {shareUrl}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white shadow-md shadow-slate-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25 focus:outline-none focus:ring-4 focus:ring-slate-200 active:scale-[0.98]"
                    >
                        <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        Sao chép liên kết
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyAll}
                        className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-500/20 focus:outline-none focus:ring-4 focus:ring-slate-200 active:scale-[0.98]"
                    >
                        <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M8.25 12h7.5m-7.5 3.75h7.5" />
                        </svg>
                        Sao chép cả mô tả
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowFullText((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
                    aria-expanded={showFullText}
                >
                    <svg
                        aria-hidden="true"
                        className={`h-3 w-3 transition-transform ${showFullText ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.4"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    {showFullText ? 'Thu gọn nội dung chia sẻ' : 'Xem trước nội dung chia sẻ'}
                </button>

                {showFullText && (
                    <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                        {[
                            post.title || 'Tin đăng trên TayTro',
                            buildShareDescription(post),
                            shareUrl,
                        ]
                            .filter(Boolean)
                            .join('\n\n')}
                    </pre>
                )}
            </div>
        </section>
    )
}

const ActionPanel = ({ isOwner, onReportClick }) => (
    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">An toàn tin đăng</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
            Nếu nội dung có dấu hiệu sai sự thật, spam hoặc lừa đảo, hãy gửi báo cáo để đội kiểm duyệt xem xét.
        </p>
        {isOwner && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                Bạn không thể báo cáo tin của chính mình.
            </p>
        )}
        <button
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/20 focus:outline-none focus:ring-4 focus:ring-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            type="button"
            onClick={onReportClick}
            disabled={isOwner}
        >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.208.682l3.707-.736M21 21v-1.5M21 9V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5" />
            </svg>
            Báo cáo tin xấu
        </button>
    </section>
)

const ReportModal = ({ onClose, onSubmit, postTitle, reportError, isSubmitting }) => {
    const [reason, setReason] = useState(reportReasons[0])
    const [description, setDescription] = useState('')
    const [images, setImages] = useState([])
    const [imageError, setImageError] = useState('')

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files || [])
        const nextImages = [...images]
        setImageError('')

        selectedFiles.forEach((file) => {
            if (nextImages.length >= MAX_REPORT_IMAGES) {
                setImageError(`Chỉ được tải lên tối đa ${MAX_REPORT_IMAGES} ảnh minh chứng.`)
                return
            }

            if (!file.type.startsWith('image/')) {
                setImageError('Vui lòng chỉ chọn file ảnh.')
                return
            }

            nextImages.push(file)
        })

        setImages(nextImages)
        event.target.value = ''
    }

    const removeImage = (indexToRemove) => {
        setImages((current) => current.filter((_, index) => index !== indexToRemove))
        setImageError('')
    }

    const imagePreviews = useMemo(
        () => images.map((image) => ({ file: image, url: URL.createObjectURL(image) })),
        [images]
    )

    useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        }
    }, [imagePreviews])

    return (
        <div className="animate-in fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="slide-in-from-bottom-3 max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
                    <div className="min-w-0">
                        <h2 className="text-xl font-black text-slate-950">Báo cáo tin xấu</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{postTitle}</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Đóng"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
                <form
                    className="space-y-4 p-5"
                    onSubmit={(event) => {
                        event.preventDefault()
                        onSubmit({ reason, description, images })
                    }}
                >
                    <label className="block">
                        <span className="mb-2 block text-sm font-black text-slate-800">Lý do báo cáo</span>
                        <select
                            className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                        >
                            {reportReasons.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-black text-slate-800">Mô tả thêm</span>
                        <textarea
                            className="min-h-28 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Nhập thêm thông tin để đội kiểm duyệt xử lý nhanh hơn"
                        />
                    </label>
                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-800">Ảnh minh chứng</span>
                            <span className="text-xs font-bold text-slate-500">
                                {images.length}/{MAX_REPORT_IMAGES} ảnh
                            </span>
                        </div>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700">
                            <svg aria-hidden="true" className="mb-1 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>Chọn ảnh từ thiết bị</span>
                            <span className="mt-1 text-xs font-semibold text-slate-500">PNG, JPG, JPEG hoặc WEBP</span>
                            <input
                                className="sr-only"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                disabled={images.length >= MAX_REPORT_IMAGES}
                            />
                        </label>
                        {imageError && <p className="mt-2 text-sm font-bold text-red-600">{imageError}</p>}
                        {images.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {imagePreviews.map((preview, index) => (
                                    <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100" key={`${preview.file.name}-${index}`}>
                                        <img
                                            className="h-full w-full object-cover"
                                            src={preview.url}
                                            alt={`Ảnh minh chứng ${index + 1}`}
                                        />
                                        <button
                                            className="absolute right-1 top-1 inline-flex h-6 items-center gap-1 rounded-full bg-slate-950/75 px-2 text-[11px] font-black text-white opacity-0 transition group-hover:opacity-100"
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            aria-label={`Xóa ảnh ${index + 1}`}
                                        >
                                            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                                            </svg>
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {reportError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{reportError}</p>}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            className="h-11 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            type="button"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                        <button
                            className="h-11 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const ContactPanel = ({ contact, contactError, isContactLoading, isExpired, canViewExpiredContact, isOwner, postId }) => {
    const { user } = useAuth()
    const safeOwnerName = (contact?.ownerName ?? '').toString().trim() || 'Chủ tin'
    const ownerInitial = (safeOwnerName.charAt(0) || 'C').toUpperCase()
    const zaloPhone = normalizeVietnamPhoneForZalo(contact?.ownerPhone)
    const hasPhone = Boolean(contact?.ownerPhone)
    const [avatarFailed, setAvatarFailed] = useState(false)
    const avatarUrl = contact?.ownerAvatar || contact?.avatarUrl || contact?.ownerAvatarUrl || contact?.avatar || ''
    const showAvatarImage = avatarUrl && !avatarFailed
    if (import.meta.env.DEV) {
        console.log('[ContactPanel]', {
            hasUser: Boolean(user),
            userId: user?.id,
            isContactLoading,
            contactError,
            hasContact: Boolean(contact),
            avatarUrl: avatarUrl || null,
            ownerName: contact?.ownerName || null,
            ownerPhone: hasPhone ? '***' : null,
            isExpired,
            canViewExpiredContact,
        })
    }

    if (!user) {
        return (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-emerald-50 via-white to-white p-5">
                    <ContactPanelHeader />
                    <div className="mt-4">
                        <OwnerIdentity
                            contact={{ ownerName: safeOwnerName }}
                            avatarUrl={avatarUrl}
                            ownerInitial={ownerInitial}
                            showAvatarImage={showAvatarImage}
                            onAvatarError={() => setAvatarFailed(true)}
                            showPhone={false}
                        />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        Đăng nhập để xem số điện thoại và nhắn Zalo trực tiếp với chủ tin.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Link
                            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 focus:outline-none focus:ring-4 focus:ring-emerald-100 active:scale-[0.98]"
                            to={ROUTES.LOGIN}
                            state={{ from: `/posts/${postId}` }}
                        >
                            <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            Đăng nhập
                        </Link>
                        <Link
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-500/15 focus:outline-none focus:ring-4 focus:ring-slate-200 active:scale-[0.98]"
                            to={ROUTES.REGISTER}
                        >
                            Tạo tài khoản
                        </Link>
                    </div>
                </div>
            </section>
        )
    }

    if (isExpired && !canViewExpiredContact) {
        return (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <h2 className="text-lg font-black">Tin đăng đã hết hiệu lực</h2>
                <p className="mt-2 text-sm leading-6">
                    Thông tin liên hệ của tin này đã được tạm ẩn vì thời hạn hiển thị đã kết thúc.
                    Vui lòng tham khảo các tin còn hiệu lực hoặc chờ chủ tin gia hạn.
                </p>
                <Link
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-500/30 active:translate-y-0 active:scale-[0.98]"
                    to={ROUTES.POSTS}
                >
                    Xem tin còn hiệu lực
                </Link>
            </section>
        )
    }

    if (isContactLoading && !contact) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-12 animate-pulse rounded-xl bg-slate-200" />
                <div className="mt-3 h-11 animate-pulse rounded-xl bg-slate-200" />
            </section>
        )
    }

    if (contactError && !contact) {
        return (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <h2 className="text-lg font-black">Chưa xem được liên hệ</h2>
                <p className="mt-2 text-sm leading-6">
                    {contactError}
                </p>
                <Link
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-500/30 active:translate-y-0 active:scale-[0.98]"
                    to={ROUTES.LOGIN}
                    state={{ from: `/posts/${postId}` }}
                >
                    Đăng nhập lại
                </Link>
            </section>
        )
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-emerald-50/60 via-white to-white p-5">
                <ContactPanelHeader
                    badge={
                        isOwner ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                                <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Đây là tin của bạn
                            </span>
                        ) : null
                    }
                />
                <div className="mt-4">
                    <OwnerIdentity
                        contact={{ ownerName: safeOwnerName, ownerPhone: contact?.ownerPhone }}
                        avatarUrl={avatarUrl}
                        ownerInitial={ownerInitial}
                        showAvatarImage={showAvatarImage}
                        onAvatarError={() => setAvatarFailed(true)}
                        showPhone={hasPhone}
                        online
                    />
                </div>
                {hasPhone && (
                    <>
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs leading-5 text-slate-600">
                            Bạn có thể nhắn trực tiếp qua Zalo. Hãy nêu rõ nhu cầu thuê, thời gian dọn vào và đặt lịch xem phòng.
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {zaloPhone ? (
                                <a
                                    className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-[#0068ff] bg-gradient-to-br from-white to-blue-50/60 px-4 text-sm font-black text-[#0068ff] shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-50 hover:to-white hover:shadow-xl hover:shadow-blue-500/35 focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.98]"
                                    href={`https://zalo.me/${zaloPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-blue-100/60 transition-transform duration-500 group-hover:translate-x-0" />
                                    <span className="relative flex h-7 w-7 items-center justify-center transition-transform group-hover:scale-110">
                                        <img className="h-full w-full object-contain" src={zaloIcon} alt="Zalo" />
                                    </span>
                                    <span className="relative">Liên hệ qua Zalo</span>
                                </a>
                            ) : (
                                <span className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
                                    Chưa có Zalo liên kết
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}

const ContactPanelHeader = ({ badge = null }) => (
    <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-black text-slate-950">Liên hệ người đăng</h2>
        {badge}
    </div>
)

const OwnerIdentity = ({ contact, avatarUrl, ownerInitial, showAvatarImage, onAvatarError, showPhone, online = false }) => {
    const safeName = contact?.ownerName || 'Chủ tin'
    return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-100">
        <div className="relative shrink-0">
            {showAvatarImage && avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={safeName}
                    onError={onAvatarError}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
                />
            ) : (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-base font-black text-white shadow-md shadow-emerald-500/30 ring-2 ring-white">
                    {ownerInitial}
                </span>
            )}
            {online && showPhone && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
            )}
        </div>
        <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Người đăng</span>
            <strong className="block truncate text-base font-black text-slate-950">{safeName}</strong>
            {showPhone && contact?.ownerPhone ? (
                <a
                    href={`tel:${contact.ownerPhone}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-slate-700 transition-colors hover:text-emerald-700"
                >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {contact.ownerPhone}
                </a>
            ) : showPhone ? (
                <span className="mt-0.5 inline-block text-sm font-bold text-slate-400">SĐT chưa cập nhật</span>
            ) : (
                <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Đăng nhập để xem SĐT
                </span>
            )}
        </div>
    </div>
    )
}

const MapPanel = ({ address }) => {
    if (!address) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Vị trí</h2>
                <p className="mt-2 text-sm text-slate-500">Tin đăng chưa có đủ địa chỉ để hiển thị bản đồ.</p>
            </section>
        )
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5">
                <h2 className="text-lg font-black text-slate-950">Vị trí</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{address}</p>
            </div>
            <div className="h-72 border-t border-slate-200 bg-slate-100">
                <iframe
                    className="h-full w-full"
                    src={buildMapUrl(address)}
                    title={`Bản đồ ${address}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
                <a
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-black text-slate-800 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-500/15 active:scale-[0.98]"
                    href={buildMapOpenUrl(address)}
                    target="_blank"
                    rel="noreferrer"
                >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Mở bản đồ
                </a>
                <a
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 active:translate-y-0 active:scale-[0.98]"
                    href={buildMapDirectionsUrl(address)}
                    target="_blank"
                    rel="noreferrer"
                >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    Chỉ đường
                </a>
            </div>
        </section>
    )
}

const PostDetailPage = () => {
    const { user, login } = useAuth()
    const { id } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [post, setPost] = useState(null)
    const [contact, setContact] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isContactLoading, setIsContactLoading] = useState(true)
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isReportSubmitting, setIsReportSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [contactError, setContactError] = useState('')
    const [reportError, setReportError] = useState('')
    const [lightboxIndex, setLightboxIndex] = useState(null)
    const address = useMemo(() => buildAddress(post), [post])
    const isOwner = Boolean(user?.id && post?.ownerId && Number(user.id) === Number(post.ownerId))
    const isPostExpired = useMemo(() => isExpiredPost(post), [post])
    const canViewExpiredContact = isOwner || isStaffUser(user)
    const isTitleUppercase = useMemo(() => Boolean(post && shouldUppercaseTitle(post)), [post])

    useEffect(() => {
        let ignore = false
        setIsLoading(true)
        setError('')

        const loadPost = async () => {
            try {
                const response = await postApi.getPostDetail(id)
                if (ignore) return
                setPost(response.data)
            } catch (loadError) {
                if (!ignore) {
                    setError(getErrorMessage(loadError))
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        loadPost()

        return () => {
            ignore = true
        }
    }, [id])

    useEffect(() => {
        if (user) return
        if (typeof window === 'undefined') return
        if (!localStorage.getItem(USER_STORAGE_KEY)) return
        let ignore = false
        const restore = async () => {
            try {
                const sessionUser = await authApi.refreshSession()
                if (ignore) return
                if (sessionUser) {
                    login(sessionUser)
                }
            } catch {
                /* guest ok */
            }
        }
        restore()
        return () => {
            ignore = true
        }
    }, [id])

    const userRef = useRef(user)
    userRef.current = user
    const lastContactPostIdRef = useRef(null)
    const isContactLoadingRef = useRef(false)

    useEffect(() => {
        const postId = post?.id
        if (!postId) return undefined

        let cancelled = false
        setIsContactLoading(true)
        setContactError('')
        setContact(null)
        isContactLoadingRef.current = true

        const postData = post
        const currentUser = user

        const loadContact = async () => {
            const expired = isExpiredPost(postData)
            const ownerHere = Boolean(currentUser?.id && postData?.ownerId && Number(currentUser.id) === Number(postData.ownerId))
            const canView = ownerHere || isStaffUser(currentUser)
            if (expired && !canView) {
                if (!cancelled) {
                    setContact(null)
                    setIsContactLoading(false)
                    isContactLoadingRef.current = false
                }
                return
            }
            try {
                const response = await postApi.getPostContact(postId)
                if (cancelled) return
                setContact(response.data)
                setIsContactLoading(false)
                isContactLoadingRef.current = false
            } catch (loadError) {
                if (cancelled) return
                setContactError(getErrorMessage(loadError))
                setContact(null)
                setIsContactLoading(false)
                isContactLoadingRef.current = false
            }
        }

        loadContact()

        return () => {
            cancelled = true
        }
    }, [post?.id, user?.id])

    const handleFavoriteToggle = async () => {
        if (!user) {
            navigate(ROUTES.LOGIN, { state: { from: `/posts/${id}` } })
            return
        }

        setIsFavoriteLoading(true)

        try {
            if (post?.isFavorited) {
                await favoriteApi.removeFavorite(id)
                setPost((current) => ({ ...current, isFavorited: false }))
                showToast({ type: 'info', message: 'Đã bỏ khỏi danh sách yêu thích.' })
            } else {
                await favoriteApi.addFavorite(id)
                setPost((current) => ({ ...current, isFavorited: true }))
                showToast({ type: 'success', message: 'Đã thêm vào danh sách yêu thích.' })
            }
        } catch (favoriteLoadError) {
            showToast({ type: 'error', message: favoriteLoadError.response?.data?.message || 'Không xử lý được yêu thích. Vui lòng thử lại.' })
        } finally {
            setIsFavoriteLoading(false)
        }
    }

    const handleReportClick = () => {
        if (!user) {
            navigate(ROUTES.LOGIN, { state: { from: `/posts/${id}` } })
            return
        }

        if (isOwner) {
            showToast({ type: 'error', message: 'Bạn không thể báo cáo tin của chính mình.' })
            return
        }

        setReportError('')
        setIsReportModalOpen(true)
    }

    const handleReportSubmit = async ({ reason, description, images }) => {
        setIsReportSubmitting(true)
        setReportError('')

        try {
            await reportApi.createReport({ postId: id, reason, description, images })
            setIsReportModalOpen(false)
            showToast({ type: 'success', message: 'Đã gửi báo cáo. Đội kiểm duyệt sẽ xem xét tin này.' })
        } catch (reportLoadError) {
            setReportError(reportLoadError.response?.data?.message || 'Không gửi được báo cáo. Vui lòng thử lại.')
        } finally {
            setIsReportSubmitting(false)
        }
    }

    const handleShareFeedback = (message, type = 'success') => {
        showToast({ type, message })
    }

    if (isLoading) {
        return <DetailSkeleton />
    }

    if (error || !post) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
                <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
                    <h1 className="text-2xl font-black">Không tải được tin đăng</h1>
                    <p className="mt-3 text-sm">{error || 'Tin đăng không tồn tại hoặc đã ngừng hiển thị.'}</p>
                    <Link
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/30 active:translate-y-0 active:scale-[0.98]"
                        to={ROUTES.HOME}
                    >
                        Quay lại trang chủ
                    </Link>
                </div>
            </main>
        )
    }

    const galleryImages = Array.isArray(post.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls
        : [`https://picsum.photos/seed/taytro-detail-${post.id}/1200/800`]

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950">
            <div className="pointer-events-none absolute -left-20 top-32 -z-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-20 top-1/2 -z-0 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" aria-hidden="true" />

            <AppHeader />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Link to={ROUTES.POSTS} className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-700">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Danh sách tin
                    </Link>
                    <svg aria-hidden="true" className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="truncate text-slate-700">Chi tiết</span>
                </nav>
            </div>

            <div className="relative z-10 mx-auto grid max-w-7xl animate-in grid-cols-1 gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
                <div className="space-y-6">
                    <ImageGallery
                        post={post}
                        isExpired={isPostExpired}
                        key={post.id}
                        onOpenLightbox={(imageIndex) => setLightboxIndex(imageIndex ?? 0)}
                    />

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1
                                    className={`leading-tight text-slate-950 ${isTitleUppercase ? 'uppercase' : ''}`}
                                    style={{
                                        color: getPostTypeTitleColor(post.postTypeName, post.postTypeTitleColor),
                                        fontSize: post.postTypeTitleSize
                                            ? `${Math.min(post.postTypeTitleSize + 10, 34)}px`
                                            : undefined,
                                        fontWeight: 900,
                                    }}
                                >
                                    {post.title}
                                </h1>
                                <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded text-slate-400">
                                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15M5.25 12h15m-7.5 3.75h7.5" />
                                        </svg>
                                    </span>
                                    Mã tin: <span className="font-black text-slate-700">#{post.id}</span>
                                </div>
                            </div>
                            <FavoriteButton
                                isFavoriteLoading={isFavoriteLoading}
                                isFavorited={Boolean(post.isFavorited)}
                                onFavoriteToggle={handleFavoriteToggle}
                            />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatCard label="Giá thuê" value={formatCurrency(post.rentalPrice)} tone="emerald" icon={<StatIcon name="price" />} />
                            <StatCard label="Diện tích" value={`${post.area} m2`} icon={<StatIcon name="area" />} />
                            <StatCard label="Ngày đăng" value={formatDate(post.createdAt)} icon={<StatIcon name="calendar" />} />
                            <StatCard label="Hết hạn" value={formatDate(post.endAt)} icon={<StatIcon name="expire" />} />
                        </div>

                        <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5 ring-1 ring-slate-100">
                            <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Khu vực</span>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {post.province && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800 transition hover:scale-105 hover:bg-emerald-100">
                                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        Tỉnh/Thành: {post.province}
                                    </span>
                                )}
                                {post.district && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800 transition hover:scale-105 hover:bg-emerald-100">
                                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                        </svg>
                                        Quận/Huyện: {post.district}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex items-start gap-2">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-emerald-600">
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Địa chỉ chi tiết</span>
                                    <p className="mt-1 text-base font-semibold leading-relaxed text-slate-900">
                                        {address || 'Đang cập nhật'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                        <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </span>
                            Mô tả chi tiết
                        </h2>
                        <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
                            {post.description || 'Tin đăng chưa có mô tả chi tiết.'}
                        </p>
                    </section>
                </div>

                <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                    <SharePanel post={post} onCopied={handleShareFeedback} />
                    <ActionPanel
                        isOwner={isOwner}
                        onReportClick={handleReportClick}
                    />
                    <ContactPanel
                        contact={contact}
                        contactError={contactError}
                        isContactLoading={isContactLoading}
                        isExpired={isPostExpired}
                        canViewExpiredContact={canViewExpiredContact}
                        isOwner={isOwner}
                        postId={id}
                    />
                    <MapPanel address={address} />
                </aside>
            </div>

            {isReportModalOpen && (
                <ReportModal
                    onClose={() => {
                        setIsReportModalOpen(false)
                        setReportError('')
                    }}
                    onSubmit={handleReportSubmit}
                    postTitle={post.title}
                    reportError={reportError}
                    isSubmitting={isReportSubmitting}
                />
            )}

            {lightboxIndex !== null && (
                <ImageLightbox
                    images={galleryImages}
                    title={post.title}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <ToastContainer />
        </main>
    )
}

export default function PostDetailPageWithBoundary() {
    return (
        <ErrorBoundary>
            <PostDetailPage />
        </ErrorBoundary>
    )
}
