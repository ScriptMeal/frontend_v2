import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// DESIGN.md 토큰/타이포로 마크다운 엘리먼트 매핑
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-lg font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-body-strong">{children}</h3>
  ),
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-1 border-hairline" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-body-strong">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-surface-strong px-1 py-0.5 text-[0.85em]">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-signal underline">
      {children}
    </a>
  ),
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
        <div className="flex flex-col gap-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {onFavorite && (
        <button
          type="button"
          onClick={handleFavorite}
          disabled={saved}
          aria-label={saved ? '즐겨찾기에 저장됨' : '즐겨찾기에 저장'}
          className={cn(
            'flex items-center gap-1 px-1 text-xs transition-colors',
            saved
              ? 'text-accent'
              : 'text-muted-foreground hover:text-accent',
          )}
        >
          <Star className={cn('size-3.5', saved && 'fill-accent')} />
          {saved ? '저장됨' : '즐겨찾기'}
        </button>
      )}
    </motion.div>
  )
}
