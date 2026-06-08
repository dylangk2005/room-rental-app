import { formatDateTime, formatMoney } from '../../utils/backOfficeFormatters'

const InfoBox = ({ label, value }) => (
    <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-black uppercase text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-900">{value || '-'}</p>
    </div>
)

const UserBlock = ({ title, user }) => {
    if (!user) return null

    return (
        <section>
            <h3 className="text-sm font-black uppercase text-slate-500">{title}</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Họ tên" value={user.fullName} />
                <InfoBox label="Email" value={user.email} />
                <InfoBox label="Số điện thoại" value={user.phoneNumber} />
                <InfoBox label="Trạng thái" value={user.status} />
                <InfoBox label="Vai trò" value={user.role} />
                <InfoBox label="Ngày tạo" value={formatDateTime(user.createdAt)} />
            </div>
        </section>
    )
}

const PostBlock = ({ post }) => {
    if (!post) return null

    return (
        <section>
            <h3 className="text-sm font-black uppercase text-slate-500">Bài đăng liên quan</h3>
            <div className="mt-2 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h4 className="text-lg font-black text-slate-950">{post.title || `Bài đăng #${post.id}`}</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {post.address || '-'}, {post.district || '-'}, {post.province || '-'}
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {post.status || '-'}
                    </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <InfoBox label="Giá thuê" value={post.rentalPrice ? formatMoney(post.rentalPrice) : '-'} />
                    <InfoBox label="Diện tích" value={post.area ? `${post.area} m2` : '-'} />
                    <InfoBox label="Loại tin" value={post.postTypeName} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                    {post.description || 'Bài đăng chưa có mô tả.'}
                </p>
                {post.imageUrls?.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {post.imageUrls.map((url) => (
                            <img className="h-44 w-full rounded-lg object-cover" key={url} src={url} alt="Ảnh bài đăng" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

const ReportBlock = ({ report }) => {
    if (!report) return null

    return (
        <section>
            <h3 className="text-sm font-black uppercase text-slate-500">Thông tin báo cáo</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Mã báo cáo" value={`#${report.id}`} />
                <InfoBox label="Trạng thái" value={report.status} />
                <InfoBox label="Lý do báo cáo" value={report.reason} />
                <InfoBox label="Ngày báo cáo" value={formatDateTime(report.createdAt)} />
            </div>
            <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">
                {report.description || 'Không có mô tả thêm.'}
            </div>
            {report.resolutionNote && (
                <div className="mt-3 rounded-lg bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
                    Kết quả xử lý: {report.resolutionNote}
                </div>
            )}
            {report.imageUrls?.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {report.imageUrls.map((url) => (
                        <img className="h-44 w-full rounded-lg object-cover" key={url} src={url} alt="Ảnh bằng chứng báo cáo" />
                    ))}
                </div>
            )}
        </section>
    )
}

const ReporterColumn = ({ report }) => {
    if (!report) return null

    return (
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase text-emerald-700">Người báo cáo</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">
                        {report.reporter?.fullName || 'Người báo cáo'}
                    </h3>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                        {report.reporter?.email || '-'}
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {report.status || '-'}
                </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Mã báo cáo" value={`#${report.id}`} />
                <InfoBox label="Ngày báo cáo" value={formatDateTime(report.createdAt)} />
                <InfoBox label="Số điện thoại" value={report.reporter?.phoneNumber} />
                <InfoBox label="Vai trò" value={report.reporter?.role} />
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-black uppercase text-red-700">Lý do báo cáo</p>
                <p className="mt-2 text-lg font-black leading-7 text-red-950">{report.reason || '-'}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-red-900">
                    {report.description || 'Không có mô tả thêm.'}
                </p>
            </div>

            {report.resolutionNote && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
                    <span className="font-black">Kết quả xử lý:</span> {report.resolutionNote}
                </div>
            )}

            {report.imageUrls?.length > 0 && (
                <div className="mt-4 grid gap-3">
                    {report.imageUrls.map((url) => (
                        <img className="max-h-72 w-full rounded-lg object-contain" key={url} src={url} alt="Ảnh bằng chứng báo cáo" />
                    ))}
                </div>
            )}
        </section>
    )
}

const ReportedColumn = ({ detail }) => {
    const post = detail?.post
    const reportedUser = detail?.report?.postOwner || post?.owner || detail?.user
    const isPostReport = Boolean(post)

    return (
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-4">
            {isPostReport ? (
                <>
                    <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase text-slate-500">Bài đăng bị báo cáo</p>
                                <h4 className="mt-1 text-lg font-black text-slate-950">{post.title || `Bài đăng #${post.id}`}</h4>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {post.address || '-'}, {post.district || '-'}, {post.province || '-'}
                                </p>
                            </div>
                            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                {post.status || '-'}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <InfoBox label="Giá thuê" value={post.rentalPrice ? formatMoney(post.rentalPrice) : '-'} />
                            <InfoBox label="Diện tích" value={post.area ? `${post.area} m2` : '-'} />
                            <InfoBox label="Loại tin" value={post.postTypeName} />
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {post.description || 'Bài đăng chưa có mô tả.'}
                        </p>

                        {post.imageUrls?.length > 0 && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {post.imageUrls.map((url) => (
                                    <img className="h-56 w-full rounded-lg object-cover" key={url} src={url} alt="Ảnh bài đăng bị báo cáo" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5">
                        <p className="text-xs font-black uppercase text-slate-500">Thuộc về</p>
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-black text-slate-950">
                                        {reportedUser?.fullName || 'Chủ bài đăng'}
                                    </h3>
                                    <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                                        {reportedUser?.email || '-'}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                    {reportedUser?.status || '-'}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <InfoBox label="Họ tên" value={reportedUser?.fullName} />
                                <InfoBox label="Email" value={reportedUser?.email} />
                                <InfoBox label="Số điện thoại" value={reportedUser?.phoneNumber} />
                                <InfoBox label="Vai trò" value={reportedUser?.role} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-500">Người bị báo cáo</p>
                            <h3 className="mt-1 text-xl font-black text-slate-950">
                                {reportedUser?.fullName || 'Người bị báo cáo'}
                            </h3>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                                {reportedUser?.email || '-'}
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            {reportedUser?.status || '-'}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoBox label="Họ tên" value={reportedUser?.fullName} />
                        <InfoBox label="Email" value={reportedUser?.email} />
                        <InfoBox label="Số điện thoại" value={reportedUser?.phoneNumber} />
                        <InfoBox label="Vai trò" value={reportedUser?.role} />
                    </div>
                </>
            )}
        </section>
    )
}

const ReportComparisonLayout = ({ detail }) => (
    <div className="grid min-h-full gap-5 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
        <ReporterColumn report={detail.report} />
        <ReportedColumn detail={detail} />
    </div>
)

const PenaltyBlock = ({ penalties = [] }) => {
    const items = Array.isArray(penalties) ? penalties : []

    if (!items.length) return null

    return (
        <section>
            <h3 className="text-sm font-black uppercase text-slate-500">Lịch sử xử phạt gần đây</h3>
            <div className="mt-2 space-y-2">
                {items.map((penalty) => (
                    <div className="rounded-lg border border-slate-200 p-3" key={penalty.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-sm text-slate-950">{penalty.type}</strong>
                            <span className="text-xs font-bold text-slate-500">{formatDateTime(penalty.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-600">{penalty.reason || '-'}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Hiệu lực: {formatDateTime(penalty.startDate)} - {penalty.endDate ? formatDateTime(penalty.endDate) : 'Vĩnh viễn/không giới hạn'}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}

const ModerationTargetDetailModal = ({ detail, loading, error, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex h-[calc(100vh-2rem)] w-full max-w-[min(96vw,1500px)] flex-col rounded-lg bg-white shadow-xl sm:h-[calc(100vh-3rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                    <p className="text-xs font-black uppercase text-emerald-700">Chi tiết đối tượng kiểm duyệt</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {detail?.targetType || 'Đối tượng'} {detail?.targetId ? `#${detail.targetId}` : ''}
                    </h2>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-black text-slate-500 hover:bg-slate-100 hover:text-slate-900" type="button" onClick={onClose} aria-label="Đóng">
                    ×
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
                {loading && <div className="h-40 animate-pulse rounded-lg bg-slate-100" />}
                {!loading && error && <div className="rounded-lg bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
                {!loading && !error && detail && (detail.report || detail.post || detail.user) && (
                    detail.report ? (
                        <ReportComparisonLayout detail={detail} />
                    ) : (
                        <div className="space-y-6 rounded-lg bg-white p-4">
                            <ReportBlock report={detail.report} />
                            <UserBlock title="Người báo cáo" user={detail.report?.reporter} />
                            <PostBlock post={detail.post} />
                            <UserBlock title="Chủ bài đăng" user={detail.report?.postOwner || detail.post?.owner} />
                            <UserBlock title="Người bị xử lý" user={detail.targetType === 'USER' ? detail.user : null} />
                            <UserBlock title="Kiểm duyệt viên xử lý" user={detail.report?.moderator} />
                            <PenaltyBlock penalties={detail.penalties} />
                        </div>
                    )
                )}
                {!loading && !error && detail && !(detail.report || detail.post || detail.user) && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                        Không có dữ liệu chi tiết cho đối tượng này.
                    </div>
                )}
            </div>
            <div className="border-t border-slate-200 p-4 text-right">
                <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:bg-slate-100" type="button" onClick={onClose}>
                    Đóng
                </button>
            </div>
        </div>
    </div>
)

export default ModerationTargetDetailModal
