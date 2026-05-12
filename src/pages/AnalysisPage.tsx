import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Upload, FileText, ChevronLeft, ChevronRight, RotateCcw, ChevronsLeft, ChevronsRight, FlipHorizontal2, History, Sparkles, Loader2, Download, Copy, Play, Pause } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Chess } from 'chess.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Chessboard } from '@/components/board/Chessboard'
import { EvalBar } from '@/components/board/EvalBar'
import { CoachPanel } from '@/components/ai/CoachPanel'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStockfish } from '@/hooks/useStockfish'
import { loadPgn, buildPgn } from '@/lib/pgn'
import { getRecentGames, db } from '@/lib/db'
import type { Game, MoveRecord } from '@/types/chess'
import { cn, formatRelativeTime } from '@/lib/utils'

interface AnalysisMove {
    san: string
    fenBefore: string
    fenAfter: string
    uci: string
    classification?: MoveRecord['classification']
}

type AnalysisDepth = 'short' | 'normal' | 'detailed' | 'critical'

const DEPTH_LABELS: Record<AnalysisDepth, string> = {
    short: 'Kısa',
    normal: 'Normal',
    detailed: 'Detaylı',
    critical: 'Sadece Kritik',
}

const DEPTH_INSTRUCTIONS: Record<AnalysisDepth, string> = {
    short: 'EN FAZLA 50 kelime, 1 paragraf. Sadece en önemli noktayı söyle.',
    normal: 'EN FAZLA 120 kelime, 2 paragraf. Genel özet + 1-2 önemli nokta.',
    detailed: 'EN FAZLA 250 kelime, 3-4 paragraf. Açılış, orta oyun, oyun sonu analizi. Somut hamle önerileri ver.',
    critical: 'EN FAZLA 100 kelime, sadece blunder ve mistake olan hamleleri ele al. Diğer hamleleri ATLA.',
}

export function AnalysisPage() {
    const { t } = useTranslation()
    const settings = useSettingsStore()
    const { ready, liveEval, search } = useStockfish()

    const [pgnInput, setPgnInput] = useState('')
    const [moves, setMoves] = useState<AnalysisMove[]>([])
    const [currentPly, setCurrentPly] = useState(0)
    const [startFen, setStartFen] = useState<string | null>(null)
    const [flipped, setFlipped] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [loadedGameId, setLoadedGameId] = useState<string | null>(null)
    const [loadedGame, setLoadedGame] = useState<Game | null>(null)
    const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('normal')
    const [coachOutput, setCoachOutput] = useState<string | null>(null)

    // Auto-play state
    const [autoPlaying, setAutoPlaying] = useState(false)
    const [autoPlaySpeedMs, setAutoPlaySpeedMs] = useState(1000)

    // Exploration line — user makes moves from current position to try alternatives
    const [explorationLine, setExplorationLine] = useState<AnalysisMove[] | null>(null)
    const [explorationPly, setExplorationPly] = useState(0)

    const recentGames = useLiveQuery(() => getRecentGames(30), [])
    const location = useLocation()
    const navStateLoadedRef = useRef(false)

    const inExploration = explorationLine !== null
    const currentFen = useMemo(() => {
        if (inExploration) {
            if (explorationPly === 0) return moves[currentPly - 1]?.fenAfter ?? startFen ?? new Chess().fen()
            return explorationLine![explorationPly - 1]?.fenAfter ?? new Chess().fen()
        }
        if (moves.length === 0) return startFen ?? new Chess().fen()
        if (currentPly === 0) return startFen ?? new Chess().fen()
        return moves[currentPly - 1]?.fenAfter ?? new Chess().fen()
    }, [moves, currentPly, startFen, inExploration, explorationLine, explorationPly])

    const chess = useMemo(() => new Chess(currentFen), [currentFen])
    const turn = chess.turn() === 'w' ? 'white' : 'black'
    const isBlackTurn = chess.turn() === 'b'
    // Stockfish cp is from side-to-move perspective; normalize to always-white for EvalBar
    const whiteCp = liveEval?.cp !== undefined ? (isBlackTurn ? -liveEval.cp : liveEval.cp) : undefined
    const whiteMate = liveEval?.mate !== undefined ? (isBlackTurn ? -liveEval.mate : liveEval.mate) : undefined
    const lastMove = inExploration
        ? (explorationPly > 0 ? explorationLine![explorationPly - 1] : null)
        : (currentPly > 0 ? moves[currentPly - 1] : null)

    const handleLoadPgn = useCallback(() => {
        if (!pgnInput.trim()) return
        const { chess: loaded, ok } = loadPgn(pgnInput)
        if (!ok) { toast.error(t('errors.invalidPgn')); return }
        const history = loaded.history({ verbose: true })
        const replay = new Chess()
        const acc: AnalysisMove[] = []
        for (const h of history) {
            const fenBefore = replay.fen()
            replay.move({ from: h.from, to: h.to, promotion: h.promotion })
            acc.push({
                san: h.san,
                fenBefore,
                fenAfter: replay.fen(),
                uci: h.from + h.to + (h.promotion ?? ''),
            })
        }
        setStartFen(new Chess().fen())
        setMoves(acc)
        setCurrentPly(0)
        setExplorationLine(null)
        setCoachOutput(null)
        setLoadedGameId(null)
        setLoadedGame(null)
    }, [pgnInput, t])

    const handleLoadGame = useCallback((g: Game) => {
        const startF = g.startFen ?? new Chess().fen()
        const replay = new Chess(startF)
        const acc: AnalysisMove[] = []
        for (const m of g.moves) {
            const fenBefore = replay.fen()
            try {
                replay.move({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4), promotion: m.uci.length > 4 ? m.uci[4] : undefined })
            } catch { break }
            acc.push({
                san: m.san,
                fenBefore,
                fenAfter: replay.fen(),
                uci: m.uci,
                classification: m.classification,
            })
        }
        setStartFen(startF)
        setMoves(acc)
        setCurrentPly(0)
        setExplorationLine(null)
        setCoachOutput(null)
        setLoadedGameId(g.id)
        setLoadedGame(g)
        setFlipped(g.userColor === 'b')
        setHistoryOpen(false)
    }, [])

    // Auto-load from navigation state (e.g., from Home recent games)
    useEffect(() => {
        if (navStateLoadedRef.current) return
        const state = location.state as { gameId?: string } | null
        if (!state?.gameId) return
        navStateLoadedRef.current = true
        db.games.get(state.gameId).then(g => { if (g) handleLoadGame(g) })
    }, [location.state, handleLoadGame])

    // Re-evaluate current position with Stockfish
    useEffect(() => {
        if (!ready || (moves.length === 0 && !inExploration)) return
        search({ fen: currentFen, depth: 16, movetimeMs: 600 })
    }, [currentFen, ready, search, moves.length, inExploration])

    // Auto-play interval
    useEffect(() => {
        if (!autoPlaying || moves.length === 0) return
        if (inExploration) { setAutoPlaying(false); return }
        const id = setInterval(() => {
            setCurrentPly(p => {
                const next = p + 1
                if (next > moves.length) {
                    setAutoPlaying(false)
                    return p
                }
                return next
            })
        }, autoPlaySpeedMs)
        return () => clearInterval(id)
    }, [autoPlaying, autoPlaySpeedMs, moves.length, inExploration])

    // Keyboard navigation
    useEffect(() => {
        if (moves.length === 0) return
        const onKey = (e: KeyboardEvent) => {
            // Skip if typing in input/textarea
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.key === 'ArrowRight') {
                e.preventDefault()
                setAutoPlaying(false)
                if (inExploration) {
                    setExplorationPly(p => Math.min(explorationLine!.length, p + 1))
                } else {
                    setCurrentPly(p => Math.min(moves.length, p + 1))
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setAutoPlaying(false)
                if (inExploration) {
                    if (explorationPly === 0) { setExplorationLine(null); return }
                    setExplorationPly(p => Math.max(0, p - 1))
                } else {
                    setCurrentPly(p => Math.max(0, p - 1))
                }
            } else if (e.key === 'Home') {
                setAutoPlaying(false)
                if (inExploration) { setExplorationLine(null); setExplorationPly(0) }
                setCurrentPly(0)
            } else if (e.key === 'End') {
                setAutoPlaying(false)
                if (inExploration) setExplorationPly(explorationLine!.length)
                else setCurrentPly(moves.length)
            } else if (e.key === 'f' || e.key === 'F') {
                setFlipped(f => !f)
            } else if (e.key === ' ') {
                e.preventDefault()
                setAutoPlaying(prev => !prev)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [moves.length, inExploration, explorationPly, explorationLine])

    // User makes a move on the board — enter exploration mode
    const handleBoardMove = useCallback((from: string, to: string) => {
        const piece = chess.get(from as any)
        const isPawn = piece?.type === 'p'
        const promoRank = to[1]
        const isPromotion = isPawn && (promoRank === '1' || promoRank === '8')
        const uci = from + to + (isPromotion ? 'q' : '')

        try {
            const fenBefore = chess.fen()
            const m = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined })
            if (!m) return
            const newMove: AnalysisMove = {
                san: m.san,
                fenBefore,
                fenAfter: chess.fen(),
                uci,
            }
            if (inExploration) {
                // Append to exploration line up to current position
                const truncated = explorationLine!.slice(0, explorationPly)
                setExplorationLine([...truncated, newMove])
                setExplorationPly(explorationPly + 1)
            } else {
                // Start a new exploration line from main line position
                setExplorationLine([newMove])
                setExplorationPly(1)
            }
        } catch (e) {
            console.warn('Invalid move in analysis', e)
        }
    }, [chess, inExploration, explorationLine, explorationPly])

    const legalDests = useMemo(() => {
        const m = new Map<string, string[]>()
        for (const mv of chess.moves({ verbose: true })) {
            const arr = m.get(mv.from) ?? []
            arr.push(mv.to)
            m.set(mv.from, arr)
        }
        return m
    }, [chess])

    const handleClearExploration = () => {
        setExplorationLine(null)
        setExplorationPly(0)
    }

    // PGN export helpers
    const currentPgnText = useMemo(() => {
        if (loadedGame) return buildPgn(loadedGame)
        if (moves.length === 0) return ''
        // Manual PGN (pasted) — reconstruct from moves
        const movesText = moves
            .map((m, i) => {
                const moveNum = Math.ceil((i + 1) / 2)
                const prefix = i % 2 === 0 ? `${moveNum}. ` : ''
                return `${prefix}${m.san}`
            })
            .join(' ')
        return movesText
    }, [loadedGame, moves])

    const handleCopyPgn = useCallback(() => {
        if (!currentPgnText) return
        navigator.clipboard.writeText(currentPgnText)
            .then(() => toast.success('PGN panoya kopyalandı'))
            .catch(() => toast.error('Kopyalama başarısız'))
    }, [currentPgnText])

    const handleDownloadPgn = useCallback(() => {
        if (!currentPgnText) return
        const blob = new Blob([currentPgnText], { type: 'application/x-chess-pgn' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const name = loadedGame
            ? `${loadedGame.whiteName}_vs_${loadedGame.blackName}_${new Date(loadedGame.createdAt).toISOString().slice(0, 10)}`
            : 'analysis'
        a.download = `${name.replace(/\s+/g, '_')}.pgn`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('PGN dosyası indirildi')
    }, [currentPgnText, loadedGame])

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-2xl font-bold">{t('analysis.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('analysis.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                        <History className="w-4 h-4" />
                        Geçmişten Seç
                    </Button>
                </div>
            </header>

            {moves.length === 0 ? (
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            {t('analysis.pastePgn')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <textarea
                            value={pgnInput}
                            onChange={e => setPgnInput(e.target.value)}
                            placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 ..."
                            rows={10}
                            className="w-full p-3 rounded-lg border border-border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleLoadPgn} className="flex-1" disabled={!pgnInput.trim()}>
                                <Upload className="w-4 h-4" />
                                {t('analysis.loadGame')}
                            </Button>
                            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                                <History className="w-4 h-4" />
                                Geçmişten
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="hidden md:block h-[min(70vh,560px)]">
                                <EvalBar cp={whiteCp} mate={whiteMate} orientation={flipped ? 'black' : 'white'} />
                            </div>
                            <div className="flex-1 max-w-2xl mx-auto w-full">
                                <Chessboard
                                    fen={currentFen}
                                    orientation={flipped ? 'black' : 'white'}
                                    turnColor={turn}
                                    lastMove={lastMove ? [lastMove.uci.slice(0, 2), lastMove.uci.slice(2, 4)] as [string, string] : null}
                                    movableDests={legalDests}
                                    movableColor={turn}
                                    onMove={handleBoardMove}
                                    showCoordinates={settings.showCoordinates}
                                    showLegalMoves={settings.showLegalMoves}
                                    boardTheme={settings.boardTheme}
                                />
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Button variant="outline" size="icon" onClick={() => { setAutoPlaying(false); handleClearExploration(); setCurrentPly(0) }} title="Başa">
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => { setAutoPlaying(false); inExploration ? setExplorationPly(p => Math.max(0, p - 1)) : setCurrentPly(p => Math.max(0, p - 1)) }} title="Geri (←)">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={autoPlaying ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => {
                                    if (!autoPlaying && currentPly >= moves.length) setCurrentPly(0)
                                    setAutoPlaying(prev => !prev)
                                }}
                                title={autoPlaying ? 'Durdur (Space)' : 'Otomatik Oynat (Space)'}
                                disabled={inExploration}
                            >
                                {autoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Badge variant="default" className="font-mono px-3 min-w-[80px] justify-center">
                                {inExploration ? `${explorationPly}/${explorationLine?.length ?? 0}*` : `${currentPly}/${moves.length}`}
                            </Badge>
                            <Button variant="outline" size="icon" onClick={() => { setAutoPlaying(false); inExploration ? setExplorationPly(p => Math.min(explorationLine!.length, p + 1)) : setCurrentPly(p => Math.min(moves.length, p + 1)) }} title="İleri (→)">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => { setAutoPlaying(false); inExploration ? setExplorationPly(explorationLine!.length) : setCurrentPly(moves.length) }} title="Sona">
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            {/* Auto-play speed selector */}
                            <div className="flex items-center gap-0.5">
                                {[{ms: 500, label: '2×'}, {ms: 1000, label: '1×'}, {ms: 2000, label: '½×'}, {ms: 3000, label: '⅓×'}].map(s => (
                                    <button
                                        key={s.ms}
                                        onClick={() => setAutoPlaySpeedMs(s.ms)}
                                        className={cn(
                                            'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                                            autoPlaySpeedMs === s.ms ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                        title={`Hız: ${s.label}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button variant="outline" size="icon" onClick={() => setFlipped(f => !f)} title="Tahtayı çevir (F)">
                                <FlipHorizontal2 className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button variant="outline" size="icon" onClick={handleCopyPgn} title="PGN Kopyala" disabled={!currentPgnText}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleDownloadPgn} title="PGN İndir" disabled={!currentPgnText}>
                                <Download className="w-4 h-4" />
                            </Button>
                            {inExploration && (
                                <Button variant="outline" size="sm" onClick={handleClearExploration} className="ml-2">
                                    Ana hatta dön
                                </Button>
                            )}
                        </div>
                        {inExploration && (
                            <div className="text-xs text-amber-400 text-center">
                                * Keşif modunda — kendi varyantını oynuyorsun
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground text-center">
                            Klavye: ← → gez, Space oynat/durdur, F çevir
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span>{t('analysis.engine')}</span>
                                    {liveEval && <Badge variant="outline" className="text-[10px]">d{liveEval.depth}</Badge>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1.5 text-sm">
                                {whiteCp !== undefined && (
                                    <Row label={t('analysis.evaluation')} value={(whiteCp / 100).toFixed(2)} />
                                )}
                                {whiteMate !== undefined && whiteMate !== 0 && (
                                    <Row label={t('analysis.evaluation')} value={`${whiteMate > 0 ? '+' : '-'}M${Math.abs(whiteMate)}`} valueClass="text-destructive font-bold" />
                                )}
                                {liveEval?.bestUci && (
                                    <Row label={t('analysis.bestMove')} value={liveEval.bestUci} valueClass="font-mono" />
                                )}
                                {liveEval?.pv && liveEval.pv.length > 0 && (
                                    <div className="text-xs text-muted-foreground pt-1">
                                        <span className="block mb-0.5">Hat:</span>
                                        <span className="font-mono break-all">{liveEval.pv.slice(0, 6).join(' ')}</span>
                                    </div>
                                )}
                                {!ready && <div className="text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Engine yükleniyor...</div>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Hamleler</CardTitle></CardHeader>
                            <CardContent className="p-2">
                                <ScrollArea className="h-44">
                                    <div className="grid grid-cols-2 gap-1 text-sm pr-2">
                                        {moves.map((m, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setCurrentPly(i + 1); handleClearExploration() }}
                                                className={cn(
                                                    'text-left px-2 py-1 rounded hover:bg-accent/15 font-mono flex items-center gap-1',
                                                    currentPly === i + 1 && !inExploration ? 'bg-primary/20 text-primary' : ''
                                                )}
                                            >
                                                <span className="text-[10px] text-muted-foreground tabular-nums w-5">{i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}</span>
                                                <span>{m.san}</span>
                                                {m.classification && <span className={cn('text-[10px] font-bold', classBadgeColor(m.classification))}>{classBadgeSymbol(m.classification)}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {settings.aiCoachingEnabled && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-accent" />
                                        AI Koç
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                        {(['short', 'normal', 'detailed', 'critical'] as AnalysisDepth[]).map(d => (
                                            <button
                                                key={d}
                                                onClick={() => { setAnalysisDepth(d); setCoachOutput(null) }}
                                                className={cn(
                                                    'text-[11px] px-2 py-1 rounded-md border transition-colors',
                                                    analysisDepth === d ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                {DEPTH_LABELS[d]}
                                            </button>
                                        ))}
                                    </div>
                                    <CoachPanel
                                        key={`${loadedGameId ?? 'pgn'}-${analysisDepth}-${currentPly}`}
                                        title=""
                                        autoRun={false}
                                        cachedResponse={coachOutput ?? undefined}
                                        systemPrompt={`Sen kısa konuşan bir satranç koçusun. ${DEPTH_INSTRUCTIONS[analysisDepth]}\n\nKurallar:\n- Türkçe yaz\n- Markdown başlığı kullanma\n- Sayısal değerler ve ASCII karakter kullan (♔ gibi sembol değil)\n- Asla yasadışı hamle önerme; verilen Stockfish değerlendirmelerini kabul et\n- Oyuncunun hangi tarafı oynadığı sana açıkça belirtilmiştir, buna göre analiz yap`}
                                        userPrompt={(() => {
                                            const moveCount = moves.length
                                            const userColorLabel = loadedGame
                                                ? (loadedGame.userColor === 'w' ? 'BEYAZ' : 'SİYAH')
                                                : null
                                            let p = `Oyun ${moveCount} hamle.\n`
                                            if (userColorLabel) {
                                                p += `ÖNEMLİ: Oyuncu ${userColorLabel} taşlarla oynamıştır. Analizi bu perspektiften yap. `
                                                p += `Oyuncu = ${loadedGame!.userColor === 'w' ? loadedGame!.whiteName : loadedGame!.blackName}, `
                                                p += `Rakip = ${loadedGame!.userColor === 'w' ? loadedGame!.blackName : loadedGame!.whiteName}.\n`
                                            }
                                            p += '\n'
                                            if (lastMove) {
                                                p += `Mevcut pozisyon (${currentPly}. ply sonrası):\nSon hamle: ${lastMove.san}\nFEN: ${currentFen}\n`
                                                if (liveEval?.cp !== undefined) p += `Stockfish eval: ${(liveEval.cp / 100).toFixed(2)} (depth ${liveEval.depth})\n`
                                                if (liveEval?.bestUci) p += `Stockfish önerisi: ${liveEval.bestUci}\n`
                                            }
                                            const classified = moves.filter(m => m.classification)
                                            if (classified.length > 0) {
                                                const userMoveIndices = loadedGame
                                                    ? moves.map((m, i) => ({ m, i })).filter(x => {
                                                        const isUserMove = (loadedGame!.userColor === 'w' && x.i % 2 === 0) || (loadedGame!.userColor === 'b' && x.i % 2 === 1)
                                                        return isUserMove && (x.m.classification === 'blunder' || x.m.classification === 'mistake')
                                                    })
                                                    : moves.map((m, i) => ({ m, i })).filter(x => x.m.classification === 'blunder' || x.m.classification === 'mistake')
                                                const blunders = userMoveIndices.slice(0, 5)
                                                if (blunders.length > 0) {
                                                    p += `\nOyuncunun hataları:\n`
                                                    for (const b of blunders) p += `- ${Math.floor(b.i / 2) + 1}. ${b.m.san} (${b.m.classification})\n`
                                                }
                                            }
                                            p += `\nLütfen ${DEPTH_LABELS[analysisDepth].toLowerCase()} bir analiz yaz.`
                                            return p
                                        })()}
                                        onResponse={(text) => setCoachOutput(text)}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* History picker */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] !flex !flex-col !gap-0 p-0 overflow-hidden">
                    <div className="px-6 pt-5 pb-3 border-b border-border/40 shrink-0">
                        <DialogTitle>Geçmiş Oyunlar</DialogTitle>
                        <DialogDescription className="text-xs">Bir oyuna tıkla analiz et</DialogDescription>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
                        {(!recentGames || recentGames.length === 0) && (
                            <div className="py-10 text-center text-sm text-muted-foreground">Henüz kaydedilmiş oyun yok.</div>
                        )}
                        {recentGames?.map(g => {
                            const userWon = (g.userColor === 'w' && g.result === '1-0') || (g.userColor === 'b' && g.result === '0-1')
                            const isDraw = g.result === '1/2-1/2'
                            return (
                                <button
                                    key={g.id}
                                    onClick={() => handleLoadGame(g)}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/10 transition-colors flex items-center gap-3"
                                >
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', userWon ? 'bg-success/20 text-success' : isDraw ? 'bg-muted text-muted-foreground' : 'bg-destructive/20 text-destructive')}>
                                        {userWon ? '✓' : isDraw ? '=' : '✗'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{g.whiteName} vs {g.blackName}</div>
                                        <div className="text-xs text-muted-foreground">{formatRelativeTime(g.createdAt, settings.language)} · {g.moves.length} hamle · AI {g.aiElo}</div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn('font-mono', valueClass)}>{value}</span>
        </div>
    )
}

function classBadgeColor(c: NonNullable<MoveRecord['classification']>): string {
    return {
        best: 'text-cyan-400',
        great: 'text-emerald-400',
        good: 'text-emerald-500/70',
        inaccuracy: 'text-amber-400',
        mistake: 'text-orange-500',
        blunder: 'text-rose-500',
    }[c]
}

function classBadgeSymbol(c: NonNullable<MoveRecord['classification']>): string {
    return { best: '★', great: '!', good: '✓', inaccuracy: '?!', mistake: '?', blunder: '??' }[c]
}
