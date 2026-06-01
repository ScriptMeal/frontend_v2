import { useEffect, useRef } from 'react'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import ToolIndicator from '@/components/chat/ToolIndicator'
import { useStream } from '@/hooks/useStream'
import { useSessionStore } from '@/store/sessionStore'

export default function ChatPage() {
  const history = useSessionStore((s) => s.history)
  const pendingMessage = useSessionStore((s) => s.pendingMessage)
  const clearPendingMessage = useSessionStore((s) => s.clearPendingMessage)
  const { isStreaming, streamingText, activeTool, error, send } = useStream()

  // 홈→채팅 핸드오프: 진입 시 대기 메시지를 캡처해 비운 뒤 1회만 전송
  useEffect(() => {
    if (!pendingMessage) return
    const captured = pendingMessage
    clearPendingMessage()
    void send(captured)
  }, [pendingMessage, clearPendingMessage, send])

  // 자동 스크롤: 메시지 추가·스트리밍 텍스트 변화 시 하단으로
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
          <ChatInput onSubmit={send} disabled={isStreaming} />
        </div>
      </div>
    </div>
  )
}
