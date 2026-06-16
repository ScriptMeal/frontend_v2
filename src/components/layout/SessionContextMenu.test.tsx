import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionContextMenu from './SessionContextMenu'

function makeRect(): DOMRect {
  return {
    left: 10,
    top: 10,
    right: 210,
    bottom: 50,
    width: 200,
    height: 40,
    x: 10,
    y: 10,
    toJSON: () => {},
  } as DOMRect
}

describe('SessionContextMenu', () => {
  it('삭제하기 메뉴를 렌더한다 (happy)', () => {
    render(<SessionContextMenu rect={makeRect()} onDelete={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument()
  })

  it('삭제하기 클릭 시 onDelete 를 호출한다 (happy)', () => {
    const onDelete = vi.fn()
    render(<SessionContextMenu rect={makeRect()} onDelete={onDelete} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '삭제하기' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('백드롭 클릭과 Esc 로 닫는다 (edge)', () => {
    const onClose = vi.fn()
    render(<SessionContextMenu rect={makeRect()} onDelete={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('session-menu-backdrop'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
