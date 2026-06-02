import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PurchaseInfo from './PurchaseInfo'

const items = [
  { name: '곤약 떡 22kcal', detail: '약 180g 1개 899원', store: '쿠팡' },
  { name: '저당 양념 55kcal', detail: '100g 1,200원', store: '마켓컬리' },
]

describe('PurchaseInfo', () => {
  it('각 항목의 제품명·분량·구매처를 모두 표시한다 (happy)', () => {
    render(<PurchaseInfo items={items} />)
    expect(screen.getByText('곤약 떡 22kcal')).toBeInTheDocument()
    expect(screen.getByText('약 180g 1개 899원')).toBeInTheDocument()
    expect(screen.getByText('쿠팡')).toBeInTheDocument()
    expect(screen.getByText('마켓컬리')).toBeInTheDocument()
  })

  it('항목 수만큼 카드(listitem)를 렌더한다 (happy)', () => {
    render(<PurchaseInfo items={items} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('items 가 비면 아무것도 렌더하지 않는다 (edge)', () => {
    const { container } = render(<PurchaseInfo items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
