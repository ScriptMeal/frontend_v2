import { useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface Props {
  /** 길게 누른 세션 항목의 화면 좌표(getBoundingClientRect). 메뉴를 그 아래에 띄운다. */
  rect: DOMRect
  onDelete: () => void
  onClose: () => void
}

const MENU_W = 192 // w-48
const MENU_H = 52
const PAD = 12
const GAP = 4

/**
 * 모바일 롱프레스 컨텍스트 메뉴(세션 전용) — 누른 항목 아래에 "삭제하기"를 띄운다.
 * 배경을 dim+blur 로 가리고, 백드롭 클릭·Esc 로 닫는다.
 * (오버레이 idiom 은 ChatPairContextMenu 와 동일 — fixed inset-0 + 백드롭/Esc)
 */
export default function SessionContextMenu({ rect, onDelete, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 항목 아래에 메뉴를 두되, 화면을 넘치면 위/안쪽으로 당겨 항상 보이고 눌리게 한다.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(rect.left, PAD), Math.max(PAD, vw - PAD - MENU_W))
  const top = Math.min(rect.bottom + GAP, Math.max(PAD, vh - PAD - MENU_H))

  // 동적 좌표는 CSS 변수로 주입한다(CLAUDE.md — 인라인 정적 style 금지, 동적 값은 CSS 변수).
  const vars = { '--menu-left': `${left}px`, '--menu-top': `${top}px` } as CSSProperties

  // 변형된 조상(모바일 슬라이드 사이드바)에서 fixed 가 갇히지 않도록 body 로 포털한다.
  // rect 는 뷰포트 좌표라, 포털해야 메뉴가 누른 항목 위치에 정확히 뜬다.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50"
      style={vars}
    >
      <button
        type="button"
        aria-label="메뉴 닫기"
        data-testid="session-menu-backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-[1px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        role="menu"
        className="fixed left-[var(--menu-left)] top-[var(--menu-top)] w-48 overflow-hidden rounded-xl border border-hairline bg-surface text-sm shadow-float"
      >
        <button
          type="button"
          onClick={onDelete}
          aria-label="삭제하기"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-destructive hover:bg-secondary"
        >
          삭제하기
          <Trash2 className="size-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
