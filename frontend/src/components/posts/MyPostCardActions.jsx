import { Link } from 'react-router-dom'
import { Icon, SpinnerIcon } from './PostFormComponents'
import ROUTES from '../../constants/routes'

const NON_EDITABLE_STATUSES = ['DELETED']

const canEdit = (status) => !NON_EDITABLE_STATUSES.includes(status)

const STATUS_LABELS = {
    DRAFT: 'Bản nháp',
    ACTIVE: 'Đang hoạt động',
    PENDING: 'Chờ duyệt',
    EXPIRED: 'Đã hết hạn',
    REJECTED: 'Bị từ chối',
    HIDDEN: 'Đã ẩn',
    DELETED: 'Đã xóa',
}

const STATUS_ACCENTS = {
    DRAFT: { bg: 'bg-blue-50', ring: 'ring-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
    ACTIVE: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    PENDING: { bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    EXPIRED: { bg: 'bg-slate-100', ring: 'ring-slate-300', text: 'text-slate-600', dot: 'bg-slate-400' },
    REJECTED: { bg: 'bg-red-50', ring: 'ring-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    HIDDEN: { bg: 'bg-purple-50', ring: 'ring-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    DELETED: { bg: 'bg-zinc-100', ring: 'ring-zinc-300', text: 'text-zinc-600', dot: 'bg-zinc-400' },
}

const EditButton = ({ postId }) => (
    <Link
        to={ROUTES.EDIT_POST.replace(':id', postId)}
        className="group/edit relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg hover:shadow-emerald-100 active:scale-95"
        title="Chỉnh sửa nội dung tin đăng"
    >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-50 to-transparent transition-transform duration-500 group-hover/edit:translate-x-0" />
        <Icon name="edit" className="relative h-4 w-4 transition-transform duration-300 group-hover/edit:scale-110 group-hover/edit:rotate-[-8deg]" />
        <span className="relative">Chỉnh sửa</span>
    </Link>
)

const DeleteButton = ({ loading, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="group/del relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl border-2 border-red-200 bg-white px-4 text-sm font-black text-red-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-700 hover:shadow-lg hover:shadow-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        title="Xóa tin đăng này"
    >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-red-50 to-transparent transition-transform duration-500 group-hover/del:translate-x-0" />
        {loading ? (
            <SpinnerIcon className="relative h-4 w-4" />
        ) : (
            <Icon name="trash" className="relative h-4 w-4 transition-transform duration-300 group-hover/del:scale-110 group-hover/del:rotate-[-8deg]" />
        )}
        <span className="relative">Xóa</span>
    </button>
)

export const getStatusMeta = (status) => {
    const upper = String(status || '').toUpperCase()
    return {
        label: STATUS_LABELS[upper] || 'Đang cập nhật',
        accent: STATUS_ACCENTS[upper] || STATUS_ACCENTS.DELETED,
        canEdit: canEdit(upper),
        isPending: upper === 'PENDING',
        isExpired: upper === 'EXPIRED',
    }
}

const MyPostCardActions = ({ post, loading = false, onDelete }) => {
    const upper = String(post.status || '').toUpperCase()
    const showEdit = canEdit(upper)

    if (!showEdit && !onDelete) return null

    return (
        <div className="flex flex-wrap items-center gap-2.5">
            {showEdit && <EditButton postId={post.id} />}
            {onDelete && (
                <DeleteButton
                    loading={loading}
                    onClick={() => onDelete(post)}
                />
            )}
        </div>
    )
}

export default MyPostCardActions
