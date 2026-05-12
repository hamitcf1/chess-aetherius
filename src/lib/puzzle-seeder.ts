import { db } from './db'
import type { Puzzle } from '@/types/chess'

const SEED_VERSION_KEY = 'satranc-puzzles-seed-version'
const CURRENT_VERSION = 2  // v2: validated puzzles with simpler convention (no setup move)

/**
 * On first run (or version bump) load puzzles-seed.json into Dexie.
 * Subsequent runs are no-ops.
 */
export async function seedPuzzles(): Promise<void> {
    const installed = Number(localStorage.getItem(SEED_VERSION_KEY) || '0')
    if (installed >= CURRENT_VERSION) return

    try {
        // Wipe old (potentially invalid) puzzles before reseeding
        await db.puzzles.clear()

        const res = await fetch('/puzzles-seed.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const seed = await res.json() as Array<Omit<Puzzle, 'attempts' | 'succeeded'>>
        const records: Puzzle[] = seed.map(p => ({
            ...p,
            attempts: 0,
            succeeded: false,
        }))
        await db.puzzles.bulkPut(records)
        localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_VERSION))
        console.log(`Seeded ${records.length} puzzles (v${CURRENT_VERSION})`)
    } catch (e) {
        console.warn('Puzzle seeding failed:', e)
    }
}
