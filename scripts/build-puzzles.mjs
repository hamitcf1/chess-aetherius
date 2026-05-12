#!/usr/bin/env node
/**
 * Builds public/puzzles-seed.json from a curated list of hand-crafted puzzles.
 * Each puzzle is verified with chess.js — illegal moves or non-mate "mate" puzzles
 * are rejected and logged. Only verified puzzles end up in the output.
 *
 * Convention (simpler than Lichess):
 *   - FEN: position to solve (whoever's turn = solver)
 *   - movesUci: alternating [solver, opponent, solver, opponent, ...]
 *     starting with solver's first move
 *   - If the puzzle's last solver move should mate, set mateAtEnd: true
 */

import { Chess } from 'chess.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CANDIDATES = [
    // ============ MATE IN 1 (rating 400-700) ============
    {
        id: 'm1_001',
        fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        movesUci: ['e1e8'],
        rating: 500, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_002',
        fen: 'r5k1/5ppp/8/8/8/8/8/3R3K w - - 0 1',
        movesUci: ['d1d8'],
        rating: 450, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_003',
        fen: '7k/4Q1pp/8/8/8/8/8/4R2K w - - 0 1',
        movesUci: ['e7e8'],
        rating: 400, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        id: 'm1_004',
        fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
        movesUci: ['a1a8'],
        rating: 500, themes: ['mateIn1', 'ladderMate'], mateAtEnd: true,
    },
    {
        id: 'm1_005',
        fen: '6k1/8/6KP/8/8/8/8/R7 w - - 0 1',
        movesUci: ['a1a8'],
        rating: 500, themes: ['mateIn1', 'ladderMate'], mateAtEnd: true,
    },
    {
        id: 'm1_006',
        fen: '7k/6pp/8/8/8/8/r7/2K5 b - - 0 1',
        movesUci: ['a2a1'],
        rating: 550, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_007',
        fen: '5rk1/5ppp/8/8/8/8/8/4R1K1 b - - 0 1',
        movesUci: ['f8f1'],
        rating: 500, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_008',
        fen: '6k1/R7/6K1/8/8/8/8/8 w - - 0 1',
        movesUci: ['a7a8'],
        rating: 450, themes: ['mateIn1', 'ladderMate'], mateAtEnd: true,
    },
    {
        id: 'm1_009',
        fen: '4k3/4Q3/4K3/8/8/8/8/8 w - - 0 1',
        movesUci: ['e7e8'],
        rating: 400, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        id: 'm1_010',
        fen: '4k3/8/4K3/8/8/8/8/4Q3 w - - 0 1',
        movesUci: ['e1e8'],
        rating: 450, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        id: 'm1_011',
        fen: '7k/6pp/8/8/8/8/6PP/R6K w - - 0 1',
        movesUci: ['a1a8'],
        rating: 500, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_012',
        fen: '3rk3/3R4/4K3/8/8/8/8/8 w - - 0 1',
        movesUci: ['d7d8'],
        rating: 450, themes: ['mateIn1'], mateAtEnd: true,
    },
    {
        id: 'm1_013',
        fen: '4k3/3R4/4K3/8/8/8/8/4R3 w - - 0 1',
        movesUci: ['e1e8'],
        rating: 450, themes: ['mateIn1'], mateAtEnd: true,
    },
    {
        id: 'm1_014',
        fen: '6k1/5ppp/8/8/8/3Q4/PPP2PPP/6K1 w - - 0 1',
        movesUci: ['d3d8'],
        rating: 600, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        id: 'm1_015',
        fen: '8/8/8/8/k7/8/2Q5/2K5 w - - 0 1',
        movesUci: ['c2a2'],
        rating: 550, themes: ['mateIn1', 'kingHunt'], mateAtEnd: true,
    },

    // ============ MATE IN 2 (rating 800-1200) ============
    {
        id: 'm2_001',
        // White: Qd1, Ra1, Kg1. Black: Kh8, pawns f7,g7,h7
        // 1. Qd8+ Rxd8 (... wait black has no rook)
        // Actually let's use a clearer mate in 2.
        // White: Qb6, Kg1. Black: Kg8, Pf7, Pg7, Ph7
        // 1. Qb8+ Kf8 ... no wait. Let me use a verified mate-in-2.
        // Anastasia's mate concept: 1. Ne7+ Kh8 2. Qxh7#
        // Setup: white Q on a4 ... no I'm just making this up.
        // Let me use: King on h8, white queen and rook delivers backrank
        // Position: White Re1, Qd1, Kg1. Black Kh8, Rg8, Pf7,g7,h7
        // 1. Qd8! Rxd8 2. Re8#
        fen: '6kr/5ppp/8/8/8/8/8/3Q1RK1 w - - 0 1',
        // White: Qd1, Rf1, Kg1. Black: Kg8, Rh8, Pf7,g7,h7
        // 1. Qd8+ Rxd8 2. Rf8 — actually Rf8 doesn't mate.
        // Let me skip mate-in-2s and just focus on more mate-in-1s for now.
        movesUci: [],
        rating: 0, themes: [], skip: true,
    },

    // ============ FORKS / SIMPLE TACTICS (rating 700-1100) ============
    {
        // Knight fork: Win the queen.
        // White Kg1, Ne5. Black Kg8, Qd5, Pa7. White to move, fork king+queen.
        id: 'fork_001',
        fen: '6k1/p7/8/3qN3/8/8/8/6K1 w - - 0 1',
        // Nf7+ forks king on g8 and... wait Nf7+ attacks king. Knight on f7 attacks: d6,d8,e5,g5,h6,h8 — not the queen on d5. Not a fork.
        // Let me try Nxf7+: knight captures on f7, but f7 is empty. So Nf7+ just attacks.
        // Knight on e5 jumps to: c4,c6,d3,d7,f3,f7,g4,g6.
        // d7 attacks empty squares. c6 attacks empty. None forks queen on d5.
        // Skip this attempt.
        movesUci: [], skip: true,
    },
    {
        // Simple queen pin / win material
        // Position: white Ra1, Kg1. Black Kg8, Qa8, Pf7,g7,h7. White's rook pins queen to king on a-file.
        // After 1. Rxa8+ Kxa8 — but wait, that's just trade.
        // Need a position where the pin wins material WITHOUT trade.
        id: 'pin_001',
        fen: 'q5k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
        movesUci: ['a1a8'], // Rxa8 — wins the queen (rook for queen trade)
        rating: 700, themes: ['simpleCapture', 'rookEnds'],
        mateAtEnd: false, expectCapture: 'q',
    },
    {
        // Free queen take.
        // White: Kg1, Qd1. Black: Kg8, Qe5 hanging (no defenders).
        // 1. Qxe5 wins the queen.
        // Wait that's not a real puzzle. Skip.
        id: 'hanging_001', movesUci: [], skip: true,
    },

    // ============ SIMPLE WINNING MOVES — back to mate-in-1 batch 2 ============
    {
        // White Q on h-file, mate on h8 or h7
        // Position: white Qh1, Kh3. Black: Kh8. Direct queen check.
        // Qh1 cannot move to h8 because king blocks h-file? No, h1-h8 is empty.
        // Position: White: Kh3, Qh1. Black: Kh8.
        // Qh1-h7+ — king must move. Only option g8 (h7 attacked queen, g7 attacked queen, g8 attacked queen).
        // Wait queen on h7 attacks: 7th rank (a7-g7), h-file (h1-h8 minus h7 itself), diagonals.
        // King on h8 — escape squares g8 (attacked by Q on h7), g7 (attacked), h7 (attacked).
        // So Qh7# but king can capture queen? Queen adjacent to king. Captured. Unless defended.
        // Need protection. White king on g6? Then Kg6 defends h7. Qh7#.
        id: 'm1_016',
        fen: '7k/8/6K1/8/8/8/8/7Q w - - 0 1',
        movesUci: ['h1h7'],
        rating: 500, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        // Smothered-mate-style: knight delivers mate when king cannot escape.
        // White: Nf7, Kg6. Black: Kh8. Move: Nf7-... wait it's already there.
        // Need black to be threatened. 1. Nf7-h6+ ... doesn't mate either.
        // Let's try: White: Nh5, Qh2, Kf3. Black: Kh8 trapped behind own pawns f7,g7,h7.
        // 1. Qh2-h6 — defends h-file? No, queen on h6 not mate.
        // Skip.
        id: 'smother_001', movesUci: [], skip: true,
    },
    {
        // Rook + king ladder mate one move from completion.
        // White: Ra7, Kf6. Black: Kg8.
        // 1. Ra8+ Kh7 — not mate.
        // Need: White Ra7, Kg6, Kh8 black.
        // 1. Ra8# — king g6 covers g7,h7,f7. Rook a8 covers 8th rank. ✓
        id: 'm1_017',
        fen: '7k/R7/6K1/8/8/8/8/8 w - - 0 1',
        movesUci: ['a7a8'],
        rating: 500, themes: ['mateIn1', 'ladderMate'], mateAtEnd: true,
    },
    {
        // Two rooks on adjacent files (ladder)
        // White: Ra1, Rb2, Kg1. Black: Kh8.
        // 1. Rb8+ (any) ... king must move.
        // Better: 1. Ra8+ Kh7 2. Rb7# — that's mate in 2.
        // Mate in 1: White Ra1, Rb7, Kg1. Black Kh8. 1. Ra8#.
        id: 'm1_018',
        fen: '7k/1R6/8/8/8/8/8/R5K1 w - - 0 1',
        movesUci: ['a1a8'],
        rating: 550, themes: ['mateIn1', 'ladderMate'], mateAtEnd: true,
    },
    {
        // Queen + king mate
        // White Qa8, Kf6. Black Kf8.
        // 1. Qe8# ? Queen on e8 attacks king f8. King escape: f7 attacked by king f6 ... wait kings can't be adjacent.
        // Actually kings can't be adjacent so the position itself is illegal.
        // Try: White Qa1, Kf6. Black Kh8.
        // 1. Qh1+ Kg8 — not mate.
        // 1. Qa8# — attacks king h8 through rank 8 (empty). King escape: g7 (attacked by Kf6? No, f6 attacks e5,e6,e7,f5,f7,g5,g6,g7. Yes g7 attacked). h7 (attacked by Kf6? No. h7 only attacked by queen on a8 if on a-file or 7-rank or diagonal. Queen on a8: a-file, 8th rank, a8-h1 diagonal. h7 not attacked.). So king h8 can go h7. Not mate.
        // Need queen closer. 1. Qg8+ Kxg8 — capture.
        // White: Qa1, Kg6. Black: Kh8. 1. Qa8# — king escape h7 (attacked by Kg6). g7 (attacked by Kg6). g8 (attacked by queen on 8th). ✓ MATE!
        id: 'm1_019',
        fen: '7k/8/6K1/8/8/8/8/Q7 w - - 0 1',
        movesUci: ['a1a8'],
        rating: 500, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        // King + 2 queens — overkill mate
        // White Qd5, Qe5, Kf3. Black Kh8.
        // 1. Qd8# — queen on d8 attacks 8th rank. King escape: h7 (not attacked). Not mate.
        // 1. Qee8# — but two queens? Use only one.
        // White Qg6, Kf6. Black Kh8.
        // 1. Qg7# — queen g7 adjacent to king. King escape: h7 (attacked by Q). All adjacent squares (h7, g8, g7) attacked or occupied. Is g7 defended? By Kf6 (attacks g7). So queen on g7 protected. Mate.
        id: 'm1_020',
        fen: '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1',
        movesUci: ['g1g7'],
        rating: 450, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },

    // Additional simple mate-in-1's at higher rating (still easy patterns)
    {
        id: 'm1_021',
        fen: 'r3k3/8/4K3/8/8/8/8/4R3 w - - 0 1',
        movesUci: ['e1e8'],
        rating: 500, themes: ['mateIn1'], mateAtEnd: true,
    },
    {
        id: 'm1_022',
        fen: '4r1k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
        movesUci: ['d1d8'],
        rating: 600, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_023',
        fen: 'r5k1/5p1p/6p1/8/8/8/5PPP/3R2K1 w - - 0 1',
        movesUci: ['d1d8'],
        rating: 650, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_024',
        fen: '6k1/3R1ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        movesUci: ['e1e8'],
        rating: 600, themes: ['mateIn1', 'backRank'], mateAtEnd: true,
    },
    {
        id: 'm1_025',
        fen: '7k/4Q1pp/8/8/8/8/8/6K1 w - - 0 1',
        movesUci: ['e7e8'],
        rating: 550, themes: ['mateIn1', 'queenMate'], mateAtEnd: true,
    },
    {
        // Take the rook (rook on a8 hanging)
        id: 'capture_001',
        fen: 'r5k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        movesUci: ['a1a8'],
        rating: 700, themes: ['simpleCapture'], mateAtEnd: false,
    },
    {
        // Queen takes hanging bishop
        id: 'capture_002',
        fen: '6k1/5ppp/8/8/3b4/8/3Q1PPP/6K1 w - - 0 1',
        movesUci: ['d2d4'],
        rating: 600, themes: ['simpleCapture'], mateAtEnd: false,
    },
    {
        // Promotion to queen with check
        id: 'promo_001',
        fen: '8/P6k/8/8/8/8/8/6K1 w - - 0 1',
        movesUci: ['a7a8q'],
        rating: 600, themes: ['promotion'], mateAtEnd: false,
    },
    {
        // Promotion to queen
        id: 'promo_002',
        fen: '8/2P5/8/8/8/k7/8/4K3 w - - 0 1',
        movesUci: ['c7c8q'],
        rating: 550, themes: ['promotion'], mateAtEnd: false,
    },
    {
        // Black to move — mate in 1
        id: 'm1_b_001',
        fen: '7K/8/8/8/8/8/r7/k7 b - - 0 1',
        movesUci: ['a2h2'], // Rh2 mate? Actually let's verify with chess.js.
        rating: 600, themes: ['mateIn1'], mateAtEnd: false, skip: true,
    },
]

// ============ VALIDATION ============

let valid = 0
let invalid = 0
const out = []

for (const p of CANDIDATES) {
    if (p.skip) continue
    const chess = new Chess(p.fen)
    let ok = true
    let lastMoveResult = null
    for (let i = 0; i < p.movesUci.length; i++) {
        const m = p.movesUci[i]
        if (!m || m.length < 4) { ok = false; break }
        try {
            lastMoveResult = chess.move({
                from: m.slice(0, 2),
                to: m.slice(2, 4),
                promotion: m.length > 4 ? m[4] : undefined,
            })
        } catch (e) {
            ok = false
            console.error(`[${p.id}] illegal move ${m}: ${e.message}`)
            break
        }
    }
    if (!ok) { invalid++; continue }
    if (p.mateAtEnd && !chess.isCheckmate()) {
        console.error(`[${p.id}] expected mate at end but isn't (turn: ${chess.turn()}, inCheck: ${chess.inCheck()})`)
        invalid++; continue
    }
    if (p.expectCapture && lastMoveResult && lastMoveResult.captured !== p.expectCapture) {
        console.error(`[${p.id}] expected capture of ${p.expectCapture} but got ${lastMoveResult.captured}`)
        invalid++; continue
    }
    valid++
    out.push({
        id: p.id,
        fen: p.fen,
        movesUci: p.movesUci,
        rating: p.rating,
        themes: p.themes,
    })
}

const outPath = resolve(__dirname, '..', 'public', 'puzzles-seed.json')
writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`\nWrote ${valid} valid puzzles to ${outPath} (${invalid} rejected)`)
