import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Chessground } from 'chessground'
import type { Api as CgApi } from 'chessground/api'
import type { Config as CgConfig } from 'chessground/config'
import type { Color as CgColor, Key } from 'chessground/types'
import { cn } from '@/lib/utils'

export interface ChessboardHandle {
    api: () => CgApi | null
    move: (from: string, to: string) => void
}

export interface ChessboardProps {
    fen: string
    orientation?: 'white' | 'black'
    turnColor?: 'white' | 'black'
    lastMove?: [string, string] | null
    check?: boolean | 'white' | 'black'
    movableDests?: Map<string, string[]>
    movableColor?: 'white' | 'black' | 'both' | 'none'
    onMove?: (from: string, to: string) => void
    onSelect?: (sq: string) => void
    showCoordinates?: boolean
    showLegalMoves?: boolean
    highlightLastMove?: boolean
    viewOnly?: boolean
    animation?: boolean
    boardTheme?: 'green' | 'brown' | 'blue' | 'purple'
    className?: string
    /** Premove enabled — kullanıcı sırası değilken hamle planlayabilir */
    premovable?: boolean
    onPremove?: (from: string, to: string) => void
    /** Right-drag ile çizilen oklar */
    drawable?: boolean
    /** Vurgulanacak kareler: en iyi hamle için yeşil ok vs */
    arrows?: Array<{ orig: string; dest: string; brush?: 'green' | 'red' | 'blue' | 'yellow' }>
}

const BOARD_THEME_CLASS: Record<string, string> = {
    green: 'green-board',
    brown: 'brown-board',
    blue: 'blue-board',
    purple: 'purple-board',
}

export const Chessboard = forwardRef<ChessboardHandle, ChessboardProps>(function Chessboard(
    {
        fen,
        orientation = 'white',
        turnColor = 'white',
        lastMove,
        check,
        movableDests,
        movableColor = 'both',
        onMove,
        onSelect,
        showCoordinates = true,
        showLegalMoves = true,
        highlightLastMove = true,
        viewOnly = false,
        animation = true,
        boardTheme = 'green',
        className,
        premovable = false,
        onPremove,
        drawable = true,
        arrows,
    },
    ref
) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const apiRef = useRef<CgApi | null>(null)

    useImperativeHandle(ref, () => ({
        api: () => apiRef.current,
        move: (from: string, to: string) => {
            apiRef.current?.move(from as Key, to as Key)
        },
    }), [])

    // Initialize once
    useEffect(() => {
        if (!wrapperRef.current || apiRef.current) return

        const dests = new Map<Key, Key[]>()
        movableDests?.forEach((tos, from) => {
            dests.set(from as Key, tos as Key[])
        })

        const config: CgConfig = {
            fen,
            orientation: orientation as CgColor,
            turnColor: turnColor as CgColor,
            check: typeof check === 'boolean'
                ? (check ? (turnColor as CgColor) : undefined)
                : (check as CgColor | undefined),
            lastMove: lastMove as [Key, Key] | undefined,
            coordinates: showCoordinates,
            viewOnly,
            animation: { enabled: animation, duration: 200 },
            movable: {
                free: false,
                color: movableColor === 'none' ? undefined : (movableColor as CgColor),
                dests,
                showDests: showLegalMoves,
                events: {
                    after: (from, to) => onMove?.(from as string, to as string),
                },
            },
            highlight: {
                lastMove: highlightLastMove,
                check: true,
            },
            premovable: {
                enabled: premovable,
                events: { set: (from, to) => onPremove?.(from as string, to as string) },
            },
            draggable: { enabled: true, showGhost: true },
            selectable: { enabled: true },
            events: {
                select: (sq) => onSelect?.(sq as string),
            },
            drawable: {
                enabled: drawable,
                visible: true,
                eraseOnClick: true,
                autoShapes: arrows?.map(a => ({ orig: a.orig as any, dest: a.dest as any, brush: a.brush ?? 'green' })) ?? [],
            },
        }

        apiRef.current = Chessground(wrapperRef.current, config)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sync props -> chessground
    useEffect(() => {
        const api = apiRef.current
        if (!api) return

        const dests = new Map<Key, Key[]>()
        movableDests?.forEach((tos, from) => {
            dests.set(from as Key, tos as Key[])
        })

        api.set({
            fen,
            orientation: orientation as CgColor,
            turnColor: turnColor as CgColor,
            check: typeof check === 'boolean'
                ? (check ? (turnColor as CgColor) : undefined)
                : (check as CgColor | undefined),
            lastMove: lastMove as [Key, Key] | undefined,
            coordinates: showCoordinates,
            viewOnly,
            animation: { enabled: animation, duration: 200 },
            movable: {
                free: false,
                color: movableColor === 'none' ? undefined : (movableColor as CgColor),
                dests,
                showDests: showLegalMoves,
                events: {
                    after: (from, to) => onMove?.(from as string, to as string),
                },
            },
            highlight: { lastMove: highlightLastMove, check: true },
            premovable: {
                enabled: premovable,
                events: { set: (from, to) => onPremove?.(from as string, to as string) },
            },
            drawable: {
                enabled: drawable,
                autoShapes: arrows?.map(a => ({ orig: a.orig as any, dest: a.dest as any, brush: a.brush ?? 'green' })) ?? [],
            },
        })
    }, [fen, orientation, turnColor, check, lastMove, movableDests, movableColor, showCoordinates, showLegalMoves, highlightLastMove, viewOnly, animation, onMove, premovable, onPremove, drawable, arrows])

    useEffect(() => {
        return () => {
            apiRef.current?.destroy()
            apiRef.current = null
        }
    }, [])

    return (
        <div
            className={cn(
                'aspect-square w-full max-w-full',
                BOARD_THEME_CLASS[boardTheme],
                className
            )}
        >
            <div ref={wrapperRef} className="cg-wrap relative h-full w-full" />
        </div>
    )
})
