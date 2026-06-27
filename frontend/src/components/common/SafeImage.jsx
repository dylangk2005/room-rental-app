import { useState, useEffect } from 'react'

const DEFAULT_FALLBACK = 'https://picsum.photos/seed/taytro-fallback/900/600'

const SafeImage = ({
    src,
    fallbackSrc,
    alt,
    className = '',
    onErrorCustom,
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState(src || DEFAULT_FALLBACK)
    const [hasErrored, setHasErrored] = useState(false)

    useEffect(() => {
        setHasErrored(false)
        setImgSrc(src || DEFAULT_FALLBACK)
    }, [src])

    const handleError = () => {
        if (!hasErrored) {
            setHasErrored(true)
            const nextSrc = fallbackSrc || DEFAULT_FALLBACK
            setImgSrc(nextSrc)
            onErrorCustom?.(src, nextSrc)
        }
    }

    const handleLoad = () => {
        if (hasErrored) setHasErrored(false)
    }

    return (
        <img
            src={imgSrc}
            alt={alt || ''}
            className={className}
            onError={handleError}
            onLoad={handleLoad}
            {...props}
        />
    )
}

export default SafeImage
