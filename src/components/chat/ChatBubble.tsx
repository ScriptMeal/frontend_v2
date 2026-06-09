import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import RecipeContent from '@/components/chat/RecipeContent'

// DESIGN.md §8 — 채팅 버블 등장 (y:8→0, opacity 0→1, 0.25s easeOut)
const bubbleMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  /**
   * 이미 즐겨찾기된 상태로 mount 할 때의 favorite id(읽기전용 채팅 진입 시).
   * 있으면 처음부터 "저장됨" 으로 그려지고, 클릭 시 이 id 로 삭제한다.
   */
  initialFavoriteId?: number
  /** assistant 버블에 한해 즐겨찾기 버튼을 노출한다. 저장 성공 시 생성된 favorite id 를 반환한다. */
  onSaveFavorite?: () => Promise<number>
  /** 저장된 즐겨찾기를 해제(삭제)한다. 저장 시 받은 id 로 호출된다. */
  onDeleteFavorite?: (id: number) => void | Promise<void>
  /** 즐겨찾기 버튼 옆(푸터)에 나란히 렌더할 추가 액션(예: 대화 삭제). assistant 버블 전용. */
  footerAction?: React.ReactNode
}

export default function ChatBubble({
  role,
  content,
  isStreaming = false,
  initialFavoriteId,
  onSaveFavorite,
  onDeleteFavorite,
  footerAction,
}: Props) {
  // 저장되면 favorite id 를 보유한다(=별 채움). 해제하면 null 로 되돌린다.
  const [favoriteId, setFavoriteId] = useState<number | null>(initialFavoriteId ?? null)
  const [pending, setPending] = useState(false)

  if (role === 'user') {
    return (
      <motion.div
        {...bubbleMotion}
        className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-none bg-primary px-4 py-2.5 text-sm text-primary-foreground"
      >
        {content}
      </motion.div>
    )
  }

  const isSaved = favoriteId !== null

  const handleToggle = async () => {
    if (pending || !onSaveFavorite) return
    setPending(true)
    try {
      if (favoriteId === null) {
        const id = await onSaveFavorite()
        setFavoriteId(id)
      } else {
        await onDeleteFavorite?.(favoriteId)
        setFavoriteId(null)
      }
    } catch {
      // 저장/삭제 실패: 상태를 바꾸지 않는다(중복 400 등은 상위에서 토스트로 안내).
    } finally {
      setPending(false)
    }
  }

  return (
    <motion.div
      {...bubbleMotion}
      className="mr-auto flex max-w-[85%] flex-col items-start gap-1"
    >
      <div
        className={cn(
          'w-full rounded-lg rounded-bl-none border border-hairline bg-surface px-4 py-2.5 text-sm text-foreground',
          isStreaming &&
            'after:ml-0.5 after:inline-block after:h-4 after:w-px after:animate-pulse after:bg-foreground after:align-text-bottom after:content-[""]',
        )}
      >
        <RecipeContent content={content} />
      </div>

      {(onSaveFavorite || footerAction) && (
        <div className="flex items-center gap-3">
          {onSaveFavorite && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={pending}
              aria-label={isSaved ? '즐겨찾기 해제' : '즐겨찾기에 저장'}
              aria-pressed={isSaved}
              className={cn(
                'flex cursor-pointer items-center gap-1 rounded-sm px-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-60',
                isSaved ? 'text-accent' : 'text-muted-foreground hover:text-accent',
              )}
            >
              <Star className={cn('size-3.5', isSaved && 'fill-accent')} />
              {isSaved ? '저장됨' : '즐겨찾기'}
            </button>
          )}
          {footerAction}
        </div>
      )}
    </motion.div>
  )
}
