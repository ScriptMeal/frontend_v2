import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { UseStreamReturn } from '@/hooks/useStream'
import type { RecipeRecord } from '@/types'

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  state: {
    isStreaming: false,
    streamingText: '',
    activeTool: null as string | null,
    error: null as string | null,
  },
  history: {
    data: [] as RecipeRecord[],
    isLoading: false,
    isError: false,
  },
}))

vi.mock('@/hooks/useStream', () => ({
  useStream: (): UseStreamReturn => ({
    isStreaming: mocks.state.isStreaming,
    streamingText: mocks.state.streamingText,
    activeTool: mocks.state.activeTool,
    error: mocks.state.error,
    send: mocks.send,
  }),
}))

// 읽기 전용 모드는 useHistory 로 기록을 로드한다 — 라이브 테스트에선 호출되지 않는다.
vi.mock('@/hooks/useHistory', () => ({
  useHistory: () => mocks.history,
}))

import ChatPage from './ChatPage'
import { useSessionStore } from '@/store/sessionStore'

function setStream(partial: Partial<typeof mocks.state>) {
  Object.assign(mocks.state, partial)
}

/** 라우트 컨텍스트와 함께 렌더 — `/chat`(라이브) / `/chat/:sessionId`(읽기 전용) 분기 검증용 */
function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:sessionId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mocks.send.mockReset().mockResolvedValue(undefined)
  setStream({ isStreaming: false, streamingText: '', activeTool: null, error: null })
  mocks.history = { data: [], isLoading: false, isError: false }
  useSessionStore.setState({
    currentSessionId: 's1',
    history: [],
    sessions: [],
    pendingMessage: null,
  })
})

describe('ChatPage — 라이브 (/chat)', () => {
  it('진입 시 pendingMessage 가 있으면 1회 send 후 비운다 (happy)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이 먹고 싶어' })
    renderAt('/chat')
    expect(mocks.send).toHaveBeenCalledExactlyOnceWith('떡볶이 먹고 싶어')
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })

  it('pendingMessage 가 없으면 진입 시 자동 전송하지 않는다 (edge)', () => {
    renderAt('/chat')
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('history 를 채팅 버블 리스트로 렌더한다', () => {
    useSessionStore.setState({
      history: [
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '## 안녕하세요' },
      ],
    })
    renderAt('/chat')
    expect(screen.getByText('안녕')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안녕하세요' })).toBeInTheDocument()
  })

  it('send 직후(텍스트·툴 없음)엔 기본 로딩 인디케이터를 표시한다 (happy)', () => {
    setStream({ isStreaming: true, streamingText: '', activeTool: null })
    renderAt('/chat')
    expect(screen.getByText(/응답 생성 중/)).toBeInTheDocument()
  })

  it('툴 단계(텍스트 전, 툴 있음)엔 툴 문구를 표시한다', () => {
    setStream({ isStreaming: true, streamingText: '', activeTool: 'get_diet_products' })
    renderAt('/chat')
    expect(screen.getByText(/관련 다이어트 제품 검색 중/)).toBeInTheDocument()
  })

  it('텍스트가 도착하면 스트리밍 버블을 보이고 인디케이터는 숨긴다 (edge)', () => {
    setStream({ isStreaming: true, streamingText: '## 떡', activeTool: null })
    renderAt('/chat')
    expect(screen.getByRole('heading', { name: '떡' })).toBeInTheDocument()
    expect(screen.queryByText(/응답 생성 중/)).not.toBeInTheDocument()
    expect(screen.queryByText(/검색 중/)).not.toBeInTheDocument()
  })

  it('하단 입력창 전송 시 send 를 호출한다', async () => {
    const user = userEvent.setup()
    renderAt('/chat')
    await user.type(screen.getByLabelText('메시지 입력'), '두부 요리')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mocks.send).toHaveBeenCalledWith('두부 요리')
  })

  it('스트리밍 중에는 입력창을 비활성화한다', () => {
    setStream({ isStreaming: true })
    renderAt('/chat')
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled()
  })
})

describe('ChatPage — 읽기 전용 (/chat/:sessionId)', () => {
  it('URL 의 세션 기록을 읽기 전용으로 렌더하고 입력창을 노출하지 않는다 (happy)', () => {
    mocks.history.data = [
      {
        id: 1,
        session_id: 's1',
        user_message: '안녕',
        recipe_reply: '## 안녕하세요',
        intent: 'OFF_TOPIC',
        created_at: '2026-06-02T00:00:00Z',
      },
    ]
    renderAt('/chat/s1')

    expect(screen.getByText('안녕')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안녕하세요' })).toBeInTheDocument()
    expect(screen.getByText(/읽기 전용/)).toBeInTheDocument()
    expect(screen.queryByLabelText('메시지 입력')).not.toBeInTheDocument()
  })

  it('자동 전송(send)을 하지 않는다 (edge)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이' })
    renderAt('/chat/s1')
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
