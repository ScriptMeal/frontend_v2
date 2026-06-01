import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

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
