import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecipeContent from '@/components/chat/RecipeContent'
import IntentChip from '@/components/favorites/IntentChip'
import { recipePreview } from '@/lib/recipePreview'
import { cn } from '@/lib/utils'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onDelete: (id: number) => void
}

/**
 * A안 — 접이식(아코디언) 카드.
 * 기본은 질문 + intent 칩 + 한 줄 미리보기로 접혀 있고, 클릭하면 높이 애니메이션으로
 * 펼쳐져 응답 전체(RecipeContent)를 보여준다. 목록을 짧게 유지해 스크롤 피로를 줄인다.
 */
export default function FavoriteCardAccordion({ favorite, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const preview = recipePreview(favorite.recipe_reply)

  return (
    <article className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-lift">
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
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-body-strong">
                {favorite.user_message}
              </span>
              <IntentChip intent={favorite.intent} />
            </span>
            {!open && preview && (
              <span className="truncate text-xs text-muted-foreground">{preview}</span>
            )}
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
