let toastStore = []
let listeners = new Set()
let nextId = 1

const TOAST_DURATION = 3500

const emit = () => {
    listeners.forEach((listener) => listener(toastStore))
}

const pushToast = (toast) => {
    const id = nextId
    nextId += 1
    const item = { id, type: 'info', ...toast }
    toastStore = [...toastStore, item]
    emit()

    if (item.duration !== 0) {
        const timeout = item.duration ?? TOAST_DURATION
        window.setTimeout(() => {
            toastStore = toastStore.filter((entry) => entry.id !== id)
            emit()
        }, timeout)
    }

    return id
}

const dropToast = (id) => {
    toastStore = toastStore.filter((entry) => entry.id !== id)
    emit()
}

export const subscribeToasts = (listener) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export const getToastsSnapshot = () => toastStore

export const showToast = (options) => pushToast(options)

export const dismissToast = (id) => dropToast(id)
