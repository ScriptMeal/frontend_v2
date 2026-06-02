import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatBubble from './ChatBubble'

describe('ChatBubble', () => {
  it('user 메시지는 마크다운 파싱 없이 평문으로 렌더한다 (happy)', () => {
    render(<ChatBubble role="user" content="## 그냥 텍스트" />)
    expect(screen.getByText('## 그냥 텍스트')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('assistant 메시지는 마크다운으로 렌더한다 (## → heading, 리스트 → listitem)', () => {
    render(<ChatBubble role="assistant" content={'## 떡볶이\n\n- 곤약\n- 양념'} />)
    expect(screen.getByRole('heading', { level: 2, name: '떡볶이' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('빈 content 도 예외 없이 렌더한다 (edge)', () => {
    const { container } = render(<ChatBubble role="assistant" content="" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('assistant 버블에 onFavorite 가 있으면 즐겨찾기 버튼을 노출하고 클릭 시 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onFavorite = vi.fn()
    render(<ChatBubble role="assistant" content="## 떡볶이" onFavorite={onFavorite} />)

    const button = screen.getByRole('button', { name: /즐겨찾기/ })
    await user.click(button)
    expect(onFavorite).toHaveBeenCalledOnce()
  })

  it('user 버블은 onFavorite 가 있어도 즐겨찾기 버튼을 노출하지 않는다 (edge)', () => {
    render(<ChatBubble role="user" content="질문" onFavorite={() => {}} />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })

  it('onFavorite 가 없으면 버튼을 노출하지 않는다 (edge)', () => {
    render(<ChatBubble role="assistant" content="## 떡볶이" />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })
})
