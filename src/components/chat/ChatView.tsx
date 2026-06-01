import { useEffect, useRef } from 'react'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import ToolIndicator from '@/components/chat/ToolIndicator'
import type { Message } from '@/types'

interface Props {
  history: Message[]
  isStreaming?: boolean
  streamingText?: string
  activeTool?: string | null
  error?: string | null
  onSend?: (message: string) => void
  /** 과거 세션 조회 모드 — 입력창 대신 읽기 전용 안내를 보여준다 */
  readOnly?: boolean
}

/**
 * 채팅 화면의 프레젠테이셔널 컴포넌트.
 * 상태/스트림 소유는 상위(ChatPage·DevPlaygroundPage)가 담당하고,
 * 이 컴포넌트는 전달받은 값으로 렌더 + 자동 스크롤만 책임진다.
 */
export default function ChatView({
  history,
  isStreaming = false,
  streamingText = '',
  activeTool = null,
  error = null,
  onSend,
  readOnly = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length, streamingText, activeTool])

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {history.map((message, index) => (
            <ChatBubble
              key={`${message.role}-${index}`}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* 스트리밍 중 임시 assistant 버블 (텍스트가 들어오기 시작하면 표시) */}
          {isStreaming && streamingText && (
            <ChatBubble role="assistant" content={streamingText} isStreaming />
          )}

          {/* 텍스트 도착 전 툴 실행 단계 표시 */}
          {isStreaming && activeTool && <ToolIndicator tool={activeTool} />}

          {error && (
            <div
              role="alert"
              className="mr-auto max-w-[85%] rounded-lg border border-destructive/40 bg-surface px-4 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-hairline bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          {readOnly ? (
            <p className="py-1.5 text-center text-xs text-muted-foreground">
              읽기 전용 — 과거 대화입니다. 이어가려면 새 대화를 시작하세요.
            </p>
          ) : (
            <ChatInput onSubmit={onSend ?? (() => {})} disabled={isStreaming} />
          )}
        </div>
      </div>
    </div>
  )
}
