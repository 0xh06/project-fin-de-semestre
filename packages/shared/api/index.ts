// ============================================================================
// SmartStudy AI — Platform-agnostic API client
// Works in both browser (Next.js) and React Native (Expo) environments.
// Token storage is injected so it works with localStorage OR SecureStore.
// ============================================================================

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
} from '../types';

// --- Token storage abstraction ---
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
}

// --- API Error ---
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- API Client Factory ---
export function createApiClient(baseUrl: string, tokenStorage: TokenStorage) {
  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await tokenStorage.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ApiError(response.status, error || 'Request failed');
    }

    return response.json();
  }

  // --- Auth ---
  const auth = {
    async login(data: LoginRequest): Promise<AuthResponse> {
      const res = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await tokenStorage.setToken(res.token);
      return res;
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
      const res = await request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await tokenStorage.setToken(res.token);
      return res;
    },

    async getCurrentUser(): Promise<User> {
      return request<User>('/api/auth/me');
    },

    async logout(): Promise<void> {
      await tokenStorage.removeToken();
    },
  };

  // --- Documents ---
  const documents = {
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

    /**
     * Upload a document. On web pass a File; on mobile pass a
     * { uri, name, type } object that fetch() can handle.
     */
    async upload(
      filePayload: any,
      title?: string,
      token?: string
    ): Promise<Document> {
      const authToken = token ?? (await tokenStorage.getToken());
      const formData = new FormData();
      formData.append('file', filePayload);
      if (title) formData.append('title', title);

      const response = await fetch(`${baseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Upload failed');
      }
      return response.json();
    },
  };

  // --- Chat ---
  const chat = {
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
      return request<void>('/api/chat/history', { method: 'DELETE' });
    },
  };

  // --- Flashcards ---
  const flashcards = {
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

  // --- Quiz ---
  const quiz = {
    async createSession(data: QuizCreateRequest): Promise<QuizSession> {
      return request<QuizSession>('/api/quiz/session', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getQuestion(sessionId: number, questionIndex: number): Promise<QuizQuestion> {
      return request<QuizQuestion>(
        `/api/quiz/session/${sessionId}/question/${questionIndex}`
      );
    },

    async submitAnswer(
      data: QuizSubmitRequest
    ): Promise<{ is_correct: boolean; explanation?: string }> {
      return request('/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async finishSession(
      sessionId: number
    ): Promise<{ score: number; weak_topics: string[]; recommendations: string[] }> {
      return request(`/api/quiz/session/${sessionId}/finish`, {
        method: 'POST',
      });
    },
  };

  // --- Mindmap ---
  const mindmap = {
    async generate(documentId: number): Promise<MindMap> {
      return request<MindMap>(`/api/mindmap/generate/${documentId}`, {
        method: 'POST',
      });
    },

    async getById(id: number): Promise<MindMap> {
      return request<MindMap>(`/api/mindmap/${id}`);
    },

    async save(m: MindMap): Promise<MindMap> {
      return request<MindMap>('/api/mindmap', {
        method: 'POST',
        body: JSON.stringify(m),
      });
    },
  };

  // --- Gamification ---
  const gamification = {
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
      return request<void>('/api/gamification/activity', { method: 'POST' });
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

  return { auth, documents, chat, flashcards, quiz, mindmap, gamification };
}

export type SmartStudyApi = ReturnType<typeof createApiClient>;
