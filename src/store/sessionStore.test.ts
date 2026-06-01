import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from './sessionStore'

beforeEach(() => {
  useSessionStore.setState({
    currentSessionId: 'init',
    history: [],
    sessions: [],
    pendingMessage: null,
    readOnly: false,
  })
})

describe('sessionStore — 세션 전환 / 읽기 전용', () => {
  it('startNewSession 은 새 id·빈 history·readOnly 해제로 라이브 세션을 연다 (happy)', () => {
    useSessionStore.setState({ readOnly: true, history: [{ role: 'user', content: 'x' }] })
    const prevId = useSessionStore.getState().currentSessionId

    useSessionStore.getState().startNewSession()

    const s = useSessionStore.getState()
    expect(s.currentSessionId).not.toBe(prevId)
    expect(s.history).toEqual([])
    expect(s.readOnly).toBe(false)
    expect(s.pendingMessage).toBeNull()
  })

  it('switchSession 은 과거 세션을 읽기 전용으로 연다 (history 비우고 readOnly 설정) (happy)', () => {
    useSessionStore.setState({ history: [{ role: 'user', content: 'live' }] })

    useSessionStore.getState().switchSession('past-1')

    const s = useSessionStore.getState()
    expect(s.currentSessionId).toBe('past-1')
    expect(s.readOnly).toBe(true)
    expect(s.history).toEqual([])
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
