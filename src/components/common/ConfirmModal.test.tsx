import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from './ConfirmModal'

describe('ConfirmModal', () => {
  it('메시지와 확인·취소 버튼을 렌더한다 (happy)', () => {
    render(
      <ConfirmModal
        message="정말 이 대화를 삭제하시겠습니까?"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('정말 이 대화를 삭제하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '예' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('확인 클릭 시 onConfirm 을 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmModal message="msg" onConfirm={onConfirm} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: '예' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('취소 클릭 시 onClose 를 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ConfirmModal message="msg" onConfirm={() => {}} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('백드롭 클릭과 Esc 로 닫는다 (edge)', () => {
    const onClose = vi.fn()
    render(<ConfirmModal message="msg" onConfirm={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('confirm-modal-backdrop'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('커스텀 라벨을 반영한다 (edge)', () => {
    render(
      <ConfirmModal
        message="msg"
        confirmLabel="삭제"
        cancelLabel="닫기"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })
})
