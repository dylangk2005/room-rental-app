import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import authApi from '../../api/authApi'

const LockIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const EyeIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

const EyeOffIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
)

const ChangePasswordPage = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const togglePassword = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setError('')
    }

    const validatePassword = (password) => {
        if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự'
        if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa'
        if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường'
        if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 số'
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!formData.currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại')
            return
        }

        const passwordError = validatePassword(formData.newPassword)
        if (passwordError) {
            setError(passwordError)
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu mới không khớp')
            return
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('Mật khẩu mới phải khác mật khẩu hiện tại')
            return
        }

        setIsLoading(true)

        try {
            await authApi.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            })
            setSuccess('Đổi mật khẩu thành công!')
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setTimeout(() => navigate(ROUTES.HOME), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-950">
            <AppHeader />

            <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                            <LockIcon />
                        </div>
                        <h1 className="text-xl font-black text-slate-950 sm:text-2xl">Đổi mật khẩu</h1>
                        <p className="mt-2 text-sm text-slate-500">Cập nhật mật khẩu mới cho tài khoản của bạn</p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="currentPassword">
                                Mật khẩu hiện tại
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePassword('current')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                >
                                    {showPasswords.current ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="newPassword">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    placeholder="Ít nhất 8 ký tự, có hoa thường, số, ký tự đặc biệt"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePassword('new')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                >
                                    {showPasswords.new ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="confirmPassword">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    placeholder="Nhập lại mật khẩu mới"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePassword('confirm')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                >
                                    {showPasswords.confirm ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-bold text-slate-500">Yêu cầu mật khẩu:</p>
                            <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                                <li>• Ít nhất 8 ký tự</li>
                                <li>• Ít nhất 1 chữ hoa (A-Z)</li>
                                <li>• Ít nhất 1 chữ thường (a-z)</li>
                                <li>• Ít nhất 1 số (0-9)</li>
                                <li>• Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Đổi mật khẩu'
                                )}
                            </button>

                            <Link
                                to={ROUTES.HOME}
                                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Quay lại trang chủ
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}

export default ChangePasswordPage
