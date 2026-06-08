export const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export const formatDateTime = (value) => {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

export const getErrorMessage = (error, fallback = 'Không thể thực hiện thao tác. Vui lòng thử lại.') =>
    error?.response?.data?.message || fallback
