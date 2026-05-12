import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface EvalBarProps {
    cp?: number
    mate?: number
    orientation?: 'white' | 'black'
    className?: string
    showLabel?: boolean
}

/**
 * Vertical evaluation bar. Positive cp = white advantage.
 * Maps centipawns to bar height with a tanh-like compression so
 * +-300cp roughly maps to ~75%/25% and infinity caps at 95%/5%.
 */
export function EvalBar({ cp, mate, orientation = 'white', className, showLabel = true }: EvalBarProps) {
    const { whitePct, label, isWhiteFav } = computeEval(cp, mate)
    const blackPct = 100 - whitePct
    const flipped = orientation === 'black'

    return (
        <div className={cn('relative h-full w-6 rounded-md overflow-hidden bg-zinc-800 border border-border', className)}>
            <motion.div
                className="absolute bottom-0 left-0 right-0 bg-white"
                animate={{ height: `${flipped ? blackPct : whitePct}%` }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            />
            <motion.div
                className="absolute top-0 left-0 right-0 bg-zinc-900"
                animate={{ height: `${flipped ? whitePct : blackPct}%` }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            />
            {showLabel && (
                <div
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 px-0.5 text-[10px] font-bold tabular-nums select-none',
                        isWhiteFav ? 'bottom-1 text-zinc-800' : 'top-1 text-white'
                    )}
                >
                    {label}
                </div>
            )}
        </div>
    )
}

function computeEval(cp?: number, mate?: number): { whitePct: number; label: string; isWhiteFav: boolean } {
    if (mate !== undefined && mate !== 0) {
        const whiteWins = mate > 0
        return {
            whitePct: whiteWins ? 99 : 1,
            label: `M${Math.abs(mate)}`,
            isWhiteFav: whiteWins,
        }
    }
    const cpVal = cp ?? 0
    // tanh-style scaling: cp/400 → strongly compressed
    const scaled = Math.tanh(cpVal / 400)
    const whitePct = Math.max(3, Math.min(97, 50 + scaled * 47))
    const display = (cpVal / 100).toFixed(1)
    const label = cpVal >= 0 ? `+${display}` : display
    return { whitePct, label, isWhiteFav: cpVal >= 0 }
}
