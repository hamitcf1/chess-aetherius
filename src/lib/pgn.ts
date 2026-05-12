import { Chess } from 'chess.js'
import type { Color, Game, MoveRecord, Result, Termination } from '@/types/chess'
import { uid } from './utils'

export function makeFreshGame(opts: {
    userColor: Color
    username: string
    aiElo: number
    userEloBefore: number
    startFen?: string
}): Game {
    return {
        id: uid(),
        createdAt: Date.now(),
        whiteName: opts.userColor === 'w' ? opts.username : `Satranç AI ${opts.aiElo}`,
        blackName: opts.userColor === 'b' ? opts.username : `Satranç AI ${opts.aiElo}`,
        userColor: opts.userColor,
        aiElo: opts.aiElo,
        result: '*',
        termination: 'ongoing',
        pgn: '',
        moves: [],
        startFen: opts.startFen,
        userEloBefore: opts.userEloBefore,
        userEloAfter: opts.userEloBefore,
    }
}

export function detectTermination(chess: Chess): { result: Result; termination: Termination } {
    if (chess.isCheckmate()) {
        const winnerIsWhite = chess.turn() === 'b'
        return { result: winnerIsWhite ? '1-0' : '0-1', termination: 'checkmate' }
    }
    if (chess.isStalemate()) return { result: '1/2-1/2', termination: 'stalemate' }
    if (chess.isThreefoldRepetition()) return { result: '1/2-1/2', termination: 'threefold' }
    if (chess.isInsufficientMaterial()) return { result: '1/2-1/2', termination: 'insufficient_material' }
    if (chess.isDraw()) return { result: '1/2-1/2', termination: 'fifty_move' }
    return { result: '*', termination: 'ongoing' }
}

export function scoreForColor(result: Result, color: Color): 1 | 0.5 | 0 {
    if (result === '1/2-1/2') return 0.5
    if (result === '1-0') return color === 'w' ? 1 : 0
    if (result === '0-1') return color === 'b' ? 1 : 0
    return 0.5
}

export function toMoveRecord(chess: Chess, lastMove: ReturnType<Chess['move']>): MoveRecord {
    const ply = chess.history().length
    return {
        ply,
        san: lastMove.san,
        uci: lastMove.from + lastMove.to + (lastMove.promotion ?? ''),
        fenAfter: chess.fen(),
    }
}

export function loadPgn(pgn: string): { chess: Chess; ok: boolean } {
    const chess = new Chess()
    try {
        chess.loadPgn(pgn)
        return { chess, ok: true }
    } catch {
        return { chess, ok: false }
    }
}

export function uciToMove(uci: string): { from: string; to: string; promotion?: string } {
    return {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci.slice(4) : undefined,
    }
}

/** Build a PGN with proper headers from a Game record. */
export function buildPgn(game: Game): string {
    const date = new Date(game.createdAt).toISOString().slice(0, 10).replace(/-/g, '.')
    const headers = [
        `[Event "Satranç ${game.aiElo ? `vs AI ${game.aiElo}` : ''}"]`,
        `[Site "Satranç App"]`,
        `[Date "${date}"]`,
        `[White "${game.whiteName}"]`,
        `[Black "${game.blackName}"]`,
        `[Result "${game.result}"]`,
    ]
    if (game.startFen) headers.push(`[FEN "${game.startFen}"]`)

    const movesText = game.moves
        .map((m, i) => {
            const moveNum = Math.ceil((i + 1) / 2)
            const prefix = i % 2 === 0 ? `${moveNum}. ` : ''
            return `${prefix}${m.san}`
        })
        .join(' ')

    return `${headers.join('\n')}\n\n${movesText} ${game.result}`
}
