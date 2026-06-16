import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPairContextMenu from './ChatPairContextMenu'

function rect(over: Partial<DOMRect> = {}): DOMRect {
  return { top: 100, left: 20, width: 300, height: 120, bottom: 220, right: 320, x: 20, y: 100, toJSON: () => ({}), ...over } as DOMRect
}

const baseProps = {
  rect: rect(),
  userContent: '떡볶이 먹고 싶어',
  assistantContent: '## 다이어트 떡볶이',
  saved: false,
  canFavorite: true,
  canDelete: true,
  onToggleFavorite: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
}

describe('ChatPairContextMenu', () => {
  it('누른 쌍 내용과 즐겨찾기·삭제 메뉴를 보여준다 (happy)', () => {
    render(<ChatPairContextMenu {...baseProps} />)
    expect(screen.getByText('떡볶이 먹고 싶어')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '즐겨찾기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument()
  })

  it('saved 면 즐겨찾기 해제로 보여준다 (edge)', () => {
    render(<ChatPairContextMenu {...baseProps} saved />)
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()
  })

  it('즐겨찾기 탭 시 토글 후 닫는다 (happy)', async () => {
    const onToggleFavorite = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChatPairContextMenu {...baseProps} onToggleFavorite={onToggleFavorite} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '즐겨찾기' }))
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('삭제는 확인 한 단계를 거쳐 onDelete 를 호출한다 (파괴적 가드, happy)', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ChatPairContextMenu {...baseProps} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: '삭제하기' }))
    // 첫 탭은 삭제하지 않고 확인을 노출한다
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('즐겨찾기 처리 중에는 스피너를 노출한다 (loading)', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn(() => new Promise<void>(() => {})) // 미해결 — pending 유지
    render(<ChatPairContextMenu {...baseProps} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole('button', { name: '즐겨찾기' }))
    expect(await screen.findByTestId('contextmenu-favorite-spinner')).toBeInTheDocument()
  })

  it('삭제 확인 처리 중에는 스피너를 노출한다 (loading)', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn(() => new Promise<void>(() => {})) // 미해결 — pending 유지
    render(<ChatPairContextMenu {...baseProps} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: '삭제하기' }))
    await user.click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(await screen.findByTestId('contextmenu-delete-spinner')).toBeInTheDocument()
  })

  it('백드롭 클릭 시 닫는다 (edge)', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChatPairContextMenu {...baseProps} onClose={onClose} />)
    await user.click(screen.getByTestId('context-menu-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('canFavorite=false 면 즐겨찾기 메뉴를 숨긴다 (edge)', () => {
    render(<ChatPairContextMenu {...baseProps} canFavorite={false} />)
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument()
  })
})
