import { expect, test, vi } from 'vitest'
vi.mock('siyuan', () => ({ showMessage: vi.fn() }))
vi.mock('@/core/storage', () => ({ storageEngine: { readState: vi.fn(), read: vi.fn(), transact: vi.fn() } }))
vi.mock('@/api', () => ({ forwardProxy: vi.fn() }))
import { LicenseManager } from '@/core/license'
import { forwardProxy } from '@/api'

test('surfaces binding service errors instead of waiting until the QR is reported expired', async () => {
  vi.mocked(forwardProxy).mockResolvedValue({ status: 200, body: { status: 'error', message: 'database unavailable' } } as any)

  await expect(LicenseManager.verifyBindingSession('test-token')).rejects.toThrow('database unavailable')
})

test('keeps a pending binding session as a normal poll result', async () => {
  vi.mocked(forwardProxy).mockResolvedValue({ status: 200, body: { status: 'ready', expiresAt: new Date(Date.now() + 60000).toISOString() } } as any)

  await expect(LicenseManager.verifyBindingSession('test-token')).resolves.toBeNull()
})
