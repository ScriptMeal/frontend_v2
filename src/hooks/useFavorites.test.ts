import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import type { FavoriteRecord } from '@/types'

const mocks = vi.hoisted(() => ({
  getFavorites: vi.fn(),
  saveFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}))
vi.mock('@/api/user', () => ({
  getFavorites: mocks.getFavorites,
  saveFavorite: mocks.saveFavorite,
  deleteFavorite: mocks.deleteFavorite,
}))

import { useFavorites, useSaveFavorite, useDeleteFavorite } from './useFavorites'

function makeFav(id: number): FavoriteRecord {
  return {
    id,
    session_id: 's1',
    user_message: `질문${id}`,
    recipe_reply: `## 답변${id}`,
    intent: 'SPECIFIC_FOOD',
    created_at: '2026-06-01T00:00:00Z',
  }
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

function ids(client: QueryClient): number[] {
  return (client.getQueryData(['favorites', 's1']) as FavoriteRecord[]).map((f) => f.id)
}

beforeEach(() => {
  mocks.getFavorites.mockReset().mockResolvedValue([])
  mocks.saveFavorite.mockReset().mockResolvedValue(undefined)
  mocks.deleteFavorite.mockReset().mockResolvedValue(undefined)
})

describe('useFavorites', () => {
  it('session_id 로 즐겨찾기를 조회한다 (happy)', async () => {
    mocks.getFavorites.mockResolvedValue([makeFav(1)])
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFavorites('s1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(mocks.getFavorites).toHaveBeenCalledWith('s1')
  })

  it('서버 오류 시 isError 가 된다 (error)', async () => {
    mocks.getFavorites.mockRejectedValue(new Error('500'))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFavorites('s1'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSaveFavorite', () => {
  it('저장 후 favorites 쿼리를 무효화한다 (happy)', async () => {
    const { client, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSaveFavorite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        session_id: 's1',
        user_message: '떡볶이',
        recipe_reply: '## 떡볶이',
        intent: 'SPECIFIC_FOOD',
      })
    })

    expect(mocks.saveFavorite).toHaveBeenCalledOnce()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['favorites'] })
  })
})

describe('useDeleteFavorite', () => {
  it('삭제 시 캐시에서 낙관적으로 즉시 제거한다 (happy)', async () => {
    const { client, wrapper } = makeWrapper()
    client.setQueryData(['favorites', 's1'], [makeFav(1), makeFav(2)])
    const { result } = renderHook(() => useDeleteFavorite('s1'), { wrapper })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => expect(ids(client)).toEqual([2]))
    expect(mocks.deleteFavorite).toHaveBeenCalledWith(1)
  })

  it('삭제 실패 시 캐시를 원래대로 롤백한다 (error)', async () => {
    mocks.deleteFavorite.mockRejectedValue(new Error('500'))
    const { client, wrapper } = makeWrapper()
    client.setQueryData(['favorites', 's1'], [makeFav(1), makeFav(2)])
    const { result } = renderHook(() => useDeleteFavorite('s1'), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync(1)
      } catch {
        // 의도된 실패
      }
    })

    await waitFor(() => expect(ids(client)).toEqual([1, 2]))
  })
})
