// TypeScript types matching C structs from SmartStudy AI backend

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Document {
  id: number;
  user_id: number;
  title: string;
  file_path: string;
  content_text: string;
  summary_ai: string;
  tags: string;
  page_count: number;
  file_size_bytes: number;
  imported_at: string;
}

export interface ChatSession {
  id: number;
  user_id: number;
  document_id: number;
  title: string;
  ai_provider: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  created_at: string;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  difficulty: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
}

export interface Deck {
  id: number;
  user_id: number;
  document_id: number;
  name: string;
  description: string;
}

export interface QuizSession {
  id: number;
  user_id: number;
  mode: 'multiple_choice' | 'true_false' | 'open_ended';
  difficulty: 'auto' | 'easy' | 'medium' | 'hard';
  question_count: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  session_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface QuizAnswer {
  id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface MindMapNode {
  id: number;
  label: string;
  color: string;
  parent_id: number;
}

export interface MindMapEdge {
  from_id: number;
  to_id: number;
  relation_label: string;
}

export interface MindMap {
  id: number;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface DashboardStats {
  user_id: number;
  xp_total: number;
  level: number;
  xp_to_next_level: number;
  streak_days: number;
  longest_streak: number;
  documents_count: number;
  flashcards_mastered: number;
  flashcards_total: number;
  quizzes_completed: number;
  perfect_quizzes: number;
  study_time_minutes: number;
  weekly_xp: number[];
  badges_count: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  awarded_at: string;
}

export interface StreakResult {
  current_streak: number;
  longest_streak: number;
  streak_maintained: boolean;
  streak_broken: boolean;
  last_study_date: string;
}

export interface ChatResponse {
  content: string;
  tokens_used: number;
  total_tokens: number;
  model_used: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DocumentUploadRequest {
  file: File;
  title?: string;
}

export interface DocumentAnalysisRequest {
  document_id: number;
}

export interface ChatSendRequest {
  user_message: string;
  document_ids?: number[];
}

export interface QuizCreateRequest {
  document_ids: number[];
  mode: 'multiple_choice' | 'true_false' | 'open_ended';
  difficulty: 'auto' | 'easy' | 'medium' | 'hard';
  question_count: number;
}

export interface QuizSubmitRequest {
  session_id: number;
  question_index: number;
  answer: string;
}

export interface FlashcardReviewRequest {
  card_id: number;
  quality: number; // 0-5
}
