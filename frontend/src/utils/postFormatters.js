export const formatCurrency = (value) => {
    const number = Number(value || 0)
    if (number >= 1000000) {
        return `${(number / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/tháng`
    }
    return `${number.toLocaleString('vi-VN')} đ/tháng`
}

export const formatDate = (value) => {
    if (!value) return 'Đang cập nhật'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}
