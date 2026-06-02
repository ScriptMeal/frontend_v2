import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore, getInitialSidebarOpen } from './uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ isSidebarOpen: false })
  })

  it('toggleSidebar 는 열림/닫힘을 뒤집는다 (happy)', () => {
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })

  it('setSidebarOpen 은 값을 그대로 설정한다 (happy)', () => {
    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
    useUIStore.getState().setSidebarOpen(false)
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })
})

describe('getInitialSidebarOpen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('데스크톱(lg+)이면 true (happy)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(getInitialSidebarOpen()).toBe(true)
  })

  it('모바일이면 false (happy)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    expect(getInitialSidebarOpen()).toBe(false)
  })

  it('matchMedia 미지원 환경이면 false (edge)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(getInitialSidebarOpen()).toBe(false)
  })
})
