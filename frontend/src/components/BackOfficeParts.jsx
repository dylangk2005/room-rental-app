export const EmptyState = ({ message = 'Chưa có dữ liệu.' }) => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        {message}
    </div>
)

export const LoadingRows = ({ rows = 4 }) => (
    <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
            <div className="h-14 animate-pulse rounded-lg bg-slate-100" key={index} />
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

    return <div className={`rounded-lg border p-3 text-sm font-bold ${classes}`}>{children}</div>
}

export const Pagination = ({ pageInfo, onPageChange }) => {
    const currentPage = pageInfo?.currentPage || 0
    const totalPages = pageInfo?.totalPages || 0

    if (totalPages <= 1) return null

    return (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
            <span>
                Trang {currentPage + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
                <button
                    className="h-10 rounded-lg border border-slate-300 px-4 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Trước
                </button>
                <button
                    className="h-10 rounded-lg border border-slate-300 px-4 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Sau
                </button>
            </div>
        </div>
    )
}

export const StatCard = ({ label, value, tone = 'slate' }) => {
    const toneClass = {
        emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        amber: 'bg-amber-50 text-amber-800 border-amber-200',
        red: 'bg-red-50 text-red-800 border-red-200',
        slate: 'bg-white text-slate-950 border-slate-200',
    }[tone]

    return (
        <div className={`rounded-lg border p-4 ${toneClass}`}>
            <p className="text-sm font-bold opacity-80">{label}</p>
            <strong className="mt-2 block text-2xl font-black">{value}</strong>
        </div>
    )
}
