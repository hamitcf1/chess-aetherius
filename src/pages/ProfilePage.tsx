import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, Trophy, Target, Flame, Crown, Lock, Pencil, RotateCcw, Copy, Eye } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useProfileStore } from '@/stores/profileStore'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { db, getRecentGames } from '@/lib/db'
import { buildPgn } from '@/lib/pgn'
import { ACHIEVEMENTS, RARITY_STYLES } from '@/lib/achievements-data'
import { formatRelativeTime, cn } from '@/lib/utils'

export function ProfilePage() {
    const { t } = useTranslation()
    const profile = useProfileStore()
    const setUsername = useProfileStore(s => s.setUsername)
    const resetStats = useProfileStore(s => s.resetStats)
    const lang = useSettingsStore(s => s.language)
    const unlocked = useAchievementsStore(s => s.unlocked)
    const games = useLiveQuery(() => getRecentGames(20), [])
    const totalPuzzles = useLiveQuery(() => db.puzzles.filter(p => !!p.solvedAt).count(), [])
    const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0

    const [editOpen, setEditOpen] = useState(false)
    const [resetOpen, setResetOpen] = useState(false)
    const [nameDraft, setNameDraft] = useState(profile.username)

    const handleResetStats = async () => {
        resetStats()
        await db.games.clear()
        await db.puzzles.toCollection().modify({ solvedAt: undefined, attempts: 0, succeeded: false })
        toast.success(lang === 'tr' ? 'İstatistikler sıfırlandı, sıfırdan başlıyorsun!' : 'Stats reset, starting fresh!')
        setResetOpen(false)
    }

    const handleSaveName = () => {
        if (nameDraft.trim()) {
            setUsername(nameDraft.trim())
            toast.success(lang === 'tr' ? 'Kullanıcı adı güncellendi' : 'Username updated')
        }
        setEditOpen(false)
    }

    return (
        <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl text-white shadow-xl">
                            <Crown className="w-9 h-9" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold truncate">{profile.username}</h1>
                                <Button variant="ghost" size="icon-sm" onClick={() => { setNameDraft(profile.username); setEditOpen(true) }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('profile.memberSince')} {formatRelativeTime(profile.createdAt, lang)}</p>
                        </div>
                        <div className="text-right">
                            <Badge variant="default" className="text-base px-3 py-1 font-mono">{t('common.elo')} {profile.elo}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">{t('profile.peakElo')}: {profile.peakElo}</div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Reset stats action */}
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)} className="text-muted-foreground hover:text-destructive">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {lang === 'tr' ? 'İstatistikleri Sıfırla' : 'Reset Stats'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={TrendingUp} label={t('home.stats.winRate')} value={`${winRate}%`} />
                <StatCard icon={Target} label={t('home.stats.gamesPlayed')} value={profile.gamesPlayed} />
                <StatCard icon={Trophy} label={t('home.stats.puzzlesSolved')} value={totalPuzzles ?? 0} />
                <StatCard icon={Flame} label={t('home.stats.currentStreak')} value={profile.currentStreak} />
            </div>

            <Tabs defaultValue="achievements">
                <TabsList>
                    <TabsTrigger value="achievements">{t('profile.achievements')}</TabsTrigger>
                    <TabsTrigger value="games">{t('profile.gameHistory')}</TabsTrigger>
                </TabsList>

                <TabsContent value="achievements" className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                        {t('profile.unlocked', { count: unlocked.size, total: ACHIEVEMENTS.length })}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = unlocked.has(ach.id)
                            const Icon = (Icons as any)[ach.icon] ?? Trophy
                            const rarity = RARITY_STYLES[ach.rarity]
                            return (
                                <motion.div
                                    key={ach.id}
                                    whileHover={isUnlocked ? { scale: 1.03 } : undefined}
                                    className={cn(
                                        'rounded-xl border-2 p-3 text-center transition-all',
                                        isUnlocked
                                            ? `${rarity.bg} ${rarity.ring} ring-1 ${rarity.text}`
                                            : 'border-border/30 bg-muted/20 text-muted-foreground/50'
                                    )}
                                >
                                    <div className="w-12 h-12 mx-auto rounded-xl bg-card/50 flex items-center justify-center mb-2">
                                        {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                                    </div>
                                    <div className="font-semibold text-xs leading-tight">{t(ach.titleKey)}</div>
                                    <div className="text-[10px] mt-1 line-clamp-2 opacity-75">{t(ach.descKey)}</div>
                                </motion.div>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="games" className="space-y-2 mt-4">
                    {(!games || games.length === 0) ? (
                        <Card><CardContent className="py-10 text-center text-muted-foreground">{t('profile.noGames')}</CardContent></Card>
                    ) : (
                        games.map(g => {
                            const userWon = (g.userColor === 'w' && g.result === '1-0') || (g.userColor === 'b' && g.result === '0-1')
                            const isDraw = g.result === '1/2-1/2'
                            const eloChange = g.userEloAfter - g.userEloBefore
                            return (
                                <Card key={g.id} className="card-modern cursor-pointer hover:border-primary/40 transition-colors group">
                                    <CardContent className="p-3 flex items-center justify-between gap-2">
                                        <Link to="/app/analysis" state={{ gameId: g.id }} className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                                                userWon ? 'bg-success/20 text-success' : isDraw ? 'bg-muted text-muted-foreground' : 'bg-destructive/20 text-destructive'
                                            )}>
                                                {userWon ? '✓' : isDraw ? '=' : '✗'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{g.whiteName} vs {g.blackName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(g.createdAt, lang)} • {g.moves.length} ply • {t(`termination.${g.termination}`)}
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {eloChange !== 0 && (
                                                <Badge variant={eloChange > 0 ? 'success' : 'destructive'}>
                                                    {eloChange > 0 ? '+' : ''}{eloChange}
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                asChild
                                                title="Analiz et"
                                            >
                                                <Link to="/app/analysis" state={{ gameId: g.id }}>
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    const pgn = buildPgn(g)
                                                    navigator.clipboard.writeText(pgn)
                                                        .then(() => toast.success('PGN panoya kopyalandı'))
                                                        .catch(() => toast.error('Kopyalama başarısız'))
                                                }}
                                                title="PGN Kopyala"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit username dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-sm">
                    <DialogTitle>{lang === 'tr' ? 'Kullanıcı Adı' : 'Username'}</DialogTitle>
                    <div className="space-y-2 pt-2">
                        <Label>{t('profile.username')}</Label>
                        <input
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            autoFocus
                            maxLength={32}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveName} disabled={!nameDraft.trim()}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset stats confirm */}
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogContent className="max-w-sm">
                    <DialogTitle>{lang === 'tr' ? 'İstatistikleri Sıfırla' : 'Reset Stats'}</DialogTitle>
                    <DialogDescription>
                        {lang === 'tr'
                            ? 'ELO, oyun geçmişi, win/loss sayıların sıfırlanacak. Başarımların ve ders ilerlemen korunacak. Emin misin?'
                            : 'Your ELO, game history, and win/loss stats will be reset. Achievements and lesson progress will be kept. Are you sure?'}
                    </DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={handleResetStats}>
                            <RotateCcw className="w-4 h-4" />
                            {lang === 'tr' ? 'Sıfırla' : 'Reset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
    return (
        <Card className="card-modern">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
            </CardContent>
        </Card>
    )
}
