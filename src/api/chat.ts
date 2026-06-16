import type { ChatRequest, StreamEvent } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// 스트림 실패 시 배너에 노출되는 사용자용 문구.
// non-2xx·빈 body 모두 사용자가 취할 행동(재시도)이 같으므로 같은 문구로 통일하고,
// 실제 status 등 기술 정보는 DEV log 로만 남긴다.
export const STREAM_ERROR_MESSAGE = '답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

// DEV 전용 — fetch 기반 SSE 라 axios 인터셉터(client.ts)가 닿지 않으므로 여기서 직접 찍는다.
// 프로덕션 빌드에선 호출이 트리셰이킹된다(import.meta.env.DEV === false).
const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log('[chat]', ...args)
}

// 단일 SSE 라인을 파싱해 이벤트로 방출한다. 읽기 루프와 종료 후 flush 가
// 동일 경로를 타도록 추출 — 한쪽만 바뀌어 동작이 갈리는 걸 막는다.
function* parseLine(line: string): Generator<StreamEvent> {
  if (!line.startsWith('data: ')) return
  const raw = line.slice(6).trim()
  if (!raw) return
  try {
    const event = JSON.parse(raw) as StreamEvent
    log(`event: ${event.type}`, event)
    yield event
  } catch {
    // malformed chunk — skip
    log('깨진 SSE 라인 건너뜀:', raw)
  }
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
  // 4xx/5xx 응답도 본문(에러 HTML/JSON)은 존재해 body 가드만으론 통과한다.
  // 상태 코드를 먼저 검사해 예외를 던져야 useStream 의 catch 가 에러 배너를 띄운다.
  if (!response.ok) {
    log(`stream failed: ${response.status}`)
    throw new Error(STREAM_ERROR_MESSAGE)
  }
  if (!response.body) throw new Error(STREAM_ERROR_MESSAGE)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) yield* parseLine(line)
  }

  // 루프는 done 에서 처리 없이 break 하므로, 마지막 청크가 trailing \n 없이
  // 종료되면 그 이벤트가 buffer 에 갇힌다. flush 로 디코더에 보류된 멀티바이트(한글)를
  // 마저 합친 뒤 남은 라인을 한 번 더 파싱해 유실을 막는다.
  buffer += decoder.decode()
  yield* parseLine(buffer)

  log('스트림 종료')
}
