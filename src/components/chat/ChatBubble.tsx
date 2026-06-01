import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
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

export default function ChatBubble({ role, content, isStreaming = false }: Props) {
  if (role === 'user') {
    return (
      <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-none bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mr-auto max-w-[85%] rounded-lg rounded-bl-none border border-hairline bg-surface px-4 py-2.5 text-sm text-foreground',
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
  )
}
