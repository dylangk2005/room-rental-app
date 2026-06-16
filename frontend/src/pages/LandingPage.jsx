import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ROUTES from '../constants/routes'

const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
)

const ImageIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
)

const HeartIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
)

const PhoneIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
)

const ShieldIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
)

const PostIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
)

const MapIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
)

const StarIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
)

const ChevronDownIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
)

const useIntersection = (options = {}) => {
    const ref = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.15, ...options }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return [ref, isVisible]
}

const useCountUp = (end, duration = 2000, start = false) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!start) return
        const target = parseInt(String(end).replace(/,/g, ''), 10)
        const startTime = Date.now()
        const tick = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }, [start, end, duration])

    return count
}

const StatCounter = ({ end, suffix = '', label }) => {
    const [ref, isVisible] = useIntersection()
    const count = useCountUp(end, 1800, isVisible)
    return (
        <div ref={ref} className="text-center">
            <div className="text-2xl font-black text-emerald-600 sm:text-3xl lg:text-4xl">
                {count.toLocaleString('vi-VN')}{suffix}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{label}</div>
        </div>
    )
}

const FeatureCard = ({ icon, title, description, index, accent }) => {
    const [ref, isVisible] = useIntersection()
    const accents = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', hover: 'hover:bg-emerald-50', delay: index * 80 },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', hover: 'hover:bg-blue-50', delay: index * 80 },
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', hover: 'hover:bg-rose-50', delay: index * 80 },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', hover: 'hover:bg-amber-50', delay: index * 80 },
        violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500', hover: 'hover:bg-violet-50', delay: index * 80 },
        cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-500', hover: 'hover:bg-cyan-50', delay: index * 80 },
    }
    const a = accents[accent] || accents.emerald

    return (
        <div
            ref={ref}
            className={`group relative flex cursor-default flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 ${a.hover}
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            style={{ transitionDelay: `${isVisible ? 0 : a.delay}ms` }}
        >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.icon} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-12 sm:w-12`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 transition-colors duration-300 group-hover:text-emerald-600 sm:text-base">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-600 sm:mt-1.5 sm:text-sm">{description}</p>
            </div>
        </div>
    )
}

const StepCard = ({ number, title, description, index, icon }) => {
    const [ref, isVisible] = useIntersection()
    return (
        <div
            ref={ref}
            className={`group relative flex cursor-default flex-col items-center text-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            style={{ transitionDelay: `${isVisible ? 0 : index * 120}ms` }}
        >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-emerald-600/40 sm:h-10 sm:w-10 sm:text-base">
                {number}
            </div>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-emerald-500/20 sm:mt-5">
                {icon}
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 transition-colors duration-300 group-hover:text-emerald-600 sm:text-lg">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">{description}</p>
        </div>
    )
}

const LandingPage = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [heroVisible, setHeroVisible] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 80)
        return () => clearTimeout(t)
    }, [])

    const scrollToSearch = () => navigate('/posts')

    const features = [
        {
            icon: <MapIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Tìm phòng theo khu vực, giá và diện tích',
            description: 'Lọc nhanh theo quận/huyện, mức giá và diện tích mong muốn trong giây lát.',
            accent: 'emerald',
        },
        {
            icon: <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Hình ảnh thực tế, thông tin rõ ràng',
            description: 'Nhiều ảnh chụp thực tế, thông tin giá, diện tích và tiện nghi minh bạch.',
            accent: 'blue',
        },
        {
            icon: <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Lưu danh sách phòng yêu thích',
            description: 'Lưu lại những phòng quan tâm để so sánh và quyết định nhanh chóng.',
            accent: 'rose',
        },
        {
            icon: <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Liên hệ trực tiếp với chủ trọ',
            description: 'Dễ dàng kết nối với người đăng tin thông qua số điện thoại hoặc Zalo được cung cấp.',
            accent: 'amber',
        },
        {
            icon: <ShieldIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Báo cáo tin giả, chống lừa đảo',
            description: 'Hệ thống kiểm duyệt chặt chẽ, báo cáo tin giả để đảm bảo thông tin chính xác.',
            accent: 'violet',
        },
        {
            icon: <PostIcon className="h-5 w-5 sm:h-6 sm:w-6" />,
            title: 'Đăng và quản lý tin cho thuê dễ dàng',
            description: 'Đăng tin miễn phí, quản lý danh sách phòng và theo dõi liên hệ từ người thuê.',
            accent: 'cyan',
        },
    ]

    return (
        <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-950 antialiased">

            {/* ── NAVBAR ── */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="group flex items-center gap-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-black text-white text-sm transition-all duration-300 group-hover:bg-emerald-700 group-hover:shadow-lg group-hover:shadow-emerald-600/30">T</div>
                        <span className="text-lg font-black text-slate-950 tracking-tight transition-colors duration-300 group-hover:text-emerald-600">TAYTRO</span>
                    </Link>
                    <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <div className="relative" ref={null}>
                                <button
                                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                                    type="button"
                                >
                                    {user.avatar ? (
                                        <img className="h-full w-full object-cover" src={user.avatar} alt={user.fullName || 'Tài khoản'} />
                                    ) : (
                                        (user.fullName || 'T').charAt(0).toUpperCase()
                                    )}
                                </button>
                            </div>
                            <button
                                className="group/logout inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 text-xs font-black text-white shadow-sm transition-all duration-200 hover:scale-[1.04] hover:from-red-700 hover:to-rose-700 hover:shadow-lg hover:shadow-red-300/50 active:scale-95 sm:text-sm"
                                type="button"
                                onClick={() => {
                                    logout()
                                    navigate(ROUTES.HOME)
                                }}
                            >
                                <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-200 group-hover/logout:-translate-x-0.5" fill="none" viewBox="0 0 24 24">
                                    <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Đăng xuất</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to={ROUTES.LOGIN} className="hidden rounded-xl border-2 border-emerald-600 px-4 py-2 text-xs font-bold text-emerald-600 transition-all duration-300 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95 sm:inline-flex sm:h-9 sm:items-center sm:text-sm">
                                Đăng nhập
                            </Link>
                            <Link to={ROUTES.REGISTER} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-95 sm:h-9 sm:flex sm:items-center sm:text-sm">
                                Đăng ký
                            </Link>
                        </>
                    )}
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center">
                {/* Background grid */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 top-32 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-400/10 blur-3xl" />
                    <div className="absolute -right-16 top-48 h-72 w-72 rounded-full bg-gradient-to-br from-teal-300/10 to-blue-400/10 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.025]" style={{
                        backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />
                </div>

                {/* Content wrapper */}
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
                    <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-16">

                        {/* Left content */}
                        <div className={`flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

                            {/* Tag */}
                            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-100 hover:shadow-sm sm:text-sm">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </span>
                                Hơn 10,000 phòng đang cho thuê
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 transition-all duration-500 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                                Kết nối{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-emerald-600">nhanh chóng</span>
                                    <span className="absolute inset-x-0 bottom-1 h-2 rounded bg-emerald-200/70 -skew-x-1 sm:bottom-1.5 sm:h-3" />
                                </span>
                                <br className="hidden sm:block" />
                                người thuê &amp; chủ trọ
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500 transition-all duration-500 sm:mt-5 sm:text-base">
                                Khám phá hàng nghìn phòng trọ chất lượng với thông tin minh bạch, tìm kiếm thông minh và kết nối trực tiếp với chủ trọ.
                            </p>

                            {/* CTAs */}
                            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-7 sm:flex-row sm:gap-4">
                                <button
                                    onClick={scrollToSearch}
                                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-1 active:scale-[0.97] sm:h-13 sm:text-base"
                                >
                                    <SearchIcon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 sm:h-5 sm:w-5" />
                                    Tìm phòng ngay
                                </button>
                                <Link
                                    to={ROUTES.CREATE_POST}
                                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 active:scale-[0.97] sm:h-13 sm:text-base"
                                >
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Đăng tin cho thuê
                                </Link>
                            </div>

                            {/* Trust bar */}
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:mt-6 sm:justify-start sm:gap-x-5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="relative inline-flex h-4 w-4">
                                        <StarIcon className="absolute inset-0 h-4 w-4 text-slate-200" />
                                        {i <= 4 && <StarIcon className="absolute inset-0 h-4 w-4 text-amber-400" />}
                                        {i === 5 && (
                                            <div className="absolute inset-0 overflow-hidden" style={{ width: '80%' }}>
                                                <StarIcon className="h-4 w-4 text-amber-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <span className="text-xs text-slate-400 transition-colors duration-300 hover:text-slate-500 sm:text-sm">4.8/5 · 50,000+ người dùng</span>
                            </div>
                        </div>

                        {/* Right — image */}
                        <div
                            className={`w-full max-w-md transition-all duration-700 lg:max-w-lg ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '150ms' }}
                        >
                            <div className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:shadow-emerald-900/20 sm:rounded-3xl">
                                <img
                                    src="https://picsum.photos/seed/taytro-hero-v2/1400/900"
                                    alt="Căn hộ hiện đại cho thuê"
                                    className={`h-52 w-full object-cover transition-all duration-1000 sm:h-72 md:h-80 lg:h-[500px] ${imgLoaded ? 'scale-100 blur-0' : 'scale-105 blur-sm'}`}
                                    onLoad={() => setImgLoaded(true)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                                {/* Price chip */}
                                <div className="absolute bottom-4 left-3 flex items-center gap-2 rounded-xl border border-white/25 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/100 hover:shadow-2xl hover:scale-105 sm:bottom-5 sm:left-5 sm:gap-2.5 sm:px-4 cursor-pointer">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 transition-all duration-300 group-hover:bg-emerald-200 sm:h-9 sm:w-9">
                                        <span className="text-sm sm:text-base">🏠</span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 sm:text-xs">Phòng trọ Quận 1</p>
                                        <p className="text-xs font-black text-emerald-600 sm:text-sm">4.5 triệu/tháng</p>
                                    </div>
                                </div>

                                {/* Verified chip */}
                                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/95 px-2 py-1.5 shadow backdrop-blur-sm transition-all duration-300 hover:bg-white/100 sm:right-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-2">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-emerald-500/40 sm:h-6 sm:w-6 sm:text-xs">✓</div>
                                    <span className="text-[10px] font-bold text-slate-700 sm:text-xs">Đã xác minh</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Scroll hint */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-700 sm:bottom-8 ${heroVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="group flex flex-col items-center gap-1 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:text-slate-600 cursor-pointer">
                        <span className="text-[10px] font-medium sm:text-xs">Khám phá</span>
                        <ChevronDownIcon className="h-4 w-4 animate-bounce" />
                    </button>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="border-y border-slate-100 bg-slate-50/50">
                <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-4">
                    <StatCounter end={10000} suffix="+" label="Phòng trọ" />
                    <StatCounter end={50000} suffix="+" label="Người dùng" />
                    <StatCounter end={5000} suffix="+" label="Chủ trọ tin cậy" />
                    <StatCounter end={98} suffix="%" label="Hài lòng" />
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="bg-white py-14 sm:py-18 lg:py-22">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">
                            Nền tảng kết nối nhanh chóng, an toàn &amp; tiện lợi
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:mt-4 sm:text-base">
                            Tất cả những gì bạn cần để tìm hoặc cho thuê phòng trọ — ngay trong tầm tay.
                        </p>
                    </div>

                    {/* Cards */}
                    <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <FeatureCard key={i} {...f} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">
                            Chỉ 3 bước để thuê phòng
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:mt-4 sm:text-base">
                            Từ tìm kiếm đến liên hệ chủ trọ — tất cả chỉ trong vài phút.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-3 sm:gap-8">
                        <StepCard
                            number={1}
                            title="Tìm kiếm & Lọc"
                            description="Nhập khu vực, chọn mức giá và diện tích phù hợp."
                            index={0}
                            icon={<SearchIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                        />
                        <StepCard
                            number={2}
                            title="Xem chi tiết"
                            description="Khám phá thông tin đầy đủ: giá, diện tích, tiện ích, hình ảnh."
                            index={1}
                            icon={<ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                        />
                        <StepCard
                            number={3}
                            title="Liên hệ & Thuê"
                            description="Liên hệ trực tiếp chủ trọ. Đặt lịch xem phòng và thuê ngay."
                            index={2}
                            icon={<PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                        />
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative overflow-hidden bg-slate-950 py-14 sm:py-18 lg:py-24">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
                    <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />
                </div>
                <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
                    <h2 className="text-2xl font-black text-white sm:text-3xl md:text-4xl lg:text-5xl">
                        Sẵn sàng tìm phòng{' '}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">hoàn hảo?</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mt-5 sm:text-base md:text-lg">
                        Tham gia cộng đồng 50,000+ người đang tìm kiếm và cho thuê phòng trọ trên TAYTRO.
                    </p>
                    <div className="mt-7 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:justify-center sm:gap-4">
                        <button
                            onClick={scrollToSearch}
                            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-10 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-[0.97] sm:h-13 sm:text-base"
                        >
                            <SearchIcon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 sm:h-5 sm:w-5" />
                            Tìm phòng ngay
                        </button>
                        <Link
                            to={ROUTES.REGISTER}
                            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-10 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/15 hover:-translate-y-1 active:scale-[0.97] sm:h-13 sm:text-base"
                        >
                            Bắt đầu miễn phí
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-slate-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <Link to="/" className="group flex items-center gap-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-black text-white text-sm transition-all duration-300 group-hover:bg-emerald-700 group-hover:shadow-lg group-hover:shadow-emerald-600/30">T</div>
                            <span className="text-base font-black text-slate-950 tracking-tight transition-colors duration-300 group-hover:text-emerald-600">TAYTRO</span>
                        </Link>
                        <p className="text-xs text-slate-400 sm:text-sm">
                            © 2026 TAYTRO — Nền tảng kết nối người thuê &amp; chủ trọ hàng đầu Việt Nam.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
