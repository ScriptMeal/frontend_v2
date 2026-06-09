import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavoriteCard from './FavoriteCard'
import type { FavoriteRecord } from '@/types'

const favorite: FavoriteRecord = {
  id: 7,
  history_id: 7,
  session_id: 's1',
  user_message: '떡볶이 먹고 싶어',
  recipe_reply: '## 다이어트 떡볶이\n\n- 곤약 떡',
  intent: 'SPECIFIC_FOOD',
  created_at: '2026-06-01T16:00:00Z',
}

describe('FavoriteCard', () => {
  it('질문(user_message)과 답변(recipe_reply 마크다운)을 렌더한다 (happy)', () => {
    render(<FavoriteCard favorite={favorite} onDelete={() => {}} />)
    expect(screen.getByText('떡볶이 먹고 싶어')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '다이어트 떡볶이' }),
    ).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 onDelete(id) 를 호출한다 (happy)', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<FavoriteCard favorite={favorite} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: /삭제/ }))
    expect(onDelete).toHaveBeenCalledWith(7)
  })
})
