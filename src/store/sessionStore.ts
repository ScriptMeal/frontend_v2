import { create } from 'zustand'
import type { Message, Session } from '@/types'
import { generateUUID } from '@/lib/utils'

interface SessionState {
  currentSessionId: string
  history: Message[]
  sessions: Session[]
  startNewSession: () => void
  switchSession: (sessionId: string) => void
  addMessage: (message: Message) => void
  setHistory: (history: Message[]) => void
  addSession: (session: Session) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: generateUUID(),
  history: [],
  sessions: [],

  startNewSession: () =>
    set({ currentSessionId: generateUUID(), history: [] }),

  switchSession: (sessionId) =>
    set({ currentSessionId: sessionId, history: [] }),

  addMessage: (message) =>
    set((state) => ({ history: [...state.history, message] })),

  setHistory: (history) => set({ history }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    })),
}))
