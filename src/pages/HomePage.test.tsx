import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { useSessionStore } from '@/store/sessionStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useSessionStore.setState({ history: [], sessions: [], pendingMessage: null })
  })

  it('입력창을 렌더링한다 (happy)', () => {
    renderHome()
    expect(screen.getByLabelText('메시지 입력')).toBeInTheDocument()
  })

  it('첫 메시지 전송 시 pendingMessage 에 적재하고 /chat 으로 이동한다 (history 직접 적재 안 함)', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByLabelText('메시지 입력'), '떡볶이 먹고 싶어')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(useSessionStore.getState().pendingMessage).toBe('떡볶이 먹고 싶어')
    // history 적재는 useStream(ChatPage)이 전담 — 홈에서 미리 넣지 않는다
    expect(useSessionStore.getState().history).toEqual([])
    expect(mockNavigate).toHaveBeenCalledWith('/chat')
  })

  it('빈 입력으로는 이동하지 않는다 (edge)', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })
})
