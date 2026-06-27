import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import moderationApi from '../../api/moderationApi'
import postApi from '../../api/postApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, FilterBar, StatusBadge, ActionButton, Pagination, Toast, Modal } from '../../components/BackOfficeParts'
import { formatDateTime, formatMoney, formatRelativeTime, getErrorMessage, getAvatarUrl, formatStatusLabel } from '../../utils/backOfficeFormatters'

const MapPinIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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
const EyeOffIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
)
const EyeIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
)
const TrashIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
)
const ChevronUpIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
)
const ChevronDownIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
)

const statusTabs = [
    { value: 'PENDING', label: 'Chờ duyệt', variant: 'warning' },
    { value: 'ACTIVE', label: 'Đã duyệt', variant: 'success' },
    { value: 'HIDDEN', label: 'Ẩn', variant: 'neutral' },
    { value: 'EXPIRED', label: 'Hết hạn', variant: 'danger' },
    { value: '', label: 'Tất cả', variant: 'neutral' },
]

const getStatusVariant = (status) => {
    switch (status) {
        case 'PENDING': return 'warning'
        case 'ACTIVE': return 'success'
        case 'HIDDEN': return 'neutral'
        case 'EXPIRED': return 'danger'
        case 'REJECTED': return 'danger'
        case 'DELETED': return 'danger'
        default: return 'neutral'
    }
}

const ReasonModal = ({ isOpen, onClose, title, onConfirm, loading, children }) => {
    if (!isOpen) return null
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {children}
                <div className="flex gap-3 pt-2">
                    <ActionButton label="Hủy" variant="secondary" onClick={onClose} className="flex-1" />
                    <ActionButton label="Xác nhận" variant="danger" onClick={onConfirm} loading={loading} className="flex-1" />
                </div>
            </div>
        </Modal>
    )
}

const ImageIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
)

const ModerationPostsPage = () => {
    const [postTypes, setPostTypes] = useState([])
    const [filters, setFilters] = useState({ status: 'PENDING', postTypeId: '', keyword: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ posts: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [selectedPost, setSelectedPost] = useState(null)
    const [loading, setLoading] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [rejectingError, setRejectingError] = useState(null)
    const [toast, setToast] = useState(null)

    const [sortField, setSortField] = useState('createdAt')
    const [sortDir, setSortDir] = useState('desc')

    // Action states
    const [actionModal, setActionModal] = useState({ type: null, post: null, reason: '' })
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')

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
            showToast('error', getErrorMessage(loadError, 'Không tải được danh sách tin.'))
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

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('desc')
        }
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronDownIcon className="h-3 w-3 opacity-30" />
        return sortDir === 'asc'
            ? <ChevronUpIcon className="h-3 w-3 text-emerald-600" />
            : <ChevronDownIcon className="h-3 w-3 text-emerald-600" />
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

    const rejectPost = async () => {
        if (!actionModal.reason.trim()) {
            setActionError('Vui lòng nhập lý do từ chối.')
            return
        }
        setActionLoading(true)
        setActionError(null)
        try {
            await moderationApi.rejectPost(selectedPost.id, actionModal.reason)
            setSelectedPost(null)
            setActionModal({ type: null, post: null, reason: '' })
            showToast('success', 'Đã từ chối tin.')
            loadPosts()
        } catch (err) {
            setActionError(getErrorMessage(err, 'Không từ chối được tin.'))
        } finally {
            setActionLoading(false)
        }
    }

    const hidePost = async () => {
        if (!actionModal.reason.trim()) {
            setActionError('Vui lòng nhập lý do ẩn tin.')
            return
        }
        setActionLoading(true)
        setActionError(null)
        try {
            await moderationApi.hidePost(actionModal.post.id, actionModal.reason)
            setActionModal({ type: null, post: null, reason: '' })
            showToast('success', 'Đã ẩn tin đăng.')
            loadPosts()
        } catch (err) {
            setActionError(getErrorMessage(err, 'Không ẩn được tin.'))
        } finally {
            setActionLoading(false)
        }
    }

    const unhidePost = async (post) => {
        setActionLoading(true)
        try {
            await moderationApi.unhidePost(post.id)
            showToast('success', 'Đã hiện lại tin đăng.')
            loadPosts()
        } catch (err) {
            showToast('error', getErrorMessage(err, 'Không hiện được tin.'))
        } finally {
            setActionLoading(false)
        }
    }

    const removePost = async () => {
        if (!actionModal.reason.trim()) {
            setActionError('Vui lòng nhập lý do xóa tin.')
            return
        }
        setActionLoading(true)
        setActionError(null)
        try {
            await moderationApi.removePost(actionModal.post.id, actionModal.reason)
            setActionModal({ type: null, post: null, reason: '' })
            showToast('success', 'Đã xóa tin đăng.')
            loadPosts()
        } catch (err) {
            setActionError(getErrorMessage(err, 'Không xóa được tin.'))
        } finally {
            setActionLoading(false)
        }
    }

    const openActionModal = (type, post) => {
        setActionModal({ type, post, reason: '' })
        setActionError('')
    }

    const closeActionModal = () => {
        setActionModal({ type: null, post: null, reason: '' })
        setActionError('')
    }

    const handleFilter = (e) => {
        e.preventDefault()
        loadPosts({ ...filters, page: 0 })
    }

    const renderActionModal = () => {
        if (!actionModal.type) return null

        const titles = {
            reject: 'Từ chối tin đăng',
            hide: 'Ẩn tin đăng',
            remove: 'Xóa tin đăng',
        }

        const placeholders = {
            reject: 'Nhập lý do từ chối tin đăng...',
            hide: 'Nhập lý do ẩn tin đăng...',
            remove: 'Nhập lý do xóa tin đăng...',
        }

        return (
            <ReasonModal
                isOpen={true}
                onClose={closeActionModal}
                title={titles[actionModal.type]}
                onConfirm={
                    actionModal.type === 'reject' ? rejectPost :
                    actionModal.type === 'hide' ? hidePost :
                    removePost
                }
                loading={actionLoading}
            >
                {actionError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                        {actionError}
                    </div>
                )}
                <div>
                    <p className="mb-3 text-sm text-slate-600">
                        <strong>{actionModal.post?.title}</strong> (#{actionModal.post?.id})
                    </p>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Lý do <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors"
                        placeholder={placeholders[actionModal.type]}
                        value={actionModal.reason}
                        onChange={(e) => setActionModal((p) => ({ ...p, reason: e.target.value }))}
                        autoFocus
                    />
                </div>
            </ReasonModal>
        )
    }

    return (
        <BackOfficeLayout section="moderator" title="Quản lý tin đăng" subtitle="Xem và quản lý tất cả tin đăng — duyệt, ẩn, hiện hoặc xóa tin.">
            {/* Filter */}
            <FilterBar className="mb-5">
                {/* Status tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-[1.03] ${
                                filters.status === tab.value
                                    ? tab.variant === 'warning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' :
                                      tab.variant === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' :
                                      tab.variant === 'danger' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' :
                                      'bg-slate-900 text-white shadow-lg'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                            type="button"
                            onClick={() => {
                                const next = { ...filters, status: tab.value, page: 0 }
                                setFilters(next)
                                loadPosts(next)
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
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

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows rows={5} /></div>
                ) : pageData.posts.length === 0 ? (
                    <EmptyState message="Không có tin đăng phù hợp." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th
                                        className="px-4 py-3 cursor-pointer select-none hover:text-slate-700"
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Mã tin
                                            <SortIcon field="id" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Tin đăng</th>
                                    <th className="px-4 py-3">Loại</th>
                                    <th className="px-4 py-3">Giá</th>
                                    <th
                                        className="px-4 py-3 cursor-pointer select-none hover:text-slate-700"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Ngày đăng
                                            <SortIcon field="createdAt" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageData.posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="cursor-pointer transition-colors hover:bg-slate-50"
                                        onClick={() => openPost(post.id)}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                                #{post.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="font-bold text-slate-950 line-clamp-1">{post.title}</p>
                                            <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-400">
                                                <MapPinIcon className="h-3 w-3" />
                                                {post.district}, {post.province}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                                                <SafeImage
                                                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                                                    src={post.ownerAvatar}
                                                    fallbackSrc={getAvatarUrl(post.ownerName, 40)}
                                                    alt={post.ownerName}
                                                />
                                                <span>{post.ownerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-black"
                                                style={{
                                                    backgroundColor: post.postTypeTitleColor ? `${post.postTypeTitleColor}20` : '#fef3c7',
                                                    color: post.postTypeTitleColor || '#92400e',
                                                }}
                                            >
                                                {post.postTypeName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-bold text-emerald-600">{formatMoney(post.rentalPrice)}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                            {formatDateTime(post.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge
                                                label={formatStatusLabel(post.status)}
                                                variant={getStatusVariant(post.status)}
                                            />
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                {post.status === 'PENDING' && (
                                                    <>
                                                        <ActionButton
                                                            label=""
                                                            variant="success"
                                                            onClick={() => { openPost(post.id) }}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<CheckCircleIcon className="h-4 w-4" />}
                                                            title="Duyệt tin"
                                                        />
                                                        <ActionButton
                                                            label=""
                                                            variant="danger"
                                                            onClick={() => openActionModal('reject', post)}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<XCircleIcon className="h-4 w-4" />}
                                                            title="Từ chối"
                                                        />
                                                    </>
                                                )}
                                                {post.status === 'ACTIVE' && (
                                                    <>
                                                        <ActionButton
                                                            label=""
                                                            variant="neutral"
                                                            onClick={() => openActionModal('hide', post)}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<EyeOffIcon className="h-4 w-4" />}
                                                            title="Ẩn tin"
                                                        />
                                                        <ActionButton
                                                            label=""
                                                            variant="danger"
                                                            onClick={() => openActionModal('remove', post)}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<TrashIcon className="h-4 w-4" />}
                                                            title="Xóa tin"
                                                        />
                                                    </>
                                                )}
                                                {post.status === 'HIDDEN' && (
                                                    <>
                                                        <ActionButton
                                                            label=""
                                                            variant="success"
                                                            onClick={() => unhidePost(post)}
                                                            loading={actionLoading}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<EyeIcon className="h-4 w-4" />}
                                                            title="Hiện tin"
                                                        />
                                                        <ActionButton
                                                            label=""
                                                            variant="danger"
                                                            onClick={() => openActionModal('remove', post)}
                                                            className="h-8 w-8 !p-0 !rounded-lg"
                                                            icon={<TrashIcon className="h-4 w-4" />}
                                                            title="Xóa tin"
                                                        />
                                                    </>
                                                )}
                                                {(post.status === 'EXPIRED' || post.status === 'REJECTED') && (
                                                    <ActionButton
                                                        label=""
                                                        variant="danger"
                                                        onClick={() => openActionModal('remove', post)}
                                                        className="h-8 w-8 !p-0 !rounded-lg"
                                                        icon={<TrashIcon className="h-4 w-4" />}
                                                        title="Xóa tin"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const nextFilters = { ...filters, page }
                setFilters(nextFilters)
                loadPosts(nextFilters)
            }} />

            {/* Post Detail Modal */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onApprove={approvePost}
                    onReject={() => openActionModal('reject', selectedPost)}
                    rejecting={rejecting}
                    rejectingError={rejectingError}
                    onHide={() => openActionModal('hide', selectedPost)}
                    onUnhide={() => unhidePost(selectedPost)}
                    onRemove={() => openActionModal('remove', selectedPost)}
                    actionLoading={actionLoading}
                />
            )}

            {/* Action Modal */}
            {renderActionModal()}
        </BackOfficeLayout>
    )
}

const PostDetailModal = ({
    post, onClose, onApprove, onReject, rejecting, rejectingError,
    onHide, onUnhide, onRemove, actionLoading
}) => {
    const [selectedImage, setSelectedImage] = useState(0)

    if (!post) return null

    const images = post.imageUrls?.length > 0 ? post.imageUrls : []

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
                                post.status === 'HIDDEN' ? 'neutral' : 'danger'
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
                                        <>
                                            <button
                                                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                                type="button"
                                                onClick={() => setSelectedImage((s) => (s - 1 + images.length) % images.length)}
                                            >
                                                ‹
                                            </button>
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-black text-slate-700 shadow transition-all hover:scale-110 hover:bg-white active:scale-95"
                                                type="button"
                                                onClick={() => setSelectedImage((s) => (s + 1) % images.length)}
                                            >
                                                ›
                                            </button>
                                        </>
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

                        {/* Action card — PENDING */}
                        {post.status === 'PENDING' && (
                        <>
                        {rejectingError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                                {rejectingError}
                            </div>
                        )}

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Thao tác</h3>
                            <ActionButton
                                label="Duyệt tin"
                                variant="success"
                                onClick={onApprove}
                                className="w-full"
                                icon={<CheckCircleIcon className="h-4 w-4" />}
                            />
                            <ActionButton
                                label="Từ chối"
                                variant="danger"
                                onClick={onReject}
                                className="w-full"
                                icon={<XCircleIcon className="h-4 w-4" />}
                            />
                        </div>
                        </>
                        )}

                        {/* Action card — ACTIVE */}
                        {post.status === 'ACTIVE' && (
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Thao tác</h3>
                            <ActionButton
                                label="Ẩn tin"
                                variant="neutral"
                                onClick={onHide}
                                className="w-full"
                                icon={<EyeOffIcon className="h-4 w-4" />}
                            />
                            <ActionButton
                                label="Xóa tin"
                                variant="danger"
                                onClick={onRemove}
                                className="w-full"
                                icon={<TrashIcon className="h-4 w-4" />}
                            />
                        </div>
                        )}

                        {/* Action card — HIDDEN */}
                        {post.status === 'HIDDEN' && (
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Thao tác</h3>
                            <ActionButton
                                label="Hiện lại tin"
                                variant="success"
                                onClick={onUnhide}
                                loading={actionLoading}
                                className="w-full"
                                icon={<EyeIcon className="h-4 w-4" />}
                            />
                            <ActionButton
                                label="Xóa tin"
                                variant="danger"
                                onClick={onRemove}
                                className="w-full"
                                icon={<TrashIcon className="h-4 w-4" />}
                            />
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ModerationPostsPage
