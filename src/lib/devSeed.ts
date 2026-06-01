import type { QueryClient } from '@tanstack/react-query'
import { mockSessions, mockHistoryBySession } from '@/api/mock/mockHistory'
import { useSessionStore } from '@/store/sessionStore'

/**
 * DEV 전용 — 백엔드 없이 "과거 세션 조회" 흐름을 시연하기 위해 mock 데이터를 시드한다.
 * 1) 사이드바 세션 목록(`store.sessions`)에 mock 세션 주입
 * 2) 세션별 기록을 Query 캐시(`['history', id]`)에 주입 → `useHistory` 가 네트워크 없이 반환
 *
 * `useHistory` 의 `staleTime: Infinity` 와 맞물려, 시드된 세션은 재요청 없이 캐시로 렌더된다.
 * 프로덕션 빌드에서는 호출부(App)가 `import.meta.env.DEV` 로 가드되어 트리셰이킹된다.
 */
export function seedDevData(queryClient: QueryClient) {
  useSessionStore.setState({ sessions: mockSessions })
  for (const session of mockSessions) {
    const records = mockHistoryBySession[session.id]
    // 기록이 없는 세션(예: 로드 실패 데모)은 시드하지 않아 useHistory 가 실제로 조회→실패한다
    if (records) queryClient.setQueryData(['history', session.id], records)
  }
}
