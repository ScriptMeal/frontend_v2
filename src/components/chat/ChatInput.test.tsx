import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

describe('ChatInput', () => {
  it('텍스트 입력 후 전송 클릭 시 onSubmit 호출하고 입력을 비운다 (happy)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    const textarea = screen.getByLabelText('메시지 입력')
    await user.type(textarea, '떡볶이 먹고 싶어')
    await user.click(screen.getByRole('button', { name: '전송' }))
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('떡볶이 먹고 싶어')
    expect(textarea).toHaveValue('')
  })

  it('Enter 로 전송하고 Shift+Enter 는 전송하지 않는다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    const textarea = screen.getByLabelText('메시지 입력')
    await user.type(textarea, '안녕')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('안녕')
  })

  it('공백만 입력 시 전송되지 않고 버튼이 비활성화된다 (edge)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('메시지 입력'), '   ')
    await user.keyboard('{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
  })

  it('disabled 상태에서는 입력과 전송이 모두 막힌다 (guard)', () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} disabled />)
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled()
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
  })
})
