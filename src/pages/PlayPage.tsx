import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Swords, Flag, RotateCcw, Sparkles, Shuffle, SlidersHorizontal, Clock, FlipHorizontal2, Lightbulb, Undo2, Copy, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Share2, Image, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Chessboard } from '@/components/board/Chessboard'
import { MoveList } from '@/components/board/MoveList'
import { EvalBar } from '@/components/board/EvalBar'
import { PromotionDialog } from '@/components/board/PromotionDialog'
import { CapturedPieces } from '@/components/board/CapturedPieces'
import { CoachPanel } from '@/components/ai/CoachPanel'
import { useGameStore, TIME_CONTROLS, type TimeControl } from '@/stores/gameStore'
import { useProfileStore } from '@/stores/profileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useStockfish } from '@/hooks/useStockfish'
import { useSounds } from '@/hooks/useSounds'
import { analyzeGame, classificationSummary } from '@/lib/game-analysis'
import { StockfishEngine } from '@/lib/stockfish'
import { AI_LEVELS, getAiLevelByElo, pickMatchedAi } from '@/lib/elo'
import { evaluateAchievements } from '@/lib/achievements-rules'
import { buildPgn } from '@/lib/pgn'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Color } from '@/types/chess'

export function PlayPage() {
    const { t } = useTranslation()
    const game = useGameStore(s => s.game)
    const chess = useGameStore(s => s.chess)
    const fen = useGameStore(s => s.fen)
    const turn = useGameStore(s => s.turn)
    const inCheck = useGameStore(s => s.inCheck)
    const status = useGameStore(s => s.status)
    const lastMoveUci = useGameStore(s => s.lastMoveUci)
    const legalDestsMap = useGameStore(s => s.legalDestsMap)
    const pendingPromotion = useGameStore(s => s.pendingPromotion)
    const newGame = useGameStore(s => s.newGame)
    const makeMove = useGameStore(s => s.makeMove)
    const handlePromotion = useGameStore(s => s.handlePromotion)
    const cancelPromotion = useGameStore(s => s.cancelPromotion)
    const resign = useGameStore(s => s.resign)
    const reset = useGameStore(s => s.reset)
    const takeBack = useGameStore(s => s.takeBack)
    const clock = useGameStore(s => s.clock)
    const tickClock = useGameStore(s => s.tickClock)

    const profile = useProfileStore()
    const settings = useSettingsStore()
    const unlock = useAchievementsStore(s => s.unlock)

    const [setupOpen, setSetupOpen] = useState(status === 'idle')
    const [manualMode, setManualMode] = useState(false)
    // Otomatik eşleştirme — chess.com mantığı, ±1 tier varyasyon
    const [matchedAi, setMatchedAi] = useState(() => pickMatchedAi(profile.elo))
    const [selectedLevel, setSelectedLevel] = useState(() => {
        let bestIdx = 0
        let bestDiff = Infinity
        AI_LEVELS.forEach((lvl, i) => {
            const d = Math.abs(lvl.elo - profile.elo)
            if (d < bestDiff) { bestDiff = d; bestIdx = i }
        })
        return bestIdx
    })
    const [selectedColor, setSelectedColor] = useState<Color | 'random'>('w')
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[5])

    // Setup açıldıkça yeni bir rakip eşleştir (chess.com tarzı yeniden eşleşme)
    useEffect(() => {
        if (setupOpen && !manualMode) {
            setMatchedAi(pickMatchedAi(profile.elo))
        }
    }, [setupOpen, manualMode, profile.elo])
    const [resignDialogOpen, setResignDialogOpen] = useState(false)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [coachSummary, setCoachSummary] = useState<string | null>(null)
    const [flipped, setFlipped] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [hintArrow, setHintArrow] = useState<{ orig: string; dest: string; brush?: 'green' | 'red' | 'blue' | 'yellow' } | null>(null)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const finishedGameRef = useRef<import('@/types/chess').Game | null>(null)

    const { ready: engineReady, thinking: engineThinking, liveEval, search } = useStockfish()
    const sounds = useSounds()
    const prevMoveCountRef = useRef(0)
    const [analysisProgress, setAnalysisProgress] = useState<{ done: number; total: number } | null>(null)
    const [analyzedMoves, setAnalyzedMoves] = useState<import('@/types/chess').MoveRecord[] | null>(null)

    // Review mode — browse past moves during the game
    const [reviewPly, setReviewPly] = useState<number | null>(null)
    const isReviewing = reviewPly !== null

    // Play sound on each new move + check
    useEffect(() => {
        const newCount = game?.moves.length ?? 0
        if (newCount > prevMoveCountRef.current && game) {
            const lastMove = game.moves[newCount - 1]
            if (lastMove) {
                const san = lastMove.san
                const isCapture = san.includes('x')
                const isCheck = san.endsWith('+') || san.endsWith('#')
                const isMate = san.endsWith('#')
                if (isCapture) sounds.capture()
                else sounds.move()
                if (isCheck && !isMate) setTimeout(() => sounds.check(), 120)
            }
        }
        prevMoveCountRef.current = newCount
    }, [game?.moves.length, game, sounds])

    // When game enters finished state: show result + unlock achievements + sound
    const lastFinishedGameIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (status === 'finished' && game && lastFinishedGameIdRef.current !== game.id) {
            lastFinishedGameIdRef.current = game.id
            finishedGameRef.current = game
            setResultDialogOpen(true)
            const userWon = (game.userColor === 'w' && game.result === '1-0') || (game.userColor === 'b' && game.result === '0-1')
            const isDraw = game.result === '1/2-1/2'
            if (userWon) setTimeout(() => sounds.victory(), 200)
            else if (isDraw) setTimeout(() => sounds.draw(), 200)
            else setTimeout(() => sounds.defeat(), 200)

            const newAchievements = evaluateAchievements({
                type: 'game_ended',
                game,
                profile: useProfileStore.getState(),
            })
            if (newAchievements.length) unlock(newAchievements)
        }
    }, [status, game, unlock, sounds])

    // Trigger background analysis ONCE per finished game. Caches results to DB.
    // If already analyzed (moves have classification), skip re-running.
    const analyzedGameIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (status !== 'finished' || !game) return
        if (analyzedGameIdRef.current === game.id) return
        if (game.moves.length === 0) return
        if (!settings.aiCoachingEnabled) return

        // Already analyzed? Use cached classifications.
        const alreadyAnalyzed = game.moves.every(m => m.classification)
        if (alreadyAnalyzed) {
            setAnalyzedMoves(game.moves)
            analyzedGameIdRef.current = game.id
            return
        }

        analyzedGameIdRef.current = game.id
        setAnalysisProgress({ done: 0, total: game.moves.length })
        setAnalyzedMoves(null)

        const engine = new StockfishEngine()
        let cancelled = false

        engine.init()
            .then(() => analyzeGame(game, engine, {
                depth: 12,
                movetimeMs: 150,
                onProgress: (done, total) => { if (!cancelled) setAnalysisProgress({ done, total }) },
            }))
            .then(moves => {
                if (cancelled) return
                setAnalyzedMoves(moves)
                setAnalysisProgress(null)
            })
            .catch(err => {
                if (cancelled) return
                console.warn('Game analysis failed:', err)
                setAnalysisProgress(null)
            })
            .finally(() => engine.destroy())

        return () => { cancelled = true }
    }, [status, game, settings.aiCoachingEnabled])

    // Trigger AI move when it's the opponent's turn.
    // NOT depending on engineThinking — that would cause infinite loop:
    // search runs → thinking=true (re-render) → cleanup cancels → engineThinking=false → re-run → cancel old result.
    // Instead we guard with a ref so only ONE search runs per (fen, turn).
    const aiSearchKeyRef = useRef<string | null>(null)
    useEffect(() => {
        if (!game || status !== 'playing') return
        if (turn === game.userColor) return
        if (!engineReady) return

        const key = `${fen}|${turn}`
        if (aiSearchKeyRef.current === key) return // already searching this position
        aiSearchKeyRef.current = key

        const aiLevel = getAiLevelByElo(game.aiElo ?? 1200)
        let cancelled = false
        const run = async () => {
            const result = await search({
                fen,
                movetimeMs: aiLevel.movetimeMs,
                depth: aiLevel.depth,
                limitStrength: aiLevel.limitStrength,
                elo: aiLevel.elo,
                skillLevel: aiLevel.skill,
            })
            if (cancelled || !result?.bestmove) return

            // Zayıf seviyelerde rastgele hamle ihtimali — Stockfish minimum gücü
            // hala ~1300 ELO civarında, daha düşük seviyelerde insan hataları
            // simüle etmek için rastgele legal hamle seç.
            let chosenMove = result.bestmove
            if (aiLevel.randomMoveProb && Math.random() < aiLevel.randomMoveProb) {
                const allLegal = chess.moves({ verbose: true })
                if (allLegal.length > 0) {
                    const r = allLegal[Math.floor(Math.random() * allLegal.length)]
                    chosenMove = r.from + r.to + (r.promotion ?? '')
                }
            }

            setTimeout(() => makeMove(chosenMove), 250)
        }
        run()
        return () => { cancelled = true }
    }, [game, fen, turn, status, engineReady, search, makeMove, chess])

    // First move achievement
    useEffect(() => {
        if (game && game.moves.length === 1 && !useAchievementsStore.getState().isUnlocked('first_move')) {
            unlock(['first_move'])
        }
    }, [game, unlock])

    const handleSetupStart = useCallback(() => {
        const color: Color = selectedColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : selectedColor
        const aiElo = manualMode ? AI_LEVELS[selectedLevel].elo : matchedAi.elo
        newGame({ userColor: color, aiElo, username: profile.username, timeControl: selectedTimeControl })
        setSetupOpen(false)
    }, [selectedColor, selectedLevel, matchedAi, manualMode, newGame, profile.username, selectedTimeControl])

    // Saat tick — her 100ms'de aktif oyuncunun süresini düşür
    useEffect(() => {
        if (status !== 'playing' || !clock) return
        const id = setInterval(() => tickClock(), 100)
        return () => clearInterval(id)
    }, [status, clock, tickClock])

    const handleBoardMove = useCallback((from: string, to: string) => {
        if (!game || turn !== game.userColor) return
        const piece = chess.get(from as any)
        const isPawn = piece?.type === 'p'
        const promoRank = to[1]
        const isPromotion = isPawn && (promoRank === '1' || promoRank === '8')
        let uci = from + to
        if (isPromotion && settings.autoQueenPromotion) {
            uci += 'q'
        }
        makeMove(uci)
    }, [game, turn, chess, makeMove, settings.autoQueenPromotion])

    const handleNewGame = () => {
        reset()
        setResultDialogOpen(false)
        setCoachSummary(null)
        setAnalyzedMoves(null)
        setAnalysisProgress(null)
        setReviewPly(null)
        analyzedGameIdRef.current = null
        setSetupOpen(true)
    }

    const aiLevelInfo = manualMode ? AI_LEVELS[selectedLevel] : matchedAi
    const userColor = game?.userColor ?? 'w'
    const naturalOrientation: 'white' | 'black' = userColor === 'w' ? 'white' : 'black'
    const boardOrientation: 'white' | 'black' = flipped ? (naturalOrientation === 'white' ? 'black' : 'white') : naturalOrientation

    // Show hint as an arrow on the board (computed from live eval bestUci)
    useEffect(() => {
        if (showHint && liveEval?.bestUci && liveEval.bestUci.length >= 4) {
            const uci = liveEval.bestUci
            setHintArrow({ orig: uci.slice(0, 2), dest: uci.slice(2, 4), brush: 'green' })
        } else {
            setHintArrow(null)
        }
    }, [showHint, liveEval?.bestUci])

    // Clear hint when user makes a move
    useEffect(() => {
        if (game && showHint) {
            setShowHint(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.moves.length])
    const turnColor = turn === 'w' ? 'white' : 'black'
    const movableColor = game && turn === userColor && !isReviewing ? boardOrientation : 'none'
    // Stockfish cp is from side-to-move perspective; normalize to always-white for EvalBar
    const whiteCp = liveEval?.cp !== undefined ? (turn === 'b' ? -liveEval.cp : liveEval.cp) : undefined
    const whiteMate = liveEval?.mate !== undefined ? (turn === 'b' ? -liveEval.mate : liveEval.mate) : undefined

    // Review mode — compute displayed FEN and last move
    const displayFen = useMemo(() => {
        if (!isReviewing || !game) return fen
        if (reviewPly === 0) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        return game.moves[reviewPly! - 1]?.fenAfter ?? fen
    }, [isReviewing, reviewPly, game, fen])

    const displayLastMoveUci = useMemo(() => {
        if (!isReviewing || !game) return lastMoveUci
        if (reviewPly === 0 || !reviewPly) return null
        return game.moves[reviewPly - 1]?.uci ?? null
    }, [isReviewing, reviewPly, game, lastMoveUci])

    // Auto-return to live when a new move is made
    useEffect(() => {
        if (isReviewing && game) {
            // If the user is reviewing the very last move, snap to live
            if (reviewPly === game.moves.length) {
                setReviewPly(null)
            }
        }
    }, [game?.moves.length, reviewPly, isReviewing, game])

    // Keyboard navigation for review mode
    useEffect(() => {
        if (!game || status !== 'playing') return
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setReviewPly(prev => {
                    const current = prev ?? game.moves.length
                    return Math.max(0, current - 1)
                })
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setReviewPly(prev => {
                    if (prev === null) return null // already live
                    const next = prev + 1
                    if (next >= game.moves.length) return null // back to live
                    return next
                })
            } else if (e.key === 'Escape' && isReviewing) {
                e.preventDefault()
                setReviewPly(null)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [game, status, isReviewing])

    const userWon = game && ((game.userColor === 'w' && game.result === '1-0') || (game.userColor === 'b' && game.result === '0-1'))
    const isDraw = game?.result === '1/2-1/2'

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6">
            {/* Setup dialog */}
            <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogContent className="max-w-md">
                    <DialogTitle className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-primary" />
                        {t('play.title')}
                    </DialogTitle>
                    <DialogDescription>{t('play.chooseSide')}</DialogDescription>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('play.selectColor')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                <ColorButton color="w" selected={selectedColor === 'w'} onClick={() => setSelectedColor('w')} label={t('common.white')} />
                                <ColorButton color="random" selected={selectedColor === 'random'} onClick={() => setSelectedColor('random')} label="?" />
                                <ColorButton color="b" selected={selectedColor === 'b'} onClick={() => setSelectedColor('b')} label={t('common.black')} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">
                                    {manualMode ? t('play.selectDifficulty') : 'Rakip'}
                                </label>
                                <button
                                    onClick={() => setManualMode(m => !m)}
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                >
                                    {manualMode ? (<><Shuffle className="w-3 h-3" /> Otomatik</>) : (<><SlidersHorizontal className="w-3 h-3" /> Manuel</>)}
                                </button>
                            </div>

                            {!manualMode ? (
                                <motion.div
                                    key={matchedAi.elo}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-lg">
                                        🤖
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm">{matchedAi.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Senin seviyene yakın eşleşme · {eloDeltaText(matchedAi.elo, profile.elo)}
                                        </div>
                                    </div>
                                    <Badge variant="default" className="font-mono">{matchedAi.elo}</Badge>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-end mb-2">
                                        <Badge variant="default" className="font-mono">{aiLevelInfo.label} • {aiLevelInfo.elo}</Badge>
                                    </div>
                                    <Slider
                                        value={[selectedLevel]}
                                        onValueChange={([v]) => setSelectedLevel(v)}
                                        min={0}
                                        max={AI_LEVELS.length - 1}
                                        step={1}
                                    />
                                    <div
                                        className="grid gap-0.5 mt-2"
                                        style={{ gridTemplateColumns: `repeat(${AI_LEVELS.length}, minmax(0, 1fr))` }}
                                    >
                                        {AI_LEVELS.map((l, i) => (
                                            <div key={l.elo} className={cn('text-[10px] text-center tabular-nums', i === selectedLevel ? 'text-primary font-bold' : 'text-muted-foreground/50')}>
                                                {l.elo}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Time control */}
                        <div>
                            <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Süre
                            </label>
                            <div className="grid grid-cols-5 gap-1.5">
                                {TIME_CONTROLS.map((tc) => (
                                    <button
                                        key={tc.label}
                                        onClick={() => setSelectedTimeControl(tc)}
                                        className={cn(
                                            'py-2 px-1 rounded-lg border text-xs font-mono font-medium transition-all',
                                            selectedTimeControl.label === tc.label
                                                ? 'border-primary bg-primary/15 text-primary'
                                                : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {tc.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSetupStart} size="lg" className="w-full">
                            <Crown className="w-4 h-4" />
                            {t('play.startGame')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Promotion */}
            <PromotionDialog
                open={!!pendingPromotion}
                color={userColor}
                onPick={(piece) => handlePromotion(piece)}
                onCancel={cancelPromotion}
            />

            {/* Resign confirm */}
            <Dialog open={resignDialogOpen} onOpenChange={setResignDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogTitle>{t('common.resign')}</DialogTitle>
                    <DialogDescription>{t('play.resignConfirm')}</DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResignDialogOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={() => { resign(); setResignDialogOpen(false) }}>
                            <Flag className="w-4 h-4" />
                            {t('common.resign')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Result dialog */}
            <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] !flex !flex-col !gap-0 p-0 overflow-hidden">
                    {/* Header — sabit */}
                    <div className="text-center px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                            className="text-5xl mb-2"
                        >
                            {userWon ? '🏆' : isDraw ? '🤝' : '😔'}
                        </motion.div>
                        <DialogTitle className="text-xl">
                            {userWon ? t('play.youWon') : isDraw ? t('play.drawnGame') : t('play.youLost')}
                        </DialogTitle>
                        {game && (
                            <DialogDescription className="mt-1 text-xs">
                                {t(`termination.${game.termination}`)}
                                {game.userEloAfter !== game.userEloBefore && (
                                    <span className={cn('ml-3 font-mono font-bold', game.userEloAfter > game.userEloBefore ? 'text-success' : 'text-destructive')}>
                                        {game.userEloAfter > game.userEloBefore ? '+' : ''}{game.userEloAfter - game.userEloBefore} ELO
                                    </span>
                                )}
                            </DialogDescription>
                        )}
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                        {game && analysisProgress && (
                            <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Hamleler analiz ediliyor...</span>
                                    <span className="font-mono text-primary">{analysisProgress.done}/{analysisProgress.total}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        animate={{ width: `${(analysisProgress.done / Math.max(1, analysisProgress.total)) * 100}%` }}
                                        transition={{ ease: 'linear' }}
                                    />
                                </div>
                            </div>
                        )}

                        {game && analyzedMoves && (() => {
                            const summary = classificationSummary(analyzedMoves, game.userColor)
                            return (
                                <div className="rounded-lg border border-border bg-card/40 p-3 grid grid-cols-3 gap-2 text-center">
                                    <ClassStat label="Hata" count={summary.mistake + summary.blunder} colorClass="text-destructive" />
                                    <ClassStat label="Yanlışlık" count={summary.inaccuracy} colorClass="text-amber-400" />
                                    <ClassStat label="İyi" count={summary.best + summary.great + summary.good} colorClass="text-success" />
                                </div>
                            )
                        })()}

                        {game && settings.aiCoachingEnabled && (
                            <CoachPanel
                                title={t('ai.gameSummary')}
                                autoRun={false}
                                cachedResponse={coachSummary ?? game.aiSummaryTr ?? game.aiSummaryEn ?? undefined}
                                systemPrompt={`Sen kısa konuşan bir satranç koçusun. Oyuncuya KISA ve NET geri bildirim ver:
- Toplam EN FAZLA 80 kelime
- 2 kısa paragraf (her biri 2-3 cümle)
- 1. paragraf: oyunun genel özeti (1 cümle) + en kritik 1-2 hata
- 2. paragraf: somut tek bir öneri / sonraki oyun için ipucu
Asla 80 kelimeyi aşma. Markdown başlığı kullanma, sadece düz paragraflar.`}
                                userPrompt={(() => {
                                    let p = `Sonuç: ${userWon ? 'kazandı' : isDraw ? 'berabere' : 'kaybetti'}. AI ELO: ${game.aiElo}. Toplam hamle: ${game.moves.length}.\n`
                                    if (analyzedMoves) {
                                        const blunders = analyzedMoves
                                            .map((m, i) => ({ m, i, isUser: (game.userColor === 'w' && i % 2 === 0) || (game.userColor === 'b' && i % 2 === 1) }))
                                            .filter(x => x.isUser && (x.m.classification === 'blunder' || x.m.classification === 'mistake'))
                                            .slice(0, 3)
                                        if (blunders.length > 0) {
                                            p += `\nEn kritik hatalar:\n`
                                            for (const b of blunders) {
                                                p += `- ${Math.floor(b.i / 2) + 1}. ${b.m.san} (${b.m.classification}), önerilen: ${b.m.eval?.bestUci ?? '?'}\n`
                                            }
                                        }
                                    }
                                    p += `\nKullanıcı ${game.userColor === 'w' ? 'beyaz' : 'siyah'} oynadı. KISA bir analiz yaz (max 80 kelime).`
                                    return p
                                })()}
                                onResponse={(text) => setCoachSummary(text)}
                            />
                        )}
                    </div>

                    {/* Footer — sabit */}
                    <DialogFooter className="px-6 py-4 border-t border-border/40 shrink-0 bg-card">
                        <Button variant="outline" size="sm" onClick={() => { setResultDialogOpen(false); setShareDialogOpen(true) }}>
                            <Share2 className="w-3.5 h-3.5" />
                            Paylaş
                        </Button>
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => setResultDialogOpen(false)}>{t('common.close')}</Button>
                        <Button onClick={handleNewGame}>
                            <RotateCcw className="w-4 h-4" />
                            {t('play.playAgain')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share dialog — chess.com style */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Oyunu Paylaş
                    </DialogTitle>
                    <DialogDescription>Oyununu farklı formatlarda dışa aktar.</DialogDescription>
                    <div className="space-y-2 pt-2">
                        {/* PGN Copy */}
                        <button
                            onClick={() => {
                                const g = finishedGameRef.current ?? game
                                if (!g) return
                                const pgn = buildPgn(g)
                                navigator.clipboard.writeText(pgn)
                                    .then(() => { toast.success('PGN panoya kopyalandı'); setShareDialogOpen(false) })
                                    .catch(() => toast.error('Kopyalama başarısız'))
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <Copy className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">PGN Kopyala</div>
                                <div className="text-xs text-muted-foreground">Hamle notasyonunu panoya kopyala</div>
                            </div>
                        </button>

                        {/* PGN Download */}
                        <button
                            onClick={() => {
                                const g = finishedGameRef.current ?? game
                                if (!g) return
                                const pgn = buildPgn(g)
                                const blob = new Blob([pgn], { type: 'application/x-chess-pgn' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${g.whiteName}_vs_${g.blackName}_${new Date(g.createdAt).toISOString().slice(0, 10)}.pgn`.replace(/\s+/g, '_')
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                                toast.success('PGN dosyası indirildi')
                                setShareDialogOpen(false)
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">PGN İndir</div>
                                <div className="text-xs text-muted-foreground">.pgn dosyası olarak kaydet</div>
                            </div>
                        </button>

                        {/* PNG Screenshot */}
                        <button
                            onClick={async () => {
                                try {
                                    const boardEl = document.querySelector('.cg-wrap') as HTMLElement | null
                                    if (!boardEl) { toast.error('Tahta bulunamadı'); return }
                                    const { toPng } = await import('html-to-image')
                                    const dataUrl = await toPng(boardEl, { backgroundColor: '#1a1a1a', pixelRatio: 2 })
                                    const link = document.createElement('a')
                                    link.href = dataUrl
                                    const g = finishedGameRef.current ?? game
                                    link.download = g
                                        ? `${g.whiteName}_vs_${g.blackName}.png`.replace(/\s+/g, '_')
                                        : 'board.png'
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    toast.success('Tahta görüntüsü indirildi')
                                    setShareDialogOpen(false)
                                } catch {
                                    toast.error('Görüntü oluşturulamadı')
                                }
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                                <Image className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">Tahta Görüntüsü (PNG)</div>
                                <div className="text-xs text-muted-foreground">Tahtayı resim olarak indir</div>
                            </div>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main game layout */}
            {status === 'idle' && !setupOpen && (
                <Card className="max-w-md mx-auto mt-12">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
                            <Swords className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{t('play.title')}</h2>
                        <Button onClick={() => setSetupOpen(true)} size="lg" className="w-full">
                            <Sparkles className="w-4 h-4" />
                            {t('play.startGame')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {status !== 'idle' && (
                <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                    {/* Board area */}
                    <div className="space-y-3">
                        <PlayerCard
                            name={userColor === 'w' ? (game?.blackName ?? 'AI') : (game?.whiteName ?? 'AI')}
                            color={userColor === 'w' ? 'b' : 'w'}
                            elo={game?.aiElo}
                            active={turn !== userColor && status === 'playing'}
                            thinking={engineThinking}
                            timeMs={clock ? (userColor === 'w' ? clock.blackMs : clock.whiteMs) : undefined}
                            timeActive={!!clock && clock.activeColor === (userColor === 'w' ? 'b' : 'w') && status === 'playing'}
                            capturedSlot={game && <CapturedPieces moves={game.moves} capturedBy={userColor === 'w' ? 'b' : 'w'} />}
                        />
                        <div className="flex gap-2">
                            <div className="hidden md:block h-[min(80vh,640px)]">
                                <EvalBar cp={whiteCp} mate={whiteMate} orientation={boardOrientation} />
                            </div>
                            <div className="flex-1 max-w-2xl mx-auto w-full">
                                <Chessboard
                                    fen={displayFen}
                                    orientation={boardOrientation}
                                    turnColor={turnColor}
                                    lastMove={displayLastMoveUci ? [displayLastMoveUci.slice(0, 2), displayLastMoveUci.slice(2, 4)] as [string, string] : null}
                                    check={isReviewing ? false : inCheck}
                                    movableDests={isReviewing ? new Map() : legalDestsMap}
                                    movableColor={movableColor as any}
                                    onMove={handleBoardMove}
                                    showCoordinates={settings.showCoordinates}
                                    showLegalMoves={settings.showLegalMoves}
                                    highlightLastMove={settings.highlightLastMove}
                                    animation={settings.boardAnimation}
                                    boardTheme={settings.boardTheme}
                                    arrows={hintArrow ? [hintArrow] : undefined}
                                />
                            </div>
                        </div>
                        <PlayerCard
                            name={userColor === 'w' ? (game?.whiteName ?? profile.username) : (game?.blackName ?? profile.username)}
                            color={userColor}
                            elo={profile.elo}
                            active={turn === userColor && status === 'playing'}
                            timeMs={clock ? (userColor === 'w' ? clock.whiteMs : clock.blackMs) : undefined}
                            timeActive={!!clock && clock.activeColor === userColor && status === 'playing'}
                            capturedSlot={game && <CapturedPieces moves={game.moves} capturedBy={userColor} />}
                        />
                        {/* Review navigation bar */}
                        {isReviewing && (
                            <div className="flex items-center justify-center gap-1.5">
                                <Button variant="outline" size="icon-sm" onClick={() => setReviewPly(0)} title="Başa">
                                    <ChevronsLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="outline" size="icon-sm" onClick={() => setReviewPly(p => Math.max(0, (p ?? 0) - 1))} title="Geri">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Badge variant="outline" className="font-mono text-xs px-2">
                                    {reviewPly}/{game?.moves.length ?? 0}
                                </Badge>
                                <Button variant="outline" size="icon-sm" onClick={() => {
                                    const next = (reviewPly ?? 0) + 1
                                    if (next >= (game?.moves.length ?? 0)) setReviewPly(null)
                                    else setReviewPly(next)
                                }} title="İleri">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="default" size="sm" onClick={() => setReviewPly(null)} className="ml-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    Canlı
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Side panel */}
                    <div className="space-y-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{t('play.moveHistory')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 h-[300px]">
                                {game && <MoveList
                                    moves={analyzedMoves ?? game.moves}
                                    selectedPly={isReviewing ? reviewPly! : game.moves.length}
                                    onSelectMove={(ply) => {
                                        if (ply >= game.moves.length) setReviewPly(null)
                                        else setReviewPly(ply)
                                    }}
                                />}
                            </CardContent>
                        </Card>

                        {status === 'playing' && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowHint(s => !s)}
                                        disabled={turn !== userColor}
                                        title="Stockfish'in en iyi hamlesini ok olarak göster"
                                        className={showHint ? 'border-accent text-accent' : ''}
                                    >
                                        <Lightbulb className="w-4 h-4" />
                                        İpucu
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => takeBack()}
                                        disabled={turn !== userColor || (game?.moves.length ?? 0) < 2}
                                        title="Son hamleyi geri al (kullanıcı + AI)"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                        Geri Al
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setFlipped(f => !f)} title="Tahtayı çevir">
                                        <FlipHorizontal2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setResignDialogOpen(true)}>
                                        <Flag className="w-4 h-4" />
                                        {t('common.resign')}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleNewGame}>
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {status === 'finished' && (
                            <Button onClick={handleNewGame} size="lg" className="w-full">
                                <Sparkles className="w-4 h-4" />
                                {t('play.playAgain')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function ClassStat({ label, count, colorClass }: { label: string; count: number; colorClass: string }) {
    return (
        <div>
            <div className={cn('text-2xl font-bold tabular-nums', colorClass)}>{count}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
    )
}

function eloDeltaText(aiElo: number, userElo: number): string {
    const diff = aiElo - userElo
    if (Math.abs(diff) < 100) return 'Senin seviyende'
    if (diff > 0) return `+${diff} (zorlu)`
    return `${diff} (rahatlatıcı)`
}

function ColorButton({ color, selected, onClick, label }: { color: Color | 'random'; selected: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'aspect-square rounded-xl border-2 flex items-center justify-center font-bold transition-all',
                selected ? 'border-primary scale-105 shadow-lg' : 'border-border hover:border-primary/50',
                color === 'w' ? 'bg-white text-zinc-900' : color === 'b' ? 'bg-zinc-900 text-white' : 'bg-gradient-to-br from-white to-zinc-900 text-zinc-500'
            )}
        >
            <span className="text-lg">{label}</span>
        </button>
    )
}

function PlayerCard({ name, color, elo, active, thinking, timeMs, timeActive, capturedSlot }: { name: string; color: Color; elo?: number; active?: boolean; thinking?: boolean; timeMs?: number; timeActive?: boolean; capturedSlot?: React.ReactNode }) {
    const { t } = useTranslation()
    const showTime = timeMs !== undefined && Number.isFinite(timeMs)
    const lowTime = showTime && timeMs! < 15000
    return (
        <motion.div
            animate={active ? { scale: [1, 1.01, 1] } : { scale: 1 }}
            transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
        >
            <Card className={cn('transition-colors', active && 'border-primary/50')}>
                <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0', color === 'w' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white border border-border')}>
                        {color === 'w' ? '♔' : '♚'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            {elo !== undefined && <div className="text-xs text-muted-foreground shrink-0">{t('common.elo')} {elo}</div>}
                            {capturedSlot}
                        </div>
                    </div>
                    {thinking && (
                        <Badge variant="default" className="text-[10px]">{t('play.aiThinking')}...</Badge>
                    )}
                    {showTime && (
                        <div className={cn(
                            'px-3 py-1.5 rounded-lg font-mono text-base font-bold tabular-nums transition-colors shrink-0',
                            timeActive ? (lowTime ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-primary/20 text-primary') : 'bg-muted text-muted-foreground'
                        )}>
                            {formatClockTime(timeMs!)}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}

function formatClockTime(ms: number): string {
    if (ms <= 0) return '0:00'
    const totalSec = Math.ceil(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    // Under 10 seconds: show with decimal
    if (totalSec < 10) {
        const tenths = Math.floor((ms % 1000) / 100)
        return `0:0${Math.floor(ms / 1000)}.${tenths}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}
