import { useState } from 'react'
import managerApi from '../api/managerApi'
import { ActionButton, Toast } from './BackOfficeParts'

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

const DateInput = ({ value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false)
    const today = new Date()
    const [viewDate, setViewDate] = useState(() => {
        if (!value) return new Date(today.getFullYear(), today.getMonth(), 1)
        const [y, m, d] = value.split('-')
        return new Date(parseInt(y), parseInt(m) - 1, 1)
    })

    const displayValue = formatDateDisplay(value)

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const daysInMonth = getDaysInMonth(viewDate)
    const firstDay = getFirstDayOfMonth(viewDate)

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

    const handleSelectDate = (day) => {
        const y = viewDate.getFullYear()
        const m = String(viewDate.getMonth() + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        onChange(`${y}-${m}-${d}`)
        setOpen(false)
    }

    const selectedDate = value ? new Date(value.split('-')[0], parseInt(value.split('-')[1]) - 1, parseInt(value.split('-')[2])) : null
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

    return (
        <div className="relative">
            <input
                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                type="text"
                value={displayValue}
                readOnly
                placeholder={placeholder}
                onClick={() => setOpen(true)}
            />
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-sm font-semibold">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {days.map(d => <div key={d} className="text-xs font-semibold text-slate-500 py-1">{d}</div>)}
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                const isSelected = value === dateStr
                                const isToday = todayStr === dateStr
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleSelectDate(day)}
                                        className={`h-8 w-8 rounded-full text-sm ${isSelected ? 'bg-emerald-500 text-white' : isToday ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100'}`}
                                    >
                                        {day}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

const exportTypes = [
    { key: 'posts', label: 'Danh sách Tin đăng', icon: '📝', roles: ['MANAGER', 'MODERATOR'] },
    { key: 'users', label: 'Danh sách Người dùng', icon: '👥', roles: ['MANAGER'] },
    { key: 'transactions', label: 'Giao dịch', icon: '💰', roles: ['MANAGER'] },
    { key: 'reports', label: 'Báo cáo Vi phạm', icon: '⚠️', roles: ['MANAGER', 'MODERATOR'] },
]

const ExportModal = ({ onClose, userRole }) => {
    const [selectedType, setSelectedType] = useState('posts')
    const [filters, setFilters] = useState({
        status: '',
        from: '',
        to: '',
        paymentType: '',
    })
    const [exporting, setExporting] = useState(false)
    const [toast, setToast] = useState(null)

    const availableTypes = exportTypes.filter(t => t.roles.includes(userRole))

    const handleExport = async () => {
        setExporting(true)
        setToast(null)

        try {
            const request = buildRequest()
            switch (selectedType) {
                case 'posts':
                    await managerApi.exportPostList(request)
                    break
                case 'users':
                    await managerApi.exportUserList(request)
                    break
                case 'transactions':
                    await managerApi.exportTransactionList(request)
                    break
                case 'reports':
                    await managerApi.exportReportList(request)
                    break
            }
            setToast({ type: 'success', message: 'Xuất Excel thành công!' })
            setTimeout(onClose, 1000)
        } catch (error) {
            setToast({ type: 'error', message: 'Xuất Excel thất bại. Vui lòng thử lại.' })
        } finally {
            setExporting(false)
        }
    }

    const buildRequest = () => {
        const request = {}
        if (filters.status) request.status = filters.status
        if (filters.from) request.from = filters.from
        if (filters.to) request.to = filters.to
        if (filters.paymentType) request.paymentType = filters.paymentType
        return request
    }

    const renderFilters = () => {
        switch (selectedType) {
            case 'posts':
                return (
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Trạng thái</label>
                        <select
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                        >
                            <option value="">Tất cả</option>
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="ACTIVE">Đang hiển thị</option>
                            <option value="EXPIRED">Hết hạn</option>
                            <option value="REJECTED">Bị từ chối</option>
                            <option value="HIDDEN">Ẩn</option>
                            <option value="DRAFT">Nháp</option>
                            <option value="DELETED">Đã xóa</option>
                        </select>
                    </div>
                )
            case 'users':
                return (
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Trạng thái</label>
                        <select
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                        >
                            <option value="">Tất cả</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Chưa kích hoạt</option>
                            <option value="BANNED">Bị khóa</option>
                        </select>
                    </div>
                )
            case 'transactions':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Loại giao dịch</label>
                            <select
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.paymentType}
                                onChange={(e) => setFilters(f => ({ ...f, paymentType: e.target.value }))}
                            >
                                <option value="">Tất cả</option>
                                <option value="POST_PAYMENT">Đăng tin</option>
                                <option value="EXTEND">Gia hạn</option>
                                <option value="PUSH">Đẩy tin</option>
                                <option value="REFUND">Hoàn tiền</option>
                            </select>
                        </div>
                    </div>
                )
            case 'reports':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Trạng thái</label>
                            <select
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.status}
                                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                            >
                                <option value="">Tất cả</option>
                                <option value="PENDING">Chờ xử lý</option>
                                <option value="RESOLVED">Đã xử lý</option>
                                <option value="REJECTED">Bị từ chối</option>
                            </select>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="w-full max-w-lg animate-in zoom-in-95 fade-in duration-200 rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <div>
                        <h3 className="text-xl font-black text-slate-950">Xuất Excel</h3>
                        <p className="mt-0.5 text-sm font-semibold text-slate-500">Chọn loại báo cáo và bộ lọc</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="p-5">
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-bold text-slate-700">Loại báo cáo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableTypes.map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    onClick={() => {
                                        setSelectedType(type.key)
                                        setFilters({ status: '', from: '', to: '', paymentType: '' })
                                    }}
                                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                        selectedType === type.key
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{type.icon}</span>
                                    <span className="text-left">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-bold text-slate-700">Thời gian</label>
                        <div className="grid grid-cols-2 gap-3">
                            <DateInput value={filters.from} onChange={(val) => setFilters(f => ({ ...f, from: val }))} placeholder="dd/mm/yy" />
                            <DateInput value={filters.to} onChange={(val) => setFilters(f => ({ ...f, to: val }))} placeholder="dd/mm/yy" />
                        </div>
                    </div>

                    {renderFilters()}

                    {toast && (
                        <div className="mt-4">
                            <Toast type={toast.type} message={toast.message} />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 border-t border-slate-100 p-4">
                    <ActionButton
                        label="Hủy"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    />
                    <ActionButton
                        label={exporting ? 'Đang xuất...' : 'Xuất Excel'}
                        variant="primary"
                        onClick={handleExport}
                        loading={exporting}
                        className="flex-1"
                        icon={
                            !exporting && (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )
                        }
                    />
                </div>
            </div>
        </div>
    )
}

export default ExportModal
