import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import postApi from '../../api/postApi'
import AppHeader from '../../components/AppHeader'
import ROUTES from '../../constants/routes'
import {
    Icon,
    SpinnerIcon,
    SectionHeader,
    SectionCard,
    Field,
    inputClassName,
    textareaClassName,
    formatNumberInput,
    onlyDigits,
    getErrorMessage,
    getTotalImageSize,
} from '../../components/posts/PostFormComponents'
import { waitForAuth } from '../../api/axiosClient'

const MAX_IMAGES = 12
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_MB = 10
const MAX_TOTAL_IMAGE_SIZE_MB = 80
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * BYTES_PER_MB
const MAX_TOTAL_IMAGE_SIZE_BYTES = MAX_TOTAL_IMAGE_SIZE_MB * BYTES_PER_MB


const EditPostPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title: '',
        rentalPrice: '',
        area: '',
        province: '',
        provinceId: '',
        district: '',
        districtId: '',
        address: '',
        description: '',
    })
    const [post, setPost] = useState(null)
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [newImages, setNewImages] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const newImagesRef = useRef([])
    const alertRef = useRef(null)

    useEffect(() => {
        let ignore = false
        const loadPage = async () => {
            setIsLoading(true)
            setError('')
            try {
                // Chờ token sẵn sàng trước khi gọi API
                await waitForAuth()
                if (ignore) return

                // Load provinces (không cần auth)
                let loadedProvinces = []
                try {
                    const provincesResult = await postApi.getProvinces()
                    loadedProvinces = Array.isArray(provincesResult)
                        ? provincesResult
                        : Array.isArray(provincesResult?.data)
                            ? provincesResult.data
                            : []
                } catch { /* provinces optional */ }
                if (ignore) return
                setProvinces(loadedProvinces)

                // Load post detail
                let postData
                try {
                    const postResult = await postApi.getPostDetail(id)
                    postData = postResult?.data || postResult
                } catch (postError) {
                    if (postError.response?.status === 401) {
                        navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.EDIT_POST.replace(':id', id) } })
                        return
                    }
                    if (postError.response?.status === 404) {
                        setError('Không tìm thấy tin đăng.')
                        return
                    }
                    throw postError
                }
                if (ignore) return

                if (!postData) {
                    setError('Không tìm thấy tin đăng.')
                    return
                }

                setPost(postData)
                setForm({
                    title: postData.title || '',
                    rentalPrice: String(postData.rentalPrice || ''),
                    area: String(postData.area || ''),
                    province: postData.province || '',
                    provinceId: postData.provinceId ? String(postData.provinceId) : '',
                    district: postData.district || '',
                    districtId: postData.districtId ? String(postData.districtId) : '',
                    address: postData.address || '',
                    description: postData.description || '',
                })
                setExistingImages(Array.isArray(postData.imageUrls) ? postData.imageUrls : [])

                // Load districts nếu có province
                if (postData.provinceId) {
                    try {
                        const districtsResult = await postApi.getDistrictsByProvince(postData.provinceId)
                        if (!ignore) setDistricts(Array.isArray(districtsResult) ? districtsResult : (districtsResult?.data || []))
                    } catch { if (!ignore) setDistricts([]) }
                }
            } catch (loadError) {
                if (loadError.response?.status === 401) {
                    navigate(ROUTES.LOGIN, { replace: true, state: { from: ROUTES.EDIT_POST.replace(':id', id) } })
                    return
                }
                setError(getErrorMessage(loadError, 'Không tải được dữ liệu tin đăng.'))
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        loadPage()
        return () => { ignore = true }
    }, [id, navigate])

    useEffect(() => {
        newImagesRef.current = newImages
    }, [newImages])

    useEffect(
        () => () => {
            newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
        },
        []
    )

    useEffect(() => {
        if ((error || success) && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [error, success])

    const totalImagesCount = existingImages.length + newImages.length

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: name === 'rentalPrice' ? onlyDigits(value) : value,
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

    const handleNewImageChange = (event) => {
        const files = Array.from(event.target.files || [])
        event.target.value = ''
        if (!files.length) return

        const imageFiles = files.filter((file) => file.type.startsWith('image/'))
        if (imageFiles.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
            setError(`Mỗi ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`)
            return
        }
        const availableSlots = MAX_IMAGES - totalImagesCount
        const acceptedFiles = imageFiles.slice(0, availableSlots)
        if (imageFiles.length > availableSlots) {
            setError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh cho mỗi tin đăng.`)
        }
        const nextImages = acceptedFiles.map((file) => ({
            id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }))
        if (getTotalImageSize([...newImages, ...nextImages]) > MAX_TOTAL_IMAGE_SIZE_BYTES) {
            nextImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
            setError(`Tổng dung lượng ảnh tối đa là ${MAX_TOTAL_IMAGE_SIZE_MB}MB.`)
            return
        }
        setNewImages((current) => [...current, ...nextImages])
    }

    const removeExistingImage = (url) => {
        setExistingImages((current) => current.filter((item) => item !== url))
    }

    const removeNewImage = (imageId) => {
        setNewImages((current) => {
            const found = current.find((image) => image.id === imageId)
            if (found) URL.revokeObjectURL(found.previewUrl)
            return current.filter((image) => image.id !== imageId)
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')

        if (!form.title.trim()) return setError('Vui lòng nhập tiêu đề tin đăng.')
        if (!form.rentalPrice || Number(form.rentalPrice) < 1000) return setError('Giá thuê tối thiểu là 1.000 đ.')
        if (!form.area || Number(form.area) < 1) return setError('Diện tích tối thiểu là 1 m².')
        if (!form.provinceId) return setError('Vui lòng chọn tỉnh/thành phố.')
        if (!form.districtId) return setError('Vui lòng chọn quận/huyện.')
        if (!form.address.trim()) return setError('Vui lòng nhập địa chỉ chi tiết.')
        if (!form.description.trim()) return setError('Vui lòng nhập mô tả phòng trọ.')
        if (totalImagesCount < 1) return setError('Tin đăng cần ít nhất 1 ảnh.')

        setIsSubmitting(true)
        try {
            const payload = new FormData()
            payload.append('title', form.title.trim())
            payload.append('description', form.description.trim())
            payload.append('address', form.address.trim())
            payload.append('provinceId', form.provinceId)
            payload.append('districtId', form.districtId)
            payload.append('area', form.area)
            payload.append('rentalPrice', form.rentalPrice)

            const originalImages = Array.isArray(post?.imageUrls) ? post.imageUrls : []
            const removedImages = originalImages.filter((url) => !existingImages.includes(url))
            removedImages.forEach((url) => payload.append('deleteImageUrls', url))
            newImages.forEach((image) => payload.append('newImages', image.file))

            await postApi.updatePost(id, payload)
            setSuccess('Cập nhật tin đăng thành công.')
            window.setTimeout(() => {
                navigate(ROUTES.MY_POSTS)
            }, 800)
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Không cập nhật được tin đăng. Vui lòng thử lại.'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 text-slate-950">
                <AppHeader />
                <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
                </div>
            </main>
        )
    }

    if (!post) {
        return (
            <main className="min-h-screen bg-slate-50 text-slate-950">
                <AppHeader />
                <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        <h2 className="text-lg font-black">Không thể chỉnh sửa</h2>
                        <p className="mt-1 text-sm font-semibold">{error || 'Tin đăng không tồn tại.'}</p>
                        <Link
                            to={ROUTES.MY_POSTS}
                            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
                        >
                            Quay lại
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const upperStatus = String(post.status || '').toUpperCase()

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-50 text-slate-950">
            <AppHeader />

            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
                <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    <Link
                        to={ROUTES.MY_POSTS}
                        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <Icon name="back" className="h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                    <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        Chỉnh sửa tin đăng
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Cập nhật thông tin, hình ảnh và mô tả để tin đăng hấp dẫn hơn.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {upperStatus === 'REJECTED' && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm ring-1 ring-red-200">
                                <Icon name="info" className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-black text-red-800">Tin bị từ chối — chỉnh sửa và gửi duyệt lại</p>
                                <p className="mt-0.5 text-xs font-semibold text-red-700">
                                    Cập nhật nội dung cho phù hợp, sau khi lưu tin sẽ chuyển sang trạng thái chờ duyệt.
                                </p>
                            </div>
                        </div>
                    )}
                    {upperStatus === 'HIDDEN' && (
                        <div className="flex items-start gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 p-4 shadow-sm">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200">
                                <Icon name="info" className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-black text-purple-800">Tin đang ở trạng thái ẩn</p>
                                <p className="mt-0.5 text-xs font-semibold text-purple-700">
                                    Bạn có thể cập nhật nội dung. Sau khi lưu, tin vẫn ở trạng thái ẩn cho đến khi bạn chủ động đăng lại.
                                </p>
                            </div>
                        </div>
                    )}
                    {upperStatus === 'PENDING' && (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200">
                                <Icon name="clock" className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-black text-amber-800">Tin đang chờ duyệt</p>
                                <p className="mt-0.5 text-xs font-semibold text-amber-700">
                                    Tin đang được quản trị viên kiểm duyệt. Bạn vẫn có thể chỉnh sửa nội dung — sau khi lưu, tin sẽ quay lại trạng thái chờ duyệt.
                                </p>
                            </div>
                        </div>
                    )}
                    {upperStatus === 'EXPIRED' && (
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 shadow-sm ring-1 ring-slate-300">
                                <Icon name="warning" className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-black text-slate-800">Tin đã hết hạn</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-600">
                                    Bạn vẫn có thể chỉnh sửa nội dung. Hãy gia hạn tin để tin hiển thị lại trên hệ thống.
                                </p>
                            </div>
                        </div>
                    )}
                    {upperStatus === 'DELETED' && (
                        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-50 to-slate-50 p-4 shadow-sm">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 shadow-sm ring-1 ring-zinc-200">
                                <Icon name="info" className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-black text-zinc-800">Tin đã bị xóa mềm</p>
                                <p className="mt-0.5 text-xs font-semibold text-zinc-700">
                                    Tin hiện không hiển thị trên hệ thống. Bạn vẫn có thể chỉnh sửa thông tin trước khi đăng lại.
                                </p>
                            </div>
                        </div>
                    )}

                    <SectionCard accent="emerald">
                        <SectionHeader
                            icon="home"
                            iconClassName="bg-emerald-100 text-emerald-700"
                            title="Thông tin cơ bản"
                            subtitle="Cập nhật tiêu đề, giá thuê và diện tích phòng."
                        />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field label="Tiêu đề tin đăng" required hint={`${form.title.length}/255`}>
                                    <input
                                        className={inputClassName}
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        maxLength="255"
                                    />
                                </Field>
                            </div>
                            <Field label="Giá thuê hàng tháng" required hint="VND">
                                <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                                    <input
                                        className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
                                        name="rentalPrice"
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberInput(form.rentalPrice)}
                                        onChange={handleChange}
                                    />
                                    <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600">
                                        đ/tháng
                                    </span>
                                </div>
                            </Field>
                            <Field label="Diện tích phòng" required hint="m²">
                                <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                                    <input
                                        className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
                                        name="area"
                                        type="number"
                                        min="1"
                                        step="0.1"
                                        value={form.area}
                                        onChange={handleChange}
                                    />
                                    <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600">
                                        m²
                                    </span>
                                </div>
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard accent="blue">
                        <SectionHeader
                            icon="map"
                            iconClassName="bg-blue-100 text-blue-700"
                            title="Vị trí phòng trọ"
                            subtitle="Cập nhật tỉnh/thành, quận/huyện và địa chỉ chi tiết."
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
                            subtitle="Mô tả rõ tiện ích, nội thất và điểm mạnh của phòng."
                        />
                        <textarea
                            className={textareaClassName}
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </SectionCard>

                    <SectionCard accent="pink">
                        <SectionHeader
                            icon="image"
                            iconClassName="bg-pink-100 text-pink-700"
                            title="Hình ảnh thực tế"
                            subtitle={`Tổng cộng tối đa ${MAX_IMAGES} ảnh. Bạn có thể xóa ảnh cũ và thêm ảnh mới.`}
                        />

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {existingImages.map((url) => (
                                <div
                                    key={url}
                                    className="group/img relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
                                >
                                    <img
                                        className="aspect-[4/3] w-full object-cover"
                                        src={url}
                                        alt="Ảnh hiện tại"
                                        onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/existing-img/640/420` }}
                                    />
                                    <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-black text-white">
                                        Hiện tại
                                    </span>
                                    <button
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-all hover:scale-110 hover:bg-red-50 active:scale-95"
                                        type="button"
                                        onClick={() => removeExistingImage(url)}
                                        aria-label="Xóa ảnh"
                                    >
                                        <Icon name="trash" className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {newImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="group/img relative overflow-hidden rounded-xl border-2 border-emerald-300 bg-slate-100 shadow-sm"
                                >
                                    <img
                                        className="aspect-[4/3] w-full object-cover"
                                        src={image.previewUrl}
                                        alt={image.file.name}
                                        onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/new-img/640/420` }}
                                    />
                                    <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                        Mới
                                    </span>
                                    <button
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-all hover:scale-110 hover:bg-red-50 active:scale-95"
                                        type="button"
                                        onClick={() => removeNewImage(image.id)}
                                        aria-label="Xóa ảnh"
                                    >
                                        <Icon name="trash" className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {totalImagesCount < MAX_IMAGES && (
                            <label className="mt-4 group/drop flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/60">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                    <Icon name="upload" className="h-5 w-5" />
                                </span>
                                <span className="text-sm font-black text-slate-800">Thêm ảnh mới</span>
                                <span className="text-xs font-semibold text-slate-500">
                                    Tối đa {MAX_IMAGE_SIZE_MB}MB/ảnh
                                </span>
                                <input
                                    className="sr-only"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleNewImageChange}
                                />
                            </label>
                        )}
                    </SectionCard>

                    <div ref={alertRef} className="space-y-3">
                        {error && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <Icon name="info" className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="font-black text-red-800">Cập nhật thất bại</p>
                                    <p className="mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <Icon name="check" className="h-4 w-4" />
                                </span>
                                <p>{success}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Link
                            to={ROUTES.MY_POSTS}
                            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 text-sm font-black text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-95"
                        >
                            Hủy
                        </Link>
                        <button
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 active:scale-95"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <SpinnerIcon className="h-4 w-4" />
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Icon name="check" className="h-4 w-4" />
                                    <span>Lưu thay đổi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default EditPostPage
