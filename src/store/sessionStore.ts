import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Message, Session } from '@/types'
import { generateUUID } from '@/lib/utils'

interface SessionState {
  currentSessionId: string
  history: Message[]
  sessions: Session[]
  /** 홈→채팅 핸드오프: 채팅 진입 시 자동 전송할 첫 메시지 */
  pendingMessage: string | null
  startNewSession: () => void
  addMessage: (message: Message) => void
  setHistory: (history: Message[]) => void
  addSession: (session: Session) => void
  setPendingMessage: (message: string) => void
  /**
   * 대기 메시지를 원자적으로 읽고 즉시 비운다(없으면 null).
   * 핸드오프 effect 가 StrictMode 로 이중 호출돼도 두 번째 호출은 null 을 받아
   * 동일 메시지가 두 번 전송되는 것을 막는다(라이브 스토어 값 기준이라 리렌더 타이밍 무관).
   */
  consumePendingMessage: () => string | null
}

/**
 * 읽기 전용(과거 세션 조회)은 store 플래그가 아니라 라우트(`/chat/:sessionId`)로 판정한다.
 * 이 store 는 라이브 세션만 소유하며, `sessions`(사이드바 목록)만 localStorage 에 영속화한다.
 * `currentSessionId`·`history` 는 라이브 전용이라 persist 하지 않는다(새로고침 시 새 세션).
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentSessionId: generateUUID(),
      history: [],
      sessions: [],
      pendingMessage: null,

      startNewSession: () =>
        set({
          currentSessionId: generateUUID(),
          history: [],
          pendingMessage: null,
        }),

      addMessage: (message) => set((state) => ({ history: [...state.history, message] })),

      setHistory: (history) => set({ history }),

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
        })),

      setPendingMessage: (message) => set({ pendingMessage: message }),

      consumePendingMessage: () => {
        const pending = get().pendingMessage
        if (pending !== null) set({ pendingMessage: null })
        return pending
      },
    }),
    {
      name: 'scriptmeal-sessions',
      storage: createJSONStorage(() => localStorage),
      // 사이드바 목록만 보존 — 라이브 세션 상태는 휘발이 의도.
      partialize: (state) => ({ sessions: state.sessions }),
    },
  ),
)
