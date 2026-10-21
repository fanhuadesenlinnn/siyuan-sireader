import { expect, test, vi } from 'vitest'
vi.mock('siyuan', () => ({ showMessage: vi.fn() }))
vi.mock('@/core/storage', () => ({ storageEngine: { readState: vi.fn(), read: vi.fn(), transact: vi.fn() } }))
vi.mock('@/api', () => ({ forwardProxy: vi.fn() }))
import { LicenseManager } from '@/core/license'
import { storageEngine } from '@/core/storage'
import { forwardProxy } from '@/api'

const stalePaidLicense = () => ({
  userId: 'account-1', userName: 'Reader', type: 'annual', activatedAt: 1,
  expiresAt: Date.now() + 86400000, features: [], licenseVersion: 1,
  lastVerifiedAt: Date.now() - 8 * 86400000, isValid: true, source: 'membership' as const,
})

test('keeps a still-valid cached membership when the server is temporarily unavailable', async () => {
  const cached = stalePaidLicense()
  vi.mocked(storageEngine.readState).mockResolvedValue({ found: true, value: cached })
  vi.mocked(forwardProxy).mockRejectedValue(new Error('network unavailable'))
  vi.spyOn(LicenseManager, 'getUser').mockResolvedValue({ userId: 'account-1', userName: 'Reader' })

  const result = await (LicenseManager as any).readLicense()

  expect(result).toMatchObject({ userId: 'account-1', type: 'annual' })
  expect(storageEngine.transact).not.toHaveBeenCalled()
})

test('replaces a stale paid cache with basic status when the server confirms no membership', async () => {
  vi.mocked(storageEngine.readState).mockResolvedValue({ found: true, value: stalePaidLicense() })
  vi.mocked(forwardProxy).mockResolvedValue({ status: 200, body: { binding: { accountId: 'account-1', accountName: 'Reader' }, memberships: [] } } as any)
  vi.spyOn(LicenseManager, 'getUser').mockResolvedValue({ userId: 'account-1', userName: 'Reader' })

  const result = await (LicenseManager as any).readLicense()

  expect(result).toMatchObject({ userId: 'account-1', type: 'free' })
  expect(storageEngine.transact).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'sireader_license' }),
    [expect.objectContaining({ type: 'set', path: [], value: expect.objectContaining({ type: 'free' }) })],
  )
})

test('clears a stale paid cache when the server authoritatively returns not found', async () => {
  vi.mocked(storageEngine.readState).mockResolvedValue({ found: true, value: stalePaidLicense() })
  vi.mocked(forwardProxy).mockResolvedValue({ status: 404, body: { message: 'not found' } } as any)
  vi.spyOn(LicenseManager, 'getUser').mockResolvedValue({ userId: 'account-1', userName: 'Reader' })

  const result = await (LicenseManager as any).readLicense()

  expect(result).toBeNull()
  expect(storageEngine.transact).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'sireader_license' }),
    [expect.objectContaining({ type: 'set', path: [], value: null })],
  )
})
