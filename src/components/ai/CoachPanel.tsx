import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAIStore } from '@/stores/aiStore'
import { useTranslation } from 'react-i18next'

interface CoachPanelProps {
    systemPrompt: string
    userPrompt: string
    /** Auto-trigger on mount */
    autoRun?: boolean
    title?: string
    cachedResponse?: string
    onResponse?: (text: string) => void
}

export function CoachPanel({
    systemPrompt,
    userPrompt,
    autoRun = false,
    title,
    cachedResponse,
    onResponse,
}: CoachPanelProps) {
    const { t } = useTranslation()
    const generate = useAIStore(s => s.generate)
    const loading = useAIStore(s => s.loading)
    const error = useAIStore(s => s.error)
    const hasKeys = useAIStore(s => s.hasKeys)
    const [text, setText] = useState<string | null>(cachedResponse ?? null)
    const [triggered, setTriggered] = useState(autoRun)

    const handleRun = async () => {
        setTriggered(true)
        const res = await generate({ systemPrompt, userPrompt })
        if (res) {
            setText(res)
            onResponse?.(res)
        }
    }

    if (autoRun && !triggered && !text) {
        // Fire once on mount
        setTimeout(() => handleRun(), 100)
    }

    return (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    {title ?? t('ai.coach')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {!hasKeys && (
                    <div className="flex items-start gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{t('ai.noKeys')}</span>
                    </div>
                )}

                {hasKeys && !text && !loading && (
                    <Button onClick={handleRun} variant="accent" size="sm" className="w-full">
                        <Sparkles className="w-4 h-4" />
                        {t('ai.generateAnalysis')}
                    </Button>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('ai.coachAnalyzing')}
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-start gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error === 'rate_limit_all_keys' ? t('ai.rateLimit') : t('ai.error')}</span>
                    </div>
                )}

                <AnimatePresence>
                    {text && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="prose prose-sm prose-invert dark:prose-invert max-w-none text-sm"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
