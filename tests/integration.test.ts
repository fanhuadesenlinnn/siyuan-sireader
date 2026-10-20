import { afterEach, describe, expect, test, vi } from 'vitest'
import { dispatchReaderLifecycle, installLifecycleIntegration, splitFocusByLocalDate } from '@/integrations/lifecycle'
import { registerRecentBooksWidget } from '@/integrations/recentBooksWidget'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('lifecycle integration', () => {
  test('splits focus intervals at local midnight', () => {
    const start = new Date(2026, 9, 19, 23, 59, 30).getTime()
    const end = new Date(2026, 9, 20, 0, 0, 15).getTime()
    expect(splitFocusByLocalDate(start, end)).toEqual([
      { date: '2026-10-19', durationMs: 30_000 },
      { date: '2026-10-20', durationMs: 15_000 },
    ])
  })

  test('publishes timestamp-only lifecycle events and keeps book URLs private', () => {
    vi.stubGlobal('window', new EventTarget())
    const publicListener = vi.fn(), internalListener = vi.fn()
    window.addEventListener('reader:open', publicListener)
    window.addEventListener('sireader:reader-open', internalListener)
    dispatchReaderLifecycle('open', 'book://private')
    const publicDetail = publicListener.mock.calls[0][0].detail
    expect(publicDetail).toEqual({ at: expect.any(Number) })
    expect(publicDetail).not.toHaveProperty('bookUrl')
    expect(internalListener.mock.calls[0][0].detail).toMatchObject({ bookUrl: 'book://private', at: publicDetail.at })
    window.removeEventListener('reader:open', publicListener)
    window.removeEventListener('sireader:reader-open', internalListener)
  })

  test('exposes a versioned, removable integration API without replacing existing methods', async () => {
    const api = { mountReader: vi.fn() }
    const uninstall = installLifecycleIntegration(api, async () => ({ focusMs: 42 }))
    expect(api).toMatchObject({ mountReader: expect.any(Function), integration: { protocol: 'sireader-integration', version: 1, capabilities: ['lifecycle.events', 'session.query'] } })
    await expect(api.integration.getSessionFocus({ localDate: '2026-10-20' })).resolves.toEqual({ focusMs: 42 })
    uninstall()
    expect(api).not.toHaveProperty('integration')
  })
})

describe('recent reading widget', () => {
  test('registers verified widget entries with resume links and unregisters on cleanup', async () => {
    vi.useFakeTimers()
    const unregister = vi.fn()
    const registerHomeModule = vi.fn(() => unregister)
    const moduleId = 'sireader-recent-books'
    const host = { registerHomeModule, getHomeModules: vi.fn(() => [{ moduleId }]) }
    const app = { plugins: [{ name: 'siyuan-speed-switch', ...host }] }
    const stop = registerRecentBooksWidget({ app, getBooks: async () => [
      { url: 'book://one?name=a', title: 'Book One', progress: 37, read: 2 },
      { url: 'book://two', title: 'Book Two', progress: 80, read: 1 },
    ] })
    await vi.advanceTimersByTimeAsync(0)
    expect(registerHomeModule).toHaveBeenCalledOnce()
    const config = registerHomeModule.mock.calls[0][0]
    const result = await config.read({}, 'desktop')
    expect(result.items[0]).toMatchObject({ label: 'Book One', value: '37%', href: 'sireader://resume?url=book%3A%2F%2Fone%3Fname%3Da' })
    stop()
    expect(unregister).toHaveBeenCalledOnce()
  })

  test('retries if host module registration cannot be verified', async () => {
    vi.useFakeTimers()
    const registerHomeModule = vi.fn(() => vi.fn())
    const host = { registerHomeModule, getHomeModules: vi.fn(() => []) }
    const stop = registerRecentBooksWidget({ app: { plugins: [{ name: 'siyuan-speed-switch', ...host }] }, getBooks: async () => [] })
    await vi.advanceTimersByTimeAsync(0)
    expect(registerHomeModule).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(250)
    expect(registerHomeModule).toHaveBeenCalledTimes(2)
    stop()
  })
})
