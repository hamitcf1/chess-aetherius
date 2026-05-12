import { useEffect, useState } from 'react'
import { useStockfish } from './useStockfish'
import type { EngineEval } from '@/types/chess'

/**
 * Mevcut pozisyonu paylaşılan Stockfish ile analiz eder.
 * Engine başka bir search yapıyorsa atlar (AI hamlesi öncelikli).
 * Sadece kullanıcı sırasındayken çalışmasını istiyorsan `enabled` ile kapat.
 */
export function useLiveAnalysis(fen: string | null, opts: { enabled?: boolean; depth?: number; movetimeMs?: number } = {}) {
    const enabled = opts.enabled ?? true
    const depth = opts.depth ?? 14
    const movetimeMs = opts.movetimeMs ?? 350

    const { search, ready, thinking } = useStockfish()
    const [evalResult, setEvalResult] = useState<EngineEval | null>(null)

    useEffect(() => {
        if (!enabled || !fen || !ready) return
        // Don't run live eval while engine is busy (AI is thinking) — it would
        // interrupt the AI's search and cause weird behavior.
        if (thinking) return

        let cancelled = false
        const id = setTimeout(() => {
            if (cancelled) return
            search({ fen, depth, movetimeMs }).then(r => {
                if (cancelled || !r) return
                setEvalResult(r.eval)
            }).catch(() => {})
        }, 50) // small debounce so rapid fen changes don't pile up
        return () => { cancelled = true; clearTimeout(id) }
    }, [fen, depth, movetimeMs, enabled, ready, thinking, search])

    return evalResult
}
