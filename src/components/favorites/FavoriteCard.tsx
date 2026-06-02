import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FavoriteRecord } from '@/types'

interface Props {
  favorite: FavoriteRecord
  onDelete: (id: number) => void
}

/**
 * 저장된 즐겨찾기 한 건(질문 + 답변)을 카드로 표시한다. (DESIGN.md §7 카드)
 * 답변은 채팅과 동일한 마크다운으로 렌더한다.
 */
export default function FavoriteCard({ favorite, onDelete }: Props) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-6 shadow-lift">
      <header className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-body-strong">{favorite.user_message}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="즐겨찾기 삭제"
          onClick={() => onDelete(favorite.id)}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </header>

      <div className="flex flex-col gap-2 border-t border-hairline-soft pt-3 text-sm text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{favorite.recipe_reply}</ReactMarkdown>
      </div>
    </article>
  )
}
