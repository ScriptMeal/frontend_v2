import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import ChatPairGroup from '@/components/chat/ChatPairGroup'
import ChatPairContextMenu from '@/components/chat/ChatPairContextMenu'
import DeleteHistoryControl from '@/components/chat/DeleteHistoryControl'
import ToolIndicator from '@/components/chat/ToolIndicator'
import StateMessage from '@/components/common/StateMessage'
import AuraBackground from '@/components/common/AuraBackground'
import { isFavoritableIntent } from '@/lib/intent'
import { waitForHistoryId } from '@/lib/waitForHistoryId'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { useLongPress } from '@/hooks/useLongPress'
import type { Intent, Message } from '@/types'

/**
 * 터치에서 자식(대화 쌍)을 길게 누르면 rect 를 측정해 onTrigger 로 넘기는 래퍼.
 * useLongPress 가 훅이라 목록 map 안에서 직접 호출할 수 없어, 쌍마다 이 컴포넌트로 감싼다.
 */
function PairLongPress({
  enabled,
  onTrigger,
  children,
}: {
  enabled: boolean
  onTrigger: (rect: DOMRect) => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handlers = useLongPress(() => {
    if (ref.current) onTrigger(ref.current.getBoundingClientRect())
  }, { enabled })
  return (
    <div ref={ref} className={enabled ? 'select-none [-webkit-touch-callout:none]' : undefined} {...handlers}>
      {children}
    </div>
  )
}

/** 롱프레스로 연 컨텍스트 메뉴 대상 — 누른 쌍의 좌표와 페이로드. */
interface ActiveMenu {
  rect: DOMRect
  userContent: string
  assistantContent: string
  intent: Intent
  historyId: number
  canFavorite: boolean
}

/** favoritedMap(서버 스냅샷)을 모바일 즐겨찾기 상태(historyId → favorite_id)로 평탄화한다. */
function seedSaved(
  favoritedMap?: Map<number, { history_id: number; favorite_id: number }>,
): Record<number, number | null> {
  const seed: Record<number, number | null> = {}
  favoritedMap?.forEach((v, hid) => {
    seed[hid] = v.favorite_id
  })
  return seed
}

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

  // 모바일(터치)에선 하단 버튼을 숨기고 롱프레스 컨텍스트 메뉴로 즐겨찾기·삭제를 처리한다.
  const coarse = useCoarsePointer()
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null)

  // 쌍 단위 동작 lock — 같은 대화 쌍(pairKey)에 대해 즐겨찾기 토글과 대화 삭제가 동시에
  // in-flight 되는 것을 막는다. 한쪽이 busy 면 반대편 버튼을 disabled 로 내려 DELETE history 와
  // POST favorite 가 동시에 발사돼 백엔드 FK/트랜잭션 충돌을 일으키는 것을 차단한다(진행 중 동작 우선).
  const [lockedPairs, setLockedPairs] = useState<Record<string, 'favorite' | 'delete'>>({})
  const setPairLock = (key: string, kind: 'favorite' | 'delete', busy: boolean) => {
    setLockedPairs((prev) => {
      if (busy) return { ...prev, [key]: kind }
      // 다른 동작이 점유 중이면 건드리지 않는다(자신이 건 lock 만 해제).
      if (prev[key] !== kind) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // 모바일 즐겨찾기 상태(historyId → favorite_id). 컨텍스트 메뉴와 말풍선 별 표시의 단일 소스.
  // 서버 스냅샷(favoritedMap)으로 시드하고, 메뉴 액션으로 갱신한다(데스크톱 footer 경로와 분리).
  const [mobileSaved, setMobileSaved] = useState<Record<number, number | null>>(() =>
    seedSaved(favoritedMap),
  )
  // favoritedMap 이 바뀌면(세션 전환·즐겨찾기 재조회) 렌더 중 재시드한다.
  // effect 대신 렌더-시점 조정 패턴(prev 를 state 로 추적) — 메뉴 토글로 쌓인 로컬 변경을 새 스냅샷으로 리셋.
  const [seededFrom, setSeededFrom] = useState(favoritedMap)
  if (seededFrom !== favoritedMap) {
    setSeededFrom(favoritedMap)
    setMobileSaved(seedSaved(favoritedMap))
  }

  const toggleMobileFavorite = async (historyId: number, turn: FavoriteTurn) => {
    const current = mobileSaved[historyId] ?? null
    if (current === null) {
      const id = await onSaveFavorite!(turn)
      setMobileSaved((m) => ({ ...m, [historyId]: id }))
    } else {
      await onDeleteFavorite?.(current)
      setMobileSaved((m) => ({ ...m, [historyId]: null }))
    }
  }

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
              메시지를 입력해 레시피 대화를 시작해 보세요.
            </StateMessage>
          )}

          {groups.map((group) => {
            // 단독 메시지(orphan): 짝이 없어 즐겨찾기·삭제 대상이 아니다 — 제 role 로만 렌더.
            if (group.kind === 'single') {
              const msg = history[group.idx]
              return (
                <ChatBubble
                  key={`single-${msg.clientId}`}
                  role={msg.role}
                  content={msg.content}
                />
              )
            }

            const userMsg = history[group.userIdx]
            const assistantMsg = history[group.assistantIdx]

            const historyId = historyIds?.[group.assistantIdx]
            // 버튼은 어시스턴트 버블이 확정되는 즉시 노출한다(낙관적 렌더).
            // historyId 가 아직 없어도 버튼을 보이고, 클릭 시 waitForHistoryId 가 확정까지 대기한다.
            const canFavorite =
              onSaveFavorite != null && isFavoritableIntent(assistantMsg.intent)
            const canDelete = onDeleteHistory != null

            // 안정적인 React key: 메시지 생성 시 고정된 clientId 를 사용한다.
            // history_id 는 saveHistory 이후에 도착하므로 key 에 쓰면 remount 가 발생한다.
            // (.claude/debugging/20260610-streaming-confirm-bubble-remount.md 참고)
            const pairKey = `pair-${userMsg.clientId}`

            // 모바일(터치): 하단 버튼을 숨기고 길게 누르면 컨텍스트 메뉴. 저장 표시는 mobileSaved.
            if (coarse) {
              const saved = historyId != null && mobileSaved[historyId] != null
              return (
                <PairLongPress
                  key={pairKey}
                  enabled={canFavorite || canDelete}
                  onTrigger={(rect) => {
                    if (historyId == null) return
                    setActiveMenu({
                      rect,
                      userContent: userMsg.content,
                      assistantContent: assistantMsg.content,
                      intent: assistantMsg.intent ?? 'OFF_TOPIC',
                      historyId,
                      canFavorite,
                    })
                  }}
                >
                  <ChatPairGroup
                    userBubble={<ChatBubble role="user" content={userMsg.content} />}
                    assistantBubble={
                      <ChatBubble role="assistant" content={assistantMsg.content} saved={saved} />
                    }
                  />
                </PairLongPress>
              )
            }

            // 데스크톱: 기존 hover 푸터(즐겨찾기 버튼 + 삭제 컨트롤) 유지.
            // historyId 가 없으면(saveHistory 완료 전) waitForHistoryId 가 대기 후 API 호출.
            // lock: 같은 쌍의 즐겨찾기가 진행 중이면 삭제를 막고, 삭제가 진행 중이면 즐겨찾기를 막는다.
            const pairLock = lockedPairs[pairKey]
            const deleteControl = onDeleteHistory ? (
              <DeleteHistoryControl
                disabled={pairLock === 'favorite'}
                onBusyChange={(busy) => setPairLock(pairKey, 'delete', busy)}
                onDeleteHistory={async () => {
                  const hId = historyId ?? (await waitForHistoryId(group.assistantIdx))
                  if (hId == null) throw new Error('historyId unavailable')
                  // promise 를 반환해야 DeleteHistoryControl 이 await 하며 스피너를 유지한다.
                  return onDeleteHistory(hId)
                }}
              />
            ) : undefined

            const saveHandler =
              onSaveFavorite && isFavoritableIntent(assistantMsg.intent)
                ? async () => {
                    const hId = historyId ?? (await waitForHistoryId(group.assistantIdx))
                    if (hId == null) throw new Error('historyId unavailable')
                    return onSaveFavorite({
                      user_message: userMsg.content,
                      recipe_reply: assistantMsg.content,
                      intent: assistantMsg.intent ?? 'OFF_TOPIC',
                      history_id: hId,
                    })
                  }
                : undefined

            const initialFavoriteId =
              historyId != null ? favoritedMap?.get(historyId)?.favorite_id : undefined

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
                    favoriteDisabled={pairLock === 'delete'}
                    onBusyChange={(busy) => setPairLock(pairKey, 'favorite', busy)}
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
          <ChatInput onSubmit={onSend ?? (() => {})} disabled={isStreaming} />
        </div>
      </div>

      {/* 모바일 롱프레스 컨텍스트 메뉴 (즐겨찾기·삭제) */}
      <AnimatePresence>
        {activeMenu && (
          <ChatPairContextMenu
            rect={activeMenu.rect}
            userContent={activeMenu.userContent}
            assistantContent={activeMenu.assistantContent}
            saved={mobileSaved[activeMenu.historyId] != null}
            canFavorite={activeMenu.canFavorite}
            canDelete={onDeleteHistory != null}
            onToggleFavorite={() =>
              toggleMobileFavorite(activeMenu.historyId, {
                user_message: activeMenu.userContent,
                recipe_reply: activeMenu.assistantContent,
                intent: activeMenu.intent,
                history_id: activeMenu.historyId,
              })
            }
            onDelete={() => onDeleteHistory?.(activeMenu.historyId)}
            onClose={() => setActiveMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
