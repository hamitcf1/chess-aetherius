import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface PromotionDialogProps {
    open: boolean
    color: 'w' | 'b'
    onPick: (piece: 'q' | 'r' | 'b' | 'n') => void
    onCancel: () => void
}

const PIECES: { id: 'q' | 'r' | 'b' | 'n'; name: string }[] = [
    { id: 'q', name: 'queen' },
    { id: 'r', name: 'rook' },
    { id: 'b', name: 'bishop' },
    { id: 'n', name: 'knight' },
]

// Unicode chess pieces
const SYMBOLS: Record<string, { w: string; b: string }> = {
    q: { w: '♕', b: '♛' },
    r: { w: '♖', b: '♜' },
    b: { w: '♗', b: '♝' },
    n: { w: '♘', b: '♞' },
}

export function PromotionDialog({ open, color, onPick, onCancel }: PromotionDialogProps) {
    const { t } = useTranslation()
    return (
        <Dialog open={open} onOpenChange={v => !v && onCancel()}>
            <DialogContent className="max-w-md">
                <DialogTitle>{t('common.tryAgain', 'Promotion')}</DialogTitle>
                <div className="grid grid-cols-4 gap-3 pt-2">
                    {PIECES.map((p, i) => (
                        <motion.button
                            key={p.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onPick(p.id)}
                            className="aspect-square rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/10 flex items-center justify-center text-6xl transition-colors"
                            style={{ color: color === 'w' ? '#eaecf0' : '#0a0e1a', WebkitTextStroke: '1px hsl(var(--foreground))' }}
                        >
                            {SYMBOLS[p.id][color]}
                        </motion.button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
