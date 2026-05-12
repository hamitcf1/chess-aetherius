import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types/chess'

interface ProfileActions {
    setUsername: (name: string) => void
    setAvatar: (avatar?: string) => void
    applyGameResult: (opts: {
        score: 1 | 0.5 | 0
        newElo: number
        playTimeMs: number
        opening?: string
    }) => void
    applyPuzzleResult: (opts: { succeeded: boolean; newPuzzleElo: number }) => void
    bumpLastActive: () => void
    reset: () => void
    /** Reset stats (ELO, win/loss, streak) but keep username + achievements unlocked. */
    resetStats: () => void
    setProfile: (p: Partial<Profile>) => void
}

type ProfileStore = Profile & ProfileActions

const DEFAULT_ELO = 200

function freshProfile(): Profile {
    return {
        username: 'Oyuncu',
        avatar: undefined,
        createdAt: Date.now(),
        elo: DEFAULT_ELO,
        puzzleElo: DEFAULT_ELO,
        peakElo: DEFAULT_ELO,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        longestStreak: 0,
        puzzleStreak: 0,
        longestPuzzleStreak: 0,
        favoriteOpenings: {},
        totalPlayTimeMs: 0,
        lastActiveAt: Date.now(),
    }
}

export const useProfileStore = create<ProfileStore>()(
    persist(
        (set) => ({
            ...freshProfile(),

            setUsername: (username) => set({ username }),
            setAvatar: (avatar) => set({ avatar }),
            setProfile: (p) => set(p),

            applyGameResult: ({ score, newElo, playTimeMs, opening }) =>
                set((state) => {
                    const isWin = score === 1
                    const isDraw = score === 0.5
                    const isLoss = score === 0
                    const peakElo = Math.max(state.peakElo, newElo)
                    const newStreak = isWin ? state.currentStreak + 1 : 0
                    const favoriteOpenings = opening
                        ? { ...state.favoriteOpenings, [opening]: (state.favoriteOpenings[opening] ?? 0) + 1 }
                        : state.favoriteOpenings
                    return {
                        elo: newElo,
                        peakElo,
                        gamesPlayed: state.gamesPlayed + 1,
                        wins: state.wins + (isWin ? 1 : 0),
                        losses: state.losses + (isLoss ? 1 : 0),
                        draws: state.draws + (isDraw ? 1 : 0),
                        currentStreak: newStreak,
                        longestStreak: Math.max(state.longestStreak, newStreak),
                        favoriteOpenings,
                        totalPlayTimeMs: state.totalPlayTimeMs + playTimeMs,
                        lastActiveAt: Date.now(),
                    }
                }),

            applyPuzzleResult: ({ succeeded, newPuzzleElo }) =>
                set((state) => {
                    const newStreak = succeeded ? state.puzzleStreak + 1 : 0
                    return {
                        puzzleElo: newPuzzleElo,
                        puzzleStreak: newStreak,
                        longestPuzzleStreak: Math.max(state.longestPuzzleStreak, newStreak),
                        lastActiveAt: Date.now(),
                    }
                }),

            bumpLastActive: () => set({ lastActiveAt: Date.now() }),

            reset: () => set(freshProfile()),

            resetStats: () =>
                set((state) => ({
                    elo: DEFAULT_ELO,
                    puzzleElo: DEFAULT_ELO,
                    peakElo: DEFAULT_ELO,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    puzzleStreak: 0,
                    longestPuzzleStreak: 0,
                    favoriteOpenings: {},
                    totalPlayTimeMs: 0,
                    // keep username, avatar, createdAt, lastActiveAt
                    lastActiveAt: Date.now(),
                })),
        }),
        { name: 'satranc-profile' }
    )
)
