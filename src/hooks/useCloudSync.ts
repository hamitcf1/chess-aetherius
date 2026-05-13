import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useGameStore } from '@/stores/gameStore'
import { pushProfileToCloud, pushAchievementsToCloud, pushGameToCloud } from '@/lib/cloud-sync'

/**
 * Yerel değişiklikleri Firestore'a arka planda push eder.
 * - Profil güncellendiğinde
 * - Achievement açıldığında
 * - Oyun bittiğinde
 *
 * Sadece auth'lu kullanıcı varsa çalışır.
 */
export function useCloudSync() {
    const uid = useAuthStore(s => s.user?.uid)
    const profileSig = useProfileStore(s => `${s.elo}|${s.gamesPlayed}|${s.wins}|${s.losses}|${s.puzzleStreak}`)
    const unlockedSize = useAchievementsStore(s => s.unlocked.size)
    const game = useGameStore(s => s.game)
    const gameStatus = useGameStore(s => s.status)

    const lastSyncedGameIdRef = useRef<string | null>(null)
    const lastUnlockedSizeRef = useRef(0)

    // Push profile changes
    useEffect(() => {
        if (!uid) return
        const id = setTimeout(() => pushProfileToCloud(uid), 500) // debounce
        return () => clearTimeout(id)
    }, [uid, profileSig])

    // Push achievements when count grows
    useEffect(() => {
        if (!uid) return
        if (unlockedSize <= lastUnlockedSizeRef.current) {
            lastUnlockedSizeRef.current = unlockedSize
            return
        }
        lastUnlockedSizeRef.current = unlockedSize
        // Pull current unlocked set and push
        const unlocked = Array.from(useAchievementsStore.getState().unlocked).map(id => ({
            id,
            unlockedAt: Date.now(),
        }))
        pushAchievementsToCloud(uid, unlocked)
    }, [uid, unlockedSize])

    // Push game when finished
    useEffect(() => {
        if (!uid || !game || gameStatus !== 'finished') return
        if (lastSyncedGameIdRef.current === game.id) return
        lastSyncedGameIdRef.current = game.id
        pushGameToCloud(uid, game)
    }, [uid, game, gameStatus])
}
