import { create } from 'zustand'
import { db } from '@/lib/db'
import { ACHIEVEMENT_MAP } from '@/lib/achievements-data'
import type { AchievementDef, AchievementRecord } from '@/types/chess'

interface AchievementsState {
    unlocked: Set<string>
    queue: AchievementDef[]   // ones to toast next
    loaded: boolean
}

interface AchievementsActions {
    load: () => Promise<void>
    unlock: (ids: string[]) => Promise<AchievementDef[]>  // returns newly unlocked
    dequeue: () => void
    isUnlocked: (id: string) => boolean
}

type AchievementsStore = AchievementsState & AchievementsActions

export const useAchievementsStore = create<AchievementsStore>((set, get) => ({
    unlocked: new Set(),
    queue: [],
    loaded: false,

    load: async () => {
        const records = await db.achievements.toArray()
        set({ unlocked: new Set(records.map(r => r.id)), loaded: true })
    },

    unlock: async (ids) => {
        const { unlocked } = get()
        const newOnes: AchievementDef[] = []
        const newRecords: AchievementRecord[] = []
        const now = Date.now()

        for (const id of ids) {
            const def = ACHIEVEMENT_MAP.get(id)
            if (!def) continue
            if (unlocked.has(id)) continue
            unlocked.add(id)
            newOnes.push(def)
            newRecords.push({ id, unlockedAt: now })
        }

        if (newRecords.length) {
            try {
                await db.achievements.bulkPut(newRecords)
            } catch (e) {
                console.error('Failed to save achievements:', e)
            }
            set({
                unlocked: new Set(unlocked),
                queue: [...get().queue, ...newOnes],
            })
        }
        return newOnes
    },

    dequeue: () => set((s) => ({ queue: s.queue.slice(1) })),

    isUnlocked: (id) => get().unlocked.has(id),
}))
