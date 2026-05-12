import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfileStore } from '@/stores/profileStore'
import { Badge } from '@/components/ui/badge'

export function TopBar() {
    const { t } = useTranslation()
    const elo = useProfileStore(s => s.elo)
    return (
        <header className="md:hidden sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-md pt-safe">
            <div className="flex items-center justify-between px-4 h-14">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                        <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold">{t('app.name')}</span>
                </Link>
                <Badge variant="default" className="font-mono">{t('common.elo')} {elo}</Badge>
            </div>
        </header>
    )
}
