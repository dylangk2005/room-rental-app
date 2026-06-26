export const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export const formatDateTime = (value) => {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

export const getErrorMessage = (error, fallback = 'Không thể thực hiện thao tác. Vui lòng thử lại.') =>
    error?.response?.data?.message || fallback

export const formatRelativeTime = (value) => {
    if (!value) return '-'
    const now = new Date()
    const date = new Date(value)
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
    return formatDateTime(value)
}

const ACTION_LABELS = {
    ACCEPT_POST: 'Duyệt tin',
    REJECT_POST: 'Từ chối tin',
    HIDDEN_POST: 'Ẩn tin',
    REMOVE_POST: 'Xóa tin',
    ACCEPT_REPORT: 'Chấp nhận báo cáo',
    REJECT_REPORT: 'Từ chối báo cáo',
    WARNING: 'Cảnh cáo',
    LOCK_POST: 'Khóa đăng tin',
    BAN_ACCOUNT: 'Ban tài khoản',
}

export const formatActionLabel = (action) => ACTION_LABELS[action] || action || '-'

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    RESOLVED: 'Đã xử lý',
    REJECTED: 'Từ chối',
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    EXPIRED: 'Hết hạn',
    BANNED: 'Bị cấm',
    HIDDEN: 'Ẩn',
    APPROVED: 'Đã duyệt',
    DRAFT: 'Bản nháp',
    DELETED: 'Đã xóa',
}

export const formatStatusLabel = (status) => STATUS_LABELS[status] || status || '-'

const PENALTY_LABELS = {
    WARNING: 'Cảnh cáo',
    LOCK_POST: 'Khóa đăng tin',
    BAN_ACCOUNT: 'Cấm tài khoản',
}

export const formatPenaltyType = (type) => PENALTY_LABELS[type] || type || '-'

const TARGET_TYPE_LABELS = {
    POST: 'Bài đăng',
    REPORT: 'Báo cáo',
    USER: 'Người dùng',
}

export const formatTargetType = (type) => TARGET_TYPE_LABELS[type] || type || '-'

const ROLE_LABELS = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    MODERATOR: 'Kiểm duyệt viên',
    USER: 'Người dùng',
}

export const formatRole = (role) => ROLE_LABELS[role] || role || '-'

export const getInitial = (name) => {
    const safeName = name ?? ''
    const trimmedName = safeName.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : '?'
}

export const getAvatarUrl = (name, size = 80) => {
    const encoded = encodeURIComponent(name || 'User')
    return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=10b981&color=ffffff&bold=true&font-size=0.4`
}
