import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import membershipApi from '../../api/membershipApi'
import userApi from '../../api/userApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const getInitial = (name = '') => {
    const trimmedName = name.trim()
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : 'T'
}

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || fallback
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatMembershipName = (value = '') => {
    const normalized = value.toString().trim().toLowerCase()
    const labels = {
        sat: 'Sắt',
        dong: 'Đồng',
        bac: 'Bạc',
        vang: 'Vàng',
        'kim cuong': 'Kim cương',
    }

    return labels[normalized] || value || 'Sắt'
}

const membershipRankTable = [
    { id: 5, name: 'Kim cương', minSpent: 15000000, discountPercent: 25 },
    { id: 4, name: 'Vàng', minSpent: 7000000, discountPercent: 15 },
    { id: 3, name: 'Bạc', minSpent: 2000000, discountPercent: 10 },
    { id: 2, name: 'Đồng', minSpent: 500000, discountPercent: 5 },
    { id: 1, name: 'Sắt', minSpent: 0, discountPercent: 0 },
]

const formatDate = (value) => {
    if (!value) return 'Đang cập nhật'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

const statusLabels = {
    ACTIVE: 'Đang hoạt động',
    BANNED: 'Đã khóa',
    INACTIVE: 'Tạm ngưng',
}

const roleLabels = {
    USER: 'Người dùng',
    MODERATOR: 'Kiểm duyệt',
    MANAGER: 'Quản lý',
    ADMIN: 'Quản trị',
}

const Icon = ({ name }) => {
    const paths = {
        user: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0',
        wallet: 'M4 7h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h4',
        lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z',
        upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
        medal: 'M8 3h8l2 5-6 4-6-4 2-5ZM9 13l-1 8 4-2 4 2-1-8',
    }

    return (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    )
}

const Avatar = ({ user }) => {
    const [hasImageError, setHasImageError] = useState(false)
    const showImage = user?.avatar && !hasImageError

    return (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-600 text-3xl font-black text-white shadow-sm">
            {showImage ? (
                <img
                    className="h-full w-full object-cover"
                    src={user.avatar}
                    alt={user.fullName || 'Ảnh đại diện'}
                    onError={() => setHasImageError(true)}
                />
            ) : (
                getInitial(user?.fullName)
            )}
        </div>
    )
}

const LoadingSkeleton = () => (
    <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
        </div>
    </div>
)

const InfoTile = ({ label, value, tone = 'slate' }) => {
    const toneClass = tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-950'

    return (
        <div className={`rounded-lg p-4 ${toneClass}`}>
            <span className="block text-xs font-bold uppercase text-slate-500">{label}</span>
            <strong className="mt-1 block text-lg">{value}</strong>
        </div>
    )
}

const ProfilePage = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(readStoredUser)
    const [profile, setProfile] = useState(null)
    const [membership, setMembership] = useState(null)
    const [walletBalance, setWalletBalance] = useState(0)
    const [activeTab, setActiveTab] = useState('profile')
    const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' })
    const [avatarFile, setAvatarFile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isRequestingPasswordOtp, setIsRequestingPasswordOtp] = useState(false)
    const [error, setError] = useState('')
    const [profileMessage, setProfileMessage] = useState('')
    const [profileError, setProfileError] = useState('')
    const [passwordMessage, setPasswordMessage] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const loadProfile = useCallback(async () => {
        setIsLoading(true)
        setError('')
        setProfileMessage('')
        setProfileError('')
        setPasswordMessage('')
        setPasswordError('')

        try {
            const refreshResponse = await authApi.refresh()
            const refreshedUser = refreshResponse.data
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(refreshedUser))
            setUser(refreshedUser)

            const [profileResult, walletResult, membershipResult] = await Promise.allSettled([
                userApi.getProfile(),
                walletApi.getBalance(),
                membershipApi.getMyLevel(),
            ])

            if (profileResult.status !== 'fulfilled') {
                throw profileResult.reason
            }

            const profileData = profileResult.value.data
            setProfile(profileData)
            setProfileForm({
                fullName: profileData.fullName || '',
                phoneNumber: profileData.phoneNumber || '',
            })

            setWalletBalance(walletResult.status === 'fulfilled' ? walletResult.value.data?.balance || 0 : 0)
            setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value.data : null)
        } catch (loadError) {
            localStorage.removeItem(USER_STORAGE_KEY)
            setUser(null)

            if (loadError.response?.status === 401) {
                navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.PROFILE } })
                return
            }

            setError(getErrorMessage(loadError, 'Không tải được hồ sơ cá nhân. Vui lòng thử lại.'))
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadProfile()
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [loadProfile])

    const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : ''), [avatarFile])

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview)
            }
        }
    }, [avatarPreview])

    const totalSpent = Number(membership?.totalSpent ?? profile?.totalSpent ?? 0)

    const currentRank = useMemo(
        () =>
            membershipRankTable.find((rank) => totalSpent >= rank.minSpent) ||
            membershipRankTable[membershipRankTable.length - 1],
        [totalSpent]
    )

    const nextRank = useMemo(
        () =>
            [...membershipRankTable]
                .reverse()
                .find((rank) => rank.minSpent > totalSpent) || null,
        [totalSpent]
    )

    const membershipProgress = useMemo(() => {
        if (!nextRank) return 100
        return Math.min(100, Math.max(0, Math.round((totalSpent / nextRank.minSpent) * 100)))
    }, [nextRank, totalSpent])

    const handleProfileChange = (event) => {
        const { name, value } = event.target
        setProfileForm((current) => ({ ...current, [name]: value }))
    }

    const handlePasswordChange = (event) => {
        const { name, value } = event.target
        setPasswordForm((current) => ({
            ...current,
            [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value,
        }))
    }

    const handleRequestPasswordOtp = async () => {
        setPasswordError('')
        setPasswordMessage('')
        setIsRequestingPasswordOtp(true)

        try {
            await authApi.requestChangePasswordOtp()
            setPasswordMessage('Mã OTP đã được gửi đến email của bạn.')
        } catch (otpError) {
            setPasswordError(getErrorMessage(otpError, 'Không gửi được OTP. Vui lòng thử lại.'))
        } finally {
            setIsRequestingPasswordOtp(false)
        }
    }

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0]
        setProfileError('')

        if (!file) {
            setAvatarFile(null)
            return
        }

        if (!file.type.startsWith('image/')) {
            setProfileError('Vui lòng chọn file ảnh hợp lệ.')
            event.target.value = ''
            return
        }

        setAvatarFile(file)
    }

    const syncUser = (updatedProfile) => {
        const updatedUser = {
            ...user,
            fullName: updatedProfile.fullName,
            phoneNumber: updatedProfile.phoneNumber,
            avatar: updatedProfile.avatar,
            status: updatedProfile.status,
            role: updatedProfile.role,
            membershipLevel: updatedProfile.membershipLevel,
        }

        setProfile(updatedProfile)
        setUser(updatedUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
    }

    const handleProfileSubmit = async (event) => {
        event.preventDefault()
        setProfileError('')
        setProfileMessage('')

        if (!profileForm.fullName.trim() || !profileForm.phoneNumber.trim()) {
            setProfileError('Vui lòng nhập đầy đủ họ tên và số điện thoại.')
            return
        }

        setIsSavingProfile(true)

        try {
            const response = await userApi.updateProfile({
                fullName: profileForm.fullName.trim(),
                phoneNumber: profileForm.phoneNumber.trim(),
                avatar: profile.avatar || '',
            })

            syncUser(response.data)
            setProfileMessage('Đã cập nhật thông tin tài khoản.')
        } catch (saveError) {
            setProfileError(getErrorMessage(saveError, 'Không cập nhật được hồ sơ. Vui lòng thử lại.'))
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleAvatarSubmit = async () => {
        setProfileError('')
        setProfileMessage('')

        if (!avatarFile) {
            setProfileError('Vui lòng chọn ảnh đại diện từ máy.')
            return
        }

        setIsUploadingAvatar(true)

        try {
            const response = await userApi.uploadAvatar(avatarFile)
            syncUser(response.data)
            setAvatarFile(null)
            setProfileMessage('Đã cập nhật ảnh đại diện.')
        } catch (uploadError) {
            setProfileError(getErrorMessage(uploadError, 'Không upload được ảnh đại diện. Vui lòng thử lại.'))
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handlePasswordSubmit = async (event) => {
        event.preventDefault()
        setPasswordError('')
        setPasswordMessage('')

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !passwordForm.otp) {
            setPasswordError('Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu và OTP.')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Mật khẩu mới và xác nhận mật khẩu chưa khớp.')
            return
        }

        setIsChangingPassword(true)

        try {
            await authApi.changePassword(passwordForm)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' })
            setPasswordMessage('Đã đổi mật khẩu. Vui lòng đăng nhập lại nếu phiên đăng nhập hết hạn.')
        } catch (changeError) {
            setPasswordError(getErrorMessage(changeError, 'Không đổi được mật khẩu. Vui lòng thử lại.'))
        } finally {
            setIsChangingPassword(false)
        }
    }

    const tabs = [
        { key: 'profile', label: 'Thông tin tài khoản', icon: 'user' },
        { key: 'security', label: 'Bảo mật', icon: 'lock' },
    ]

    return (
        <AccountLayout
            user={user}
            onUserChange={setUser}
            balance={walletBalance}
            activeKey="account"
            title="Quản lý tài khoản"
            subtitle="Cập nhật thông tin cá nhân, ảnh đại diện, bảo mật tài khoản và theo dõi hạng thành viên."
        >
            {isLoading && <LoadingSkeleton />}

            {!isLoading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
                    <h1 className="text-2xl font-black">Không tải được hồ sơ</h1>
                    <p className="mt-3 text-sm">{error}</p>
                    <button
                        className="mt-6 h-11 rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700"
                        type="button"
                        onClick={loadProfile}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!isLoading && !error && profile && (
                <section>
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <Avatar user={profile} />
                                <div className="min-w-0">
                                    <p className="text-sm font-black uppercase text-emerald-700">Hồ sơ cá nhân</p>
                                    <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">
                                        {profile.fullName || 'Người dùng TAYTRO'}
                                    </h1>
                                    <p className="mt-2 text-sm font-semibold text-slate-500">{profile.email}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                                            {statusLabels[profile.status] || profile.status || 'Đang cập nhật'}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                            {roleLabels[profile.role] || profile.role || 'Người dùng'}
                                        </span>
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                            Hạng {currentRank.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full sm:w-64">
                                <InfoTile label="Ngày tham gia" value={formatDate(profile.createdAt)} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-b border-slate-200 bg-white">
                        <div className="flex flex-wrap gap-1">
                            {tabs.map((tab) => (
                                <button
                                    className={`flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-black transition ${
                                        activeTab === tab.key
                                            ? 'border-emerald-600 text-emerald-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-950'
                                    }`}
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    <Icon name={tab.icon} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="space-y-6">
                            {activeTab === 'profile' && (
                                <>
                                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                        <div className="mb-5">
                                            <h2 className="text-xl font-black text-slate-950">Ảnh đại diện</h2>
                                            <p className="mt-1 text-sm text-slate-500">Chọn ảnh từ máy để cập nhật ảnh hiển thị trên tài khoản.</p>
                                        </div>

                                        {profileError && (
                                            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                                {profileError}
                                            </div>
                                        )}
                                        {profileMessage && (
                                            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                                {profileMessage}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-2xl font-black text-slate-700">
                                                {avatarPreview || profile.avatar ? (
                                                    <img className="h-full w-full object-cover" src={avatarPreview || profile.avatar} alt="Ảnh đại diện" />
                                                ) : (
                                                    getInitial(profile.fullName)
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <input
                                                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-700"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                />
                                                <button
                                                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                    type="button"
                                                    disabled={isUploadingAvatar || !avatarFile}
                                                    onClick={handleAvatarSubmit}
                                                >
                                                    <Icon name="upload" />
                                                    {isUploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                        <div className="mb-5">
                                            <h2 className="text-xl font-black text-slate-950">Thông tin cá nhân</h2>
                                            <p className="mt-1 text-sm text-slate-500">Cập nhật họ tên và số điện thoại liên hệ.</p>
                                        </div>

                                        <form className="grid grid-cols-1 gap-5 sm:grid-cols-2" onSubmit={handleProfileSubmit}>
                                            <label className="block">
                                                <span className="mb-2 block text-sm font-black text-slate-800">Họ tên</span>
                                                <input
                                                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                    name="fullName"
                                                    value={profileForm.fullName}
                                                    onChange={handleProfileChange}
                                                    autoComplete="name"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-2 block text-sm font-black text-slate-800">Số điện thoại</span>
                                                <input
                                                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                    name="phoneNumber"
                                                    value={profileForm.phoneNumber}
                                                    onChange={handleProfileChange}
                                                    autoComplete="tel"
                                                />
                                            </label>
                                            <label className="block sm:col-span-2">
                                                <span className="mb-2 block text-sm font-black text-slate-800">Email</span>
                                                <input
                                                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-500"
                                                    value={profile.email || ''}
                                                    disabled
                                                    readOnly
                                                />
                                            </label>
                                            <div className="sm:col-span-2">
                                                <button
                                                    className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                                                    type="submit"
                                                    disabled={isSavingProfile}
                                                >
                                                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                </>
                            )}

                            {activeTab === 'security' && (
                                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                            <Icon name="lock" />
                                        </span>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-950">Bảo mật</h2>
                                            <p className="mt-1 text-sm text-slate-500">Đổi mật khẩu bằng mật khẩu hiện tại và OTP gửi về email.</p>
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                            {passwordError}
                                        </div>
                                    )}
                                    {passwordMessage && (
                                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                            {passwordMessage}
                                        </div>
                                    )}

                                    <form className="grid grid-cols-1 gap-5" onSubmit={handlePasswordSubmit}>
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-800">Mật khẩu hiện tại</span>
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                type="password"
                                                name="currentPassword"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                autoComplete="current-password"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-800">Mật khẩu mới</span>
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                type="password"
                                                name="newPassword"
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                autoComplete="new-password"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-800">Xác nhận mật khẩu mới</span>
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                autoComplete="new-password"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-800">OTP</span>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <input
                                                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                    inputMode="numeric"
                                                    name="otp"
                                                    value={passwordForm.otp}
                                                    onChange={handlePasswordChange}
                                                    autoComplete="one-time-code"
                                                    placeholder="Nhập mã 6 số"
                                                />
                                                <button
                                                    className="h-12 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    type="button"
                                                    onClick={handleRequestPasswordOtp}
                                                    disabled={isRequestingPasswordOtp}
                                                >
                                                    {isRequestingPasswordOtp ? 'Đang gửi...' : 'Gửi OTP'}
                                                </button>
                                            </div>
                                        </label>
                                        <button
                                            className="h-12 w-full rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                            type="submit"
                                            disabled={isChangingPassword}
                                        >
                                            {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                                        </button>
                                    </form>
                                </section>
                            )}
                        </div>

                        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                        <Icon name="wallet" />
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-950">Ví và hạng thành viên</h2>
                                        <p className="text-sm text-slate-500">Áp dụng giảm giá khi đăng tin.</p>
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-1 gap-3">
                                    <InfoTile label="Số dư hiện tại" value={formatMoney(walletBalance)} tone="emerald" />
                                    <InfoTile label="Tổng chi tiêu" value={formatMoney(profile.totalSpent)} />
                                    <InfoTile label="Hạng hiện tại" value={`${currentRank.name} - giảm ${currentRank.discountPercent}%`} />
                                </div>
                                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                                        <span>Tiến độ hạng kế tiếp</span>
                                        <span>{membershipProgress}%</span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${membershipProgress}%` }} />
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-500">
                                        {nextRank
                                            ? `Cần thêm ${formatMoney(nextRank.minSpent - totalSpent)} chi tiêu để lên hạng ${nextRank.name}.`
                                            : 'Bạn đang ở hạng cao nhất hiện có.'}
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <Icon name="medal" />
                                    </span>
                                    <h2 className="text-lg font-black text-slate-950">Bảng hạng thành viên</h2>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {membershipRankTable.map((level) => (
                                        <div
                                            className={`rounded-lg border p-4 ${
                                                level.name === currentRank.name
                                                    ? 'border-emerald-300 bg-emerald-50'
                                                    : 'border-slate-200 bg-white'
                                            }`}
                                            key={level.id}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <strong>{formatMembershipName(level.name)}</strong>
                                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                                                    Giảm {level.discountPercent || 0}%
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-slate-500">
                                                Tối thiểu {formatMoney(level.minSpent)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </div>
                </section>
            )}
        </AccountLayout>
    )
}

export default ProfilePage

