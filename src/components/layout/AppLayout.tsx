import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* 모바일 백드롭 — 사이드바 열림 시에만, 데스크톱에선 숨김 */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        />
      )}

      {/* 사이드바: 데스크톱 고정(static) / 모바일 오버레이(fixed + slide) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar />
      </aside>

      {/* 콘텐츠 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단바 (데스크톱에선 사이드바가 항상 보이므로 숨김) */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="사이드바 열기"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
          <span className="text-base font-semibold tracking-tight">ScriptMeal</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
