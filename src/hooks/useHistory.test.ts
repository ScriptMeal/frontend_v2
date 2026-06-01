import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import type { HistoryRecord } from '@/types'

const mocks = vi.hoisted(() => ({ getHistory: vi.fn() }))
vi.mock('@/api/user', () => ({ getHistory: mocks.getHistory }))

import { useHistory } from './useHistory'

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
