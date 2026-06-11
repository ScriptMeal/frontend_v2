import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { UseStreamReturn } from '@/hooks/useStream'
import type { RecipeRecord, FavoriteRecord } from '@/types'

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
  favorites: {
    data: [] as FavoriteRecord[],
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
// useDeleteHistory 도 함께 모킹해 실제 네트워크 요청을 차단한다.
vi.mock('@/hooks/useHistory', async (importActual) => ({
  ...(await importActual<typeof import('@/hooks/useHistory')>()),
  useHistory: () => mocks.history,
  useDeleteHistory: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isSuccess: false }),
}))

// useFavoritesForSession 만 모킹(네트워크 차단). 저장/삭제 훅은 실제 구현을 쓴다.
vi.mock('@/hooks/useFavorites', async (importActual) => ({
  ...(await importActual<typeof import('@/hooks/useFavorites')>()),
  useFavoritesForSession: () => mocks.favorites,
}))

import ChatPage from './ChatPage'
import { useSessionStore } from '@/store/sessionStore'

function setStream(partial: Partial<typeof mocks.state>) {
  Object.assign(mocks.state, partial)
}

/**
 * 라이브 채팅 진입 자격(홈에서 메시지를 들고 옴)을 부여한다.
 * 빈 문자열은 mount 게이트(`pendingMessage !== null`)는 통과시키되 자동 전송(`if (captured)`)은
 * 트리거하지 않아, 스트리밍 상태 검증을 send 호출 노이즈 없이 할 수 있다.
 */
function enterFromHome() {
  useSessionStore.setState({ pendingMessage: '' })
}

/** 라우트 컨텍스트와 함께 렌더 — `/chat`(라이브) / `/chat/:sessionId`(읽기 전용) 분기 검증용 */
function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/home" element={<div>홈 화면</div>} />
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
  mocks.favorites = { data: [], isLoading: false, isError: false }
  useSessionStore.setState({
    currentSessionId: 's1',
    history: [],
    historyIds: {},
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

  it('홈을 거치지 않고(대기 메시지 없이) 진입하면 홈으로 리다이렉트한다 (edge)', () => {
    // 뒤로가기·새로고침·직접 URL 진입은 이전 대화를 노출하지 않고 홈으로 보낸다.
    useSessionStore.setState({
      history: [
        { role: 'user', content: '이전대화', clientId: 'u1' },
        { role: 'assistant', content: '## 이전응답', clientId: 'a1' },
      ],
    })
    renderAt('/chat')
    expect(screen.getByText('홈 화면')).toBeInTheDocument()
    expect(screen.queryByText('이전대화')).not.toBeInTheDocument()
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('history 를 채팅 버블 리스트로 렌더한다', () => {
    enterFromHome()
    useSessionStore.setState({
      history: [
        { role: 'user', content: '안녕', clientId: 'u1' },
        { role: 'assistant', content: '## 안녕하세요', clientId: 'a1' },
      ],
    })
    renderAt('/chat')
    expect(screen.getByText('안녕')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안녕하세요' })).toBeInTheDocument()
  })

  it('send 직후(텍스트·툴 없음)엔 기본 로딩 인디케이터를 표시한다 (happy)', () => {
    enterFromHome()
    setStream({ isStreaming: true, streamingText: '', activeTool: null })
    renderAt('/chat')
    expect(screen.getByText(/응답 생성 중/)).toBeInTheDocument()
  })

  it('툴 단계(텍스트 전, 툴 있음)엔 툴 문구를 표시한다', () => {
    enterFromHome()
    setStream({ isStreaming: true, streamingText: '', activeTool: 'get_diet_products' })
    renderAt('/chat')
    expect(screen.getByText(/관련 다이어트 제품 검색 중/)).toBeInTheDocument()
  })

  it('텍스트가 도착하면 스트리밍 버블을 보이고 인디케이터는 숨긴다 (edge)', () => {
    enterFromHome()
    setStream({ isStreaming: true, streamingText: '## 떡', activeTool: null })
    renderAt('/chat')
    expect(screen.getByRole('heading', { name: '떡' })).toBeInTheDocument()
    expect(screen.queryByText(/응답 생성 중/)).not.toBeInTheDocument()
    expect(screen.queryByText(/검색 중/)).not.toBeInTheDocument()
  })

  it('하단 입력창 전송 시 send 를 호출한다', async () => {
    enterFromHome()
    const user = userEvent.setup()
    renderAt('/chat')
    await user.type(screen.getByLabelText('메시지 입력'), '두부 요리')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mocks.send).toHaveBeenCalledWith('두부 요리')
  })

  it('스트리밍 중에는 입력창을 비활성화한다', () => {
    enterFromHome()
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

  it('즐겨찾기된 history_id 의 버블은 처음부터 저장됨으로 렌더한다 (happy)', () => {
    mocks.history.data = [
      {
        id: 1,
        session_id: 's1',
        user_message: '떡볶이 먹고 싶어',
        recipe_reply: '## 다이어트 떡볶이',
        intent: 'SPECIFIC_FOOD',
        created_at: '2026-06-02T00:00:00Z',
      },
    ]
    // history_id 1 이 즐겨찾기에 존재 → 저장됨(해제) 상태로 그려져야 한다
    mocks.favorites.data = [
      {
        id: 77,
        history_id: 1,
        session_id: 's1',
        user_message: '떡볶이 먹고 싶어',
        recipe_reply: '## 다이어트 떡볶이',
        intent: 'SPECIFIC_FOOD',
        created_at: '2026-06-02T00:00:00Z',
      },
    ]
    renderAt('/chat/s1')

    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
  })

  it('즐겨찾기에 없는 history_id 의 버블은 즐겨찾기(미저장) 상태로 렌더한다 (edge)', () => {
    mocks.history.data = [
      {
        id: 2,
        session_id: 's1',
        user_message: '저당 김밥',
        recipe_reply: '## 저당 김밥',
        intent: 'SPECIFIC_FOOD',
        created_at: '2026-06-02T00:00:00Z',
      },
    ]
    mocks.favorites.data = []
    renderAt('/chat/s1')

    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeInTheDocument()
  })
})
