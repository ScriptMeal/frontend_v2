import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import type { StreamEvent } from '@/types'

const mocks = vi.hoisted(() => ({
  streamChat: vi.fn(),
  saveHistory: vi.fn(),
}))

vi.mock('@/api/chat', () => ({ streamChat: mocks.streamChat }))
vi.mock('@/api/user', () => ({ saveHistory: mocks.saveHistory }))

import { useStream } from './useStream'
import { useSessionStore } from '@/store/sessionStore'
import type { HistoryRecord } from '@/types'

function makeStream(events: StreamEvent[]) {
  return (async function* () {
    for (const event of events) yield event
  })()
}

/**
 * useStream 은 저장 후 history 캐시를 갱신하므로 QueryClientProvider 가 필요하다.
 * 새 QueryClient 로 격리 렌더하고, 캐시 검증을 위해 client 도 함께 반환한다.
 */
function renderStream(deps?: Parameters<typeof useStream>[0]) {
  const queryClient = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, ...renderHook(() => useStream(deps), { wrapper }) }
}

function makeHistoryRecord(over: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: 1,
    session_id: 's1',
    user_message: 'u',
    recipe_reply: 'r',
    intent: 'OFF_TOPIC',
    created_at: '2026-06-01T00:00:00Z',
    ...over,
  }
}

beforeEach(() => {
  mocks.streamChat.mockReset()
  // saveHistory 는 이제 생성된 HistoryRecord(id 포함)를 반환한다(라이브 history_id 출처)
  mocks.saveHistory.mockReset().mockResolvedValue(makeHistoryRecord())
  useSessionStore.setState({ currentSessionId: 's1', history: [], historyIds: {}, sessions: [] })
})

describe('useStream', () => {
  it('chunk 누적 + done(구매정보) 을 본문 인라인으로 합치고 history·저장한다 (happy)', async () => {
    useSessionStore.setState({
      currentSessionId: 's1',
      history: [
        { role: 'user', content: '이전', clientId: 'prev-u' },
        { role: 'assistant', content: '이전답', clientId: 'prev-a' },
      ],
    })
    mocks.streamChat.mockReturnValue(
      makeStream([
        { type: 'tool_start', tool: 'get_diet_products' },
        { type: 'chunk', value: '## 떡볶이\n' },
        { type: 'chunk', value: '- 곤약\n' },
        { type: 'done', value: '\n구매정보' },
      ]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('떡볶이')
    })

    // API 에는 현재 메시지를 제외한 이전 history 만 전달
    expect(mocks.streamChat).toHaveBeenCalledWith({
      message: '떡볶이',
      history: [
        { role: 'user', content: '이전' },
        { role: 'assistant', content: '이전답' },
      ],
    })

    const finalReply = '## 떡볶이\n- 곤약\n\n구매정보'
    expect(useSessionStore.getState().history).toEqual([
      { role: 'user', content: '이전', clientId: 'prev-u' },
      { role: 'assistant', content: '이전답', clientId: 'prev-a' },
      { role: 'user', content: '떡볶이', clientId: expect.any(String) },
      { role: 'assistant', content: finalReply, intent: 'SPECIFIC_FOOD', clientId: expect.any(String) },
    ])
    expect(mocks.saveHistory).toHaveBeenCalledExactlyOnceWith({
      session_id: 's1',
      user_message: '떡볶이',
      recipe_reply: finalReply,
      intent: 'SPECIFIC_FOOD',
    })
    expect(result.current.isStreaming).toBe(false)
  })

  it('첫 턴 저장 성공 시 현재 세션을 첫 user 메시지 preview 로 sessions 에 등록한다 (happy)', async () => {
    mocks.streamChat.mockReturnValue(
      makeStream([
        { type: 'chunk', value: '본문' },
        { type: 'done', value: '' },
      ]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('떡볶이 먹고 싶어')
    })

    const { sessions } = useSessionStore.getState()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({ id: 's1', preview: '떡볶이 먹고 싶어' })
  })

  it('이어쓰기(둘째 턴 이상)엔 세션을 최상단으로 올리고 preview 를 최신 메시지로 갱신한다 (edge)', async () => {
    useSessionStore.setState({
      history: [
        { role: 'user', content: '이전', clientId: 'prev-u' },
        { role: 'assistant', content: '이전답', clientId: 'prev-a' },
      ],
      sessions: [
        { id: 's2', createdAt: '2026-06-02T00:00:00Z', preview: '다른 세션' },
        { id: 's1', createdAt: '2026-06-01T00:00:00Z', preview: '이전' },
      ],
    })
    mocks.streamChat.mockReturnValue(
      makeStream([{ type: 'chunk', value: '본문' }, { type: 'done', value: '' }]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('둘째 질문')
    })

    const { sessions } = useSessionStore.getState()
    // 중복 없이 's1' 을 맨 위로 이동(최근 활동 순) + preview 를 최신 user 메시지로 갱신
    expect(sessions).toHaveLength(2)
    expect(sessions[0]).toMatchObject({ id: 's1', preview: '둘째 질문' })
    expect(sessions[1].id).toBe('s2')
  })

  it('저장 성공 후 history 캐시에 새 레코드를 prepend 한다 (재방문 정합, happy)', async () => {
    mocks.saveHistory.mockResolvedValue(makeHistoryRecord({ id: 55, session_id: 's1' }))
    mocks.streamChat.mockReturnValue(
      makeStream([{ type: 'chunk', value: '본문' }, { type: 'done', value: '' }]),
    )

    const { result, queryClient } = renderStream()
    // 같은 세션을 이미 한 번 방문해 캐시에 기존 1건이 있다고 가정
    queryClient.setQueryData(['history', 's1'], [makeHistoryRecord({ id: 1 })])

    await act(async () => {
      await result.current.send('질문')
    })

    const cache = queryClient.getQueryData<HistoryRecord[]>(['history', 's1'])
    expect(cache).toHaveLength(2)
    // 최신순(newest-first) — 방금 저장분이 맨 앞
    expect(cache?.[0].id).toBe(55)
    expect(cache?.[1].id).toBe(1)
  })

  it('done.value 가 빈 문자열이면 본문만 저장한다 (edge)', async () => {
    mocks.streamChat.mockReturnValue(
      makeStream([
        { type: 'chunk', value: '본문만' },
        { type: 'done', value: '' },
      ]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('질문')
    })

    expect(useSessionStore.getState().history).toEqual([
      { role: 'user', content: '질문', clientId: expect.any(String) },
      { role: 'assistant', content: '본문만', intent: 'OFF_TOPIC', clientId: expect.any(String) },
    ])
    expect(mocks.saveHistory).toHaveBeenCalledWith(
      expect.objectContaining({ recipe_reply: '본문만', intent: 'OFF_TOPIC' }),
    )
  })

  it('saveHistory 응답 id 를 assistant 메시지 index 에 기록한다 (happy)', async () => {
    useSessionStore.setState({
      currentSessionId: 's1',
      history: [
        { role: 'user', content: '이전', clientId: 'prev-u' },
        { role: 'assistant', content: '이전답', clientId: 'prev-a' },
      ],
      historyIds: {},
    })
    mocks.saveHistory.mockResolvedValue(makeHistoryRecord({ id: 99 }))
    mocks.streamChat.mockReturnValue(
      makeStream([{ type: 'chunk', value: '본문' }, { type: 'done', value: '' }]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('새 질문')
    })

    // 이전 2건 뒤 user(2)·assistant(3) 추가 → assistant index = 3
    expect(useSessionStore.getState().historyIds).toEqual({ 3: 99 })
  })

  it('history_id 기록은 saveHistory 완료(이중버블 가드: 임시버블 정리) 이후다 (가드)', async () => {
    // saveHistory 호출 시점에 확정 버블은 이미 추가됐고, history_id 는 아직 미기록이어야 한다.
    // (recordHistoryId 가 await 앞으로 새지 않음을 직접 검증 — 렌더 상태 재mutate 회귀 차단)
    let idsAtSaveTime: Record<number, number> | null = null
    let historyLenAtSaveTime = 0
    mocks.saveHistory.mockImplementation(async () => {
      idsAtSaveTime = { ...useSessionStore.getState().historyIds }
      historyLenAtSaveTime = useSessionStore.getState().history.length
      return makeHistoryRecord({ id: 7 })
    })
    mocks.streamChat.mockReturnValue(
      makeStream([{ type: 'chunk', value: '본문' }, { type: 'done', value: '' }]),
    )

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('질문')
    })

    // 저장 호출 시점: 확정 버블(user+assistant=2개) 존재, history_id 아직 미기록
    expect(historyLenAtSaveTime).toBe(2)
    expect(idsAtSaveTime).toEqual({})
    // 저장 완료 후 비로소 기록됨 (assistant index = 1)
    expect(useSessionStore.getState().historyIds).toEqual({ 1: 7 })
  })

  it('스트림 에러 시 error 를 노출하고 저장하지 않으며 isStreaming 을 해제한다 (error)', async () => {
    mocks.streamChat.mockImplementation(() => {
      throw new Error('네트워크 오류')
    })

    const { result } = renderStream()
    await act(async () => {
      await result.current.send('x')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isStreaming).toBe(false)
    expect(mocks.saveHistory).not.toHaveBeenCalled()
    // 낙관적으로 추가된 user 메시지는 남는다
    expect(useSessionStore.getState().history).toEqual([{ role: 'user', content: 'x', clientId: expect.any(String) }])
  })

  it('의존성 주입(deps) 시 기본 import 대신 주입된 streamChat·saveHistory 를 쓴다 (DI)', async () => {
    const injectedStream = vi
      .fn()
      .mockReturnValue(makeStream([{ type: 'chunk', value: '주입됨' }, { type: 'done', value: '' }]))
    const injectedSave = vi.fn().mockResolvedValue(makeHistoryRecord())

    const { result } = renderStream({ streamChat: injectedStream, saveHistory: injectedSave })
    await act(async () => {
      await result.current.send('안녕')
    })

    expect(injectedStream).toHaveBeenCalledOnce()
    expect(injectedSave).toHaveBeenCalledOnce()
    // 기본 모듈 mock 은 호출되지 않음
    expect(mocks.streamChat).not.toHaveBeenCalled()
    expect(mocks.saveHistory).not.toHaveBeenCalled()
    expect(useSessionStore.getState().history.at(-1)).toEqual({
      role: 'assistant',
      content: '주입됨',
      intent: 'OFF_TOPIC',
      clientId: expect.any(String),
    })
  })
})
