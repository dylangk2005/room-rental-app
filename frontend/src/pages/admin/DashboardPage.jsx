import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { Message, StatCard } from '../../components/BackOfficeParts'
import ROUTES from '../../constants/routes'
import { getErrorMessage } from '../../utils/backOfficeFormatters'

const DashboardPage = () => {
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let ignore = false

        const loadSummary = async () => {
            try {
                const [users, internalUsers] = await Promise.all([
                    adminApi.getUsers({ page: 0, size: 1 }),
                    adminApi.getInternalUsers({ page: 0, size: 1 }),
                ])

                if (!ignore) {
                    setSummary({
                        totalAccounts: users.data?.totalElements || 0,
                        internalAccounts: internalUsers.data?.totalElements || 0,
                    })
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
            subtitle="Quản trị tài khoản, nhật ký hệ thống và sao lưu dữ liệu. Admin không xử lý nghiệp vụ tin đăng hoặc kiểm duyệt."
        >
            {error && <Message type="error">{error}</Message>}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng tài khoản" value={summary?.totalAccounts ?? '-'} />
                <StatCard label="Tài khoản nội bộ" value={summary?.internalAccounts ?? '-'} tone="emerald" />
                <StatCard label="Nhật ký hệ thống" value="Theo dõi" />
                <StatCard label="Sao lưu dữ liệu" value="Sẵn sàng" tone="amber" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Link className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50" to={ROUTES.ADMIN_USERS}>
                    <h2 className="text-lg font-black text-slate-950">Tài khoản người dùng</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Tìm kiếm, lọc và cập nhật trạng thái tài khoản người dùng.</p>
                </Link>
                <Link className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50" to={ROUTES.ADMIN_INTERNAL_USERS}>
                    <h2 className="text-lg font-black text-slate-950">Tài khoản nội bộ</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Tạo và cập nhật thông tin tài khoản quản trị viên, quản lý, kiểm duyệt viên.</p>
                </Link>
                <Link className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50" to={ROUTES.ADMIN_AUDIT_LOGS}>
                    <h2 className="text-lg font-black text-slate-950">Nhật ký hệ thống</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Theo dõi các thao tác quản trị và thay đổi hệ thống.</p>
                </Link>
            </div>
        </BackOfficeLayout>
    )
}

export default DashboardPage
