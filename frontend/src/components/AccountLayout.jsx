import { Link } from 'react-router-dom'
import AppHeader from './AppHeader'
import ROUTES from '../constants/routes'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const getInitial = (name = '') => {
    const trimmedName = name.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

const Icon = ({ name }) => {
    const paths = {
        user: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0',
        wallet: 'M4 7h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h4',
        plus: 'M12 5v14M5 12h14',
        home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6',
        rocket: 'M4 14c3-7 8-10 16-10 0 8-3 13-10 16l-1-5-5-1Zm9-5 2 2M5 19l3-3M4 22l5-5',
        history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v6l4 2',
        heart: 'M20.8 4.6c-2.1-2-5.4-1.9-7.4.2L12 6.2l-1.4-1.4c-2-2.1-5.3-2.2-7.4-.2-2.3 2.2-2.4 5.8-.2 8.1l8.1 8.1c.5.5 1.3.5 1.8 0l8.1-8.1c2.2-2.3 2.1-5.9-.2-8.1Z',
    }

    return (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    )
}

const accountMenuItems = [
    { key: 'account', label: 'Quản lý tài khoản', to: ROUTES.PROFILE, icon: 'user' },
    { key: 'deposit', label: 'Nạp tiền vào tài khoản', to: ROUTES.USER_DEPOSIT, icon: 'plus' },
    { key: 'posts', label: 'Quản lý bài đăng', to: ROUTES.MY_POSTS, icon: 'home' },
    { key: 'boost', label: 'Đẩy tin đăng', to: ROUTES.BOOST_POSTS, icon: 'rocket' },
    { key: 'transactions', label: 'Quản lý nạp tiền & thanh toán', to: ROUTES.USER_TRANSACTIONS, icon: 'history' },
    { key: 'favorites', label: 'Danh sách yêu thích', to: ROUTES.FAVORITES, icon: 'heart' },
]

const AccountLayout = ({ user, onUserChange, balance = 0, activeKey, title, subtitle, children, actions }) => (
    <main className="min-h-screen bg-slate-50 text-slate-950">
        <AppHeader user={user} onUserChange={onUserChange} />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
            <aside className="border-b border-slate-200 bg-white pb-5 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pr-5">
                <section className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-lg font-black text-slate-700">
                        {user?.avatar ? (
                            <img className="h-full w-full object-cover" src={user.avatar} alt={user.fullName || 'Tài khoản'} />
                        ) : (
                            getInitial(user?.fullName)
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{user?.fullName || 'Người dùng'}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user?.phoneNumber || user?.email || 'Tài khoản TAYTRO'}</p>
                        {user?.id && <p className="mt-1 text-xs font-bold text-slate-500">Mã tài khoản: {user.id}</p>}
                    </div>
                </section>

                <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Số dư tài khoản</p>
                            <strong className="mt-1 block text-xl text-slate-950">{formatMoney(balance)}</strong>
                        </div>
                        <Link
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-black text-slate-950 hover:bg-amber-500"
                            to={ROUTES.USER_DEPOSIT}
                        >
                            <Icon name="plus" />
                            Nạp tiền
                        </Link>
                    </div>
                </section>

                <nav className="mt-7 space-y-1">
                    {accountMenuItems.map((item) => {
                        const isActive = item.key === activeKey
                        return (
                            <Link
                                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition ${
                                    isActive
                                        ? 'bg-slate-100 text-slate-950'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                                }`}
                                key={item.key}
                                to={item.to}
                            >
                                <span className={isActive ? 'text-emerald-700' : 'text-slate-500'}>
                                    <Icon name={item.icon} />
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            <section className="min-w-0 pt-6 lg:pl-8 lg:pt-0">
                {(title || subtitle || actions) && (
                    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            {title && <h1 className="text-3xl font-black text-slate-950">{title}</h1>}
                            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
                        </div>
                        {actions}
                    </div>
                )}
                {children}
            </section>
        </div>
    </main>
)

export default AccountLayout
