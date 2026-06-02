import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

/**
 * 초기 사이드바 노출 여부 — 데스크톱(lg, 1024px+)은 열림, 모바일은 닫힘.
 * matchMedia 미지원(SSR·테스트) 환경은 안전하게 false.
 */
export function getInitialSidebarOpen(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: getInitialSidebarOpen(),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
