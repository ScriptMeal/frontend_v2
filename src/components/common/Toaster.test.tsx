import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toaster from './Toaster'
import { useToastStore } from '@/store/toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('Toaster', () => {
  it('스토어의 토스트 메시지를 렌더한다 (happy)', () => {
    render(<Toaster />)
    act(() => {
      useToastStore.getState().addToast({ variant: 'error', message: '서버 오류' })
    })
    expect(screen.getByText('서버 오류')).toBeInTheDocument()
  })

  it('닫기 버튼을 누르면 토스트가 제거된다 (edge)', async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    act(() => {
      useToastStore.getState().addToast({ variant: 'info', message: '안내' })
    })

    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(screen.queryByText('안내')).not.toBeInTheDocument()
  })

  it('duration 경과 후 자동으로 사라진다 (edge)', () => {
    vi.useFakeTimers()
    try {
      render(<Toaster />)
      act(() => {
        useToastStore.getState().addToast({ variant: 'info', message: '잠깐', duration: 1000 })
      })
      expect(screen.getByText('잠깐')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      expect(screen.queryByText('잠깐')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
