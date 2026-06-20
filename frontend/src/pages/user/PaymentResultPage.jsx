import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import walletApi from '../../api/walletApi'
import ROUTES from '../../constants/routes'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const Icon = ({ name, size = 24, className = '' }) => {
    const icons = {
        checkCircle: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        xCircle: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        wallet: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M2 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        arrowRight: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        loading: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    }
    return (
        <span className={`inline-flex items-center justify-center ${className}`}>
            {icons[name] || null}
        </span>
    )
}

const statusConfig = {
    success: {
        icon: 'checkCircle',
        color: 'emerald',
        title: 'Nạp tiền thành công!',
        subtitle: 'Số dư ví của bạn đã được cập nhật.',
        bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
        borderColor: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        titleColor: 'text-emerald-800',
        subtitleColor: 'text-emerald-600',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-500',
        buttonShadow: 'shadow-emerald-200',
        cardBg: 'bg-white',
    },
    failed: {
        icon: 'xCircle',
        color: 'red',
        title: 'Thanh toán không thành công',
        subtitle: 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
        bgGradient: 'from-red-50 via-rose-50 to-orange-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        subtitleColor: 'text-red-600',
        buttonBg: 'bg-red-600 hover:bg-red-500',
        buttonShadow: 'shadow-red-200',
        cardBg: 'bg-white',
    },
}

const PaymentResultPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { balance } = useWallet()
    const [redirectSeconds, setRedirectSeconds] = useState(5)
    const [balanceInfo, setBalanceInfo] = useState(null)

    const status = searchParams.get('status') === 'success' ? 'success' : 'failed'
    const config = statusConfig[status]

    useEffect(() => {
        if (status === 'success') {
            walletApi.getBalance()
                .then((res) => setBalanceInfo(res.data?.balance ?? balance))
                .catch(() => setBalanceInfo(balance))
        }
    }, [status])

    useEffect(() => {
        if (redirectSeconds <= 0) {
            navigate(ROUTES.WALLET, { replace: true })
            return
        }
        const timer = setTimeout(() => {
            setRedirectSeconds((s) => s - 1)
        }, 1000)
        return () => clearTimeout(timer)
    }, [redirectSeconds, navigate])

    const handleGoWallet = () => {
        navigate(ROUTES.WALLET, { replace: true })
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center px-4 py-12`}>
            <div className={`w-full max-w-md rounded-3xl ${config.cardBg} border ${config.borderColor} shadow-2xl p-8 text-center space-y-6`}>

                {/* Status icon */}
                <div className="flex justify-center">
                    <div className={`relative flex h-24 w-24 items-center justify-center rounded-full ${
                        status === 'success'
                            ? 'bg-emerald-100 ring-8 ring-emerald-100'
                            : 'bg-red-100 ring-8 ring-red-100'
                    }`}>
                        <span className={config.iconColor}>
                            <Icon name={config.icon} size={56} />
                        </span>
                        {status === 'success' && (
                            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-100">
                                <Icon name="checkCircle" size={14} />
                            </span>
                        )}
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className={`text-2xl font-black ${config.titleColor}`}>
                        {config.title}
                    </h1>
                    <p className={`text-sm leading-relaxed ${config.subtitleColor}`}>
                        {config.subtitle}
                    </p>
                </div>

                {/* Balance card for success */}
                {status === 'success' && balanceInfo !== null && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-600">
                                    <Icon name="wallet" size={18} />
                                </span>
                                <span className="text-sm font-bold text-emerald-700">Số dư ví mới</span>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-emerald-800">{formatMoney(balanceInfo)}</p>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-emerald-200">
                            <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                        </div>
                    </div>
                )}

                {status === 'success' && balanceInfo === null && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        <span className="text-slate-400">
                            <Icon name="loading" size={20} />
                        </span>
                        <span className="text-sm text-slate-500">Đang cập nhật số dư...</span>
                    </div>
                )}

                {/* Failed details */}
                {status === 'failed' && (
                    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-left space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-500">Có thể xảy ra vì:</p>
                        <ul className="space-y-1.5 text-sm text-red-700">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-red-500 shrink-0"><Icon name="xCircle" size={13} /></span>
                                Bạn đã hủy giao dịch trước khi hoàn tất
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-red-500 shrink-0"><Icon name="xCircle" size={13} /></span>
                                Thanh toán bị gián đoạn do mất kết nối
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-red-500 shrink-0"><Icon name="xCircle" size={13} /></span>
                                Tài khoản ngân hàng không đủ số dư
                            </li>
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleGoWallet}
                        className={`flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 font-black text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] ${config.buttonBg} ${config.buttonShadow}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="shrink-0">
                                <Icon name="wallet" size={20} />
                            </span>
                            <span>Xem ví</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold opacity-80">
                                {redirectSeconds > 0 ? `Tự động chuyển sau ${redirectSeconds}s` : 'Đang chuyển...'}
                            </span>
                            <span className="shrink-0">
                                <Icon name="arrowRight" size={16} />
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate(ROUTES.USER_DEPOSIT, { replace: true })}
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                    >
                        Nạp tiền lại
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-xs text-slate-400">
                    {status === 'success'
                        ? 'Nếu số dư chưa được cập nhật, vui lòng đợi vài phút hoặc liên hệ hỗ trợ.'
                        : 'Tiền sẽ không bị trừ nếu giao dịch không thành công.'}
                </p>
            </div>
        </div>
    )
}

export default PaymentResultPage
