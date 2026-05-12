import { motion, AnimatePresence } from 'framer-motion'
import { Chess } from 'chess.js'
import type { Color, MoveRecord } from '@/types/chess'
import { cn } from '@/lib/utils'

interface CapturedPiecesProps {
    moves: MoveRecord[]
    /** Hangi rengin "yediği" taşlar gösterilecek. 'w' = beyazın yediği taşlar (yani siyah taşlar) */
    capturedBy: Color
    className?: string
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const PIECE_SYMBOLS: Record<string, { w: string; b: string }> = {
    p: { w: '♙', b: '♟' },
    n: { w: '♘', b: '♞' },
    b: { w: '♗', b: '♝' },
    r: { w: '♖', b: '♜' },
    q: { w: '♕', b: '♛' },
}

const ORDER = ['q', 'r', 'b', 'n', 'p']

/**
 * Yenilen taşları + material avantajını gösterir.
 * `capturedBy='w'` → beyazın yediği siyah taşlar
 */
export function CapturedPieces({ moves, capturedBy, className }: CapturedPiecesProps) {
    const { pieces, advantage } = computeCaptured(moves)
    const opponentColor: Color = capturedBy === 'w' ? 'b' : 'w'
    // capturedBy renginin yediği taşlar = pieces[capturedBy] (yedi taşlar)
    // bu taşlar opponentColor renginde
    const ownCaptured = pieces[capturedBy]
    const myAdvantage = capturedBy === 'w' ? advantage : -advantage

    return (
        <div className={cn('flex items-center gap-0.5 min-h-[20px]', className)}>
            <AnimatePresence>
                {ORDER.flatMap(type => {
                    const count = ownCaptured.filter(p => p === type).length
                    return Array.from({ length: count }).map((_, i) => (
                        <motion.span
                            key={`${type}-${i}`}
                            initial={{ scale: 0, x: 8, opacity: 0 }}
                            animate={{ scale: 1, x: 0, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-base leading-none select-none"
                            style={{ color: opponentColor === 'w' ? '#f5f5f5' : '#0a0a0a', WebkitTextStroke: opponentColor === 'b' ? '0.5px #555' : '0.5px #ddd' }}
                        >
                            {PIECE_SYMBOLS[type]?.[opponentColor]}
                        </motion.span>
                    ))
                })}
            </AnimatePresence>
            {myAdvantage > 0 && (
                <span className="ml-1 text-xs font-mono font-bold text-success tabular-nums">
                    +{myAdvantage}
                </span>
            )}
        </div>
    )
}

function computeCaptured(moves: MoveRecord[]): { pieces: Record<Color, string[]>; advantage: number } {
    const captured: Record<Color, string[]> = { w: [], b: [] }
    const chess = new Chess()
    for (const m of moves) {
        const moveDetail = chess.move({
            from: m.uci.slice(0, 2),
            to: m.uci.slice(2, 4),
            promotion: m.uci.length > 4 ? m.uci[4] : undefined,
        })
        if (moveDetail?.captured) {
            // captured piece type is in moveDetail.captured (lowercase letter)
            // The capturer's color is moveDetail.color
            captured[moveDetail.color].push(moveDetail.captured)
        }
    }
    // Material advantage from white's perspective
    const whiteValue = captured.w.reduce((s, p) => s + (PIECE_VALUES[p] ?? 0), 0)
    const blackValue = captured.b.reduce((s, p) => s + (PIECE_VALUES[p] ?? 0), 0)
    return { pieces: captured, advantage: whiteValue - blackValue }
}
