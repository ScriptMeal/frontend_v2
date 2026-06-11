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

  it('첫 메시지 전송 시 pendingMessage 적재 + 새 세션 id 로 /chat/:id 이동 (history 직접 적재 안 함)', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByLabelText('메시지 입력'), '떡볶이 먹고 싶어')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(useSessionStore.getState().pendingMessage).toBe('떡볶이 먹고 싶어')
    // history 적재는 useStream(ChatPage)이 전담 — 홈에서 미리 넣지 않는다
    expect(useSessionStore.getState().history).toEqual([])
    // 새로 발급된 세션 id 로 라우팅 → ChatPage 가 그 세션을 하이드레이션·핸드오프한다
    const newId = useSessionStore.getState().currentSessionId
    expect(mockNavigate).toHaveBeenCalledWith(`/chat/${newId}`)
  })

  it('전송 시 새 세션을 발급해 이전 대화 잔여물을 비운다 (edge)', async () => {
    useSessionStore.setState({
      currentSessionId: 'old-session',
      history: [{ role: 'user', content: '이전대화', clientId: 'u1' }],
    })
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByLabelText('메시지 입력'), '새 레시피')
    await user.click(screen.getByRole('button', { name: '전송' }))

    const s = useSessionStore.getState()
    expect(s.currentSessionId).not.toBe('old-session')
    expect(s.history).toEqual([])
    expect(s.pendingMessage).toBe('새 레시피')
  })

  it('빈 입력으로는 이동하지 않는다 (edge)', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useSessionStore.getState().pendingMessage).toBeNull()
  })
})
