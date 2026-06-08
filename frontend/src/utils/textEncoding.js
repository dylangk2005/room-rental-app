const mojibakePattern = new RegExp([
    '\\u00c3.',
    '\\u00c4.',
    '\\u00c6.',
    '\\u00c2.',
    '\\u00e1\\u00ba.',
    '\\u00e1\\u00bb.',
    '\\u00e2\\u20ac',
    '\\u00d0.',
    '\\u00f0.',
].join('|'))

const windows1252Bytes = {
    '\u20ac': 0x80,
    '\u201a': 0x82,
    '\u0192': 0x83,
    '\u201e': 0x84,
    '\u2026': 0x85,
    '\u2020': 0x86,
    '\u2021': 0x87,
    '\u02c6': 0x88,
    '\u2030': 0x89,
    '\u0160': 0x8a,
    '\u2039': 0x8b,
    '\u0152': 0x8c,
    '\u017d': 0x8e,
    '\u2018': 0x91,
    '\u2019': 0x92,
    '\u201c': 0x93,
    '\u201d': 0x94,
    '\u2022': 0x95,
    '\u2013': 0x96,
    '\u2014': 0x97,
    '\u02dc': 0x98,
    '\u2122': 0x99,
    '\u0161': 0x9a,
    '\u203a': 0x9b,
    '\u0153': 0x9c,
    '\u017e': 0x9e,
    '\u0178': 0x9f,
}

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : null

const toWindows1252Bytes = (value) => {
    const bytes = []

    for (const char of value) {
        const codePoint = char.codePointAt(0)

        if (codePoint <= 0xff) {
            bytes.push(codePoint)
            continue
        }

        if (windows1252Bytes[char]) {
            bytes.push(windows1252Bytes[char])
            continue
        }

        return null
    }

    return new Uint8Array(bytes)
}

export const normalizeTextEncoding = (value) => {
    if (typeof value !== 'string' || !mojibakePattern.test(value) || !textDecoder) {
        return value
    }

    const bytes = toWindows1252Bytes(value)
    if (!bytes) return value

    try {
        return textDecoder.decode(bytes)
    } catch {
        return value
    }
}

export const normalizeApiText = (value) => {
    if (typeof value === 'string') {
        return normalizeTextEncoding(value)
    }

    if (!value || typeof value !== 'object') {
        return value
    }

    if (
        value instanceof Date
        || (typeof Blob !== 'undefined' && value instanceof Blob)
        || (typeof File !== 'undefined' && value instanceof File)
        || (typeof FormData !== 'undefined' && value instanceof FormData)
        || (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer)
    ) {
        return value
    }

    if (Array.isArray(value)) {
        return value.map((item) => normalizeApiText(item))
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, normalizeApiText(item)])
    )
}
