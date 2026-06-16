import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatBubble from './ChatBubble'

describe('ChatBubble — 렌더', () => {
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

  it('onSaveFavorite 가 없으면 즐겨찾기 버튼을 노출하지 않는다 (edge)', () => {
    render(<ChatBubble role="assistant" content="## 떡볶이" />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })

  it('user 버블은 onSaveFavorite 가 있어도 즐겨찾기 버튼을 노출하지 않는다 (edge)', () => {
    render(
      <ChatBubble role="user" content="질문" onSaveFavorite={async () => 1} onDeleteFavorite={() => {}} />,
    )
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })
})

describe('ChatBubble — footerAction (즐겨찾기 옆 추가 액션)', () => {
  it('assistant 버블은 footerAction 을 즐겨찾기 버튼과 함께 노출한다 (happy)', () => {
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={async () => 1}
        onDeleteFavorite={() => {}}
        footerAction={<button type="button">삭제</button>}
      />,
    )
    expect(screen.getByRole('button', { name: /즐겨찾기/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('onSaveFavorite 가 없어도 footerAction 만으로 푸터를 노출한다 (edge)', () => {
    render(
      <ChatBubble role="assistant" content="## 떡볶이" footerAction={<button type="button">삭제</button>} />,
    )
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('user 버블은 footerAction 을 렌더하지 않는다 (edge)', () => {
    render(<ChatBubble role="user" content="질문" footerAction={<button type="button">삭제</button>} />)
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})

describe('ChatBubble — saved 인디케이터 (모바일, 푸터 없이 저장 표시)', () => {
  it('saved 이고 즐겨찾기 버튼이 없으면 비-인터랙티브 저장 인디케이터를 노출한다 (happy)', () => {
    render(<ChatBubble role="assistant" content="## 떡볶이" saved />)
    expect(screen.getByTestId('saved-indicator')).toBeInTheDocument()
    // 버튼이 아니라 표시일 뿐 — 토글 버튼은 없다
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
  })

  it('saved 가 아니면 인디케이터를 노출하지 않는다 (edge)', () => {
    render(<ChatBubble role="assistant" content="## 떡볶이" />)
    expect(screen.queryByTestId('saved-indicator')).not.toBeInTheDocument()
  })

  it('즐겨찾기 버튼(푸터)이 있으면 인디케이터를 그리지 않는다 — 푸터가 우선 (edge)', () => {
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        saved
        initialFavoriteId={1}
        onSaveFavorite={vi.fn()}
        onDeleteFavorite={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
    expect(screen.queryByTestId('saved-indicator')).not.toBeInTheDocument()
  })
})

describe('ChatBubble — 즐겨찾기 토글', () => {
  it('클릭하면 저장하고 별이 채워진다(해제 상태로 전환) (happy)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockResolvedValue(7)
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))

    expect(onSaveFavorite).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
  })

  it('저장된 별을 다시 클릭하면 받은 id 로 삭제하고 별을 비운다 (happy)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockResolvedValue(7)
    const onDeleteFavorite = vi.fn().mockResolvedValue(undefined)
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={onDeleteFavorite}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))
    await user.click(screen.getByRole('button', { name: '즐겨찾기 해제' }))

    expect(onDeleteFavorite).toHaveBeenCalledWith(7)
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeInTheDocument()
  })

  it('initialFavoriteId 가 있으면 처음부터 저장됨(해제) 상태로 렌더한다 (happy)', () => {
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        initialFavoriteId={42}
        onSaveFavorite={vi.fn()}
        onDeleteFavorite={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
  })

  it('initialFavoriteId 로 저장된 별을 클릭하면 그 id 로 삭제한다 (happy)', async () => {
    const user = userEvent.setup()
    const onDeleteFavorite = vi.fn().mockResolvedValue(undefined)
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        initialFavoriteId={42}
        onSaveFavorite={vi.fn()}
        onDeleteFavorite={onDeleteFavorite}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기 해제' }))

    expect(onDeleteFavorite).toHaveBeenCalledWith(42)
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeInTheDocument()
  })

  it('저장 처리 중에는 스피너를 노출한다 (loading)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn(() => new Promise<number>(() => {})) // 미해결 — pending 유지
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))
    expect(await screen.findByTestId('favorite-spinner')).toBeInTheDocument()
  })

  it('저장이 실패하면(예: 400 중복) 별을 채우지 않는다 (error)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockRejectedValue(new Error('400'))
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))

    // 실패했으므로 여전히 저장 가능 상태(해제 버튼 없음)
    expect(screen.getByRole('button', { name: '즐겨찾기에 저장' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '즐겨찾기 해제' })).not.toBeInTheDocument()
  })
})

describe('ChatBubble — 동시 요청 방어 (favoriteDisabled · onBusyChange)', () => {
  it('favoriteDisabled 면 즐겨찾기 버튼을 비활성화하고 클릭해도 저장하지 않는다 (방어)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockResolvedValue(7)
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={vi.fn()}
        favoriteDisabled
      />,
    )
    const button = screen.getByRole('button', { name: '즐겨찾기에 저장' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onSaveFavorite).not.toHaveBeenCalled()
  })

  it('토글 진행에 맞춰 onBusyChange(true→false) 를 보고한다 (방어)', async () => {
    const user = userEvent.setup()
    const onSaveFavorite = vi.fn().mockResolvedValue(7)
    const onBusyChange = vi.fn()
    render(
      <ChatBubble
        role="assistant"
        content="## 떡볶이"
        onSaveFavorite={onSaveFavorite}
        onDeleteFavorite={vi.fn()}
        onBusyChange={onBusyChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기에 저장' }))

    expect(onBusyChange).toHaveBeenCalledWith(true)
    expect(onBusyChange).toHaveBeenLastCalledWith(false)
  })
})
