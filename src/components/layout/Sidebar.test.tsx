import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSessionStore } from '@/store/sessionStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useSessionStore.setState({
      sessions: [],
      history: [],
      currentSessionId: 'test-session',
    })
  })

  it('새 대화 버튼과 즐겨찾기 진입 버튼을 렌더링한다 (happy)', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /새 대화/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /즐겨찾기/ })).toBeInTheDocument()
  })

  it('세션이 없으면 빈 상태 메시지를 보여준다 (edge)', () => {
    renderSidebar()
    expect(screen.getByText(/대화 기록이 없습니다/)).toBeInTheDocument()
  })

  it('새 대화 클릭 시 새 세션을 시작하고 홈으로 이동한다', async () => {
    const user = userEvent.setup()
    const prevId = useSessionStore.getState().currentSessionId
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /새 대화/ }))
    expect(useSessionStore.getState().currentSessionId).not.toBe(prevId)
    expect(mockNavigate).toHaveBeenCalledWith('/home')
  })

  it('LARA 로고 클릭 시 랜딩(/) 으로 이동한다', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'LARA' }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('즐겨찾기 클릭 시 즐겨찾기 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /즐겨찾기/ }))
    expect(mockNavigate).toHaveBeenCalledWith('/favorites')
  })

  it('세션 목록이 있으면 항목을 렌더링하고 클릭 시 해당 세션 경로로 이동한다 (happy)', async () => {
    const user = userEvent.setup()
    useSessionStore.setState({
      sessions: [
        { id: 's1', createdAt: '2026-06-01T00:00:00Z', preview: '떡볶이 레시피' },
      ],
    })
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /떡볶이 레시피/ }))
    expect(mockNavigate).toHaveBeenCalledWith('/chat/s1')
  })
})

describe('Sidebar — 세션 삭제 (데스크톱)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-01T00:00:00Z', preview: '떡볶이 레시피' }],
      favoriteSessionIds: ['s1'],
      history: [],
      currentSessionId: 'cur',
    })
  })

  it('세션 항목에 삭제 버튼을 렌더한다 (happy)', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 확인 모달을 연다 (happy)', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    expect(screen.getByText(/정말 삭제하시겠습니까/)).toBeInTheDocument()
  })

  it('모달에서 예 클릭 시 세션·즐겨찾기 인덱스를 제거하고 /home 으로 이동한다 (happy)', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    await user.click(screen.getByRole('button', { name: '예' }))

    await waitFor(() => {
      expect(useSessionStore.getState().sessions.find((s) => s.id === 's1')).toBeUndefined()
    })
    expect(useSessionStore.getState().favoriteSessionIds).not.toContain('s1')
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'))
  })

  it('모달에서 취소 시 세션을 유지하고 이동하지 않는다 (edge)', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(useSessionStore.getState().sessions.find((s) => s.id === 's1')).toBeDefined()
    expect(mockNavigate).not.toHaveBeenCalledWith('/home')
  })
})

describe('Sidebar — 세션 삭제 (모바일 롱프레스)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useSessionStore.setState({
      sessions: [{ id: 's1', createdAt: '2026-06-01T00:00:00Z', preview: '떡볶이 레시피' }],
      favoriteSessionIds: [],
      history: [],
      currentSessionId: 'cur',
    })
    // coarse 포인터 환경(jsdom 은 matchMedia 미구현)
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(pointer: coarse)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
  })
  afterEach(() => {
    // @ts-expect-error 테스트 격리
    delete window.matchMedia
    vi.useRealTimers()
  })

  it('모바일에선 hover 삭제 버튼을 숨긴다 (happy)', () => {
    renderSidebar()
    expect(screen.queryByRole('button', { name: '대화 삭제' })).not.toBeInTheDocument()
  })

  it('롱프레스 → 삭제하기 → 예 로 세션을 제거하고 /home 으로 이동한다 (happy)', async () => {
    vi.useFakeTimers()
    renderSidebar()

    const item = screen.getByText('떡볶이 레시피').closest('[data-testid="session-item"]')!
    fireEvent.pointerDown(item, { pointerType: 'touch', clientX: 0, clientY: 0 })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    fireEvent.click(screen.getByRole('button', { name: '삭제하기' }))
    fireEvent.click(screen.getByRole('button', { name: '예' }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(useSessionStore.getState().sessions.find((s) => s.id === 's1')).toBeUndefined()
    expect(mockNavigate).toHaveBeenCalledWith('/home')
  })
})
