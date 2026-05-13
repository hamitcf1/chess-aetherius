import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db as firestore } from './firebase'
import { db } from './db'
import { useProfileStore } from '@/stores/profileStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import type { Game, Profile, AchievementRecord } from '@/types/chess'

/**
 * Cloud sync stratejisi: Dexie (yerel) primary store, Firestore eventual consistency.
 * - signIn'de: cloud → local (uzak veri lokali geçer)
 * - hamle/oyun sonu sonrası: local → cloud (background push)
 * - signOut'ta: local kalır (yeniden login'de senkronize)
 */

const PROFILE_DOC = (uid: string) => doc(firestore, 'users', uid, 'meta', 'profile')
const GAMES_COL = (uid: string) => collection(firestore, 'users', uid, 'games')
const ACHS_COL = (uid: string) => collection(firestore, 'users', uid, 'achievements')

export async function pullFromCloud(uid: string): Promise<{ profile?: Profile; gameCount: number; achCount: number }> {
    let profile: Profile | undefined
    let gameCount = 0
    let achCount = 0

    try {
        const profileSnap = await getDoc(PROFILE_DOC(uid))
        if (profileSnap.exists()) {
            const data = profileSnap.data()
            profile = {
                username: data.username || 'Oyuncu',
                avatar: data.avatar,
                createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
                elo: data.elo ?? 200,
                puzzleElo: data.puzzleElo ?? 200,
                peakElo: data.peakElo ?? 200,
                gamesPlayed: data.gamesPlayed ?? 0,
                wins: data.wins ?? 0,
                losses: data.losses ?? 0,
                draws: data.draws ?? 0,
                currentStreak: data.currentStreak ?? 0,
                longestStreak: data.longestStreak ?? 0,
                puzzleStreak: data.puzzleStreak ?? 0,
                longestPuzzleStreak: data.longestPuzzleStreak ?? 0,
                favoriteOpenings: data.favoriteOpenings ?? {},
                totalPlayTimeMs: data.totalPlayTimeMs ?? 0,
                lastActiveAt: data.lastActiveAt?.toMillis?.() ?? Date.now(),
            }
            useProfileStore.getState().setProfile(profile)
        }
    } catch (e) {
        console.warn('pullFromCloud profile failed:', e)
    }

    try {
        const gamesSnap = await getDocs(query(GAMES_COL(uid), orderBy('createdAt', 'desc'), limit(200)))
        const games: Game[] = []
        gamesSnap.forEach(d => games.push(d.data() as Game))
        if (games.length > 0) {
            await db.games.bulkPut(games)
            gameCount = games.length
        }
    } catch (e) {
        console.warn('pullFromCloud games failed:', e)
    }

    try {
        const achsSnap = await getDocs(ACHS_COL(uid))
        const recs: AchievementRecord[] = []
        achsSnap.forEach(d => recs.push(d.data() as AchievementRecord))
        if (recs.length > 0) {
            await db.achievements.bulkPut(recs)
            await useAchievementsStore.getState().load()
            achCount = recs.length
        }
    } catch (e) {
        console.warn('pullFromCloud achievements failed:', e)
    }

    return { profile, gameCount, achCount }
}

export async function pushProfileToCloud(uid: string): Promise<void> {
    try {
        const p = useProfileStore.getState()
        await setDoc(PROFILE_DOC(uid), {
            username: p.username,
            avatar: p.avatar ?? null,
            elo: p.elo,
            puzzleElo: p.puzzleElo,
            peakElo: p.peakElo,
            gamesPlayed: p.gamesPlayed,
            wins: p.wins,
            losses: p.losses,
            draws: p.draws,
            currentStreak: p.currentStreak,
            longestStreak: p.longestStreak,
            puzzleStreak: p.puzzleStreak,
            longestPuzzleStreak: p.longestPuzzleStreak,
            favoriteOpenings: p.favoriteOpenings,
            totalPlayTimeMs: p.totalPlayTimeMs,
            createdAt: p.createdAt,
            lastActiveAt: serverTimestamp(),
        }, { merge: true })
    } catch (e) {
        console.warn('pushProfileToCloud failed:', e)
    }
}

export async function pushGameToCloud(uid: string, game: Game): Promise<void> {
    try {
        await setDoc(doc(GAMES_COL(uid), game.id), game)
    } catch (e) {
        console.warn('pushGameToCloud failed:', e)
    }
}

export async function pushAchievementsToCloud(uid: string, records: AchievementRecord[]): Promise<void> {
    if (records.length === 0) return
    try {
        const batch = writeBatch(firestore)
        for (const r of records) batch.set(doc(ACHS_COL(uid), r.id), r)
        await batch.commit()
    } catch (e) {
        console.warn('pushAchievementsToCloud failed:', e)
    }
}
