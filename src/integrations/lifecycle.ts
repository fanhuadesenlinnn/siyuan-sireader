export type ReaderLifecycle = 'open' | 'focus' | 'blur' | 'close'
export type LocalFocus = { localDate?: string }

const localDate = (time: number) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const splitFocusByLocalDate = (start: number, end: number) => {
  const slices: Array<{ date: string; durationMs: number }> = []
  for (let cursor = start; cursor < end;) {
    const date = new Date(cursor)
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
    const stop = Math.min(end, nextDay)
    slices.push({ date: localDate(cursor), durationMs: stop - cursor })
    cursor = stop
  }
  return slices
}

export const dispatchReaderLifecycle = (type: ReaderLifecycle, bookUrl = '') => {
  const at = Date.now()
  window.dispatchEvent(new CustomEvent(`reader:${type}`, { detail: { at } }))
  window.dispatchEvent(new CustomEvent(`sireader:reader-${type}`, { detail: { at, bookUrl } }))
}

export const installLifecycleIntegration = (
  api: Record<string, any>,
  getSessionFocus: (options: LocalFocus) => Promise<{ focusMs: number }>,
) => {
  const integration = {
    protocol: 'sireader-integration',
    version: 1,
    capabilities: ['lifecycle.events', 'session.query'],
    getSessionFocus,
  }
  api.integration = integration
  return () => { if (api.integration === integration) delete api.integration }
}

export const resolveLocalDate = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : localDate(Date.now())
