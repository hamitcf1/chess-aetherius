import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, SkipForward, Eye, Target, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Chessboard } from '@/components/board/Chessboard'
import { HintButton } from '@/components/ai/HintButton'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useProfileStore } from '@/stores/profileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Chess } from 'chess.js'
import { evaluateAchievements } from '@/lib/achievements-rules'

export function PuzzlesPage() {
    const { t } = useTranslation()
    const { puzzle, status, fen, sessionSolved, sessionFailed, loadNext, attemptMove, reset } = usePuzzleStore()
    const profile = useProfileStore()
    const settings = useSettingsStore()
    const unlock = useAchievementsStore(s => s.unlock)
    const totalSolved = useLiveQuery(() => db.puzzles.filter(p => !!p.solvedAt).count(), [])

    useEffect(() => {
        if (status === 'idle') loadNext()
    }, [status, loadNext])

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

    const chess = puzzle ? new Chess(fen) : new Chess()
    const turn = chess.turn() === 'w' ? 'white' : 'black'
    const legalDests = puzzle ? buildLegalDests(chess) : new Map<string, string[]>()

    const handleMove = (from: string, to: string) => {
        if (status !== 'active') return
        const piece = chess.get(from as any)
        const isPawn = piece?.type === 'p'
        const promoRank = to[1]
        const isPromotion = isPawn && (promoRank === '1' || promoRank === '8')
        const uci = from + to + (isPromotion ? 'q' : '')
        attemptMove(uci)
    }

    return (
        <div className="container mx-auto max-w-6xl p-4 md:p-6">
            <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{t('puzzles.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('puzzles.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="default" className="gap-1.5 py-1.5"><Target className="w-3.5 h-3.5" />{profile.puzzleElo}</Badge>
                    {profile.puzzleStreak > 0 && (
                        <Badge variant="warning" className="gap-1.5 py-1.5"><Flame className="w-3.5 h-3.5" />{profile.puzzleStreak}</Badge>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                <div className="space-y-3">
                    <div className="max-w-2xl mx-auto w-full">
                        <Chessboard
                            fen={fen}
                            orientation={turn}
                            turnColor={turn}
                            movableDests={legalDests}
                            movableColor={status === 'active' ? turn : 'none'}
                            onMove={handleMove}
                            showCoordinates={settings.showCoordinates}
                            showLegalMoves={false}
                            boardTheme={settings.boardTheme}
                        />
                    </div>

                    {status === 'solved' && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <Card className="border-success/40 bg-success/10">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-success" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-success">{t('puzzles.solved')}</div>
                                    </div>
                                    <Button onClick={() => { reset(); loadNext() }}>
                                        <SkipForward className="w-4 h-4" />
                                        {t('puzzles.nextPuzzle')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {status === 'failed' && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <Card className="border-destructive/40 bg-destructive/10">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <XCircle className="w-6 h-6 text-destructive" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-destructive">{t('puzzles.incorrect')}</div>
                                    </div>
                                    <Button variant="outline" onClick={() => { reset(); loadNext() }}>
                                        <SkipForward className="w-4 h-4" />
                                        {t('puzzles.nextPuzzle')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                <div className="space-y-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>{t('puzzles.findBestMove')}</span>
                                {puzzle && <Badge variant="outline">{puzzle.rating}</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {puzzle && (
                                <>
                                    <div className="text-sm text-muted-foreground">
                                        {t('puzzles.whoseTurn', { color: turn === 'white' ? t('common.white') : t('common.black') })}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {puzzle.themes.slice(0, 5).map(theme => (
                                            <Badge key={theme} variant="secondary" className="text-[10px]">{theme}</Badge>
                                        ))}
                                    </div>
                                    {status === 'active' && settings.aiCoachingEnabled && (
                                        <HintButton
                                            fen={fen}
                                            bestMoveUci={puzzle.movesUci[1]}
                                            themes={puzzle.themes}
                                        />
                                    )}
                                </>
                            )}
                            {!puzzle && (
                                <div className="text-sm text-muted-foreground">{t('puzzles.noPuzzlesYet')}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">İstatistikler</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Row label={t('puzzles.totalSolved')} value={totalSolved ?? 0} />
                            <Row label={t('puzzles.currentStreak')} value={profile.puzzleStreak} />
                            <Row label={t('puzzles.bestStreak')} value={profile.longestPuzzleStreak} />
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
