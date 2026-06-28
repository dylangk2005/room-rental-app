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

const SpinnerIcon = () => (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

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
        if (validationError) { setError(validationError); return }
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
        if (validationError) { setError(validationError); return }
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
        if (validationError) { setError(validationError); return }
        setIsResetting(true)
        try {
            const response = await authApi.resetPassword({
                email,
                otp: form.otp.trim(),
                newPassword: form.newPassword,
            })
            setMessage(response.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.')
            setStep('success')
            setForm((current) => ({ ...current, otp: '', newPassword: '', confirmPassword: '' }))
        } catch (resetError) {
            setError(getErrorMessage(resetError))
        } finally {
            setIsResetting(false)
        }
    }

    const steps = [
        {
            number: '1',
            title: 'Nhập email',
            description: 'Dùng email đã đăng ký để nhận mã OTP',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
            ),
        },
        {
            number: '2',
            title: 'Nhận OTP',
            description: 'Mã xác thực gửi về email của bạn',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.5-2.046m0 0l-3.348-1.809a2.25 2.25 0 00-1.954 1.339l1.953 1.809m0 0l4.5 2.046m0 0l3.348 1.809a2.25 2.25 0 001.954-1.339l-1.953-1.809" />
                </svg>
            ),
        },
        {
            number: '3',
            title: 'Đổi mật khẩu',
            description: 'Tạo mật khẩu mới an toàn cho tài khoản',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
        },
    ]

    const activeStepIndex = step === 'email' ? 0 : step === 'reset' ? 1 : 2

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

                {/* ── Left: Brand & Steps ── */}
                <section className="relative flex flex-col justify-between overflow-hidden px-6 py-10 sm:px-10 sm:py-8 lg:px-14">

                    {/* Decorative blobs */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-24 -top-16 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
                        <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
                        <div className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
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
                            <span className="block text-xl font-black tracking-normal text-slate-950 transition-colors duration-300 group-hover:text-emerald-600">TayTro</span>
                            <span className="block text-sm text-slate-500">Khôi phục tài khoản an toàn</span>
                        </span>
                    </Link>

                    {/* Main copy */}
                    <div className="relative z-10 my-auto max-w-xl lg:my-0 mt-6 sm:mt-8">
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            Xác thực qua email
                        </p>

                        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 transition-all duration-500 sm:text-4xl md:text-5xl">
                            {step === 'email' && 'Lấy lại quyền truy cập tài khoản của bạn.'}
                            {step === 'reset' && 'Nhập mã OTP để đặt lại mật khẩu.'}
                            {step === 'success' && 'Mật khẩu đã được cập nhật thành công!'}
                        </h1>

                        <p className="mt-4 text-base leading-7 text-slate-500 transition-all duration-500 sm:mt-5 sm:text-lg">
                            {step === 'email' && 'Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu mới một cách an toàn.'}
                            {step === 'reset' && `Nhập mã OTP đã gửi đến ${email}. Mã có hiệu lực trong 5 phút, hãy kiểm tra hộp thư ngay.`}
                            {step === 'success' && 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.'}
                        </p>
                    </div>

                    {/* Steps indicator */}
                    <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {steps.map((s, i) => {
                            const isActive = i === activeStepIndex
                            const isDone = i < activeStepIndex
                            return (
                                <div
                                    key={s.number}
                                    className={`
                                        group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 cursor-default
                                        ${isActive ? 'border-emerald-300 bg-white shadow-lg shadow-emerald-500/10 -translate-y-1' : ''}
                                        ${isDone ? 'border-emerald-200 bg-emerald-50/60' : ''}
                                        ${!isActive && !isDone ? 'border-slate-200/80 bg-white/60 backdrop-blur-sm hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5' : ''}
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-teal-400" />
                                    )}
                                    <div className={`
                                        flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300
                                        ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110' : ''}
                                        ${isDone ? 'bg-emerald-100 text-emerald-600' : ''}
                                        ${!isActive && !isDone ? 'bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-600' : ''}
                                    `}>
                                        {isDone ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        ) : s.icon}
                                    </div>
                                    <div>
                                        <strong className={`block text-sm font-bold transition-colors duration-300 ${isActive ? 'text-emerald-600' : 'text-slate-900 group-hover:text-emerald-600'} `}>
                                            {s.title}
                                        </strong>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{s.description}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ── Right: Form Panel ── */}
                <section className="flex items-center justify-center bg-white px-5 py-10 shadow-[0_0_80px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">

                    <div className="w-full max-w-md">

                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-950">
                                {step === 'email' && 'Quên mật khẩu'}
                                {step === 'reset' && 'Nhập mã OTP'}
                                {step === 'success' && 'Thành công!'}
                            </h2>
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                {step === 'email' && 'Nhập email đã đăng ký để nhận mã khôi phục.'}
                                {step === 'reset' && 'Kiểm tra email và nhập mã OTP gồm 6 chữ số.'}
                                {step === 'success' && 'Mật khẩu đã được cập nhật, hãy đăng nhập lại.'}
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

                        {/* Success message */}
                        {message && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm transition-all duration-300">
                                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-emerald-700">{message}</p>
                            </div>
                        )}

                        {/* ── Step: Email ── */}
                        {step === 'email' && (
                            <form className="space-y-5" onSubmit={handleSendOtp}>

                                {/* Email field */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Email đã đăng ký
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

                                {/* Submit button */}
                                <button
                                    className="group relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
                                    type="submit"
                                    disabled={isSending}
                                >
                                    <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isSending ? 'opacity-0' : 'opacity-100'}`}>
                                        Gửi mã OTP
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                    {isSending && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <SpinnerIcon />
                                            <span className="ml-2">Đang gửi OTP...</span>
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── Step: Reset (OTP + Password) ── */}
                        {step === 'reset' && (
                            <form className="space-y-5" onSubmit={handleResetPassword}>

                                {/* OTP field */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Mã OTP
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.5-2.046m0 0l-3.348-1.809a2.25 2.25 0 00-1.954 1.339l1.953 1.809m0 0l4.5 2.046m0 0l3.348 1.809a2.25 2.25 0 001.954-1.339l-1.953-1.809" />
                                            </svg>
                                        </div>
                                        <input
                                            className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-4 text-center text-2xl font-black tracking-[0.4em] text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:tracking-normal focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                            type="text"
                                            name="otp"
                                            value={form.otp}
                                            onChange={handleChange}
                                            placeholder="------"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                        />
                                    </div>
                                    <span className="mt-1.5 block text-xs font-semibold text-slate-500">
                                        Mã có hiệu lực trong <span className="font-bold text-amber-600">5 phút</span>. Kiểm tra hộp thư spam nếu không thấy.
                                    </span>
                                </div>

                                {/* Password field */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </div>
                                        <input
                                            className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-12 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                            type={showPassword ? 'text' : 'password'}
                                            name="newPassword"
                                            value={form.newPassword}
                                            onChange={handleChange}
                                            placeholder="Tạo mật khẩu mới"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-bold text-slate-500 transition-colors duration-200 hover:text-emerald-600"
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </div>

                                {/* Password rules */}
                                <div className="grid grid-cols-2 gap-2">
                                    {passwordStatus.map((rule) => (
                                        <div
                                            className={`
                                                flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300
                                                ${rule.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}
                                            `}
                                            key={rule.label}
                                        >
                                            <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] transition-all duration-300 ${rule.passed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                {rule.passed && (
                                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                )}
                                            </span>
                                            {rule.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Confirm password */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                        </div>
                                        <input
                                            className={`h-12 w-full rounded-xl border-2 bg-white py-2 pl-11 pr-12 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 ${form.confirmPassword && form.newPassword !== form.confirmPassword
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                                                    : form.confirmPassword && form.newPassword === form.confirmPassword
                                                        ? 'border-emerald-500 focus:ring-emerald-100'
                                                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                                                }`}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Nhập lại mật khẩu mới"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-bold text-slate-500 transition-colors duration-200 hover:text-emerald-600"
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                        >
                                            {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                    {form.confirmPassword && (
                                        <span className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ${form.newPassword === form.confirmPassword ? 'text-emerald-600' : 'text-red-500'
                                            }`}>
                                            {form.newPassword === form.confirmPassword ? (
                                                <>
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                    Mật khẩu khớp nhau
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                    </svg>
                                                    Mật khẩu chưa khớp
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Submit button */}
                                <button
                                    className="group relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
                                    type="submit"
                                    disabled={isResetting}
                                >
                                    <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isResetting ? 'opacity-0' : 'opacity-100'}`}>
                                        Đặt lại mật khẩu
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                    {isResetting && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <SpinnerIcon />
                                            <span className="ml-2">Đang xử lý...</span>
                                        </span>
                                    )}
                                </button>

                                {/* Resend + Edit email */}
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                    <button
                                        className="flex items-center gap-1.5 font-bold text-slate-600 transition-all duration-200 hover:text-slate-950"
                                        type="button"
                                        onClick={() => { setStep('email'); setError(''); setMessage('') }}
                                    >
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                        Sửa email
                                    </button>
                                    <button
                                        className="flex items-center gap-1.5 font-bold text-emerald-700 transition-all duration-200 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                    >
                                        <svg className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        {isResending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── Step: Success ── */}
                        {step === 'success' && (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-500/20">
                                        <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-950">Mật khẩu đã được cập nhật!</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Hãy đăng nhập lại bằng mật khẩu mới để tiếp tục quản lý tin đăng, ví và danh sách yêu thích.
                                    </p>
                                </div>

                                <Link
                                    className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                                    to={ROUTES.LOGIN}
                                >
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Đến trang đăng nhập
                                </Link>
                            </div>
                        )}

                        {/* Footer links */}
                        <div className="mt-8 flex items-center justify-between gap-3 text-sm">
                            <Link className="inline-flex items-center gap-1.5 font-medium text-slate-400 transition-colors duration-200 hover:text-emerald-600" to={ROUTES.LOGIN}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Quay lại đăng nhập
                            </Link>
                            <Link className="inline-flex items-center gap-1.5 font-medium text-slate-400 transition-colors duration-200 hover:text-emerald-600" to={ROUTES.HOME}>
                                Về trang chủ
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default ForgotPasswordPage
