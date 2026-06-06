import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from './toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('toastStore', () => {
  it('addToast 는 토스트를 추가하고 생성된 id 를 반환한다 (happy)', () => {
    const id = useToastStore.getState().addToast({ variant: 'error', message: '오류' })

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ id, variant: 'error', message: '오류' })
    expect(toasts[0].duration).toBeGreaterThan(0)
  })

  it('removeToast 는 해당 id 만 제거하고 없는 id 는 무시한다 (edge)', () => {
    const a = useToastStore.getState().addToast({ variant: 'info', message: 'A' })
    const b = useToastStore.getState().addToast({ variant: 'info', message: 'B' })

    useToastStore.getState().removeToast(a)
    useToastStore.getState().removeToast('does-not-exist')

    const { toasts } = useToastStore.getState()
    expect(toasts.map((t) => t.id)).toEqual([b])
  })

  it('같은 variant·message 토스트는 중복 적재하지 않는다 — 반복 5xx 스팸 방지 (edge)', () => {
    const first = useToastStore.getState().addToast({ variant: 'error', message: '서버 오류' })
    const second = useToastStore.getState().addToast({ variant: 'error', message: '서버 오류' })

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(second).toBe(first)
  })
})
