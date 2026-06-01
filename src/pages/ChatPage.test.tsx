import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import type { UseStreamReturn } from '@/hooks/useStream'

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  state: {
    isStreaming: false,
    streamingText: '',
    activeTool: null as string | null,
    error: null as string | null,
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

import ChatPage from './ChatPage'
import { useSessionStore } from '@/store/sessionStore'

function setStream(partial: Partial<typeof mocks.state>) {
  Object.assign(mocks.state, partial)
}

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  mocks.send.mockReset().mockResolvedValue(undefined)
  setStream({ isStreaming: false, streamingText: '', activeTool: null, error: null })
  useSessionStore.setState({
    currentSessionId: 's1',
    history: [],
    sessions: [],
    pendingMessage: null,
  })
})

describe('ChatPage', () => {
  it('진입 시 pendingMessage 가 있으면 1회 send 후 비운다 (happy)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이 먹고 싶어' })
    renderWithClient(<ChatPage />)
    expect(mocks.send).toHaveBeenCalledExactlyOnceWith('떡볶이 먹고 싶어')
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })

  it('pendingMessage 가 없으면 진입 시 자동 전송하지 않는다 (edge)', () => {
    renderWithClient(<ChatPage />)
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('history 를 채팅 버블 리스트로 렌더한다', () => {
    useSessionStore.setState({
      history: [
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '## 안녕하세요' },
      ],
    })
    renderWithClient(<ChatPage />)
    expect(screen.getByText('안녕')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안녕하세요' })).toBeInTheDocument()
  })

  it('스트리밍 중이면 streamingText 임시 버블과 ToolIndicator 를 표시한다', () => {
    setStream({ isStreaming: true, streamingText: '## 떡', activeTool: 'get_diet_products' })
    renderWithClient(<ChatPage />)
    expect(screen.getByText(/관련 다이어트 제품 검색 중/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '떡' })).toBeInTheDocument()
  })

  it('하단 입력창 전송 시 send 를 호출한다', async () => {
    const user = userEvent.setup()
    renderWithClient(<ChatPage />)
    await user.type(screen.getByLabelText('메시지 입력'), '두부 요리')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mocks.send).toHaveBeenCalledWith('두부 요리')
  })

  it('스트리밍 중에는 입력창을 비활성화한다', () => {
    setStream({ isStreaming: true })
    renderWithClient(<ChatPage />)
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled()
  })
})
