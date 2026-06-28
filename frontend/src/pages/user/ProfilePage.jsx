import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import SafeImage from '../../components/common/SafeImage'
import membershipApi from '../../api/membershipApi'
import userApi from '../../api/userApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

// ─── Utilities ────────────────────────────────────────────────────────────────
const getInitial = (name) => {
    const safeName = name ?? ''
    const trimmedName = safeName.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data
    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }
    return response?.message || fallback
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatMembershipName = (value) => {
    const normalized = (value ?? '').toString().trim().toLowerCase()
    const labels = {
        sat: 'Sắt', dong: 'Đồng', bac: 'Bạc', vang: 'Vàng', 'kim cuong': 'Kim cương',
    }
    return labels[normalized] || value || 'Sắt'
}

const membershipRankTable = [
    { id: 5, name: 'Kim cương', minSpent: 15000000, discountPercent: 25 },
    { id: 4, name: 'Vàng', minSpent: 7000000, discountPercent: 15 },
    { id: 3, name: 'Bạc', minSpent: 2000000, discountPercent: 10 },
    { id: 2, name: 'Đồng', minSpent: 500000, discountPercent: 5 },
    { id: 1, name: 'Sắt', minSpent: 0, discountPercent: 0 },
]

const formatDate = (value) => {
    if (!value) return 'Đang cập nhật'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(value))
}

const statusConfig = {
    ACTIVE:   { label: 'Đang hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    BANNED:   { label: 'Đã khóa',        bg: 'bg-red-100',      text: 'text-red-700',      dot: 'bg-red-500' },
    INACTIVE: { label: 'Tạm ngưng',      bg: 'bg-amber-100',    text: 'text-amber-700',    dot: 'bg-amber-500' },
}

const roleLabels = {
    USER: 'Người dùng', MODERATOR: 'Kiểm duyệt', MANAGER: 'Quản lý', ADMIN: 'Quản trị',
}

// ─── Icon Set ─────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = '' }) => {
    const icons = {
        user: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        lock: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3 4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M2 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        upload: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4M7 9l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        camera: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        medal: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 3h8l2 5-6 4-6-4 2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 14l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        calendar: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        star: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        eye: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        eyeOff: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        edit: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        x: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        chevronRight: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        sparkles: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 19l1 3 1-3M19 19l-1 3-1-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        trending: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        email: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        phone: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 5.88 5.88l1.94-1.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        id: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
    }
    return (
        <span className={`inline-flex items-center justify-center ${className}`}>
            {icons[name] || null}
        </span>
    )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 'md', editable = false, onEditClick }) => {
    const [hasImageError, setHasImageError] = useState(false)
    const showImage = user?.avatar && !hasImageError

    const sizeMap = {
        sm: { container: 'h-16 w-16 text-xl', icon: 'h-7 w-7' },
        md: { container: 'h-24 w-24 text-3xl', icon: 'h-9 w-9' },
        lg: { container: 'h-32 w-32 text-4xl', icon: 'h-11 w-11' },
        xl: { container: 'h-40 w-40 text-5xl', icon: 'h-14 w-14' },
    }
    const s = sizeMap[size] || sizeMap.md

    return (
        <div className="group relative shrink-0">
            <div
                className={`${s.container} flex items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl transition-all duration-300 ${editable ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : ''}`}
                onClick={editable ? onEditClick : undefined}
            >
                {showImage ? (
                    <img
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        src={user.avatar}
                        alt={user.fullName || 'Ảnh đại diện'}
                        onError={() => setHasImageError(true)}
                    />
                ) : (
                    <span className="font-black">{getInitial(user?.fullName)}</span>
                )}
            </div>
            {editable && (
                <button
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-emerald-500 active:scale-95"
                    type="button"
                    onClick={onEditClick}
                    title="Đổi ảnh đại diện"
                >
                    <Icon name="camera" size={14} />
                </button>
            )}
        </div>
    )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'emerald', delay = 0 }) => {
    const colorMap = {
        emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' },
        amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   text: 'text-amber-700' },
        blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',     text: 'text-blue-700' },
        purple:  { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
        rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',     text: 'text-rose-700' },
    }
    const c = colorMap[color] || colorMap.emerald

    return (
        <div
            className={`${c.bg} rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className={`mt-2 text-xl font-black ${c.text}`}>{value}</p>
                    {sub && <p className="mt-1 text-xs font-semibold text-slate-400">{sub}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
                    <Icon name={icon} size={20} />
                </div>
            </div>
        </div>
    )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ children, className = '', title, subtitle, icon, action }) => (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md ${className}`}>
        {(title || icon) && (
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <Icon name={icon} size={20} />
                        </span>
                    )}
                    <div>
                        {title && <h2 className="text-lg font-black text-slate-900">{title}</h2>}
                        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
)

// ─── Form Field ───────────────────────────────────────────────────────────────
const FormField = ({ label, children, hint }) => (
    <div>
        <label className="mb-2 block text-sm font-black text-slate-700">{label}</label>
        {children}
        {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
)

// ─── Input ────────────────────────────────────────────────────────────────────
const Input = ({ className = '', ...props }) => (
    <input
        className={`h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${className}`}
        {...props}
    />
)

// ─── Password Input ───────────────────────────────────────────────────────────
const PasswordInput = ({ className = '', ...props }) => {
    const [visible, setVisible] = useState(false)
    return (
        <div className="relative">
            <Input type={visible ? 'text' : 'password'} className={`pr-12 ${className}`} {...props} />
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                type="button"
                onClick={() => setVisible((v) => !v)}
                title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
                <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
            </button>
        </div>
    )
}

// ─── Toast Message ───────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onClose }) => {
    const isSuccess = type === 'success'
    return (
        <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
                isSuccess
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
            }`}
        >
            <span className={`mt-0.5 shrink-0 ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
                <Icon name={isSuccess ? 'check' : 'x'} size={16} />
            </span>
            <p className="flex-1 text-sm font-bold">{message}</p>
            {onClose && (
                <button className="shrink-0 transition-colors hover:opacity-60" type="button" onClick={onClose}>
                    <Icon name="x" size={14} />
                </button>
            )}
        </div>
    )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
    <div className="space-y-6">
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
    </div>
)

// ─── Rank Badge ───────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
    const rankColors = {
        'Kim cương': 'from-slate-700 to-slate-500',
        'Vàng':      'from-amber-500 to-yellow-400',
        'Bạc':       'from-slate-400 to-slate-300',
        'Đồng':      'from-orange-600 to-amber-500',
        'Sắt':       'from-slate-500 to-slate-400',
    }
    const color = rankColors[rank?.name] || rankColors['Sắt']
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-black text-white shadow-sm ${color}`}>
            <Icon name="star" size={12} />
            {rank?.name || 'Sắt'}
        </span>
    )
}

// ─── Membership Progress ───────────────────────────────────────────────────────
const MembershipProgress = ({ currentRank, nextRank, progress, totalSpent }) => (
    <div className="mt-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50 p-5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <RankBadge rank={currentRank} />
                <span className="text-sm font-bold text-slate-700">
                    Giảm {currentRank?.discountPercent || 0}%
                </span>
            </div>
            <span className="text-sm font-black text-emerald-700">{progress}%</span>
        </div>

        {nextRank && (
            <>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm transition-all duration-700"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    <span className="font-semibold text-slate-700">Cần thêm {formatMoney(nextRank.minSpent - totalSpent)}</span> chi tiêu để lên{' '}
                    <RankBadge rank={nextRank} />
                </p>
            </>
        )}

        {!nextRank && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-3">
                <span className="text-amber-500"><Icon name="sparkles" size={18} /></span>
                <p className="text-sm font-bold text-amber-800">Bạn đã đạt hạng cao nhất — Kim cương!</p>
            </div>
        )}
    </div>
)

// ─── Rank Table ───────────────────────────────────────────────────────────────
const RankTable = ({ currentRank }) => (
    <div className="mt-4 space-y-2">
        {[...membershipRankTable].reverse().map((level) => {
            const isCurrent = level.name === currentRank?.name
            const isLocked = level.minSpent > (currentRank?.minSpent || 0)
            return (
                <div
                    key={level.id}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                        isCurrent
                            ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                            : isLocked
                              ? 'border-slate-100 bg-slate-50 opacity-60'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                            isCurrent ? 'bg-emerald-600 text-white' : isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {isCurrent ? <Icon name="check" size={14} /> : level.id}
                        </div>
                        <div>
                            <p className={`font-black ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {formatMembershipName(level.name)}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">Từ {formatMoney(level.minSpent)}</p>
                        </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        -{level.discountPercent}%
                    </span>
                </div>
            )
        })}
    </div>
)

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
const ProfilePage = () => {
    const { user, login, logout } = useAuth()
    const { balance } = useWallet()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [membership, setMembership] = useState(null)
    const [activeTab, setActiveTab] = useState('profile')
    const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [error, setError] = useState('')
    const [profileMsg, setProfileMsg] = useState('')
    const [profileErr, setProfileErr] = useState('')
    const [passwordMsg, setPasswordMsg] = useState('')
    const [passwordErr, setPasswordErr] = useState('')
    const [avatarFile, setAvatarFile] = useState(null)
    const [editMode, setEditMode] = useState(false)
    const fileInputRef = useRef(null)
    const [passwordStrength, setPasswordStrength] = useState({ length: false, lower: false, upper: false, digit: false, special: false })

    // ─── Password strength ────────────────────────────────────────────────────────
    const validatePassword = (pw) => ({
        length: pw.length >= 8,
        lower: /[a-z]/.test(pw),
        upper: /[A-Z]/.test(pw),
        digit: /\d/.test(pw),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
    })

    const PasswordStrengthMeter = ({ checks }) => {
        const all = Object.values(checks).every(Boolean)
        const passed = Object.values(checks).filter(Boolean).length
        const barColor = all ? 'bg-emerald-500' : passed >= 3 ? 'bg-amber-400' : passed >= 1 ? 'bg-red-400' : 'bg-slate-200'
        return (
            <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                    {['length', 'lower', 'upper', 'digit', 'special'].map((k) => (
                        <div
                            key={k}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                checks[k] ? barColor.split('-')[0] + '-' + (checks[k] ? '500' : '200') : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
                <div className="space-y-1">
                    {[
                        { key: 'length', label: 'Ít nhất 8 ký tự' },
                        { key: 'lower', label: 'Ít nhất 1 chữ thường (a-z)' },
                        { key: 'upper', label: 'Ít nhất 1 chữ hoa (A-Z)' },
                        { key: 'digit', label: 'Ít nhất 1 chữ số (0-9)' },
                        { key: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#$%...)' },
                    ].map(({ key, label }) => (
                        <p key={key} className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${checks[key] ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${checks[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                {checks[key] ? <Icon name="check" size={10} /> : <span className="text-[8px] font-black">{key[0].toUpperCase()}</span>}
                            </span>
                            {label}
                        </p>
                    ))}
                </div>
            </div>
        )
    }

    // ─── Load profile ──────────────────────────────────────────────────────────
    const loadProfile = useCallback(async () => {
        setIsLoading(true)
        setError('')

        try {
            const refreshResponse = await authApi.refresh()
            login(refreshResponse.data)

            const [profileResult, membershipResult] = await Promise.allSettled([
                userApi.getProfile(),
                membershipApi.getMyLevel(),
            ])

            if (profileResult.status !== 'fulfilled') throw profileResult.reason

            const profileData = profileResult.value.data
            setProfile(profileData)
            setProfileForm({ fullName: profileData.fullName || '', phoneNumber: profileData.phoneNumber || '' })

            setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value.data : null)
        } catch (loadError) {
            logout()
            if (loadError.response?.status === 401) {
                navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.PROFILE } })
                return
            }
            setError(getErrorMessage(loadError, 'Không tải được hồ sơ. Vui lòng thử lại.'))
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        const timer = window.setTimeout(loadProfile, 0)
        return () => window.clearTimeout(timer)
    }, [loadProfile])

    // ─── Auth guard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await authApi.refresh()
                if (!cancelled) login(res.data)
            } catch {
                if (!cancelled) navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.PROFILE } })
                return
            } finally {
                if (!cancelled) setIsVerifying(false)
            }
        })()
        return () => { cancelled = true }
    }, [login, navigate])

    if (isVerifying) return null

    // ─── Membership ────────────────────────────────────────────────────────────
    const totalSpent = Number(membership?.totalSpent ?? profile?.totalSpent ?? 0)
    const currentRank = useMemo(
        () => membershipRankTable.find((r) => totalSpent >= r.minSpent) || membershipRankTable[membershipRankTable.length - 1],
        [totalSpent]
    )
    const nextRank = useMemo(
        () => [...membershipRankTable].reverse().find((r) => r.minSpent > totalSpent) || null,
        [totalSpent]
    )
    const membershipProgress = useMemo(() => {
        if (!nextRank) return 100
        return Math.min(100, Math.max(0, Math.round((totalSpent / nextRank.minSpent) * 100)))
    }, [nextRank, totalSpent])

    // ─── Avatar ────────────────────────────────────────────────────────────────
    const handleAvatarFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setProfileErr('Vui lòng chọn file ảnh hợp lệ.')
            e.target.value = ''
            return
        }
        setProfileErr('')
        setIsUploadingAvatar(true)
        setAvatarFile(file)
        ;(async () => {
            try {
                const response = await userApi.uploadAvatar(file)
                const updated = response.data
                setProfile(updated)
                login({ ...user, fullName: updated.fullName, phoneNumber: updated.phoneNumber, avatar: updated.avatar })
                setProfileMsg('Đã cập nhật ảnh đại diện.')
            } catch (err) {
                setProfileErr(getErrorMessage(err, 'Không upload được ảnh. Vui lòng thử lại.'))
            } finally {
                setIsUploadingAvatar(false)
                e.target.value = ''
            }
        })()
    }

    // ─── Profile form ──────────────────────────────────────────────────────────
    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfileForm((c) => ({ ...c, [name]: value }))
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileErr('')
        setProfileMsg('')
        if (!profileForm.fullName.trim() || !profileForm.phoneNumber.trim()) {
            setProfileErr('Vui lòng nhập đầy đủ họ tên và số điện thoại.')
            return
        }
        setIsSavingProfile(true)
        try {
            const response = await userApi.updateProfile({
                fullName: profileForm.fullName.trim(),
                phoneNumber: profileForm.phoneNumber.trim(),
                avatar: profile.avatar || '',
            })
            const updated = response.data
            setProfile(updated)
            login({ ...user, fullName: updated.fullName, phoneNumber: updated.phoneNumber, avatar: updated.avatar })
            setProfileMsg('Đã cập nhật thông tin tài khoản.')
            setEditMode(false)
        } catch (err) {
            setProfileErr(getErrorMessage(err, 'Không cập nhật được. Vui lòng thử lại.'))
        } finally {
            setIsSavingProfile(false)
        }
    }

    // ─── Password ───────────────────────────────────────────────────────────────
    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordForm((c) => ({ ...c, [name]: value }))
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPasswordErr('')
        setPasswordMsg('')
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordErr('Vui lòng nhập đầy đủ thông tin.')
            return
        }
        const checks = validatePassword(passwordForm.newPassword)
        if (!Object.values(checks).every(Boolean)) {
            setPasswordErr('Mật khẩu mới chưa đủ mạnh. Vui lòng kiểm tra lại các yêu cầu.')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordErr('Mật khẩu mới và xác nhận chưa khớp.')
            return
        }
        setIsChangingPassword(true)
        try {
            await authApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setPasswordMsg('Đã đổi mật khẩu thành công.')
        } catch (err) {
            setPasswordErr(getErrorMessage(err, 'Không đổi được mật khẩu. Vui lòng thử lại.'))
        } finally {
            setIsChangingPassword(false)
        }
    }

    const tabs = [
        { key: 'profile', label: 'Thông tin cá nhân', icon: 'user' },
        { key: 'security', label: 'Bảo mật & Mật khẩu', icon: 'shield' },
    ]

    const statusCfg = statusConfig[profile?.status] || statusConfig.ACTIVE

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <AccountLayout
            balance={balance}
            activeKey="account"
            title="Hồ sơ cá nhân"
            subtitle="Quản lý thông tin tài khoản, bảo mật và theo dõi hạng thành viên."
        >
            {isLoading && <LoadingSkeleton />}

            {!isLoading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <Icon name="x" className="text-red-600" size={28} />
                    </div>
                    <h2 className="text-xl font-black text-red-700">Không tải được hồ sơ</h2>
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                    <button
                        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-black text-white hover:bg-red-700 hover:shadow-lg active:scale-95 transition-all"
                        type="button"
                        onClick={loadProfile}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!isLoading && !error && profile && (
                <div className="space-y-6">
                    {/* ── Hero Section ───────────────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Banner gradient */}
                        <div className="relative h-32 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 overflow-hidden">
                            <div className="absolute inset-0 opacity-30" style={{
                                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'
                            }} />
                            {/* Decorative shapes */}
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-4 border-white/10" />
                            <div className="absolute -right-4 bottom-4 h-16 w-16 rounded-full border-2 border-white/10" />
                        </div>

                        {/* User info */}
                        <div className="relative px-6 pb-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    <div className="-mt-12 shrink-0">
                                        <Avatar user={profile} size="lg" editable onEditClick={() => fileInputRef.current?.click()} />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarFileChange}
                                        />
                                    </div>
                                    <div className="pb-1">
                                        <h1 className="text-2xl font-black text-slate-900 leading-tight">
                                            {profile.fullName || 'Người dùng TayTro'}
                                        </h1>
                                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                                            <Icon name="email" size={14} />
                                            {profile.email}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                                                {statusCfg.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                                <Icon name="id" size={12} />
                                                {roleLabels[profile.role] || profile.role}
                                            </span>
                                            <RankBadge rank={currentRank} />
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 shrink-0">
                                    <Icon name="calendar" size={15} />
                                    <span>Tham gia {formatDate(profile.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats Grid ─────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard icon="wallet" label="Số dư ví" value={formatMoney(balance)} color="emerald" delay={0} />
                        <StatCard icon="trending" label="Tổng chi tiêu" value={formatMoney(totalSpent)} color="amber" delay={80} />
                        <StatCard icon="medal" label="Hạng hiện tại" value={currentRank?.name || 'Sắt'} sub={`Giảm ${currentRank?.discountPercent || 0}%`} color="purple" delay={160} />
                        <StatCard icon="star" label="Ưu đãi" value={currentRank?.discountPercent ? `${currentRank.discountPercent}%` : '0%'} sub="Khi đăng tin" color="rose" delay={240} />
                    </div>

                    {/* ── Tabs ─────────────────────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex border-b border-slate-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2.5 border-b-2 px-6 py-4 text-sm font-black transition-all duration-200 ${
                                        activeTab === tab.key
                                            ? 'border-emerald-600 text-emerald-700'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                                >
                                    <Icon name={tab.icon} size={18} />
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <span className="ml-1 flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* ── Profile Tab ─────────────────────────────────── */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                        {/* Personal Info Card */}
                                        <SectionCard
                                            icon="edit"
                                            title="Thông tin cá nhân"
                                            subtitle="Cập nhật họ tên và số điện thoại liên hệ"
                                            action={
                                                !editMode && (
                                                    <button
                                                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                                                        type="button"
                                                        onClick={() => setEditMode(true)}
                                                    >
                                                        <Icon name="edit" size={14} />
                                                        Chỉnh sửa
                                                    </button>
                                                )
                                            }
                                        >
                                            {(profileErr || profileMsg) && (
                                                <div className="mb-4">
                                                    {profileErr && <Toast type="error" message={profileErr} onClose={() => setProfileErr('')} />}
                                                    {profileMsg && <Toast type="success" message={profileMsg} onClose={() => setProfileMsg('')} />}
                                                </div>
                                            )}

                                            <form className="space-y-5" onSubmit={handleProfileSubmit}>
                                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                    <FormField label="Họ tên">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                                <Icon name="user" size={16} />
                                                            </span>
                                                            <Input
                                                                name="fullName"
                                                                value={profileForm.fullName}
                                                                onChange={handleProfileChange}
                                                                placeholder="Nhập họ tên đầy đủ"
                                                                autoComplete="name"
                                                                disabled={!editMode}
                                                                className={`pl-11 ${!editMode ? 'cursor-not-allowed bg-slate-50' : ''}`}
                                                            />
                                                        </div>
                                                    </FormField>

                                                    <FormField label="Số điện thoại">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                                <Icon name="phone" size={16} />
                                                            </span>
                                                            <Input
                                                                name="phoneNumber"
                                                                value={profileForm.phoneNumber}
                                                                onChange={handleProfileChange}
                                                                placeholder="Nhập số điện thoại"
                                                                autoComplete="tel"
                                                                inputMode="tel"
                                                                disabled={!editMode}
                                                                className={`pl-11 ${!editMode ? 'cursor-not-allowed bg-slate-50' : ''}`}
                                                            />
                                                        </div>
                                                    </FormField>
                                                </div>

                                                <FormField label="Email">
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                            <Icon name="email" size={16} />
                                                        </span>
                                                        <Input
                                                            value={profile.email || ''}
                                                            autoComplete="email"
                                                            disabled
                                                            readOnly
                                                            className="pl-11 bg-slate-100 text-slate-500"
                                                        />
                                                    </div>
                                                    <p className="mt-1.5 text-xs text-slate-400">Email không thể thay đổi. Liên hệ hỗ trợ nếu cần.</p>
                                                </FormField>

                                                {editMode && (
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                                                            type="button"
                                                            onClick={() => {
                                                                setEditMode(false)
                                                                setProfileForm({ fullName: profile.fullName || '', phoneNumber: profile.phoneNumber || '' })
                                                            }}
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            className="h-12 flex-1 rounded-xl bg-emerald-600 text-sm font-black text-white transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                            type="submit"
                                                            disabled={isSavingProfile}
                                                        >
                                                            {isSavingProfile ? (
                                                                <span className="inline-flex items-center gap-2">
                                                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                    Đang lưu...
                                                                </span>
                                                            ) : 'Lưu thay đổi'}
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        </SectionCard>
                                </div>
                            )}

                            {/* ── Security Tab ───────────────────────────────── */}
                            {activeTab === 'security' && (
                                <div className="mx-auto max-w-2xl">
                                    <SectionCard
                                        icon="shield"
                                        title="Bảo mật tài khoản"
                                        subtitle="Đổi mật khẩu bằng mật khẩu hiện tại để bảo vệ tài khoản."
                                    >
                                        {(passwordErr || passwordMsg) && (
                                            <div className="mb-5">
                                                {passwordErr && <Toast type="error" message={passwordErr} onClose={() => setPasswordErr('')} />}
                                                {passwordMsg && <Toast type="success" message={passwordMsg} onClose={() => setPasswordMsg('')} />}
                                            </div>
                                        )}

                                        <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                                            <FormField label="Mật khẩu hiện tại">
                                                <PasswordInput
                                                    name="currentPassword"
                                                    value={passwordForm.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Nhập mật khẩu hiện tại"
                                                    autoComplete="current-password"
                                                />
                                            </FormField>

                                            <FormField label="Mật khẩu mới">
                                                <PasswordInput
                                                    name="newPassword"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => {
                                                        handlePasswordChange(e)
                                                        setPasswordStrength(validatePassword(e.target.value))
                                                    }}
                                                    placeholder="Nhập mật khẩu mới"
                                                    autoComplete="new-password"
                                                />
                                                <PasswordStrengthMeter checks={passwordStrength} />
                                            </FormField>

                                            <FormField label="Xác nhận mật khẩu mới">
                                                <PasswordInput
                                                    name="confirmPassword"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    autoComplete="new-password"
                                                />
                                            </FormField>

                                            <div className="pt-3">
                                                <button
                                                    className="h-13 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                    type="submit"
                                                    disabled={isChangingPassword || !Object.values(passwordStrength).every(Boolean)}
                                                >
                                                    {isChangingPassword ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            Đang xử lý...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <Icon name="lock" size={16} />
                                                            Đổi mật khẩu
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>

                                        {/* Security tips */}
                                        <div className="mt-6 rounded-xl bg-slate-50 p-4">
                                            <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                    <Icon name="shield" size={12} />
                                                </span>
                                                Mẹo bảo mật
                                            </p>
                                            <ul className="mt-3 space-y-2 text-sm text-slate-500">
                                                <li className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-emerald-500"><Icon name="check" size={13} /></span>
                                                    Sử dụng mật khẩu mạnh, không dùng thông tin cá nhân dễ đoán
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-emerald-500"><Icon name="check" size={13} /></span>
                                                    Không chia sẻ thông tin đăng nhập cho bất kỳ ai
                                                </li>
                                            </ul>
                                        </div>
                                    </SectionCard>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AccountLayout>
    )
}

export default ProfilePage
