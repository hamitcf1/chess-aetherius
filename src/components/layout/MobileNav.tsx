import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Swords, Puzzle, GraduationCap, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
    { to: '/', key: 'home', icon: Home },
    { to: '/play', key: 'play', icon: Swords },
    { to: '/puzzles', key: 'puzzles', icon: Puzzle },
    { to: '/lessons', key: 'lessons', icon: GraduationCap },
    { to: '/profile', key: 'profile', icon: UserCircle },
] as const

export function MobileNav() {
    const { t } = useTranslation()
    const loc = useLocation()
    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-md pb-safe">
            <div className="grid grid-cols-5 gap-1 px-1 py-1">
                {MOBILE_NAV.map(({ to, key, icon: Icon }) => {
                    const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
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
