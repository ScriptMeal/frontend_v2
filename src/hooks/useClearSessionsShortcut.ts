import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/sessionStore'

/**
 * Ctrl+Alt+R — 영속된 세션 데이터를 즉시 비우고 홈으로 이동한다(시연용 빠른 초기화).
 * 브라우저 강제 새로고침(Ctrl+Shift+R)과 충돌을 피하려 Alt 조합을 쓴다.
 * 물리 키(code: 'KeyR') 기준이라 키보드 레이아웃과 무관하다.
 */
export function useClearSessionsShortcut() {
  const navigate = useNavigate()
  const clearSessions = useSessionStore((s) => s.clearSessions)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.code === 'KeyR') {
        e.preventDefault()
        clearSessions()
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, clearSessions])
}
