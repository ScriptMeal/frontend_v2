import { useMutation, useQuery } from '@tanstack/react-query'
import { deleteHistory, getHistory } from '@/api/user'

/**
 * 세션의 대화 기록을 `GET /api/history?session_id=` 로 조회한다.
 * 세션 진입 시 이 결과를 스토어에 1회 하이드레이션해 이어쓰기의 출발점으로 삼는다.
 * 서버 데이터는 TanStack Query 로만 관리한다(컨벤션). 캐시는 useStream(저장 후 prepend)·
 * ChatPage(삭제 후 filter)가 직접 갱신해 staleTime: Infinity 에서도 최신을 유지한다.
 *
 * @param sessionId 조회할 세션 id
 * @param options.enabled false 면 조회를 보류
 */
export function useHistory(sessionId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['history', sessionId],
    queryFn: () => getHistory(sessionId),
    enabled: (options.enabled ?? true) && Boolean(sessionId),
    // 과거 세션 기록은 불변 — 재요청 없이 캐시 사용(시드된 DEV mock 도 그대로 렌더)
    staleTime: Infinity,
    // 조회 실패 시 곧바로 에러 상태 노출(읽기 전용 기록은 재시도 이득이 적음)
    retry: false,
  })
}

/**
 * 히스토리 1건을 `DELETE /api/history/{id}` 로 삭제한다.
 * 성공 후 상태 업데이트(store 갱신 또는 캐시 무효화)는 호출부가 담당한다.
 */
export function useDeleteHistory() {
  return useMutation({
    mutationFn: (id: number) => deleteHistory(id),
  })
}
