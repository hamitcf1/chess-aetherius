import { Chess } from 'chess.js'
import type { Game, MoveClassification, MoveRecord } from '@/types/chess'
import { StockfishEngine } from './stockfish'
import { db } from './db'

/**
 * Bir oyunun her hamlesini Stockfish ile değerlendirir ve classify eder.
 * - Hamleden ÖNCEKİ pozisyonu eval eder → bestmove + bestCp
 * - Hamleden SONRAKİ pozisyonu eval eder → playedCp (perspektif çevirilir)
 * - cpLoss = bestCp - playedCp (oynayan oyuncunun perspektifinden)
 * - cpLoss'a göre classify
 *
 * Sonuçları DB'ye kaydeder ve güncellenmiş hamleleri döner.
 */
export async function analyzeGame(
    game: Game,
    engine: StockfishEngine,
    opts: { depth?: number; movetimeMs?: number; onProgress?: (done: number, total: number) => void } = {}
): Promise<MoveRecord[]> {
    const depth = opts.depth ?? 12
    const movetimeMs = opts.movetimeMs ?? 200

    const chess = new Chess(game.startFen)
    const analyzed: MoveRecord[] = []
    const total = game.moves.length

    for (let i = 0; i < total; i++) {
        const move = game.moves[i]
        const fenBefore = chess.fen()
        const moverIsWhite = chess.turn() === 'w'

        // 1. Best move at this position
        let bestEval = { cp: 0, depth: 0, bestUci: '', pv: [] as string[] }
        try {
            const r = await engine.search({ fen: fenBefore, depth, movetimeMs })
            bestEval = {
                cp: r.eval.cp ?? (r.eval.mate ? (r.eval.mate > 0 ? 10000 : -10000) : 0),
                depth: r.eval.depth,
                bestUci: r.bestmove,
                pv: r.pvUci,
            }
        } catch (e) {
            console.warn('Best eval failed for move', i, e)
        }

        // 2. Apply the played move
        try {
            chess.move({
                from: move.uci.slice(0, 2),
                to: move.uci.slice(2, 4),
                promotion: move.uci.length > 4 ? move.uci[4] : undefined,
            })
        } catch (e) {
            console.warn('Illegal move during analysis', move.uci, e)
            analyzed.push(move)
            continue
        }

        // 3. Eval after played move (from opponent's perspective) → flip to mover's
        let playedCp = 0
        try {
            const r = await engine.search({ fen: chess.fen(), depth, movetimeMs })
            const oppCp = r.eval.cp ?? (r.eval.mate ? (r.eval.mate > 0 ? 10000 : -10000) : 0)
            playedCp = -oppCp  // Now from mover's perspective
        } catch (e) {
            console.warn('Played eval failed for move', i, e)
        }

        // 4. Classify (from mover's perspective; positive = mover advantage)
        const moverBestCp = moverIsWhite ? bestEval.cp : -bestEval.cp
        const moverPlayedCp = moverIsWhite ? playedCp : -playedCp
        const loss = moverBestCp - moverPlayedCp
        const classification = classifyByCpLoss(loss, moverBestCp, moverPlayedCp)

        analyzed.push({
            ...move,
            eval: {
                cp: playedCp,
                depth: bestEval.depth,
                bestUci: bestEval.bestUci,
                pv: bestEval.pv,
            },
            classification,
        })

        opts.onProgress?.(i + 1, total)
    }

    // Update game in DB with analyzed moves
    try {
        await db.games.update(game.id, { moves: analyzed })
    } catch (e) {
        console.warn('Failed to save analyzed game:', e)
    }

    return analyzed
}

function classifyByCpLoss(loss: number, bestCp: number, playedCp: number): MoveClassification {
    // Mate threshold special cases
    if (bestCp >= 9000 && playedCp < 9000) return 'mistake'
    if (bestCp >= 9000 && playedCp >= 9000) return 'good'
    if (loss <= 15) return 'best'
    if (loss <= 35) return 'great'
    if (loss <= 90) return 'good'
    if (loss <= 180) return 'inaccuracy'
    if (loss <= 350) return 'mistake'
    return 'blunder'
}

export function classificationSummary(moves: MoveRecord[], userColor: 'w' | 'b'): {
    best: number; great: number; good: number; inaccuracy: number; mistake: number; blunder: number; total: number
} {
    const counts = { best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, total: 0 }
    moves.forEach((m, i) => {
        const isUser = (userColor === 'w' && i % 2 === 0) || (userColor === 'b' && i % 2 === 1)
        if (!isUser || !m.classification) return
        counts[m.classification]++
        counts.total++
    })
    return counts
}
