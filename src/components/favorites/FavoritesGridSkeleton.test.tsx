import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FavoritesGridSkeleton from './FavoritesGridSkeleton'

describe('FavoritesGridSkeleton', () => {
  it('role=status 로 로딩을 알린다 (happy)', () => {
    render(<FavoritesGridSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('스크린리더용 로딩 라벨을 노출한다 (a11y)', () => {
    render(<FavoritesGridSkeleton />)
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument()
  })

  it('카드 자리표시를 6개 렌더한다 (structure)', () => {
    render(<FavoritesGridSkeleton />)
    expect(screen.getAllByTestId('favorite-skeleton-card')).toHaveLength(6)
  })
})
