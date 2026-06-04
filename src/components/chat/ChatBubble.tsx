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
  /** assistant 버블에 한해 하단 즐겨찾기 버튼을 노출하고, 클릭 시 호출 */
  onFavorite?: () => void
}

export default function ChatBubble({
  role,
  content,
  isStreaming = false,
  onFavorite,
}: Props) {
  const [saved, setSaved] = useState(false)

  if (role === 'user') {
    return (
      <motion.div
        {...bubbleMotion}
        className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-none bg-primary px-4 py-2.5 text-sm text-primary-foreground"
      >
        {content}
      </motion.div>
    )
  }

  const handleFavorite = () => {
    onFavorite?.()
    setSaved(true)
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

      {onFavorite && (
        <button
          type="button"
          onClick={handleFavorite}
          disabled={saved}
          aria-label={saved ? '즐겨찾기에 저장됨' : '즐겨찾기에 저장'}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded-sm px-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default',
            saved ? 'text-accent' : 'text-muted-foreground hover:text-accent',
          )}
        >
          <Star className={cn('size-3.5', saved && 'fill-accent')} />
          {saved ? '저장됨' : '즐겨찾기'}
        </button>
      )}
    </motion.div>
  )
}
