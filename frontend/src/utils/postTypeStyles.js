const normalizePostTypeName = (value = '') =>
    value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()

const postTypeColorRules = [
    {
        matches: (name) => name.includes('noi bat'),
        color: '#dc2626',
        label: 'Đỏ',
    },
    {
        matches: (name) => name.includes('vip1'),
        color: '#db2777',
        label: 'Hồng',
    },
    {
        matches: (name) => name.includes('vip2'),
        color: '#16a34a',
        label: 'Xanh lá',
    },
    {
        matches: (name) => name.includes('thuong'),
        color: '#111827',
        label: 'Đen',
    },
]

const fallbackColorLabels = {
    '#ef4444': 'Đỏ',
    '#dc2626': 'Đỏ',
    '#cc0000': 'Đỏ',
    '#e11d48': 'Đỏ hồng',
    '#db2777': 'Hồng',
    '#f97316': 'Cam',
    '#ea580c': 'Cam',
    '#e65c00': 'Cam',
    '#f59e0b': 'Vàng cam',
    '#2563eb': 'Xanh dương',
    '#0ea5e9': 'Xanh dương',
    '#0891b2': 'Xanh biển',
    '#0f766e': 'Xanh lá',
    '#059669': 'Xanh lá',
    '#16a34a': 'Xanh lá',
    '#0f172a': 'Xám đậm',
    '#334155': 'Xám',
    '#111827': 'Đen',
    red: 'Đỏ',
    pink: 'Hồng',
    orange: 'Cam',
    blue: 'Xanh dương',
    green: 'Xanh lá',
    emerald: 'Xanh lá',
    slate: 'Xám',
    black: 'Đen',
}

const getPostTypeColorRule = (postTypeName) => {
    const normalizedName = normalizePostTypeName(postTypeName)
    return postTypeColorRules.find((rule) => rule.matches(normalizedName))
}

export const getPostTypeTitleColor = (postTypeName, fallbackColor) =>
    getPostTypeColorRule(postTypeName)?.color || fallbackColor || undefined

export const getPostTypeColorLabel = (postTypeName, fallbackColor) => {
    const rule = getPostTypeColorRule(postTypeName)
    if (rule) return rule.label

    const normalizedColor = fallbackColor?.trim().toLowerCase()
    if (!normalizedColor) return 'Mặc định'

    return fallbackColorLabels[normalizedColor] || 'Màu tùy chỉnh'
}
