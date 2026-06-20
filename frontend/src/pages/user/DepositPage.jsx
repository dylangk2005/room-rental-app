import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const MIN_DEPOSIT = 10000
const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000]

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    return response?.message || fallback
}

// ─── Icon Set ─────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = '' }) => {
    const icons = {
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M2 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        x: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        arrowRight: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3 4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    }
    return (
        <span className={`inline-flex items-center justify-center ${className}`}>
            {icons[name] || null}
        </span>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'error', onClose }) => {
    const isSuccess = type === 'success'
    return (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
            isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
            <span className={`mt-0.5 shrink-0 ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
                <Icon name={isSuccess ? 'check' : 'x'} size={16} />
            </span>
            <p className="flex-1 text-sm font-bold">{message}</p>
            {onClose && (
                <button className="shrink-0 transition-colors hover:opacity-60" type="button" onClick={onClose}>
                    <Icon name="x" size={14} />
                </button>
            )}
        </div>
    )
}

// ─── Main DepositPage ─────────────────────────────────────────────────────────
const DepositPage = () => {
    const { login } = useAuth()
    const { balance } = useWallet()
    const [amount, setAmount] = useState('')
    const [isDepositing, setIsDepositing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const numericAmount = Number(amount || 0)
    const isAmountValid = numericAmount >= MIN_DEPOSIT

    const handleAmountChange = (rawValue) => {
        const digits = rawValue.replace(/[^\d]/g, '')
        setAmount(digits)
        setError('')
    }

    const handleQuickSelect = (value) => {
        setAmount(String(value))
        setError('')
    }

    const handleDeposit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!isAmountValid) {
            setError(`Số tiền nạp tối thiểu là ${formatMoney(MIN_DEPOSIT)}.`)
            return
        }

        setIsDepositing(true)

        try {
            const refreshResponse = await authApi.refresh()
            login(refreshResponse.data)

            const response = await walletApi.deposit({ amount: numericAmount })
            const paymentUrl = response.data?.paymentUrl

            if (!paymentUrl) {
                throw new Error('Missing VNPAY payment URL')
            }

            window.location.href = paymentUrl
        } catch (depositError) {
            setError(getErrorMessage(depositError, 'Không khởi tạo được giao dịch VNPAY. Vui lòng thử lại.'))
            setIsDepositing(false)
        }
    }

    return (
        <AccountLayout
            activeKey="deposit"
            title="Nạp tiền"
            subtitle="Nạp tiền vào ví để đăng tin, đẩy tin và sử dụng các dịch vụ trên TAYTRO."
        >
            <div className="mx-auto max-w-2xl space-y-6">
                {/* ── Balance Hero Card ─────────────────────────────────── */}
                <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 shadow-sm">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">Số dư ví hiện tại</p>
                        <p className="mt-1 text-3xl font-black text-white">{formatMoney(balance)}</p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm">
                            <Icon name="wallet" size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-700">Ví TAYTRO</p>
                            <p className="text-xs text-slate-400">Dùng cho đăng tin, đẩy tin, gia hạn</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                            <Icon name="check" size={12} className="mr-1 inline" />
                            Sẵn sàng
                        </span>
                    </div>
                </div>

                {/* ── Deposit Form ────────────────────────────────────── */}
                <form onSubmit={handleDeposit} className="space-y-5">
                    {(error || success) && (
                        <div>
                            {error && <Toast type="error" message={error} onClose={() => setError('')} />}
                            {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 focus-within:border-emerald-400 focus-within:shadow-md">
                        <div className="bg-gradient-to-r from-slate-50 to-white px-5 pt-5">
                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Số tiền nạp</span>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₫</span>
                                    <input
                                        className="w-full border-0 bg-transparent py-3 pl-9 pr-4 text-3xl font-black text-slate-900 outline-none placeholder:text-slate-300"
                                        value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                        inputMode="numeric"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Quick select chips */}
                        <div className="border-t border-slate-100 px-5 py-4">
                            <p className="mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn nhanh</p>
                            <div className="flex flex-wrap gap-2">
                                {quickAmounts.map((val) => {
                                    const selected = numericAmount === val
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleQuickSelect(val)}
                                            className={`relative h-10 rounded-xl border-2 px-4 text-sm font-black transition-all duration-200 active:scale-95 ${
                                                selected
                                                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                                            }`}
                                        >
                                            {formatMoney(val).replace(' đ', '')}
                                            {selected && (
                                                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
                                                    <Icon name="check" size={9} />
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Payment button */}
                    <button
                        type="submit"
                        disabled={!isAmountValid || isDepositing}
                        className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border-2 px-6 py-4 font-black shadow-lg transition-all duration-300 ${
                            isAmountValid && !isDepositing
                                ? 'cursor-pointer border-emerald-500 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:border-emerald-400 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-200 active:scale-[0.98]'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                    >
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-yellow-400/10" />
                        </div>

                        <div className="relative flex items-center gap-3">
                            <div className={`flex h-11 w-auto shrink-0 items-center justify-center rounded-xl px-1 ${
                                isAmountValid && !isDepositing ? 'bg-white/20' : 'bg-slate-200'
                            }`}>
                                <img
                                    src="/vnpay-logo.png"
                                    alt="VNPAY"
                                    className="h-7 w-auto object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black">
                                    {isDepositing ? 'Đang chuyển hướng...' : 'Thanh toán qua VNPAY'}
                                </p>
                                <p className={`text-xs font-semibold ${isAmountValid ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {isDepositing ? 'Vui lòng chờ...' : 'An toàn & Bảo mật'}
                                </p>
                            </div>
                        </div>

                        <div className="relative flex items-center gap-3">
                            {isAmountValid ? (
                                <>
                                    <span className="text-xl font-black">{formatMoney(numericAmount)}</span>
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:translate-x-1">
                                        <Icon name="arrowRight" size={16} />
                                    </div>
                                </>
                            ) : (
                                <span className="text-sm">Nhập số tiền để tiếp tục</span>
                            )}
                        </div>
                    </button>

                    {/* Security note */}
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <Icon name="shield" size={15} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-700">Thanh toán an toàn qua VNPAY</p>
                            <ul className="space-y-0.5 text-xs text-slate-500">
                                <li className="flex items-center gap-1.5">
                                    <Icon name="check" size={11} className="text-emerald-500 shrink-0" />
                                    Mã hóa dữ liệu end-to-end, không lưu thông tin thẻ
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <Icon name="check" size={11} className="text-emerald-500 shrink-0" />
                                    Hỗ trợ thẻ ATM nội địa, Visa, Mastercard, Ví điện tử
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <Icon name="check" size={11} className="text-emerald-500 shrink-0" />
                                    Xác minh OTP qua ngân hàng trước khi trừ tiền
                                </li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
        </AccountLayout>
    )
}

export default DepositPage
