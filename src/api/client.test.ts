import { describe, it, expect, beforeEach } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { handleApiError } from './client'
import { useToastStore } from '@/store/toastStore'

function axiosErrorWithStatus(status: number): AxiosError {
  return new AxiosError('err', 'CODE', undefined, undefined, { status } as AxiosResponse)
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('handleApiError — 전역 5xx 토스트', () => {
  it('5xx 응답이면 에러 토스트를 띄운다 (happy)', async () => {
    await expect(handleApiError(axiosErrorWithStatus(500))).rejects.toBeInstanceOf(AxiosError)

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].variant).toBe('error')
  })

  it('4xx 응답이면 전역 토스트를 띄우지 않는다 — 400 등은 개별 처리 (edge)', async () => {
    await expect(handleApiError(axiosErrorWithStatus(400))).rejects.toBeTruthy()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('항상 에러를 다시 reject 해 호출부가 처리하게 한다 (error)', async () => {
    const err = axiosErrorWithStatus(503)
    await expect(handleApiError(err)).rejects.toBe(err)
  })
})
