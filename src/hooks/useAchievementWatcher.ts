import { useEffect } from 'react'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useSounds } from './useSounds'

/**
 * Subscribes to the achievement queue and shows a sonner toast for each
 * unlocked achievement. Dequeues sequentially so toasts don't pile up.
 */
export function useAchievementWatcher() {
    const queueFirst = useAchievementsStore(s => s.queue[0])
    const queueLength = useAchievementsStore(s => s.queue.length)
    const dequeue = useAchievementsStore(s => s.dequeue)
    const { t } = useTranslation()
    const sounds = useSounds()

    useEffect(() => {
        if (queueLength === 0 || !queueFirst) return
        sounds.achievement()
        toast.success(`🏆 ${t('achievements.unlocked')}`, {
            description: t(queueFirst.titleKey) + ' — ' + t(queueFirst.descKey),
            duration: 4500,
            className: 'border-amber-500/40 bg-amber-500/5',
        })
        const id = setTimeout(() => dequeue(), 1200)
        return () => clearTimeout(id)
        // Only re-run when the first item changes (or queue empties).
        // Excluding sounds/t/dequeue avoids stale-closure infinite loops.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queueFirst?.id, queueLength])
}
