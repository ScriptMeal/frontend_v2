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

// 진입 시 useHistory 로 서버 기록을 로드해 스토어에 하이드레이션한다.
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

/** 라우트 컨텍스트와 함께 렌더 — `/chat/:sessionId` 통일 진입 검증용 */
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

const record = (over: Partial<RecipeRecord> = {}): RecipeRecord => ({
  id: 1,
  session_id: 's1',
  user_message: '안녕',
  recipe_reply: '## 안녕하세요',
  intent: 'OFF_TOPIC',
  created_at: '2026-06-02T00:00:00Z',
  ...over,
})

beforeEach(() => {
  mocks.send.mockReset().mockResolvedValue(undefined)
  setStream({ isStreaming: false, streamingText: '', activeTool: null, error: null })
  mocks.history = { data: [], isLoading: false, isError: false }
  mocks.favorites = { data: [], isLoading: false, isError: false }
  useSessionStore.setState({
    currentSessionId: 'unhydrated',
    history: [],
    historyIds: {},
    sessions: [],
    pendingMessage: null,
  })
})

describe('ChatPage — 세션 진입 (이어쓰기 통일)', () => {
  it('서버 기록을 채팅 버블로 렌더하고 입력창을 노출한다 — 읽기 전용 폐지 (happy)', () => {
    mocks.history.data = [record()]
    renderAt('/chat/s1')

    expect(screen.getByText('안녕')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안녕하세요' })).toBeInTheDocument()
    // 읽기 전용 안내는 사라지고, 이어쓰기용 입력창이 항상 노출된다
    expect(screen.queryByText(/읽기 전용/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('메시지 입력')).toBeInTheDocument()
  })

  it('진입한 sessionId 를 currentSessionId 로 하이드레이션한다 (happy)', () => {
    mocks.history.data = [record({ id: 9, user_message: '복원질문', recipe_reply: '## 복원답' })]
    renderAt('/chat/past-9')

    const s = useSessionStore.getState()
    expect(s.currentSessionId).toBe('past-9')
    expect(s.history.map((m) => m.content)).toEqual(['복원질문', '## 복원답'])
    expect(s.historyIds).toEqual({ 1: 9 })
  })

  it('pendingMessage 가 있으면 하이드레이션 후 1회 send 하고 비운다 (홈 핸드오프, happy)', () => {
    useSessionStore.setState({ pendingMessage: '떡볶이 먹고 싶어' })
    mocks.history.data = [] // 새 세션 — 서버 기록 없음
    renderAt('/chat/new-1')

    expect(mocks.send).toHaveBeenCalledExactlyOnceWith('떡볶이 먹고 싶어')
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })

  it('pendingMessage 가 없으면 자동 전송하지 않는다 — 직접 진입·새로고침 (edge)', () => {
    mocks.history.data = [record()]
    renderAt('/chat/s1')
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('sessionId 가 없으면 홈으로 리다이렉트한다 (방어, edge)', () => {
    renderAt('/chat')
    expect(screen.getByText('홈 화면')).toBeInTheDocument()
  })

  it('즐겨찾기된 history_id 의 버블은 처음부터 저장됨으로 렌더한다 (happy)', () => {
    mocks.history.data = [
      record({ id: 1, user_message: '떡볶이 먹고 싶어', recipe_reply: '## 다이어트 떡볶이', intent: 'SPECIFIC_FOOD' }),
    ]
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

  it('즐겨찾기에 없는 history_id 의 버블은 미저장 상태로 렌더한다 (edge)', () => {
    mocks.history.data = [
      record({ id: 2, user_message: '저당 김밥', recipe_reply: '## 저당 김밥', intent: 'SPECIFIC_FOOD' }),
    ]
    mocks.favorites.data = []
    renderAt('/chat/s1')

    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeInTheDocument()
  })
})

describe('ChatPage — 스트리밍 상태 표시', () => {
  it('send 직후(텍스트·툴 없음)엔 기본 로딩 인디케이터를 표시한다 (happy)', () => {
    setStream({ isStreaming: true, streamingText: '', activeTool: null })
    renderAt('/chat/s1')
    expect(screen.getByText(/응답 생성 중/)).toBeInTheDocument()
  })

  it('툴 단계(텍스트 전, 툴 있음)엔 툴 문구를 표시한다', () => {
    setStream({ isStreaming: true, streamingText: '', activeTool: 'get_diet_products' })
    renderAt('/chat/s1')
    expect(screen.getByText(/관련 다이어트 제품 검색 중/)).toBeInTheDocument()
  })

  it('텍스트가 도착하면 스트리밍 버블을 보이고 인디케이터는 숨긴다 (edge)', () => {
    setStream({ isStreaming: true, streamingText: '## 떡', activeTool: null })
    renderAt('/chat/s1')
    expect(screen.getByRole('heading', { name: '떡' })).toBeInTheDocument()
    expect(screen.queryByText(/응답 생성 중/)).not.toBeInTheDocument()
  })

  it('하단 입력창 전송 시 send 를 호출한다', async () => {
    const user = userEvent.setup()
    renderAt('/chat/s1')
    await user.type(screen.getByLabelText('메시지 입력'), '두부 요리')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mocks.send).toHaveBeenCalledWith('두부 요리')
  })

  it('스트리밍 중에는 입력창을 비활성화한다', () => {
    setStream({ isStreaming: true })
    renderAt('/chat/s1')
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled()
  })
})
