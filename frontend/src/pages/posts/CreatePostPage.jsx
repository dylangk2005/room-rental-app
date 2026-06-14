import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import membershipApi from '../../api/membershipApi'
import postApi from '../../api/postApi'
import walletApi from '../../api/walletApi'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'

const USER_STORAGE_KEY = 'taytro_user'
const MAX_IMAGES = 10
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_MB = 10
const MAX_TOTAL_IMAGE_SIZE_MB = 80
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * BYTES_PER_MB
const MAX_TOTAL_IMAGE_SIZE_BYTES = MAX_TOTAL_IMAGE_SIZE_MB * BYTES_PER_MB
const VAT_PERCENT = 8
const PRICE_DURATIONS = [5, 10, 15, 30]

const DEFAULT_LOCATION_OPTIONS = [
    {
        province: 'TP. Hồ Chí Minh',
        aliases: ['TP. Ho Chi Minh', 'TP Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Ho Chi Minh', 'Hồ Chí Minh'],
        districts: [
            'Quận 1',
            'Quận 3',
            'Quận 4',
            'Quận 5',
            'Quận 6',
            'Quận 7',
            'Quận 8',
            'Quận 10',
            'Quận 11',
            'Quận 12',
            'Bình Tân',
            'Bình Thạnh',
            'Gò Vấp',
            'Phú Nhuận',
            'Tân Bình',
            'Tân Phú',
            'TP. Thủ Đức',
            'Bình Chánh',
            'Cần Giờ',
            'Củ Chi',
            'Hóc Môn',
            'Nhà Bè',
        ],
    },
]

const initialForm = {
    title: '',
    rentalPrice: '',
    area: '',
    province: '',
    provinceId: '',
    district: '',
    districtId: '',
    address: '',
    description: '',
    postTypeId: '',
    durationDays: '',
    agreed: false,
}

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatNumberInput = (value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const onlyDigits = (value) => value.replace(/\D/g, '')

const normalizeText = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

const getFallbackDistricts = (province) => {
    const normalizedProvince = normalizeText(province)
    const location = DEFAULT_LOCATION_OPTIONS.find((item) =>
        [item.province, ...item.aliases].some((name) => normalizeText(name) === normalizedProvince)
    )

    return location?.districts || []
}

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || fallback
}

const getTotalImageSize = (items) => items.reduce((total, image) => total + Number(image.file?.size || 0), 0)

const Icon = ({ name }) => {
    const paths = {
        home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6',
        image: 'M4 5h16v14H4zM8 13l2.5-2.5L14 14l2-2 4 4M8.5 8.5h.01',
        wallet: 'M4 7h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h4',
        spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
        trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
    }

    return (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    )
}

const Field = ({ label, children }) => (
    <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
        {children}
    </label>
)

const CreatePostPage = ({ user, onUserChange }) => {
    const navigate = useNavigate()
    const [form, setForm] = useState(initialForm)
    const [postTypes, setPostTypes] = useState([])
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [walletBalance, setWalletBalance] = useState(0)
    const [membership, setMembership] = useState(null)
    const [images, setImages] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStep, setSubmitStep] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [draftPostId, setDraftPostId] = useState(null)
    const imagesRef = useRef([])
    const alertRef = useRef(null)

    useEffect(() => {
        let ignore = false

        const loadPage = async () => {
            setIsLoading(true)
            setError('')

            try {
                const refreshedUser = await authApi.refresh()
                if (ignore) return
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(refreshedUser.data))
                onUserChange?.(refreshedUser.data)

                const [postTypesResult, walletResult, membershipResult, provincesResult] = await Promise.allSettled([
                    postApi.getPostTypes(),
                    walletApi.getBalance(),
                    membershipApi.getMyLevel(),
                    postApi.getProvinces(),
                ])

                if (ignore) return

                if (postTypesResult.status !== 'fulfilled') {
                    throw postTypesResult.reason
                }

                const loadedPostTypes = postTypesResult.value.data || []
                setPostTypes(loadedPostTypes)
                setWalletBalance(walletResult.status === 'fulfilled' ? walletResult.value.data?.balance || 0 : 0)
                setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value.data : null)
                const loadedProvinces = provincesResult.status === 'fulfilled' ? provincesResult.value.data || [] : []
                setProvinces(loadedProvinces)

                // Tự động chọn tỉnh đầu tiên (TP.HCM) và load districts
                if (loadedProvinces.length > 0) {
                    const firstProvince = loadedProvinces[0]
                    setForm((current) => ({
                        ...current,
                        provinceId: String(firstProvince.id),
                        province: firstProvince.name,
                    }))
                    try {
                        const districtsRes = await postApi.getDistrictsByProvince(firstProvince.id)
                        if (!ignore) setDistricts(districtsRes.data || [])
                    } catch {
                        if (!ignore) setDistricts([])
                    }
                }

                const firstType = loadedPostTypes[0]
                const firstPrice = firstType?.prices?.[0]
                if (firstType && firstPrice) {
                    setForm((current) => ({
                        ...current,
                        postTypeId: String(firstType.id),
                        durationDays: String(firstPrice.days),
                    }))
                }
            } catch (loadError) {
                if (loadError.response?.status === 401) {
                    navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.CREATE_POST } })
                    return
                }
                setError(getErrorMessage(loadError, 'Không tải được dữ liệu đăng tin. Vui lòng thử lại.'))
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        loadPage()

        return () => {
            ignore = true
        }
    }, [navigate])

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(
        () => () => {
            imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
        },
        []
    )

    useEffect(() => {
        if ((error || success) && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [error, success])

    const selectedPostType = useMemo(
        () => postTypes.find((postType) => String(postType.id) === form.postTypeId),
        [form.postTypeId, postTypes]
    )

    const selectedPrice = useMemo(
        () => selectedPostType?.prices?.find((price) => String(price.days) === form.durationDays),
        [form.durationDays, selectedPostType]
    )

    const provinceOptions = provinces
    const districtOptions = districts

    const discountPercent = Number(membership?.discountPercent || 0)
    const baseFee = Number(selectedPrice?.price || 0)
    const discountAmount = Math.round((baseFee * discountPercent) / 100)
    const subtotalAfterDiscount = Math.max(0, baseFee - discountAmount)
    const vatAmount = Math.round((subtotalAfterDiscount * VAT_PERCENT) / 100)
    const finalFee = subtotalAfterDiscount + vatAmount
    const hasEnoughBalance = Number(walletBalance || 0) >= finalFee

    const handleChange = (event) => {
        const { name, type, checked, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: name === 'rentalPrice' ? onlyDigits(value) : type === 'checkbox' ? checked : value,
        }))
    }

    const handleProvinceChange = (event) => {
        const value = event.target.value
        const selected = provinces.find((p) => String(p.id) === value)
        setForm((current) => ({
            ...current,
            provinceId: value,
            province: selected ? selected.name : '',
            districtId: '',
            district: '',
        }))
        if (selected) {
            postApi.getDistrictsByProvince(selected.id)
                .then((res) => setDistricts(res.data || []))
                .catch(() => setDistricts([]))
        } else {
            setDistricts([])
        }
    }

    const handleDistrictChange = (event) => {
        const value = event.target.value
        const selected = districts.find((d) => String(d.id) === value)
        setForm((current) => ({
            ...current,
            districtId: value,
            district: selected ? selected.name : '',
        }))
    }

    const handlePriceSelection = (postTypeId, durationDays) => {
        setForm((current) => ({
            ...current,
            postTypeId: String(postTypeId),
            durationDays: String(durationDays),
        }))
    }

    const getPriceByDuration = (postType, durationDays) =>
        postType?.prices?.find((price) => Number(price.days) === Number(durationDays))

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files || [])
        event.target.value = ''

        if (!files.length) return

        const imageFiles = files.filter((file) => file.type.startsWith('image/'))
        if (imageFiles.length !== files.length) {
            setError('Chỉ hỗ trợ tải lên hình ảnh phòng trọ.')
        }

        if (imageFiles.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
            setError(`Mỗi ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`)
            return
        }

        const availableSlots = MAX_IMAGES - images.length
        const acceptedFiles = imageFiles.slice(0, availableSlots)

        if (imageFiles.length > availableSlots) {
            setError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh cho mỗi tin đăng.`)
        }

        const nextImages = acceptedFiles.map((file) => ({
            id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }))

        if (getTotalImageSize([...images, ...nextImages]) > MAX_TOTAL_IMAGE_SIZE_BYTES) {
            nextImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
            setError(`Tổng dung lượng ảnh tối đa là ${MAX_TOTAL_IMAGE_SIZE_MB}MB. Vui lòng nén ảnh hoặc chọn ảnh nhẹ hơn.`)
            return
        }

        setImages((current) => [...current, ...nextImages])
    }

    const removeImage = (imageId) => {
        setImages((current) => {
            const removedImage = current.find((image) => image.id === imageId)
            if (removedImage) {
                URL.revokeObjectURL(removedImage.previewUrl)
            }
            return current.filter((image) => image.id !== imageId)
        })
    }

    const validateForm = () => {
        if (!form.title.trim()) return 'Vui lòng nhập tiêu đề tin.'
        if (!form.rentalPrice || Number(form.rentalPrice) < 1000) return 'Giá thuê tối thiểu là 1.000đ.'
        if (!form.area || Number(form.area) < 1) return 'Diện tích tối thiểu là 1 m².'
        if (!form.provinceId) return 'Vui lòng chọn tỉnh/thành.'
        if (!form.districtId) return 'Vui lòng chọn quận/huyện.'
        if (!form.address.trim()) return 'Vui lòng nhập địa chỉ chi tiết.'
        if (!form.description.trim()) return 'Vui lòng nhập mô tả phòng trọ.'
        if (images.length < 1) return 'Vui lòng tải lên ít nhất 1 ảnh phòng.'
        if (images.length > MAX_IMAGES) return `Chỉ được tải tối đa ${MAX_IMAGES} ảnh.`
        if (images.some((image) => image.file?.size > MAX_IMAGE_SIZE_BYTES)) return `Mỗi ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`
        if (getTotalImageSize(images) > MAX_TOTAL_IMAGE_SIZE_BYTES) return `Tổng dung lượng ảnh tối đa là ${MAX_TOTAL_IMAGE_SIZE_MB}MB. Vui lòng nén ảnh hoặc chọn ảnh nhẹ hơn.`
        if (!form.postTypeId || !form.durationDays) return 'Vui lòng chọn loại tin và thời gian đăng.'
        if (!form.agreed) return 'Vui lòng đồng ý với quy định đăng tin của hệ thống.'
        return ''
    }

    const buildPayload = () => {
        const payload = new FormData()
        payload.append('title', form.title.trim())
        payload.append('description', form.description.trim())
        payload.append('address', form.address.trim())
        payload.append('province', form.province.trim())
        payload.append('district', form.district.trim())
        if (form.provinceId) payload.append('provinceId', form.provinceId)
        if (form.districtId) payload.append('districtId', form.districtId)
        payload.append('area', form.area)
        payload.append('rentalPrice', form.rentalPrice)
        payload.append('postTypeId', form.postTypeId)
        payload.append('durationDays', form.durationDays)
        images.forEach((image) => payload.append('images', image.file))
        return payload
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')
        setDraftPostId(null)

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        if (!hasEnoughBalance) {
            setError('Số dư ví không đủ để thanh toán gói đăng tin này. Vui lòng nạp thêm tiền vào ví.')
            return
        }

        setIsSubmitting(true)

        try {
            setSubmitStep('Đang tải ảnh, lưu tin và thanh toán...')
            const paymentResponse = await postApi.createAndPayPost(buildPayload())
            const paidPostId = paymentResponse.data?.postId
            if (!paidPostId) {
                throw new Error('Không nhận được mã tin đăng sau khi thanh toán.')
            }
            setDraftPostId(paidPostId)

            setSuccess('Đã thanh toán đăng tin thành công. Tin của bạn đang chờ kiểm duyệt.')
            window.setTimeout(() => {
                navigate(`/posts/${paidPostId}`)
            }, 900)
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Không đăng được tin. Vui lòng kiểm tra thông tin và thử lại.'))
        } finally {
            setSubmitStep('')
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <AppHeader user={user} onUserChange={onUserChange} />

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <p className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
                        Phiếu đăng tin cho thuê phòng trọ
                    </p>
                    <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                                Đăng tin rõ thông tin, thanh toán nhanh bằng ví.
                            </h1>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                                Điền thông tin phòng, tải ảnh thực tế, chọn loại tin và thời gian hiển thị. Tin sẽ được gửi kiểm duyệt sau khi thanh toán.
                            </p>
                        </div>
                        <Link
                            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-800 hover:bg-slate-100"
                            to={ROUTES.WALLET}
                        >
                            Nạp tiền vào ví
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {isLoading && (
                    <div className="mx-auto max-w-5xl space-y-6">
                        <div className="h-[720px] animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
                    </div>
                )}

                {!isLoading && (
                    <form className="mx-auto max-w-5xl space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <Icon name="home" />
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-black">Thông tin cơ bản</h2>
                                        <p className="mt-1 text-sm text-slate-500">Tiêu đề, giá và diện tích là các thông tin người thuê nhìn đầu tiên.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Field label="Tiêu đề tin">
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                placeholder="Phòng trọ gần trường, có gác, giờ giấc tự do"
                                                maxLength="255"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Giá thuê/tháng">
                                        <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                            <input
                                                className="min-w-0 flex-1 px-4 outline-none"
                                                name="rentalPrice"
                                                type="text"
                                                inputMode="numeric"
                                                value={formatNumberInput(form.rentalPrice)}
                                                onChange={handleChange}
                                                placeholder="2.500.000"
                                            />
                                            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600">
                                                đ/tháng
                                            </span>
                                        </div>
                                    </Field>
                                    <Field label="Diện tích (m²)">
                                        <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                                            <input
                                                className="min-w-0 flex-1 px-4 outline-none"
                                                name="area"
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={form.area}
                                                onChange={handleChange}
                                                placeholder="22.5"
                                            />
                                            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600">
                                                m²
                                            </span>
                                        </div>
                                    </Field>
                                </div>
                            </section>

                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5">
                                    <h2 className="text-xl font-black">Vị trí phòng</h2>
                                    <p className="mt-1 text-sm text-slate-500">Nhập địa chỉ đủ rõ để người thuê dễ hình dung khu vực.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Tỉnh/thành">
                                        <select
                                            className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                            name="provinceId"
                                            value={form.provinceId}
                                            onChange={handleProvinceChange}
                                        >
                                            <option value="">Chọn tỉnh/thành</option>
                                            {provinceOptions.map((p) => (
                                                <option key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Quận/huyện">
                                        <select
                                            className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                            name="districtId"
                                            value={form.districtId}
                                            onChange={handleDistrictChange}
                                            disabled={!form.provinceId}
                                        >
                                            <option value="">{form.provinceId ? 'Chọn quận/huyện' : 'Chọn tỉnh/thành trước'}</option>
                                            {districtOptions.map((d) => (
                                                <option key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <Field label="Địa chỉ chi tiết">
                                            <input
                                                className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                                name="address"
                                                value={form.address}
                                                onChange={handleChange}
                                                placeholder="Số nhà, đường, phường/xã"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5">
                                    <h2 className="text-xl font-black">Nội dung mô tả</h2>
                                    <p className="mt-1 text-sm text-slate-500">Nêu tiện ích, nội thất, giờ giấc, nội quy và các điểm mạnh của phòng.</p>
                                </div>
                                <textarea
                                    className="min-h-44 w-full rounded-lg border border-slate-300 p-4 leading-7 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Phòng thoáng, có cửa sổ, WC riêng, gần chợ và trạm xe buýt..."
                                />
                            </section>

                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                        <Icon name="image" />
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-black">Hình ảnh phòng</h2>
                                        <p className="mt-1 text-sm text-slate-500">Tải 1-{MAX_IMAGES} ảnh rõ nét. Backend hiện hỗ trợ ảnh, chưa hỗ trợ video.</p>
                                    </div>
                                </div>
                                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-emerald-300 hover:bg-emerald-50">
                                    <Icon name="image" />
                                    <span className="mt-3 text-sm font-black text-slate-800">Chọn ảnh phòng</span>
                                    <span className="mt-1 text-sm text-slate-500">Có thể chọn nhiều ảnh cùng lúc</span>
                                    <input className="sr-only" type="file" accept="image/*" multiple onChange={handleImageChange} />
                                </label>
                                {images.length > 0 && (
                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {images.map((image) => (
                                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100" key={image.id}>
                                                <img className="aspect-[4/3] w-full object-cover" src={image.previewUrl} alt={image.file.name} />
                                                <button
                                                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-red-600 shadow-sm hover:bg-red-50"
                                                    type="button"
                                                    onClick={() => removeImage(image.id)}
                                                    aria-label="Xóa ảnh"
                                                >
                                                    <Icon name="trash" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                        <Icon name="spark" />
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-black">Cấu hình hiển thị</h2>
                                        <p className="text-sm text-slate-500">Chọn gói và thời gian đăng tin.</p>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto">
                                    <table className="min-w-[760px] w-full border-collapse overflow-hidden rounded-lg text-sm">
                                        <thead>
                                            <tr className="bg-blue-200 text-slate-950">
                                                <th className="w-32 border border-slate-400 px-3 py-4 text-left font-black">Thời gian</th>
                                                {postTypes.map((postType) => (
                                                    <th className="border border-slate-400 px-3 py-4 text-center font-black" key={postType.id}>
                                                        {postType.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {PRICE_DURATIONS.map((durationDays) => (
                                                <tr key={durationDays}>
                                                    <th className="border border-slate-300 bg-slate-50 px-3 py-3 text-left font-black">
                                                        Giá {durationDays} ngày
                                                    </th>
                                                    {postTypes.map((postType) => {
                                                        const price = getPriceByDuration(postType, durationDays)
                                                        const isSelected =
                                                            form.postTypeId === String(postType.id) &&
                                                            form.durationDays === String(durationDays)

                                                        return (
                                                            <td className="border border-slate-300 p-2" key={`${postType.id}-${durationDays}`}>
                                                                <button
                                                                    className={`h-12 w-full rounded-lg px-3 text-sm font-black transition ${
                                                                        isSelected
                                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                                            : 'bg-white text-slate-800 hover:bg-emerald-50'
                                                                    }`}
                                                                    type="button"
                                                                    disabled={!price}
                                                                    onClick={() => handlePriceSelection(postType.id, durationDays)}
                                                                >
                                                                    {price ? formatMoney(price.price) : 'Chưa có giá'}
                                                                </button>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <p className="mt-4 text-sm font-semibold text-slate-600">
                                    Quy định giá đẩy tin tham khảo theo bảng dưới, chưa bao gồm VAT.
                                </p>

                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-[640px] border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-blue-200 text-slate-950">
                                                {postTypes.map((postType) => (
                                                    <th className="border border-slate-400 px-4 py-3 text-center font-black" key={postType.id}>
                                                        {postType.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {postTypes.map((postType) => (
                                                    <td className="border border-slate-300 px-4 py-3 font-semibold" key={postType.id}>
                                                        {formatMoney(postType.pushPrice)}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <div ref={alertRef}>
                                {error && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                        {error}
                                        {draftPostId && (
                                            <Link className="ml-2 underline" to={`/posts/${draftPostId}`}>
                                                Xem tin nháp
                                            </Link>
                                        )}
                                    </div>
                                )}
                                {success && (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                        {success}
                                    </div>
                                )}
                            </div>

                            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <Icon name="wallet" />
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-black">Tóm tắt thanh toán</h2>
                                        <p className="text-sm text-slate-500">Áp dụng giảm giá theo hạng thành viên.</p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Số dư ví</span>
                                        <strong className={hasEnoughBalance ? 'text-slate-950' : 'text-red-600'}>{formatMoney(walletBalance)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Hạng thành viên</span>
                                        <strong>{membership?.levelName || 'Đồng'} - giảm {discountPercent}%</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Giá gốc</span>
                                        <strong>{formatMoney(baseFee)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Giảm giá</span>
                                        <strong className="text-emerald-700">-{formatMoney(discountAmount)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">Tạm tính sau giảm</span>
                                        <strong>{formatMoney(subtotalAfterDiscount)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-slate-500">VAT {VAT_PERCENT}%</span>
                                        <strong>{formatMoney(vatAmount)}</strong>
                                    </div>
                                    <div className="border-t border-slate-200 pt-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-black text-slate-950">Tổng thanh toán</span>
                                            <strong className="text-xl text-emerald-700">{formatMoney(finalFee)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {!hasEnoughBalance && (
                                    <Link
                                        className="mt-4 flex h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
                                        to={ROUTES.WALLET}
                                    >
                                        Nạp thêm tiền
                                    </Link>
                                )}

                                <label className="mt-5 flex gap-3 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                                    <input
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        type="checkbox"
                                        name="agreed"
                                        checked={form.agreed}
                                        onChange={handleChange}
                                    />
                                    <span>Tôi cam kết thông tin, giá và hình ảnh đúng thực tế; tin vi phạm có thể bị từ chối và xử lý theo quy định.</span>
                                </label>

                                <button
                                    className="mt-5 h-12 w-full rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    type="submit"
                                    disabled={isSubmitting || postTypes.length === 0}
                                >
                                    {isSubmitting ? submitStep || 'Đang xử lý...' : 'Lưu tin và thanh toán'}
                                </button>
                            </section>
                        </div>
                    </form>
                )}
            </section>
        </main>
    )
}

export default CreatePostPage
