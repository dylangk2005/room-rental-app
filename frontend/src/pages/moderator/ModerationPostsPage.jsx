import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import moderationApi from '../../api/moderationApi'
import postApi from '../../api/postApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, FilterBar, StatusBadge, ActionButton, Pagination, Toast } from '../../components/BackOfficeParts'
import { formatDateTime, formatMoney, formatRelativeTime, getErrorMessage, getAvatarUrl, formatStatusLabel } from '../../utils/backOfficeFormatters'

const MapPinIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
)
const RulerIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
)
const CheckCircleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
)
const XCircleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
)
const ImageIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
)

const PostCard = ({ post, onClick }) => (
    <button
        className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:scale-[1.01] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 active:scale-[0.995]"
        type="button"
        onClick={onClick}
    >
        <div className="flex items-center gap-4">
            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500 mt-0.5">#{post.id}</span>
                        <h3 className="line-clamp-1 text-base font-black text-slate-950 transition-colors group-hover:text-emerald-700">{post.title}</h3>
                    </div>
                    <StatusBadge
                        label={formatStatusLabel(post.status)}
                        variant={post.status === 'PENDING' ? 'warning' : post.status === 'ACTIVE' ? 'success' : post.status === 'HIDDEN' ? 'neutral' : 'danger'}
                    />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{post.district}, {post.province}</span>
                    <span className="flex items-center gap-1"><RulerIcon className="h-3 w-3" />{post.area} m2</span>
                    <span className="font-black text-emerald-600">{formatMoney(post.rentalPrice)}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
                    <span
                        className="inline-flex rounded-full px-2.5 py-0.5 font-black"
                        style={{
                            backgroundColor: post.postTypeTitleColor ? `${post.postTypeTitleColor}20` : '#fef3c7',
                            color: post.postTypeTitleColor || '#92400e',
                        }}
                    >
                        {post.postTypeName}
                    </span>
                    <SafeImage
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                        src={post.ownerAvatar}
                        fallbackSrc={getAvatarUrl(post.ownerName, 40)}
                        alt={post.ownerName}
                    />
                    <span>{post.ownerName}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex shrink-0 items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all duration-200 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </span>
            </div>
        </div>
    </button>
)

const PostDetailModal = ({ post, onClose, onApprove, onReject, rejecting, rejectingError }) => {
    const [selectedImage, setSelectedImage] = useState(0)
    const [rejectMode, setRejectMode] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [approving, setApproving] = useState(false)

    if (!post) return null

    const images = post.imageUrls?.length > 0 ? post.imageUrls : []

    const handleApprove = async () => {
        setApproving(true)
        await onApprove()
        setApproving(false)
    }

    const handleReject = async (e) => {
        e.preventDefault()
        if (!rejectReason.trim()) return
        await onReject(rejectReason)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-4 sm:px-4 sm:py-8" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <style>{`
                @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .modal-animate { animation: modalIn 0.25s ease-out forwards; }
            `}</style>
            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl modal-animate" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge label={formatStatusLabel(post.status)} variant={
                                post.status === 'PENDING' ? 'warning' :
                                post.status === 'ACTIVE' ? 'success' :
                                post.status === 'HIDDEN' ? 'neutral' :
                                'danger'
                            } />
                            <span
                                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-black"
                                style={{ backgroundColor: `${post.postTypeTitleColor}20`, color: post.postTypeTitleColor || '#92400e' }}
                            >
                                {post.postTypeName}
                            </span>
                        </div>
                        <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                            <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-base font-black text-slate-500 align-middle">#{post.id}</span>
                            {post.title}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {post.address ? `${post.address}, ` : ''}{post.district}, {post.province}
                        </p>
                    </div>
                    <button
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl font-black text-slate-400 transition-all duration-150 hover:scale-105 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="grid max-h-[calc(100vh-14rem)] gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Left */}
                    <div className="space-y-5">
                        {/* Image gallery */}
                        {images.length > 0 ? (
                            <div className="space-y-3">
                                <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
                                    <SafeImage
                                        className="h-full w-full object-cover"
                                        src={images[selectedImage]}
                                        fallbackSrc="https://picsum.photos/seed/post-detail/800/500"
                                        alt={post.title}
                                    />
                                    {images.length > 1 && (
                                        <button
                                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                            type="button"
                                            onClick={() => setSelectedImage((s) => (s - 1 + images.length) % images.length)}
                                        >
                                            ‹
                                        </button>
                                    )}
                                    {images.length > 1 && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                            type="button"
                                            onClick={() => setSelectedImage((s) => (s + 1) % images.length)}
                                        >
                                            ›
                                        </button>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {images.map((url, idx) => (
                                            <button
                                                key={idx}
                                                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${idx === selectedImage ? 'border-emerald-500 shadow-md' : 'border-transparent hover:border-slate-200'}`}
                                                type="button"
                                                onClick={() => setSelectedImage(idx)}
                                            >
                                                <SafeImage className="h-full w-full object-cover" src={url} fallbackSrc="https://picsum.photos/seed/post-thumb/100/100" alt="" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-100">
                                <div className="text-center text-slate-400">
                                    <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                                    <p className="text-sm font-semibold">Không có ảnh</p>
                                </div>
                            </div>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Giá thuê</p>
                                <p className="mt-1 text-base font-black text-emerald-600">{formatMoney(post.rentalPrice)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Diện tích</p>
                                <p className="mt-1 text-base font-black text-slate-950">{post.area} m2</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ảnh</p>
                                <p className="mt-1 text-base font-black text-slate-950">{images.length}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="rounded-xl border border-slate-200 p-4">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Mô tả</h3>
                            <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-700">
                                {post.description || 'Không có mô tả.'}
                            </p>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">
                        {/* Owner card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Người đăng</h3>
                            <div className="mt-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <SafeImage
                                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                                    src={post.ownerAvatar}
                                    fallbackSrc={getAvatarUrl(post.ownerName, 80)}
                                    alt={post.ownerName}
                                />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-950">{post.ownerName || '-'}</p>
                                        <p className="truncate text-xs font-semibold text-slate-500">{post.ownerEmail || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-500">Số điện thoại</span>
                                        <span className="font-bold text-slate-700">{post.ownerPhoneNumber || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-500">Mã tài khoản</span>
                                        <span className="font-bold text-slate-700">#{post.ownerId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-500">Ngày đăng</span>
                                        <span className="font-bold text-slate-700">{formatDateTime(post.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action card — chỉ hiển thị khi tin đang chờ duyệt */}
                        {post.status === 'PENDING' && (
                        <>
                        {rejectingError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                                {rejectingError}
                            </div>
                        )}

                        {!rejectMode ? (
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Thao tác</h3>
                                <ActionButton
                                    label="Duyệt tin"
                                    variant="success"
                                    onClick={handleApprove}
                                    loading={approving}
                                    className="w-full"
                                    icon={<CheckCircleIcon className="h-4 w-4" />}
                                />
                                <ActionButton
                                    label="Từ chối"
                                    variant="danger"
                                    onClick={() => setRejectMode(true)}
                                    className="w-full"
                                    icon={<XCircleIcon className="h-4 w-4" />}
                                />
                            </div>
                        ) : (
                            <form className="rounded-2xl border border-red-200 bg-red-50 p-4" onSubmit={handleReject}>
                                <h3 className="text-sm font-black text-red-900">Lý do từ chối</h3>
                                <textarea
                                    className="mt-3 min-h-28 w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                                    placeholder="Nhập lý do từ chối tin đăng này..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    required
                                />
                                <div className="mt-3 flex gap-2">
                                    <ActionButton
                                        label="Gửi"
                                        variant="danger"
                                        type="submit"
                                        loading={rejecting}
                                        disabled={!rejectReason.trim()}
                                        className="flex-1"
                                    />
                                    <ActionButton
                                        label="Hủy"
                                        variant="secondary"
                                        type="button"
                                        onClick={() => { setRejectMode(false); setRejectReason('') }}
                                        className="flex-1"
                                    />
                                </div>
                            </form>
                        )}
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ModerationPostsPage = () => {
    const [postTypes, setPostTypes] = useState([])
    const [filters, setFilters] = useState({ status: 'PENDING', postTypeId: '', keyword: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ posts: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [selectedPost, setSelectedPost] = useState(null)
    const [loading, setLoading] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [rejectingError, setRejectingError] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const loadPosts = async (nextFilters = filters) => {
        setLoading(true)
        try {
            const response = await moderationApi.getPendingPosts({
                status: nextFilters.status || null,
                postTypeId: nextFilters.postTypeId || null,
                keyword: nextFilters.keyword ? parseInt(nextFilters.keyword) : null,
                page: nextFilters.page,
                size: nextFilters.size,
            })
            const data = response.data
            setPageData(data || { posts: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            showToast('error', getErrorMessage(loadError, 'Không tải được tin chờ duyệt.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        flushSync(() => { loadPosts() })
        postApi.getPostTypes().then((response) => setPostTypes(response.data || [])).catch(() => setPostTypes([]))
    }, [])

    const openPost = async (id) => {
        try {
            const response = await moderationApi.getPostDetail(id)
            setSelectedPost(response.data)
        } catch {
            showToast('error', 'Không tải được chi tiết tin.')
        }
    }

    const approvePost = async () => {
        try {
            await moderationApi.approvePost(selectedPost.id)
            setSelectedPost(null)
            showToast('success', 'Duyệt tin thành công!')
            loadPosts()
        } catch (approveError) {
            showToast('error', getErrorMessage(approveError, 'Không duyệt được tin.'))
        }
    }

    const rejectPost = async (reason) => {
        setRejectingError(null)
        setRejecting(true)
        try {
            await moderationApi.rejectPost(selectedPost.id, reason)
            setSelectedPost(null)
            showToast('success', 'Đã từ chối tin.')
            loadPosts()
        } catch (rejectError) {
            const msg = getErrorMessage(rejectError, 'Không từ chối được tin.')
            setRejectingError(msg)
        } finally {
            setRejecting(false)
        }
    }

    const handleFilter = (e) => {
        e.preventDefault()
        loadPosts({ ...filters, page: 0 })
    }

    return (
        <BackOfficeLayout section="moderator" title="Duyệt tin đăng" subtitle="Xem và kiểm duyệt các tin đăng đang chờ phê duyệt.">
            {/* Filter */}
            <FilterBar className="mb-5">
                {/* Status pills */}
                <div className="flex gap-2">
                    <button
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-[1.03] ${
                            filters.status === 'PENDING'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        type="button"
                        onClick={() => { const next = { ...filters, status: 'PENDING', page: 0 }; setFilters(next); loadPosts(next) }}
                    >Chờ duyệt</button>
                    <button
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-[1.03] ${
                            filters.status === ''
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        type="button"
                        onClick={() => { const next = { ...filters, status: '', page: 0 }; setFilters(next); loadPosts(next) }}
                    >Tất cả</button>
                </div>

                {/* Post type dropdown */}
                <select
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 sm:max-w-48 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                    value={filters.postTypeId}
                    onChange={(e) => setFilters((f) => ({ ...f, postTypeId: e.target.value }))}
                >
                    <option value="">Tất cả loại tin</option>
                    {postTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>

                {/* Keyword search */}
                <input
                    type="text"
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 sm:max-w-48 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors placeholder:text-slate-400"
                    placeholder="Tìm theo mã tin..."
                    value={filters.keyword}
                    onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(e) }}
                />

                <button
                    className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                    type="button"
                    onClick={handleFilter}
                >
                    Lọc
                </button>
            </FilterBar>

            {/* Toast */}
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Post list */}
            <div className="space-y-3">
                {loading ? (
                    <LoadingRows rows={4} />
                ) : pageData.posts.length === 0 ? (
                    <EmptyState message="Không có tin chờ duyệt." />
                ) : (
                    pageData.posts.map((post) => (
                        <PostCard key={post.id} post={post} onClick={() => openPost(post.id)} />
                    ))
                )}
            </div>

            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const nextFilters = { ...filters, page }
                setFilters(nextFilters)
                loadPosts(nextFilters)
            }} />

            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onApprove={approvePost}
                    onReject={rejectPost}
                    rejecting={rejecting}
                    rejectingError={rejectingError}
                />
            )}
        </BackOfficeLayout>
    )
}

export default ModerationPostsPage
