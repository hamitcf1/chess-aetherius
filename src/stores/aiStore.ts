import { create } from 'zustand'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useSettingsStore } from './settingsStore'

export type GeminiModelId =
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'gemini-3-flash-preview'
    | 'gemini-3-pro-preview'

const GEMINI_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
    import.meta.env.VITE_GEMINI_API_KEY_7,
    import.meta.env.VITE_GEMINI_API_KEY_8,
    import.meta.env.VITE_GEMINI_API_KEY_9,
    import.meta.env.VITE_GEMINI_API_KEY_10,
    import.meta.env.VITE_GEMINI_API_KEY_11,
    import.meta.env.VITE_GEMINI_API_KEY_12,
    import.meta.env.VITE_GEMINI_API_KEY_13,
].filter(Boolean) as string[]

export interface GenerateOptions {
    systemPrompt: string
    userPrompt: string
    model?: GeminiModelId
    temperature?: number
}

interface AIState {
    loading: boolean
    error: string | null
    currentKeyIndex: number
    hasKeys: boolean
}

interface AIActions {
    generate: (opts: GenerateOptions) => Promise<string | null>
    clearError: () => void
}

type AIStore = AIState & AIActions

const LANG_LABEL: Record<string, string> = {
    tr: 'Türkçe',
    en: 'English',
}

export const useAIStore = create<AIStore>((set, get) => ({
    loading: false,
    error: null,
    currentKeyIndex: 0,
    hasKeys: GEMINI_KEYS.length > 0,

    clearError: () => set({ error: null }),

    generate: async ({ systemPrompt, userPrompt, model, temperature = 0.7 }) => {
        if (GEMINI_KEYS.length === 0) {
            set({ error: 'no_keys' })
            return null
        }

        const startIdx = get().currentKeyIndex
        const userLang = useSettingsStore.getState().language
        const modelId = model ?? useSettingsStore.getState().geminiModel

        const langLabel = LANG_LABEL[userLang] ?? 'Türkçe'
        const langInstruction = `\n\n[LANGUAGE RULE]\nCevaplarını mutlaka ${langLabel} dilinde ver. Asla başka bir dilde yazma.`
        const fullSystem = systemPrompt + langInstruction

        set({ loading: true, error: null })

        // Try up to N keys before giving up
        const maxTries = Math.min(GEMINI_KEYS.length, 5)
        for (let attempt = 0; attempt < maxTries; attempt++) {
            const idx = (startIdx + attempt) % GEMINI_KEYS.length
            const apiKey = GEMINI_KEYS[idx]
            try {
                const genAI = new GoogleGenerativeAI(apiKey)
                const m = genAI.getGenerativeModel({
                    model: modelId,
                    systemInstruction: fullSystem,
                    generationConfig: { temperature },
                })
                const result = await m.generateContent(userPrompt)
                const text = result.response.text()

                set({
                    loading: false,
                    currentKeyIndex: (idx + 1) % GEMINI_KEYS.length,
                })
                return text
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                const isRateLimit = /quota|rate|429|resource_exhausted/i.test(msg)
                if (!isRateLimit && attempt === 0) {
                    // Non-rate-limit error — bail immediately
                    console.error('Gemini error:', msg)
                    set({ loading: false, error: msg, currentKeyIndex: (idx + 1) % GEMINI_KEYS.length })
                    return null
                }
                // Otherwise rotate to next key and retry
                console.warn(`Gemini key ${idx + 1} failed (${msg}), rotating...`)
            }
        }

        set({ loading: false, error: 'rate_limit_all_keys' })
        return null
    },
}))
