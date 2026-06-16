import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, MessageSquare, PanelLeftClose, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmModal from '@/components/common/ConfirmModal'
import SessionContextMenu from '@/components/layout/SessionContextMenu'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'
import type { Session } from '@/types'

/**
 * 사이드바 세션 항목 한 줄.
 * - 탭/클릭: 해당 세션으로 이동.
 * - 데스크톱: hover 시 우측에 삭제 버튼. 삭제 중엔 같은 자리에 스피너.
 * - 모바일(coarse): 길게 누르면 컨텍스트 메뉴(롱프레스는 훅이라 항목마다 이 컴포넌트로 감싼다).
 */
function SessionItem({
  session,
  isActive,
  coarse,
  deleting,
  onSelect,
  onRequestDelete,
  onLongPress,
}: {
  session: Session
  isActive: boolean
  coarse: boolean
  deleting: boolean
  onSelect: (id: string) => void
  onRequestDelete: (session: Session) => void
  onLongPress: (session: Session, rect: DOMRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // 롱프레스가 발화하면 뒤따르는 click(탭)을 한 번 무시해 메뉴와 이동이 겹치지 않게 한다.
  const suppressClick = useRef(false)

  const handlers = useLongPress(
    () => {
      if (!ref.current) return
      suppressClick.current = true
      onLongPress(session, ref.current.getBoundingClientRect())
    },
    { enabled: coarse },
  )

  return (
    <div
      ref={ref}
      data-testid="session-item"
      className={cn(
        'group relative flex items-center',
        coarse && 'select-none [-webkit-touch-callout:none]',
      )}
      {...handlers}
    >
      <button
        type="button"
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false
            return
          }
          onSelect(session.id)
        }}
        aria-current={isActive ? 'true' : undefined}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 pr-9 text-left text-sm text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
          isActive && 'bg-secondary',
        )}
      >
        <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{session.preview ?? '새 대화'}</span>
      </button>

      {/* 삭제 버튼/스피너 — 데스크톱은 hover 시 노출, 삭제 중엔 같은 자리에 스피너.
          모바일은 롱프레스 메뉴로 삭제하므로 hover 버튼은 숨기고 스피너만 공유한다. */}
      {deleting ? (
        <span className="absolute right-2 flex size-6 items-center justify-center text-muted-foreground">
          <Loader2
            data-testid="session-delete-spinner"
            className="action-spinner size-4 animate-spin"
          />
        </span>
      ) : (
        !coarse && (
          <button
            type="button"
            onClick={() => onRequestDelete(session)}
            aria-label="대화 삭제"
            className="absolute right-2 flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Trash2 className="size-4" />
          </button>
        )
      )}
    </div>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessions = useSessionStore((s) => s.sessions)
  const startNewSession = useSessionStore((s) => s.startNewSession)
  const removeSession = useSessionStore((s) => s.removeSession)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const coarse = useCoarsePointer()

  // 삭제 확인 대상(모달), 모바일 컨텍스트 메뉴 대상, 삭제 진행 중 세션 id
  const [confirmTarget, setConfirmTarget] = useState<Session | null>(null)
  const [menuTarget, setMenuTarget] = useState<{ session: Session; rect: DOMRect } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNewChat = () => {
    startNewSession()
    navigate('/home')
  }

  // 세션 진입은 라우팅으로만 처리한다 — 진입 후 ChatPage 가 그 세션을 서버에서 하이드레이션한다.
  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`)
  }

  // 확인 후 삭제 — 로컬 한정(sessions·favoriteSessionIds·localStorage). 항상 /home 으로 보낸다.
  // 로딩이 걸릴 경우 그 사이 해당 항목에 스피너가 보이도록 deletingId 를 await 경계 앞뒤로 관리한다.
  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    const id = confirmTarget.id
    setConfirmTarget(null)
    setDeletingId(id)
    try {
      await Promise.resolve(removeSession(id))
      navigate('/home')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-hairline bg-sidebar">
      {/* 브랜드 + 접기 */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="cursor-pointer rounded-sm text-base font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          LARA
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="사이드바 접기"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelLeftClose />
        </Button>
      </div>

      {/* 새 대화 */}
      <div className="px-3 pb-2">
        <Button className="w-full justify-start" onClick={handleNewChat}>
          <Plus />
          새 대화
        </Button>
      </div>

      {/* 세션 목록 */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
        aria-label="대화 기록"
      >
        {sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            대화 기록이 없습니다
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {/* 최근 활동 순 재배치를 layout 애니메이션으로 부드럽게 흘린다.
                새 메시지로 세션이 맨 위로 오면 위치 이동이, 새 세션은 페이드-인이 적용된다.
                initial={false} 로 첫 렌더(목록 복원)에는 등장 애니메이션을 생략한다.
                prefers-reduced-motion 은 App 의 MotionConfig(reducedMotion="user")가 전역 처리. */}
            <AnimatePresence initial={false}>
              {sessions.map((session) => {
                const isActive = location.pathname === `/chat/${session.id}`
                return (
                  <motion.li
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <SessionItem
                      session={session}
                      isActive={isActive}
                      coarse={coarse}
                      deleting={deletingId === session.id}
                      onSelect={handleSelectSession}
                      onRequestDelete={setConfirmTarget}
                      onLongPress={(s, rect) => setMenuTarget({ session: s, rect })}
                    />
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </nav>

      {/* 즐겨찾기 진입 */}
      <div className="shrink-0 border-t border-hairline p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate('/favorites')}
        >
          <Star />
          즐겨찾기
        </Button>
      </div>

      {/* 모바일 롱프레스 컨텍스트 메뉴 */}
      <AnimatePresence>
        {menuTarget && (
          <SessionContextMenu
            rect={menuTarget.rect}
            onDelete={() => {
              setConfirmTarget(menuTarget.session)
              setMenuTarget(null)
            }}
            onClose={() => setMenuTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 (PC·모바일 공통) */}
      <AnimatePresence>
        {confirmTarget && (
          <ConfirmModal
            message={'대화를 삭제하면 기존 대화 내용이 모두 사라집니다.\n정말 삭제하시겠습니까?'}
            confirmLabel="예"
            cancelLabel="취소"
            onConfirm={handleConfirmDelete}
            onClose={() => setConfirmTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
