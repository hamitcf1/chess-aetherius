import { create } from 'zustand'
import { Chess } from 'chess.js'
import { db, pickPuzzleForRating } from '@/lib/db'
import { newPuzzleRating } from '@/lib/elo'
import { uciToMove } from '@/lib/pgn'
import { useProfileStore } from './profileStore'
import type { Puzzle } from '@/types/chess'

export type PuzzleStatus = 'idle' | 'active' | 'showing_wrong' | 'partial' | 'solved' | 'failed' | 'showing_solution'

interface PuzzleState {
    status: PuzzleStatus
    puzzle: Puzzle | null
    chess: Chess              // live chess state (after correct moves applied)
    fen: string               // display FEN — may show wrong move briefly
    moveIndex: number         // how many solver moves played correctly
    hintLevel: number
    sessionSolved: number
    sessionFailed: number
    /** En son oynanan yanlış hamlenin UCI'si (animasyon ve açıklama için) */
    lastWrongUci: string | null
    /** Beklenen doğru hamlenin UCI'si (yanlış sonrası açıklama için) */
    expectedUci: string | null
    /** Şu an çözücüden beklenen hamlenin indeksi */
    solverMoveCount: number
}

interface PuzzleActions {
    loadNext: () => Promise<void>
    attemptMove: (uci: string) => 'correct' | 'incorrect' | 'solved'
    /** showing_wrong → failed geçişi (1.5s sonra UI tarafından çağrılır) */
    confirmFailed: () => void
    useHint: () => void
    showSolution: () => void
    reset: () => void
}

type PuzzleStore = PuzzleState & PuzzleActions

function totalSolverMoves(puzzle: Puzzle): number {
    // Solver moves are at indices 0, 2, 4, ...
    return Math.ceil(puzzle.movesUci.length / 2)
}

export const usePuzzleStore = create<PuzzleStore>((set, get) => ({
    status: 'idle',
    puzzle: null,
    chess: new Chess(),
    fen: new Chess().fen(),
    moveIndex: 0,
    hintLevel: 0,
    sessionSolved: 0,
    sessionFailed: 0,
    lastWrongUci: null,
    expectedUci: null,
    solverMoveCount: 0,

    loadNext: async () => {
        const profile = useProfileStore.getState()
        const puzzle = await pickPuzzleForRating(profile.puzzleElo)
        if (!puzzle) {
            set({ status: 'idle', puzzle: null })
            return
        }
        const chess = new Chess(puzzle.fen)
        set({
            status: 'active',
            puzzle,
            chess,
            fen: chess.fen(),
            moveIndex: 0,
            hintLevel: 0,
            lastWrongUci: null,
            expectedUci: puzzle.movesUci[0] ?? null,
            solverMoveCount: totalSolverMoves(puzzle),
        })
    },

    attemptMove: (uci) => {
        const { puzzle, chess, moveIndex, status } = get()
        if (!puzzle || status !== 'active') return 'incorrect'

        const expectedIdx = moveIndex * 2
        const expectedUci = puzzle.movesUci[expectedIdx]
        if (!expectedUci) return 'incorrect'

        if (!uciMatchesIgnoringCase(uci, expectedUci)) {
            // Yanlış — kullanıcının hamlesini tahtada GÖSTER, sonra revert et
            const tempChess = new Chess(chess.fen())
            try {
                const parsed = uciToMove(uci)
                tempChess.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion })
                set({
                    status: 'showing_wrong',
                    fen: tempChess.fen(),
                    lastWrongUci: uci,
                    expectedUci,
                })
            } catch {
                // illegal — silent fail
                return 'incorrect'
            }
            handleIncorrect(puzzle)
            return 'incorrect'
        }

        // Doğru — solver hamlesini uygula
        const solverMove = uciToMove(expectedUci)
        try {
            chess.move({ from: solverMove.from, to: solverMove.to, promotion: solverMove.promotion })
        } catch {
            return 'incorrect'
        }

        // Rakip cevabını uygula
        const opponentIdx = expectedIdx + 1
        const opponentUci = puzzle.movesUci[opponentIdx]
        if (opponentUci) {
            const oppMove = uciToMove(opponentUci)
            try {
                chess.move({ from: oppMove.from, to: oppMove.to, promotion: oppMove.promotion })
            } catch { /* ignore */ }
        }

        const newIdx = moveIndex + 1
        const isFinished = (newIdx * 2) >= puzzle.movesUci.length
        const nextExpected = puzzle.movesUci[newIdx * 2] ?? null

        set({
            chess,
            fen: chess.fen(),
            moveIndex: newIdx,
            expectedUci: nextExpected,
            lastWrongUci: null,
            status: isFinished ? 'solved' : 'partial',
        })

        if (isFinished) {
            handleCorrect(puzzle)
            set((s) => ({ sessionSolved: s.sessionSolved + 1 }))
            return 'solved'
        }
        // Multi-move puzzle — kısa bir gecikme sonra tekrar 'active'
        setTimeout(() => {
            if (get().status === 'partial') set({ status: 'active' })
        }, 600)
        return 'correct'
    },

    confirmFailed: () => {
        const { puzzle, chess } = get()
        if (!puzzle) return
        // Tahtayı oynamadan önceki pozisyona geri al (yani solver pozisyonu)
        set((s) => ({
            status: 'failed',
            fen: chess.fen(), // chess state'i değişmedi, sadece display revert
            sessionFailed: s.sessionFailed + 1,
        }))
    },

    showSolution: () => {
        const { puzzle, chess, moveIndex } = get()
        if (!puzzle) return
        // Geri kalan solver hamlelerini sırayla oyna (her birinde opponent reply de)
        const replay = new Chess(chess.fen())
        for (let i = moveIndex * 2; i < puzzle.movesUci.length; i++) {
            const m = uciToMove(puzzle.movesUci[i])
            try { replay.move({ from: m.from, to: m.to, promotion: m.promotion }) } catch { break }
        }
        set({
            status: 'showing_solution',
            chess: replay,
            fen: replay.fen(),
            lastWrongUci: null,
        })
    },

    useHint: () => set((s) => ({ hintLevel: Math.min(3, s.hintLevel + 1) })),

    reset: () => set({
        status: 'idle',
        puzzle: null,
        chess: new Chess(),
        fen: new Chess().fen(),
        moveIndex: 0,
        hintLevel: 0,
        lastWrongUci: null,
        expectedUci: null,
        solverMoveCount: 0,
    }),
}))

function uciMatchesIgnoringCase(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase()
}

async function handleCorrect(puzzle: Puzzle) {
    const profile = useProfileStore.getState()
    const newElo = newPuzzleRating(profile.puzzleElo, puzzle.rating, true)
    try {
        await db.puzzles.update(puzzle.id, {
            solvedAt: Date.now(),
            attempts: puzzle.attempts + 1,
            succeeded: true,
        })
    } catch { /* offline */ }
    profile.applyPuzzleResult({ succeeded: true, newPuzzleElo: newElo })
}

async function handleIncorrect(puzzle: Puzzle) {
    const profile = useProfileStore.getState()
    const newElo = newPuzzleRating(profile.puzzleElo, puzzle.rating, false)
    try {
        await db.puzzles.update(puzzle.id, {
            attempts: puzzle.attempts + 1,
            succeeded: false,
        })
    } catch { /* offline */ }
    profile.applyPuzzleResult({ succeeded: false, newPuzzleElo: newElo })
}
