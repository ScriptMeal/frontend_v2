import { useQuery } from '@tanstack/react-query'
import { getHistory } from '@/api/user'

/**
 * 과거 세션의 대화 기록을 `GET /api/history?session_id=` 로 조회한다.
 * 서버 데이터는 TanStack Query 로만 관리한다(컨벤션). 읽기 전용 렌더 전용.
 *
 * @param sessionId 조회할 세션 id
 * @param options.enabled false 면 조회를 보류(라이브 세션 등)
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
