import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/postFormatters'
import { getPostTypeTitleColor } from '../utils/postTypeStyles'

const normalizeText = (value = '') =>
    value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

const getPreviewImageLimit = (post) => {
    const typeName = normalizeText(post.postTypeName)

    if (post.postTypePriority === 1 || typeName.includes('noi bat')) {
        return 5
    }

    if (post.postTypePriority === 2 || typeName.includes('vip')) {
        return 3
    }

    return 1
}

const postStatusMeta = {
    ACTIVE: {
        label: 'Đang hoạt động',
        className: 'bg-emerald-100 text-emerald-800',
    },
    EXPIRED: {
        label: 'Đã hết hạn',
        className: 'bg-slate-200 text-slate-700',
    },
    PENDING: {
        label: 'Chờ duyệt',
        className: 'bg-amber-100 text-amber-800',
    },
    DRAFT: {
        label: 'Bản nháp',
        className: 'bg-blue-100 text-blue-800',
    },
    REJECTED: {
        label: 'Bị từ chối',
        className: 'bg-red-100 text-red-700',
    },
    HIDDEN: {
        label: 'Đã ẩn',
        className: 'bg-purple-100 text-purple-800',
    },
    DELETED: {
        label: 'Đã xóa',
        className: 'bg-zinc-200 text-zinc-700',
    },
}

const getPostStatusMeta = (status) =>
    postStatusMeta[String(status || '').toUpperCase()] || {
        label: 'Đang cập nhật',
        className: 'bg-slate-100 text-slate-700',
    }

const PostImageGallery = ({ post }) => {
    const limit = getPreviewImageLimit(post)
    const fallbackUrl = `https://picsum.photos/seed/taytro-${post.id}/900/650`
    const sourceImages = Array.isArray(post.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls
        : [post.thumbnailUrl].filter(Boolean)
    const previewImages = (sourceImages.length > 0 ? sourceImages : [fallbackUrl]).slice(0, limit)
    const showImageCount = previewImages.length > 1

    const renderImage = (src, index, className = '') => (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`} key={`${src}-${index}`}>
            <img
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                src={src}
                alt={`${post.title} - ảnh ${index + 1}`}
                loading="lazy"
            />
        </div>
    )

    const imageCountBadge = showImageCount && (
        <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-black text-white">
            {previewImages.length} ảnh
        </span>
    )

    if (previewImages.length === 1) {
        return (
            <Link to={`/posts/${post.id}`} className="relative block h-full min-h-56 bg-slate-100">
                {renderImage(previewImages[0], 0, 'h-full min-h-56')}
            </Link>
        )
    }

    if (previewImages.length === 2) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-64 grid-cols-2 gap-1 bg-slate-100 p-1"
            >
                {previewImages.map((imageUrl, index) => renderImage(imageUrl, index, 'min-h-64'))}
                {imageCountBadge}
            </Link>
        )
    }

    if (previewImages.length === 3) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-72 grid-cols-2 gap-1 bg-slate-100 p-1"
            >
                {renderImage(previewImages[0], 0, 'col-span-2 min-h-40 md:col-span-1 md:row-span-2 md:min-h-0')}
                {previewImages.slice(1).map((imageUrl, index) => renderImage(imageUrl, index + 1, 'min-h-28'))}
                {imageCountBadge}
            </Link>
        )
    }

    if (previewImages.length === 4) {
        return (
            <Link
                to={`/posts/${post.id}`}
                className="relative grid h-full min-h-72 grid-cols-2 gap-1 bg-slate-100 p-1"
            >
                {previewImages.map((imageUrl, index) => renderImage(imageUrl, index, 'min-h-36 md:min-h-0'))}
                {imageCountBadge}
            </Link>
        )
    }

    return (
        <Link
            to={`/posts/${post.id}`}
            className="relative grid h-full min-h-72 grid-cols-2 gap-1 bg-slate-100 p-1 md:grid-cols-3 md:grid-rows-2"
        >
            {renderImage(previewImages[0], 0, 'col-span-2 min-h-44 md:row-span-2 md:min-h-0')}
            {previewImages.slice(1).map((imageUrl, index) =>
                renderImage(imageUrl, index + 1, 'min-h-24 md:min-h-0')
            )}
            {imageCountBadge}
        </Link>
    )
}

const PostCard = ({ post }) => {
    const statusMeta = getPostStatusMeta(post.status)

    return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
            <PostImageGallery post={post} />

            <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link to={`/posts/${post.id}`} className="min-w-0 flex-1">
                        <h3
                            className="line-clamp-2 text-lg font-black leading-7 text-slate-950 transition hover:text-emerald-700"
                            style={{
                                color: getPostTypeTitleColor(post.postTypeName, post.postTypeTitleColor),
                                fontSize: post.postTypeTitleSize
                                    ? `${Math.min(post.postTypeTitleSize + 2, 22)}px`
                                    : undefined,
                            }}
                        >
                            {post.title}
                        </h3>
                    </Link>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusMeta.className}`}>
                            {statusMeta.label}
                        </span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            {post.postTypeName || 'Tin thường'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-emerald-50 p-3">
                        <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">Giá thuê</span>
                        <strong className="mt-1 block text-base text-emerald-800">{formatCurrency(post.rentalPrice)}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Diện tích</span>
                        <strong className="mt-1 block text-base text-slate-950">{post.area} m2</strong>
                    </div>
                    <div className="col-span-2 rounded-lg bg-slate-50 p-3 sm:col-span-1">
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Hết hạn</span>
                        <strong className="mt-1 block text-base text-slate-950">{formatDate(post.endAt)}</strong>
                    </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="min-w-0 text-sm text-slate-600">
                        <span className="block font-bold text-slate-800">Khu vực</span>
                        <p className="mt-1 line-clamp-2">
                            {post.district}, {post.province}
                        </p>
                    </div>

                    <Link
                        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 sm:w-auto"
                        to={`/posts/${post.id}`}
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </div>
    </article>
    )
}

export default PostCard
