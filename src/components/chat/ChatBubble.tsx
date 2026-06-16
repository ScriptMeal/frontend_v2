import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Star } from 'lucide-react'
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
  /**
   * 같은 쌍의 다른 동작(대화 삭제)이 진행 중일 때 true.
   * 이때 즐겨찾기 토글을 막아 POST favorite 와 DELETE history 의 동시 발사를 차단한다.
   */
  favoriteDisabled?: boolean
  /** 즐겨찾기 토글(저장·해제)의 in-flight 여부를 상위에 보고한다(쌍 단위 lock 갱신용). */
  onBusyChange?: (busy: boolean) => void
  /** 즐겨찾기 버튼 옆(푸터)에 나란히 렌더할 추가 액션(예: 대화 삭제). assistant 버블 전용. */
  footerAction?: React.ReactNode
  /**
   * 모바일에서 하단 버튼을 숨긴 채 저장 여부만 알려야 할 때 사용하는 비-인터랙티브 표시.
   * 토글 버튼(onSaveFavorite)이 있으면 그쪽이 저장 상태를 그리므로 인디케이터는 생략한다.
   */
  saved?: boolean
}

export default function ChatBubble({
  role,
  content,
  isStreaming = false,
  initialFavoriteId,
  onSaveFavorite,
  onDeleteFavorite,
  favoriteDisabled = false,
  onBusyChange,
  footerAction,
  saved = false,
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
    if (pending || favoriteDisabled || !onSaveFavorite) return
    setPending(true)
    onBusyChange?.(true)
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
      onBusyChange?.(false)
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
              disabled={pending || favoriteDisabled}
              aria-label={isSaved ? '즐겨찾기 해제' : '즐겨찾기에 저장'}
              aria-pressed={isSaved}
              aria-busy={pending}
              className={cn(
                'flex cursor-pointer items-center gap-1 rounded-sm px-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-60',
                isSaved ? 'text-accent' : 'text-muted-foreground hover:text-accent',
              )}
            >
              {pending ? (
                <Loader2 data-testid="favorite-spinner" className="action-spinner size-3.5 animate-spin" />
              ) : (
                <Star className={cn('size-3.5', isSaved && 'fill-accent')} />
              )}
              {isSaved ? '저장됨' : '즐겨찾기'}
            </button>
          )}
          {footerAction}
        </div>
      )}

      {/* 모바일 저장 표시 — 푸터(토글 버튼)가 없을 때만. 누르는 동작은 컨텍스트 메뉴가 담당. */}
      {saved && !onSaveFavorite && (
        <div
          data-testid="saved-indicator"
          className="flex items-center gap-1 px-1 text-xs text-accent"
        >
          <Star className="size-3.5 fill-accent" />
          저장됨
        </div>
      )}
    </motion.div>
  )
}
