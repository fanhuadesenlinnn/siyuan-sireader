import { ref } from 'vue'
import type { Plugin } from 'siyuan'
import { bookshelfManager } from '@/core/bookshelf'
import { resolveLocalDate, splitFocusByLocalDate } from '@/integrations/lifecycle'

const emptyStats = () => ({ readingTime: 0, sessionStart: 0, currentBook: '', lastSaved: 0, focused: false })
const getEventBookUrl = (e: CustomEvent) => e.detail?.bookUrl || e.detail?.book?.url || ''

export function useStats(plugin: Plugin) {
  const stats = ref(emptyStats())

  const fmt = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds % 60}s`
  }

  const fmtShort = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    if (hours >= 24) return `${Math.floor(hours / 24)}d`
    if (hours > 0) return `${hours}h`
    return `${Math.floor(seconds / 60)}m`
  }

  const persist = async (duration: number) => {
    const readingTime = stats.value.readingTime + duration
    await Promise.all([
      bookshelfManager.saveSetting('reader_stats', { readingTime }),
      stats.value.currentBook ? bookshelfManager.recordReading(stats.value.currentBook, duration) : Promise.resolve(),
    ])
    stats.value.readingTime = readingTime
  }

  let saving: Promise<void> | null = null
  const saveIncrement = async () => {
    if (saving) return saving
    if (!stats.value.focused || !stats.value.lastSaved) return
    const now = Date.now()
    const start = stats.value.lastSaved
    const elapsed = now - start
    const duration = Math.floor(elapsed / 1000)
    if (duration < 1) return
    saving = (async () => {
      await Promise.all([
        persist(duration),
        ...splitFocusByLocalDate(start, now).map(({ date, durationMs }) => bookshelfManager.recordSessionFocus(date, durationMs)),
      ])
      stats.value.lastSaved = now
    })().finally(() => { saving = null })
    return saving
  }

  const resetSession = (bookUrl = stats.value.currentBook) => Object.assign(stats.value, { currentBook: bookUrl, sessionStart: 0, lastSaved: 0, focused: false })

  const setFocused = (focused: boolean, bookUrl = stats.value.currentBook) => {
    if (bookUrl && stats.value.currentBook !== bookUrl) resetSession(bookUrl)
    if (!stats.value.currentBook || stats.value.focused === focused) return
    if (!focused) return void resetSession()
    const now = Date.now()
    Object.assign(stats.value, { sessionStart: now, lastSaved: now, focused })
  }

  const stopReading = async () => {
    await saveIncrement()
    resetSession('')
  }

  const load = async () => {
    const data = await bookshelfManager.getSetting('reader_stats', { readingTime: 0 })
    Object.assign(stats.value, emptyStats(), { readingTime: Number(data?.readingTime || 0) })
  }

  const getSessionFocus = async ({ localDate }: { localDate?: string } = {}) => {
    if (saving) await saving
    const date = resolveLocalDate(localDate)
    const persisted = await bookshelfManager.getSessionFocus(date)
    const live = stats.value.focused && stats.value.lastSaved
      ? splitFocusByLocalDate(stats.value.lastSaved, Date.now()).find(slice => slice.date === date)?.durationMs || 0
      : 0
    return { focusMs: persisted + live }
  }

  const init = () => {
    void load()

    const bar = document.createElement('div')
    bar.className = 'toolbar__item ariaLabel'
    bar.dataset.position = 'north'
    bar.dataset.tooltipEncoding = 'none'
    bar.id = 'stats-btn'
    bar.innerHTML = '<svg class="toolbar__icon"><use xlink:href="#iconClock"></use></svg>'
    bar.setAttribute('aria-label', 'Reading stats')
    bar.style.cursor = 'pointer'
    bar.addEventListener('click', () => window.dispatchEvent(new CustomEvent('stats:toggle')))
    plugin.addStatusBar({ element: bar, position: 'right' })

    const timer = window.setInterval(() => void saveIncrement(), 60000)
    const beforeUnload = () => { void stopReading() }
    const onReaderOpen = ((e: CustomEvent) => resetSession(getEventBookUrl(e))) as EventListener
    const onReaderFocus = ((e: CustomEvent) => setFocused(true, getEventBookUrl(e))) as EventListener
    const onReaderBlur = (() => { void saveIncrement().finally(() => resetSession()) }) as EventListener
    const onReaderClose = (() => { void stopReading() }) as EventListener

    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('sireader:reader-open', onReaderOpen)
    window.addEventListener('sireader:reader-focus', onReaderFocus)
    window.addEventListener('sireader:reader-blur', onReaderBlur)
    window.addEventListener('sireader:reader-close', onReaderClose)

    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('sireader:reader-open', onReaderOpen)
      window.removeEventListener('sireader:reader-focus', onReaderFocus)
      window.removeEventListener('sireader:reader-blur', onReaderBlur)
      window.removeEventListener('sireader:reader-close', onReaderClose)
      void stopReading()
    }
  }

  return { stats, fmt, fmtShort, getSessionFocus, init }
}
