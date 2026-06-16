import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Star, Trash2 } from 'lucide-react'
import ChatBubble from '@/components/chat/ChatBubble'
import { cn } from '@/lib/utils'

interface Props {
  /** 길게 누른 쌍의 화면 좌표(getBoundingClientRect). clone 을 같은 자리에 띄운다. */
  rect: DOMRect
  userContent: string
  assistantContent: string
  /** 현재 즐겨찾기 저장 여부 — 메뉴 라벨/별 채움에 쓴다. */
  saved: boolean
  /** 즐겨찾기 가능(favoritable intent + history_id 확정)일 때만 메뉴 노출. */
  canFavorite: boolean
  /** 삭제 가능(history_id + onDeleteHistory 제공)일 때만 메뉴 노출. */
  canDelete: boolean
  /** 즐겨찾기 토글(저장/해제) — saved 기준으로 상위가 분기 처리. */
  onToggleFavorite: () => void | Promise<void>
  /** 대화 쌍 삭제. */
  onDelete: () => void | Promise<void>
  onClose: () => void
}

/**
 * iOS 스타일 롱프레스 컨텍스트 메뉴(모바일 전용).
 * 배경을 dim+blur 로 가리고, 길게 누른 쌍을 같은 자리에 복제해 띄운 뒤
 * 즐겨찾기·삭제 메뉴를 노출한다. 백드롭 클릭·Esc 로 닫는다.
 * (오버레이 idiom 은 FavoriteDetailModal 과 동일 — fixed inset-0 + 백드롭/Esc)
 */
export default function ChatPairContextMenu({
  rect,
  userContent,
  assistantContent,
  saved,
  canFavorite,
  canDelete,
  onToggleFavorite,
  onDelete,
  onClose,
}: Props) {
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleFavorite = async () => {
    if (pending) return
    setPending(true)
    try {
      await onToggleFavorite()
      onClose()
    } catch {
      setPending(false) // 실패 시 메뉴 유지(상위 토스트로 안내)
    }
  }

  const handleDeleteConfirm = async () => {
    if (pending) return
    setPending(true)
    try {
      await onDelete()
      onClose()
    } catch {
      setPending(false)
    }
  }

  // 클론(누른 쌍)과 메뉴를 한 그룹으로 화면 안에 배치한다.
  // 긴 응답은 클론 높이를 줄이고, 그룹이 화면을 넘치면 위로 당겨 메뉴가 항상 보이고 눌리게 한다.
  // (메뉴를 쌍의 원래 bottom 기준으로 잡으면 긴 응답에서 화면 밖으로 밀려 못 누르는 문제를 방지)
  const vw = window.innerWidth
  const vh = window.innerHeight
  const PAD = 12
  const GAP = 8
  const MENU_W = 224 // w-56
  const MENU_H = 150 // 메뉴 높이 예약(삭제 확인 단계 포함 여유)
  const cloneH = Math.max(80, Math.min(rect.height, vh * 0.5, vh - PAD * 2 - GAP - MENU_H))
  // 실제 쌍이 캡보다 길어 잘릴 때만 하단을 페이드아웃한다(짧은 응답은 그냥 깔끔히 보인다).
  const clipped = rect.height > cloneH + 1
  const groupH = cloneH + GAP + MENU_H
  const groupTop = Math.min(Math.max(rect.top, PAD), Math.max(PAD, vh - PAD - groupH))
  const cloneLeft = Math.min(Math.max(rect.left, PAD), Math.max(PAD, vw - PAD - rect.width))
  const menuLeft = Math.min(Math.max(rect.left, PAD), Math.max(PAD, vw - PAD - MENU_W))
  const menuTop = groupTop + cloneH + GAP

  // 동적 좌표는 CSS 변수로 주입한다(CLAUDE.md — 인라인 정적 style 금지, 동적 값은 CSS 변수).
  const vars = {
    '--clone-left': `${cloneLeft}px`,
    '--clone-top': `${groupTop}px`,
    '--clone-width': `${rect.width}px`,
    '--clone-maxh': `${cloneH}px`,
    '--menu-left': `${menuLeft}px`,
    '--menu-top': `${menuTop}px`,
  } as CSSProperties

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50"
      style={vars}
    >
      {/* 배경 dim + blur, 클릭 시 닫기 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        data-testid="context-menu-backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
      />

      {/* 길게 누른 쌍 복제(읽기 전용) — 같은 자리에서 살짝 떠오른다 */}
      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={cn(
          'pointer-events-none fixed left-[var(--clone-left)] top-[var(--clone-top)] w-[var(--clone-width)] max-h-[var(--clone-maxh)] origin-top overflow-hidden',
          // 잘린 하단을 부드럽게 페이드아웃(딱딱한 컷 방지). iOS Safari 위해 -webkit-mask 동반.
          clipped &&
            '[mask-image:linear-gradient(to_bottom,#000_70%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_70%,transparent)]',
        )}
      >
        <div className="flex flex-col gap-1.5">
          <ChatBubble role="user" content={userContent} />
          <ChatBubble role="assistant" content={assistantContent} />
        </div>
      </motion.div>

      {/* 액션 메뉴 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut', delay: 0.03 }}
        className="fixed left-[var(--menu-left)] top-[var(--menu-top)] w-56 overflow-hidden rounded-xl border border-hairline bg-surface text-sm shadow-float"
        role="menu"
      >
        {confirming ? (
          <div className="flex flex-col">
            <p className="px-4 pt-3 pb-2 text-xs text-muted-foreground">질문과 답변이 함께 삭제됩니다</p>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={pending}
              className="flex items-center justify-between gap-3 px-4 py-3 text-left font-medium text-destructive hover:bg-secondary disabled:opacity-60"
            >
              {pending ? '삭제 중…' : '삭제 확인'}
              {pending ? (
                <Loader2
                  data-testid="contextmenu-delete-spinner"
                  className="action-spinner size-4 animate-spin"
                />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="border-t border-hairline px-4 py-3 text-left text-muted-foreground hover:bg-secondary disabled:opacity-60"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {canFavorite && (
              <button
                type="button"
                onClick={handleFavorite}
                disabled={pending}
                aria-label={saved ? '즐겨찾기 해제' : '즐겨찾기'}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary disabled:opacity-60',
                  canDelete && 'border-b border-hairline',
                  saved ? 'text-accent' : 'text-foreground',
                )}
              >
                {saved ? '즐겨찾기 해제' : '즐겨찾기'}
                {pending ? (
                  <Loader2
                    data-testid="contextmenu-favorite-spinner"
                    className="action-spinner size-4 animate-spin"
                  />
                ) : (
                  <Star className={cn('size-4', saved && 'fill-accent')} />
                )}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="삭제하기"
                className="flex items-center justify-between gap-3 px-4 py-3 text-left text-destructive hover:bg-secondary"
              >
                삭제하기
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
