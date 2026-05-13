import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, SkipForward, Eye, Target, Flame, FlipHorizontal2, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Chessboard } from '@/components/board/Chessboard'
import { CoachPanel } from '@/components/ai/CoachPanel'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useProfileStore } from '@/stores/profileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Chess } from 'chess.js'
import { evaluateAchievements } from '@/lib/achievements-rules'
import { cn } from '@/lib/utils'

export function PuzzlesPage() {
    const { t } = useTranslation()
    const { puzzle, status, fen, moveIndex, solverMoveCount, lastWrongUci, expectedUci, loadNext, attemptMove, confirmFailed, showSolution, reset } = usePuzzleStore()
    const profile = useProfileStore()
    const settings = useSettingsStore()
    const unlock = useAchievementsStore(s => s.unlock)
    const totalSolved = useLiveQuery(() => db.puzzles.filter(p => !!p.solvedAt).count(), [])

    const [flipped, setFlipped] = useState(false)
    const [autoAdvance, setAutoAdvance] = useState(false)

    useEffect(() => {
        if (status === 'idle') loadNext()
    }, [status, loadNext])

    // Yanlış hamle → 1.5s göster → failed
    useEffect(() => {
        if (status !== 'showing_wrong') return
        const id = setTimeout(() => confirmFailed(), 1500)
        return () => clearTimeout(id)
    }, [status, confirmFailed])

    // Puzzle değiştiğinde flip'i sıfırla (kullanıcı orientation'ı manuel değiştirebilir)
    useEffect(() => {
        setFlipped(false)
    }, [puzzle?.id])

    // Solve sonrası achievement check
    useEffect(() => {
        if (status === 'solved' && puzzle) {
            const newOnes = evaluateAchievements({
                type: 'puzzle_solved',
                puzzleRating: puzzle.rating,
                profile: useProfileStore.getState(),
                streak: profile.puzzleStreak,
                totalSolved: (totalSolved ?? 0) + 1,
            })
            if (newOnes.length) unlock(newOnes)
        }
    }, [status, puzzle, profile.puzzleStreak, totalSolved, unlock])

    // Auto-advance
    useEffect(() => {
        if (status === 'solved' && autoAdvance) {
            const id = setTimeout(() => { reset(); loadNext() }, 2500)
            return () => clearTimeout(id)
        }
    }, [status, autoAdvance, reset, loadNext])

    const baseChess = useMemo(() => puzzle ? new Chess(fen) : new Chess(), [fen, puzzle])
    const turn = baseChess.turn() === 'w' ? 'white' : 'black'
    const naturalOrientation = puzzle ? (new Chess(puzzle.fen).turn() === 'w' ? 'white' : 'black') : 'white'
    const orientation: 'white' | 'black' = flipped ? (naturalOrientation === 'white' ? 'black' : 'white') : naturalOrientation
    const legalDests = useMemo(() => status === 'active' ? buildLegalDests(baseChess) : new Map<string, string[]>(), [baseChess, status])

    const handleMove = (from: string, to: string) => {
        if (status !== 'active') return
        const piece = baseChess.get(from as any)
        const isPawn = piece?.type === 'p'
        const promoRank = to[1]
        const isPromotion = isPawn && (promoRank === '1' || promoRank === '8')
        const uci = from + to + (isPromotion ? 'q' : '')
        attemptMove(uci)
    }

    const handleNext = () => { reset(); loadNext() }

    // Stockfish'in bestUci'si — Gemini hint için (puzzle'ın expectedUci'si gerçek en iyi hamle)
    const lastMoveArrow = useMemo(() => {
        if (status === 'showing_wrong' && lastWrongUci) {
            return [{ orig: lastWrongUci.slice(0, 2), dest: lastWrongUci.slice(2, 4), brush: 'red' as const }]
        }
        if ((status === 'failed' || status === 'showing_solution') && expectedUci) {
            return [{ orig: expectedUci.slice(0, 2), dest: expectedUci.slice(2, 4), brush: 'green' as const }]
        }
        return undefined
    }, [status, lastWrongUci, expectedUci])

    return (
        <div className="container mx-auto max-w-6xl p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{t('puzzles.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('puzzles.subtitle')}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge variant="default" className="gap-1.5 py-1.5"><Target className="w-3.5 h-3.5" />{profile.puzzleElo}</Badge>
                    {profile.puzzleStreak > 0 && (
                        <Badge variant="warning" className="gap-1.5 py-1.5"><Flame className="w-3.5 h-3.5" />{profile.puzzleStreak}</Badge>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                <div className="space-y-3">
                    <div className="max-w-2xl mx-auto w-full relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={puzzle?.id ?? 'empty'}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.25 }}
                            >
                                <Chessboard
                                    fen={fen}
                                    orientation={orientation}
                                    turnColor={turn}
                                    movableDests={legalDests}
                                    movableColor={status === 'active' ? turn : 'none'}
                                    onMove={handleMove}
                                    showCoordinates={settings.showCoordinates}
                                    showLegalMoves={settings.showLegalMoves}
                                    boardTheme={settings.boardTheme}
                                    arrows={lastMoveArrow}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Overlay anim for solved/failed */}
                        <AnimatePresence>
                            {status === 'solved' && (
                                <motion.div
                                    key="solved"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                        className="bg-success/95 text-white rounded-full p-6 shadow-2xl"
                                    >
                                        <CheckCircle2 className="w-16 h-16" />
                                    </motion.div>
                                </motion.div>
                            )}
                            {status === 'showing_wrong' && (
                                <motion.div
                                    key="wrong"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.2, 1] }}
                                        transition={{ duration: 0.4 }}
                                        className="bg-destructive/95 text-white rounded-full p-5 shadow-2xl"
                                    >
                                        <XCircle className="w-14 h-14" />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Status banner */}
                    <AnimatePresence mode="wait">
                        {status === 'solved' && puzzle && (
                            <motion.div
                                key="solved-banner"
                                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <Card className="border-success/40 bg-success/10">
                                    <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                                        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-success">Çözüldü! 🎉</div>
                                            <div className="text-xs text-muted-foreground">+{Math.max(0, Math.round((puzzle.rating - profile.puzzleElo) / 25 + 5))} puzzle ELO</div>
                                        </div>
                                        <Button onClick={handleNext} variant="success">
                                            <SkipForward className="w-4 h-4" />
                                            Sonraki
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {(status === 'failed' || status === 'showing_solution') && puzzle && (
                            <motion.div
                                key="failed-banner"
                                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <Card className="border-destructive/40 bg-destructive/10">
                                    <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                                        <XCircle className="w-6 h-6 text-destructive shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-destructive">{status === 'showing_solution' ? 'Çözüm gösteriliyor' : 'Yanlış hamle'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {status === 'failed' && expectedUci ? `Doğru hamle: ${expectedUci}` : 'Tahtada yeşil ok ile gösteriliyor'}
                                            </div>
                                        </div>
                                        {status === 'failed' && (
                                            <Button variant="outline" size="sm" onClick={() => showSolution()}>
                                                <Eye className="w-4 h-4" />
                                                Çözümü Göster
                                            </Button>
                                        )}
                                        <Button onClick={handleNext}>
                                            <SkipForward className="w-4 h-4" />
                                            Sonraki
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {status === 'partial' && puzzle && (
                            <motion.div
                                key="partial-banner"
                                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <Card className="border-success/30 bg-success/5">
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                                        <div className="flex-1 text-sm">
                                            <span className="text-success font-medium">Doğru!</span>
                                            <span className="text-muted-foreground"> Devam et — {solverMoveCount - moveIndex} hamle kaldı.</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-3">
                    {/* Puzzle info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>En iyi hamleyi bul</span>
                                {puzzle && (
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[10px]">{puzzle.rating}</Badge>
                                        {solverMoveCount > 1 && (
                                            <Badge variant="default" className="text-[10px] font-mono">{moveIndex + 1}/{solverMoveCount}</Badge>
                                        )}
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {puzzle ? (
                                <>
                                    <div className="text-sm text-muted-foreground">
                                        {turn === 'white' ? 'Beyaz' : 'Siyah'} oynayacak — kazandıran hamleyi bul.
                                    </div>
                                    {puzzle.themes.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {puzzle.themes.slice(0, 5).map(theme => (
                                                <Badge key={theme} variant="secondary" className="text-[10px]">{themeLabel(theme)}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground">Bulmacalar yükleniyor...</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action buttons */}
                    {puzzle && (
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setFlipped(f => !f)} title="Tahtayı çevir">
                                <FlipHorizontal2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => showSolution()} disabled={status !== 'active' && status !== 'failed'} title="Çözümü göster">
                                <Lightbulb className="w-4 h-4" />
                                Çözüm
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleNext} title="Bu bulmacayı atla">
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* AI Coach explanation (correct OR wrong) */}
                    {puzzle && settings.aiCoachingEnabled && (status === 'solved' || status === 'failed' || status === 'showing_solution') && (
                        <CoachPanel
                            key={`${puzzle.id}-${status}`}
                            title={status === 'solved' ? '🎉 AI Koç Yorumu' : '💡 AI Koç Açıklaması'}
                            autoRun={true}
                            systemPrompt={`Sen kısa konuşan bir satranç koçusun. Bir bulmacanın açıklamasını yapacaksın.
Kurallar:
- EN FAZLA 60 kelime, 1-2 paragraf
- Türkçe yaz, markdown başlığı kullanma
- Eğer çözüldüyse: tebrik et + ana taktik desenini açıkla (çatal, çivi, mat, vb.)
- Eğer yanlışsa: NEDEN yanlış olduğunu açıkla + doğru hamlenin NEDEN doğru olduğunu söyle
- Sayısal değerler ASCII karakter kullan`}
                            userPrompt={`Bulmaca FEN: ${puzzle.fen}
Temalar: ${puzzle.themes.join(', ') || 'genel taktik'}
Rating: ${puzzle.rating}
Doğru çözüm hamlesi: ${puzzle.movesUci[0]}
${status === 'solved' ? `Sonuç: Kullanıcı doğru çözdü.` : `Kullanıcının yanlış hamlesi: ${lastWrongUci ?? '(çözümü görmek istedi)'}.`}

${status === 'solved' ? 'Tebrik et ve bu taktik desenini 1-2 cümlede açıkla.' : 'Yanlış hamlenin neden başarısız olduğunu ve doğru hamlenin neden kazandığını açıkla.'}`}
                        />
                    )}

                    {/* Settings + stats */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Ayarlar</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-adv" className="text-sm">Otomatik geç</Label>
                                <Switch id="auto-adv" checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                                Çözüldükten sonra 2.5sn içinde otomatik bir sonraki bulmacaya geçer.
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">İstatistikler</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Row label="Toplam çözülen" value={totalSolved ?? 0} />
                            <Row label="Aktif seri" value={profile.puzzleStreak} />
                            <Row label="En iyi seri" value={profile.longestPuzzleStreak} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold">{value}</span>
        </div>
    )
}

function buildLegalDests(chess: Chess): Map<string, string[]> {
    const m = new Map<string, string[]>()
    for (const mv of chess.moves({ verbose: true })) {
        const arr = m.get(mv.from) ?? []
        arr.push(mv.to)
        m.set(mv.from, arr)
    }
    return m
}

function themeLabel(theme: string): string {
    const map: Record<string, string> = {
        mateIn1: 'Mat 1\'de',
        mateIn2: 'Mat 2\'de',
        mateIn3: 'Mat 3\'te',
        backRank: 'Geri Sıra',
        queenMate: 'Vezir Matı',
        ladderMate: 'Merdiven Matı',
        smotherMate: 'Boğma Matı',
        kingHunt: 'Şah Avı',
        simpleCapture: 'Basit Alma',
        promotion: 'Terfi',
        fork: 'Çatal',
        pin: 'Çivi',
        skewer: 'Şiş',
        discoveredAttack: 'Açma Saldırı',
        rookEnds: 'Kale Sonu',
        long: 'Uzun',
        middlegame: 'Orta Oyun',
        endgame: 'Oyun Sonu',
        opening: 'Açılış',
        advantage: 'Üstünlük',
    }
    return map[theme] ?? theme
}
