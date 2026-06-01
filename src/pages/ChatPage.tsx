import { useEffect } from 'react'
import ChatView from '@/components/chat/ChatView'
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

  return (
    <ChatView
      history={history}
      isStreaming={isStreaming}
      streamingText={streamingText}
      activeTool={activeTool}
      error={error}
      onSend={send}
    />
  )
}
