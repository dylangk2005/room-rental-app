import { getPostTypeCategory, getPostTypeCategoryMeta } from '../../utils/postTypeStyles'

export const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export const formatNumberInput = (value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const onlyDigits = (value) => value.replace(/\D/g, '')

export const inputClassName =
    'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all duration-200 placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-slate-400'

export const textareaClassName =
    'min-h-44 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold leading-7 text-slate-900 outline-none transition-all duration-200 placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-slate-400'

const iconPaths = {
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
    plus: 'M12 5v14M5 12h14',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    list: 'M4 6h16M4 12h16M4 18h16',
    arrowRight: 'M5 12h14M13 5l7 7-7 7',
    warning: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    alert: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
}

export const Icon = ({ name, className = 'h-5 w-5' }) => (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d={iconPaths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
)

export const SpinnerIcon = ({ className = 'h-5 w-5' }) => (
    <svg aria-hidden="true" className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

export const SectionHeader = ({ icon, iconClassName, title, subtitle }) => (
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

const sectionAccents = {
    emerald: 'hover:border-emerald-200 hover:shadow-emerald-100/60',
    amber: 'hover:border-amber-200 hover:shadow-amber-100/60',
    blue: 'hover:border-blue-200 hover:shadow-blue-100/60',
    slate: 'hover:border-slate-300 hover:shadow-slate-200/60',
    pink: 'hover:border-pink-200 hover:shadow-pink-100/60',
}

export const SectionCard = ({ children, accent = 'emerald' }) => (
    <section className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${sectionAccents[accent] || sectionAccents.emerald}`}>
        {children}
    </section>
)

export const Field = ({ label, required, hint, children }) => (
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

export const PostTypeCard = ({ postType, isSelected, onSelect }) => {
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

export const DurationOption = ({ days, price, isSelected, isFirstFree, postTypeName, onSelect }) => {
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

export const getErrorMessage = (error, fallback = 'Không xử lý được yêu cầu. Vui lòng thử lại.') => {
    const response = error.response?.data
    const fieldErrors = response?.data
    if (fieldErrors && typeof fieldErrors === 'object') {
        return Object.values(fieldErrors).join('. ')
    }
    return response?.message || fallback
}

export const getTotalImageSize = (items) =>
    items.reduce((total, image) => total + Number(image.file?.size || image.size || 0), 0)
