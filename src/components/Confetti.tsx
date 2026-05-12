import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#a855f7', '#ef4444']

interface ConfettiProps {
    /** Tetiklemek için artırılır. Aynı kalırsa görünmez. */
    trigger: number
    /** Süre ms. */
    duration?: number
    /** Parça sayısı */
    count?: number
}

export function Confetti({ trigger, duration = 2500, count = 60 }: ConfettiProps) {
    const [show, setShow] = useState(false)
    const [seed, setSeed] = useState(0)

    useEffect(() => {
        if (trigger === 0) return
        setSeed(trigger)
        setShow(true)
        const id = setTimeout(() => setShow(false), duration)
        return () => clearTimeout(id)
    }, [trigger, duration])

    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            <AnimatePresence>
                {Array.from({ length: count }).map((_, i) => {
                    const left = (i * 37 + seed * 13) % 100
                    const delay = (i % 10) * 0.02
                    const drift = ((i * 73 + seed * 7) % 200) - 100
                    const rotate = ((i * 23 + seed * 5) % 720) - 360
                    const color = COLORS[i % COLORS.length]
                    const shape = i % 3 // 0=square, 1=circle, 2=triangle
                    return (
                        <motion.div
                            key={`${seed}-${i}`}
                            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
                            animate={{ y: '110vh', x: drift, opacity: [1, 1, 0], rotate }}
                            transition={{ duration: duration / 1000, delay, ease: [0.2, 0.7, 0.4, 1] }}
                            className="absolute top-0"
                            style={{
                                left: `${left}%`,
                                width: shape === 2 ? 0 : 10,
                                height: shape === 2 ? 0 : 10,
                                backgroundColor: shape === 2 ? 'transparent' : color,
                                borderRadius: shape === 1 ? '50%' : '2px',
                                borderLeft: shape === 2 ? '5px solid transparent' : undefined,
                                borderRight: shape === 2 ? '5px solid transparent' : undefined,
                                borderBottom: shape === 2 ? `10px solid ${color}` : undefined,
                            }}
                        />
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
