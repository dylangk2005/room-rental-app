import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import authApi from '../../api/authApi'
import walletApi from '../../api/walletApi'
import AccountLayout from '../../components/AccountLayout'
import ROUTES from '../../constants/routes'

const MIN_DEPOSIT = 10000
const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000]

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatDepositAmount = (value) => {
    const digits = String(value || '').replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

const formatDateTime = (value) => {
    if (!value) return 'Đang cập nhật'
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || fallback
}

const transactionLabels = {
    DEPOSIT: 'Nạp tiền',
    POST_PAYMENT: 'Thanh toán đăng tin',
    EXTEND: 'Gia hạn tin',
    PUSH: 'Đẩy tin',
    REFUND: 'Hoàn tiền',
}

const statusLabels = {
    SUCCESS: 'Thành công',
    PENDING: 'Đang chờ thanh toán',
    FAILED: 'Thất bại',
    CANCELLED: 'Đã hủy',
}

const Icon = ({ name }) => {
    const paths = {
        wallet: 'M4 7h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h4',
        card: 'M3 6h18v12H3zM3 10h18M7 15h4',
        history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v6l4 2',
        plus: 'M12 5v14M5 12h14',
        bank: 'M3 10h18M5 10V8l7-4 7 4v2M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16',
    }

    return (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    )
}

const TransactionStatus = ({ status }) => {
    const tone =
        status === 'SUCCESS'
            ? 'bg-emerald-100 text-emerald-800'
            : status === 'FAILED'
              ? 'bg-red-100 text-red-700'
              : status === 'CANCELLED'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-amber-100 text-amber-800'

    return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{statusLabels[status] || status}</span>
}

const TransactionList = ({ transactions, emptyTitle, emptyDescription }) => {
    if (transactions.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="text-lg font-black">{emptyTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">{emptyDescription}</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction) => {
                const isIncome = Number(transaction.amount || 0) >= 0
                return (
                    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={`${transaction.transactionType}-${transaction.id}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-black text-slate-950">
                                        {transactionLabels[transaction.transactionType] || transaction.description || 'Giao dịch ví'}
                                    </h3>
                                    <TransactionStatus status={transaction.status} />
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{transaction.description}</p>
                                {transaction.postTitle && (
                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                        Tin đăng: {transaction.postTitle}
                                        {transaction.postStatus ? ` (${transaction.postStatus})` : ''}
                                    </p>
                                )}
                                <p className="mt-1 text-xs font-bold text-slate-400">{formatDateTime(transaction.createdAt)}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <strong className={`text-lg ${isIncome ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {isIncome ? '+' : ''}
                                    {formatMoney(transaction.amount)}
                                </strong>
                                {(transaction.openingBalance !== null || transaction.closingBalance !== null) && (
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {formatMoney(transaction.openingBalance)} -&gt; {formatMoney(transaction.closingBalance)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}

const WalletPage = () => {
    const { user, login } = useAuth()
    const { balance, loadBalance } = useWallet()
    const navigate = useNavigate()
    const location = useLocation()
    const [amount, setAmount] = useState('100000')
    const [transactions, setTransactions] = useState([])
    const [pageInfo, setPageInfo] = useState({ currentPage: 0, totalPages: 0, totalElements: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [isDepositing, setIsDepositing] = useState(false)
    const [error, setError] = useState('')

    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
    const depositResult = searchParams.get('deposit')
    const tabFromUrl = searchParams.get('tab')
    const activeTab = depositResult ? 'deposit' : ['deposit', 'deposit-history', 'payment-history'].includes(tabFromUrl) ? tabFromUrl : 'deposit'
    const numericAmount = Number(amount || 0)
    const isAmountValid = numericAmount >= MIN_DEPOSIT

    const depositMessage = useMemo(() => {
        if (depositResult === 'success') {
            return 'Nạp tiền thành công. Số dư ví sẽ được cập nhật sau khi hệ thống xác nhận giao dịch.'
        }

        if (depositResult === 'failed') {
            return 'Giao dịch nạp tiền chưa thành công hoặc đã bị hủy. Vui lòng thử lại nếu cần.'
        }

        return ''
    }, [depositResult])

    const loadWallet = useCallback(
        async (page = 0) => {
            setIsLoading(true)
            setError('')

            try {
            const refreshResponse = await authApi.refresh()
            login(refreshResponse.data)

                const transactionType =
                    activeTab === 'deposit-history'
                        ? 'DEPOSIT'
                        : activeTab === 'payment-history'
                          ? 'PAYMENT'
                          : undefined

                const [transactionsResult] = await Promise.allSettled([
                    walletApi.getTransactions({ page, size: 10, type: transactionType }),
                ])

                await loadBalance()

                if (transactionsResult.status === 'fulfilled') {
                    const data = transactionsResult.value.data || {}
                    setTransactions(data.transactions || [])
                    setPageInfo({
                        currentPage: data.currentPage || 0,
                        totalPages: data.totalPages || 0,
                        totalElements: data.totalElements || 0,
                    })
                } else {
                    setTransactions([])
                    setPageInfo({ currentPage: 0, totalPages: 0, totalElements: 0 })
                }
            } catch (loadError) {
                if (loadError.response?.status === 401) {
                    navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.WALLET } })
                    return
                }

                setError(getErrorMessage(loadError, 'Không tải được dữ liệu ví. Vui lòng thử lại.'))
            } finally {
                setIsLoading(false)
            }
        },
        [activeTab, navigate]
    )

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadWallet(0)
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [loadWallet, location.search])

    const handleTabChange = (tab) => {
        navigate(`${ROUTES.WALLET}?tab=${tab}`)
    }

    const handleAmountChange = (event) => {
        setAmount(event.target.value.replace(/[^\d]/g, ''))
    }

    const handleDeposit = async (event) => {
        event.preventDefault()
        setError('')

        if (!isAmountValid) {
            setError(`Số tiền nạp tối thiểu là ${formatMoney(MIN_DEPOSIT)}.`)
            return
        }

        setIsDepositing(true)

        try {
            const response = await walletApi.deposit({ amount: numericAmount })
            const paymentUrl = response.data?.paymentUrl

            if (!paymentUrl) {
                throw new Error('Missing VNPAY payment URL')
            }

            window.location.href = paymentUrl
        } catch (depositError) {
            setError(getErrorMessage(depositError, 'Không khởi tạo được giao dịch VNPAY. Vui lòng kiểm tra cấu hình thanh toán và thử lại.'))
            setIsDepositing(false)
        }
    }

    const loadPage = (page) => {
        if (page < 0 || page >= pageInfo.totalPages) return
        loadWallet(page)
    }

    const tabs = [
        { key: 'deposit', label: 'Nạp tiền vào tài khoản' },
        { key: 'deposit-history', label: 'Lịch sử nạp tiền' },
        { key: 'payment-history', label: 'Lịch sử thanh toán' },
    ]

    return (
        <AccountLayout
            activeKey={activeTab === 'deposit' ? 'deposit' : 'transactions'}
            title="Quản lý giao dịch"
            subtitle="Nạp tiền vào tài khoản, theo dõi lịch sử nạp tiền và các khoản thanh toán dịch vụ."
        >
            <div className="border-b border-slate-200 bg-white">
                <div className="flex flex-wrap gap-1">
                    {tabs.map((tab) => (
                        <button
                            className={`min-h-12 border-b-2 px-4 text-sm font-black transition ${
                                activeTab === tab.key
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-950'
                            }`}
                            key={tab.key}
                            type="button"
                            onClick={() => handleTabChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && (
                <div className="mt-6 space-y-5">
                    <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
                </div>
            )}

            {!isLoading && (
                <div className="mt-6">
                    {depositMessage && (
                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                            {depositMessage}
                            <button className="ml-3 underline" type="button" onClick={() => loadWallet(0)}>
                                Tải lại số dư
                            </button>
                        </div>
                    )}
                    {error && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    {activeTab === 'deposit' && (
                        <div className="mx-auto max-w-3xl">
                            <section className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-sm leading-7 text-slate-700">
                                <strong className="block text-slate-950">Ưu đãi nạp tiền:</strong>
                                <p>• Nạp từ 1.000.000 đến dưới 2.000.000 tặng 10%</p>
                                <p>• Nạp từ 2.000.000 đến dưới 5.000.000 tặng 15%</p>
                                <p>• Nạp từ 5.000.000 đến dưới 10.000.000 tặng 25%</p>
                                <p>• Nạp từ 10.000.000 trở lên tặng 30%</p>
                            </section>

                            <section className="mt-8">
                                <h2 className="text-xl font-black">Chọn phương thức nạp tiền</h2>

                                <form className="mt-5 space-y-5" onSubmit={handleDeposit}>
                                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-800">Số tiền cần nạp</span>
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-lg font-black outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                value={formatDepositAmount(amount)}
                                                onChange={handleAmountChange}
                                                inputMode="numeric"
                                                placeholder="100.000"
                                            />
                                        </label>

                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {quickAmounts.map((quickAmount) => (
                                                <button
                                                    className={`h-11 rounded-lg border px-3 text-sm font-black ${
                                                        numericAmount === quickAmount
                                                            ? 'border-emerald-500 bg-emerald-600 text-white'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                    type="button"
                                                    key={quickAmount}
                                                    onClick={() => setAmount(String(quickAmount))}
                                                >
                                                    {formatMoney(quickAmount)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        className="flex min-h-16 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                                        type="submit"
                                        disabled={isDepositing}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
                                                <Icon name="bank" />
                                            </span>
                                            <span>
                                                <strong className="block text-slate-950">Ví điện tử VNPAY</strong>
                                                <span className="mt-1 block text-sm font-semibold text-slate-500">
                                                    {isDepositing ? 'Đang chuyển sang VNPAY...' : 'Thanh toán an toàn qua cổng VNPAY'}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="text-sm font-black text-emerald-700">{formatMoney(numericAmount)}</span>
                                    </button>
                                </form>
                            </section>
                        </div>
                    )}

                    {activeTab === 'deposit-history' && (
                        <TransactionList
                            transactions={transactions}
                            emptyTitle="Chưa có lịch sử nạp tiền"
                            emptyDescription="Các giao dịch nạp qua VNPAY sẽ xuất hiện tại đây."
                        />
                    )}

                    {activeTab === 'payment-history' && (
                        <TransactionList
                            transactions={transactions}
                            emptyTitle="Chưa có lịch sử thanh toán"
                            emptyDescription="Các khoản thanh toán đăng tin, gia hạn và đẩy tin sẽ xuất hiện tại đây."
                        />
                    )}

                    {(activeTab === 'deposit-history' || activeTab === 'payment-history') && pageInfo.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                                type="button"
                                onClick={() => loadPage(pageInfo.currentPage - 1)}
                                disabled={pageInfo.currentPage <= 0}
                            >
                                Trước
                            </button>
                            <span className="text-sm font-bold text-slate-600">
                                Trang {pageInfo.currentPage + 1} / {pageInfo.totalPages}
                            </span>
                            <button
                                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                                type="button"
                                onClick={() => loadPage(pageInfo.currentPage + 1)}
                                disabled={pageInfo.currentPage + 1 >= pageInfo.totalPages}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            )}
        </AccountLayout>
    )
}

export default WalletPage
