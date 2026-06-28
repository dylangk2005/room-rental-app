import { useCallback, useEffect, useState } from 'react'
import SafeImage from './SafeImage'

const ImageLightbox = ({ images = [], title = '', startIndex = 0, onClose }) => {
    const [index, setIndex] = useState(startIndex)
    const hasMultiple = images.length > 1

    const showPrevious = useCallback(() => {
        if (!hasMultiple) return
        setIndex((current) => (current === 0 ? images.length - 1 : current - 1))
    }, [hasMultiple, images.length])

    const showNext = useCallback(() => {
        if (!hasMultiple) return
        setIndex((current) => (current === images.length - 1 ? 0 : current + 1))
    }, [hasMultiple, images.length])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.()
            } else if (event.key === 'ArrowLeft') {
                showPrevious()
            } else if (event.key === 'ArrowRight') {
                showNext()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, showNext, showPrevious])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [])

    if (!images.length) return null

    const safeIndex = Math.min(Math.max(index, 0), images.length - 1)
    const currentImage = images[safeIndex]

    return (
        <div
            className="animate-in fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/90 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label={title ? `Xem ảnh: ${title}` : 'Xem ảnh'}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose?.()
            }}
        >
            <div className="slide-in-from-bottom-3 relative flex h-full w-full max-w-5xl flex-col">
                <div className="flex items-center justify-between gap-3 px-2 pb-3 text-white">
                    <p className="min-w-0 truncate text-sm font-bold">
                        {title || 'Xem ảnh'}
                    </p>
                    <div className="flex items-center gap-3">
                        {hasMultiple && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black tracking-wide text-white">
                                {safeIndex + 1}/{images.length}
                            </span>
                        )}
                        <button
                            aria-label="Đóng"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                            type="button"
                            onClick={onClose}
                        >
                            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="relative flex flex-1 items-center justify-center">
                    {hasMultiple && (
                        <button
                            aria-label="Xem ảnh trước"
                            className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition hover:scale-110 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 sm:left-4 sm:h-14 sm:w-14"
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                showPrevious()
                            }}
                        >
                            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}

                    <SafeImage
                        key={currentImage}
                        className="slide-in-from-bottom-3 max-h-full max-w-full select-none rounded-2xl object-contain shadow-2xl"
                        src={currentImage}
                        fallbackSrc="https://picsum.photos/seed/lightbox-fallback/1200/800"
                        alt={title ? `${title} - ảnh ${safeIndex + 1}` : `Ảnh ${safeIndex + 1}`}
                        draggable={false}
                        onClick={(event) => event.stopPropagation()}
                    />

                    {hasMultiple && (
                        <button
                            aria-label="Xem ảnh tiếp theo"
                            className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition hover:scale-110 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 sm:right-4 sm:h-14 sm:w-14"
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                showNext()
                            }}
                        >
                            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                            </svg>
                        </button>
                    )}
                </div>

                {hasMultiple && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2 overflow-x-auto px-2 pb-2">
                        {images.map((image, imageIndex) => (
                            <button
                                key={`${image}-${imageIndex}`}
                                className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition hover:scale-105 ${
                                    imageIndex === safeIndex
                                        ? 'border-emerald-400 ring-2 ring-emerald-300/50'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                                type="button"
                                onClick={() => setIndex(imageIndex)}
                                aria-label={`Xem ảnh ${imageIndex + 1}`}
                            >
                                <SafeImage className="h-full w-full object-cover" src={image} fallbackSrc="https://picsum.photos/seed/thumb-fallback/300/200" alt="" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImageLightbox
