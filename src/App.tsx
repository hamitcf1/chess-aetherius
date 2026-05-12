import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { Confetti } from '@/components/Confetti'
import { HomePage } from '@/pages/HomePage'
import { PlayPage } from '@/pages/PlayPage'
import { PuzzlesPage } from '@/pages/PuzzlesPage'
import { LessonsPage } from '@/pages/LessonsPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAchievementWatcher } from '@/hooks/useAchievementWatcher'
import { seedPuzzles } from '@/lib/puzzle-seeder'

function ThemeBootstrap() {
    const theme = useSettingsStore(s => s.theme)
    useEffect(() => {
        const root = document.documentElement
        root.classList.remove('dark', 'midnight', 'light')
        if (theme === 'dark') root.classList.add('dark')
        else if (theme === 'midnight') root.classList.add('midnight')
        else root.classList.add('light')
    }, [theme])
    return null
}

function GlobalEffects({ onConfetti }: { onConfetti: () => void }) {
    const loadAchievements = useAchievementsStore(s => s.load)
    const queueLength = useAchievementsStore(s => s.queue.length)
    useEffect(() => {
        loadAchievements().catch(console.error)
        seedPuzzles().catch(console.error)
    }, [loadAchievements])
    useAchievementWatcher()
    // Sadece queueLength değişimine bağlı — onConfetti'ye bağımlılık ekleme
    // yoksa parent re-render'larında sonsuz döngü olur
    useEffect(() => {
        if (queueLength > 0) onConfetti()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queueLength])
    return null
}

export default function App() {
    const [confettiTrigger, setConfettiTrigger] = useState(0)
    const handleConfetti = useCallback(() => setConfettiTrigger(t => t + 1), [])
    return (
        <BrowserRouter>
            <TooltipProvider delayDuration={200}>
                <ThemeBootstrap />
                <GlobalEffects onConfetti={handleConfetti} />
                <AppLayout>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/play" element={<PlayPage />} />
                        <Route path="/puzzles" element={<PuzzlesPage />} />
                        <Route path="/lessons" element={<LessonsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AppLayout>
                <Confetti trigger={confettiTrigger} />
                <Toaster position="top-right" richColors />
            </TooltipProvider>
        </BrowserRouter>
    )
}
