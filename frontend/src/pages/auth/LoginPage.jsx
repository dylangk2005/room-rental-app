import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import ROUTES from '../../constants/routes'

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER', 'MODERATOR'])
const USER_STORAGE_KEY = 'taytro_user'

const getErrorMessage = (error) => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || 'Đăng nhập không thành công. Vui lòng thử lại.'
}

const LoginPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [form, setForm] = useState({
        email: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

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

            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
            const nextPath = location.state?.from || ROUTES.HOME
            navigate(ADMIN_ROLES.has(user?.role) ? ROUTES.ADMIN_DASHBOARD : nextPath, { replace: true })
        } catch (loginError) {
            setError(getErrorMessage(loginError))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
                    <Link to={ROUTES.HOME} className="inline-flex w-fit items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white">
                            T
                        </span>
                        <span>
                            <span className="block text-xl font-black tracking-normal text-slate-950">TAYTRO</span>
                            <span className="block text-sm text-slate-500">Tìm phòng trọ dễ dàng hơn</span>
                        </span>
                    </Link>

                    <div className="my-12 max-w-xl lg:my-0">
                        <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                            Nền tảng đăng tin và tìm phòng trọ
                        </p>
                        <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                            Đăng nhập để lưu phòng, đăng tin và quản lý giao dịch.
                        </h1>
                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            TAYTRO kết nối người thuê với chủ phòng bằng danh sách tin rõ ràng, bộ lọc nhanh và thông
                            tin phòng dễ kiểm tra trên mọi thiết bị.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">24h</strong>
                            Cập nhật tin
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">VIP</strong>
                            Ưu tiên hiển thị
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">OTP</strong>
                            Bảo vệ tài khoản
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center bg-white px-6 py-10 shadow-[0_0_60px_rgba(15,23,42,0.08)] sm:px-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-950">Đăng nhập</h2>
                            <p className="mt-2 text-slate-500">Dùng email đã đăng ký để tiếp tục vào TAYTRO.</p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-slate-800">Email</span>
                                <input
                                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="hoa.pham@gmail.com"
                                    autoComplete="email"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-800">
                                    <span>Mật khẩu</span>
                                    <Link className="text-emerald-700 hover:text-emerald-800" to={ROUTES.FORGOT_PASSWORD}>
                                        Quên mật khẩu?
                                    </Link>
                                </span>
                                <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white transition-within focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                    <input
                                        className="min-w-0 flex-1 px-4 text-slate-950 outline-none"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Nhập mật khẩu"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        className="px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                    >
                                        {showPassword ? 'Ẩn' : 'Hiện'}
                                    </button>
                                </div>
                            </label>

                            <button
                                className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <Link className="font-bold text-emerald-700 hover:text-emerald-800" to={ROUTES.REGISTER}>
                                Tạo tài khoản mới
                            </Link>
                            <Link className="font-bold text-slate-600 hover:text-slate-950" to={ROUTES.HOME}>
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
