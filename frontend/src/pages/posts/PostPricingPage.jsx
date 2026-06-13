import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import postApi from '../../api/postApi'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import { getPostTypeColorLabel, getPostTypeTitleColor } from '../../utils/postTypeStyles'

const USER_STORAGE_KEY = 'taytro_user'
const VAT_PERCENT = 8
const PRICE_DURATIONS = [5, 10, 15, 30]

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatPostTypeName = (name = '') =>
    name
        .replace(/vip/gi, 'VIP')
        .replace(/nổi bật/gi, 'Nổi Bật')
        .replace(/thường/gi, 'thường')

const getDisplayPrice = (value, includeVat) => {
    const amount = Number(value || 0)
    return includeVat ? Math.round(amount * (1 + VAT_PERCENT / 100)) : amount
}

const getPriceByDuration = (postType, duration) =>
    postType?.prices?.find((price) => Number(price.days) === Number(duration))?.price || 0

const getPlanTone = (index) =>
    [
        'bg-red-600 text-white',
        'bg-pink-600 text-white',
        'bg-green-600 text-white',
        'bg-slate-900 text-white',
        'bg-blue-600 text-white',
    ][index] || 'bg-emerald-700 text-white'

const getSizeLabel = (size) => {
    const numericSize = Number(size || 0)
    if (numericSize >= 18) return 'Rất lớn'
    if (numericSize >= 16) return 'Lớn'
    if (numericSize >= 15) return 'Trung bình'
    return 'Nhỏ'
}

const LoadingState = () => (
    <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={index} />
            ))}
        </div>
        <div className="h-[520px] animate-pulse rounded-lg bg-slate-200" />
    </div>
)

const PostPricingPage = ({ user, onUserChange }) => {
    const [postTypes, setPostTypes] = useState([])
    const [includeVat, setIncludeVat] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const sortedPostTypes = useMemo(
        () => [...postTypes].sort((first, second) => Number(first.priority || 0) - Number(second.priority || 0)),
        [postTypes]
    )

    const loadPricing = async () => {
        setIsLoading(true)
        setError('')

        try {
            const [userResult, postTypesResult] = await Promise.allSettled([authApi.refresh(), postApi.getPostTypes()])

            if (userResult.status === 'fulfilled') {
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userResult.value.data))
                onUserChange?.(userResult.value.data)
            } else {
                localStorage.removeItem(USER_STORAGE_KEY)
                onUserChange?.(null)
            }

            if (postTypesResult.status !== 'fulfilled') {
                throw postTypesResult.reason
            }

            setPostTypes(postTypesResult.value.data || [])
        } catch {
            setError('Không tải được bảng giá tin đăng. Vui lòng thử lại.')
            setPostTypes([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadPricing()
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [])

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <AppHeader user={user} onUserChange={onUserChange} />

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
                                Bảng giá dịch vụ đăng tin
                            </p>
                            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Chọn gói tin phù hợp để phòng nổi bật hơn.</h1>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                                So sánh giá đăng tin, giá đẩy tin, màu tiêu đề và kích thước hiển thị trước khi thanh toán bằng ví.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                                to={ROUTES.CREATE_POST}
                            >
                                Đăng tin ngay
                            </Link>
                            <Link
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-100"
                                to={ROUTES.USER_DEPOSIT}
                            >
                                Nạp tiền vào ví
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {isLoading && <LoadingState />}

                {!isLoading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                        <h2 className="text-lg font-black">Không tải được bảng giá</h2>
                        <p className="mt-2 text-sm font-semibold">{error}</p>
                        <button
                            className="mt-4 h-10 rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
                            type="button"
                            onClick={loadPricing}
                        >
                            Tải lại
                        </button>
                    </div>
                )}

                {!isLoading && !error && sortedPostTypes.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                        <h2 className="text-xl font-black">Chưa có gói tin</h2>
                        <p className="mt-2 text-slate-500">Bảng giá sẽ hiển thị khi backend có dữ liệu loại tin.</p>
                    </div>
                )}

                {!isLoading && !error && sortedPostTypes.length > 0 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {sortedPostTypes.map((postType, index) => (
                                <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={postType.id}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-black">{formatPostTypeName(postType.name)}</h2>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">Giá đẩy tin</p>
                                        </div>
                                        <span className={`rounded-lg px-3 py-1 text-xs font-black ${getPlanTone(index)}`}>Gói {index + 1}</span>
                                    </div>
                                    <strong className="mt-4 block text-2xl text-emerald-700">
                                        {formatMoney(getDisplayPrice(postType.pushPrice, includeVat))}
                                    </strong>
                                </article>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black">Bảng giá tin đăng</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {includeVat ? `Giá đang bao gồm VAT ${VAT_PERCENT}%` : 'Giá chưa bao gồm VAT'}
                                </p>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-black text-slate-700">
                                <span>Bao gồm VAT {VAT_PERCENT}%</span>
                                <input
                                    className="peer sr-only"
                                    type="checkbox"
                                    checked={includeVat}
                                    onChange={(event) => setIncludeVat(event.target.checked)}
                                />
                                <span className="relative h-8 w-14 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-6" />
                            </label>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-[860px] w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th className="w-48 border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-black text-slate-700">
                                            Hạng mục
                                        </th>
                                        {sortedPostTypes.map((postType, index) => (
                                            <th className={`border-b border-r border-slate-200 px-4 py-4 text-center ${getPlanTone(index)}`} key={postType.id}>
                                                <span className="block text-base font-black">{formatPostTypeName(postType.name)}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PRICE_DURATIONS.map((duration) => (
                                        <tr key={duration}>
                                            <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                                Giá {duration} ngày
                                            </th>
                                            {sortedPostTypes.map((postType) => (
                                                <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-${duration}`}>
                                                    {formatMoney(getDisplayPrice(getPriceByDuration(postType, duration), includeVat))}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr>
                                        <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                            Giá đẩy tin
                                        </th>
                                        {sortedPostTypes.map((postType) => (
                                            <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-push`}>
                                                {formatMoney(getDisplayPrice(postType.pushPrice, includeVat))}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                            Màu sắc tiêu đề
                                        </th>
                                        {sortedPostTypes.map((postType) => {
                                            const titleColor = getPostTypeTitleColor(postType.name, postType.titleColor) || '#0f172a'

                                            return (
                                                <td className="border-b border-r border-slate-200 px-4 py-4 text-center font-black" key={`${postType.id}-color`}>
                                                    <span className="inline-flex items-center gap-2" style={{ color: titleColor }}>
                                                        <span
                                                            className="h-4 w-4 rounded-full border border-slate-200"
                                                            style={{ backgroundColor: titleColor }}
                                                        />
                                                        {getPostTypeColorLabel(postType.name, postType.titleColor)}
                                                    </span>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                    <tr>
                                        <th className="border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-700">
                                            Kích thước tin
                                        </th>
                                        {sortedPostTypes.map((postType) => (
                                            <td className="border-r border-slate-200 px-4 py-4 text-center font-semibold" key={`${postType.id}-size`}>
                                                {getSizeLabel(postType.titleSize)} ({postType.titleSize}px)
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}

export default PostPricingPage
