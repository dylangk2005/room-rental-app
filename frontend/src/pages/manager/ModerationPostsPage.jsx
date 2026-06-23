import { useEffect, useState } from 'react'
import moderationApi from '../../api/moderationApi'
import postApi from '../../api/postApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import SafeImage from '../../components/common/SafeImage'
import { EmptyState, LoadingRows, Message, Pagination } from '../../components/BackOfficeParts'
import { formatDateTime, formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const ModerationPostsPage = () => {
    const [postTypes, setPostTypes] = useState([])
    const [filters, setFilters] = useState({ postTypeId: '', page: 0, size: 10 })
    const [pageData, setPageData] = useState({ posts: [], currentPage: 0, totalPages: 0, totalElements: 0 })
    const [selectedPost, setSelectedPost] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadPosts = async (nextFilters = filters) => {
        setLoading(true)
        setError('')
        try {
            const response = await moderationApi.getPendingPosts(nextFilters)
            setPageData(response.data || { posts: [], currentPage: 0, totalPages: 0, totalElements: 0 })
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được tin chờ duyệt.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPosts()
        postApi.getPostTypes().then((response) => setPostTypes(response.data || [])).catch(() => setPostTypes([]))
    }, [])

    const openPost = async (id) => {
        setError('')
        try {
            const response = await moderationApi.getPostDetail(id)
            setSelectedPost(response.data)
            setRejectReason('')
        } catch (detailError) {
            setError(getErrorMessage(detailError, 'Không tải được chi tiết tin.'))
        }
    }

    const approvePost = async (id) => {
        setMessage('')
        setError('')
        try {
            await moderationApi.approvePost(id)
            setSelectedPost(null)
            setMessage('Duyệt tin thành công.')
            loadPosts()
        } catch (approveError) {
            setError(getErrorMessage(approveError, 'Không duyệt được tin.'))
        }
    }

    const rejectPost = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        try {
            await moderationApi.rejectPost(selectedPost.id, rejectReason)
            setSelectedPost(null)
            setRejectReason('')
            setMessage('Từ chối tin thành công.')
            loadPosts()
        } catch (rejectError) {
            setError(getErrorMessage(rejectError, 'Không từ chối được tin.'))
        }
    }

    return (
        <BackOfficeLayout section="manager" title="Duyệt tin đăng" subtitle="Xem danh sách tin đang chờ và phê duyệt hoặc từ chối.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[240px_auto]" onSubmit={(event) => {
                event.preventDefault()
                const nextFilters = { ...filters, page: 0 }
                setFilters(nextFilters)
                loadPosts(nextFilters)
            }}>
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={filters.postTypeId} onChange={(event) => setFilters((current) => ({ ...current, postTypeId: event.target.value }))}>
                    <option value="">Tất cả loại tin</option>
                    {postTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <button className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-black text-white md:w-fit" type="submit">Lọc</button>
            </form>

            <div className="mt-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : pageData.posts.length === 0 ? (
                    <EmptyState message="Không có tin chờ duyệt." />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {pageData.posts.map((post) => (
                            <button className="block w-full p-4 text-left hover:bg-slate-50" key={post.id} type="button" onClick={() => openPost(post.id)}>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-base font-black text-slate-950">{post.title}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">{post.district}, {post.province} | {post.area} m2 | {formatMoney(post.rentalPrice)}</p>
                                    </div>
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{post.postTypeName}</span>
                                </div>
                                <p className="mt-2 text-xs font-semibold text-slate-500">Chủ tin: {post.ownerName} | {formatDateTime(post.createdAt)} | {post.imageCount} ảnh</p>
                            </button>
                        ))}
                    </div>
                )}
            </section>
            <Pagination pageInfo={pageData} onPageChange={(page) => {
                const nextFilters = { ...filters, page }
                setFilters(nextFilters)
                loadPosts(nextFilters)
            }} />

            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-4 sm:px-4 sm:py-8">
                    <div className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                            <div>
                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                    {selectedPost.status || 'PENDING'}
                                </span>
                                <h2 className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">{selectedPost.title}</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedPost.address}, {selectedPost.district}, {selectedPost.province}</p>
                            </div>
                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setSelectedPost(null)}>Đóng</button>
                        </div>
                        <div className="grid max-h-[calc(100vh-9rem)] gap-5 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-5">
                            <div className="space-y-5">
                                {selectedPost.imageUrls?.length > 0 && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {selectedPost.imageUrls.map((url) => <SafeImage className="h-56 w-full rounded-lg object-cover" key={url} src={url} fallbackSrc="https://picsum.photos/seed/mod-post/640/420" alt={selectedPost.title} />)}
                                    </div>
                                )}
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Giá</p><p className="font-black">{formatMoney(selectedPost.rentalPrice)}</p></div>
                                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Diện tích</p><p className="font-black">{selectedPost.area} m2</p></div>
                                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Loại tin</p><p className="font-black">{selectedPost.postTypeName}</p></div>
                                </div>
                                <section>
                                    <h3 className="text-sm font-black uppercase text-slate-500">Mô tả tin</h3>
                                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-700">{selectedPost.description || '-'}</p>
                                </section>
                            </div>

                            <aside className="space-y-4">
                                <section className="rounded-lg border border-slate-200 bg-white p-4">
                                    <h3 className="text-base font-black text-slate-950">Người đăng</h3>
                                    <div className="mt-3 grid gap-3">
                                        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Họ tên</p><p className="break-words font-black">{selectedPost.ownerName || '-'}</p></div>
                                        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Email</p><p className="break-words font-black">{selectedPost.ownerEmail || '-'}</p></div>
                                        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Số điện thoại</p><p className="break-words font-black">{selectedPost.ownerPhoneNumber || '-'}</p></div>
                                        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">User ID</p><p className="break-words font-black">{selectedPost.ownerId ? `#${selectedPost.ownerId}` : '-'}</p></div>
                                    </div>
                                </section>
                                <form className="rounded-lg border border-red-200 bg-red-50 p-4" onSubmit={rejectPost}>
                                    <label className="text-sm font-black text-red-900" htmlFor="rejectReason">Lý do từ chối</label>
                                    <textarea id="rejectReason" className="mt-2 min-h-28 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} required />
                                    <div className="mt-3 grid gap-2">
                                        <button className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white" type="button" onClick={() => approvePost(selectedPost.id)}>Duyệt tin</button>
                                        <button className="h-11 rounded-lg bg-red-600 px-4 text-sm font-black text-white" type="submit">Từ chối</button>
                                    </div>
                                </form>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </BackOfficeLayout>
    )
}

export default ModerationPostsPage
