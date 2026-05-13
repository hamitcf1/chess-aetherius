import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { Confetti } from '@/components/Confetti'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { PlayPage } from '@/pages/PlayPage'
import { PuzzlesPage } from '@/pages/PuzzlesPage'
import { LessonsPage } from '@/pages/LessonsPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAchievementsStore } from '@/stores/achievementsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAchievementWatcher } from '@/hooks/useAchievementWatcher'
import { useCloudSync } from '@/hooks/useCloudSync'
import { seedPuzzles } from '@/lib/puzzle-seeder'
import { isFirebaseConfigured } from '@/lib/firebase'

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
    const initAuth = useAuthStore(s => s.initialize)

    useEffect(() => {
        loadAchievements().catch(console.error)
        seedPuzzles().catch(console.error)
    }, [loadAchievements])

    useEffect(() => {
        if (!isFirebaseConfigured) return
        const unsub = initAuth()
        return () => unsub?.()
    }, [initAuth])

    useAchievementWatcher()
    useCloudSync()

    useEffect(() => {
        if (queueLength > 0) onConfetti()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queueLength])
    return null
}

function AppShell() {
    return (
        <AppLayout>
            <Routes>
                <Route index element={<HomePage />} />
                <Route path="play" element={<PlayPage />} />
                <Route path="puzzles" element={<PuzzlesPage />} />
                <Route path="lessons" element={<LessonsPage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
        </AppLayout>
    )
}

export default function App() {
    const [confettiTrigger, setConfettiTrigger] = useState(0)
    const handleConfetti = useCallback(() => setConfettiTrigger(t => t + 1), [])

    return (
        <BrowserRouter>
            <TooltipProvider delayDuration={200}>
                <ThemeBootstrap />
                <GlobalEffects onConfetti={handleConfetti} />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/app/*" element={<AppShell />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Confetti trigger={confettiTrigger} />
                <Toaster position="top-right" richColors theme="dark" />
            </TooltipProvider>
        </BrowserRouter>
    )
}
