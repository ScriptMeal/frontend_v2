import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FavoriteRecord } from '@/types'

const mocks = vi.hoisted(() => ({
  all: {
    data: [] as FavoriteRecord[],
    isLoading: false,
    isError: false,
  },
  del: vi.fn(),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useAllFavorites: () => mocks.all,
  useDeleteFavorite: () => ({ mutate: mocks.del }),
}))

import FavoritesPage from './FavoritesPage'

function makeFav(id: number, overrides: Partial<FavoriteRecord> = {}): FavoriteRecord {
  return {
    id,
    session_id: 's1',
    user_message: `질문${id}`,
    recipe_reply: `## 답변${id}`,
    intent: 'SPECIFIC_FOOD',
    created_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  mocks.del.mockReset()
  mocks.all = { data: [], isLoading: false, isError: false }
})

describe('FavoritesPage', () => {
  it('여러 세션의 즐겨찾기를 합산해 렌더한다 (happy)', () => {
    mocks.all.data = [
      makeFav(1, { session_id: 'sA', user_message: 'A세션 질문' }),
      makeFav(2, { session_id: 'sB', user_message: 'B세션 질문' }),
    ]
    render(<FavoritesPage />)

    expect(screen.getByText('A세션 질문')).toBeInTheDocument()
    expect(screen.getByText('B세션 질문')).toBeInTheDocument()
  })

  it('즐겨찾기가 없으면 빈 상태 메시지를 보여준다 (edge)', () => {
    render(<FavoritesPage />)
    expect(screen.getByText(/아직 저장한 즐겨찾기가 없습니다/)).toBeInTheDocument()
  })

  it('타일 → 상세 모달 → 삭제 시 id 와 session_id 로 삭제를 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    mocks.all.data = [makeFav(1, { session_id: 'sA', user_message: 'A세션 질문' })]
    render(<FavoritesPage />)

    // 타일 클릭 → 상세 모달 오픈
    await user.click(screen.getByRole('button', { name: 'A세션 질문' }))
    // 모달 안의 삭제 버튼 클릭
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(mocks.del).toHaveBeenCalledWith({ id: 1, session_id: 'sA' })
  })
})
