import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import authApi from '../../api/authApi'
import favoriteApi from '../../api/favoriteApi'
import postApi from '../../api/postApi'
import reportApi from '../../api/reportApi'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import { formatCurrency, formatDate } from '../../utils/postFormatters'
import { getPostTypeTitleColor } from '../../utils/postTypeStyles'

const USER_STORAGE_KEY = 'taytro_user'
const MAX_REPORT_IMAGES = 5

const reportReasons = [
    'Thông tin sai sự thật',
    'Tin trùng lặp hoặc spam',
    'Giá hoặc địa chỉ không đúng',
    'Nội dung lừa đảo hoặc đáng ngờ',
    'Khác',
]

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

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

const normalizeVietnamPhoneForZalo = (phone = '') => {
    const digits = phone.toString().replace(/\D/g, '')

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
                    <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="h-8 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div className="h-20 animate-pulse rounded-lg bg-slate-200" key={index} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="h-44 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-72 animate-pulse rounded-lg bg-slate-200" />
                </div>
            </div>
        </div>
    </main>
)

const ImageGallery = ({ post, isExpired }) => {
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
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {isExpired && <ExpiredPostBanner />}
            <div className="relative aspect-[4/3] bg-slate-100 sm:aspect-[16/10]">
                <div
                    className={`flex h-full ${isTrackResetting ? '' : 'transition-transform duration-500 ease-out'}`}
                    style={{ transform: `translateX(-${activeTrackIndex * 100}%)` }}
                    onTransitionEnd={handleTrackTransitionEnd}
                >
                    {carouselImages.map((imageUrl, index) => (
                        <img
                            className="h-full w-full shrink-0 object-cover"
                            src={imageUrl}
                            alt={`${post.title} - ảnh ${hasMultipleImages ? ((index + images.length - 1) % images.length) + 1 : index + 1}`}
                            key={`${imageUrl}-${index}`}
                        />
                    ))}
                </div>
                {hasMultipleImages && (
                    <>
                        <button
                            aria-label="Xem ảnh trước"
                            className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white shadow-lg transition hover:bg-slate-950/75 focus:outline-none focus:ring-4 focus:ring-white/60"
                            type="button"
                            onClick={showPreviousImage}
                            disabled={isAnimating}
                        >
                            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                            </svg>
                        </button>
                        <button
                            aria-label="Xem ảnh tiếp theo"
                            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white shadow-lg transition hover:bg-slate-950/75 focus:outline-none focus:ring-4 focus:ring-white/60"
                            type="button"
                            onClick={showNextImage}
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
                            className={`aspect-[4/3] overflow-hidden rounded-lg border bg-slate-100 transition ${
                                selectedIndex === index
                                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                                    : 'border-slate-200 hover:border-emerald-300'
                            }`}
                            key={`${imageUrl}-${index}`}
                            type="button"
                            onClick={() => selectImage(index)}
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

const StatCard = ({ label, value, tone = 'slate' }) => {
    const toneClass = tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-950'

    return (
        <div className={`rounded-lg p-4 ${toneClass}`}>
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
            <strong className="mt-1 block text-lg">{value}</strong>
        </div>
    )
}

const ExpiredPostBanner = () => (
    <div className="flex w-full flex-col border-b border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
            <h2 className="text-sm font-black">Tin đăng này đã hết hạn</h2>
            <p className="mt-1 text-sm leading-5">
                Thông tin liên hệ có thể không còn khả dụng.
            </p>
        </div>
        <Link
            className="mt-3 inline-flex h-9 w-fit shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3 text-xs font-black text-white transition hover:bg-amber-700 sm:mt-0"
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
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            isFavorited
                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-100'
                : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:ring-rose-100'
        }`}
        type="button"
        onClick={onFavoriteToggle}
        disabled={isFavoriteLoading}
    >
        <HeartIcon filled={isFavorited} />
    </button>
)

const ActionPanel = ({ isOwner, onReportClick }) => (
    <section className="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">An toàn tin đăng</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
            Nếu nội dung có dấu hiệu sai sự thật, spam hoặc lừa đảo, hãy gửi báo cáo để đội kiểm duyệt xem xét.
        </p>
        {isOwner && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                Bạn không thể báo cáo tin của chính mình.
            </p>
        )}
        <button
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onReportClick}
            disabled={isOwner}
        >
            Báo cáo tin xấu
        </button>
    </section>
)

const ReportModal = ({ onClose, onSubmit, postTitle, reportError, reportSuccess, isSubmitting }) => {
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
                <div className="border-b border-slate-200 p-5">
                    <h2 className="text-xl font-black text-slate-950">Báo cáo tin xấu</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{postTitle}</p>
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
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                            className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50">
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
                                    <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100" key={`${preview.file.name}-${index}`}>
                                        <img
                                            className="h-full w-full object-cover"
                                            src={preview.url}
                                            alt={`Ảnh minh chứng ${index + 1}`}
                                        />
                                        <button
                                            className="absolute right-1 top-1 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-black text-white"
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            aria-label={`Xóa ảnh ${index + 1}`}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {reportError && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{reportError}</p>}
                    {reportSuccess && (
                        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{reportSuccess}</p>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-100"
                            type="button"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                        <button
                            className="h-11 rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={isSubmitting || Boolean(reportSuccess)}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const ContactPanel = ({ contact, contactError, isContactLoading, isExpired, canViewExpiredContact, isOwner, user, postId }) => {
    if (!user) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Liên hệ người đăng</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Đăng nhập để xem số điện thoại và liên hệ trực tiếp với chủ tin qua Zalo.
                </p>
                <Link
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
                    to={ROUTES.LOGIN}
                    state={{ from: `/posts/${postId}` }}
                >
                    Đăng nhập để xem liên hệ
                </Link>
            </section>
        )
    }

    if (isExpired && !canViewExpiredContact) {
        return (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <h2 className="text-lg font-black">Tin đăng đã hết hiệu lực</h2>
                <p className="mt-2 text-sm leading-6">
                    Thông tin liên hệ của tin này đã được tạm ẩn vì thời hạn hiển thị đã kết thúc.
                    Vui lòng tham khảo các tin còn hiệu lực hoặc chờ chủ tin gia hạn.
                </p>
                <Link
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-black text-white hover:bg-amber-700"
                    to={ROUTES.POSTS}
                >
                    Xem tin còn hiệu lực
                </Link>
            </section>
        )
    }

    if (isContactLoading) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-11 animate-pulse rounded bg-slate-200" />
            </section>
        )
    }

    if (contactError || !contact) {
        return (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <h2 className="text-lg font-black">Chưa xem được liên hệ</h2>
                <p className="mt-2 text-sm leading-6">
                    Phiên đăng nhập có thể đã hết hạn. Vui lòng đăng nhập lại để xem số điện thoại.
                </p>
                <Link
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-black text-white hover:bg-amber-700"
                    to={ROUTES.LOGIN}
                    state={{ from: `/posts/${postId}` }}
                >
                    Đăng nhập lại
                </Link>
            </section>
        )
    }

    const zaloPhone = normalizeVietnamPhoneForZalo(contact.ownerPhone)

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-slate-950">Liên hệ người đăng</h2>
                {isOwner && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        Đây là tin của bạn
                    </span>
                )}
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Người đăng</span>
                <strong className="mt-1 block text-lg text-slate-950">{contact.ownerName || 'Chủ tin'}</strong>
                <span className="mt-2 block text-sm font-bold text-slate-600">{contact.ownerPhone}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
                Mở Zalo để nhắn tin hoặc gọi trực tiếp với người đăng.
            </p>
            {zaloPhone ? (
                <a
                    className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#0068ff] px-4 text-base font-black text-white hover:bg-[#0054cc]"
                    href={`https://zalo.me/${zaloPhone}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Liên hệ qua Zalo
                </a>
            ) : (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                    Số điện thoại chưa hợp lệ để mở Zalo.
                </div>
            )}
        </section>
    )
}

const MapPanel = ({ address }) => {
    if (!address) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Vị trí</h2>
                <p className="mt-2 text-sm text-slate-500">Tin đăng chưa có đủ địa chỉ để hiển thị bản đồ.</p>
            </section>
        )
    }

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="p-5">
                <h2 className="text-lg font-black text-slate-950">Vị trí</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{address}</p>
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
            <div className="p-4">
                <a
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-800 hover:bg-slate-100"
                    href={buildMapOpenUrl(address)}
                    target="_blank"
                    rel="noreferrer"
                >
                    Mở Google Maps
                </a>
            </div>
        </section>
    )
}

const PostDetailPage = ({ user, onUserChange }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [post, setPost] = useState(null)
    const [contact, setContact] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isContactLoading, setIsContactLoading] = useState(false)
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isReportSubmitting, setIsReportSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [contactError, setContactError] = useState('')
    const [favoriteError, setFavoriteError] = useState('')
    const [reportError, setReportError] = useState('')
    const [reportSuccess, setReportSuccess] = useState('')
    const address = useMemo(() => buildAddress(post), [post])
    const isOwner = Boolean(user?.id && post?.ownerId && Number(user.id) === Number(post.ownerId))
    const isPostExpired = useMemo(() => isExpiredPost(post), [post])
    const canViewExpiredContact = isOwner || isStaffUser(user)

    useEffect(() => {
        let ignore = false

        const loadPost = async () => {
            setIsLoading(true)
            setError('')
            setPost(null)
            setContact(null)
            setContactError('')
            setFavoriteError('')

            try {
                const sessionUser = await authApi.refreshSession()
                if (ignore) return

                onUserChange?.(sessionUser)

                const response = await postApi.getPostDetail(id)
                if (!ignore) {
                    setPost(response.data)
                }
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
        if (!user || !id || !post) return undefined

        let ignore = false

        const loadContact = async () => {
            setIsContactLoading(true)
            setContactError('')

            if (isPostExpired && !canViewExpiredContact) {
                setContact(null)
                setIsContactLoading(false)
                return
            }

            try {
                const response = await postApi.getPostContact(id)
                if (!ignore) {
                    setContact(response.data)
                }
            } catch (loadError) {
                if (!ignore) {
                    setContactError(getErrorMessage(loadError))
                    setContact(null)
                }
            } finally {
                if (!ignore) {
                    setIsContactLoading(false)
                }
            }
        }

        loadContact()

        return () => {
            ignore = true
        }
    }, [canViewExpiredContact, id, isPostExpired, post, user])

    const handleFavoriteToggle = async () => {
        if (!user) {
            navigate(ROUTES.LOGIN, { state: { from: `/posts/${id}` } })
            return
        }

        setIsFavoriteLoading(true)
        setFavoriteError('')

        try {
            if (post?.isFavorited) {
                await favoriteApi.removeFavorite(id)
                setPost((current) => ({ ...current, isFavorited: false }))
            } else {
                await favoriteApi.addFavorite(id)
                setPost((current) => ({ ...current, isFavorited: true }))
            }
        } catch (favoriteLoadError) {
            setFavoriteError(favoriteLoadError.response?.data?.message || 'Không xử lý được yêu thích. Vui lòng thử lại.')
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
            setReportError('Bạn không thể báo cáo tin của chính mình.')
            return
        }

        setReportError('')
        setReportSuccess('')
        setIsReportModalOpen(true)
    }

    const handleReportSubmit = async ({ reason, description, images }) => {
        setIsReportSubmitting(true)
        setReportError('')
        setReportSuccess('')

        try {
            await reportApi.createReport({ postId: id, reason, description, images })
            setReportSuccess('Đã gửi báo cáo. Đội kiểm duyệt sẽ xem xét tin này.')
        } catch (reportLoadError) {
            setReportError(reportLoadError.response?.data?.message || 'Không gửi được báo cáo. Vui lòng thử lại.')
        } finally {
            setIsReportSubmitting(false)
        }
    }

    if (isLoading) {
        return <DetailSkeleton />
    }

    if (error || !post) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
                <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
                    <h1 className="text-2xl font-black">Không tải được tin đăng</h1>
                    <p className="mt-3 text-sm">{error || 'Tin đăng không tồn tại hoặc đã ngừng hiển thị.'}</p>
                    <Link
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700"
                        to={ROUTES.HOME}
                    >
                        Quay lại trang chủ
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <AppHeader user={user} onUserChange={onUserChange} />

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
                <div className="space-y-6">
                    <ImageGallery post={post} isExpired={isPostExpired} key={post.id} />

                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                    {post.postTypeName || 'Tin thường'}
                                </span>
                                <h1
                                    className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl"
                                    style={{
                                        color: getPostTypeTitleColor(post.postTypeName, post.postTypeTitleColor),
                                        fontSize: post.postTypeTitleSize
                                            ? `${Math.min(post.postTypeTitleSize + 10, 34)}px`
                                            : undefined,
                                    }}
                                >
                                    {post.title}
                                </h1>
                            </div>
                            <FavoriteButton
                                isFavoriteLoading={isFavoriteLoading}
                                isFavorited={Boolean(post.isFavorited)}
                                onFavoriteToggle={handleFavoriteToggle}
                            />
                        </div>
                        {favoriteError && <p className="mt-3 text-sm font-bold text-red-600">{favoriteError}</p>}

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatCard label="Giá thuê" value={formatCurrency(post.rentalPrice)} tone="emerald" />
                            <StatCard label="Diện tích" value={`${post.area} m2`} />
                            <StatCard label="Ngày đăng" value={formatDate(post.createdAt)} />
                            <StatCard label="Hết hạn" value={formatDate(post.endAt)} />
                        </div>

                        <div className="mt-6 rounded-lg bg-slate-50 p-4">
                            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Địa chỉ</span>
                            <p className="mt-2 text-base font-bold text-slate-900">{address || 'Đang cập nhật'}</p>
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-black text-slate-950">Mô tả chi tiết</h2>
                        <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
                            {post.description || 'Tin đăng chưa có mô tả chi tiết.'}
                        </p>
                    </section>
                </div>

                <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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
                        user={user}
                        postId={id}
                    />
                    <MapPanel address={address} />
                </aside>
            </div>

            {isReportModalOpen && (
                <ReportModal
                    onClose={() => setIsReportModalOpen(false)}
                    onSubmit={handleReportSubmit}
                    postTitle={post.title}
                    reportError={reportError}
                    reportSuccess={reportSuccess}
                    isSubmitting={isReportSubmitting}
                />
            )}
        </main>
    )
}

export default PostDetailPage
