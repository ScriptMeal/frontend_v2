import { useSessionStore } from '@/store/sessionStore'

export function useSession() {
  const { currentSessionId, sessions, startNewSession, switchSession, addSession } =
    useSessionStore()

  return { currentSessionId, sessions, startNewSession, switchSession, addSession }
}
