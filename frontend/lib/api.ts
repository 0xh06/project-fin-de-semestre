// API client for SmartStudy AI backend
import type {
  User,
  Document,
  ChatMessage,
  Flashcard,
  QuizSession,
  QuizQuestion,
  MindMap,
  DashboardStats,
  Badge,
  StreakResult,
  ChatResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChatSendRequest,
  QuizCreateRequest,
  QuizSubmitRequest,
  FlashcardReviewRequest,
} from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function createNetworkError() {
  return new ApiError(
    0,
    `Impossible de joindre l'API sur ${API_BASE_URL}. Vérifie que le backend est démarré.`,
    'api_unreachable'
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Request failed';
    let errorCode: string | undefined;

    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.error && typeof parsed.error === 'string') {
        errorMessage = parsed.error;
      }
      errorCode = typeof parsed?.code === 'string' ? parsed.code : undefined;
    } catch {}

    throw new ApiError(response.status, errorMessage, errorCode);
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCurrentUser(): Promise<User> {
    return request<User>('/api/auth/me');
  },
};

// Documents API
export const documentsApi = {
  async upload(file: File, title?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const token = localStorage.getItem('token');
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });
    } catch {
      throw createNetworkError();
    }

    if (!response.ok) {
      throw new ApiError(response.status, 'Upload failed');
    }

    return response.json();
  },

  async list(): Promise<Document[]> {
    return request<Document[]>('/api/documents');
  },

  async getById(id: number): Promise<Document> {
    return request<Document>(`/api/documents/${id}`);
  },

  async analyze(id: number): Promise<Document> {
    return request<Document>(`/api/documents/${id}/analyze`, {
      method: 'POST',
    });
  },

  async delete(id: number): Promise<void> {
    return request<void>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Chat API
export const chatApi = {
  async send(data: ChatSendRequest): Promise<ChatResponse> {
    return request<ChatResponse>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getHistory(limit: number = 50): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/api/chat/history?limit=${limit}`);
  },

  async clearHistory(): Promise<void> {
    return request<void>('/api/chat/history', {
      method: 'DELETE',
    });
  },

  async suggestFollowup(lastMessage: string, aiResponse: string): Promise<string[]> {
    return request<string[]>('/api/chat/followup', {
      method: 'POST',
      body: JSON.stringify({ last_message: lastMessage, ai_response: aiResponse }),
    });
  },
};

// Flashcards API
export const flashcardsApi = {
  async getDueToday(): Promise<Flashcard[]> {
    return request<Flashcard[]>('/api/flashcards/due');
  },

  async review(data: FlashcardReviewRequest): Promise<Flashcard> {
    return request<Flashcard>('/api/flashcards/review', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStats(): Promise<{ mastered: number; total: number; due_today: number }> {
    return request('/api/flashcards/stats');
  },

  async generateFromText(text: string, documentId?: number): Promise<Flashcard[]> {
    return request<Flashcard[]>('/api/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({ text, document_id: documentId }),
    });
  },
};

// Quiz API
export const quizApi = {
  async createSession(data: QuizCreateRequest): Promise<QuizSession> {
    return request<QuizSession>('/api/quiz/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQuestion(sessionId: number, questionIndex: number): Promise<QuizQuestion> {
    return request<QuizQuestion>(`/api/quiz/session/${sessionId}/question/${questionIndex}`);
  },

  async submitAnswer(data: QuizSubmitRequest): Promise<{ is_correct: boolean; explanation?: string }> {
    return request('/api/quiz/answer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async finishSession(sessionId: number): Promise<{
    score: number;
    weak_topics: string[];
    recommendations: string[];
  }> {
    return request(`/api/quiz/session/${sessionId}/finish`, {
      method: 'POST',
    });
  },
};

// Mindmap API
export const mindmapApi = {
  async generate(documentId: number): Promise<MindMap> {
    return request<MindMap>(`/api/mindmap/generate/${documentId}`, {
      method: 'POST',
    });
  },

  async getById(id: number): Promise<MindMap> {
    return request<MindMap>(`/api/mindmap/${id}`);
  },

  async save(mindmap: MindMap): Promise<MindMap> {
    return request<MindMap>('/api/mindmap', {
      method: 'POST',
      body: JSON.stringify(mindmap),
    });
  },
};

// Gamification API
export const gamificationApi = {
  async getDashboard(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/gamification/dashboard');
  },

  async addXp(xp: number, reason: string): Promise<void> {
    return request<void>('/api/gamification/xp', {
      method: 'POST',
      body: JSON.stringify({ xp, reason }),
    });
  },

  async getStreak(): Promise<StreakResult> {
    return request<StreakResult>('/api/gamification/streak');
  },

  async recordActivity(): Promise<void> {
    return request<void>('/api/gamification/activity', {
      method: 'POST',
    });
  },

  async getBadges(): Promise<Badge[]> {
    return request<Badge[]>('/api/gamification/badges');
  },

  async addStudyTime(minutes: number): Promise<void> {
    return request<void>('/api/gamification/study-time', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },
};

export default {
  auth: authApi,
  documents: documentsApi,
  chat: chatApi,
  flashcards: flashcardsApi,
  quiz: quizApi,
  mindmap: mindmapApi,
  gamification: gamificationApi,
};
