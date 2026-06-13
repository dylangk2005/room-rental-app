import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import ROUTES from '../../constants/routes'

const initialForm = {
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
}

const getErrorMessage = (error) => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

const passwordRules = [
    { label: 'Ít nhất 8 ký tự', test: (value) => value.length >= 8 },
    { label: 'Có 1 chữ hoa', test: (value) => /[A-Z]/.test(value) },
    { label: 'Có 1 chữ số', test: (value) => /\d/.test(value) },
    { label: 'Có 1 ký tự đặc biệt', test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) },
]

const ForgotPasswordPage = () => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState('email')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const email = form.email.trim()
    const passwordStatus = useMemo(
        () => passwordRules.map((rule) => ({ ...rule, passed: rule.test(form.newPassword) })),
        [form.newPassword]
    )

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value,
        }))
    }

    const validateEmail = () => {
        if (!email) return 'Vui lòng nhập email đã đăng ký.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ.'
        return ''
    }

    const validateReset = () => {
        const emailError = validateEmail()
        if (emailError) return emailError
        if (!form.otp.trim()) return 'Vui lòng nhập mã OTP.'
        if (!passwordRules.every((rule) => rule.test(form.newPassword))) {
            return 'Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt.'
        }
        if (form.newPassword !== form.confirmPassword) return 'Mật khẩu xác nhận chưa khớp.'
        return ''
    }

    const handleSendOtp = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')

        const validationError = validateEmail()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsSending(true)
        try {
            const response = await authApi.forgotPassword({ email })
            setMessage(response.message || 'Mã OTP đã được gửi đến email của bạn.')
            setStep('reset')
        } catch (sendError) {
            setError(getErrorMessage(sendError))
        } finally {
            setIsSending(false)
        }
    }

    const handleResendOtp = async () => {
        setError('')
        setMessage('')

        const validationError = validateEmail()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsResending(true)
        try {
            const response = await authApi.forgotPassword({ email })
            setMessage(response.message || 'Mã OTP mới đã được gửi đến email của bạn.')
        } catch (resendError) {
            setError(getErrorMessage(resendError))
        } finally {
            setIsResending(false)
        }
    }

    const handleResetPassword = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')

        const validationError = validateReset()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsResetting(true)
        try {
            const response = await authApi.resetPassword({
                email,
                otp: form.otp.trim(),
                newPassword: form.newPassword,
            })
            setMessage(response.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.')
            setStep('success')
            setForm((current) => ({
                ...current,
                otp: '',
                newPassword: '',
                confirmPassword: '',
            }))
        } catch (resetError) {
            setError(getErrorMessage(resetError))
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
                    <Link to={ROUTES.HOME} className="inline-flex w-fit items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white">
                            T
                        </span>
                        <span>
                            <span className="block text-xl font-black text-slate-950">TAYTRO</span>
                            <span className="block text-sm text-slate-500">Khôi phục tài khoản an toàn</span>
                        </span>
                    </Link>

                    <div className="my-12 max-w-xl lg:my-0">
                        <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                            Xác thực qua email
                        </p>
                        <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                            Lấy lại quyền truy cập bằng mã OTP gửi về email.
                        </h1>
                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            Nhập email đã đăng ký, kiểm tra hộp thư để lấy OTP và đặt mật khẩu mới. Mã OTP có hiệu lực trong 5 phút.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">1</strong>
                            Nhập email
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">2</strong>
                            Nhận OTP
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">3</strong>
                            Đổi mật khẩu
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center bg-white px-6 py-10 shadow-[0_0_60px_rgba(15,23,42,0.08)] sm:px-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <p className="text-sm font-black uppercase text-emerald-700">
                                {step === 'email' && 'Bước 1'}
                                {step === 'reset' && 'Bước 2'}
                                {step === 'success' && 'Hoàn tất'}
                            </p>
                            <h2 className="mt-2 text-3xl font-black text-slate-950">
                                {step === 'email' && 'Quên mật khẩu'}
                                {step === 'reset' && 'Nhập OTP và mật khẩu mới'}
                                {step === 'success' && 'Đặt lại mật khẩu thành công'}
                            </h2>
                            <p className="mt-2 text-slate-500">
                                {step === 'email' && 'Dùng email đã đăng ký để nhận mã OTP khôi phục mật khẩu.'}
                                {step === 'reset' && `Nhập mã OTP đã gửi đến ${email}.`}
                                {step === 'success' && 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {message}
                            </div>
                        )}

                        {step === 'email' && (
                            <form className="space-y-5" onSubmit={handleSendOtp}>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Email đã đăng ký</span>
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

                                <button
                                    className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    type="submit"
                                    disabled={isSending}
                                >
                                    {isSending ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
                                </button>
                            </form>
                        )}

                        {step === 'reset' && (
                            <form className="space-y-5" onSubmit={handleResetPassword}>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Mã OTP</span>
                                    <input
                                        className="h-14 w-full rounded-lg border border-slate-300 px-4 text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                        type="text"
                                        name="otp"
                                        value={form.otp}
                                        onChange={handleChange}
                                        placeholder="000000"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                    <span className="mt-2 block text-xs font-semibold text-slate-500">OTP hết hạn sau 5 phút.</span>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Mật khẩu mới</span>
                                    <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                        <input
                                            className="min-w-0 flex-1 px-4 text-slate-950 outline-none"
                                            type={showPassword ? 'text' : 'password'}
                                            name="newPassword"
                                            value={form.newPassword}
                                            onChange={handleChange}
                                            placeholder="Tạo mật khẩu mới"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            className="px-4 text-sm font-bold text-slate-500"
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    {passwordStatus.map((rule) => (
                                        <div
                                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                                rule.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                            key={rule.label}
                                        >
                                            {rule.passed ? '✓ ' : ''}
                                            {rule.label}
                                        </div>
                                    ))}
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Xác nhận mật khẩu mới</span>
                                    <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                        <input
                                            className="min-w-0 flex-1 px-4 text-slate-950 outline-none"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Nhập lại mật khẩu mới"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            className="px-4 text-sm font-bold text-slate-500"
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                        >
                                            {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </label>

                                <button
                                    className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    type="submit"
                                    disabled={isResetting}
                                >
                                    {isResetting ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}
                                </button>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                    <button
                                        className="font-bold text-slate-600 hover:text-slate-950"
                                        type="button"
                                        onClick={() => {
                                            setStep('email')
                                            setError('')
                                            setMessage('')
                                        }}
                                    >
                                        Sửa email
                                    </button>
                                    <button
                                        className="font-bold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                    >
                                        {isResending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'success' && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                                <h3 className="text-xl font-black text-emerald-900">Mật khẩu đã được cập nhật</h3>
                                <p className="mt-2 text-sm leading-6 text-emerald-800">
                                    Hãy đăng nhập lại bằng mật khẩu mới để tiếp tục quản lý tin đăng, ví và danh sách yêu thích.
                                </p>
                                <Link
                                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                                    to={ROUTES.LOGIN}
                                >
                                    Đến trang đăng nhập
                                </Link>
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <Link className="font-bold text-emerald-700 hover:text-emerald-800" to={ROUTES.LOGIN}>
                                Quay lại đăng nhập
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

export default ForgotPasswordPage
