import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { getFavorites, saveFavorite, deleteFavorite } from '@/api/user'
import { useSessionStore } from '@/store/sessionStore'
import type { FavoriteRecord, SaveRecipePayload } from '@/types'

/**
 * 즐겨찾기 보유 세션(`favoriteSessionIds`)에만 fan-out 해 전체 즐겨찾기를 합산한다.
 * 전체 조회 API 가 없어 세션별 `GET /api/favorites` 를 병렬 호출하되, 인덱스로 대상 세션을
 * 즐겨찾기 보유 세션으로 한정해 세션 총수와 무관하게 요청 수를 줄인다.
 * (결정: .claude/decisions/20260602-favorites-aggregation-strategy.md)
 */
export function useAllFavorites() {
  const sessionIds = useSessionStore((s) => s.favoriteSessionIds)

  return useQueries({
    queries: sessionIds.map((id) => ({
      queryKey: ['favorites', id],
      queryFn: () => getFavorites(id),
    })),
    combine: (results) => ({
      data: results
        .flatMap((r) => r.data ?? [])
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      isLoading: results.some((r) => r.isLoading),
      // 일부 실패는 성공분을 가리지 않도록 무시 — 전부 실패할 때만 에러로 본다.
      isError: results.length > 0 && results.every((r) => r.isError),
    }),
  })
}

/**
 * 즐겨찾기 저장 — 성공 시 목록 무효화로 재조회하고, 해당 세션을 보유 인덱스에 등록한다.
 */
export function useSaveFavorite() {
  const queryClient = useQueryClient()
  const markSessionFavorited = useSessionStore((s) => s.markSessionFavorited)

  return useMutation({
    mutationFn: (payload: SaveRecipePayload) => saveFavorite(payload),
    onSuccess: (_data, variables) => {
      markSessionFavorited(variables.session_id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

/**
 * 즐겨찾기 삭제 — 해당 세션 캐시에서 낙관적 제거 후 실패 시 롤백.
 * 삭제로 그 세션의 즐겨찾기가 비면 보유 인덱스에서도 제거한다(다음 fan-out 대상 축소).
 */
export function useDeleteFavorite() {
  const queryClient = useQueryClient()
  const unmarkSessionFavorited = useSessionStore((s) => s.unmarkSessionFavorited)

  return useMutation({
    mutationFn: ({ id }: { id: number; session_id: string }) => deleteFavorite(id),
    onMutate: async ({ id, session_id }) => {
      const queryKey = ['favorites', session_id]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoriteRecord[]>(queryKey)
      queryClient.setQueryData<FavoriteRecord[]>(queryKey, (old) =>
        (old ?? []).filter((f) => f.id !== id),
      )
      return { previous }
    },
    onError: (_err, { session_id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites', session_id], context.previous)
      }
    },
    onSuccess: (_data, { session_id }) => {
      const remaining = queryClient.getQueryData<FavoriteRecord[]>(['favorites', session_id])
      if (!remaining || remaining.length === 0) unmarkSessionFavorited(session_id)
    },
  })
}
