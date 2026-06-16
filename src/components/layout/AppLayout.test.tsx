import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AppLayout from './AppLayout'
import { useUIStore } from '@/store/uiStore'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

function renderLayout() {
  return render(
    <MemoryRouter>
      <AppLayout>
        <div>콘텐츠 영역</div>
      </AppLayout>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    useUIStore.setState({ isSidebarOpen: false })
  })

  it('자식 콘텐츠를 렌더링한다 (happy)', () => {
    renderLayout()
    expect(screen.getByText('콘텐츠 영역')).toBeInTheDocument()
  })

  it('사이드바가 닫힌 기본 상태에서는 모바일 백드롭이 없다 (edge)', () => {
    renderLayout()
    expect(screen.queryByLabelText('사이드바 닫기')).not.toBeInTheDocument()
  })

  it('메뉴 버튼 클릭 시 사이드바가 열리고 백드롭이 나타난다', async () => {
    const user = userEvent.setup()
    renderLayout()
    await user.click(screen.getByLabelText('사이드바 열기'))
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
    expect(screen.getByLabelText('사이드바 닫기')).toBeInTheDocument()
  })

  it('백드롭 클릭 시 사이드바가 닫힌다 (복구 경로)', async () => {
    const user = userEvent.setup()
    useUIStore.setState({ isSidebarOpen: true })
    renderLayout()
    await user.click(screen.getByLabelText('사이드바 닫기'))
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })

  it('모바일 슬라이드가 동작하도록 transition 에 translate 를 포함한다 (iOS)', () => {
    // Tailwind v4 는 -translate-x-full 을 CSS translate 속성으로 컴파일한다.
    // transition 에 translate 가 없으면 모바일 드로어가 점프한다(iOS 슬라이드 미동작).
    renderLayout()
    const aside = screen.getByRole('complementary')
    expect(aside.className).toContain('transition-[translate,width]')
  })

  it('사이드바가 열린 상태에서 ESC 로 닫는다 (a11y)', async () => {
    const user = userEvent.setup()
    useUIStore.setState({ isSidebarOpen: true })
    renderLayout()
    await user.keyboard('{Escape}')
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })
})
