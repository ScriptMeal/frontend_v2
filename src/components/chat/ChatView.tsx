import { useEffect, useRef } from 'react'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import ChatPairGroup from '@/components/chat/ChatPairGroup'
import DeleteHistoryControl from '@/components/chat/DeleteHistoryControl'
import ToolIndicator from '@/components/chat/ToolIndicator'
import StateMessage from '@/components/common/StateMessage'
import AuraBackground from '@/components/common/AuraBackground'
import { isFavoritableIntent } from '@/lib/intent'
import type { Intent, Message } from '@/types'

/** 즐겨찾기할 대화 턴(질문 + 답변 + 의도 + 원본 히스토리 id) */
export interface FavoriteTurn {
  user_message: string
  recipe_reply: string
  intent: Intent
  /** 이 턴의 history 레코드 id. 즐겨찾기 저장 시 반드시 함께 전송한다(누락 금지). */
  history_id: number
}

interface Props {
  history: Message[]
  isStreaming?: boolean
  streamingText?: string
  activeTool?: string | null
  error?: string | null
  onSend?: (message: string) => void
  /** 과거 세션 조회 모드 — 입력창 대신 읽기 전용 안내를 보여준다 */
  readOnly?: boolean
  /**
   * 메시지 index → history_id 매핑. assistant 버블의 즐겨찾기 저장에 쓴다.
   * history_id 가 없는 버블은 즐겨찾기 버튼을 노출하지 않는다(POST 누락 차단).
   */
  historyIds?: Record<number, number>
  /**
   * 이미 즐겨찾기된 턴: history_id → { history_id, favorite_id }.
   * 읽기전용 진입 시 저장됨 상태를 초기 렌더하는 데 쓴다.
   */
  favoritedMap?: Map<number, { history_id: number; favorite_id: number }>
  /** assistant 버블에 즐겨찾기 버튼을 노출하고, 저장 시 생성된 favorite id 를 반환한다 */
  onSaveFavorite?: (turn: FavoriteTurn) => Promise<number>
  /** 저장된 즐겨찾기를 id 로 해제(삭제)한다 */
  onDeleteFavorite?: (id: number) => void | Promise<void>
  /** 대화 쌍(user+assistant)을 history_id 로 삭제한다 */
  onDeleteHistory?: (historyId: number) => void | Promise<void>
}

/**
 * 채팅 화면의 프레젠테이셔널 컴포넌트.
 * 상태/스트림 소유는 상위(ChatPage·DevPlaygroundPage)가 담당하고,
 * 이 컴포넌트는 전달받은 값으로 렌더 + 자동 스크롤만 책임진다.
 *
 * 메시지는 user+assistant 쌍 단위로 ChatPairGroup 으로 묶어 렌더한다.
 * hover 시 그룹 전체 삭제 버튼이 노출되어 "쌍 삭제" 의도를 명확히 한다.
 */
export default function ChatView({
  history,
  isStreaming = false,
  streamingText = '',
  activeTool = null,
  error = null,
  onSend,
  readOnly = false,
  historyIds,
  favoritedMap,
  onSaveFavorite,
  onDeleteFavorite,
  onDeleteHistory,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length, streamingText, activeTool])

  const isEmptyChat = history.length === 0 && !isStreaming && !error

  // history 를 실제 role 기준으로 묶는다. user→assistant 가 이어질 때만 한 쌍으로 묶고,
  // 그 외(스트림 에러 후 남은 orphan user, 연속 user, 단독 assistant 등)는 단독 메시지로
  // 폴백해 각 메시지를 제 role 로 렌더한다. 위치(index 짝/홀)로 묶으면 정합이 깨졌을 때
  // user 가 assistant 버블로 둔갑하므로 role 을 기준으로 삼는다.
  type RenderGroup =
    | { kind: 'pair'; userIdx: number; assistantIdx: number }
    | { kind: 'single'; idx: number }

  const groups: RenderGroup[] = []
  for (let i = 0; i < history.length; ) {
    if (history[i].role === 'user' && history[i + 1]?.role === 'assistant') {
      groups.push({ kind: 'pair', userIdx: i, assistantIdx: i + 1 })
      i += 2
    } else {
      groups.push({ kind: 'single', idx: i })
      i += 1
    }
  }

  return (
    <div className="relative isolate flex h-full flex-col">
      {isEmptyChat && <AuraBackground animated />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {isEmptyChat && (
            <StateMessage variant="empty">
              {readOnly
                ? '저장된 대화가 없습니다.'
                : '메시지를 입력해 레시피 대화를 시작해 보세요.'}
            </StateMessage>
          )}

          {groups.map((group) => {
            // 단독 메시지(orphan): 짝이 없어 즐겨찾기·삭제 대상이 아니다 — 제 role 로만 렌더.
            if (group.kind === 'single') {
              const msg = history[group.idx]
              return (
                <ChatBubble
                  key={`single-${group.idx}-${msg.role}`}
                  role={msg.role}
                  content={msg.content}
                />
              )
            }

            const userMsg = history[group.userIdx]
            const assistantMsg = history[group.assistantIdx]

            // 쌍 삭제: historyIds 에서 assistant 인덱스의 history_id 를 찾아 바인딩.
            // 삭제 컨트롤은 assistant 푸터에서 즐겨찾기 버튼과 나란히 노출한다.
            const historyId = historyIds?.[group.assistantIdx]
            const deleteControl =
              historyId != null && onDeleteHistory ? (
                <DeleteHistoryControl onDeleteHistory={() => onDeleteHistory(historyId)} />
              ) : undefined

            // 즐겨찾기 저장/해제: 레시피 응답(favoritable intent) + history_id 확정 시에만.
            const saveHandler =
              onSaveFavorite && isFavoritableIntent(assistantMsg.intent) && historyId != null
                ? () =>
                    onSaveFavorite({
                      user_message: userMsg.content,
                      recipe_reply: assistantMsg.content,
                      intent: assistantMsg.intent ?? 'OFF_TOPIC',
                      history_id: historyId,
                    })
                : undefined

            const initialFavoriteId =
              historyId != null ? favoritedMap?.get(historyId)?.favorite_id : undefined

            // 안정적인 React key: history_id 가 있으면 그걸 쓰고, 없으면 userIdx 폴백
            const pairKey = historyId != null ? `pair-hist-${historyId}` : `pair-idx-${group.userIdx}`

            return (
              <ChatPairGroup
                key={pairKey}
                userBubble={<ChatBubble role="user" content={userMsg.content} />}
                assistantBubble={
                  <ChatBubble
                    role="assistant"
                    content={assistantMsg.content}
                    initialFavoriteId={initialFavoriteId}
                    onSaveFavorite={saveHandler}
                    onDeleteFavorite={onDeleteFavorite}
                    footerAction={deleteControl}
                  />
                }
              />
            )
          })}

          {/* 스트리밍 중 임시 assistant 버블 (텍스트가 들어오기 시작하면 표시) */}
          {isStreaming && streamingText && (
            <ChatBubble role="assistant" content={streamingText} isStreaming />
          )}

          {/* 텍스트 도착 전 로딩 표시 — send 직후(툴 없음)부터 툴 실행 단계까지 */}
          {isStreaming && !streamingText && <ToolIndicator tool={activeTool} />}

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
