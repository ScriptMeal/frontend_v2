import type { ChatRequest, StreamEvent } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// DEV 전용 — fetch 기반 SSE 라 axios 인터셉터(client.ts)가 닿지 않으므로 여기서 직접 찍는다.
// 프로덕션 빌드에선 호출이 트리셰이킹된다(import.meta.env.DEV === false).
const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log('[chat]', ...args)
}

export async function* streamChat(
  request: ChatRequest,
): AsyncGenerator<StreamEvent> {
  log('→ POST /api/chat/stream', request)
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  log(`← ${response.status} ${response.statusText}`)
  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try {
        const event = JSON.parse(raw) as StreamEvent
        log(`event: ${event.type}`, event)
        yield event
      } catch {
        // malformed chunk — skip
        log('깨진 SSE 라인 건너뜀:', raw)
      }
    }
  }

  log('스트림 종료')
}
