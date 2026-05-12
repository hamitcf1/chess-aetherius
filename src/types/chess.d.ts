export type Color = 'w' | 'b'
export type Result = '1-0' | '0-1' | '1/2-1/2' | '*'
export type Termination =
    | 'checkmate'
    | 'resignation'
    | 'stalemate'
    | 'draw'
    | 'timeout'
    | 'agreement'
    | 'threefold'
    | 'fifty_move'
    | 'insufficient_material'
    | 'ongoing'

export type MoveClassification = 'best' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export interface EngineEval {
    cp?: number
    mate?: number
    depth: number
    bestUci?: string
    pv?: string[]
}

export interface MoveRecord {
    ply: number
    san: string
    uci: string
    fenAfter: string
    eval?: EngineEval
    classification?: MoveClassification
    timeSpentMs?: number
}

export interface Game {
    id: string
    createdAt: number
    endedAt?: number
    whiteName: string
    blackName: string
    userColor: Color
    aiElo?: number
    result: Result
    termination: Termination
    pgn: string
    moves: MoveRecord[]
    startFen?: string
    userEloBefore: number
    userEloAfter: number
    aiSummaryTr?: string
    aiSummaryEn?: string
    tags?: string[]
    opening?: { eco?: string; name?: string }
}

export interface Puzzle {
    id: string
    fen: string
    movesUci: string[]
    rating: number
    themes: string[]
    popularity?: number
    solvedAt?: number
    attempts: number
    succeeded: boolean
}

export type AchievementCategory = 'play' | 'puzzle' | 'lesson' | 'mastery' | 'streak'
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface AchievementDef {
    id: string
    titleKey: string
    descKey: string
    icon: string
    category: AchievementCategory
    rarity: AchievementRarity
    target?: number
}

export interface AchievementRecord {
    id: string
    unlockedAt: number
    progress?: { current: number; target: number }
}

export interface Profile {
    username: string
    avatar?: string
    createdAt: number
    elo: number
    puzzleElo: number
    peakElo: number
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    currentStreak: number
    longestStreak: number
    puzzleStreak: number
    longestPuzzleStreak: number
    favoriteOpenings: Record<string, number>
    totalPlayTimeMs: number
    lastActiveAt: number
}

export interface Lesson {
    id: string
    titleKey: string
    descKey: string
    category: 'opening' | 'tactic' | 'endgame' | 'strategy' | 'basics'
    difficulty: 1 | 2 | 3 | 4 | 5
    steps: LessonStep[]
}

export interface LessonStep {
    fen: string
    promptKey: string
    expectedUci?: string
    hintKeys?: string[]
    description?: string
}

export interface LessonProgress {
    lessonId: string
    completedSteps: number
    completedAt?: number
    score?: number
}

export interface Opening {
    eco: string
    name: string
    fen: string
    moves: string
}
