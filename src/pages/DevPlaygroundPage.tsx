import ChatView from '@/components/chat/ChatView'
import { Button } from '@/components/ui/button'
import { useStream } from '@/hooks/useStream'
import { useSaveFavorite, useDeleteFavorite } from '@/hooks/useFavorites'
import { mockStreamChat, mockSaveHistory, mockScenarios } from '@/api/mock/mockChat'
import { useSessionStore } from '@/store/sessionStore'

/**
 * DEV 전용 — 백엔드(localhost:8000) 없이 채팅 UI 로직을 mock 데이터로 확인하는 페이지.
 * 실제 useStream(누적·intent·done·에러 처리) + ChatView 를 그대로 태우고,
 * API 만 mock 으로 주입한다. 라우트: /dev
 */
export default function DevPlaygroundPage() {
  const history = useSessionStore((s) => s.history)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const startNewSession = useSessionStore((s) => s.startNewSession)
  const { isStreaming, streamingText, activeTool, error, send } = useStream({
    streamChat: mockStreamChat,
    saveHistory: mockSaveHistory,
  })
  const saveFavorite = useSaveFavorite()
  const deleteFavorite = useDeleteFavorite()

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-hairline bg-bg-soft px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                🧪 UI 데모 (mock 데이터)
              </p>
              <p className="text-xs text-muted-foreground">
                백엔드 없이 스트리밍·툴·마크다운·에러 UI를 확인합니다.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewSession}
              disabled={isStreaming}
            >
              대화 초기화
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mockScenarios.map((scenario) => (
              <Button
                key={scenario.id}
                variant="outline"
                size="sm"
                disabled={isStreaming}
                onClick={() => void send(scenario.message)}
              >
                {scenario.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ChatView
          history={history}
          isStreaming={isStreaming}
          streamingText={streamingText}
          activeTool={activeTool}
          error={error}
          onSend={send}
          onSaveFavorite={async (turn) => {
            const record = await saveFavorite.mutateAsync({ session_id: currentSessionId, ...turn })
            return record.id
          }}
          onDeleteFavorite={(id) =>
            deleteFavorite.mutate({ id, session_id: currentSessionId })
          }
        />
      </div>
    </div>
  )
}
