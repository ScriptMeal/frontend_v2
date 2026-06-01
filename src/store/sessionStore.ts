import { create } from 'zustand'
import type { Message, Session } from '@/types'
import { generateUUID } from '@/lib/utils'

interface SessionState {
  currentSessionId: string
  history: Message[]
  sessions: Session[]
  /** 홈→채팅 핸드오프: 채팅 진입 시 자동 전송할 첫 메시지 */
  pendingMessage: string | null
  startNewSession: () => void
  switchSession: (sessionId: string) => void
  addMessage: (message: Message) => void
  setHistory: (history: Message[]) => void
  addSession: (session: Session) => void
  setPendingMessage: (message: string) => void
  clearPendingMessage: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: generateUUID(),
  history: [],
  sessions: [],
  pendingMessage: null,

  startNewSession: () =>
    set({ currentSessionId: generateUUID(), history: [], pendingMessage: null }),

  switchSession: (sessionId) =>
    set({ currentSessionId: sessionId, history: [], pendingMessage: null }),

  addMessage: (message) =>
    set((state) => ({ history: [...state.history, message] })),

  setHistory: (history) => set({ history }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    })),

  setPendingMessage: (message) => set({ pendingMessage: message }),

  clearPendingMessage: () => set({ pendingMessage: null }),
}))
