import type { Game, MoveRecord, Profile } from '@/types/chess'
import { ACHIEVEMENTS } from './achievements-data'

export type EventContext =
    | { type: 'game_ended'; game: Game; profile: Profile }
    | { type: 'puzzle_solved'; puzzleRating: number; profile: Profile; streak: number; totalSolved: number }
    | { type: 'lesson_completed'; lessonId: string; profile: Profile; totalCompleted: number; allBasicsDone: boolean }
    | { type: 'first_move'; profile: Profile }
    | { type: 'day_streak'; days: number; profile: Profile }

/**
 * Pure function: evaluate which achievement IDs should be newly unlocked
 * by this event. Caller filters out already-unlocked ones.
 */
export function evaluateAchievements(ctx: EventContext): string[] {
    const unlocked: string[] = []

    switch (ctx.type) {
        case 'first_move':
            unlocked.push('first_move')
            break

        case 'game_ended': {
            const { game, profile } = ctx
            if (profile.gamesPlayed === 1) unlocked.push('first_game')

            const userWon =
                (game.userColor === 'w' && game.result === '1-0') ||
                (game.userColor === 'b' && game.result === '0-1')

            if (userWon) {
                if (profile.wins === 1) unlocked.push('first_win')
                const aiElo = game.aiElo ?? 0
                if (aiElo >= 1200) unlocked.push('beat_ai_1200')
                if (aiElo >= 1600) unlocked.push('beat_ai_1600')
                if (aiElo >= 2000) unlocked.push('beat_ai_2000')
                if (aiElo >= 2400) unlocked.push('beat_ai_2400')

                if (game.termination === 'checkmate' && game.moves.length <= 40) {
                    unlocked.push('checkmate_under_20')
                }

                const userMoves = game.moves.filter((_, i) =>
                    (game.userColor === 'w' && i % 2 === 0) || (game.userColor === 'b' && i % 2 === 1)
                )
                const hasBlunder = userMoves.some(m => m.classification === 'blunder')
                if (!hasBlunder && userMoves.length >= 20) unlocked.push('perfect_game')

                // Comeback / survive: was losing badly at any point but won
                const losingPositions = userMoves.filter(m => {
                    if (!m.eval?.cp) return false
                    const perspective = game.userColor === 'w' ? 1 : -1
                    return m.eval.cp * perspective < -300
                })
                if (losingPositions.length > 0) {
                    unlocked.push('survive_lost_position')
                    if (losingPositions.length >= 3) unlocked.push('comeback_kid')
                }
            }

            // Opening-based
            if (game.opening?.name) {
                const lower = game.opening.name.toLowerCase()
                if (lower.includes('italian')) unlocked.push('play_italian')
                if (lower.includes('sicilian')) unlocked.push('play_sicilian')
                if (lower.includes("queen's gambit") || lower.includes('queens gambit')) {
                    unlocked.push('play_queens_gambit')
                }
            }

            // Rating milestones (after the game updated profile.elo)
            if (profile.elo >= 1500) unlocked.push('rating_1500')
            if (profile.elo >= 1800) unlocked.push('rating_1800')
            if (profile.elo >= 2000) unlocked.push('rating_2000')
            break
        }

        case 'puzzle_solved': {
            if (ctx.totalSolved === 1) unlocked.push('first_puzzle')
            if (ctx.streak >= 5) unlocked.push('puzzle_streak_5')
            if (ctx.streak >= 10) unlocked.push('puzzle_streak_10')
            if (ctx.streak >= 25) unlocked.push('puzzle_streak_25')
            if (ctx.totalSolved >= 100) unlocked.push('solve_100_puzzles')
            if (ctx.totalSolved >= 500) unlocked.push('solve_500_puzzles')
            break
        }

        case 'lesson_completed': {
            if (ctx.totalCompleted === 1) unlocked.push('complete_first_lesson')
            if (ctx.allBasicsDone) unlocked.push('complete_all_basics')
            break
        }

        case 'day_streak': {
            if (ctx.days >= 3) unlocked.push('streak_3_days')
            if (ctx.days >= 7) unlocked.push('streak_7_days')
            if (ctx.days >= 30) unlocked.push('streak_30_days')
            break
        }
    }

    // Dedupe + only valid achievement IDs
    return Array.from(new Set(unlocked)).filter(id => ACHIEVEMENTS.find(a => a.id === id))
}

export function hasUserBlunder(moves: MoveRecord[], userColor: 'w' | 'b'): boolean {
    return moves.some((m, i) => {
        const isUser = (userColor === 'w' && i % 2 === 0) || (userColor === 'b' && i % 2 === 1)
        return isUser && m.classification === 'blunder'
    })
}
