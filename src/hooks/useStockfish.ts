import { useEffect, useRef, useState, useCallback } from 'react'
import { StockfishEngine, type SearchOptions, type SearchResult } from '@/lib/stockfish'
import type { EngineEval } from '@/types/chess'

let sharedEngine: StockfishEngine | null = null

/**
 * Singleton accessor — share one Stockfish worker across the app.
 * Caller can opt out and have their own engine if needed.
 */
function getSharedEngine(): StockfishEngine {
    if (!sharedEngine) {
        sharedEngine = new StockfishEngine()
        // fire and forget; consumers will await waitReady() before use
        sharedEngine.init().catch(err => console.error('Stockfish init failed:', err))
    }
    return sharedEngine
}

export function useStockfish() {
    const engineRef = useRef<StockfishEngine | null>(null)
    const [ready, setReady] = useState(false)
    const [thinking, setThinking] = useState(false)
    const [liveEval, setLiveEval] = useState<EngineEval | null>(null)

    useEffect(() => {
        const engine = getSharedEngine()
        engineRef.current = engine
        let cancelled = false
        engine.waitReady().then(() => {
            if (!cancelled) setReady(true)
        }).catch(err => console.error('Stockfish ready failed:', err))
        return () => {
            cancelled = true
            // Do not destroy shared engine on unmount
        }
    }, [])

    const search = useCallback(async (opts: SearchOptions): Promise<SearchResult | null> => {
        const engine = engineRef.current
        if (!engine) return null
        setThinking(true)
        setLiveEval(null)
        try {
            const result = await engine.search(opts, ev => setLiveEval(ev))
            setLiveEval(result.eval)
            return result
        } catch (e) {
            console.error('Stockfish search error:', e)
            return null
        } finally {
            setThinking(false)
        }
    }, [])

    const stop = useCallback(() => {
        engineRef.current?.stop()
    }, [])

    return { ready, thinking, liveEval, search, stop }
}
