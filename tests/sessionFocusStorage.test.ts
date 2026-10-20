import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/api', () => ({ readDir: vi.fn(), putFile: vi.fn(), removeFile: vi.fn() }))
vi.mock('@/main', () => ({ usePlugin: vi.fn() }))
vi.mock('@/core/diagnostics', () => ({ diagnosticLog: vi.fn() }))

import { putFile } from '@/api'
import { usePlugin } from '@/main'
import { ReaderDatabase } from '@/core/database'

const files = new Map<string, string>()
const storagePath = '/data/storage/petal/siyuan-sireader/'

beforeEach(() => {
  files.clear()
  vi.clearAllMocks()
  vi.mocked(usePlugin).mockReturnValue({ name: 'siyuan-sireader' } as any)
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
    const key = (JSON.parse(options!.body as string).path as string).replace(storagePath, '')
    return files.has(key) ? new Response(files.get(key)) : new Response('', { status: 404 })
  }))
  vi.mocked(putFile).mockImplementation(async (path, _isDir, file) => {
    files.set(path.replace(storagePath, ''), await file!.text())
    return null
  })
})
afterEach(() => vi.unstubAllGlobals())

test('persists local-date focus totals independently and rejects invalid entries', async () => {
  const db = new ReaderDatabase()
  await db.saveSessionFocus('2026-10-20', 12_000)
  await db.saveSessionFocus('2026-10-20', 8_000)
  await db.saveSessionFocus('invalid', 50_000)
  await expect(db.getSessionFocus('2026-10-20')).resolves.toBe(20_000)
  await expect(db.getSessionFocus('invalid')).resolves.toBe(0)
  expect([...files.keys()]).toEqual(['session-focus.json'])
})

test('recent books returns only lightweight index entries in read order', async () => {
  files.set('bookshelf.json', JSON.stringify({
    old: { url: 'old', title: 'Old', read: 1 },
    recent: { url: 'recent', title: 'Recent', read: 3 },
    middle: { url: 'middle', title: 'Middle', read: 2 },
  }))
  await expect(new ReaderDatabase().getRecentBooks(2)).resolves.toMatchObject([
    { url: 'recent', title: 'Recent' },
    { url: 'middle', title: 'Middle' },
  ])
  expect([...files.keys()]).toEqual(['bookshelf.json'])
})
