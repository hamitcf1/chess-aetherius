import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { MoveRecord, MoveClassification } from '@/types/chess'

interface MoveListProps {
    moves: MoveRecord[]
    selectedPly?: number
    onSelectMove?: (ply: number) => void
    className?: string
}

const CLASSIFY_BADGE: Record<MoveClassification, { sym: string; color: string }> = {
    best: { sym: '★', color: 'text-cyan-400' },
    great: { sym: '!', color: 'text-emerald-400' },
    good: { sym: '✓', color: 'text-emerald-500/70' },
    inaccuracy: { sym: '?!', color: 'text-amber-400' },
    mistake: { sym: '?', color: 'text-orange-500' },
    blunder: { sym: '??', color: 'text-rose-500' },
}

export function MoveList({ moves, selectedPly, onSelectMove, className }: MoveListProps) {
    const ref = useRef<HTMLDivElement>(null)

    // Auto-scroll inner container to keep latest move visible — but only if user
    // is already near the bottom (don't yank if they're reviewing earlier moves)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distanceFromBottom < 80) {
            // Use nearest container scroll, NOT scrollIntoView (which scrolls the page)
            el.scrollTop = el.scrollHeight
        }
    }, [moves.length])

    const pairs: { num: number; white?: MoveRecord; black?: MoveRecord }[] = []
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            num: Math.floor(i / 2) + 1,
            white: moves[i],
            black: moves[i + 1],
        })
    }

    return (
        <div ref={ref} className={cn('h-full overflow-y-auto', className)}>
            <div className="p-2 space-y-1">
                {pairs.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Henüz hamle yok
                    </div>
                )}
                {pairs.map((p) => (
                    <div key={p.num} className="grid grid-cols-[2.5rem_1fr_1fr] gap-1 text-sm items-center">
                        <span className="text-muted-foreground tabular-nums text-xs pr-1 text-right">{p.num}.</span>
                        {p.white && (
                            <MoveCell
                                move={p.white}
                                selected={selectedPly === p.white.ply}
                                onClick={() => onSelectMove?.(p.white!.ply)}
                            />
                        )}
                        {!p.white && <span />}
                        {p.black && (
                            <MoveCell
                                move={p.black}
                                selected={selectedPly === p.black.ply}
                                onClick={() => onSelectMove?.(p.black!.ply)}
                            />
                        )}
                        {!p.black && <span />}
                    </div>
                ))}
            </div>
        </div>
    )
}

function MoveCell({ move, selected, onClick }: { move: MoveRecord; selected?: boolean; onClick?: () => void }) {
    const badge = move.classification ? CLASSIFY_BADGE[move.classification] : null
    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded px-2 py-1 text-left font-medium tabular-nums hover:bg-accent/15 transition-colors flex items-center gap-1',
                selected && 'bg-primary/20 text-primary'
            )}
        >
            <span>{move.san}</span>
            {badge && <span className={cn('text-[10px] font-bold', badge.color)}>{badge.sym}</span>}
        </button>
    )
}
