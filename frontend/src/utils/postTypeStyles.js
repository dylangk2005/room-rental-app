const normalizePostTypeName = (value) =>
    (value ?? '')
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

export const POST_TYPE_CATEGORIES = {
    HOT_VIP: 'HOT_VIP',
    VIP1: 'VIP1',
    VIP2: 'VIP2',
    NORMAL: 'NORMAL',
}

const CATEGORY_PRIORITY = {
    HOT_VIP: 1,
    VIP1: 2,
    VIP2: 3,
    NORMAL: 4,
}

export const getPostTypeCategory = (postTypeName, priority) => {
    const name = normalizePostTypeName(postTypeName)
    const numericPriority = Number(priority)

    if (Number.isFinite(numericPriority)) {
        if (numericPriority === 1) return POST_TYPE_CATEGORIES.HOT_VIP
        if (numericPriority === 2) return POST_TYPE_CATEGORIES.VIP1
        if (numericPriority === 3) return POST_TYPE_CATEGORIES.VIP2
    }

    if (name.includes('noi bat') || name.includes('vip noi bat') || name.includes('vip dac biet')) {
        return POST_TYPE_CATEGORIES.HOT_VIP
    }
    if (name.includes('vip1') || name.includes('vip 1')) {
        return POST_TYPE_CATEGORIES.VIP1
    }
    if (name.includes('vip2') || name.includes('vip 2')) {
        return POST_TYPE_CATEGORIES.VIP2
    }
    return POST_TYPE_CATEGORIES.NORMAL
}

export const getCategoryPriority = (category) => CATEGORY_PRIORITY[category] ?? 99

const POST_TYPE_CATEGORY_META = {
    [POST_TYPE_CATEGORIES.HOT_VIP]: {
        label: 'Tin Vip Nổi Bật',
        shortLabel: 'Vip nổi bật',
        badgeClass: 'bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white ring-red-300 shadow-md shadow-red-300/50',
        titleSize: '20px',
        titleColor: '#dc2626',
        imageLimit: 5,
        showRecommendTag: true,
        recommendGradient: 'bg-gradient-to-r from-red-500 via-orange-500 to-pink-500',
    },
    [POST_TYPE_CATEGORIES.VIP1]: {
        label: 'Tin Vip 1',
        shortLabel: 'Vip 1',
        badgeClass: 'bg-pink-100 text-pink-800 ring-pink-200',
        titleSize: '18px',
        titleColor: '#db2777',
        imageLimit: 3,
        showRecommendTag: false,
        recommendGradient: 'bg-pink-500',
    },
    [POST_TYPE_CATEGORIES.VIP2]: {
        label: 'Tin Vip 2',
        shortLabel: 'Vip 2',
        badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
        titleSize: '17px',
        titleColor: '#16a34a',
        imageLimit: 2,
        showRecommendTag: false,
        recommendGradient: 'bg-emerald-500',
    },
    [POST_TYPE_CATEGORIES.NORMAL]: {
        label: 'Tin thường',
        shortLabel: 'Tin thường',
        badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200',
        titleSize: '15px',
        titleColor: '#111827',
        imageLimit: 1,
        showRecommendTag: false,
        recommendGradient: 'bg-slate-500',
    },
}

export const getPostTypeCategoryMeta = (category) =>
    POST_TYPE_CATEGORY_META[category] || POST_TYPE_CATEGORY_META[POST_TYPE_CATEGORIES.NORMAL]

export const isVipCategory = (category) =>
    category === POST_TYPE_CATEGORIES.HOT_VIP ||
    category === POST_TYPE_CATEGORIES.VIP1 ||
    category === POST_TYPE_CATEGORIES.VIP2

// ─── Đọc cấu hình hiển thị trực tiếp từ field API (ưu tiên) ────────────
// Post dùng cho PostCard: có postTypeIsUppercase, postTypeHasRecommendTag, postTypeMaxImageLimit
// Fallback về category meta nếu API chưa trả (legacy)

export const getPostTypeMaxImageLimit = (post) => {
    if (post && Number.isFinite(post.postTypeMaxImageLimit) && post.postTypeMaxImageLimit > 0) {
        return post.postTypeMaxImageLimit
    }
    const category = getPostTypeCategory(post?.postTypeName, post?.postTypePriority)
    return getPostTypeCategoryMeta(category).imageLimit
}

export const shouldShowRecommendTag = (post) => {
    if (post && typeof post.postTypeHasRecommendTag === 'boolean') {
        return post.postTypeHasRecommendTag
    }
    const category = getPostTypeCategory(post?.postTypeName, post?.postTypePriority)
    return getPostTypeCategoryMeta(category).showRecommendTag
}

export const shouldUppercaseTitle = (post) => {
    if (post && typeof post.postTypeIsUppercase === 'boolean') {
        return post.postTypeIsUppercase
    }
    const category = getPostTypeCategory(post?.postTypeName, post?.postTypePriority)
    return category === POST_TYPE_CATEGORIES.HOT_VIP
}

export const getRecommendTagGradient = (post) => {
    const category = getPostTypeCategory(post?.postTypeName, post?.postTypePriority)
    return getPostTypeCategoryMeta(category).recommendGradient
}
