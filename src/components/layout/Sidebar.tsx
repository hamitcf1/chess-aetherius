import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Home, Swords, Puzzle, GraduationCap, LineChart,
    UserCircle, Settings, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
    { to: '/', key: 'home', icon: Home },
    { to: '/play', key: 'play', icon: Swords },
    { to: '/puzzles', key: 'puzzles', icon: Puzzle },
    { to: '/lessons', key: 'lessons', icon: GraduationCap },
    { to: '/analysis', key: 'analysis', icon: LineChart },
    { to: '/profile', key: 'profile', icon: UserCircle },
    { to: '/settings', key: 'settings', icon: Settings },
] as const

export function Sidebar() {
    const { t } = useTranslation()
    const location = useLocation()
    const elo = useProfileStore(s => s.elo)
    const streak = useProfileStore(s => s.currentStreak)

    return (
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-md">
            <div className="p-6 border-b border-border/40">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-none">{t('app.name')}</div>
                        <div className="text-xs text-muted-foreground mt-1">{t('app.tagline')}</div>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-3 space-y-0.5">
                {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
                    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                    return (
                        <Link
                            key={key}
                            to={to}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                active
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                            )}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{t(`nav.${key}`)}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{t('common.elo')}</span>
                    <Badge variant="default" className="font-mono">{elo}</Badge>
                </div>
                {streak > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
                        <span className="text-xs text-amber-300">🔥 Seri</span>
                        <span className="text-sm font-bold text-amber-300">{streak}</span>
                    </div>
                )}
            </div>
        </aside>
    )
}
