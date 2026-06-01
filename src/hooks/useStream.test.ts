import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { StreamEvent } from '@/types'

const mocks = vi.hoisted(() => ({
  streamChat: vi.fn(),
  saveHistory: vi.fn(),
}))

vi.mock('@/api/chat', () => ({ streamChat: mocks.streamChat }))
vi.mock('@/api/user', () => ({ saveHistory: mocks.saveHistory }))

import { useStream } from './useStream'
import { useSessionStore } from '@/store/sessionStore'

function makeStream(events: StreamEvent[]) {
  return (async function* () {
    for (const event of events) yield event
  })()
}

beforeEach(() => {
  mocks.streamChat.mockReset()
  mocks.saveHistory.mockReset().mockResolvedValue(undefined)
  useSessionStore.setState({ currentSessionId: 's1', history: [], sessions: [] })
})

describe('useStream', () => {
  it('chunk 누적 + done(구매정보) 을 본문 인라인으로 합치고 history·저장한다 (happy)', async () => {
    useSessionStore.setState({
      currentSessionId: 's1',
      history: [
        { role: 'user', content: '이전' },
        { role: 'assistant', content: '이전답' },
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

    const { result } = renderHook(() => useStream())
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
      { role: 'user', content: '이전' },
      { role: 'assistant', content: '이전답' },
      { role: 'user', content: '떡볶이' },
      { role: 'assistant', content: finalReply },
    ])
    expect(mocks.saveHistory).toHaveBeenCalledExactlyOnceWith({
      session_id: 's1',
      user_message: '떡볶이',
      recipe_reply: finalReply,
      intent: 'SPECIFIC_FOOD',
    })
    expect(result.current.isStreaming).toBe(false)
  })

  it('done.value 가 빈 문자열이면 본문만 저장한다 (edge)', async () => {
    mocks.streamChat.mockReturnValue(
      makeStream([
        { type: 'chunk', value: '본문만' },
        { type: 'done', value: '' },
      ]),
    )

    const { result } = renderHook(() => useStream())
    await act(async () => {
      await result.current.send('질문')
    })

    expect(useSessionStore.getState().history).toEqual([
      { role: 'user', content: '질문' },
      { role: 'assistant', content: '본문만' },
    ])
    expect(mocks.saveHistory).toHaveBeenCalledWith(
      expect.objectContaining({ recipe_reply: '본문만', intent: 'OFF_TOPIC' }),
    )
  })

  it('스트림 에러 시 error 를 노출하고 저장하지 않으며 isStreaming 을 해제한다 (error)', async () => {
    mocks.streamChat.mockImplementation(() => {
      throw new Error('네트워크 오류')
    })

    const { result } = renderHook(() => useStream())
    await act(async () => {
      await result.current.send('x')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isStreaming).toBe(false)
    expect(mocks.saveHistory).not.toHaveBeenCalled()
    // 낙관적으로 추가된 user 메시지는 남는다
    expect(useSessionStore.getState().history).toEqual([{ role: 'user', content: 'x' }])
  })
})
