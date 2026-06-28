import { useState, useEffect, useRef } from 'react'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import authApi from '../../api/authApi'
import userApi from '../../api/userApi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SafeImage from '../../components/common/SafeImage'

const UserIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
)

const PhoneIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
)

const MailIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
)

const ShieldIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
)

const LockIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
)

const CameraIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
)

const roleLabels = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    MODERATOR: 'Người kiểm duyệt',
}

const validatePassword = (pw) => ({
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
})

const InternalProfilePage = () => {
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
    })
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [profileError, setProfileError] = useState('')
    const [profileSuccess, setProfileSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [passwordStrength, setPasswordStrength] = useState({ length: false, lower: false, upper: false, digit: false, special: false })
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarError, setAvatarError] = useState('')
    const [hasAvatarError, setHasAvatarError] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
            })
            setHasAvatarError(false)
        }
    }, [user])

    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setAvatarError('Vui lòng chọn file ảnh hợp lệ.')
            e.target.value = ''
            return
        }

        setAvatarError('')
        setIsUploadingAvatar(true)

        try {
            const response = await userApi.uploadAvatar(file)
            const updated = response.data
            updateUser({ fullName: updated.fullName, phoneNumber: updated.phoneNumber, avatar: updated.avatar })
            setProfileSuccess('Cập nhật ảnh đại diện thành công!')
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Không upload được ảnh. Vui lòng thử lại.')
        } finally {
            setIsUploadingAvatar(false)
            e.target.value = ''
        }
    }

    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setProfileError('')
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileError('')
        setProfileSuccess('')

        if (!formData.fullName.trim()) {
            setProfileError('Vui lòng nhập họ tên')
            return
        }

        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            setProfileError('Số điện thoại không hợp lệ (10-11 chữ số)')
            return
        }

        setIsSaving(true)

        try {
            const response = await userApi.updateProfile({
                fullName: formData.fullName.trim(),
                phoneNumber: formData.phoneNumber.trim() || null,
            })
            const updated = response.data
            updateUser({ fullName: updated.fullName, phoneNumber: updated.phoneNumber, avatar: updated.avatar })
            setProfileSuccess('Cập nhật hồ sơ thành công!')
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.')
        } finally {
            setIsSaving(false)
        }
    }

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordForm((prev) => ({ ...prev, [name]: value }))
        setPasswordError('')
        if (name === 'newPassword') {
            setPasswordStrength(validatePassword(value))
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        if (!passwordForm.currentPassword) {
            setPasswordError('Vui lòng nhập mật khẩu hiện tại')
            return
        }

        const checks = validatePassword(passwordForm.newPassword)
        if (!Object.values(checks).every(Boolean)) {
            setPasswordError('Mật khẩu mới chưa đủ yêu cầu')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Mật khẩu mới không khớp')
            return
        }

        if (passwordForm.currentPassword === passwordForm.newPassword) {
            setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại')
            return
        }

        setIsChangingPassword(true)

        try {
            await authApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            })
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setPasswordStrength({ length: false, lower: false, upper: false, digit: false, special: false })
            setPasswordSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.')
        } finally {
            setIsChangingPassword(false)
        }
    }

    const getDashboardPath = () => {
        switch (user?.role) {
            case 'ADMIN': return ROUTES.ADMIN_DASHBOARD
            case 'MANAGER': return ROUTES.MANAGER_DASHBOARD
            case 'MODERATOR': return ROUTES.MODERATOR_HOME
            default: return ROUTES.HOME
        }
    }

    const tabs = [
        { key: 'profile', label: 'Hồ sơ' },
        { key: 'security', label: 'Bảo mật' },
    ]

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-950">
            <AppHeader />

            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(getDashboardPath())}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-emerald-600"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Quay lại dashboard
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                            <ShieldIcon />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Hồ sơ cá nhân</h1>
                            <p className="text-sm text-slate-500">
                                {roleLabels[user?.role] || user?.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                                activeTab === tab.key
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Profile */}
                {activeTab === 'profile' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        {profileError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                                {profileError}
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                                {profileSuccess}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="mb-6 flex items-center gap-4">
                            <div className="relative shrink-0">
                                {user?.avatar && !hasAvatarError ? (
                                    <SafeImage
                                        src={user.avatar}
                                        fallbackSrc=""
                                        alt={user.fullName || 'Avatar'}
                                        className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                                        onErrorCustom={() => setHasAvatarError(true)}
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-black text-white shadow-lg">
                                        {(user?.fullName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Đổi ảnh đại diện"
                                >
                                    {isUploadingAvatar ? (
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <CameraIcon className="h-4 w-4" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarFileChange}
                                />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">Ảnh đại diện</p>
                                <p className="text-sm text-slate-500">Nhấn nút camera để đổi ảnh</p>
                                {avatarError && (
                                    <p className="mt-1 text-sm font-bold text-red-600">{avatarError}</p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                            {/* Email (readonly) */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                                    <span className="inline-flex items-center gap-1.5">
                                        <MailIcon />
                                        Email
                                    </span>
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400"
                                />
                                <p className="mt-1 text-xs text-slate-400">Email không thể thay đổi</p>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="fullName">
                                    <span className="inline-flex items-center gap-1.5">
                                        <UserIcon />
                                        Họ tên
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleProfileChange}
                                    placeholder="Nhập họ tên của bạn"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="phoneNumber">
                                    <span className="inline-flex items-center gap-1.5">
                                        <PhoneIcon />
                                        Số điện thoại
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleProfileChange}
                                    placeholder="Nhập số điện thoại (10-11 số)"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                                <p className="mt-1 text-xs text-slate-400">Số điện thoại liên hệ công việc</p>
                            </div>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        'Lưu thay đổi'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab: Security */}
                {activeTab === 'security' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                <LockIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-950">Bảo mật tài khoản</h2>
                                <p className="text-sm text-slate-500">Đổi mật khẩu bằng mật khẩu hiện tại để bảo vệ tài khoản.</p>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="currentPassword">
                                    Mật khẩu hiện tại
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        autoComplete="current-password"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-0 pl-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('current')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        {showPasswords.current
                                            ? <EyeOffIcon className="h-5 w-5" />
                                            : <EyeIcon className="h-5 w-5" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="newPassword">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Ít nhất 8 ký tự, có hoa thường, số, ký tự đặc biệt"
                                        autoComplete="new-password"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-0 pl-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        {showPasswords.new
                                            ? <EyeOffIcon className="h-5 w-5" />
                                            : <EyeIcon className="h-5 w-5" />
                                        }
                                    </button>
                                </div>

                                {/* Password checklist */}
                                {passwordForm.newPassword && (
                                    <div className="mt-2 space-y-1.5">
                                        {[
                                            { key: 'length', label: 'Ít nhất 8 ký tự' },
                                            { key: 'lower', label: 'Ít nhất 1 chữ thường (a-z)' },
                                            { key: 'upper', label: 'Ít nhất 1 chữ hoa (A-Z)' },
                                            { key: 'digit', label: 'Ít nhất 1 chữ số (0-9)' },
                                            { key: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#$%...)' },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                                                    passwordStrength[key]
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {passwordStrength[key] && <CheckIcon className="h-2.5 w-2.5" />}
                                                </span>
                                                <span className={`text-xs ${passwordStrength[key] ? 'font-bold text-emerald-700' : 'text-slate-400'}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="confirmPassword">
                                    Xác nhận mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        autoComplete="new-password"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-0 pl-4 pr-12 text-sm font-bold text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        {showPasswords.confirm
                                            ? <EyeOffIcon className="h-5 w-5" />
                                            : <EyeIcon className="h-5 w-5" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Security tips */}
                            <div className="rounded-xl bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <ShieldIcon />
                                    <p className="text-xs font-bold text-slate-700">Mẹo bảo mật</p>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-500">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 text-emerald-500">✓</span>
                                        Sử dụng mật khẩu mạnh, không dùng thông tin cá nhân dễ đoán
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 text-emerald-500">✓</span>
                                        Không chia sẻ mật khẩu với người khác
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 text-emerald-500">✓</span>
                                        Thay đổi mật khẩu định kỳ
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-300/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <LockIcon className="h-4 w-4" />
                                        Đổi mật khẩu
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </main>
    )
}

export default InternalProfilePage
