// Local progress tracking system (for demo/offline mode)

export interface LocalProgress {
  xp_total: number
  level: number
  xp_to_next_level: number
  streak_days: number
  longest_streak: number
  last_study_date: string | null
  documents_count: number
  flashcards_total: number
  flashcards_mastered: number
  quizzes_completed: number
  perfect_quizzes: number
  study_time_minutes: number
  weekly_xp: number[]
  weekly_xp_dates: string[]
  badges_count: number
}

const STORAGE_KEY = 'smartstudy_local_progress'
const XP_PER_LEVEL = 500

const DEFAULT_PROGRESS: LocalProgress = {
  xp_total: 0,
  level: 1,
  xp_to_next_level: XP_PER_LEVEL,
  streak_days: 0,
  longest_streak: 0,
  last_study_date: null,
  documents_count: 0,
  flashcards_total: 3,
  flashcards_mastered: 0,
  quizzes_completed: 0,
  perfect_quizzes: 0,
  study_time_minutes: 0,
  weekly_xp: [0, 0, 0, 0, 0, 0, 0],
  weekly_xp_dates: ['', '', '', '', '', '', ''],
  badges_count: 0,
}

// 0=Monday ... 6=Sunday
export function getDayIndex(): number {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function recomputeLevel(xp: number): { level: number; xp_to_next_level: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  return { level, xp_to_next_level: level * XP_PER_LEVEL - xp }
}

export function getProgress(): LocalProgress {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

function save(p: LocalProgress): LocalProgress {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }
  return p
}

function applyStreak(p: LocalProgress): LocalProgress {
  const today = getTodayStr()
  if (p.last_study_date === today) return p

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const newStreak = p.last_study_date === yesterdayStr ? p.streak_days + 1 : 1
  return {
    ...p,
    streak_days: newStreak,
    longest_streak: Math.max(p.longest_streak, newStreak),
    last_study_date: today,
  }
}

function addWeeklyXp(p: LocalProgress, amount: number): LocalProgress {
  const today = getTodayStr()
  const dayIdx = getDayIndex()
  const weekly_xp = [...p.weekly_xp]
  const weekly_xp_dates = [...p.weekly_xp_dates]
  if (weekly_xp_dates[dayIdx] !== today) {
    weekly_xp[dayIdx] = 0
    weekly_xp_dates[dayIdx] = today
  }
  weekly_xp[dayIdx] += amount
  return { ...p, weekly_xp, weekly_xp_dates }
}

function awardXp(p: LocalProgress, amount: number): LocalProgress {
  const xp_total = p.xp_total + amount
  const { level, xp_to_next_level } = recomputeLevel(xp_total)
  p = addWeeklyXp(p, amount)
  return { ...p, xp_total, level, xp_to_next_level }
}

export function recordFlashcardReview(quality: number): LocalProgress {
  let p = getProgress()
  p = applyStreak(p)
  const xp = quality >= 3 ? 5 : 2
  p = awardXp(p, xp)
  if (quality >= 4) {
    p = { ...p, flashcards_mastered: Math.min(p.flashcards_mastered + 1, p.flashcards_total) }
  }
  return save(p)
}

export function recordQuizCompletion(correctAnswers: number, totalQuestions: number): LocalProgress {
  let p = getProgress()
  p = applyStreak(p)
  const xp = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 50) + 10
  p = awardXp(p, xp)
  p = {
    ...p,
    quizzes_completed: p.quizzes_completed + 1,
    perfect_quizzes: correctAnswers === totalQuestions ? p.perfect_quizzes + 1 : p.perfect_quizzes,
  }
  if (p.quizzes_completed >= 1 && p.badges_count < 1) p = { ...p, badges_count: 1 }
  if (p.quizzes_completed >= 5 && p.badges_count < 3) p = { ...p, badges_count: 3 }
  return save(p)
}

export function recordDocumentUpload(): LocalProgress {
  let p = getProgress()
  p = applyStreak(p)
  p = awardXp(p, 20)
  p = {
    ...p,
    documents_count: p.documents_count + 1,
    flashcards_total: p.flashcards_total + 10,
  }
  return save(p)
}

export function recordStudyTime(minutes: number): LocalProgress {
  const p = getProgress()
  return save({ ...p, study_time_minutes: p.study_time_minutes + minutes })
}

export function resetProgress(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}
