import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { Message } from '../../components/BackOfficeParts'
import ROUTES from '../../constants/routes'
import { getErrorMessage } from '../../utils/backOfficeFormatters'

const StatCard = ({ label, value, icon, gradient, description }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <strong className="mt-2 block text-3xl font-black text-slate-950">{value ?? '-'}</strong>
                {description && <p className="mt-1 text-xs font-semibold text-slate-400">{description}</p>}
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    </div>
)

const LinkCard = ({ to, icon, title, description, gradient }) => (
    <Link
        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5"
        to={to}
    >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
        <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">{description}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </div>
    </Link>
)

const DashboardPage = () => {
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let ignore = false

        const loadSummary = async () => {
            try {
                const response = await adminApi.getDashboardStats()

                if (!ignore) {
                    setSummary(response.data)
                }
            } catch (loadError) {
                if (!ignore) setError(getErrorMessage(loadError, 'Không tải được dữ liệu tổng quan quản trị.'))
            }
        }

        loadSummary()

        return () => {
            ignore = true
        }
    }, [])

    return (
        <BackOfficeLayout
            title="Tổng quan quản trị"
            subtitle="Quản lý tài khoản và theo dõi hoạt động hệ thống."
        >
            {error && <Message type="error">{error}</Message>}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Tài khoản người dùng"
                    value={summary?.totalUsers ?? '-'}
                    icon="👥"
                    gradient="from-blue-500 to-indigo-600"
                    description="Tổng số tài khoản"
                />
                <StatCard
                    label="Tài khoản nội bộ"
                    value={summary?.internalAccounts ?? '-'}
                    icon="🏢"
                    gradient="from-emerald-500 to-teal-600"
                    description="Tổng số tài khoản nội bộ"
                />
                <StatCard
                    label="Tài khoản đang hoạt động"
                    value={summary?.activeAccounts ?? '-'}
                    icon="✅"
                    gradient="from-violet-500 to-purple-600"
                    description="Tổng số tài khoản hoạt động"
                />
                <StatCard
                    label="Logs hôm nay"
                    value={summary?.todayLogs ?? '-'}
                    icon="📋"
                    gradient="from-amber-500 to-orange-600"
                    description="Logs phát sinh hôm nay"
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <LinkCard
                    to={ROUTES.ADMIN_USERS}
                    icon="👤"
                    title="Tài khoản người dùng"
                    description="Tìm kiếm, lọc và cập nhật trạng thái tài khoản."
                    gradient="from-blue-500 to-indigo-600"
                />
                <LinkCard
                    to={ROUTES.ADMIN_INTERNAL_USERS}
                    icon="🏢"
                    title="Tài khoản nội bộ"
                    description="Quản lý tài khoản quản trị viên, quản lý, kiểm duyệt viên."
                    gradient="from-emerald-500 to-teal-600"
                />
                <LinkCard
                    to={ROUTES.ADMIN_AUDIT_LOGS}
                    icon="📋"
                    title="Nhật ký hệ thống"
                    description="Theo dõi lịch sử thao tác quản trị và thay đổi."
                    gradient="from-purple-500 to-pink-600"
                />
                <LinkCard
                    to={ROUTES.ADMIN_BACKUPS}
                    icon="💾"
                    title="Sao lưu dữ liệu"
                    description="Tạo và quản lý bản sao lưu cơ sở dữ liệu."
                    gradient="from-amber-500 to-orange-600"
                />
            </div>
        </BackOfficeLayout>
    )
}

export default DashboardPage
