/** Lazy-load lessons-seed.json on first access. */

export interface LessonStepData {
    fen: string
    descTr: string
    descEn: string
    expectedUci?: string
}

export interface LessonData {
    id: string
    category: 'basics' | 'opening' | 'tactic' | 'endgame' | 'strategy'
    difficulty: 1 | 2 | 3 | 4 | 5
    titleTr: string
    titleEn: string
    descTr: string
    descEn: string
    steps: LessonStepData[]
}

let cache: LessonData[] | null = null

export async function loadLessons(): Promise<LessonData[]> {
    if (cache) return cache
    try {
        const res = await fetch('/lessons-seed.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        cache = (await res.json()) as LessonData[]
        return cache
    } catch (e) {
        console.error('Failed to load lessons:', e)
        return []
    }
}

export function lessonTitle(lesson: LessonData, lang: 'tr' | 'en'): string {
    return lang === 'tr' ? lesson.titleTr : lesson.titleEn
}

export function lessonDesc(lesson: LessonData, lang: 'tr' | 'en'): string {
    return lang === 'tr' ? lesson.descTr : lesson.descEn
}

export function stepDesc(step: LessonStepData, lang: 'tr' | 'en'): string {
    return lang === 'tr' ? step.descTr : step.descEn
}
