export const copyText = async (text) => {
    if (!text) return false
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // fall through to legacy method
        }
    }

    try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const succeeded = document.execCommand('copy')
        document.body.removeChild(textarea)
        return succeeded
    } catch {
        return false
    }
}
