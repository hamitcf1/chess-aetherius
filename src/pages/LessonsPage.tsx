import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, BookOpen, Sword, Castle, Brain, ChevronRight, CheckCircle2, XCircle, Lightbulb } from 'lucide-react'
import { Chess } from 'chess.js'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Chessboard } from '@/components/board/Chessboard'
import { CoachPanel } from '@/components/ai/CoachPanel'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { loadLessons, lessonTitle, lessonDesc, stepDesc, type LessonData } from '@/lib/lessons-loader'
import { db } from '@/lib/db'
import { evaluateAchievements } from '@/lib/achievements-rules'
import { useProfileStore } from '@/stores/profileStore'
import { useLiveQuery } from 'dexie-react-hooks'

const CATEGORY_ICONS = {
    basics: BookOpen,
    opening: Castle,
    tactic: Sword,
    endgame: GraduationCap,
    strategy: Brain,
}

export function LessonsPage() {
    const { t } = useTranslation()
    const lang = useSettingsStore(s => s.language)
    const [allLessons, setAllLessons] = useState<LessonData[]>([])
    const [activeLesson, setActiveLesson] = useState<LessonData | null>(null)
    const [stepIdx, setStepIdx] = useState(0)
    const completed = useLiveQuery(() => db.lessons.toArray(), [])
    const completedIds = useMemo(() => new Set((completed ?? []).filter(l => l.completedAt).map(l => l.lessonId)), [completed])

    useEffect(() => { loadLessons().then(setAllLessons) }, [])

    const categories = ['basics', 'opening', 'tactic', 'endgame', 'strategy'] as const

    if (activeLesson) {
        return (
            <LessonPlayer
                lesson={activeLesson}
                stepIdx={stepIdx}
                onAdvance={() => setStepIdx(s => s + 1)}
                onBack={() => { setActiveLesson(null); setStepIdx(0) }}
            />
        )
    }

    return (
        <div className="container mx-auto max-w-6xl p-4 md:p-6">
            <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{t('lessons.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('lessons.subtitle')}</p>
                </div>
                <Badge variant="default" className="gap-1.5 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {completedIds.size} / {allLessons.length}
                </Badge>
            </header>

            <Tabs defaultValue="basics">
                <TabsList className="w-full justify-start overflow-x-auto">
                    {categories.map(c => (
                        <TabsTrigger key={c} value={c} className="gap-1.5">
                            {t(`lessons.categories.${c}`)}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {categories.map(c => {
                    const lessons = allLessons.filter(l => l.category === c)
                    return (
                        <TabsContent key={c} value={c} className="mt-4">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {lessons.map(lesson => {
                                    const Icon = CATEGORY_ICONS[lesson.category]
                                    const isDone = completedIds.has(lesson.id)
                                    return (
                                        <motion.div key={lesson.id} whileHover={{ y: -2 }}>
                                            <Card className="card-modern h-full cursor-pointer" onClick={() => { setActiveLesson(lesson); setStepIdx(0) }}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>
                                                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <CardTitle className="text-sm leading-tight">{lessonTitle(lesson, lang as 'tr' | 'en')}</CardTitle>
                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                <Badge variant="outline" className="text-[10px]">{t(`lessons.difficulty${lesson.difficulty}`)}</Badge>
                                                                <Badge variant="secondary" className="text-[10px]">{lesson.steps.length} adım</Badge>
                                                                {isDone && <Badge variant="success" className="text-[10px]">{t('lessons.completed')}</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{lessonDesc(lesson, lang as 'tr' | 'en')}</p>
                                                    <Button variant="ghost" size="sm" className="w-full mt-3 justify-between">
                                                        {isDone ? t('lessons.continueLesson') : t('lessons.startLesson')}
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                                {lessons.length === 0 && (
                                    <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-10 text-center text-muted-foreground">Yakında daha fazla ders eklenecek.</CardContent></Card>
                                )}
                            </div>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    )
}

function LessonPlayer({ lesson, stepIdx, onAdvance, onBack }: { lesson: LessonData; stepIdx: number; onAdvance: () => void; onBack: () => void }) {
    const { t } = useTranslation()
    const settings = useSettingsStore()
    const lang = settings.language as 'tr' | 'en'
    const unlock = useAchievementsStore(s => s.unlock)
    const [stepStatus, setStepStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')

    const isDone = stepIdx >= lesson.steps.length

    useEffect(() => {
        if (isDone) {
            // Mark lesson complete + check achievements
            (async () => {
                await db.lessons.put({ lessonId: lesson.id, completedSteps: lesson.steps.length, completedAt: Date.now() })
                const allBasics = await db.lessons.where('completedAt').above(0).toArray()
                const profile = useProfileStore.getState()
                const newAchs = evaluateAchievements({
                    type: 'lesson_completed',
                    lessonId: lesson.id,
                    profile,
                    totalCompleted: allBasics.length,
                    allBasicsDone: false, // could compute, leave for follow-up
                })
                if (newAchs.length) unlock(newAchs)
            })()
        }
    }, [isDone, lesson.id, lesson.steps.length, unlock])

    if (isDone) {
        return (
            <div className="container mx-auto max-w-2xl p-4 md:p-6">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card>
                        <CardContent className="p-10 text-center space-y-4">
                            <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}>
                                <CheckCircle2 className="w-20 h-20 mx-auto text-success" />
                            </motion.div>
                            <h2 className="text-3xl font-bold">{t('lessons.lessonComplete')}</h2>
                            <p className="text-muted-foreground">{lessonTitle(lesson, lang)}</p>
                            <Button onClick={onBack} size="lg">{t('common.back')}</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    const step = lesson.steps[stepIdx]
    const chess = new Chess(step.fen)
    const turn = chess.turn() === 'w' ? 'white' : 'black'
    const isInteractive = !!step.expectedUci

    const legalDests = isInteractive ? buildLegalDests(chess) : new Map<string, string[]>()

    const handleMove = (from: string, to: string) => {
        if (!isInteractive || stepStatus === 'correct') return
        const piece = chess.get(from as any)
        const isPawn = piece?.type === 'p'
        const promoRank = to[1]
        const isPromotion = isPawn && (promoRank === '1' || promoRank === '8')
        const uci = from + to + (isPromotion ? 'q' : '')
        const expected = step.expectedUci!.toLowerCase()
        if (uci === expected) {
            setStepStatus('correct')
            toast.success(t('lessons.wellDone'))
            setTimeout(() => { setStepStatus('idle'); onAdvance() }, 800)
        } else {
            setStepStatus('incorrect')
            toast.error(t('lessons.tryAgain'))
            setTimeout(() => setStepStatus('idle'), 1200)
        }
    }

    return (
        <div className="container mx-auto max-w-5xl p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={onBack}>← {t('common.back')}</Button>
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm hidden sm:block">{lessonTitle(lesson, lang)}</h2>
                    <Badge variant="default">{t('lessons.stepXofY', { current: stepIdx + 1, total: lesson.steps.length })}</Badge>
                </div>
            </header>

            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                <div className="max-w-2xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={stepIdx}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            <Chessboard
                                fen={step.fen}
                                orientation={turn}
                                turnColor={turn}
                                viewOnly={!isInteractive || stepStatus === 'correct'}
                                movableDests={legalDests}
                                movableColor={isInteractive ? turn : 'none'}
                                onMove={handleMove}
                                showCoordinates={settings.showCoordinates}
                                showLegalMoves={settings.showLegalMoves}
                                boardTheme={settings.boardTheme}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="space-y-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{lessonTitle(lesson, lang)}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm leading-relaxed">{stepDesc(step, lang)}</p>
                            {isInteractive && (
                                <div className="flex items-center gap-2 text-xs">
                                    {stepStatus === 'idle' && (
                                        <span className="flex items-center gap-1.5 text-primary"><Lightbulb className="w-3.5 h-3.5" />Sıra sende — doğru hamleyi bul</span>
                                    )}
                                    {stepStatus === 'correct' && (
                                        <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="w-3.5 h-3.5" />Doğru!</span>
                                    )}
                                    {stepStatus === 'incorrect' && (
                                        <span className="flex items-center gap-1.5 text-destructive"><XCircle className="w-3.5 h-3.5" />Tekrar dene</span>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {!isInteractive && (
                        <Button onClick={onAdvance} size="lg" className="w-full">
                            {t('common.continue')}
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}

                    {settings.aiCoachingEnabled && (
                        <CoachPanel
                            title={t('lessons.askCoach')}
                            autoRun={false}
                            systemPrompt="Sen bir satranç eğitmenisin. Kullanıcı bir derste pozisyonu öğreniyor. 2-3 cümlede pozisyonu daha derinlemesine açıkla."
                            userPrompt={`Ders: ${lessonTitle(lesson, lang)}\nAdım: ${stepDesc(step, lang)}\nFEN: ${step.fen}\n\nBu adımı daha derin açıkla — neden bu pozisyon önemli?`}
                        />
                    )}
                </div>
            </div>
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
