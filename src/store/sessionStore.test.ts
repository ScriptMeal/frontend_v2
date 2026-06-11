import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from './sessionStore'
import type { Message } from '@/types'

// content 를 그대로 clientId 로 쓰는 결정적 헬퍼. removeHistoryPair 처럼 메시지 객체를
// 그대로 보존하는 동작을 toEqual 로 검증할 때 입력·기대값의 clientId 가 일치한다.
const m = (role: Message['role'], content: string): Message => ({ role, content, clientId: content })

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState({
    currentSessionId: 'init',
    history: [],
    historyIds: {},
    sessions: [],
    favoriteSessionIds: [],
    pendingMessage: null,
  })
})

describe('sessionStore — 새 세션', () => {
  it('startNewSession 은 새 id·빈 history 로 라이브 세션을 연다 (happy)', () => {
    useSessionStore.setState({ history: [m('user', 'x')] })
    const prevId = useSessionStore.getState().currentSessionId

    useSessionStore.getState().startNewSession()

    const s = useSessionStore.getState()
    expect(s.currentSessionId).not.toBe(prevId)
    expect(s.history).toEqual([])
    expect(s.pendingMessage).toBeNull()
  })

  it('startNewSession 은 생성한 새 id 를 반환한다 (홈→채팅 라우팅용, happy)', () => {
    const returned = useSessionStore.getState().startNewSession()

    expect(returned).toBe(useSessionStore.getState().currentSessionId)
    expect(typeof returned).toBe('string')
    expect(returned).toBeTruthy()
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

describe('sessionStore — loadSession (과거 세션 하이드레이션, 세션당 1회)', () => {
  it('currentSessionId·history·historyIds 를 한 번에 적재한다 (happy)', () => {
    const messages = [m('user', 'q1'), m('assistant', 'a1')]

    useSessionStore.getState().loadSession('past-1', messages, { 1: 10 })

    const s = useSessionStore.getState()
    expect(s.currentSessionId).toBe('past-1')
    expect(s.history).toEqual(messages)
    expect(s.historyIds).toEqual({ 1: 10 })
  })

  it('이전 라이브 세션 상태를 완전히 덮어쓴다 (세션 전환, edge)', () => {
    useSessionStore.setState({
      currentSessionId: 'live',
      history: [m('user', 'old')],
      historyIds: { 1: 99 },
    })

    useSessionStore.getState().loadSession('past-2', [], {})

    const s = useSessionStore.getState()
    expect(s.currentSessionId).toBe('past-2')
    expect(s.history).toEqual([])
    expect(s.historyIds).toEqual({})
  })
})

describe('sessionStore — addMessage (안정적 clientId 부여)', () => {
  it('메시지에 문자열 clientId 를 부여한다 (happy)', () => {
    useSessionStore.getState().addMessage({ role: 'user', content: 'q' })

    const [m] = useSessionStore.getState().history
    expect(m).toMatchObject({ role: 'user', content: 'q' })
    expect(typeof m.clientId).toBe('string')
    expect(m.clientId).toBeTruthy()
  })

  it('연속 추가된 메시지는 서로 다른 clientId 를 갖는다 (edge)', () => {
    useSessionStore.getState().addMessage({ role: 'user', content: 'a' })
    useSessionStore.getState().addMessage({ role: 'assistant', content: 'b' })

    const [m1, m2] = useSessionStore.getState().history
    expect(m1.clientId).toBeTruthy()
    expect(m1.clientId).not.toBe(m2.clientId)
  })

  it('호출자가 clientId 를 지정하면 그대로 보존한다 (edge)', () => {
    useSessionStore.getState().addMessage({ role: 'user', content: 'q', clientId: 'fixed-id' })

    expect(useSessionStore.getState().history[0].clientId).toBe('fixed-id')
  })
})

describe('sessionStore — historyIds (라이브 세션, 메시지 index → history_id)', () => {
  it('recordHistoryId 는 메시지 index 에 history_id 를 기록한다 (happy)', () => {
    useSessionStore.getState().recordHistoryId(1, 42)
    useSessionStore.getState().recordHistoryId(3, 43)

    expect(useSessionStore.getState().historyIds).toEqual({ 1: 42, 3: 43 })
  })

  it('startNewSession 은 historyIds 를 비운다 (edge)', () => {
    useSessionStore.setState({ historyIds: { 1: 42 } })

    useSessionStore.getState().startNewSession()

    expect(useSessionStore.getState().historyIds).toEqual({})
  })

  it('clearSessions 도 historyIds 를 비운다 (edge)', () => {
    useSessionStore.setState({ historyIds: { 1: 42 } })

    useSessionStore.getState().clearSessions()

    expect(useSessionStore.getState().historyIds).toEqual({})
  })

  it('historyIds 는 localStorage 에 persist 되지 않는다 (라이브 전용, edge)', () => {
    useSessionStore.getState().recordHistoryId(1, 42)
    useSessionStore
      .getState()
      .addSession({ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p' })

    const parsed = JSON.parse(localStorage.getItem('scriptmeal-sessions')!)
    expect(parsed.state).not.toHaveProperty('historyIds')
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
      history: [m('user', 'hi')],
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

describe('sessionStore — removeSession (빈 세션 정리)', () => {
  it('해당 세션을 sessions·favoriteSessionIds 에서 동시에 제거한다 (happy)', () => {
    useSessionStore.setState({
      sessions: [
        { id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p1' },
        { id: 's2', createdAt: '2026-06-03T00:00:00Z', preview: 'p2' },
      ],
      favoriteSessionIds: ['s1', 's2'],
    })

    useSessionStore.getState().removeSession('s1')

    const s = useSessionStore.getState()
    expect(s.sessions.map((x) => x.id)).toEqual(['s2'])
    expect(s.favoriteSessionIds).toEqual(['s2'])
  })

  it('즐겨찾기에 없는 세션도 sessions 에서만 제거된다 (edge)', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p1' }],
      favoriteSessionIds: [],
    })

    useSessionStore.getState().removeSession('s1')

    expect(useSessionStore.getState().sessions).toEqual([])
    expect(useSessionStore.getState().favoriteSessionIds).toEqual([])
  })

  it('제거 결과가 localStorage 에 반영된다 (edge)', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p1' }],
      favoriteSessionIds: ['s1'],
    })

    useSessionStore.getState().removeSession('s1')

    const parsed = JSON.parse(localStorage.getItem('scriptmeal-sessions')!)
    expect(parsed.state.sessions).toEqual([])
    expect(parsed.state.favoriteSessionIds).toEqual([])
  })
})

describe('sessionStore — clearSessions (단축키 초기화)', () => {
  it('sessions·favoriteSessionIds·history 를 비우고 새 세션을 연다 (happy)', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p' }],
      favoriteSessionIds: ['s1'],
      history: [m('user', 'hi')],
      pendingMessage: 'x',
    })
    const prevId = useSessionStore.getState().currentSessionId

    useSessionStore.getState().clearSessions()

    const s = useSessionStore.getState()
    expect(s.sessions).toEqual([])
    expect(s.favoriteSessionIds).toEqual([])
    expect(s.history).toEqual([])
    expect(s.pendingMessage).toBeNull()
    expect(s.currentSessionId).not.toBe(prevId)
  })

  it('비운 결과가 localStorage 에 반영된다 (edge)', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p' }],
      favoriteSessionIds: ['s1'],
    })

    useSessionStore.getState().clearSessions()

    const parsed = JSON.parse(localStorage.getItem('scriptmeal-sessions')!)
    expect(parsed.state.sessions).toEqual([])
    expect(parsed.state.favoriteSessionIds).toEqual([])
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

describe('sessionStore — removeHistoryPair (히스토리 쌍 삭제)', () => {
  it('historyId 에 해당하는 user+assistant 쌍을 history 에서 제거한다 (happy)', () => {
    useSessionStore.setState({
      history: [
        m('user', 'q1'),
        m('assistant', 'a1'),
        m('user', 'q2'),
        m('assistant', 'a2'),
      ],
      historyIds: { 1: 10, 3: 20 },
    })

    useSessionStore.getState().removeHistoryPair(10)

    const { history, historyIds } = useSessionStore.getState()
    expect(history).toEqual([m('user', 'q2'), m('assistant', 'a2')])
    expect(historyIds).toEqual({ 1: 20 })
  })

  it('마지막 쌍을 삭제하면 history 가 비워진다 (edge)', () => {
    useSessionStore.setState({
      history: [m('user', 'q1'), m('assistant', 'a1')],
      historyIds: { 1: 10 },
    })

    useSessionStore.getState().removeHistoryPair(10)

    expect(useSessionStore.getState().history).toEqual([])
    expect(useSessionStore.getState().historyIds).toEqual({})
  })

  it('중간 쌍을 삭제하면 뒤 쌍의 historyIds 인덱스를 -2 당겨 재색인한다 (edge)', () => {
    useSessionStore.setState({
      history: [
        m('user', 'q1'),
        m('assistant', 'a1'),
        m('user', 'q2'),
        m('assistant', 'a2'),
        m('user', 'q3'),
        m('assistant', 'a3'),
      ],
      historyIds: { 1: 10, 3: 20, 5: 30 },
    })

    useSessionStore.getState().removeHistoryPair(20)

    const { history, historyIds } = useSessionStore.getState()
    expect(history.map((m) => m.content)).toEqual(['q1', 'a1', 'q3', 'a3'])
    expect(historyIds).toEqual({ 1: 10, 3: 30 })
  })

  it('바로 앞이 user 가 아니면(정합 깨짐) assistant 만 제거하고 무관한 메시지를 지키지 않는다 (edge, 방어)', () => {
    useSessionStore.setState({
      history: [m('assistant', 'orphan-a'), m('user', 'q1'), m('assistant', 'a1')],
      historyIds: { 0: 10, 2: 20 },
    })

    useSessionStore.getState().removeHistoryPair(10)

    const { history, historyIds } = useSessionStore.getState()
    // orphan assistant(index 0)만 제거 — 뒤 쌍(q1+a1)은 보존하고 인덱스를 -1 당긴다.
    expect(history).toEqual([m('user', 'q1'), m('assistant', 'a1')])
    expect(historyIds).toEqual({ 1: 20 })
  })

  it('존재하지 않는 historyId 면 상태가 변하지 않는다 (edge)', () => {
    const initialHistory = [m('user', 'q1'), m('assistant', 'a1')]
    useSessionStore.setState({ history: initialHistory, historyIds: { 1: 10 } })

    useSessionStore.getState().removeHistoryPair(999)

    expect(useSessionStore.getState().history).toEqual(initialHistory)
    expect(useSessionStore.getState().historyIds).toEqual({ 1: 10 })
  })
})
