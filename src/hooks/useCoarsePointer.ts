import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

function matchCoarse(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false
}

/**
 * 터치(coarse) 포인터 환경인지 반환한다 — `@media (pointer: coarse)` 기준.
 * 모바일/터치에서만 롱프레스 컨텍스트 메뉴를 켜고, 하단 버튼을 숨기는 데 쓴다.
 * 외장 마우스 연결 등으로 포인터 종류가 바뀌면 change 이벤트로 갱신한다.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(matchCoarse)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return coarse
}
