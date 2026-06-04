import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import IntentChip from '@/components/favorites/IntentChip'
import { recipePreview } from '@/lib/recipePreview'
import { cn } from '@/lib/utils'
import type { FavoriteRecord, Intent } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onOpen: (favorite: FavoriteRecord) => void
  onDelete: (id: number) => void
}

// D안과 동일한 intent 사이드룰 — 그리드에서도 색으로 카드 성격을 구분
const sideRuleColor: Record<Intent, string> = {
  SPECIFIC_FOOD: 'border-t-accent',
  GENERAL_RECIPE: 'border-t-sky-400',
  OFF_TOPIC: 'border-t-chalk',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/**
 * E안 그리드 카드 — 항상 보이는 상태로 2열 그리드에 배치.
 * 본문은 4줄 클램프로 미리보기만 노출하고, 카드 클릭 시 FavoriteDetailModal 로 전체 보기.
 * 상단 보더 색상으로 intent를 구분해 격자 안에서도 카드마다 개성을 준다.
 */
export default function FavoriteGridCard({ favorite, onOpen, onDelete }: Props) {
  const preview = recipePreview(favorite.recipe_reply, 200)

  return (
    <article
      className={cn(
        'flex cursor-pointer flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-lift transition-shadow hover:shadow-float',
        'border-t-2',
        sideRuleColor[favorite.intent],
      )}
      onClick={() => onOpen(favorite)}
    >
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* 헤더: 질문 + intent 칩 */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-sm font-medium leading-snug text-body-strong">
              {favorite.user_message}
            </p>
            <IntentChip intent={favorite.intent} />
          </div>
          {/* 삭제는 클릭 버블링 막고 처리 */}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="즐겨찾기 삭제"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(favorite.id)
            }}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>

        {/* 본문 미리보기 — 4줄 클램프 */}
        {preview && (
          <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {preview}
          </p>
        )}
      </div>

      {/* 푸터: 날짜 + 전체 보기 힌트 */}
      <div className="flex items-center justify-between border-t border-hairline-soft px-4 py-2">
        <span className="text-[11px] text-muted-soft">{formatDate(favorite.created_at)}</span>
        <span className="text-[11px] text-muted-foreground">전체 보기 →</span>
      </div>
    </article>
  )
}
