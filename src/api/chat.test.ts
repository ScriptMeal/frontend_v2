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
  return { body: stream } as unknown as Response
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

  it('응답 본문이 없으면 예외를 던진다 (error)', async () => {
    vi.mocked(fetch).mockResolvedValue({ body: null } as unknown as Response)
    await expect(collect({ message: 'x', history: [] })).rejects.toThrow()
  })
})
