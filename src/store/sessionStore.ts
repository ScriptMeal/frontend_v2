import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Message, Session } from '@/types'
import { generateUUID } from '@/lib/utils'

interface SessionState {
  currentSessionId: string
  history: Message[]
  /**
   * 라이브 세션의 메시지 index → history_id 매핑.
   * `saveHistory` 응답의 id 를 보관해, 즐겨찾기 저장 시 history_id 를 함께 보낸다.
   * Message 객체에 붙이지 않는 이유: assistant 버블을 그린 뒤(await 경계 너머)
   * 렌더 상태(history 배열)를 다시 mutate 하면 말풍선 이중 렌더가 재발할 수 있다.
   * (.claude/debugging/20260608-chat-double-bubble.md) → 렌더와 분리된 별도 슬라이스로 보관.
   * 라이브 전용이라 persist 하지 않는다(새로고침 시 휘발).
   */
  historyIds: Record<number, number>
  sessions: Session[]
  /**
   * 즐겨찾기를 1건 이상 보유한 세션 id 집합. 즐겨찾기 페이지가 이 세션들에만
   * `GET /api/favorites` 를 fan-out 한다(세션 총수와 무관하게 부하 최소화).
   */
  favoriteSessionIds: string[]
  /** 홈→채팅 핸드오프: 채팅 진입 시 자동 전송할 첫 메시지 */
  pendingMessage: string | null
  startNewSession: () => void
  /** 영속된 세션 목록·즐겨찾기 인덱스를 모두 비우고 새 세션을 연다(시연용 빠른 초기화). */
  clearSessions: () => void
  addMessage: (message: Omit<Message, 'clientId'> & { clientId?: string }) => void
  /** 라이브 세션에서 메시지 index 의 history_id 를 기록한다(saveHistory 응답 직후). */
  recordHistoryId: (index: number, historyId: number) => void
  setHistory: (history: Message[]) => void
  addSession: (session: Session) => void
  /**
   * 세션을 사이드바 목록(`sessions`)·즐겨찾기 인덱스(`favoriteSessionIds`)에서 함께 제거한다.
   * 마지막 대화 기록을 삭제해 세션이 비었을 때 호출한다(빈 세션 잔류 방지).
   */
  removeSession: (sessionId: string) => void
  markSessionFavorited: (sessionId: string) => void
  unmarkSessionFavorited: (sessionId: string) => void
  setPendingMessage: (message: string) => void
  /**
   * historyId 에 해당하는 user+assistant 쌍을 history 에서 제거하고 historyIds 를 재색인한다.
   * DELETE /api/history/{id} 성공 직후 라이브 세션에서 호출한다.
   */
  removeHistoryPair: (historyId: number) => void
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
      historyIds: {},
      sessions: [],
      favoriteSessionIds: [],
      pendingMessage: null,

      startNewSession: () =>
        set({
          currentSessionId: generateUUID(),
          history: [],
          historyIds: {},
          pendingMessage: null,
        }),

      // 새 세션 + 영속 데이터(sessions·favoriteSessionIds)까지 비운다. persist 가 localStorage 도 동기화.
      clearSessions: () =>
        set({
          currentSessionId: generateUUID(),
          history: [],
          historyIds: {},
          sessions: [],
          favoriteSessionIds: [],
          pendingMessage: null,
        }),

      addMessage: (message) =>
        set((state) => ({
          history: [
            ...state.history,
            { ...message, clientId: message.clientId ?? crypto.randomUUID() },
          ],
        })),

      recordHistoryId: (index, historyId) =>
        set((state) => ({ historyIds: { ...state.historyIds, [index]: historyId } })),

      setHistory: (history) => set({ history }),

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          favoriteSessionIds: state.favoriteSessionIds.filter((id) => id !== sessionId),
        })),

      markSessionFavorited: (sessionId) =>
        set((state) =>
          state.favoriteSessionIds.includes(sessionId)
            ? state
            : { favoriteSessionIds: [...state.favoriteSessionIds, sessionId] },
        ),

      unmarkSessionFavorited: (sessionId) =>
        set((state) => ({
          favoriteSessionIds: state.favoriteSessionIds.filter((id) => id !== sessionId),
        })),

      setPendingMessage: (message) => set({ pendingMessage: message }),

      removeHistoryPair: (historyId) =>
        set((state) => {
          const entry = Object.entries(state.historyIds).find(([, id]) => id === historyId)
          if (!entry) return state

          const aIdx = parseInt(entry[0], 10)
          // 바로 앞이 user 일 때만 쌍으로 묶어 함께 제거한다. 정합이 깨져(앞이 user 가 아님)
          // 있으면 assistant 단독 제거로 폴백해 무관한 메시지를 지우지 않는다.
          const uIdx = state.history[aIdx - 1]?.role === 'user' ? aIdx - 1 : -1
          const removed = new Set([aIdx, uIdx].filter((i) => i >= 0))

          const newHistory = state.history.filter((_, i) => !removed.has(i))

          // 제거된 항목보다 뒤에 있던 인덱스를, 그 앞에서 빠진 개수만큼 당겨 재색인한다.
          const newHistoryIds: Record<number, number> = {}
          Object.entries(state.historyIds).forEach(([idxStr, hId]) => {
            const i = parseInt(idxStr, 10)
            if (i === aIdx) return
            const shift = [...removed].filter((r) => r < i).length
            newHistoryIds[i - shift] = hId
          })

          return { history: newHistory, historyIds: newHistoryIds }
        }),

      consumePendingMessage: () => {
        const pending = get().pendingMessage
        if (pending !== null) set({ pendingMessage: null })
        return pending
      },
    }),
    {
      name: 'scriptmeal-sessions',
      storage: createJSONStorage(() => localStorage),
      // 사이드바 목록 + 즐겨찾기 보유 세션 인덱스만 보존 — 라이브 세션 상태는 휘발이 의도.
      partialize: (state) => ({
        sessions: state.sessions,
        favoriteSessionIds: state.favoriteSessionIds,
      }),
    },
  ),
)
