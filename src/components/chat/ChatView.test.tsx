import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

describe('ChatView — readOnly', () => {
  it('readOnly 면 입력창 대신 읽기 전용 안내를 보여준다 (happy)', () => {
    render(<ChatView history={history} readOnly />)
    expect(screen.queryByLabelText('메시지 입력')).not.toBeInTheDocument()
    expect(screen.getByText(/읽기 전용/)).toBeInTheDocument()
  })

  it('readOnly 가 아니면 입력창을 렌더한다 (edge)', () => {
    render(<ChatView history={history} onSend={() => {}} />)
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

  it('intent 가 favoritable 이어도 history_id 가 없으면 버튼을 노출하지 않는다 (가드: POST 누락 차단)', () => {
    render(
      <ChatView history={turn('SPECIFIC_FOOD')} onSend={() => {}} onSaveFavorite={async () => 1} />,
    )
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
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
        readOnly
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

  it('readOnly 빈 세션은 저장된 대화 없음 안내를 보여준다 (edge)', () => {
    render(<ChatView history={[]} readOnly />)
    expect(screen.getByText(/저장된 대화가 없습니다/)).toBeInTheDocument()
  })

  it('스트리밍 중이면 빈 안내를 보여주지 않는다 (edge)', () => {
    render(<ChatView history={[]} isStreaming streamingText="## 떡" onSend={() => {}} />)
    expect(screen.queryByText(/레시피 대화를 시작/)).not.toBeInTheDocument()
  })
})
