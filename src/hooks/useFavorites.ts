import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getFavorites, saveFavorite, deleteFavorite } from '@/api/user'
import { useSessionStore } from '@/store/sessionStore'
import { useToastStore } from '@/store/toastStore'
import type { FavoriteRecord, SaveFavoritePayload } from '@/types'

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
 * 단일 세션의 즐겨찾기 조회 — 읽기전용 채팅이 저장 여부(history_id 대조)를 그릴 때 쓴다.
 * `useAllFavorites` 와 동일한 캐시 키(['favorites', id])를 공유해 중복 요청을 피한다.
 */
export function useFavoritesForSession(sessionId: string) {
  return useQuery({
    queryKey: ['favorites', sessionId],
    queryFn: () => getFavorites(sessionId),
    enabled: Boolean(sessionId),
  })
}

/**
 * 즐겨찾기 저장 — 성공 시 목록 무효화로 재조회하고, 해당 세션을 보유 인덱스에 등록한다.
 */
export function useSaveFavorite() {
  const queryClient = useQueryClient()
  const markSessionFavorited = useSessionStore((s) => s.markSessionFavorited)
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (payload: SaveFavoritePayload) => saveFavorite(payload),
    onSuccess: (record, variables) => {
      markSessionFavorited(variables.session_id)
      // 저장분을 해당 세션 캐시에 즉시 반영한다. 라이브 세션엔 캐시가 비어 있어,
      // 이후 토글 삭제 시 useDeleteFavorite 의 잔여 판정(unmark)이 정확해진다.
      if (record) {
        queryClient.setQueryData<FavoriteRecord[]>(['favorites', variables.session_id], (old) => [
          record,
          ...(old ?? []),
        ])
      }
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
    // 백엔드가 중복 저장을 400 으로 가드한다. 사용자에게 이미 저장됨을 안내한다.
    // (5xx 는 axios 인터셉터가 전역 토스트로 처리하므로 여기선 400 만 다룬다.)
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        addToast({ variant: 'info', message: '이미 즐겨찾기에 저장된 레시피예요.' })
      }
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
