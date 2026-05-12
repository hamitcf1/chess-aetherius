import type { EngineEval } from '@/types/chess'

const STOCKFISH_URL = '/stockfish/stockfish-nnue-16-single.js'
const DEBUG = false

function log(...args: unknown[]) {
    if (DEBUG) console.log('[SF]', ...args)
}

export interface SearchOptions {
    fen: string
    movetimeMs?: number
    depth?: number
    skillLevel?: number       // 0-20
    limitStrength?: boolean
    elo?: number              // 1320-3190
    multiPv?: number
}

export interface SearchResult {
    bestmove: string
    ponder?: string
    eval: EngineEval
    pvUci: string[]
}

type InfoCallback = (eval_: EngineEval, pvUci: string[]) => void

interface SearchState {
    resolve: (r: SearchResult) => void
    reject: (e: Error) => void
    infoCb?: InfoCallback
    currentEval: EngineEval
    currentPv: string[]
    timeoutHandle?: ReturnType<typeof setTimeout>
}

export class StockfishEngine {
    private worker: Worker | null = null
    private uciOk = false
    private readyOk = false
    private readyPromise: Promise<void> | null = null
    private currentSearch: SearchState | null = null
    private searchQueue: Array<() => void> = []

    init(): Promise<void> {
        if (this.readyPromise) return this.readyPromise

        this.readyPromise = new Promise((resolve, reject) => {
            try {
                log('Creating worker:', STOCKFISH_URL)
                this.worker = new Worker(STOCKFISH_URL)
                this.worker.onmessage = (e) => this.handleMessage(String(e.data ?? ''), resolve)
                this.worker.onerror = (e) => {
                    console.error('[SF] Worker error:', e.message || e)
                    reject(new Error(`Stockfish worker error: ${e.message || 'unknown'}`))
                }
                this.send('uci')
                // Safety timeout — if engine never replies, reject after 10s
                setTimeout(() => {
                    if (!this.readyOk) {
                        console.error('[SF] Init timeout — no readyok received')
                        reject(new Error('Stockfish init timeout'))
                    }
                }, 10000)
            } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)))
            }
        })

        return this.readyPromise
    }

    private send(cmd: string) {
        log('→', cmd)
        this.worker?.postMessage(cmd)
    }

    private handleMessage(data: string, initResolve?: () => void) {
        // Multiple lines may arrive batched
        for (const raw of data.split('\n')) {
            const ln = raw.trim()
            if (!ln) continue
            log('←', ln)

            if (ln === 'uciok') {
                this.uciOk = true
                this.send('isready')
                continue
            }
            if (ln === 'readyok') {
                if (!this.readyOk) {
                    this.readyOk = true
                    initResolve?.()
                    // Drain queue
                    const q = this.searchQueue.slice()
                    this.searchQueue = []
                    q.forEach(fn => fn())
                }
                continue
            }

            if (ln.startsWith('info ') && this.currentSearch) {
                this.parseInfo(ln)
                continue
            }

            if (ln.startsWith('bestmove ') && this.currentSearch) {
                this.completeSearch(ln)
                continue
            }
        }
    }

    private parseInfo(line: string) {
        if (!this.currentSearch) return
        const tokens = line.split(' ')
        const ev: EngineEval = { ...this.currentSearch.currentEval }
        let pvTokens: string[] = []
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i]
            if (t === 'depth') ev.depth = Number(tokens[++i])
            else if (t === 'score') {
                const kind = tokens[++i]
                const val = Number(tokens[++i])
                if (kind === 'cp') { ev.cp = val; ev.mate = undefined }
                else if (kind === 'mate') { ev.mate = val; ev.cp = undefined }
            } else if (t === 'pv') {
                pvTokens = tokens.slice(i + 1)
                break
            }
        }
        if (pvTokens.length) {
            ev.bestUci = pvTokens[0]
            ev.pv = pvTokens
            this.currentSearch.currentPv = pvTokens
        }
        this.currentSearch.currentEval = ev
        this.currentSearch.infoCb?.(ev, this.currentSearch.currentPv)
    }

    private completeSearch(line: string) {
        if (!this.currentSearch) return
        const parts = line.split(' ')
        const bestmove = parts[1]
        const ponder = parts[3]
        const search = this.currentSearch
        this.currentSearch = null

        if (search.timeoutHandle) clearTimeout(search.timeoutHandle)

        search.resolve({
            bestmove: bestmove === '(none)' ? '' : bestmove,
            ponder: ponder && ponder !== '(none)' ? ponder : undefined,
            eval: search.currentEval,
            pvUci: search.currentPv,
        })
    }

    async waitReady(): Promise<void> {
        if (!this.worker) await this.init()
        if (this.readyOk) return
        // init() already returns the readyPromise, await it
        if (this.readyPromise) await this.readyPromise
    }

    /**
     * Search a position. If a search is already in progress, it's queued
     * (stop the previous, then start new). Has a safety timeout.
     */
    async search(opts: SearchOptions, onInfo?: InfoCallback): Promise<SearchResult> {
        await this.waitReady()

        // If a search is in progress, stop it and wait briefly
        if (this.currentSearch) {
            log('Stopping previous search')
            this.send('stop')
            // Wait for previous search to complete (bestmove) — up to 200ms
            const startWait = Date.now()
            while (this.currentSearch && Date.now() - startWait < 200) {
                await new Promise(r => setTimeout(r, 20))
            }
            if (this.currentSearch) {
                // Force complete
                log('Forcing previous search to complete')
                const stale = this.currentSearch
                this.currentSearch = null
                stale.resolve({ bestmove: '', eval: stale.currentEval, pvUci: stale.currentPv })
            }
        }

        return new Promise((resolve, reject) => {
            const movetimeMs = opts.movetimeMs ?? 1000
            const search: SearchState = {
                resolve,
                reject,
                infoCb: onInfo,
                currentEval: { depth: 0 },
                currentPv: [],
            }

            // Safety timeout — if Stockfish doesn't respond within 2x movetime, force complete
            search.timeoutHandle = setTimeout(() => {
                if (this.currentSearch === search) {
                    console.warn('[SF] Search timeout, forcing complete')
                    this.send('stop')
                    setTimeout(() => {
                        if (this.currentSearch === search) {
                            this.currentSearch = null
                            resolve({ bestmove: search.currentEval.bestUci ?? '', eval: search.currentEval, pvUci: search.currentPv })
                        }
                    }, 100)
                }
            }, movetimeMs * 3 + 2000)

            this.currentSearch = search

            // Apply options
            if (opts.limitStrength && opts.elo !== undefined && opts.elo >= 1320) {
                this.send(`setoption name UCI_LimitStrength value true`)
                this.send(`setoption name UCI_Elo value ${Math.max(1320, Math.min(3190, opts.elo))}`)
            } else {
                this.send(`setoption name UCI_LimitStrength value false`)
                if (opts.skillLevel !== undefined) {
                    this.send(`setoption name Skill Level value ${Math.max(0, Math.min(20, opts.skillLevel))}`)
                } else {
                    this.send(`setoption name Skill Level value 20`)
                }
            }
            this.send(`setoption name MultiPV value ${opts.multiPv ?? 1}`)
            this.send(`position fen ${opts.fen}`)

            const cmd: string[] = ['go']
            cmd.push('movetime', String(movetimeMs))
            if (opts.depth !== undefined) cmd.push('depth', String(opts.depth))
            this.send(cmd.join(' '))
        })
    }

    stop() {
        if (this.currentSearch) this.send('stop')
    }

    destroy() {
        this.send('quit')
        this.worker?.terminate()
        this.worker = null
        this.readyOk = false
        this.readyPromise = null
        this.currentSearch = null
    }
}
