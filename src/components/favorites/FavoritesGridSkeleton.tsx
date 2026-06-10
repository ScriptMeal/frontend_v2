import { Skeleton } from '@/components/ui/skeleton'

// 첫 화면을 채울 만큼만 — 2열 기준 3행. 실제 데이터 도착 시 그대로 교체된다.
const CARD_COUNT = 6

/**
 * 즐겨찾기(GET /api/favorites) 로딩 자리표시.
 * FavoritesGrid 와 동일한 2열 그리드·카드 치수(h-200, radius-lg, shadow-lift)를 써서
 * 데이터 도착 시 레이아웃 점프가 없도록 한다.
 * role=status + sr-only 라벨로 기존 StateMessage(loading) 와 동일한 접근성을 보장한다.
 */
export default function FavoritesGridSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <span className="sr-only">불러오는 중…</span>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <div
          key={i}
          data-testid="favorite-skeleton-card"
          className="flex h-[200px] flex-col rounded-lg border border-hairline bg-surface p-4 shadow-lift"
        >
          {/* 헤더: 제목 + 부제목 */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>

          <hr className="mt-3 border-hairline" />
          <div className="flex-1" />

          {/* 하단: kcal + 재료 라인 */}
          <div className="flex items-end justify-between gap-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
