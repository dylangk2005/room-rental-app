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

const SpinnerIcon = () => (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const steps = [
    { label: 'Nhập thông tin' },
    { label: 'Xác thực OTP' },
    { label: 'Hoàn tất' },
]

const RegisterPage = () => {
    const [form, setForm] = useState(initialForm)
    const [step, setStep] = useState(0)
    const [otp, setOtp] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const passwordStatus = useMemo(
        () => passwordRules.map((rule) => ({ ...rule, passed: rule.test(form.password) })),
        [form.password]
    )

    const allRulesPassed = useMemo(() => passwordStatus.every((r) => r.passed), [passwordStatus])
    const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword

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
            return 'Mật khẩu phải đạt tất cả các yêu cầu bên dưới.'
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
        setSuccessMsg('')

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsRegistering(true)
        try {
            const response = await authApi.register(registerPayload)
            setSuccessMsg(response.message || 'Mã OTP đã được gửi đến email của bạn.')
            setStep(1)
        } catch (registerError) {
            setError(getErrorMessage(registerError))
        } finally {
            setIsRegistering(false)
        }
    }

    const handleVerifyOtp = async (event) => {
        event.preventDefault()
        setError('')
        setSuccessMsg('')

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
            setSuccessMsg(response.message || 'Xác thực tài khoản thành công.')
            setStep(2)
        } catch (verifyError) {
            setError(getErrorMessage(verifyError))
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        setError('')
        setSuccessMsg('')
        setIsResending(true)

        try {
            const response = await authApi.register(registerPayload)
            setSuccessMsg(response.message || 'Mã OTP mới đã được gửi đến email của bạn.')
        } catch (resendError) {
            setError(getErrorMessage(resendError))
        } finally {
            setIsResending(false)
        }
    }

    const currentStep = steps[step]

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">

                {/* ── Left: Brand & How-it-works ── */}
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
                            <span className="block text-sm text-slate-500">Đăng ký nhanh, xác thực an toàn</span>
                        </span>
                    </Link>

                    {/* Main copy */}
                    <div className="relative z-10 my-auto max-w-xl lg:my-0 mt-6 sm:mt-8">
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hoàn toàn miễn phí
                        </p>

                        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                            Tạo tài khoản để bắt đầu tìm phòng ngay hôm nay.
                        </h1>

                        <p className="mt-4 text-base leading-7 text-slate-500 sm:mt-5 sm:text-lg">
                            Đăng ký chỉ mất 1 phút. Tài khoản được bảo vệ bằng xác thực OTP qua email trước khi kích hoạt.
                        </p>
                    </div>

                    {/* Step progress */}
                    <div className="relative z-10">
                        <div className="mb-5 flex items-center gap-2">
                            {steps.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${i < step
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                            : i === step
                                                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {i < step ? (
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-semibold hidden sm:block transition-colors duration-300 ${i <= step ? 'text-slate-700' : 'text-slate-400'
                                            }`}
                                    >
                                        {s.label}
                                    </span>
                                    {i < steps.length - 1 && (
                                        <div className={`h-px w-6 sm:w-10 transition-colors duration-300 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-sm font-medium text-slate-500">
                            {step === 0 && 'Bước 1: Điền thông tin cá nhân để tạo tài khoản.'}
                            {step === 1 && 'Bước 2: Nhập mã OTP được gửi đến email của bạn.'}
                            {step === 2 && 'Bước 3: Tài khoản đã kích hoạt, đăng nhập ngay!'}
                        </p>
                    </div>
                </section>

                {/* ── Right: Form Panel ── */}
                <section className="flex items-center justify-center bg-white px-5 py-10 shadow-[0_0_80px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
                    <div className="w-full max-w-lg">

                        {/* Step heading */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-950">{currentStep.label}</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {step === 0 && 'Điền thông tin thật để chủ phòng và người thuê liên hệ thuận tiện.'}
                                {step === 1 && `Nhập mã OTP đã gửi đến ${form.email.trim() || 'email của bạn'}.`}
                                {step === 2 && 'Tài khoản của bạn đã được kích hoạt thành công!'}
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
                        {successMsg && step === 1 && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm transition-all duration-300">
                                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-emerald-700">{successMsg}</p>
                            </div>
                        )}

                        {/* ── Step 0: Registration Form ── */}
                        {step === 0 && (
                            <form className="space-y-5" onSubmit={handleRegister}>

                                {/* Full name */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <input
                                            className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                            name="fullName"
                                            value={form.fullName}
                                            onChange={handleChange}
                                            placeholder="Nguyễn Văn An"
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>

                                {/* Email + Phone row */}
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

                                    <div className="group">
                                        <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                </svg>
                                            </div>
                                            <input
                                                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                                name="phoneNumber"
                                                value={form.phoneNumber}
                                                onChange={handleChange}
                                                placeholder="0901234567"
                                                autoComplete="tel"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </div>
                                        <input
                                            className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-11 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Tối thiểu 8 ký tự"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-bold text-slate-500"
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>

                                    {/* Password rules checklist */}
                                    {form.password.length > 0 && (
                                        <div className="mt-2 grid grid-cols-2 gap-1">
                                            {passwordStatus.map((rule) => (
                                                <span
                                                    key={rule.label}
                                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 ${rule.passed ? 'text-emerald-600' : 'text-slate-400'}`}
                                                >
                                                    {rule.passed ? (
                                                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    ) : (
                                                        <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-current opacity-40" />
                                                    )}
                                                    {rule.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                        </div>
                                        <input
                                            className={`h-12 w-full rounded-xl border-2 bg-white py-2 pl-11 pr-4 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-100 ${
                                                form.confirmPassword.length > 0
                                                    ? passwordsMatch
                                                        ? 'border-emerald-400 focus:border-emerald-500'
                                                        : 'border-red-300 focus:border-red-500'
                                                    : 'border-slate-200 focus:border-emerald-500'
                                            }`}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Nhập lại mật khẩu"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    {form.confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                            </svg>
                                            Mật khẩu chưa khớp
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    className="group relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
                                    type="submit"
                                    disabled={isRegistering || (form.confirmPassword.length > 0 && (!allRulesPassed || !passwordsMatch))}
                                >
                                    <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isRegistering ? 'opacity-0' : 'opacity-100'}`}>
                                        Gửi mã OTP
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                    {isRegistering && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <SpinnerIcon />
                                            <span className="ml-2">Đang gửi...</span>
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── Step 1: OTP Verification ── */}
                        {step === 1 && (
                            <form className="space-y-5" onSubmit={handleVerifyOtp}>
                                <div className="group">
                                    <label className="mb-2 block text-sm font-bold text-slate-800 transition-colors duration-200 group-focus-within:text-emerald-600">
                                        Mã OTP
                                    </label>
                                    <input
                                        className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-center text-2xl font-black tracking-[0.4em] text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                        value={otp}
                                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="• • • • • •"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                </div>

                                <button
                                    className="group relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
                                    type="submit"
                                    disabled={isVerifying || otp.length < 6}
                                >
                                    <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isVerifying ? 'opacity-0' : 'opacity-100'}`}>
                                        Xác thực tài khoản
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    {isVerifying && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <SpinnerIcon />
                                            <span className="ml-2">Đang xác thực...</span>
                                        </span>
                                    )}
                                </button>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                    <button
                                        className="flex items-center gap-1.5 font-bold text-slate-500 transition-colors duration-200 hover:text-emerald-600"
                                        type="button"
                                        onClick={() => { setStep(0); setError(''); setSuccessMsg('') }}
                                    >
                                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                        Sửa thông tin
                                    </button>
                                    <button
                                        className="flex items-center gap-1.5 font-bold text-emerald-600 transition-colors duration-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400"
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                    >
                                        {isResending ? (
                                            <>
                                                <SpinnerIcon />
                                                <span className="ml-1">Đang gửi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                </svg>
                                                Gửi lại OTP
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── Step 2: Success ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-500/20">
                                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-emerald-900">Xác thực thành công!</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                                        Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để lưu phòng yêu thích, xem thông tin liên hệ và đăng tin cho thuê.
                                    </p>
                                </div>

                                <Link
                                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-[0.98]"
                                    to={ROUTES.LOGIN}
                                >
                                    Đăng nhập ngay
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </Link>
                            </div>
                        )}

                        {/* Footer links */}
                        <div className="mt-6 flex items-center justify-between text-sm">
                            <Link
                                className="flex items-center gap-1.5 font-bold text-slate-500 transition-colors duration-200 hover:text-emerald-600"
                                to={ROUTES.LOGIN}
                            >
                                <svg className="h-4 w-4 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Đã có tài khoản
                            </Link>
                            <Link
                                className="flex items-center gap-1.5 font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
                                to={ROUTES.HOME}
                            >
                                Về trang chủ
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default RegisterPage
