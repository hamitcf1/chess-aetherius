import type { AchievementDef } from '@/types/chess'

/**
 * Master list of achievements. Each id is stable and used to look up
 * the unlock record in Dexie. Localized strings come from i18n via
 * `titleKey` / `descKey` lookups (achievements.{id}.title etc).
 */
export const ACHIEVEMENTS: AchievementDef[] = [
    // First steps
    { id: 'first_move', titleKey: 'achievements.first_move.title', descKey: 'achievements.first_move.desc', icon: 'Footprints', category: 'play', rarity: 'common' },
    { id: 'first_game', titleKey: 'achievements.first_game.title', descKey: 'achievements.first_game.desc', icon: 'Play', category: 'play', rarity: 'common' },
    { id: 'first_win', titleKey: 'achievements.first_win.title', descKey: 'achievements.first_win.desc', icon: 'Trophy', category: 'play', rarity: 'common' },

    // Beat AI tiers
    { id: 'beat_ai_1200', titleKey: 'achievements.beat_ai_1200.title', descKey: 'achievements.beat_ai_1200.desc', icon: 'Bot', category: 'play', rarity: 'common' },
    { id: 'beat_ai_1600', titleKey: 'achievements.beat_ai_1600.title', descKey: 'achievements.beat_ai_1600.desc', icon: 'Bot', category: 'play', rarity: 'rare' },
    { id: 'beat_ai_2000', titleKey: 'achievements.beat_ai_2000.title', descKey: 'achievements.beat_ai_2000.desc', icon: 'Bot', category: 'play', rarity: 'epic' },
    { id: 'beat_ai_2400', titleKey: 'achievements.beat_ai_2400.title', descKey: 'achievements.beat_ai_2400.desc', icon: 'Crown', category: 'play', rarity: 'legendary' },

    // Style points
    { id: 'checkmate_under_20', titleKey: 'achievements.checkmate_under_20.title', descKey: 'achievements.checkmate_under_20.desc', icon: 'Zap', category: 'play', rarity: 'rare' },
    { id: 'perfect_game', titleKey: 'achievements.perfect_game.title', descKey: 'achievements.perfect_game.desc', icon: 'Sparkles', category: 'mastery', rarity: 'epic' },
    { id: 'comeback_kid', titleKey: 'achievements.comeback_kid.title', descKey: 'achievements.comeback_kid.desc', icon: 'TrendingUp', category: 'play', rarity: 'epic' },
    { id: 'survive_lost_position', titleKey: 'achievements.survive_lost_position.title', descKey: 'achievements.survive_lost_position.desc', icon: 'Shield', category: 'play', rarity: 'rare' },

    // Puzzles
    { id: 'first_puzzle', titleKey: 'achievements.first_puzzle.title', descKey: 'achievements.first_puzzle.desc', icon: 'Puzzle', category: 'puzzle', rarity: 'common' },
    { id: 'puzzle_streak_5', titleKey: 'achievements.puzzle_streak_5.title', descKey: 'achievements.puzzle_streak_5.desc', icon: 'Flame', category: 'puzzle', rarity: 'common', target: 5 },
    { id: 'puzzle_streak_10', titleKey: 'achievements.puzzle_streak_10.title', descKey: 'achievements.puzzle_streak_10.desc', icon: 'Flame', category: 'puzzle', rarity: 'rare', target: 10 },
    { id: 'puzzle_streak_25', titleKey: 'achievements.puzzle_streak_25.title', descKey: 'achievements.puzzle_streak_25.desc', icon: 'Flame', category: 'puzzle', rarity: 'epic', target: 25 },
    { id: 'solve_100_puzzles', titleKey: 'achievements.solve_100_puzzles.title', descKey: 'achievements.solve_100_puzzles.desc', icon: 'Target', category: 'puzzle', rarity: 'epic', target: 100 },
    { id: 'solve_500_puzzles', titleKey: 'achievements.solve_500_puzzles.title', descKey: 'achievements.solve_500_puzzles.desc', icon: 'Target', category: 'puzzle', rarity: 'legendary', target: 500 },

    // Openings
    { id: 'play_italian', titleKey: 'achievements.play_italian.title', descKey: 'achievements.play_italian.desc', icon: 'Castle', category: 'mastery', rarity: 'common' },
    { id: 'play_sicilian', titleKey: 'achievements.play_sicilian.title', descKey: 'achievements.play_sicilian.desc', icon: 'Castle', category: 'mastery', rarity: 'common' },
    { id: 'play_queens_gambit', titleKey: 'achievements.play_queens_gambit.title', descKey: 'achievements.play_queens_gambit.desc', icon: 'Castle', category: 'mastery', rarity: 'common' },

    // Lessons
    { id: 'complete_first_lesson', titleKey: 'achievements.complete_first_lesson.title', descKey: 'achievements.complete_first_lesson.desc', icon: 'GraduationCap', category: 'lesson', rarity: 'common' },
    { id: 'complete_all_basics', titleKey: 'achievements.complete_all_basics.title', descKey: 'achievements.complete_all_basics.desc', icon: 'BookOpen', category: 'lesson', rarity: 'rare' },

    // Streaks & milestones
    { id: 'streak_3_days', titleKey: 'achievements.streak_3_days.title', descKey: 'achievements.streak_3_days.desc', icon: 'Calendar', category: 'streak', rarity: 'common', target: 3 },
    { id: 'streak_7_days', titleKey: 'achievements.streak_7_days.title', descKey: 'achievements.streak_7_days.desc', icon: 'Calendar', category: 'streak', rarity: 'rare', target: 7 },
    { id: 'streak_30_days', titleKey: 'achievements.streak_30_days.title', descKey: 'achievements.streak_30_days.desc', icon: 'Calendar', category: 'streak', rarity: 'epic', target: 30 },

    { id: 'rating_1500', titleKey: 'achievements.rating_1500.title', descKey: 'achievements.rating_1500.desc', icon: 'Award', category: 'mastery', rarity: 'rare', target: 1500 },
    { id: 'rating_1800', titleKey: 'achievements.rating_1800.title', descKey: 'achievements.rating_1800.desc', icon: 'Award', category: 'mastery', rarity: 'epic', target: 1800 },
    { id: 'rating_2000', titleKey: 'achievements.rating_2000.title', descKey: 'achievements.rating_2000.desc', icon: 'Award', category: 'mastery', rarity: 'legendary', target: 2000 },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]))

export const RARITY_STYLES: Record<string, { bg: string; ring: string; text: string }> = {
    common: { bg: 'bg-zinc-500/15', ring: 'ring-zinc-500/30', text: 'text-zinc-300' },
    rare: { bg: 'bg-blue-500/15', ring: 'ring-blue-500/40', text: 'text-blue-300' },
    epic: { bg: 'bg-purple-500/15', ring: 'ring-purple-500/40', text: 'text-purple-300' },
    legendary: { bg: 'bg-amber-500/15', ring: 'ring-amber-500/40', text: 'text-amber-300' },
}
