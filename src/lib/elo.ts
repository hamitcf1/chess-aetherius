/**
 * Standard Elo rating calculation.
 * K-factor: 32 for ratings <2100, 24 for >=2100, 16 for >=2400.
 */

export function expectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

export function kFactor(elo: number): number {
    if (elo >= 2400) return 16
    if (elo >= 2100) return 24
    return 32
}

export type GameScore = 1 | 0.5 | 0

export function newRating(playerElo: number, opponentElo: number, score: GameScore): number {
    const expected = expectedScore(playerElo, opponentElo)
    const k = kFactor(playerElo)
    return Math.round(playerElo + k * (score - expected))
}

export function ratingChange(playerElo: number, opponentElo: number, score: GameScore): number {
    return newRating(playerElo, opponentElo, score) - playerElo
}

/**
 * Puzzle ELO uses tighter K to converge faster on a true rating.
 */
export function newPuzzleRating(playerElo: number, puzzleElo: number, succeeded: boolean): number {
    const expected = expectedScore(playerElo, puzzleElo)
    const k = 24
    return Math.round(playerElo + k * ((succeeded ? 1 : 0) - expected))
}

/**
 * Stockfish difficulty levels mapped to displayed AI ELO.
 * Each level maps to a tier the user sees in the UI.
 */
export interface AiLevel {
    label: string
    elo: number
    skill?: number              // 0-20, Stockfish'in iç skill ayarı
    limitStrength: boolean      // UCI_LimitStrength (sadece >= 1320 için anlamlı)
    movetimeMs: number
    depth: number
    /**
     * Rastgele hamle olasılığı (0-1). Stockfish 16 NNUE, skill 0 + depth 1'de bile
     * ~1300 ELO oynuyor — bu yüzden 1200 altı için Stockfish'in önerdiği yerine
     * bazen rastgele legal hamle seçerek seviyeyi düşürüyoruz.
     */
    randomMoveProb?: number
}

export const AI_LEVELS: AiLevel[] = [
    { label: 'Yeni Başlayan', elo: 200, skill: 0, limitStrength: false, movetimeMs: 80, depth: 1, randomMoveProb: 0.85 },
    { label: 'Çocuk', elo: 400, skill: 0, limitStrength: false, movetimeMs: 100, depth: 1, randomMoveProb: 0.65 },
    { label: 'Çaylak', elo: 600, skill: 0, limitStrength: false, movetimeMs: 150, depth: 2, randomMoveProb: 0.45 },
    { label: 'Acemi', elo: 900, skill: 2, limitStrength: false, movetimeMs: 250, depth: 4, randomMoveProb: 0.20 },
    { label: 'Amatör', elo: 1200, skill: 5, limitStrength: false, movetimeMs: 400, depth: 6, randomMoveProb: 0.08 },
    { label: 'Orta', elo: 1500, skill: 10, limitStrength: true, movetimeMs: 700, depth: 10 },
    { label: 'İyi', elo: 1800, skill: 14, limitStrength: true, movetimeMs: 900, depth: 12 },
    { label: 'Çok İyi', elo: 2100, skill: 17, limitStrength: true, movetimeMs: 1200, depth: 15 },
    { label: 'Uzman', elo: 2400, skill: 19, limitStrength: true, movetimeMs: 1500, depth: 18 },
    { label: 'Usta', elo: 2700, skill: 20, limitStrength: false, movetimeMs: 2000, depth: 20 },
    { label: 'Süper Usta', elo: 3000, skill: 20, limitStrength: false, movetimeMs: 2500, depth: 22 },
]

export function getAiLevelByElo(elo: number): AiLevel {
    return AI_LEVELS.reduce((best, level) =>
        Math.abs(level.elo - elo) < Math.abs(best.elo - elo) ? level : best
    )
}

/**
 * Chess.com tarzı eşleştirme — kullanıcının ELO'suna yakın bir AI seç,
 * %60 ihtimalle aynı seviye, %20 bir tier güçlü, %20 bir tier zayıf.
 * Bu varyasyon "online maç" hissi verir, hem zorlayıcı hem nefes alınabilir.
 */
export function pickMatchedAi(userElo: number): AiLevel {
    const closest = getAiLevelByElo(userElo)
    const closestIdx = AI_LEVELS.indexOf(closest)
    const r = Math.random()
    let pickIdx = closestIdx
    if (r < 0.20 && closestIdx > 0) {
        pickIdx = closestIdx - 1
    } else if (r < 0.40 && closestIdx < AI_LEVELS.length - 1) {
        pickIdx = closestIdx + 1
    }
    return AI_LEVELS[pickIdx]
}

/**
 * Classify a move based on centipawn loss vs. the engine's best move.
 */
export function classifyMove(
    bestEvalCp: number,
    playedEvalCp: number,
    perspective: 'w' | 'b' = 'w'
): import('@/types/chess').MoveClassification {
    const sign = perspective === 'w' ? 1 : -1
    const loss = (bestEvalCp - playedEvalCp) * sign

    if (loss <= 10) return 'best'
    if (loss <= 25) return 'great'
    if (loss <= 60) return 'good'
    if (loss <= 120) return 'inaccuracy'
    if (loss <= 250) return 'mistake'
    return 'blunder'
}
