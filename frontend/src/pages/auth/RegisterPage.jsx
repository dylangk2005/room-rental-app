import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import ROUTES from '../../constants/routes'

const initialForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
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

const RegisterPage = () => {
    const [form, setForm] = useState(initialForm)
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState('form')
    const [showPassword, setShowPassword] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const passwordStatus = useMemo(
        () => passwordRules.map((rule) => ({ ...rule, passed: rule.test(form.password) })),
        [form.password]
    )

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const validateForm = () => {
        if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên.'
        if (!form.email.trim()) return 'Vui lòng nhập email.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email không hợp lệ.'
        if (!form.phoneNumber.trim()) return 'Vui lòng nhập số điện thoại.'
        if (!/^(\+84|0)\d{9}$/.test(form.phoneNumber.trim())) {
            return 'Số điện thoại cần có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.'
        }
        if (!passwordRules.every((rule) => rule.test(form.password))) {
            return 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt.'
        }
        if (form.password !== form.confirmPassword) return 'Mật khẩu xác nhận chưa khớp.'
        return ''
    }

    const registerPayload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
    }

    const handleRegister = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsRegistering(true)
        try {
            const response = await authApi.register(registerPayload)
            setMessage(response.message || 'Mã OTP đã được gửi đến email của bạn.')
            setStep('otp')
        } catch (registerError) {
            setError(getErrorMessage(registerError))
        } finally {
            setIsRegistering(false)
        }
    }

    const handleVerifyOtp = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')

        if (!otp.trim()) {
            setError('Vui lòng nhập mã OTP.')
            return
        }

        setIsVerifying(true)
        try {
            const response = await authApi.verifyOtp({
                email: form.email.trim(),
                otp: otp.trim(),
            })
            setMessage(response.message || 'Xác thực tài khoản thành công. Bạn có thể đăng nhập ngay.')
            setStep('success')
        } catch (verifyError) {
            setError(getErrorMessage(verifyError))
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        setError('')
        setMessage('')
        setIsResending(true)

        try {
            const response = await authApi.register(registerPayload)
            setMessage(response.message || 'Mã OTP mới đã được gửi đến email của bạn.')
        } catch (resendError) {
            setError(getErrorMessage(resendError))
        } finally {
            setIsResending(false)
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
                            <span className="block text-sm text-slate-500">Đăng ký nhanh, xác thực an toàn</span>
                        </span>
                    </Link>

                    <div className="my-12 max-w-xl lg:my-0">
                        <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                            Tạo tài khoản miễn phí
                        </p>
                        <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                            Bắt đầu tìm phòng, lưu tin yêu thích và đăng phòng cho thuê.
                        </h1>
                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            Sau khi gửi thông tin, TAYTRO sẽ gửi mã OTP về email để xác thực tài khoản trước khi đăng
                            nhập.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">1</strong>
                            Nhập thông tin
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">2</strong>
                            Nhận mã OTP
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="block text-xl text-slate-950">3</strong>
                            Đăng nhập
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center bg-white px-6 py-10 shadow-[0_0_60px_rgba(15,23,42,0.08)] sm:px-10">
                    <div className="w-full max-w-lg">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-950">
                                {step === 'form' && 'Đăng ký tài khoản'}
                                {step === 'otp' && 'Xác thực OTP'}
                                {step === 'success' && 'Tài khoản đã sẵn sàng'}
                            </h2>
                            <p className="mt-2 text-slate-500">
                                {step === 'form' && 'Điền thông tin thật để chủ phòng và người thuê liên hệ thuận tiện.'}
                                {step === 'otp' && `Nhập mã OTP đã gửi đến ${form.email.trim()}.`}
                                {step === 'success' && 'Bạn có thể đăng nhập để sử dụng đầy đủ chức năng của TAYTRO.'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {message}
                            </div>
                        )}

                        {step === 'form' && (
                            <form className="space-y-5" onSubmit={handleRegister}>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Họ và tên</span>
                                    <input
                                        className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn An"
                                        autoComplete="name"
                                    />
                                </label>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-slate-800">Email</span>
                                        <input
                                            className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="ban@example.com"
                                            autoComplete="email"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-slate-800">Số điện thoại</span>
                                        <input
                                            className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                            name="phoneNumber"
                                            value={form.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="0901234567"
                                            autoComplete="tel"
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Mật khẩu</span>
                                    <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                        <input
                                            className="min-w-0 flex-1 px-4 outline-none"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Tối thiểu 8 ký tự"
                                            autoComplete="new-password"
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

                                <div className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                                    {passwordStatus.map((rule) => (
                                        <span
                                            className={rule.passed ? 'font-semibold text-emerald-700' : 'text-slate-500'}
                                            key={rule.label}
                                        >
                                            {rule.passed ? '✓' : '•'} {rule.label}
                                        </span>
                                    ))}
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">
                                        Xác nhận mật khẩu
                                    </span>
                                    <input
                                        className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Nhập lại mật khẩu"
                                        autoComplete="new-password"
                                    />
                                </label>

                                <button
                                    className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    type="submit"
                                    disabled={isRegistering}
                                >
                                    {isRegistering ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
                                </button>
                            </form>
                        )}

                        {step === 'otp' && (
                            <form className="space-y-5" onSubmit={handleVerifyOtp}>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">Mã OTP</span>
                                    <input
                                        className="h-14 w-full rounded-lg border border-slate-300 px-4 text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                        value={otp}
                                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                </label>

                                <button
                                    className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    type="submit"
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? 'Đang xác thực...' : 'Xác thực tài khoản'}
                                </button>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                    <button
                                        className="font-bold text-slate-600 hover:text-slate-950"
                                        type="button"
                                        onClick={() => {
                                            setStep('form')
                                            setError('')
                                            setMessage('')
                                        }}
                                    >
                                        Sửa thông tin
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
                                <h3 className="text-xl font-black text-emerald-900">Xác thực thành công</h3>
                                <p className="mt-2 text-sm leading-6 text-emerald-800">
                                    Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để lưu phòng yêu thích, xem thông
                                    tin liên hệ và đăng tin cho thuê.
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
                                Đã có tài khoản
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

export default RegisterPage
