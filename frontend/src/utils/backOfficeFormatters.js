export const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}\u00A0đ`

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
    POST: 'Tin đăng',
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

const AUDIT_TARGET_TYPE_LABELS = {
    SYSTEM: 'Hệ thống',
    USER: 'Người dùng',
    POST: 'Tin đăng',
    TRANSACTION: 'Giao dịch',
    REPORT: 'Báo cáo',
    DEPOSIT: 'Nạp tiền',
    MEMBERSHIP: 'Gói thành viên',
    INTERNAL_USER: 'Tài khoản nội bộ',
    BACKUP: 'Sao lưu',
}

export const formatAuditTargetType = (type) => AUDIT_TARGET_TYPE_LABELS[type] || type || '-'

const AUDIT_ACTION_LABELS = {
    // Auth
    LOGIN: 'Đăng nhập',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    LOGOUT: 'Đăng xuất',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',

    // CRUD
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',

    // Post management
    ACCEPT_POST: 'Duyệt tin',
    APPROVE: 'Phê duyệt',
    REJECT_POST: 'Từ chối tin',
    REJECT: 'Từ chối',
    HIDDEN_POST: 'Ẩn tin',
    DELETE_POST: 'Xóa tin',
    UPDATE_POST_TYPE_PRICE: 'Cập nhật giá tin',

    // Report management
    ACCEPT_REPORT: 'Chấp nhận báo cáo',
    RESOLVE: 'Giải quyết',
    RESOLVE_REPORT: 'Giải quyết báo cáo',

    // User management
    UPDATE_USER_STATUS: 'Cập nhật trạng thái người dùng',
    BAN: 'Cấm',
    BAN_USER: 'Cấm người dùng',
    BAN_ACCOUNT: 'Cấm tài khoản',
    UNBAN: 'Bỏ cấm',
    UNBAN_USER: 'Bỏ cấm người dùng',

    // Moderation
    WARNING: 'Cảnh cáo',
    LOCK_POST: 'Khóa đăng tin',

    // Account
    ACTIVATE: 'Kích hoạt',
    DEACTIVATE: 'Vô hiệu hóa',

    // System
    BACKUP: 'Sao lưu',
    SYSTEM_BACKUP: 'Sao lưu hệ thống',
    RUN_DATABASE_BACKUP: 'Sao lưu cơ sở dữ liệu',
    RESTORE: 'Khôi phục',
    EXPORT: 'Xuất dữ liệu',
    IMPORT: 'Nhập dữ liệu',

    // Transaction
    PAYMENT: 'Thanh toán',
    DEPOSIT: 'Nạp tiền',
    DEPOSIT_INIT: 'Khởi tạo nạp tiền',
    REFUND: 'Hoàn tiền',
    PURCHASE: 'Mua gói',

    // Membership
    CREATE_MEMBERSHIP: 'Tạo gói thành viên',
    UPDATE_MEMBERSHIP: 'Cập nhật gói thành viên',

    // Post updates
    POST_UPDATED: 'Cập nhật tin đăng',
    PAYMENT_POST_SUCCESS: 'Thanh toán tin đăng thành công',
    UPDATED_POST_SUCCESS: 'Cập nhật tin thành công',

    // Moderation actions
    APPROVE_POST: 'Duyệt tin đăng',
    REJECT_POST_AND_REFUND: 'Từ chối tin và hoàn tiền',
    HIDE_POST: 'Ẩn tin đăng',
    UNHIDE_POST: 'Hiện lại tin đăng',
    REMOVE_POST: 'Xóa tin đăng',
    BAN_USER_WARNING: 'Cấm người dùng (Cảnh cáo)',
    BAN_USER_LOCK: 'Cấm người dùng (Khóa đăng)',
    BAN_USER_BAN: 'Cấm người dùng (Cấm vĩnh viễn)',

    // Payment actions
    PAYMENT_RENEW_SUCCESS: 'Gia hạn tin thành công',
    PAYMENT_PUSH_SUCCESS: 'Đẩy tin thành công',
    PAYMENT_POST_FAILED: 'Thanh toán tin thất bại',
    LOGIN_RATE_LIMITED: 'Đăng nhập bị giới hạn',

    // Report actions
    CREATE_REPORT: 'Tạo báo cáo',

    // Deposit actions
    DEPOSIT_FAILED: 'Nạp tiền thất bại',
    DEPOSIT_SUCCESS: 'Nạp tiền thành công',

    // Internal user management
    CREATE_INTERNAL_USER: 'Tạo tài khoản nội bộ',
    UPDATE_INTERNAL_USER: 'Cập nhật tài khoản nội bộ',
    DELETE_INTERNAL_USER: 'Xóa tài khoản nội bộ',
    UPDATE_MEMBERSHIP_LEVEL: 'Cập nhật hạng thành viên',
    UNBAN_USER: 'Bỏ cấm người dùng',
}

export const formatAuditAction = (action) => AUDIT_ACTION_LABELS[action] || action || '-'

const AUDIT_ACTION_VARIANTS = {
    // Auth
    LOGIN: 'info',
    LOGIN_SUCCESS: 'success',
    LOGIN_FAILED: 'danger',
    LOGOUT: 'neutral',
    LOGOUT_SUCCESS: 'success',

    // CRUD
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',

    // Post management
    ACCEPT_POST: 'success',
    APPROVE: 'success',
    REJECT_POST: 'danger',
    REJECT: 'danger',
    HIDDEN_POST: 'warning',
    DELETE_POST: 'danger',
    UPDATE_POST_TYPE_PRICE: 'info',

    // Report management
    ACCEPT_REPORT: 'success',
    RESOLVE: 'success',

    // User management
    UPDATE_USER_STATUS: 'info',
    BAN: 'danger',
    BAN_USER: 'danger',
    BAN_ACCOUNT: 'danger',
    UNBAN: 'success',
    UNBAN_USER: 'success',

    // Moderation
    WARNING: 'warning',
    LOCK_POST: 'danger',

    // Account
    ACTIVATE: 'success',
    DEACTIVATE: 'warning',

    // System
    BACKUP: 'info',
    SYSTEM_BACKUP: 'info',
    RUN_DATABASE_BACKUP: 'info',
    RESTORE: 'success',
    EXPORT: 'info',
    IMPORT: 'info',

    // Transaction
    PAYMENT: 'success',
    DEPOSIT: 'success',
    DEPOSIT_INIT: 'info',
    REFUND: 'warning',
    PURCHASE: 'success',

    // Membership
    CREATE_MEMBERSHIP: 'success',
    UPDATE_MEMBERSHIP: 'info',

    // Post updates
    POST_UPDATED: 'info',
    PAYMENT_POST_SUCCESS: 'success',
    UPDATED_POST_SUCCESS: 'success',

    // Moderation actions
    APPROVE_POST: 'success',
    REJECT_POST_AND_REFUND: 'danger',
    HIDE_POST: 'warning',
    UNHIDE_POST: 'success',
    REMOVE_POST: 'danger',
    BAN_USER_WARNING: 'danger',
    BAN_USER_LOCK: 'danger',
    BAN_USER_BAN: 'danger',

    // Payment actions
    PAYMENT_RENEW_SUCCESS: 'success',
    PAYMENT_PUSH_SUCCESS: 'success',
    PAYMENT_POST_FAILED: 'danger',
    LOGIN_RATE_LIMITED: 'warning',

    // Report actions
    CREATE_REPORT: 'info',

    // Deposit actions
    DEPOSIT_FAILED: 'danger',
    DEPOSIT_SUCCESS: 'success',

    // Internal user management
    CREATE_INTERNAL_USER: 'success',
    UPDATE_INTERNAL_USER: 'info',
    DELETE_INTERNAL_USER: 'danger',
    UPDATE_MEMBERSHIP_LEVEL: 'info',
    UNBAN_USER: 'success',
}

export const getAuditActionVariant = (action) => AUDIT_ACTION_VARIANTS[action] || 'neutral'

export const getInitial = (name) => {
    const safeName = name ?? ''
    const trimmedName = safeName.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : '?'
}

export const getAvatarUrl = (name, size = 80) => {
    const encoded = encodeURIComponent(name || 'User')
    return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=10b981&color=ffffff&bold=true&font-size=0.4`
}
