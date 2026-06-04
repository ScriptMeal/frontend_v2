import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecipeContent from '@/components/chat/RecipeContent'
import IntentChip from '@/components/favorites/IntentChip'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onDelete: (id: number) => void
}

/**
 * C안 — 항상 펼침 + 에디토리얼 재설계.
 * 접기 없이 전체 내용을 보여주되, 질문을 액센트 사이드룰이 있는 머리띠로 올려 위계를 주고
 * 본문은 RecipeContent 로 채팅과 동일하게 렌더한다. 채팅 버블과 달리 풀폭 카드 chrome.
 */
export default function FavoriteCardExpanded({ favorite, onDelete }: Props) {
  return (
    <article className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-lift">
      <header className="flex items-start justify-between gap-3 bg-bg-soft px-5 py-4">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-3">
          <p className="text-sm font-medium text-body-strong">{favorite.user_message}</p>
          <IntentChip intent={favorite.intent} />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="즐겨찾기 삭제"
          onClick={() => onDelete(favorite.id)}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </header>

      <div className="px-5 py-4 text-sm text-foreground">
        <RecipeContent content={favorite.recipe_reply} />
      </div>
    </article>
  )
}
