import { create } from 'zustand'
import type { Message, Session } from '@/types'
import { generateUUID } from '@/lib/utils'

interface SessionState {
  currentSessionId: string
  history: Message[]
  sessions: Session[]
  /** 홈→채팅 핸드오프: 채팅 진입 시 자동 전송할 첫 메시지 */
  pendingMessage: string | null
  /**
   * 과거 세션 조회 모드 여부. true 면 입력창을 비활성하고 `GET /api/history` 로
   * 로드한 기록을 읽기 전용으로 렌더한다. (이어쓰기 확장 시 이 플래그만 해제)
   */
  readOnly: boolean
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
  readOnly: false,

  startNewSession: () =>
    set({
      currentSessionId: generateUUID(),
      history: [],
      pendingMessage: null,
      readOnly: false,
    }),

  // 과거 세션 진입 → 읽기 전용. ChatPage 가 useHistory 로 로드해 렌더한다.
  switchSession: (sessionId) =>
    set({ currentSessionId: sessionId, history: [], pendingMessage: null, readOnly: true }),

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
