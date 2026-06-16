import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { streamChat } from './chat'
import type { StreamEvent } from '@/types'

function sseResponse(payload: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(payload))
      controller.close()
    },
  })
  return { ok: true, status: 200, body: stream } as unknown as Response
}

async function collect(req: Parameters<typeof streamChat>[0]): Promise<StreamEvent[]> {
  const events: StreamEvent[] = []
  for await (const e of streamChat(req)) events.push(e)
  return events
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('streamChat', () => {
  it('tool_start / chunk / done 이벤트를 순서대로 파싱한다 (happy)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseResponse(
        'data: {"type":"tool_start","tool":"get_diet_products"}\n' +
          'data: {"type":"chunk","value":"## 떡볶이"}\n' +
          'data: {"type":"done","value":"구매정보"}\n',
      ),
    )

    const events = await collect({ message: '떡볶이', history: [] })

    expect(events).toEqual([
      { type: 'tool_start', tool: 'get_diet_products' },
      { type: 'chunk', value: '## 떡볶이' },
      { type: 'done', value: '구매정보' },
    ])
  })

  it('요청 본문에 message·history 만 담고 session_id 는 보내지 않는다', async () => {
    vi.mocked(fetch).mockResolvedValue(sseResponse('data: {"type":"done","value":""}\n'))

    await collect({ message: '안녕', history: [{ role: 'user', content: '안녕' }] })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toEqual({ message: '안녕', history: [{ role: 'user', content: '안녕' }] })
    expect(body).not.toHaveProperty('session_id')
  })

  it('깨진 JSON 라인은 건너뛴다 (edge)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseResponse('data: {broken\n' + 'data: {"type":"chunk","value":"ok"}\n'),
    )

    const events = await collect({ message: 'x', history: [] })
    expect(events).toEqual([{ type: 'chunk', value: 'ok' }])
  })

  it('마지막 이벤트가 trailing 개행 없이 끝나도 flush 한다 (edge)', async () => {
    // done 이벤트가 \n 없이 종료 — 루프 종료 후 남은 버퍼를 파싱해야 유실되지 않는다.
    vi.mocked(fetch).mockResolvedValue(
      sseResponse(
        'data: {"type":"chunk","value":"## 떡볶이"}\n' +
          'data: {"type":"done","value":"구매정보"}',
      ),
    )

    const events = await collect({ message: 'x', history: [] })
    expect(events).toEqual([
      { type: 'chunk', value: '## 떡볶이' },
      { type: 'done', value: '구매정보' },
    ])
  })

  it('응답 본문이 없으면 예외를 던진다 (error)', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, body: null } as unknown as Response)
    await expect(collect({ message: 'x', history: [] })).rejects.toThrow()
  })

  it('HTTP 에러(4xx/5xx)면 본문이 있어도 예외를 던진다 (error)', async () => {
    // 에러 응답도 본문(에러 HTML/JSON)은 존재하므로 body 가드만으론 통과한다.
    const res = sseResponse('{"detail":"internal error"}')
    vi.mocked(fetch).mockResolvedValue({ ...res, ok: false, status: 500 } as unknown as Response)
    await expect(collect({ message: 'x', history: [] })).rejects.toThrow(
      '답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    )
  })
})
