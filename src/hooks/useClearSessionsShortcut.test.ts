import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

import { useClearSessionsShortcut } from './useClearSessionsShortcut'
import { useSessionStore } from '@/store/sessionStore'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(MemoryRouter, null, children)
}

function press(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', init))
}

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
  useSessionStore.setState({
    sessions: [{ id: 's1', createdAt: '2026-06-02T00:00:00Z', preview: 'p' }],
    favoriteSessionIds: ['s1'],
    history: [{ role: 'user', content: 'hi', clientId: 'u1' }],
    pendingMessage: null,
  })
})

describe('useClearSessionsShortcut', () => {
  it('Ctrl+Alt+R 로 세션 데이터를 비우고 홈으로 이동한다 (happy)', () => {
    renderHook(() => useClearSessionsShortcut(), { wrapper })

    press({ ctrlKey: true, altKey: true, code: 'KeyR' })

    const s = useSessionStore.getState()
    expect(s.sessions).toEqual([])
    expect(s.favoriteSessionIds).toEqual([])
    expect(s.history).toEqual([])
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('Ctrl 없이 Alt+R 은 무시한다 (edge)', () => {
    renderHook(() => useClearSessionsShortcut(), { wrapper })

    press({ altKey: true, code: 'KeyR' })

    expect(useSessionStore.getState().sessions).toHaveLength(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('언마운트 후에는 리스너가 제거된다 (edge)', () => {
    const { unmount } = renderHook(() => useClearSessionsShortcut(), { wrapper })

    unmount()
    press({ ctrlKey: true, altKey: true, code: 'KeyR' })

    expect(useSessionStore.getState().sessions).toHaveLength(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
