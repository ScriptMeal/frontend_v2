import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('자식 텍스트를 렌더링한다 (happy)', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('accent 변형은 녹색 액센트 배경 클래스를 적용한다', () => {
    render(<Button variant="accent">즐겨찾기</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-accent')
  })

  it('전달한 className 을 병합한다 (edge)', () => {
    render(<Button className="w-full">전송</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('disabled 속성을 반영한다', () => {
    render(<Button disabled>전송</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
