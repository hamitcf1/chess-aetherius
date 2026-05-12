import { create } from 'zustand'
import { Chess } from 'chess.js'
import type { Color, Game, MoveRecord, Result, Termination } from '@/types/chess'
import { db } from '@/lib/db'
import { detectTermination, makeFreshGame, buildPgn, toMoveRecord, uciToMove, scoreForColor } from '@/lib/pgn'
import { newRating } from '@/lib/elo'
import { useProfileStore } from './profileStore'

export type GameStatus = 'idle' | 'playing' | 'finished'

export interface TimeControl {
    initialMs: number      // başlangıç süresi (ör: 5*60*1000 = 5 dakika)
    incrementMs: number    // her hamleden sonra eklenen (ör: 3*1000 = 3 sn)
    label: string
}

export const TIME_CONTROLS: TimeControl[] = [
    { initialMs: 60 * 1000, incrementMs: 0, label: '1+0' },
    { initialMs: 3 * 60 * 1000, incrementMs: 0, label: '3+0' },
    { initialMs: 3 * 60 * 1000, incrementMs: 2 * 1000, label: '3+2' },
    { initialMs: 5 * 60 * 1000, incrementMs: 0, label: '5+0' },
    { initialMs: 5 * 60 * 1000, incrementMs: 3 * 1000, label: '5+3' },
    { initialMs: 10 * 60 * 1000, incrementMs: 0, label: '10+0' },
    { initialMs: 10 * 60 * 1000, incrementMs: 5 * 1000, label: '10+5' },
    { initialMs: 15 * 60 * 1000, incrementMs: 10 * 1000, label: '15+10' },
    { initialMs: 30 * 60 * 1000, incrementMs: 0, label: '30+0' },
    { initialMs: Infinity, incrementMs: 0, label: 'Süresiz' },
]

export interface ClockState {
    whiteMs: number
    blackMs: number
    lastTickAt: number
    activeColor: Color | null  // hangi rengin saati işliyor; null = duraklı
    timeControl: TimeControl
}

interface GameState {
    status: GameStatus
    game: Game | null
    chess: Chess
    fen: string
    lastMoveUci: string | null
    turn: Color
    inCheck: boolean
    legalDestsMap: Map<string, string[]>
    startedAtMs: number
    pendingPromotion: { from: string; to: string } | null
    clock: ClockState | null
}

interface GameActions {
    newGame: (opts: { userColor: Color; aiElo: number; username: string; timeControl?: TimeControl }) => void
    resumeGame: (game: Game, chess: Chess) => void
    makeMove: (uci: string) => MoveRecord | null
    handlePromotion: (piece: 'q' | 'r' | 'b' | 'n') => MoveRecord | null
    cancelPromotion: () => void
    resign: () => Promise<Game | null>
    finalize: (result: Result, termination: Termination) => Promise<Game | null>
    reset: () => void
    setLegalDests: () => void
    tickClock: () => void
    /** Son hamle çiftini geri al (kullanıcı + AI'ın hamlesi). Sadece kullanıcı sırasındayken kullanılır. */
    takeBack: () => boolean
}

type GameStore = GameState & GameActions

function buildLegalDests(chess: Chess): Map<string, string[]> {
    const dests = new Map<string, string[]>()
    for (const m of chess.moves({ verbose: true })) {
        const arr = dests.get(m.from) ?? []
        arr.push(m.to)
        dests.set(m.from, arr)
    }
    return dests
}

export const useGameStore = create<GameStore>((set, get) => {
    const initChess = new Chess()

    return {
        status: 'idle',
        game: null,
        chess: initChess,
        fen: initChess.fen(),
        lastMoveUci: null,
        turn: 'w',
        inCheck: false,
        legalDestsMap: buildLegalDests(initChess),
        startedAtMs: Date.now(),
        pendingPromotion: null,
        clock: null,

        setLegalDests: () => {
            const { chess } = get()
            set({ legalDestsMap: buildLegalDests(chess) })
        },

        newGame: ({ userColor, aiElo, username, timeControl }) => {
            const chess = new Chess()
            const profile = useProfileStore.getState()
            const game = makeFreshGame({
                userColor,
                username,
                aiElo,
                userEloBefore: profile.elo,
            })
            const tc = timeControl ?? TIME_CONTROLS[5] // default 10+0
            const clock: ClockState | null = tc.initialMs === Infinity ? null : {
                whiteMs: tc.initialMs,
                blackMs: tc.initialMs,
                lastTickAt: Date.now(),
                activeColor: 'w',
                timeControl: tc,
            }
            set({
                status: 'playing',
                game,
                chess,
                fen: chess.fen(),
                lastMoveUci: null,
                turn: 'w',
                inCheck: false,
                legalDestsMap: buildLegalDests(chess),
                startedAtMs: Date.now(),
                pendingPromotion: null,
                clock,
            })
        },

        resumeGame: (game, chess) => {
            set({
                status: 'playing',
                game,
                chess,
                fen: chess.fen(),
                lastMoveUci: game.moves.at(-1)?.uci ?? null,
                turn: chess.turn(),
                inCheck: chess.inCheck(),
                legalDestsMap: buildLegalDests(chess),
                startedAtMs: Date.now(),
                pendingPromotion: null,
            })
        },

        makeMove: (uci) => {
            const { chess, game } = get()
            if (!game || get().status !== 'playing') return null

            const parsed = uciToMove(uci)
            // Need promotion?
            const piece = chess.get(parsed.from as any)
            const isPawn = piece?.type === 'p'
            const targetRank = parsed.to[1]
            const isPromotion = isPawn && (targetRank === '1' || targetRank === '8')

            if (isPromotion && !parsed.promotion) {
                set({ pendingPromotion: { from: parsed.from, to: parsed.to } })
                return null
            }

            let move: any
            try {
                move = chess.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion })
            } catch {
                return null
            }
            if (!move) return null

            const record = toMoveRecord(chess, move)
            const updatedGame: Game = {
                ...game,
                moves: [...game.moves, record],
                pgn: buildPgn({ ...game, moves: [...game.moves, record] }),
            }

            // Saat hesabı: hamleyi yapan oyuncuya increment ekle, sıra rakibe geçer
            const prevClock = get().clock
            let nextClock: ClockState | null = null
            if (prevClock) {
                const now = Date.now()
                const elapsed = Math.max(0, now - prevClock.lastTickAt)
                const incrementMs = prevClock.timeControl.incrementMs
                const moverWasWhite = game.moves.length % 2 === 0 // before this move
                const newWhiteMs = moverWasWhite ? Math.max(0, prevClock.whiteMs - elapsed) + incrementMs : prevClock.whiteMs
                const newBlackMs = !moverWasWhite ? Math.max(0, prevClock.blackMs - elapsed) + incrementMs : prevClock.blackMs
                nextClock = {
                    ...prevClock,
                    whiteMs: newWhiteMs,
                    blackMs: newBlackMs,
                    lastTickAt: now,
                    activeColor: chess.turn(),
                }
            }

            set({
                game: updatedGame,
                fen: chess.fen(),
                lastMoveUci: record.uci,
                turn: chess.turn(),
                inCheck: chess.inCheck(),
                legalDestsMap: buildLegalDests(chess),
                pendingPromotion: null,
                clock: nextClock,
            })

            // Check termination
            const { result, termination } = detectTermination(chess)
            if (result !== '*') {
                // Fire and forget finalize; caller will see status change via subscription
                queueMicrotask(() => get().finalize(result, termination))
            }

            return record
        },

        handlePromotion: (piece) => {
            const pending = get().pendingPromotion
            if (!pending) return null
            return get().makeMove(pending.from + pending.to + piece)
        },

        cancelPromotion: () => set({ pendingPromotion: null }),

        /**
         * Periyodik saat işleyici (UI'dan çağrılır). Aktif oyuncunun süresinden
         * geçen zamanı düşürür. 0'a inerse oyun timeout ile biter.
         */
        tickClock: () => {
            const { clock, status, game } = get()
            if (!clock || !game || status !== 'playing') return
            const now = Date.now()
            const elapsed = now - clock.lastTickAt
            if (elapsed <= 0) return

            const activeIsWhite = clock.activeColor === 'w'
            const currentMs = activeIsWhite ? clock.whiteMs : clock.blackMs
            const remaining = currentMs - elapsed

            if (remaining <= 0) {
                // Süre doldu — oyun biter
                const winner: Color = activeIsWhite ? 'b' : 'w'
                const result: Result = winner === 'w' ? '1-0' : '0-1'
                set({
                    clock: {
                        ...clock,
                        whiteMs: activeIsWhite ? 0 : clock.whiteMs,
                        blackMs: !activeIsWhite ? 0 : clock.blackMs,
                        lastTickAt: now,
                    },
                })
                queueMicrotask(() => get().finalize(result, 'timeout'))
                return
            }

            set({
                clock: {
                    ...clock,
                    whiteMs: activeIsWhite ? remaining : clock.whiteMs,
                    blackMs: !activeIsWhite ? remaining : clock.blackMs,
                    lastTickAt: now,
                },
            })
        },

        resign: async () => {
            const { game } = get()
            if (!game) return null
            const result: Result = game.userColor === 'w' ? '0-1' : '1-0'
            return get().finalize(result, 'resignation')
        },

        finalize: async (result, termination) => {
            const { game, startedAtMs } = get()
            if (!game) return null

            const profile = useProfileStore.getState()
            const score = scoreForColor(result, game.userColor)
            const aiElo = game.aiElo ?? profile.elo
            const newElo = newRating(game.userEloBefore, aiElo, score)

            const finalGame: Game = {
                ...game,
                result,
                termination,
                endedAt: Date.now(),
                userEloAfter: newElo,
                pgn: buildPgn({ ...game, result, termination }),
            }

            try {
                await db.games.put(finalGame)
            } catch (e) {
                console.error('Failed to save game:', e)
            }

            profile.applyGameResult({
                score,
                newElo,
                playTimeMs: Date.now() - startedAtMs,
                opening: finalGame.opening?.name,
            })

            set({ status: 'finished', game: finalGame })
            return finalGame
        },

        reset: () => {
            const chess = new Chess()
            set({
                status: 'idle',
                game: null,
                chess,
                fen: chess.fen(),
                lastMoveUci: null,
                turn: 'w',
                inCheck: false,
                legalDestsMap: buildLegalDests(chess),
                pendingPromotion: null,
                clock: null,
            })
        },

        takeBack: () => {
            const { chess, game, status, turn } = get()
            if (!game || status !== 'playing') return false
            // Sadece kullanıcı sırasındayken al, en az 2 hamle olmalı (kullanıcı + AI)
            if (turn !== game.userColor) return false
            if (game.moves.length < 2) return false
            // İki hamle geri al: AI'ın son cevabı + kullanıcının ondan önceki hamlesi
            const undoCount = 2
            for (let i = 0; i < undoCount; i++) chess.undo()
            const newMoves = game.moves.slice(0, -undoCount)
            const updatedGame: Game = {
                ...game,
                moves: newMoves,
                pgn: buildPgn({ ...game, moves: newMoves }),
            }
            set({
                game: updatedGame,
                chess,
                fen: chess.fen(),
                lastMoveUci: newMoves.at(-1)?.uci ?? null,
                turn: chess.turn(),
                inCheck: chess.inCheck(),
                legalDestsMap: buildLegalDests(chess),
                pendingPromotion: null,
            })
            return true
        },
    }
})
