import { describe, it, expect, afterEach } from 'vitest'
import { generateUUID } from './utils'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('generateUUID', () => {
  const original = crypto.randomUUID

  afterEach(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true, writable: true })
  })

  it('UUID v4 형식 문자열을 반환한다 (happy)', () => {
    expect(generateUUID()).toMatch(UUID_V4)
  })

  it('호출마다 다른 값을 생성한다 (happy)', () => {
    expect(generateUUID()).not.toBe(generateUUID())
  })

  it('crypto.randomUUID 가 없으면(비보안 컨텍스트: LAN IP 등) getRandomValues 폴백으로 v4 를 만든다 (edge)', () => {
    // randomUUID 는 보안 컨텍스트 전용 — 없는 환경을 흉내낸다.
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true, writable: true })
    expect(crypto.randomUUID).toBeUndefined()
    expect(generateUUID()).toMatch(UUID_V4)
  })
})
