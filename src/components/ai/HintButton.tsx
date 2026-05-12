import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/stores/aiStore'
import { useTranslation } from 'react-i18next'

interface HintButtonProps {
    fen: string
    bestMoveUci?: string      // Stockfish's best move — used as context, NOT shown
    themes?: string[]
    onHint?: (level: number, text: string) => void
}

const HINT_SYSTEM = `Sen bir satranç koçusun. Kullanıcının çözmeye çalıştığı bir taktik pozisyonu var. Sana FEN, en iyi hamlenin UCI'si ve tema veriliyor.
Görev: Tam çözümü vermeden, sadece bir sonraki ipucu seviyesi için kısa bir ipucu üret:
- Seviye 1: Genel ipucu — hangi tarafa bakacağı veya hangi tema (çatal, çivi, vs.) olduğu
- Seviye 2: Daha spesifik ipucu — hangi taşı incelemesi gerektiği
- Seviye 3: Çok spesifik ipucu — hangi kareye odaklanması gerektiği

ASLA hamleyi söyleme. Sadece düşündür.`

export function HintButton({ fen, bestMoveUci, themes, onHint }: HintButtonProps) {
    const { t } = useTranslation()
    const generate = useAIStore(s => s.generate)
    const [level, setLevel] = useState(0)
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        if (level >= 3 || loading) return
        const nextLevel = level + 1
        setLoading(true)
        const text = await generate({
            systemPrompt: HINT_SYSTEM,
            userPrompt: `FEN: ${fen}\nBest move (gizli): ${bestMoveUci ?? 'unknown'}\nTemalar: ${themes?.join(', ') ?? 'yok'}\nİpucu seviyesi: ${nextLevel}\n\nLütfen seviye ${nextLevel} ipucunu ver.`,
        })
        setLoading(false)
        if (text) {
            setLevel(nextLevel)
            onHint?.(nextLevel, text)
        }
    }

    return (
        <motion.div whileTap={{ scale: 0.97 }}>
            <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={level >= 3 || loading}
                className="gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                {level === 0 ? t('common.hint') : t('puzzles.hintLevel', { level })}
            </Button>
        </motion.div>
    )
}
