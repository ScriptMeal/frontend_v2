import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, MessageSquare, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessions = useSessionStore((s) => s.sessions)
  const startNewSession = useSessionStore((s) => s.startNewSession)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  const handleNewChat = () => {
    startNewSession()
    navigate('/home')
  }

  // 세션 진입은 라우팅으로만 처리한다 — 진입 후 ChatPage 가 그 세션을 서버에서 하이드레이션한다.
  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`)
  }

  return (
    <div className="flex h-full flex-col border-r border-hairline bg-sidebar">
      {/* 브랜드 + 접기 */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="text-base font-semibold tracking-tight text-foreground">
          LARA
        </span>
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
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                        isActive && 'bg-secondary',
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{session.preview ?? '새 대화'}</span>
                    </button>
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
    </div>
  )
}
