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
