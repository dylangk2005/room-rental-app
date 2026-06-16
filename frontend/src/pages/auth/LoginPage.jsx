import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authApi from '../../api/authApi'
import ROUTES from '../../constants/routes'

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER', 'MODERATOR'])
const USER_STORAGE_KEY = 'taytro_user'

const getRoleLandingRoute = (role, fallback) => {
    if (role === 'ADMIN') return ROUTES.ADMIN_DASHBOARD
    if (role === 'MANAGER') return ROUTES.MANAGER_DASHBOARD
    if (role === 'MODERATOR') return ROUTES.MANAGER_MODERATION_POSTS
    return fallback
}

const getErrorMessage = (error) => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || 'Đăng nhập không thành công. Vui lòng thử lại.'
}

const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
)

const SpinnerIcon = () => (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [form, setForm] = useState({
        email: '',
        password: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (!form.email.trim() || !form.password.trim()) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await authApi.login({
                email: form.email.trim(),
                password: form.password,
            })
            const user = response.data
            login(user)
            const nextPath = location.state?.from || ROUTES.POSTS
            navigate(ADMIN_ROLES.has(user?.role) ? getRoleLandingRoute(user?.role, nextPath) : nextPath, { replace: true })
        } catch (loginError) {
            setError(getErrorMessage(loginError))
        } finally {
            setIsSubmitting(false)
        }
    }

    const benefits = [
        {
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            ),
            title: 'Lưu phòng yêu thích',
            description: 'So sánh và lưu lại những phòng phù hợp nhất',
        },
        {
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            ),
            title: 'Đăng tin cho thuê',
            description: 'Quản lý danh sách phòng và theo dõi liên hệ',
        },
        {
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
            ),
            title: 'Liên hệ trực tiếp',
            description: 'Kết nối nhanh với chủ phòng, không qua trung gian',
        },
    ]

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

                {/* ── Left: Brand & Benefits ── */}
                <section className="relative flex flex-col justify-between overflow-hidden px-6 py-10 sm:px-10 sm:py-8 lg:px-14">

                    {/* Decorative blobs */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-24 -top-16 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
                        <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
                    </div>

                    {/* Logo */}
                    <Link
                        to={ROUTES.HOME}
                        className="group relative z-10 inline-flex w-fit items-center gap-3"
                    >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 group-hover:bg-emerald-700 group-hover:shadow-xl group-hover:shadow-emerald-600/30 group-hover:scale-105">
                            T
                        </span>
                        <span>
                            <span className="block text-xl font-black tracking-normal text-slate-950 transition-colors duration-300 group-hover:text-emerald-600">TAYTRO</span>
                            <span className="block text-sm text-slate-500">Tìm phòng trọ dễ dàng hơn</span>
                        </span>
                    </Link>

                    {/* Main copy */}
                    <div className="relative z-10 my-auto max-w-xl lg:my-0 mt-6 sm:mt-8">
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            Chào mừng bạn quay trở lại
                        </p>

                        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 transition-all duration-500 sm:text-4xl md:text-5xl">
                            Đăng nhập để kết nối với phòng trọ phù hợp nhất.
                        </h1>

                        <p className="mt-4 text-base leading-7 text-slate-500 transition-all duration-500 sm:mt-5 sm:text-lg">
                            Dễ dàng đăng tin, quản lý bài đăng phòng trọ và khám phá các phòng phù hợp với nhu cầu của bạn.
                        </p>
                    </div>

                    {/* Benefits grid */}
                    <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {benefits.map((b, i) => (
                            <div
                                key={i}
                                className="group flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5 cursor-default"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100 group-hover:shadow-md group-hover:shadow-emerald-500/20">
                                    {b.icon}
                                </div>
                                <div>
                                    <strong className="block text-sm font-bold text-slate-900 transition-colors duration-300 group-hover:text-emerald-600">{b.title}</strong>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{b.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Right: Login Form ── */}
                <section className="flex items-center justify-center bg-white px-5 py-10 shadow-[0_0_80px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">

                    <div className="w-full max-w-md">

                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-950">Đăng nhập</h2>
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                Chưa có tài khoản?
                                <Link
                                    className="font-bold text-emerald-600 transition-all duration-200 hover:text-emerald-700 hover:underline underline-offset-2"
                                    to={ROUTES.REGISTER}
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>

                        {/* Error alert */}
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm transition-all duration-300">
                                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-red-700">{error}</p>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>

                            {/* Email field */}
                            <div className="group">
                                <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <input
                                        className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="example@gmail.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div className="group">
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Mật khẩu
                                    </label>
                                    <Link
                                        className="text-xs font-semibold text-slate-400 transition-colors duration-200 hover:text-emerald-600"
                                        to={ROUTES.FORGOT_PASSWORD}
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <input
                                        className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Nhập mật khẩu"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-bold text-slate-500"
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? 'Ẩn' : 'Hiện'}
                                    </button>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                className="group relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                                    Đăng nhập
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                                {isSubmitting && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <SpinnerIcon />
                                        <span className="ml-2">Đang xử lý...</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs font-semibold text-slate-400">Hoặc</span>
                            </div>
                        </div>

                        {/* Register shortcut */}
                        <Link
                            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-300 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
                            to={ROUTES.REGISTER}
                        >
                            <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tạo tài khoản mới
                        </Link>

                        {/* Home link */}
                        <div className="mt-6 flex justify-center">
                            <Link
                                className="group flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
                                to={ROUTES.HOME}
                            >
                                <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default LoginPage
