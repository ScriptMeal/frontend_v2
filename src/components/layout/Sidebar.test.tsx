import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
