import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getFavorites, saveFavorite, deleteFavorite } from '@/api/user'
import type { FavoriteRecord, SaveRecipePayload } from '@/types'

/** 세션의 즐겨찾기 목록 조회 */
export function useFavorites(sessionId: string) {
  return useQuery({
    queryKey: ['favorites', sessionId],
    queryFn: () => getFavorites(sessionId),
    enabled: Boolean(sessionId),
  })
}

/** 즐겨찾기 저장 — 성공 시 목록 무효화로 재조회(서버 생성 id·created_at 반영) */
export function useSaveFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveRecipePayload) => saveFavorite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

/**
 * 즐겨찾기 삭제 — 낙관적 제거 후 실패 시 롤백.
 * 삭제는 결정적이므로 성공 시 재조회 없이 낙관적 캐시를 그대로 유지한다.
 */
export function useDeleteFavorite(sessionId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['favorites', sessionId]

  return useMutation({
    mutationFn: (id: number) => deleteFavorite(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoriteRecord[]>(queryKey)
      queryClient.setQueryData<FavoriteRecord[]>(queryKey, (old) =>
        (old ?? []).filter((f) => f.id !== id),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })
}
