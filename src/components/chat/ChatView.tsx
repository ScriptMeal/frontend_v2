import { useEffect, useRef } from 'react'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import ToolIndicator from '@/components/chat/ToolIndicator'
import StateMessage from '@/components/common/StateMessage'
import AuraBackground from '@/components/common/AuraBackground'
import { isFavoritableIntent } from '@/lib/intent'
import type { Intent, Message } from '@/types'

/** 즐겨찾기할 대화 턴(질문 + 답변 + 의도) */
export interface FavoriteTurn {
  user_message: string
  recipe_reply: string
  intent: Intent
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
  /** assistant 버블에 즐겨찾기 버튼을 노출하고, 저장 시 생성된 favorite id 를 반환한다 */
  onSaveFavorite?: (turn: FavoriteTurn) => Promise<number>
  /** 저장된 즐겨찾기를 id 로 해제(삭제)한다 */
  onDeleteFavorite?: (id: number) => void | Promise<void>
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
  onSaveFavorite,
  onDeleteFavorite,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length, streamingText, activeTool])

  const isEmptyChat = history.length === 0 && !isStreaming && !error

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

          {history.map((message, index) => {
            // assistant 턴의 질문은 직전 user 메시지. 즐겨찾기 payload 구성에 쓴다.
            // 레시피 추천 응답(SPECIFIC_FOOD·GENERAL_RECIPE)만 즐겨찾기 대상.
            const saveHandler =
              onSaveFavorite &&
              message.role === 'assistant' &&
              isFavoritableIntent(message.intent)
                ? () =>
                    onSaveFavorite({
                      user_message: history[index - 1]?.content ?? '',
                      recipe_reply: message.content,
                      intent: message.intent ?? 'OFF_TOPIC',
                    })
                : undefined

            return (
              <ChatBubble
                key={`${message.role}-${index}`}
                role={message.role}
                content={message.content}
                onSaveFavorite={saveHandler}
                onDeleteFavorite={onDeleteFavorite}
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
