import { useState } from 'react'
import managerApi from '../api/managerApi'
import { ActionButton, Toast } from './BackOfficeParts'

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
        keyword: '',
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
        if (filters.keyword) request.keyword = filters.keyword
        if (filters.from) request.from = filters.from
        if (filters.to) request.to = filters.to
        if (filters.paymentType) request.paymentType = filters.paymentType
        return request
    }

    const renderFilters = () => {
        switch (selectedType) {
            case 'posts':
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
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="ACTIVE">Đang hiển thị</option>
                                <option value="EXPIRED">Hết hạn</option>
                                <option value="REJECTED">Bị từ chối</option>
                                <option value="HIDDEN">Ẩn</option>
                                <option value="DRAFT">Nháp</option>
                                <option value="DELETED">Đã xóa</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Từ khóa</label>
                            <input
                                type="text"
                                placeholder="Mã tin hoặc tiêu đề..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.keyword}
                                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                            />
                        </div>
                    </div>
                )
            case 'users':
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
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="INACTIVE">Chưa kích hoạt</option>
                                <option value="BANNED">Bị khóa</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Từ khóa</label>
                            <input
                                type="text"
                                placeholder="Tên, email, SĐT..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.keyword}
                                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                            />
                        </div>
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
                                        setFilters({ status: '', keyword: '', from: '', to: '', paymentType: '' })
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
                            <input
                                type="date"
                                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.from}
                                onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
                            />
                            <input
                                type="date"
                                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                value={filters.to}
                                onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
                            />
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
