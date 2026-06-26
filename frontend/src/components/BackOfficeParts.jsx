export const EmptyState = ({ message = 'Chưa có dữ liệu.' }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <path d="M13 2v7h7" />
                <path d="M9 13h6M9 17h3" />
            </svg>
        </span>
        <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
)

export const LoadingRows = ({ rows = 4 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" key={index} />
        ))}
    </div>
)

export const Message = ({ type = 'info', children }) => {
    const classes =
        type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-100 text-slate-700'

    return <div className={`rounded-xl border p-3.5 text-sm font-bold ${classes}`}>{children}</div>
}

export const Pagination = ({ pageInfo, onPageChange }) => {
    const currentPage = pageInfo?.currentPage || 0
    const totalPages = pageInfo?.totalPages || 0
    const totalElements = pageInfo?.totalElements || 0

    if (totalPages <= 1) {
        return totalElements > 0 ? (
            <p className="mt-4 text-center text-sm font-semibold text-slate-400">
                Hiển thị {totalElements} kết quả
            </p>
        ) : null
    }

    const pageNumbers = []
    const maxVisible = 5
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages - 1, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(0, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)

    return (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-500">
                Trang {currentPage + 1} / {totalPages} &mdash; {totalElements} kết quả
            </p>
            <div className="flex items-center gap-1.5">
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => onPageChange(0)}
                    title="Trang đầu"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
                </button>
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => onPageChange(currentPage - 1)}
                    title="Trang trước"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                {pageNumbers.map((num) => (
                    <button
                        key={num}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-bold transition-all duration-150 hover:scale-105 ${
                            num === currentPage
                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        type="button"
                        onClick={() => onPageChange(num)}
                    >
                        {num + 1}
                    </button>
                ))}
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    type="button"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    title="Trang sau"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                    type="button"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => onPageChange(totalPages - 1)}
                    title="Trang cuối"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                </button>
            </div>
        </div>
    )
}

export const StatCard = ({ label, value, tone = 'slate', icon }) => {
    const toneClass = {
        emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        amber: 'bg-amber-50 text-amber-800 border-amber-200',
        red: 'bg-red-50 text-red-800 border-red-200',
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
        slate: 'bg-white text-slate-950 border-slate-200',
    }[tone] || 'bg-white text-slate-950 border-slate-200'

    return (
        <div className={`flex items-center gap-4 rounded-2xl border p-4 ${toneClass}`}>
            {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10">{icon}</span>}
            <div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
                <strong className="mt-1 block text-2xl font-black">{value ?? '-'}</strong>
            </div>
        </div>
    )
}

export const StatusBadge = ({ label, variant = 'neutral', showIcon = false }) => {
    const variants = {
        success: { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200 border border-emerald-200', icon: (
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        )},
        warning: { classes: 'bg-amber-50 text-amber-700 ring-amber-200 border border-amber-200', icon: (
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        )},
        danger: { classes: 'bg-red-50 text-red-700 ring-red-200 border border-red-200', icon: (
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        )},
        info: { classes: 'bg-blue-50 text-blue-700 ring-blue-200 border border-blue-200', icon: (
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        )},
        neutral: { classes: 'bg-slate-100 text-slate-600 ring-slate-200 border border-slate-200', icon: (
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        )},
    }
    const config = variants[variant] || variants.neutral
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${config.classes}`}>
            {showIcon && config.icon}
            {label}
        </span>
    )
}

export const ActionButton = ({ label, variant = 'primary', icon, onClick, loading, disabled, type = 'button', className = '' }) => {
    const variants = {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]',
        danger: 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]',
        secondary: 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 hover:scale-[1.03] active:scale-[0.98]',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]',
    }
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : icon ? (
                icon
            ) : null}
            {label}
        </button>
    )
}

export const FilterBar = ({ children, className = '' }) => (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
        {children}
    </div>
)

export const SkeletonCard = ({ lines = 3 }) => (
    <div className="animate-pulse space-y-3 rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded-full bg-slate-100" />
                <div className="h-3 w-1/2 rounded-full bg-slate-100" />
            </div>
        </div>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-3 rounded-full bg-slate-100 ${i === 0 ? 'w-full' : i === 1 ? 'w-3/4' : 'w-1/2'}`} />
        ))}
    </div>
)

export const ConfirmModal = ({ title, message, onConfirm, onCancel, loading, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', variant = 'danger' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
        <div className="w-full max-w-md animate-in zoom-in-95 fade-in duration-200 rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${variant === 'danger' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {variant === 'danger' ? (
                        <svg className="h-7 w-7 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    ) : (
                        <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                    )}
                </div>
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                {message && <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{message}</p>}
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-4">
                <button
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-150 hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98]"
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                >
                    {cancelLabel}
                </button>
                <button
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang xử lý...</span> : confirmLabel}
                </button>
            </div>
        </div>
    </div>
)

export const Toast = ({ type = 'info', message, onClose }) => {
    const config = {
        success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: (
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
        )},
        error: { bg: 'bg-red-50 border-red-200 text-red-700', icon: (
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        )},
        info: { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: (
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        )},
    }[type] || config.info

    return (
        <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-bold ${config.bg} animate-in slide-in-from-top-2 fade-in duration-300`}>
            <span className="flex items-center gap-3">
                {config.icon}
                {message}
            </span>
            {onClose && (
                <button className="shrink-0 text-lg font-black opacity-60 transition-opacity hover:opacity-100" type="button" onClick={onClose}>×</button>
            )}
        </div>
    )
}

export const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="w-full max-w-lg animate-in zoom-in-95 fade-in duration-200 rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-black text-slate-950">{title}</h3>
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        type="button"
                        onClick={onClose}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
