import axios from 'axios'
import { useToastStore } from '@/store/toastStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 전역 에러 핸들러 — 서버 오류(5xx)면 에러 토스트를 띄운다.
 * 4xx(예: 즐겨찾기 400 중복)는 호출부에서 맥락에 맞게 개별 처리하므로 여기서 건드리지 않는다.
 * 항상 에러를 다시 reject 해 각 호출부의 onError/try-catch 가 그대로 동작하게 한다.
 */
export function handleApiError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status !== undefined && status >= 500) {
      useToastStore.getState().addToast({
        variant: 'error',
        message: '서버에 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
      })
    }
  }
  return Promise.reject(error)
}

// 모든 axios 응답의 5xx 를 전역 토스트로 안내(프로덕션·개발 공통). 결정: .claude/decisions/20260606-toast-and-error-handling.md
client.interceptors.response.use((response) => response, handleApiError)

// DEV 전용 — 모든 axios 요청/응답/에러를 콘솔에 찍어 백엔드 연동을 눈으로 확인한다.
// 프로덕션 빌드에선 이 블록이 트리셰이킹된다(import.meta.env.DEV === false).
if (import.meta.env.DEV) {
  client.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase()
    console.log(`[api] → ${method} ${config.url}`, {
      params: config.params,
      data: config.data,
    })
    return config
  })

  client.interceptors.response.use(
    (response) => {
      const method = response.config.method?.toUpperCase()
      console.log(
        `[api] ← ${response.status} ${method} ${response.config.url}`,
        response.data,
      )
      return response
    },
    (error) => {
      const config = error.config ?? {}
      const method = config.method?.toUpperCase()
      console.error(
        `[api] ✕ ${error.response?.status ?? 'ERR'} ${method} ${config.url}`,
        error.response?.data ?? error.message,
      )
      return Promise.reject(error)
    },
  )
}

export default client
