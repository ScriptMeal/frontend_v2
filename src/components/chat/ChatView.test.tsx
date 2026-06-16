import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatView from './ChatView'
import type { Message } from '@/types'

let _id = 0
function msg(override: Omit<Message, 'clientId'>): Message {
  return { ...override, clientId: `test-${++_id}` }
}

const history: Message[] = [
  msg({ role: 'user', content: '떡볶이' }),
  msg({ role: 'assistant', content: '## 떡볶이' }),
]

describe('ChatView — 입력창 상시 노출 (이어쓰기 통일)', () => {
  it('과거 대화(history 가 있어도) 항상 입력창을 렌더한다 — 읽기 전용 분기 폐지 (happy)', () => {
    render(<ChatView history={history} onSend={() => {}} />)
    expect(screen.getByLabelText('메시지 입력')).toBeInTheDocument()
    expect(screen.queryByText(/읽기 전용/)).not.toBeInTheDocument()
  })

  it('빈 세션에서도 입력창을 렌더한다 (edge)', () => {
    render(<ChatView history={[]} onSend={() => {}} />)
    expect(screen.getByLabelText('메시지 입력')).toBeInTheDocument()
  })
})

describe('ChatView — 즐겨찾기 노출 조건 (intent 게이팅)', () => {
  const turn = (intent: Message['intent']): Message[] => [
    msg({ role: 'user', content: '떡볶이' }),
    msg({ role: 'assistant', content: '## 떡볶이', intent }),
  ]

  it('intent 가 SPECIFIC_FOOD 이고 history_id 가 있으면 즐겨찾기 버튼을 노출한다 (happy)', () => {
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
      />,
    )
    expect(screen.getByRole('button', { name: /즐겨찾기/ })).toBeInTheDocument()
  })

  it('intent 가 GENERAL_RECIPE 이고 history_id 가 있으면 즐겨찾기 버튼을 노출한다 (happy)', () => {
    render(
      <ChatView
        history={turn('GENERAL_RECIPE')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
      />,
    )
    expect(screen.getByRole('button', { name: /즐겨찾기/ })).toBeInTheDocument()
  })

  it('intent 가 favoritable 이면 history_id 가 없어도 즐겨찾기 버튼을 낙관적으로 노출한다 (saveHistory 완료 전 버튼 선노출)', () => {
    render(
      <ChatView history={turn('SPECIFIC_FOOD')} onSend={() => {}} onSaveFavorite={async () => 1} />,
    )
    // historyId 없어도 즉시 노출 — 클릭 시 waitForHistoryId 가 대기
    expect(screen.getByRole('button', { name: /즐겨찾기/ })).toBeInTheDocument()
  })

  it('저장 시 turn 에 history_id 를 포함해 onSaveFavorite 를 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockResolvedValue(1)
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 55 }}
        onSend={() => {}}
        onSaveFavorite={onSaveFavorite}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))

    expect(onSaveFavorite).toHaveBeenCalledWith(expect.objectContaining({ history_id: 55 }))
  })

  it('favoritedMap 에 있는 history_id 는 처음부터 저장됨 상태로 그린다 (happy)', () => {
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 55 }}
        favoritedMap={new Map([[55, { history_id: 55, favorite_id: 99 }]])}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
  })

  it('intent 가 OFF_TOPIC 면 즐겨찾기 버튼을 노출하지 않는다 (edge)', () => {
    render(<ChatView history={turn('OFF_TOPIC')} onSend={() => {}} onSaveFavorite={async () => 1} />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })

  it('intent 가 없으면 즐겨찾기 버튼을 노출하지 않는다 (edge)', () => {
    render(<ChatView history={turn(undefined)} onSend={() => {}} onSaveFavorite={async () => 1} />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })
})

describe('ChatView — 히스토리 삭제', () => {
  it('historyId 가 있고 onDeleteHistory 가 제공되면 그룹 hover 시 삭제 버튼을 노출한다 (happy)', async () => {
    const user = userEvent.setup()
    render(
      <ChatView
        history={history}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    await user.hover(screen.getByRole('group'))
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeInTheDocument()
  })

  it('onDeleteHistory 가 있으면 history_id 가 없어도 삭제 버튼을 낙관적으로 노출한다 (saveHistory 완료 전 버튼 선노출)', async () => {
    const user = userEvent.setup()
    render(
      <ChatView history={history} onSend={() => {}} onDeleteHistory={() => {}} />,
    )
    await user.hover(screen.getByRole('group'))
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeInTheDocument()
  })

  it('onDeleteHistory 가 없으면 삭제 버튼을 노출하지 않는다 (edge)', async () => {
    const user = userEvent.setup()
    render(
      <ChatView
        history={history}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
      />,
    )
    await user.hover(screen.getByRole('group'))
    expect(screen.queryByRole('button', { name: '대화 삭제' })).not.toBeInTheDocument()
  })

  it('삭제 → 확인 두 단계를 거쳐 onDeleteHistory 를 historyId 와 함께 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onDeleteHistory = vi.fn()
    render(
      <ChatView
        history={history}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onDeleteHistory={onDeleteHistory}
      />,
    )
    await user.hover(screen.getByRole('group'))
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(onDeleteHistory).toHaveBeenCalledWith(10)
  })

  it('삭제 확인 후 onDeleteHistory 가 진행 중이면 스피너를 노출한다 (로딩 표시 — void 누락 회귀 차단)', async () => {
    const user = userEvent.setup()
    let resolveDelete!: () => void
    const onDeleteHistory = vi.fn(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )
    render(
      <ChatView
        history={history}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onDeleteHistory={onDeleteHistory}
      />,
    )
    await user.hover(screen.getByRole('group'))
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    await user.click(screen.getByRole('button', { name: '삭제 확인' }))

    // onDeleteHistory 의 promise 가 아직 resolve 되지 않은 동안 스피너가 떠 있어야 한다.
    expect(await screen.findByTestId('delete-spinner')).toBeInTheDocument()
    resolveDelete()
  })
})

describe('ChatView — 같은 쌍 동시 요청 방어 (DELETE history ↔ POST favorite)', () => {
  const turn = (intent: Message['intent']): Message[] => [
    msg({ role: 'user', content: '떡볶이' }),
    msg({ role: 'assistant', content: '## 떡볶이', intent }),
  ]

  it('삭제가 진행 중인 동안에는 같은 쌍의 즐겨찾기 버튼을 비활성화한다 (방어)', async () => {
    const user = userEvent.setup()
    let resolveDelete!: () => void
    const onDeleteHistory = vi.fn(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteHistory={onDeleteHistory}
      />,
    )
    await user.hover(screen.getByRole('group'))
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    await user.click(screen.getByRole('button', { name: '삭제 확인' }))

    // 삭제 요청이 아직 in-flight 인 동안 즐겨찾기 저장이 막혀야 한다(FK 충돌 방지).
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeDisabled()
    resolveDelete()
  })

  it('즐겨찾기 저장이 진행 중인 동안에는 같은 쌍의 삭제 버튼을 비활성화한다 (방어)', async () => {
    const user = userEvent.setup()
    let resolveSave!: (id: number) => void
    const onSaveFavorite = vi.fn(
      () => new Promise<number>((resolve) => { resolveSave = resolve }),
    )
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={onSaveFavorite}
        onDeleteHistory={() => {}}
      />,
    )
    await user.hover(screen.getByRole('group'))
    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))

    // 즐겨찾기 저장이 아직 in-flight 인 동안 삭제 진입이 막혀야 한다.
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeDisabled()
    resolveSave(1)
  })

  it('삭제가 끝나면(lock 해제) 즐겨찾기 버튼이 다시 활성화된다 (edge)', async () => {
    const user = userEvent.setup()
    let resolveDelete!: () => void
    const onDeleteHistory = vi.fn(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteHistory={onDeleteHistory}
      />,
    )
    await user.hover(screen.getByRole('group'))
    await user.click(screen.getByRole('button', { name: '대화 삭제' }))
    await user.click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeDisabled()

    await act(async () => {
      resolveDelete()
    })
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeEnabled()
  })
})

describe('ChatView — role 기준 페어링 (정합 깨짐 방어)', () => {
  it('연속된 user 메시지를 각각 user 버블로 렌더한다 — 위치 기반 묶기로 assistant 둔갑 방지 (regression)', () => {
    // 스트림 에러 후 재전송 등으로 user 가 연달아 쌓인 상황.
    const broken: Message[] = [
      msg({ role: 'user', content: '## 첫질문' }),
      msg({ role: 'user', content: '## 둘째질문' }),
    ]
    render(<ChatView history={broken} onSend={() => {}} />)
    // user 버블은 마크다운을 렌더하지 않는다 — heading 이 생기면 assistant 로 잘못 그려진 것.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('## 둘째질문')).toBeInTheDocument()
  })

  it('마지막 user 메시지가 짝이 없어도(스트리밍 직전) 단독 user 버블로 렌더하고 삭제 대상에서 제외한다 (edge)', () => {
    const odd: Message[] = [
      msg({ role: 'user', content: '질문1' }),
      msg({ role: 'assistant', content: '## 답변1' }),
      msg({ role: 'user', content: '질문2' }),
    ]
    render(
      <ChatView
        history={odd}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    expect(screen.getByText('질문2')).toBeInTheDocument()
    // 완성된 쌍(질문1+답변1) 하나만 그룹으로 묶인다 — orphan user 는 단독 버블.
    expect(screen.getAllByRole('group')).toHaveLength(1)
  })
})

describe('ChatView — 빈 상태', () => {
  it('history 가 비고 스트리밍/에러가 없으면 시작 안내를 보여준다 (happy)', () => {
    render(<ChatView history={[]} onSend={() => {}} />)
    expect(screen.getByText(/레시피 대화를 시작/)).toBeInTheDocument()
  })

  it('스트리밍 중이면 빈 안내를 보여주지 않는다 (edge)', () => {
    render(<ChatView history={[]} isStreaming streamingText="## 떡" onSend={() => {}} />)
    expect(screen.queryByText(/레시피 대화를 시작/)).not.toBeInTheDocument()
  })
})

describe('ChatView — 모바일 컨텍스트 메뉴 (coarse 포인터)', () => {
  const turn = (intent: Message['intent']): Message[] => [
    msg({ role: 'user', content: '떡볶이' }),
    msg({ role: 'assistant', content: '## 떡볶이', intent }),
  ]

  // coarse 포인터 환경을 흉내낸다(jsdom 은 matchMedia 미구현).
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(pointer: coarse)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
  })
  afterEach(() => {
    // @ts-expect-error 테스트 격리
    delete window.matchMedia
    vi.useRealTimers()
  })

  it('모바일에선 하단 즐겨찾기 버튼을 숨긴다 (happy)', () => {
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })

  it('저장된 턴은 저장 인디케이터를 보인다 (happy)', () => {
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        favoritedMap={new Map([[10, { history_id: 10, favorite_id: 99 }]])}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    expect(screen.getByTestId('saved-indicator')).toBeInTheDocument()
  })

  it('길게 누르면 즐겨찾기·삭제 컨텍스트 메뉴가 열린다 (happy)', () => {
    vi.useFakeTimers()
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    const group = screen.getByRole('group')
    fireEvent.pointerDown(group, { pointerType: 'touch', clientX: 0, clientY: 0 })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '즐겨찾기' })).toBeInTheDocument()
  })

  it('손을 떼면(짧게 탭) 메뉴가 열리지 않는다 (edge)', () => {
    vi.useFakeTimers()
    render(
      <ChatView
        history={turn('SPECIFIC_FOOD')}
        historyIds={{ 1: 10 }}
        onSend={() => {}}
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
        onDeleteHistory={() => {}}
      />,
    )
    const group = screen.getByRole('group')
    fireEvent.pointerDown(group, { pointerType: 'touch', clientX: 0, clientY: 0 })
    fireEvent.pointerUp(group)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.queryByRole('button', { name: '삭제하기' })).not.toBeInTheDocument()
  })
})
