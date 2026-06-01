import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
