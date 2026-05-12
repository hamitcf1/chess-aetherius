import Dexie, { type Table } from 'dexie'
import type { Game, Puzzle, AchievementRecord, LessonProgress } from '@/types/chess'

export class SatrancDB extends Dexie {
    games!: Table<Game, string>
    puzzles!: Table<Puzzle, string>
    achievements!: Table<AchievementRecord, string>
    lessons!: Table<LessonProgress, string>

    constructor() {
        super('SatrancDB')
        this.version(1).stores({
            games: 'id, createdAt, result, userColor, aiElo',
            puzzles: 'id, rating, solvedAt, *themes',
            achievements: 'id, unlockedAt',
            lessons: 'lessonId, completedAt',
        })
    }
}

export const db = new SatrancDB()

/** Helper: get all games sorted by createdAt desc. */
export async function getRecentGames(limit = 50): Promise<Game[]> {
    return db.games.orderBy('createdAt').reverse().limit(limit).toArray()
}

/** Helper: get a puzzle close to target rating, not yet solved. Widens aggressively. */
export async function pickPuzzleForRating(targetRating: number): Promise<Puzzle | undefined> {
    // Try increasingly wide rating windows
    for (const tolerance of [150, 350, 700, 1500]) {
        const min = Math.max(0, targetRating - tolerance)
        const max = targetRating + tolerance
        const candidates = await db.puzzles
            .where('rating')
            .between(min, max, true, true)
            .filter(p => !p.solvedAt)
            .limit(100)
            .toArray()
        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)]
        }
    }
    // Last resort: ANY unsolved puzzle
    const anyUnsolved = await db.puzzles
        .filter(p => !p.solvedAt)
        .limit(50)
        .toArray()
    if (anyUnsolved.length === 0) {
        // All solved — allow replays: reset solved status on a random batch
        const anyPuzzle = await db.puzzles.limit(20).toArray()
        return anyPuzzle[Math.floor(Math.random() * anyPuzzle.length)]
    }
    return anyUnsolved[Math.floor(Math.random() * anyUnsolved.length)]
}

/** Helper: total achievements unlocked. */
export async function countAchievements(): Promise<number> {
    return db.achievements.count()
}

/**
 * Günün Bulmacası — bugünün tarihi seed olarak kullanılarak
 * deterministik bir puzzle döner. Aynı gün herkes aynı bulmacaya bakar.
 */
export async function getDailyPuzzle(): Promise<Puzzle | undefined> {
    const all = await db.puzzles.toArray()
    if (all.length === 0) return undefined
    const today = new Date()
    const dateKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    // Simple hash → index
    const idx = (dateKey * 2654435761) % all.length
    return all[Math.abs(idx)]
}

/** Helper: stats for profile page. */
export async function getProfileStats() {
    const [totalGames, totalPuzzles, totalAchievements] = await Promise.all([
        db.games.count(),
        db.puzzles.filter(p => !!p.solvedAt).count(),
        db.achievements.count(),
    ])
    return { totalGames, totalPuzzles, totalAchievements }
}
