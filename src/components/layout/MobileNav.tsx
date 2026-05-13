import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Swords, Puzzle, GraduationCap, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV: { to: string; key: string; icon: any; exact?: boolean }[] = [
    { to: '/app', key: 'home', icon: Home, exact: true },
    { to: '/app/play', key: 'play', icon: Swords },
    { to: '/app/puzzles', key: 'puzzles', icon: Puzzle },
    { to: '/app/lessons', key: 'lessons', icon: GraduationCap },
    { to: '/app/profile', key: 'profile', icon: UserCircle },
]

export function MobileNav() {
    const { t } = useTranslation()
    const loc = useLocation()
    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-md pb-safe">
            <div className="grid grid-cols-5 gap-1 px-1 py-1">
                {MOBILE_NAV.map(({ to, key, icon: Icon, exact }) => {
                    const active = exact
                        ? loc.pathname === to || loc.pathname === '/app/'
                        : loc.pathname.startsWith(to)
                    return (
                        <Link
                            key={key}
                            to={to}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors',
                                active ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px]">{t(`nav.${key}`)}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
