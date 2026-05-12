import { create } from 'zustand'
import { Chess } from 'chess.js'
import { db, pickPuzzleForRating } from '@/lib/db'
import { newPuzzleRating } from '@/lib/elo'
import { uciToMove } from '@/lib/pgn'
import { useProfileStore } from './profileStore'
import type { Puzzle } from '@/types/chess'

export type PuzzleStatus = 'idle' | 'active' | 'solved' | 'failed'

interface PuzzleState {
    status: PuzzleStatus
    puzzle: Puzzle | null
    chess: Chess
    fen: string
    moveIndex: number              // how many solution moves played correctly
    hintLevel: number              // 0-3
    showingSolution: boolean
    sessionSolved: number
    sessionFailed: number
}

interface PuzzleActions {
    loadNext: () => Promise<void>
    attemptMove: (uci: string) => 'correct' | 'incorrect' | 'solved'
    useHint: () => void
    showSolution: () => void
    reset: () => void
}

type PuzzleStore = PuzzleState & PuzzleActions

export const usePuzzleStore = create<PuzzleStore>((set, get) => ({
    status: 'idle',
    puzzle: null,
    chess: new Chess(),
    fen: new Chess().fen(),
    moveIndex: 0,
    hintLevel: 0,
    showingSolution: false,
    sessionSolved: 0,
    sessionFailed: 0,

    loadNext: async () => {
        const profile = useProfileStore.getState()
        const puzzle = await pickPuzzleForRating(profile.puzzleElo)
        if (!puzzle) {
            set({ status: 'idle', puzzle: null })
            return
        }
        // Convention: FEN is the position to solve directly (no setup move).
        // movesUci[0] = solver's first move, [1] = opponent reply, [2] = solver's 2nd, ...
        const chess = new Chess(puzzle.fen)
        set({
            status: 'active',
            puzzle,
            chess,
            fen: chess.fen(),
            moveIndex: 0,
            hintLevel: 0,
            showingSolution: false,
        })
    },

    attemptMove: (uci) => {
        const { puzzle, chess, moveIndex } = get()
        if (!puzzle || get().status !== 'active') return 'incorrect'

        const expectedIdx = moveIndex * 2          // 0, 2, 4, ...
        const expectedUci = puzzle.movesUci[expectedIdx]
        if (!expectedUci) return 'incorrect'

        if (!uciMatchesIgnoringCase(uci, expectedUci)) {
            handleIncorrect(puzzle)
            set((s) => ({ status: 'failed', sessionFailed: s.sessionFailed + 1 }))
            return 'incorrect'
        }

        const solverMove = uciToMove(expectedUci)
        try {
            chess.move({ from: solverMove.from, to: solverMove.to, promotion: solverMove.promotion })
        } catch {
            return 'incorrect'
        }

        // Apply opponent's reply if puzzle continues
        const opponentIdx = expectedIdx + 1
        const opponentUci = puzzle.movesUci[opponentIdx]
        if (opponentUci) {
            const oppMove = uciToMove(opponentUci)
            try {
                chess.move({ from: oppMove.from, to: oppMove.to, promotion: oppMove.promotion })
            } catch {
                // ignore — opponent move may be missing in mate-in-1 puzzles
            }
        }

        const newIdx = moveIndex + 1
        const isFinished = (newIdx * 2) >= puzzle.movesUci.length

        set({
            chess,
            fen: chess.fen(),
            moveIndex: newIdx,
        })

        if (isFinished) {
            handleCorrect(puzzle)
            set((s) => ({ status: 'solved', sessionSolved: s.sessionSolved + 1 }))
            return 'solved'
        }
        return 'correct'
    },

    useHint: () => set((s) => ({ hintLevel: Math.min(3, s.hintLevel + 1) })),

    showSolution: () => set({ showingSolution: true }),

    reset: () => set({
        status: 'idle',
        puzzle: null,
        chess: new Chess(),
        fen: new Chess().fen(),
        moveIndex: 0,
        hintLevel: 0,
        showingSolution: false,
    }),
}))

function uciMatchesIgnoringCase(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase()
}

async function handleCorrect(puzzle: Puzzle) {
    const profile = useProfileStore.getState()
    const newElo = newPuzzleRating(profile.puzzleElo, puzzle.rating, true)
    await db.puzzles.update(puzzle.id, {
        solvedAt: Date.now(),
        attempts: puzzle.attempts + 1,
        succeeded: true,
    })
    profile.applyPuzzleResult({ succeeded: true, newPuzzleElo: newElo })
}

async function handleIncorrect(puzzle: Puzzle) {
    const profile = useProfileStore.getState()
    const newElo = newPuzzleRating(profile.puzzleElo, puzzle.rating, false)
    await db.puzzles.update(puzzle.id, {
        attempts: puzzle.attempts + 1,
        succeeded: false,
    })
    profile.applyPuzzleResult({ succeeded: false, newPuzzleElo: newElo })
}
