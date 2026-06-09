import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ChatView, { type FavoriteTurn } from '@/components/chat/ChatView'
import StateMessage from '@/components/common/StateMessage'
import { useStream } from '@/hooks/useStream'
import { useHistory, useDeleteHistory } from '@/hooks/useHistory'
import { useSaveFavorite, useDeleteFavorite, useFavoritesForSession } from '@/hooks/useFavorites'
import { useSessionStore } from '@/store/sessionStore'
import { recordToMessages, recordToHistoryIds } from '@/lib/recordToMessages'

/**
 * 즐겨찾기 토글 핸들러 — 현재 세션 id 기준.
 * 저장은 생성된 favorite id 를 반환해 버블이 토글(삭제)에 쓰게 하고, 삭제는 그 id 로 호출한다.
 */
function useFavoriteHandlers(sessionId: string) {
  const saveFavorite = useSaveFavorite()
  const deleteFavorite = useDeleteFavorite()

  const onSaveFavorite = async (turn: FavoriteTurn) => {
    const record = await saveFavorite.mutateAsync({ session_id: sessionId, ...turn })
    return record.id
  }
  const onDeleteFavorite = (id: number) => deleteFavorite.mutate({ id, session_id: sessionId })

  return { onSaveFavorite, onDeleteFavorite }
}

export default function ChatPage() {
  // 모드는 URL 로 판정한다: `/chat/:sessionId` 면 읽기 전용, `/chat` 이면 라이브.
  // 훅 호출 규칙상 모드별로 컴포넌트를 분리한다(조건부 훅 호출 금지).
  const { sessionId } = useParams<{ sessionId?: string }>()

  if (sessionId) return <ReadOnlyChat sessionId={sessionId} />
  return <LiveChat />
}

/** 라이브 세션 — 메모리 history + 실시간 스트리밍 */
function LiveChat() {
  const history = useSessionStore((s) => s.history)
  const historyIds = useSessionStore((s) => s.historyIds)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const consumePendingMessage = useSessionStore((s) => s.consumePendingMessage)
  const removeHistoryPair = useSessionStore((s) => s.removeHistoryPair)
  const { isStreaming, streamingText, activeTool, error, send } = useStream()
  const { onSaveFavorite, onDeleteFavorite } = useFavoriteHandlers(currentSessionId)
  const deleteHistory = useDeleteHistory()

  // 홈→채팅 핸드오프: 진입 시 대기 메시지를 원자적으로 읽고 비운 뒤 1회만 전송.
  // StrictMode(개발) 가 effect 를 이중 호출해도 두 번째엔 스토어가 비어 null 을 받아 재전송하지 않는다.
  useEffect(() => {
    const captured = consumePendingMessage()
    if (captured) void send(captured)
  }, [consumePendingMessage, send])

  const onDeleteHistory = async (historyId: number) => {
    await deleteHistory.mutateAsync(historyId)
    removeHistoryPair(historyId)
  }

  return (
    <ChatView
      history={history}
      isStreaming={isStreaming}
      streamingText={streamingText}
      activeTool={activeTool}
      error={error}
      onSend={send}
      historyIds={historyIds}
      onSaveFavorite={onSaveFavorite}
      onDeleteFavorite={onDeleteFavorite}
      onDeleteHistory={onDeleteHistory}
    />
  )
}

/** 과거 세션 — GET /api/history 로드 후 읽기 전용 렌더 */
function ReadOnlyChat({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useHistory(sessionId)
  // 저장 여부(저장됨 배지)를 초기 mount 시점에 정확히 그리려면 즐겨찾기도 함께 로드한다.
  const favorites = useFavoritesForSession(sessionId)
  const messages = useMemo(() => recordToMessages(data ?? []), [data])
  const historyIds = useMemo(() => recordToHistoryIds(data ?? []), [data])
  // history_id → { history_id, favorite_id }. 이미 저장된 턴을 ChatView 가 저장됨으로 렌더한다.
  const favoritedMap = useMemo(
    () =>
      new Map(
        (favorites.data ?? []).map((f) => [
          f.history_id,
          { history_id: f.history_id, favorite_id: f.id },
        ]),
      ),
    [favorites.data],
  )
  const { onSaveFavorite, onDeleteFavorite } = useFavoriteHandlers(sessionId)
  const deleteHistory = useDeleteHistory()
  const queryClient = useQueryClient()

  const onDeleteHistory = async (historyId: number) => {
    await deleteHistory.mutateAsync(historyId)
    queryClient.invalidateQueries({ queryKey: ['history', sessionId] })
    // 삭제한 대화가 즐겨찾기돼 있었을 수 있으므로 즐겨찾기 캐시도 무효화해 정합을 맞춘다.
    queryClient.invalidateQueries({ queryKey: ['favorites', sessionId] })
  }

  // history·favorites 둘 다 로드된 뒤 렌더 — initialFavoriteId 가 첫 mount 에 확정돼야 한다.
  // (즐겨찾기 조회 실패는 치명적이지 않다 — 빈 맵으로 진행해 본문은 정상 노출)
  if (isLoading || favorites.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="loading">대화 기록을 불러오는 중…</StateMessage>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="error">대화 기록을 불러오지 못했습니다.</StateMessage>
      </div>
    )
  }

  return (
    <ChatView
      history={messages}
      readOnly
      historyIds={historyIds}
      favoritedMap={favoritedMap}
      onSaveFavorite={onSaveFavorite}
      onDeleteFavorite={onDeleteFavorite}
      onDeleteHistory={onDeleteHistory}
    />
  )
}
