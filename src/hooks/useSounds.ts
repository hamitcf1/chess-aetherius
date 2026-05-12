import { useMemo } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { makeSoundPlayer } from '@/lib/sounds'

export function useSounds() {
    const settings = useSettingsStore()
    return useMemo(() => makeSoundPlayer(() => ({
        master: settings.soundEnabled,
        move: settings.moveSoundEnabled,
        capture: settings.captureSoundEnabled,
        victory: settings.victorySoundEnabled,
    })), [settings.soundEnabled, settings.moveSoundEnabled, settings.captureSoundEnabled, settings.victorySoundEnabled])
}
