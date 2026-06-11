import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ChatView, { type FavoriteTurn } from '@/components/chat/ChatView'
import StateMessage from '@/components/common/StateMessage'
import { useStream } from '@/hooks/useStream'
import { useHistory, useDeleteHistory } from '@/hooks/useHistory'
import { useSaveFavorite, useDeleteFavorite, useFavoritesForSession } from '@/hooks/useFavorites'
import { useSessionStore } from '@/store/sessionStore'
import { recordToMessages, recordToHistoryIds } from '@/lib/recordToMessages'
import type { HistoryRecord } from '@/types'

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
  // 모든 세션은 `/chat/:sessionId` 로 통일된다. 라우트상 sessionId 는 항상 존재하나,
  // 빈 `/chat` 같은 비정상 진입은 홈으로 돌린다(훅 호출 규칙상 가드 후 본체를 분리).
  const { sessionId } = useParams<{ sessionId?: string }>()

  if (!sessionId) return <Navigate to="/home" replace />
  return <ChatSession sessionId={sessionId} />
}

/**
 * 단일 세션 화면 — 진입 시 `GET /api/history` 로 대화를 로드해 스토어에 1회 하이드레이션한 뒤,
 * 그 위에서 라이브 스트리밍으로 이어쓰기한다(스토어가 데이터의 주인 = A안).
 * 과거/현재 구분이 없다 — 어떤 세션이든 열면 이어서 대화할 수 있다.
 */
function ChatSession({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useHistory(sessionId)
  // 저장 여부(저장됨 배지)를 첫 mount 에 정확히 그리려면 즐겨찾기도 함께 로드한다.
  const favorites = useFavoritesForSession(sessionId)

  const history = useSessionStore((s) => s.history)
  const historyIds = useSessionStore((s) => s.historyIds)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const loadSession = useSessionStore((s) => s.loadSession)
  const consumePendingMessage = useSessionStore((s) => s.consumePendingMessage)
  const removeHistoryPair = useSessionStore((s) => s.removeHistoryPair)
  const removeSession = useSessionStore((s) => s.removeSession)

  const { isStreaming, streamingText, activeTool, error, send } = useStream()
  const { onSaveFavorite, onDeleteFavorite } = useFavoriteHandlers(sessionId)
  const deleteHistory = useDeleteHistory()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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

  // 하이드레이션 — 세션당 1회. 진입한 세션의 서버 기록을 스토어(history·historyIds·currentSessionId)에
  // 적재해 라이브로 승격한다. 적재 여부는 별도 state 가 아니라 store 의 currentSessionId 로 판정한다:
  // loadSession 이 currentSessionId 를 진입 세션으로 바꾸므로, 적재 후엔 조건이 거짓이 되어
  // 같은 세션 이어쓰기 중 재적재(라이브 history 덮어쓰기)가 일어나지 않는다(A안 보강책 ①).
  // (홈→새 세션은 startNewSession 이 이미 currentSessionId 를 맞춰둬 빈 history 로 즉시 hydrated 다.)
  const hydrated = currentSessionId === sessionId
  useEffect(() => {
    if (isLoading) return // 이 세션의 기록이 아직 도착하지 않음
    if (currentSessionId === sessionId) return
    loadSession(sessionId, recordToMessages(data ?? []), recordToHistoryIds(data ?? []))
  }, [sessionId, isLoading, data, currentSessionId, loadSession])

  // 홈 핸드오프: 하이드레이션이 끝난 뒤에만 대기 메시지를 1회 전송한다.
  // (loadSession 이 history 를 덮어쓰기 전에 send 하면 낙관적 user 버블이 사라지므로 순서가 중요하다.)
  // consumePendingMessage 가 원자적이라 StrictMode 이중 호출에도 한 번만 전송된다.
  useEffect(() => {
    if (!hydrated) return
    const captured = consumePendingMessage()
    if (captured) void send(captured)
  }, [hydrated, consumePendingMessage, send])

  const onDeleteHistory = async (historyId: number) => {
    await deleteHistory.mutateAsync(historyId)
    // 화면(스토어)에서 즉시 제거하고, 재방문·새로고침 정합을 위해 서버 캐시 사본도 갱신한다.
    removeHistoryPair(historyId)
    queryClient.setQueryData<HistoryRecord[]>(['history', sessionId], (old) =>
      (old ?? []).filter((r) => r.id !== historyId),
    )
    // 삭제한 턴이 즐겨찾기돼 있었을 수 있으므로 즐겨찾기 캐시도 무효화해 정합을 맞춘다.
    queryClient.invalidateQueries({ queryKey: ['favorites', sessionId] })
    // 마지막 쌍까지 지워 세션이 비면 사이드바·즐겨찾기 인덱스에서 제거하고 홈으로 보낸다.
    if (useSessionStore.getState().history.length === 0) {
      removeSession(sessionId)
      navigate('/home')
    }
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="error">대화 기록을 불러오지 못했습니다.</StateMessage>
      </div>
    )
  }

  // 하이드레이션·즐겨찾기 로드가 끝나기 전엔 로딩 — 과거 기록이 뒤늦게 끼어드는 레이아웃 점프와,
  // initialFavoriteId 가 첫 mount 에 누락되는 것을 막는다.
  if (!hydrated || favorites.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="loading">대화 기록을 불러오는 중…</StateMessage>
      </div>
    )
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
      favoritedMap={favoritedMap}
      onSaveFavorite={onSaveFavorite}
      onDeleteFavorite={onDeleteFavorite}
      onDeleteHistory={onDeleteHistory}
    />
  )
}
