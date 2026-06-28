import { useCallback, useEffect, useState } from 'react'
import { dismissToast, getToastsSnapshot, showToast, subscribeToasts } from './toastStore'

const ICONS = {
    success: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    ),
    error: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.5m0 3v.01M5.07 19h13.86a2 2 0 001.74-3L13.74 5a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
        </svg>
    ),
    info: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.5m0 3v.01M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" />
        </svg>
    ),
}

const TONE_CLASSES = {
    success: 'border-emerald-200 bg-white text-emerald-800 shadow-emerald-200/40',
    error: 'border-red-200 bg-white text-red-800 shadow-red-200/40',
    info: 'border-slate-200 bg-white text-slate-800 shadow-slate-200/40',
}

const ICON_BG_CLASSES = {
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-slate-100 text-slate-700',
}

const ToastItem = ({ toast, onDismiss }) => {
    const tone = TONE_CLASSES[toast.type] || TONE_CLASSES.info
    const iconBg = ICON_BG_CLASSES[toast.type] || ICON_BG_CLASSES.info
    const icon = toast.icon || ICONS[toast.type] || ICONS.info

    return (
        <div
            className={`slide-in-from-right-2 pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-lg ${tone}`}
            role="status"
            aria-live="polite"
        >
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                {icon}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
                {toast.title && <p className="text-sm font-black text-slate-950">{toast.title}</p>}
                <p className="text-sm font-semibold leading-5 text-slate-700">{toast.message}</p>
            </div>
            <button
                aria-label="Đóng thông báo"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                type="button"
                onClick={() => onDismiss(toast.id)}
            >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
        </div>
    )
}

const ToastContainer = () => {
    const [toasts, setToasts] = useState(getToastsSnapshot())

    useEffect(() => subscribeToasts(setToasts), [])

    if (!toasts.length) return null

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-end gap-2 px-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:items-end">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
        </div>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const success = useCallback((message, options = {}) => showToast({ type: 'success', message, ...options }), [])
    const error = useCallback((message, options = {}) => showToast({ type: 'error', message, ...options }), [])
    const info = useCallback((message, options = {}) => showToast({ type: 'info', message, ...options }), [])

    return { showToast, success, error, info, dismiss: dismissToast }
}

export default ToastContainer
