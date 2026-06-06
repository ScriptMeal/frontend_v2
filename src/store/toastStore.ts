import { create } from 'zustand'
import { generateUUID } from '@/lib/utils'

export type ToastVariant = 'error' | 'info' | 'success'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
  /** 자동 dismiss 까지의 시간(ms). Toaster 가 이 값으로 타이머를 건다. */
  duration: number
}

interface ToastInput {
  variant: ToastVariant
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  /** 토스트를 추가하고 id 를 반환한다. 동일 variant·message 가 이미 있으면 적재하지 않고 기존 id 를 반환한다. */
  addToast: (input: ToastInput) => string
  removeToast: (id: string) => void
}

const DEFAULT_DURATION = 4000

/**
 * 전역 토스트 큐. React 밖(axios 인터셉터 등)에서도 `useToastStore.getState().addToast(...)` 로 호출한다.
 * 자동 dismiss 타이밍은 Toaster 컴포넌트가 토스트별 타이머로 처리한다(스토어는 순수 상태만 소유).
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: ({ variant, message, duration = DEFAULT_DURATION }) => {
    // 같은 variant·message 가 이미 떠 있으면 중복 적재하지 않는다(반복 5xx 스팸 방지).
    const existing = get().toasts.find((t) => t.variant === variant && t.message === message)
    if (existing) return existing.id

    const id = generateUUID()
    set((state) => ({ toasts: [...state.toasts, { id, variant, message, duration }] }))
    return id
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
