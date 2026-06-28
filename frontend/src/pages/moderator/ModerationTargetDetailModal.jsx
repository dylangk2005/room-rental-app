import { formatDateTime, formatMoney, formatStatusLabel, formatPenaltyType, formatRole, formatTargetType, getAvatarUrl } from '../../utils/backOfficeFormatters'
import SafeImage from '../../components/common/SafeImage'
import { StatusBadge } from '../../components/BackOfficeParts'

const InfoBox = ({ label, value }) => (
    <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-900">{value || '-'}</p>
    </div>
)

const UserCard = ({ title, user, variant = 'default' }) => {
    if (!user) return null
    const borderColor = variant === 'reporter'
        ? 'border-blue-100 bg-blue-50/30'
        : variant === 'reported'
          ? 'border-red-100 bg-red-50/30'
          : 'border-slate-100 bg-white'

    return (
        <div className={`rounded-2xl border p-4 ${borderColor}`}>
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</h4>
            <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                    <SafeImage
                        className="h-10 w-10 shrink-0 rounded-2xl object-cover"
                        src={user.avatar}
                        fallbackSrc={getAvatarUrl(user.fullName, 80)}
                        alt={user.fullName}
                    />
                    <div>
                        <p className="text-sm font-black text-slate-950">{user.fullName || '-'}</p>
                        <p className="text-xs font-semibold text-slate-500">{user.email || '-'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <InfoBox label="Số điện thoại" value={user.phoneNumber} />
                    <InfoBox label="Trạng thái" value={formatStatusLabel(user.status)} />
                    <InfoBox label="Vai trò" value={formatRole(user.role)} />
                    <InfoBox label="Ngày tạo" value={formatDateTime(user.createdAt)} />
                </div>
            </div>
        </div>
    )
}

const PostCard = ({ post }) => {
    if (!post) return null

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Bài đăng liên quan</h4>
            <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h5 className="text-lg font-black text-slate-950">{post.title || `Bài đăng #${post.id}`}</h5>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{[post.address, post.district, post.province].filter(Boolean).join(', ') || '-'}</p>
                    </div>
                    <StatusBadge label={formatStatusLabel(post.status)} variant={
                        post.status === 'ACTIVE' ? 'success' :
                        post.status === 'HIDDEN' ? 'warning' :
                        post.status === 'PENDING' ? 'amber' :
                        'neutral'
                    } />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <InfoBox label="Giá thuê" value={post.rentalPrice ? formatMoney(post.rentalPrice) : '-'} />
                    <InfoBox label="Diện tích" value={post.area ? `${post.area} m2` : '-'} />
                    <InfoBox label="Loại tin" value={post.postTypeName} />
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
                    {post.description || 'Không có mô tả.'}
                </p>

                {post.imageUrls?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {post.imageUrls.slice(0, 4).map((url) => (
                            <SafeImage
                                className="h-32 w-full rounded-xl object-cover"
                                key={url}
                                src={url}
                                fallbackSrc="https://picsum.photos/seed/post-ev/400/300"
                                alt="Ảnh bài đăng"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const ReportCard = ({ report }) => {
    if (!report) return null

    return (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-red-700">Thông tin báo cáo</h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <InfoBox label="Mã báo cáo" value={`#${report.id}`} />
                <InfoBox label="Trạng thái" value={formatStatusLabel(report.status)} />
                <InfoBox label="Lý do" value={report.reason} />
                <InfoBox label="Ngày báo cáo" value={formatDateTime(report.createdAt)} />
            </div>
            <div className="mt-3 rounded-xl border border-red-200 bg-white p-4">
                <p className="text-sm font-semibold leading-relaxed text-slate-700">
                    {report.description || 'Không có mô tả thêm.'}
                </p>
            </div>
            {report.resolutionNote && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-700">Kết quả xử lý</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">{report.resolutionNote}</p>
                </div>
            )}
            {report.imageUrls?.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {report.imageUrls.slice(0, 3).map((url) => (
                        <SafeImage
                            className="h-20 w-full rounded-xl object-cover"
                            key={url}
                            src={url}
                            fallbackSrc="https://picsum.photos/seed/report-ev-thumb/200/200"
                            alt="Bằng chứng báo cáo"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const PenaltyBlock = ({ penalties = [] }) => {
    const items = Array.isArray(penalties) ? penalties : []
    if (!items.length) return null

    const variantClass = (type) =>
        type === 'WARNING' ? 'border-amber-200 bg-amber-50/50 text-amber-800' :
        type === 'LOCK_POST' ? 'border-orange-200 bg-orange-50/50 text-orange-800' :
        'border-red-200 bg-red-50/50 text-red-800'

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Lịch sử xử phạt</h4>
            <div className="mt-3 space-y-2">
                {items.map((penalty) => (
                    <div key={penalty.id} className={`rounded-xl border p-3 ${variantClass(penalty.type)}`}>
                        <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-black">{formatPenaltyType(penalty.type)}</strong>
                            <span className="text-xs font-semibold opacity-70">{formatDateTime(penalty.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">{penalty.reason || '-'}</p>
                        <p className="mt-1 text-xs font-semibold opacity-70">
                            Hiệu lực: {formatDateTime(penalty.startDate)} — {penalty.endDate ? formatDateTime(penalty.endDate) : 'Vĩnh viễn'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

const ModerationTargetDetailModal = ({ detail, loading, error, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-3 sm:px-5 sm:py-5" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <style>{`
            @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
            .modal-animate { animation: modalIn 0.25s ease-out forwards; }
        `}</style>
        <div
            className="flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl modal-animate sm:h-[calc(100vh-3rem)]"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M9 15l2 2 4-4" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Chi tiết kiểm duyệt</p>
                        <h2 className="mt-0.5 text-xl font-black text-slate-950">
                            {formatTargetType(detail?.targetType) || 'Đối tượng'} {detail?.targetId ? `#${detail.targetId}` : ''}
                        </h2>
                    </div>
                </div>
                <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl font-black text-slate-400 transition-all duration-150 hover:scale-105 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    ×
                </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-5">
                {loading && (
                    <div className="space-y-4">
                        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                        <p className="text-sm font-bold text-red-700">{error}</p>
                    </div>
                )}

                {!loading && !error && detail && (detail.report || detail.post || detail.user) && (
                    <div className="space-y-4">
                        {/* Report section */}
                        {detail.report && (
                            <div className="grid gap-4 lg:grid-cols-2">
                                <ReportCard report={detail.report} />
                                {detail.report?.reporter && (
                                    <UserCard title="Người báo cáo" user={detail.report.reporter} variant="reporter" />
                                )}
                            </div>
                        )}

                        {/* Post section */}
                        {detail.post && (
                            <PostCard post={detail.post} />
                        )}

                        {/* Post owner */}
                        {(detail.report?.postOwner || detail.post?.owner || detail.user) && (
                            <UserCard
                                title={detail.post ? 'Chủ bài đăng' : detail.report ? 'Người bị báo cáo' : 'Người dùng'}
                                user={detail.report?.postOwner || detail.post?.owner || detail.user}
                                variant="reported"
                            />
                        )}

                        {/* Moderator */}
                        {detail.report?.moderator && (
                            <UserCard title="Kiểm duyệt viên xử lý" user={detail.report.moderator} variant="default" />
                        )}

                        {/* Penalties */}
                        {detail.penalties && (
                            <PenaltyBlock penalties={detail.penalties} />
                        )}
                    </div>
                )}

                {!loading && !error && detail && !(detail.report || detail.post || detail.user) && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Không có dữ liệu chi tiết cho đối tượng này.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 text-right">
                <button
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                    type="button"
                    onClick={onClose}
                >
                    Đóng
                </button>
            </div>
        </div>
    </div>
)

export default ModerationTargetDetailModal
