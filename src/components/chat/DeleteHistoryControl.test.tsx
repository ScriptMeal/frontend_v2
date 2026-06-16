import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DeleteHistoryControl from './DeleteHistoryControl'

describe('DeleteHistoryControl — 삭제 버튼', () => {
  it('초기엔 삭제 버튼만 노출한다 (happy)', () => {
    render(<DeleteHistoryControl onDeleteHistory={() => {}} />)
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeInTheDocument()
    expect(screen.queryByText(/질문과 답변이 함께 삭제/)).not.toBeInTheDocument()
  })
})

describe('DeleteHistoryControl — 확인 흐름', () => {
  it('삭제 버튼 클릭 시 안내와 확인/취소를 노출한다 (happy)', () => {
    render(<DeleteHistoryControl onDeleteHistory={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    expect(screen.getByText(/질문과 답변이 함께 삭제/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제 확인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('삭제 진행 중에는 스피너를 노출한다 (loading)', async () => {
    let release = () => {}
    const onDeleteHistory = vi.fn(
      () => new Promise<void>((resolve) => { release = resolve }),
    )
    render(<DeleteHistoryControl onDeleteHistory={onDeleteHistory} />)
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }))

    expect(await screen.findByTestId('delete-spinner')).toBeInTheDocument()
    release()
  })

  it('확인 클릭 시 onDeleteHistory 를 호출한다 (happy)', () => {
    const onDeleteHistory = vi.fn()
    render(<DeleteHistoryControl onDeleteHistory={onDeleteHistory} />)
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(onDeleteHistory).toHaveBeenCalledTimes(1)
  })

  it('취소 클릭 시 onDeleteHistory 를 호출하지 않고 삭제 버튼으로 복귀한다 (edge)', () => {
    const onDeleteHistory = vi.fn()
    render(<DeleteHistoryControl onDeleteHistory={onDeleteHistory} />)
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onDeleteHistory).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '대화 삭제' })).toBeInTheDocument()
  })

  it('삭제가 실패하면 확인 영역을 유지하고 재시도 안내를 보여준다 (edge, 방어)', async () => {
    const onDeleteHistory = vi.fn().mockRejectedValue(new Error('network'))
    render(<DeleteHistoryControl onDeleteHistory={onDeleteHistory} />)
    fireEvent.click(screen.getByRole('button', { name: '대화 삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }))

    expect(await screen.findByText(/삭제에 실패/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제 확인' })).toBeInTheDocument()
  })
})
