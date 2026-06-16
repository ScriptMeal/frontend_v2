import { useEffect, type ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useClearSessionsShortcut } from '@/hooks/useClearSessionsShortcut'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  // Ctrl+Alt+R — 세션 데이터 빠른 초기화(시연용)
  useClearSessionsShortcut()

  // 모바일 오버레이 사이드바: ESC 로 닫기 (키보드 접근성)
  useEffect(() => {
    if (!isSidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSidebarOpen, setSidebarOpen])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* 모바일 백드롭 — 오버레이 열림 시에만(데스크톱은 인-플로우라 불필요) */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 cursor-pointer bg-black/20 lg:hidden"
        />
      )}

      {/* 사이드바: 데스크톱 인-플로우(접으면 width 0) / 모바일 오버레이(fixed + slide) */}
      <aside
        className={cn(
          // Tailwind v4 는 translate 유틸을 CSS translate 속성으로 컴파일하므로 transition 에 translate 를 포함한다.
          // (transform 만 두면 모바일 드로어 슬라이드가 transition 되지 않아 점프한다 — iOS)
          'fixed inset-y-0 left-0 z-40 w-[260px] overflow-hidden transition-[translate,width] duration-200 ease-out lg:static lg:z-auto lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0 lg:w-[260px]' : '-translate-x-full lg:w-0',
        )}
      >
        <Sidebar />
      </aside>

      {/* 접힘 시 콘텐츠 위에 떠있는 열기 버튼 (화면 크기 무관) */}
      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="사이드바 열기"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-20 bg-background shadow-lift"
        >
          <PanelLeft />
        </Button>
      )}

      {/* 콘텐츠 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
