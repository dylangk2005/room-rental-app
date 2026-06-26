import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppHeader from './AppHeader'
import ROUTES from '../constants/routes'
import SafeImage from './common/SafeImage'
import { getAvatarUrl } from '../utils/backOfficeFormatters'

const DashboardIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
)
const FileCheckIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" />
    </svg>
)
const FlagIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
)
const UsersIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)
const HistoryIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
)
const TagIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
)
const StarIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
)
const DatabaseIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
)
const ShieldIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)

const managerLinks = [
    { label: 'Tổng quan', to: ROUTES.MANAGER_DASHBOARD, roles: ['MANAGER'], Icon: DashboardIcon },
    { label: 'Nhật ký kiểm duyệt', to: ROUTES.MANAGER_MODERATION_LOGS, roles: ['MANAGER'], Icon: HistoryIcon },
    { label: 'Giá tin đăng', to: ROUTES.MANAGER_PRICING, roles: ['MANAGER'], Icon: TagIcon },
    { label: 'Hạng thành viên', to: ROUTES.MANAGER_MEMBERSHIP, roles: ['MANAGER'], Icon: StarIcon },
    { label: 'Duyệt tin', to: ROUTES.MANAGER_MODERATION_POSTS, roles: ['MODERATOR'], Icon: FileCheckIcon },
    { label: 'Quản lý báo cáo', to: ROUTES.MANAGER_REPORTS, roles: ['MODERATOR'], Icon: FlagIcon },
    { label: 'Quản lý người dùng', to: ROUTES.MODERATOR_USERS, roles: ['MODERATOR'], Icon: UsersIcon },
    { label: 'Nhật ký kiểm duyệt', to: ROUTES.MODERATOR_MY_LOGS, roles: ['MODERATOR'], Icon: HistoryIcon },
]

const adminLinks = [
    { label: 'Tổng quan', to: ROUTES.ADMIN_DASHBOARD, roles: ['ADMIN'], Icon: DashboardIcon },
    { label: 'Người dùng', to: ROUTES.ADMIN_USERS, roles: ['ADMIN'], Icon: UsersIcon },
    { label: 'Tài khoản nội bộ', to: ROUTES.ADMIN_INTERNAL_USERS, roles: ['ADMIN'], Icon: ShieldIcon },
    { label: 'Nhật ký hệ thống', to: ROUTES.ADMIN_AUDIT_LOGS, roles: ['ADMIN'], Icon: HistoryIcon },
    { label: 'Sao lưu', to: ROUTES.ADMIN_BACKUPS, roles: ['ADMIN'], Icon: DatabaseIcon },
]

const BackOfficeLayout = ({ section = 'admin', title, subtitle, actions, children }) => {
    const location = useLocation()
    const { user } = useAuth()
    const links = section === 'manager'
        ? managerLinks.filter((link) => user?.role && link.roles.includes(user.role))
        : adminLinks

    const sectionLabel = section === 'manager' ? (user?.role === 'MODERATOR' ? 'Kiểm duyệt' : 'Quản lý') : 'Quản trị'
    const roleBadgeClass = user?.role === 'MODERATOR'
        ? 'bg-amber-400/20 text-amber-300'
        : user?.role === 'MANAGER'
          ? 'bg-blue-400/20 text-blue-300'
          : 'bg-purple-400/20 text-purple-300'

    return (
        <main className="min-h-screen bg-slate-100 text-slate-950">
            <AppHeader />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-0 lg:px-8">
                {/* Sidebar */}
                <aside className="relative w-full lg:sticky lg:top-0 lg:h-fit lg:w-64 lg:shrink-0">
                    {/* Header card */}
                    <div className="mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-xl ring-1 ring-white/5">
                        <div className="mb-3 flex items-center gap-3">
                            <SafeImage
                                className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-lg shadow-emerald-600/30"
                                src={user?.avatar}
                                fallbackSrc={getAvatarUrl(user?.fullName, 80)}
                                alt={user?.fullName}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-white">{user?.fullName || 'Người dùng'}</p>
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${roleBadgeClass}`}>
                                    {sectionLabel}
                                </span>
                            </div>
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-400/70">Trang {sectionLabel.toLowerCase()}</p>
                        <p className="mt-1 text-base font-black text-white leading-tight">Hệ thống quản trị</p>
                    </div>

                    {/* Nav */}
                    <nav className="space-y-1 rounded-2xl bg-slate-900 p-2 shadow-xl ring-1 ring-white/5">
                        {links.map(({ label, to, Icon }) => {
                            const isActive = location.pathname === to
                            return (
                                <Link
                                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                                    }`}
                                    key={to}
                                    to={to}
                                >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                        isActive ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-white/10'
                                    }`}>
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                    </span>
                                    <span className="flex-1">{label}</span>
                                    {isActive && (
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <section className="min-w-0 flex-1 pt-2 lg:ml-6 lg:pt-0">
                    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h1>
                            {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
                        </div>
                        {actions && <div className="shrink-0">{actions}</div>}
                    </div>
                    {children}
                </section>
            </div>
        </main>
    )
}

export default BackOfficeLayout
