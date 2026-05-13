import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Swords, Puzzle, GraduationCap, LineChart, TrendingUp, Trophy, Flame, Target, Award } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useProfileStore } from '@/stores/profileStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, RARITY_STYLES } from '@/lib/achievements-data'
import { db, getRecentGames, getDailyPuzzle } from '@/lib/db'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'

export function HomePage() {
    const { t } = useTranslation()
    const profile = useProfileStore()
    const lang = useSettingsStore(s => s.language)
    const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0
    const recentGames = useLiveQuery(() => getRecentGames(5), [])
    const dailyPuzzle = useLiveQuery(() => getDailyPuzzle(), [])
    const achievementsRecords = useLiveQuery(() => db.achievements.orderBy('unlockedAt').reverse().limit(3).toArray(), [])
    const achievementsCount = useLiveQuery(() => db.achievements.count(), []) ?? 0
    const unlocked = useAchievementsStore(s => s.unlocked)

    // Find next "close-to-unlock" achievement (e.g. user is at 4 puzzle streak, almost 5)
    const nextAchievements = useMemo(() => {
        const candidates: { id: string; titleKey: string; descKey: string; icon: string; rarity: string; progress: number; target: number }[] = []
        for (const a of ACHIEVEMENTS) {
            if (unlocked.has(a.id)) continue
            let cur = 0
            let tgt = a.target ?? 1
            if (a.id.startsWith('puzzle_streak_')) cur = profile.puzzleStreak
            else if (a.id.startsWith('solve_') && a.id.includes('puzzles')) cur = profile.gamesPlayed // approx via Dexie; fallback
            else if (a.id === 'first_win') { cur = profile.wins > 0 ? 1 : 0; tgt = 1 }
            else if (a.id === 'first_game') { cur = profile.gamesPlayed > 0 ? 1 : 0; tgt = 1 }
            else if (a.id.startsWith('rating_')) { cur = profile.elo; tgt = a.target ?? 0 }
            else continue
            if (tgt > 0 && cur < tgt) candidates.push({ id: a.id, titleKey: a.titleKey, descKey: a.descKey, icon: a.icon, rarity: a.rarity, progress: cur, target: tgt })
        }
        // Sort by completion percentage descending
        return candidates.sort((a, b) => (b.progress / b.target) - (a.progress / a.target)).slice(0, 3)
    }, [unlocked, profile.puzzleStreak, profile.gamesPlayed, profile.wins, profile.elo])

    return (
        <div className="container mx-auto max-w-6xl p-4 md:p-8 space-y-8">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 p-6 md:p-10"
            >
                <div className="max-w-3xl">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gradient-primary">
                        {t('home.title')}
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg mb-6">
                        {t('home.subtitle')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="lg" variant="default">
                            <Link to="/app/play"><Swords className="w-5 h-5" />{t('home.playNow')}</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link to="/app/puzzles"><Puzzle className="w-5 h-5" />{t('home.tryPuzzle')}</Link>
                        </Button>
                        <Button asChild size="lg" variant="ghost">
                            <Link to="/app/lessons"><GraduationCap className="w-5 h-5" />{t('home.startLearning')}</Link>
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatTile icon={TrendingUp} label={t('home.stats.yourElo')} value={profile.elo} accent="primary" />
                <StatTile icon={Swords} label={t('home.stats.gamesPlayed')} value={profile.gamesPlayed} />
                <StatTile icon={Trophy} label={t('home.stats.achievementsUnlocked')} value={achievementsCount ?? 0} />
                <StatTile icon={Flame} label={t('home.stats.currentStreak')} value={profile.currentStreak} accent="warning" />
            </div>

            {/* Daily puzzle hero */}
            {dailyPuzzle && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <Link to="/app/puzzles">
                        <Card className="card-modern overflow-hidden relative border-accent/30 bg-gradient-to-r from-accent/10 to-transparent hover:border-accent/60 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shrink-0 shadow-lg">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-bold">Günün Bulmacası</div>
                                        <Badge variant="accent" className="text-[10px]">{dailyPuzzle.rating}</Badge>
                                        {dailyPuzzle.solvedAt && <Badge variant="success" className="text-[10px]">Çözüldü</Badge>}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {dailyPuzzle.themes.slice(0, 3).join(' · ') || 'Taktik'}
                                    </div>
                                </div>
                                <div className="text-accent text-2xl">→</div>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            )}

            {/* Quick actions grid */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">{t('home.quickActions.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <QuickAction to="/app/play" icon={Swords} title={t('home.quickActions.playVsAi')} desc={t('home.quickActions.playVsAiDesc')} />
                    <QuickAction to="/app/puzzles" icon={Target} title={t('home.quickActions.dailyPuzzle')} desc={t('home.quickActions.dailyPuzzleDesc')} />
                    <QuickAction to="/app/lessons" icon={GraduationCap} title={t('home.quickActions.continueLesson')} desc={t('home.quickActions.continueLessonDesc')} />
                    <QuickAction to="/app/analysis" icon={LineChart} title={t('home.quickActions.analyzeGame')} desc={t('home.quickActions.analyzeGameDesc')} />
                </div>
            </section>

            {/* Achievements widget */}
            <section className="grid lg:grid-cols-2 gap-3">
                {/* Yakın başarımlar */}
                <Card className="card-modern">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="w-4 h-4 text-accent" />
                            Yakın Başarımlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {nextAchievements.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                Devam et — yeni başarımlar açılacak.
                            </div>
                        ) : (
                            nextAchievements.map(a => {
                                const Icon = (Icons as any)[a.icon] ?? Trophy
                                const pct = Math.min(100, (a.progress / a.target) * 100)
                                const rarity = RARITY_STYLES[a.rarity]
                                return (
                                    <div key={a.id} className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', rarity.bg)}>
                                                <Icon className={cn('w-4 h-4', rarity.text)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{t(a.titleKey)}</div>
                                                <div className="text-[10px] text-muted-foreground line-clamp-1">{t(a.descKey)}</div>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground tabular-nums">{a.progress}/{a.target}</span>
                                        </div>
                                        <Progress value={pct} className="h-1.5" />
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Açılan başarımlar progress */}
                <Card className="card-modern">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400" />
                            Başarım Koleksiyonu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold tabular-nums">{achievementsCount}</span>
                            <span className="text-sm text-muted-foreground pb-1">/ {ACHIEVEMENTS.length}</span>
                        </div>
                        <Progress value={(achievementsCount / ACHIEVEMENTS.length) * 100} className="h-2" />
                        {achievementsRecords && achievementsRecords.length > 0 && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-2 mt-2">Son açılanlar</div>
                                <div className="flex gap-2">
                                    {achievementsRecords.map(r => {
                                        const def = ACHIEVEMENT_MAP.get(r.id)
                                        if (!def) return null
                                        const Icon = (Icons as any)[def.icon] ?? Trophy
                                        const rarity = RARITY_STYLES[def.rarity]
                                        return (
                                            <div key={r.id} className={cn('w-10 h-10 rounded-lg flex items-center justify-center ring-1', rarity.bg, rarity.ring, rarity.text)} title={t(def.titleKey)}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        <Link to="/app/profile" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                            Tüm başarımları gör →
                        </Link>
                    </CardContent>
                </Card>
            </section>

            {/* Recent games */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('home.recentGames')}</h2>
                    {recentGames && recentGames.length > 0 && (
                        <Link to="/app/profile" className="text-sm text-primary hover:underline">
                            {t('home.viewAll')} →
                        </Link>
                    )}
                </div>
                {(!recentGames || recentGames.length === 0) ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">
                        {t('home.noGamesYet')}
                    </CardContent></Card>
                ) : (
                    <div className="space-y-2">
                        {recentGames.map(g => {
                            const userWon = (g.userColor === 'w' && g.result === '1-0') || (g.userColor === 'b' && g.result === '0-1')
                            const isDraw = g.result === '1/2-1/2'
                            const isLoss = g.result !== '*' && !userWon && !isDraw
                            const eloChange = g.userEloAfter - g.userEloBefore
                            return (
                                <Link key={g.id} to="/app/analysis" state={{ gameId: g.id }}>
                                    <Card className="card-modern cursor-pointer hover:border-primary/40 transition-colors">
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${userWon ? 'bg-success/20 text-success' : isLoss ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                    {userWon ? '✓' : isDraw ? '=' : '✗'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {g.whiteName} vs {g.blackName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(g.createdAt, lang)} · {g.moves.length} hamle · AI {g.aiElo}
                                                    </div>
                                                </div>
                                            </div>
                                            {eloChange !== 0 && (
                                                <Badge variant={eloChange > 0 ? 'success' : 'destructive'} className="shrink-0">
                                                    {eloChange > 0 ? '+' : ''}{eloChange}
                                                </Badge>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

function StatTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: 'primary' | 'warning' }) {
    return (
        <Card className="card-modern">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                    <Icon className={`w-4 h-4 ${accent === 'primary' ? 'text-primary' : accent === 'warning' ? 'text-warning' : ''}`} />
                    <span className="line-clamp-1">{label}</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
            </CardContent>
        </Card>
    )
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
    return (
        <Link to={to}>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Card className="card-modern h-full">
                    <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-3">
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="font-semibold text-sm mb-1">{title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
                    </CardContent>
                </Card>
            </motion.div>
        </Link>
    )
}
