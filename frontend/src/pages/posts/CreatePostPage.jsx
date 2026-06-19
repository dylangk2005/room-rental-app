import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authApi from '../../api/authApi'
import membershipApi from '../../api/membershipApi'
import postApi from '../../api/postApi'
import walletApi from '../../api/walletApi'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import {
    getPostTypeCategory,
    getPostTypeCategoryMeta,
} from '../../utils/postTypeStyles'

const MAX_IMAGES = 12
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_MB = 10
const MAX_TOTAL_IMAGE_SIZE_MB = 80
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * BYTES_PER_MB
const MAX_TOTAL_IMAGE_SIZE_BYTES = MAX_TOTAL_IMAGE_SIZE_MB * BYTES_PER_MB
const VAT_PERCENT = 8

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

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const formatNumberInput = (value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const onlyDigits = (value) => value.replace(/\D/g, '')

const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data

    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }

    return response?.message || fallback
}

const getTotalImageSize = (items) => items.reduce((total, image) => total + Number(image.file?.size || 0), 0)

// ─── Icons ────────────────────────────────────────────────────────────────
const Icon = ({ name, className = 'h-5 w-5' }) => {
    const paths = {
        home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6',
        image: 'M4 5h16v14H4zM8 13l2.5-2.5L14 14l2-2 4 4M8.5 8.5h.01',
        wallet: 'M4 7h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h4',
        spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
        trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
        map: 'M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
        doc: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
        upload: 'M12 16V4m0 0-4 4m4-4 4 4M4 20h16',
        edit: 'M11 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
        gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
        check: 'M5 13l4 4L19 7',
        info: 'M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        clock: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        flash: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
        back: 'M15 18l-6-6 6-6',
        crown: 'M3 17l2-8 4 4 3-7 3 7 4-4 2 8H3z',
        star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    }

    return (
        <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
            <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    )
}

const SpinnerIcon = ({ className = 'h-5 w-5' }) => (
    <svg aria-hidden="true" className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const SectionHeader = ({ icon, iconClassName, title, subtitle }) => (
    <div className="mb-5 flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconClassName}`}>
            <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950 sm:text-xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>}
        </div>
    </div>
)

// ─── Section Card (hoverable) ─────────────────────────────────────────────
const SectionCard = ({ children, accent = 'emerald' }) => {
    const accents = {
        emerald: 'hover:border-emerald-200 hover:shadow-emerald-100/60',
        amber: 'hover:border-amber-200 hover:shadow-amber-100/60',
        blue: 'hover:border-blue-200 hover:shadow-blue-100/60',
        slate: 'hover:border-slate-300 hover:shadow-slate-200/60',
        pink: 'hover:border-pink-200 hover:shadow-pink-100/60',
    }
    return (
        <section className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${accents[accent] || accents.emerald}`}>
            {children}
        </section>
    )
}

const Field = ({ label, required, hint, children }) => (
    <label className="block">
        <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-black text-slate-800">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            {hint && <span className="text-xs font-semibold text-slate-400">{hint}</span>}
        </div>
        {children}
    </label>
)

const inputClassName =
    'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all duration-200 placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-slate-400'

// ─── Post Type Card ───────────────────────────────────────────────────────
const PostTypeCard = ({ postType, isSelected, onSelect }) => {
    const accentColor = postType.titleColor || '#111827'
    const category = getPostTypeCategory(postType.name, postType.priority)
    const meta = getPostTypeCategoryMeta(category)
    const isFree = Number(meta.imageLimit) === 1

    return (
        <button
            className={`group/option relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${isSelected
                ? 'border-transparent shadow-sm ring-4'
                : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            style={
                isSelected
                    ? {
                        borderColor: accentColor,
                        backgroundColor: accentColor + '0f',
                        '--tw-ring-color': accentColor + '30',
                    }
                    : undefined
            }
            type="button"
            onClick={() => onSelect(postType.id)}
        >
            {isSelected && (
                <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                >
                    <Icon name="check" className="h-3.5 w-3.5" />
                </span>
            )}
            <h3 className="text-base font-black text-slate-900">{postType.name}</h3>
            <p className="text-xs font-semibold text-slate-500">
                {isFree ? 'Hiển thị 1 ảnh đại diện' : `Hiển thị tối đa ${meta.imageLimit} ảnh đại diện`}
            </p>
        </button>
    )
}

// ─── Duration Option ──────────────────────────────────────────────────────
const DurationOption = ({ days, price, isSelected, isFirstFree, postTypeName, onSelect }) => {
    const isNormal = postTypeName && postTypeName.toLowerCase().includes('thường')

    return (
        <button
            className={`group/dur flex w-full flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${isSelected
                ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-4 ring-emerald-100'
                : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
            type="button"
            onClick={onSelect}
        >
            <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {days} ngày
            </span>
            <span className="text-base font-black text-emerald-700">{formatMoney(price)}</span>
            {isFirstFree && !isNormal && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                    Lần đầu miễn phí đẩy
                </span>
            )}
        </button>
    )
}

const CreatePostPage = () => {
    const { user, login } = useAuth()
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
    const [activeStep, setActiveStep] = useState(0)
    const imagesRef = useRef([])
    const alertRef = useRef(null)
    const formTopRef = useRef(null)

    useEffect(() => {
        let ignore = false

        const loadPage = async () => {
            setIsLoading(true)
            setError('')

            try {
                const refreshedUser = await authApi.refresh()
                if (ignore) return
                login(refreshedUser.data)

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

                const postTypesData = postTypesResult.value
                const loadedPostTypes = Array.isArray(postTypesData) ? postTypesData : (postTypesData?.data || [])
                const sortedPostTypes = [...loadedPostTypes]
                    .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
                    .filter((item, index, arr) => arr.findIndex((t) => t.name === item.name) === index)
                setPostTypes(sortedPostTypes)
                const walletData = walletResult.status === 'fulfilled' ? walletResult.value : null
                setWalletBalance(walletData?.balance ?? walletData?.data?.balance ?? 0)
                const membershipData = membershipResult.status === 'fulfilled' ? membershipResult.value : null
                setMembership(membershipData?.data ?? membershipData)
                const provincesData = provincesResult.status === 'fulfilled' ? provincesResult.value : []
                const loadedProvinces = Array.isArray(provincesData) ? provincesData : (provincesData?.data || [])
                setProvinces(loadedProvinces)

                // Tự động chọn tỉnh đầu tiên và load districts
                if (loadedProvinces.length > 0) {
                    const firstProvince = loadedProvinces[0]
                    setForm((current) => ({
                        ...current,
                        provinceId: String(firstProvince.id),
                        province: firstProvince.name,
                    }))
                    try {
                        const districtsData = await postApi.getDistrictsByProvince(firstProvince.id)
                        if (!ignore) setDistricts(Array.isArray(districtsData) ? districtsData : (districtsData?.data || []))
                    } catch {
                        if (!ignore) setDistricts([])
                    }
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

    const sortedPrices = useMemo(
        () => [...(selectedPostType?.prices || [])].sort((a, b) => Number(a.days) - Number(b.days)),
        [selectedPostType]
    )

    const selectedCategory = selectedPostType
        ? getPostTypeCategory(selectedPostType.name, selectedPostType.priority)
        : null
    const selectedCategoryMeta = selectedCategory ? getPostTypeCategoryMeta(selectedCategory) : null
    const isFirstFreePush = selectedCategoryMeta ? Number(selectedCategoryMeta.imageLimit) === 1 : false

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
                .then((data) => setDistricts(Array.isArray(data) ? data : (data?.data || [])))
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

    const handlePostTypeSelect = (postTypeId) => {
        if (form.postTypeId === String(postTypeId)) {
            setForm((current) => ({ ...current, postTypeId: '', durationDays: '' }))
            return
        }
        const type = postTypes.find((t) => String(t.id) === String(postTypeId))
        if (!type) return
        const sortedTypePrices = [...(type.prices || [])].sort((a, b) => Number(a.days) - Number(b.days))
        const defaultPrice = sortedTypePrices[0]
        setForm((current) => ({
            ...current,
            postTypeId: String(postTypeId),
            durationDays: defaultPrice ? String(defaultPrice.days) : '',
        }))
    }

    const handleDurationSelect = (days) => {
        if (form.durationDays === String(days)) {
            setForm((current) => ({ ...current, durationDays: '' }))
            return
        }
        setForm((current) => ({ ...current, durationDays: String(days) }))
    }

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
        if (!form.title.trim()) return 'Vui lòng nhập tiêu đề tin đăng.'
        if (!form.rentalPrice || Number(form.rentalPrice) < 1000) return 'Giá thuê tối thiểu là 1.000 đ.'
        if (!form.area || Number(form.area) < 1) return 'Diện tích tối thiểu là 1 m².'
        if (!form.provinceId) return 'Vui lòng chọn tỉnh/thành phố.'
        if (!form.districtId) return 'Vui lòng chọn quận/huyện.'
        if (!form.address.trim()) return 'Vui lòng nhập địa chỉ chi tiết.'
        if (!form.description.trim()) return 'Vui lòng nhập mô tả phòng trọ.'
        if (images.length < 1) return 'Vui lòng tải lên ít nhất 1 ảnh phòng.'
        if (images.length > MAX_IMAGES) return `Chỉ được tải tối đa ${MAX_IMAGES} ảnh.`
        if (images.some((image) => image.file?.size > MAX_IMAGE_SIZE_BYTES)) return `Mỗi ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`
        if (getTotalImageSize(images) > MAX_TOTAL_IMAGE_SIZE_BYTES) return `Tổng dung lượng ảnh tối đa là ${MAX_TOTAL_IMAGE_SIZE_MB}MB. Vui lòng nén ảnh hoặc chọn ảnh nhẹ hơn.`
        if (!form.postTypeId || !form.durationDays) return 'Vui lòng chọn loại tin và thời gian đăng.'
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

    const handleSaveDraft = async () => {
        setError('')
        setSuccess('')
        setDraftPostId(null)

        if (!form.title.trim()) {
            setError('Vui lòng nhập tiêu đề.')
            return
        }
        if (!form.description.trim()) {
            setError('Vui lòng nhập mô tả.')
            return
        }
        if (!form.address.trim()) {
            setError('Vui lòng nhập địa chỉ.')
            return
        }
        if (!form.provinceId) {
            setError('Vui lòng chọn tỉnh/thành phố.')
            return
        }
        if (!form.districtId) {
            setError('Vui lòng chọn quận/huyện.')
            return
        }
        if (!form.area || parseFloat(form.area) <= 0) {
            setError('Vui lòng nhập diện tích hợp lệ.')
            return
        }
        if (!form.rentalPrice || parseFloat(form.rentalPrice) <= 0) {
            setError('Vui lòng nhập giá thuê hợp lệ.')
            return
        }
        if (!form.postTypeId) {
            setError('Vui lòng chọn loại tin đăng.')
            return
        }
        if (!form.durationDays || parseInt(form.durationDays) <= 0) {
            setError('Vui lòng chọn số ngày đăng.')
            return
        }
        if (images.length < 1) {
            setError('Vui lòng tải lên ít nhất 1 ảnh phòng.')
            return
        }

        setIsSubmitting(true)
        setSubmitStep('Đang lưu tin nháp...')

        try {
            const response = await postApi.createPost(buildPayload())
            const savedId = response?.data?.id || response?.id
            if (savedId) setDraftPostId(savedId)
            setSuccess('Đã lưu tin nháp thành công. Bạn có thể thanh toán để đăng tin sau.')
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Không lưu được tin nháp. Vui lòng thử lại.'))
        } finally {
            setSubmitStep('')
            setIsSubmitting(false)
        }
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

        if (!form.agreed) {
            setError('Vui lòng đồng ý với quy định đăng tin trước khi thanh toán.')
            return
        }

        if (!hasEnoughBalance) {
            setError(
                `Số dư ví hiện tại (${formatMoney(walletBalance)}) chưa đủ để thanh toán gói đăng tin này (${formatMoney(finalFee)}). Vui lòng lưu tin nháp và nạp thêm tiền để đăng sau.`
            )
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

            setSuccess('Thanh toán đăng tin thành công. Tin của bạn đang chờ kiểm duyệt.')
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

    // ─── Stepper (visual only, no logic gates form) ────────────────────────
    const steps = [
        { id: 0, label: 'Thông tin cơ bản', icon: 'home' },
        { id: 1, label: 'Vị trí & Mô tả', icon: 'map' },
        { id: 2, label: 'Hình ảnh', icon: 'image' },
        { id: 3, label: 'Cấu hình & Thanh toán', icon: 'spark' },
    ]

    const isStepComplete = (stepId) => {
        if (stepId === 0) {
            return form.title.trim() && form.rentalPrice && form.area
        }
        if (stepId === 1) {
            return form.provinceId && form.districtId && form.address.trim() && form.description.trim()
        }
        if (stepId === 2) {
            return images.length >= 1
        }
        if (stepId === 3) {
            return form.postTypeId && form.durationDays
        }
        return false
    }

    const scrollToStep = (stepId) => {
        const element = document.getElementById(`create-step-${stepId}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    useEffect(() => {
        // Theo dõi section đang hiển thị để tô sáng stepper
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id
                        const match = id.match(/create-step-(\d+)/)
                        if (match) {
                            setActiveStep(Number(match[1]))
                        }
                    }
                })
            },
            { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
        )
        steps.forEach((step) => {
            const el = document.getElementById(`create-step-${step.id}`)
            if (el) observer.observe(el)
        })
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 text-slate-950">
                <AppHeader />
                <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-50 text-slate-950">
            <AppHeader />

            {/* ─── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
                <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-emerald-800">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
                                Đăng tin cho thuê phòng trọ
                            </span>
                            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                                Đăng tin rõ ràng – Đẩy tin miễn phí lần đầu
                            </h1>
                            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                Điền thông tin phòng, tải ảnh thực tế, chọn loại tin và thời gian hiển thị. Bạn có thể lưu nháp để đăng sau nếu cần chuẩn bị thêm ngân sách.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                                    <Icon name="gift" className="h-3.5 w-3.5" />
                                    Tin thường: đẩy tin miễn phí lần đầu
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                                    <Icon name="flash" className="h-3.5 w-3.5" />
                                    Thanh toán nhanh bằng ví
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                                    <Icon name="doc" className="h-3.5 w-3.5" />
                                    Hỗ trợ lưu nháp không giới hạn
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                            <Link
                                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:scale-95"
                                to={ROUTES.POST_PRICING}
                            >
                                <Icon name="crown" className="h-4 w-4" />
                                Xem bảng giá
                            </Link>
                            <Link
                                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md active:scale-95"
                                to={ROUTES.WALLET}
                            >
                                <Icon name="wallet" className="h-4 w-4" />
                                Nạp tiền vào ví
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Sticky Stepper ──────────────────────────────────────────── */}
            <div className="sticky top-16 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ol className="flex items-center gap-2 overflow-x-auto py-3 text-sm font-bold sm:gap-4">
                        {steps.map((step, index) => {
                            const isComplete = isStepComplete(step.id)
                            const isActive = activeStep === step.id
                            return (
                                <li className="flex items-center gap-2 sm:gap-3" key={step.id}>
                                    <button
                                        className={`group/step flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 active:scale-95 ${isActive
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : isComplete
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        type="button"
                                        onClick={() => scrollToStep(step.id)}
                                    >
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${isActive
                                                ? 'bg-white text-emerald-700'
                                                : isComplete
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-300 text-white'
                                                }`}
                                        >
                                            {isComplete && !isActive ? <Icon name="check" className="h-3.5 w-3.5" /> : index + 1}
                                        </span>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </button>
                                    {index < steps.length - 1 && (
                                        <span className={`h-0.5 w-4 shrink-0 rounded-full sm:w-8 ${isComplete ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                    )}
                                </li>
                            )
                        })}
                    </ol>
                </div>
            </div>

            {/* ─── Form ────────────────────────────────────────────────────── */}
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <form className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit} ref={formTopRef}>
                    <div className="space-y-6">
                        {/* STEP 1: Thông tin cơ bản */}
                        <div id="create-step-0">
                            <SectionCard accent="emerald">
                                <SectionHeader
                                    icon="home"
                                    iconClassName="bg-emerald-100 text-emerald-700"
                                    title="Thông tin cơ bản"
                                    subtitle="Tiêu đề, giá thuê và diện tích là những thông tin người thuê nhìn thấy đầu tiên."
                                />
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Field label="Tiêu đề tin đăng" required hint={`${form.title.length}/255`}>
                                            <input
                                                className={inputClassName}
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                placeholder="Ví dụ: Phòng trọ gần ĐH Bách Khoa, có gác, WC riêng, giờ giấc tự do"
                                                maxLength="255"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Giá thuê hàng tháng" required hint="VND">
                                        <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 hover:border-slate-400">
                                            <input
                                                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
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
                                    <Field label="Diện tích phòng" required hint="m²">
                                        <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 hover:border-slate-400">
                                            <input
                                                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
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
                            </SectionCard>
                        </div>

                        {/* STEP 2: Vị trí & Mô tả */}
                        <div id="create-step-1" className="space-y-6">
                            <SectionCard accent="blue">
                                <SectionHeader
                                    icon="map"
                                    iconClassName="bg-blue-100 text-blue-700"
                                    title="Vị trí phòng trọ"
                                    subtitle="Chọn tỉnh/thành, quận/huyện và nhập địa chỉ chi tiết để người thuê dễ tìm."
                                />
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Tỉnh/Thành phố" required>
                                        <select
                                            className={`${inputClassName} cursor-pointer`}
                                            name="provinceId"
                                            value={form.provinceId}
                                            onChange={handleProvinceChange}
                                        >
                                            <option value="">-- Chọn tỉnh/thành phố --</option>
                                            {provinces.map((p) => (
                                                <option key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Quận/Huyện" required>
                                        <select
                                            className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                                            name="districtId"
                                            value={form.districtId}
                                            onChange={handleDistrictChange}
                                            disabled={!form.provinceId}
                                        >
                                            <option value="">
                                                {form.provinceId ? '-- Chọn quận/huyện --' : 'Vui lòng chọn tỉnh/thành trước'}
                                            </option>
                                            {districts.map((d) => (
                                                <option key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <Field label="Địa chỉ chi tiết" required hint="Số nhà, hẻm, ngõ, phường/xã">
                                            <input
                                                className={inputClassName}
                                                name="address"
                                                value={form.address}
                                                onChange={handleChange}
                                                placeholder="Ví dụ: 123/45 Lê Lợi, phường Bến Nghé"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard accent="blue">
                                <SectionHeader
                                    icon="doc"
                                    iconClassName="bg-blue-100 text-blue-700"
                                    title="Mô tả chi tiết"
                                    subtitle="Nêu rõ tiện ích, nội thất, giờ giấc, nội quy và điểm mạnh của phòng để thu hút người thuê."
                                />
                                <textarea
                                    className="min-h-44 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold leading-7 text-slate-900 outline-none transition-all duration-200 placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-slate-400"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Phòng thoáng mát, có cửa sổ lớn, WC riêng, gần chợ, trạm xe buýt, trường học... Giờ giấc tự do, an ninh đảm bảo."
                                />
                            </SectionCard>
                        </div>

                        {/* STEP 3: Hình ảnh */}
                        <div id="create-step-2">
                            <SectionCard accent="pink">
                                <SectionHeader
                                    icon="image"
                                    iconClassName="bg-pink-100 text-pink-700"
                                    title="Hình ảnh thực tế"
                                    subtitle={`Tải lên từ 1 đến ${MAX_IMAGES} ảnh chất lượng cao, sắc nét và đúng thực tế phòng.`}
                                />

                                <label className="group/drop flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50/60 hover:shadow-md">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm transition-transform duration-300 group-hover/drop:scale-110 group-hover/drop:rotate-3">
                                        <Icon name="upload" className="h-6 w-6" />
                                    </span>
                                    <span className="text-sm font-black text-slate-800">Kéo thả hoặc bấm để chọn ảnh</span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        Hỗ trợ JPG, PNG, WEBP. Tối đa {MAX_IMAGE_SIZE_MB}MB/ảnh, tổng tối đa {MAX_TOTAL_IMAGE_SIZE_MB}MB.
                                    </span>
                                    <input
                                        className="sr-only"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                    />
                                </label>

                                {images.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-700">
                                                Đã chọn <span className="text-emerald-600">{images.length}</span> / {MAX_IMAGES} ảnh
                                            </span>
                                            <button
                                                className="text-xs font-bold text-red-600 transition-colors hover:text-red-700"
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc muốn xóa tất cả ảnh đã chọn?')) {
                                                        images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
                                                        setImages([])
                                                    }
                                                }}
                                            >
                                                Xóa tất cả
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                            {images.map((image, index) => (
                                                <div
                                                    className="group/img relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                                                    key={image.id}
                                                >
                                                    <img
                                                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                        src={image.previewUrl}
                                                        alt={image.file.name}
                                                    />
                                                    <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-black text-white">
                                                        Ảnh {index + 1}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="absolute bottom-2 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                                                            Ảnh bìa
                                                        </span>
                                                    )}
                                                    <button
                                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-red-50 active:scale-95"
                                                        type="button"
                                                        onClick={() => removeImage(image.id)}
                                                        aria-label="Xóa ảnh"
                                                    >
                                                        <Icon name="trash" className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* STEP 4: Cấu hình hiển thị */}
                        <div id="create-step-3" className="space-y-6">
                            <SectionCard accent="amber">
                                <SectionHeader
                                    icon="spark"
                                    iconClassName="bg-amber-100 text-amber-700"
                                    title="Cấu hình hiển thị"
                                    subtitle="Chọn loại tin và thời gian đăng. Tin thường được đẩy lên đầu miễn phí lần đầu sau khi đăng."
                                />

                                <div className="space-y-6">
                                    {/* Loại tin */}
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-800">
                                                Loại tin <span className="text-red-500">*</span>
                                            </h3>
                                            <span className="text-xs font-semibold text-slate-400">
                                                {postTypes.length} gói khả dụng
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {postTypes.map((postType) => (
                                                <PostTypeCard
                                                    key={postType.id}
                                                    postType={postType}
                                                    isSelected={form.postTypeId === String(postType.id)}
                                                    onSelect={handlePostTypeSelect}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Thời gian đăng */}
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-800">
                                                Thời gian đăng <span className="text-red-500">*</span>
                                            </h3>
                                            <span className="text-xs font-semibold text-slate-400">Chọn mốc phù hợp</span>
                                        </div>
                                        {sortedPrices.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                                                Vui lòng chọn loại tin trước để xem các mốc thời gian.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                                {sortedPrices.map((price) => (
                                                    <DurationOption
                                                        key={price.days}
                                                        days={price.days}
                                                        price={price.price}
                                                        isFirstFree={isFirstFreePush}
                                                        isSelected={form.durationDays === String(price.days)}
                                                        postTypeName={selectedPostType?.name}
                                                        onSelect={() => handleDurationSelect(price.days)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </SectionCard>

                            <div ref={alertRef} className="space-y-3">
                                {error && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                            <Icon name="info" className="h-4 w-4" />
                                        </span>
                                        <div className="flex-1 text-sm font-semibold text-red-700">
                                            <p className="font-black text-red-800">Đăng tin chưa thành công</p>
                                            <p className="mt-0.5">{error}</p>
                                            {draftPostId && (
                                                <Link
                                                    className="mt-2 inline-flex items-center gap-1 font-black text-red-700 underline hover:text-red-800"
                                                    to={`/posts/${draftPostId}`}
                                                >
                                                    Xem tin nháp vừa lưu
                                                    <Icon name="back" className="h-3.5 w-3.5 rotate-180" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {success && (
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                            <Icon name="check" className="h-4 w-4" />
                                        </span>
                                        <div className="flex-1 text-sm font-semibold text-emerald-700">
                                            <p className="font-black text-emerald-800">Thành công</p>
                                            <p className="mt-0.5">{success}</p>
                                            {draftPostId && (
                                                <Link
                                                    className="mt-2 inline-flex items-center gap-1 font-black text-emerald-700 underline hover:text-emerald-800"
                                                    to={`/posts/${draftPostId}`}
                                                >
                                                    Xem tin nháp
                                                    <Icon name="back" className="h-3.5 w-3.5 rotate-180" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── Sidebar: Thanh toán + Hành động ──────────────────── */}
                    <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                    <Icon name="wallet" className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-black text-slate-950">Thanh toán gói đăng</h2>
                                    <p className="text-xs font-semibold text-slate-500">Áp dụng giảm giá theo hạng thành viên</p>
                                </div>
                            </div>

                            <div className="space-y-3 p-5 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">Số dư ví</span>
                                    <strong className={`text-base ${hasEnoughBalance ? 'text-slate-950' : 'text-red-600'}`}>
                                        {formatMoney(walletBalance)}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">Hạng thành viên</span>
                                    <strong className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                                        <Icon name="crown" className="h-3.5 w-3.5" />
                                        {membership?.levelName || 'Đồng'} · -{discountPercent}%
                                    </strong>
                                </div>
                                <div className="my-2 h-px bg-slate-100" />
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">Giá gốc gói</span>
                                    <strong>{formatMoney(baseFee)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">Giảm hạng thành viên</span>
                                    <strong className="text-emerald-700">-{formatMoney(discountAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">Tạm tính sau giảm</span>
                                    <strong>{formatMoney(subtotalAfterDiscount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-500">VAT {VAT_PERCENT}%</span>
                                    <strong>{formatMoney(vatAmount)}</strong>
                                </div>
                                <div className="my-2 h-px bg-slate-200" />
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-black text-slate-950">Tổng thanh toán</span>
                                    <strong className="text-2xl font-black text-emerald-700">{formatMoney(finalFee)}</strong>
                                </div>
                                {isFirstFreePush && (
                                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700">
                                        <Icon name="gift" className="h-3.5 w-3.5" />
                                        Bao gồm 1 lượt đẩy tin miễn phí
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 border-t border-slate-200 bg-slate-50/50 p-5">
                                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-all duration-200 hover:ring-emerald-300">
                                    <input
                                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        type="checkbox"
                                        name="agreed"
                                        checked={form.agreed}
                                        onChange={handleChange}
                                    />
                                    <span>
                                        Tôi cam kết thông tin, giá và hình ảnh đúng thực tế. Tin vi phạm có thể bị từ chối và xử lý theo quy định của TAYTRO.
                                    </span>
                                </label>

                                <button
                                    className="group/pay relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                                    type="submit"
                                    disabled={isSubmitting || postTypes.length === 0}
                                >
                                    {isSubmitting && submitStep ? (
                                        <>
                                            <SpinnerIcon className="h-4 w-4" />
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="wallet" className="h-4 w-4 transition-transform duration-200 group-hover/pay:scale-110" />
                                            <span>Thanh toán</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    className="group/draft flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && submitStep.includes('nháp') ? (
                                        <>
                                            <SpinnerIcon className="h-4 w-4" />
                                            <span>Đang lưu nháp...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="edit" className="h-4 w-4 transition-transform duration-200 group-hover/draft:scale-110" />
                                            <span>Lưu tin nháp</span>
                                        </>
                                    )}
                                </button>

                                {!hasEnoughBalance && (
                                    <Link
                                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md active:scale-[0.98]"
                                        to={ROUTES.WALLET}
                                    >
                                        <Icon name="wallet" className="h-4 w-4" />
                                        Nạp thêm tiền vào ví
                                    </Link>
                                )}

                                <p className="pt-1 text-center text-[11px] font-semibold text-slate-400">
                                    Bạn có thể lưu nháp để đăng sau khi đã chuẩn bị đủ ngân sách.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900">Mẹo đăng tin hiệu quả</h3>
                            <ul className="mt-2 space-y-1.5 text-xs font-semibold text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    Tiêu đề ngắn gọn, nêu bật ưu điểm phòng (vị trí, tiện ích, giá).
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    Ảnh đầu tiên nên là ảnh tổng quan phòng, sáng và sắc nét.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    Mô tả chi tiết giúp giảm thắc mắc và tăng lượng liên hệ thực sự.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    Đăng vào giờ cao điểm (8h-10h, 19h-22h) để tiếp cận nhiều người xem hơn.
                                </li>
                            </ul>
                        </div>
                    </aside>
                </form>
            </section>
        </main>
    )
}

export default CreatePostPage
