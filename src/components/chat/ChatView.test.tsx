import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatView from './ChatView'
import type { Message } from '@/types'

const history: Message[] = [
  { role: 'user', content: '떡볶이' },
  { role: 'assistant', content: '## 떡볶이' },
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
    { role: 'user', content: '떡볶이' },
    { role: 'assistant', content: '## 떡볶이', intent },
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
