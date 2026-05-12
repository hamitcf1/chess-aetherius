import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | number | string) {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function formatRelativeTime(date: Date | number | string, locale: string = 'tr') {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const diff = (Date.now() - d.getTime()) / 1000
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (diff < 60) return rtf.format(-Math.round(diff), 'second')
    if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute')
    if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
    if (diff < 2592000) return rtf.format(-Math.round(diff / 86400), 'day')
    if (diff < 31536000) return rtf.format(-Math.round(diff / 2592000), 'month')
    return rtf.format(-Math.round(diff / 31536000), 'year')
}

export function formatDuration(ms: number): string {
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export function uid(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
