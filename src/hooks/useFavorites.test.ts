import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { createElement, type ReactNode } from 'react'
import type { FavoriteRecord } from '@/types'
import { useToastStore } from '@/store/toastStore'

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

import { useAllFavorites, useSaveFavorite, useDeleteFavorite } from './useFavorites'
import { useSessionStore } from '@/store/sessionStore'

function makeFav(
  id: number,
  overrides: Partial<FavoriteRecord> = {},
): FavoriteRecord {
  return {
    id,
    session_id: 's1',
    user_message: `질문${id}`,
    recipe_reply: `## 답변${id}`,
    intent: 'SPECIFIC_FOOD',
    created_at: '2026-06-01T00:00:00Z',
    ...overrides,
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

beforeEach(() => {
  localStorage.clear()
  mocks.getFavorites.mockReset().mockResolvedValue([])
  mocks.saveFavorite.mockReset().mockResolvedValue(undefined)
  mocks.deleteFavorite.mockReset().mockResolvedValue(undefined)
  useSessionStore.setState({ favoriteSessionIds: [], sessions: [] })
  useToastStore.setState({ toasts: [] })
})

function axiosErrorWithStatus(status: number): AxiosError {
  return new AxiosError('err', 'CODE', undefined, undefined, { status } as AxiosResponse)
}

const savePayload = {
  session_id: 's1',
  user_message: '떡볶이',
  recipe_reply: '## 떡볶이',
  intent: 'SPECIFIC_FOOD' as const,
}

describe('useAllFavorites — 보유 세션 합산', () => {
  it('인덱스의 모든 세션을 조회해 최신순으로 합산한다 (happy)', async () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1', 's2'] })
    mocks.getFavorites.mockImplementation((id: string) =>
      Promise.resolve(
        id === 's1'
          ? [makeFav(1, { session_id: 's1', created_at: '2026-06-01T00:00:00Z' })]
          : [makeFav(2, { session_id: 's2', created_at: '2026-06-02T00:00:00Z' })],
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAllFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // s2(6/2) 가 s1(6/1) 보다 최신 → 앞에 온다
    expect(result.current.data.map((f) => f.id)).toEqual([2, 1])
    expect(mocks.getFavorites).toHaveBeenCalledWith('s1')
    expect(mocks.getFavorites).toHaveBeenCalledWith('s2')
  })

  it('인덱스가 비어 있으면 요청하지 않고 빈 배열을 반환한다 (edge)', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAllFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
    expect(mocks.getFavorites).not.toHaveBeenCalled()
  })

  it('일부 세션만 실패하면 성공분은 노출하고 isError 는 false 다 (edge)', async () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1', 's2'] })
    mocks.getFavorites.mockImplementation((id: string) =>
      id === 's1'
        ? Promise.resolve([makeFav(1, { session_id: 's1' })])
        : Promise.reject(new Error('500')),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAllFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.map((f) => f.id)).toEqual([1])
    expect(result.current.isError).toBe(false)
  })

  it('모든 세션 조회가 실패하면 isError 가 true 다 (error)', async () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1', 's2'] })
    mocks.getFavorites.mockRejectedValue(new Error('500'))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAllFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSaveFavorite', () => {
  it('저장 후 favorites 쿼리를 무효화하고 인덱스에 session_id 를 등록한다 (happy)', async () => {
    const { client, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSaveFavorite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        session_id: 's9',
        user_message: '떡볶이',
        recipe_reply: '## 떡볶이',
        intent: 'SPECIFIC_FOOD',
      })
    })

    expect(mocks.saveFavorite).toHaveBeenCalledOnce()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['favorites'] })
    expect(useSessionStore.getState().favoriteSessionIds).toContain('s9')
  })

  it('mutateAsync 는 생성된 레코드(id 포함)를 반환하고 세션 캐시에 적재한다 (happy)', async () => {
    mocks.saveFavorite.mockResolvedValue(makeFav(34, { session_id: 's1' }))
    const { client, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSaveFavorite(), { wrapper })

    let returned: FavoriteRecord | undefined
    await act(async () => {
      returned = await result.current.mutateAsync(savePayload)
    })

    expect(returned?.id).toBe(34)
    // 라이브 토글 삭제가 캐시 기반 unmark 를 정확히 판정하도록 저장분을 세션 캐시에 넣는다
    expect((client.getQueryData(['favorites', 's1']) as FavoriteRecord[]).map((f) => f.id)).toEqual([
      34,
    ])
  })

  it('한 세션에 2개 저장 후 1개만 삭제하면 세션 인덱스는 유지된다 (edge)', async () => {
    mocks.saveFavorite
      .mockResolvedValueOnce(makeFav(1, { session_id: 's1' }))
      .mockResolvedValueOnce(makeFav(2, { session_id: 's1' }))
    const { client, wrapper } = makeWrapper()
    const save = renderHook(() => useSaveFavorite(), { wrapper })
    await act(async () => {
      await save.result.current.mutateAsync(savePayload)
      await save.result.current.mutateAsync(savePayload)
    })

    const del = renderHook(() => useDeleteFavorite(), { wrapper })
    await act(async () => {
      await del.result.current.mutateAsync({ id: 1, session_id: 's1' })
    })

    expect((client.getQueryData(['favorites', 's1']) as FavoriteRecord[]).map((f) => f.id)).toEqual([
      2,
    ])
    expect(useSessionStore.getState().favoriteSessionIds).toContain('s1')
  })

  it('400(중복)이면 안내 토스트를 띄운다 (edge)', async () => {
    mocks.saveFavorite.mockRejectedValue(axiosErrorWithStatus(400))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSaveFavorite(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync(savePayload)
      } catch {
        // 의도된 실패
      }
    })

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toContain('이미')
  })

  it('400 이 아닌 에러에는 중복 안내 토스트를 띄우지 않는다 (error)', async () => {
    mocks.saveFavorite.mockRejectedValue(axiosErrorWithStatus(500))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSaveFavorite(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync(savePayload)
      } catch {
        // 의도된 실패
      }
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})

describe('useDeleteFavorite', () => {
  it('삭제 시 해당 세션 캐시에서 낙관적으로 즉시 제거한다 (happy)', async () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1'] })
    const { client, wrapper } = makeWrapper()
    client.setQueryData(
      ['favorites', 's1'],
      [makeFav(1, { session_id: 's1' }), makeFav(2, { session_id: 's1' })],
    )
    const { result } = renderHook(() => useDeleteFavorite(), { wrapper })

    act(() => {
      result.current.mutate({ id: 1, session_id: 's1' })
    })

    await waitFor(() =>
      expect(
        (client.getQueryData(['favorites', 's1']) as FavoriteRecord[]).map((f) => f.id),
      ).toEqual([2]),
    )
    expect(mocks.deleteFavorite).toHaveBeenCalledWith(1)
  })

  it('세션의 마지막 즐겨찾기를 지우면 인덱스에서도 제거한다 (edge)', async () => {
    useSessionStore.setState({ favoriteSessionIds: ['s1'] })
    const { client, wrapper } = makeWrapper()
    client.setQueryData(['favorites', 's1'], [makeFav(1, { session_id: 's1' })])
    const { result } = renderHook(() => useDeleteFavorite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 1, session_id: 's1' })
    })

    expect(useSessionStore.getState().favoriteSessionIds).not.toContain('s1')
  })

  it('삭제 실패 시 캐시를 원래대로 롤백한다 (error)', async () => {
    mocks.deleteFavorite.mockRejectedValue(new Error('500'))
    const { client, wrapper } = makeWrapper()
    client.setQueryData(
      ['favorites', 's1'],
      [makeFav(1, { session_id: 's1' }), makeFav(2, { session_id: 's1' })],
    )
    const { result } = renderHook(() => useDeleteFavorite(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 1, session_id: 's1' })
      } catch {
        // 의도된 실패
      }
    })

    await waitFor(() =>
      expect(
        (client.getQueryData(['favorites', 's1']) as FavoriteRecord[]).map((f) => f.id),
      ).toEqual([1, 2]),
    )
  })
})
