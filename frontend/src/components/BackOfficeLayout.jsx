import { Link, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import ROUTES from '../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const adminLinks = [
    { label: 'Tổng quan', to: ROUTES.ADMIN_DASHBOARD },
    { label: 'Người dùng', to: ROUTES.ADMIN_USERS },
    { label: 'Tài khoản nội bộ', to: ROUTES.ADMIN_INTERNAL_USERS },
    { label: 'Nhật ký hệ thống', to: ROUTES.ADMIN_AUDIT_LOGS },
    { label: 'Sao lưu', to: ROUTES.ADMIN_BACKUPS },
]

const managerLinks = [
    { label: 'Tổng quan', to: ROUTES.MANAGER_DASHBOARD, roles: ['MANAGER'] },
    { label: 'Nhật ký kiểm duyệt', to: ROUTES.MANAGER_MODERATION_LOGS, roles: ['MANAGER'] },
    { label: 'Giá tin đăng', to: ROUTES.MANAGER_PRICING, roles: ['MANAGER'] },
    { label: 'Hạng thành viên', to: ROUTES.MANAGER_MEMBERSHIP, roles: ['MANAGER'] },
    { label: 'Duyệt tin', to: ROUTES.MANAGER_MODERATION_POSTS, roles: ['MODERATOR'] },
    { label: 'Quản lý báo cáo', to: ROUTES.MANAGER_REPORTS, roles: ['MODERATOR'] },
    { label: 'Quản lý người dùng', to: ROUTES.MODERATOR_USERS, roles: ['MODERATOR'] },
    { label: 'Nhật ký kiểm duyệt', to: ROUTES.MODERATOR_MY_LOGS, roles: ['MODERATOR'] },
]

const BackOfficeLayout = ({ section = 'admin', title, subtitle, actions, children }) => {
    const location = useLocation()
    const user = readStoredUser()
    const links = section === 'manager'
        ? managerLinks.filter((link) => user?.role && link.roles.includes(user.role))
        : adminLinks
    const homeRoute =
        section === 'manager'
            ? user?.role === 'MODERATOR'
                ? ROUTES.MANAGER_MODERATION_POSTS
                : ROUTES.MANAGER_DASHBOARD
            : ROUTES.ADMIN_DASHBOARD
    const label = section === 'manager' ? (user?.role === 'MODERATOR' ? 'Kiểm duyệt' : 'Quản lý') : 'Quản trị'

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <AppHeader user={user} />
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
                <aside className="border-b border-slate-200 bg-white pb-5 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:border-b-0 lg:border-r lg:pr-5">
                    <Link className="block rounded-lg bg-slate-900 p-4 text-white" to={homeRoute}>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">{label}</p>
                        <p className="mt-1 text-lg font-black">Trang quản trị hệ thống</p>
                    </Link>
                    <nav className="mt-5 space-y-1">
                        {links.map((item) => {
                            const isActive = location.pathname === item.to
                            return (
                                <Link
                                    className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold transition ${
                                        isActive
                                            ? 'bg-emerald-50 text-emerald-800'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                                    }`}
                                    key={item.to}
                                    to={item.to}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                <section className="min-w-0 pt-6 lg:pl-8 lg:pt-0">
                    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-950">{title}</h1>
                            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
                        </div>
                        {actions}
                    </div>
                    {children}
                </section>
            </div>
        </main>
    )
}

export default BackOfficeLayout
