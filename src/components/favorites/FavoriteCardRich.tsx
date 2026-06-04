import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecipeContent from '@/components/chat/RecipeContent'
import IntentChip from '@/components/favorites/IntentChip'
import { recipePreview } from '@/lib/recipePreview'
import { cn } from '@/lib/utils'
import type { FavoriteRecord, Intent } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onDelete: (id: number) => void
}

// intent별 왼쪽 보더 색상 — 색이 아닌 타이포가 위계를 만드는 원칙 안에서,
// 보더만 색을 입혀 카드가 모두 똑같아 보이는 단조로움을 해소한다.
const sideRuleColor: Record<Intent, string> = {
  SPECIFIC_FOOD: 'border-l-accent',
  GENERAL_RECIPE: 'border-l-sky-400',
  OFF_TOPIC: 'border-l-chalk',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * D안 — 아코디언 강화.
 * 기존 A안에서 intent별 사이드룰 색상 + 날짜 + 2줄 미리보기를 추가해
 * 접힌 상태에서 카드가 더 풍부하게 느껴지도록 한다.
 */
export default function FavoriteCardRich({ favorite, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const preview = recipePreview(favorite.recipe_reply, 120)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-hairline bg-surface shadow-lift',
        'border-l-2',
        sideRuleColor[favorite.intent],
      )}
    >
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
          <span className="flex min-w-0 flex-col gap-1.5">
            {/* 질문 + intent 칩 + 날짜 */}
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-body-strong">
                {favorite.user_message}
              </span>
              <IntentChip intent={favorite.intent} />
            </span>
            {/* 미리보기 — 접혀있을 때만, 2줄 클램프 */}
            {!open && preview && (
              <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {preview}
              </span>
            )}
            <span className="text-[11px] text-muted-soft">
              {formatDate(favorite.created_at)}
            </span>
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="즐겨찾기 삭제"
          onClick={() => onDelete(favorite.id)}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-hairline-soft px-4 py-3 text-sm text-foreground">
              <RecipeContent content={favorite.recipe_reply} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
