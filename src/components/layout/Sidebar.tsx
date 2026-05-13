import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Home, Swords, Puzzle, GraduationCap, LineChart,
    UserCircle, Settings, Crown, LogOut, LogIn,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const NAV_ITEMS: { to: string; key: string; icon: any; exact?: boolean }[] = [
    { to: '/app', key: 'home', icon: Home, exact: true },
    { to: '/app/play', key: 'play', icon: Swords },
    { to: '/app/puzzles', key: 'puzzles', icon: Puzzle },
    { to: '/app/lessons', key: 'lessons', icon: GraduationCap },
    { to: '/app/analysis', key: 'analysis', icon: LineChart },
    { to: '/app/profile', key: 'profile', icon: UserCircle },
    { to: '/app/settings', key: 'settings', icon: Settings },
]

export function Sidebar() {
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const elo = useProfileStore(s => s.elo)
    const streak = useProfileStore(s => s.currentStreak)
    const authUser = useAuthStore(s => s.user)
    const signOut = useAuthStore(s => s.signOut)

    const handleSignOut = async () => {
        await signOut()
        toast.success('Çıkış yapıldı')
        navigate('/')
    }

    return (
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-md">
            <div className="p-6 border-b border-border/40">
                <Link to="/app" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-none">ChessAetherius</div>
                        <div className="text-xs text-muted-foreground mt-1">{t('app.tagline')}</div>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-3 space-y-0.5">
                {NAV_ITEMS.map(({ to, key, icon: Icon, exact }) => {
                    const active = (exact || to === '/app')
                        ? location.pathname === to || location.pathname === '/app/'
                        : location.pathname.startsWith(to)
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
                {authUser ? (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                        {authUser.photoURL ? (
                            <img src={authUser.photoURL} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {authUser.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                            <div className="font-medium truncate">{authUser.displayName}</div>
                            <div className="text-muted-foreground truncate text-[10px]">{authUser.email}</div>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Çıkış yap">
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/login"><LogIn className="w-3.5 h-3.5" />Giriş Yap</Link>
                    </Button>
                )}
            </div>
        </aside>
    )
}
