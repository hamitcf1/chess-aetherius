import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'

export type Theme = 'dark' | 'light' | 'midnight'
export type Language = 'tr' | 'en'
export type BoardTheme = 'green' | 'brown' | 'blue' | 'purple'
export type PieceSet = 'cburnett' | 'merida' | 'alpha'
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3-flash-preview' | 'gemini-3-pro-preview'

interface SettingsState {
    theme: Theme
    language: Language
    boardTheme: BoardTheme
    pieceSet: PieceSet
    geminiModel: GeminiModel

    // Audio
    soundEnabled: boolean
    moveSoundEnabled: boolean
    captureSoundEnabled: boolean
    victorySoundEnabled: boolean

    // Board
    showCoordinates: boolean
    showLegalMoves: boolean
    highlightLastMove: boolean
    autoQueenPromotion: boolean
    boardAnimation: boolean

    // AI
    aiCoachingEnabled: boolean
}

interface SettingsActions {
    setTheme: (t: Theme) => void
    setLanguage: (l: Language) => void
    setBoardTheme: (b: BoardTheme) => void
    setPieceSet: (p: PieceSet) => void
    setGeminiModel: (m: GeminiModel) => void
    setSoundEnabled: (v: boolean) => void
    setShowCoordinates: (v: boolean) => void
    setShowLegalMoves: (v: boolean) => void
    setHighlightLastMove: (v: boolean) => void
    setAutoQueenPromotion: (v: boolean) => void
    setAiCoachingEnabled: (v: boolean) => void
    toggle: (key: keyof Pick<SettingsState, 'soundEnabled' | 'moveSoundEnabled' | 'captureSoundEnabled' | 'victorySoundEnabled' | 'showCoordinates' | 'showLegalMoves' | 'highlightLastMove' | 'autoQueenPromotion' | 'aiCoachingEnabled' | 'boardAnimation'>) => void
}

type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            language: 'tr',
            boardTheme: 'green',
            pieceSet: 'cburnett',
            geminiModel: 'gemini-2.5-flash',

            soundEnabled: true,
            moveSoundEnabled: true,
            captureSoundEnabled: true,
            victorySoundEnabled: true,

            showCoordinates: true,
            showLegalMoves: true,
            highlightLastMove: true,
            autoQueenPromotion: false,
            boardAnimation: true,

            aiCoachingEnabled: true,

            setTheme: (theme) => {
                set({ theme })
                applyTheme(theme)
            },
            setLanguage: (language) => {
                set({ language })
                i18n.changeLanguage(language)
                document.documentElement.lang = language
            },
            setBoardTheme: (boardTheme) => set({ boardTheme }),
            setPieceSet: (pieceSet) => set({ pieceSet }),
            setGeminiModel: (geminiModel) => set({ geminiModel }),
            setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
            setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
            setShowLegalMoves: (showLegalMoves) => set({ showLegalMoves }),
            setHighlightLastMove: (highlightLastMove) => set({ highlightLastMove }),
            setAutoQueenPromotion: (autoQueenPromotion) => set({ autoQueenPromotion }),
            setAiCoachingEnabled: (aiCoachingEnabled) => set({ aiCoachingEnabled }),
            toggle: (key) => set((s) => ({ [key]: !s[key] } as Partial<SettingsState>)),
        }),
        {
            name: 'satranc-settings',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    applyTheme(state.theme)
                    i18n.changeLanguage(state.language)
                    document.documentElement.lang = state.language
                }
            },
        }
    )
)

function applyTheme(theme: Theme) {
    const root = document.documentElement
    root.classList.remove('dark', 'midnight', 'light')
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'midnight') root.classList.add('midnight')
    else root.classList.add('light')
}
