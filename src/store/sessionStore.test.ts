import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from './sessionStore'

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState({
    currentSessionId: 'init',
    history: [],
    sessions: [],
    favoriteSessionIds: [],
    pendingMessage: null,
  })
})

describe('sessionStore — 새 세션', () => {
  it('startNewSession 은 새 id·빈 history 로 라이브 세션을 연다 (happy)', () => {
    useSessionStore.setState({ history: [{ role: 'user', content: 'x' }] })
    const prevId = useSessionStore.getState().currentSessionId

    useSessionStore.getState().startNewSession()

    const s = useSessionStore.getState()
    expect(s.currentSessionId).not.toBe(prevId)
    expect(s.history).toEqual([])
    expect(s.pendingMessage).toBeNull()
  })

  it('addSession 은 세션을 최신순으로 추가하고 같은 id 를 중복하지 않는다 (edge)', () => {
    const session = { id: 's1', createdAt: '2026-06-01T00:00:00Z', preview: '첫 메시지' }
    useSessionStore.getState().addSession(session)
    useSessionStore.getState().addSession({ ...session, preview: '갱신 시도' })

    const { sessions } = useSessionStore.getState()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].id).toBe('s1')
  })
})

describe('sessionStore — localStorage 영속화 (persist)', () => {
  it('addSession 결과가 localStorage 에 저장된다 (happy)', () => {
    useSessionStore
      .getState()
      .addSession({ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: '떡볶이' })

    const raw = localStorage.getItem('scriptmeal-sessions')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.sessions).toEqual([
      { id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: '떡볶이' },
    ])
  })

  it('sessions·favoriteSessionIds 만 persist 하고 history·currentSessionId 는 저장하지 않는다 (partialize, edge)', () => {
    useSessionStore.setState({
      currentSessionId: 'live-xyz',
      history: [{ role: 'user', content: 'hi' }],
    })
    useSessionStore
      .getState()
      .addSession({ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p' })

    const parsed = JSON.parse(localStorage.getItem('scriptmeal-sessions')!)
    expect(Object.keys(parsed.state).sort()).toEqual(['favoriteSessionIds', 'sessions'])
  })

  it('localStorage 에 저장된 세션을 rehydrate 후 복원한다 (새로고침 시나리오, happy)', async () => {
    localStorage.setItem(
      'scriptmeal-sessions',
      JSON.stringify({
        state: {
          sessions: [{ id: 'restored', createdAt: '2026-06-02T00:00:00Z', preview: '복원됨' }],
        },
        version: 0,
      }),
    )

    await useSessionStore.persist.rehydrate()

    expect(useSessionStore.getState().sessions).toEqual([
      { id: 'restored', createdAt: '2026-06-02T00:00:00Z', preview: '복원됨' },
    ])
  })
})

describe('sessionStore — 즐겨찾기 보유 세션 인덱스 (favoriteSessionIds)', () => {
  it('markSessionFavorited 는 세션 id 를 추가하고 중복을 막는다 (happy/edge)', () => {
    useSessionStore.getState().markSessionFavorited('s1')
    useSessionStore.getState().markSessionFavorited('s1')
    useSessionStore.getState().markSessionFavorited('s2')

    expect(useSessionStore.getState().favoriteSessionIds).toEqual(['s1', 's2'])
  })

  it('unmarkSessionFavorited 는 해당 id 를 제거한다 (happy)', () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1', 's2'] })

    useSessionStore.getState().unmarkSessionFavorited('s1')

    expect(useSessionStore.getState().favoriteSessionIds).toEqual(['s2'])
  })

  it('favoriteSessionIds 도 localStorage 에 persist 된다 (edge)', () => {
    useSessionStore.getState().markSessionFavorited('s1')

    const parsed = JSON.parse(localStorage.getItem('scriptmeal-sessions')!)
    expect(parsed.state.favoriteSessionIds).toEqual(['s1'])
    // 라이브 상태는 여전히 저장되지 않는다
    expect(Object.keys(parsed.state).sort()).toEqual(['favoriteSessionIds', 'sessions'])
  })
})

describe('sessionStore — consumePendingMessage (핸드오프 1회 전송 보장)', () => {
  it('대기 메시지를 반환하면서 즉시 비운다 (happy)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이 먹고 싶어' })

    const msg = useSessionStore.getState().consumePendingMessage()

    expect(msg).toBe('떡볶이 먹고 싶어')
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })

  it('두 번째 호출은 null 을 반환한다 — StrictMode 이중 호출 시 이중 전송 방지 (edge)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이 먹고 싶어' })

    const first = useSessionStore.getState().consumePendingMessage()
    const second = useSessionStore.getState().consumePendingMessage()

    expect(first).toBe('떡볶이 먹고 싶어')
    expect(second).toBeNull()
  })

  it('대기 메시지가 없으면 null 을 반환한다 (edge)', () => {
    expect(useSessionStore.getState().consumePendingMessage()).toBeNull()
  })
})
