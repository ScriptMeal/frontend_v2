import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import type { HistoryRecord } from '@/types'

const mocks = vi.hoisted(() => ({ getHistory: vi.fn(), deleteHistory: vi.fn() }))
vi.mock('@/api/user', () => ({ getHistory: mocks.getHistory, deleteHistory: mocks.deleteHistory }))

import { useHistory, useDeleteHistory } from './useHistory'

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

const record: HistoryRecord = {
  id: 1,
  session_id: 's1',
  user_message: '떡볶이',
  recipe_reply: '## 떡볶이',
  intent: 'SPECIFIC_FOOD',
  created_at: '2026-06-01T00:00:00Z',
}

beforeEach(() => {
  mocks.getHistory.mockReset()
  mocks.deleteHistory.mockReset()
})

describe('useHistory', () => {
  it('session_id 로 조회해 레코드를 반환한다 (happy)', async () => {
    mocks.getHistory.mockResolvedValue([record])
    const { result } = renderHook(() => useHistory('s1'), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([record])
    expect(mocks.getHistory).toHaveBeenCalledWith('s1')
  })

  it('enabled=false 면 조회하지 않는다 (edge)', () => {
    renderHook(() => useHistory('s1', { enabled: false }), { wrapper: wrapper() })
    expect(mocks.getHistory).not.toHaveBeenCalled()
  })

  it('서버 오류 시 isError 가 된다 (error)', async () => {
    mocks.getHistory.mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useHistory('s1'), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteHistory', () => {
  it('id 로 히스토리를 삭제한다 (happy)', async () => {
    mocks.deleteHistory.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteHistory(), { wrapper: wrapper() })

    await act(() => result.current.mutateAsync(1))

    expect(mocks.deleteHistory).toHaveBeenCalledWith(1)
  })

  it('서버 오류 시 뮤테이션이 실패한다 (error)', async () => {
    mocks.deleteHistory.mockRejectedValue(new Error('404'))
    const { result } = renderHook(() => useDeleteHistory(), { wrapper: wrapper() })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toThrow()
  })

  it('삭제 직후 isSuccess 가 된다 (edge)', async () => {
    mocks.deleteHistory.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteHistory(), { wrapper: wrapper() })

    await act(() => result.current.mutateAsync(99))

    // mutateAsync resolve 와 isSuccess 상태 반영 리렌더는 별도 — waitFor 로 확정될 때까지 기다린다.
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
