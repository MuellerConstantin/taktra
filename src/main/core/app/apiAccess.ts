import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ApiState, ApiStatus } from '../../../shared/model/apiAccess'
import { notifyChanged } from '../events'
import { lazyStore } from './store'

type ApiKeyState = { readonly keyHash: string | null }

/** Only the hash of the key is kept, so the key itself is shown once and never stored. */
const store = lazyStore<ApiKeyState>('api', {
  keyHash: { type: ['string', 'null'], default: null }
})

let status: ApiStatus = 'disabled'

function hashKey(key: string): Buffer {
  return createHash('sha256').update(key).digest()
}

/** Replaces the key; the old one stops working. Returns the new key, the only time it is known. */
export function createApiKey(): string {
  const key = randomBytes(32).toString('base64url')
  store().set('keyHash', hashKey(key).toString('hex'))
  notifyChanged('apiAccess')
  return key
}

export function verifyApiKey(key: string): boolean {
  const keyHash = store().get('keyHash')
  if (keyHash === null) return false
  return timingSafeEqual(hashKey(key), Buffer.from(keyHash, 'hex'))
}

export function getApiState(): ApiState {
  return { status, hasKey: store().get('keyHash') !== null }
}

export function setApiStatus(next: ApiStatus): void {
  if (next === status) return
  status = next
  notifyChanged('apiAccess')
}
