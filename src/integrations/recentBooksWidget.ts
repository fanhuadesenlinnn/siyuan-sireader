type WidgetBook = { url: string; title: string; progress?: number; read?: number }
type WidgetOptions = {
  app: any
  getBooks: () => Promise<WidgetBook[]>
  title?: string
  description?: string
  moduleId?: string
}

const hostName = 'siyuan-speed-switch'
const retryDelays = [250, 750, 1500, 3000, 6000]
const resumeHref = (url: string) => `sireader://resume?url=${encodeURIComponent(url)}`

export const registerRecentBooksWidget = ({ app, getBooks, title = 'Recent reading', description = 'Continue reading a recently opened book', moduleId = 'sireader-recent-books' }: WidgetOptions) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let unregister: (() => void) | undefined
  let attempts = 0, stopped = false

  const register = () => {
    if (stopped) return
    const host = app?.plugins?.find((plugin: any) => plugin.name === hostName)
    if (typeof host?.registerHomeModule !== 'function') return retry()
    try {
      const dispose = host.registerHomeModule({
        moduleId,
        title,
        icon: 'iconClock',
        category: 'plugin',
        supportedDevices: ['desktop', 'sidebar', 'mobile'],
        sizes: ['small', 'medium'],
        description,
        read: async () => {
          const books = (await getBooks()).slice(0, 5)
          return { items: books.map(book => ({
            label: book.title,
            value: `${Math.round(Number(book.progress || 0))}%`,
            href: resumeHref(book.url),
          })) }
        },
      })
      const registered = host.getHomeModules?.('desktop')?.some((item: any) => item.moduleId === moduleId)
      if (registered) {
        unregister = typeof dispose === 'function' ? dispose : undefined
        return
      }
      if (typeof dispose === 'function') dispose()
    } catch { /* optional host may be mid-reload */ }
    retry()
  }

  const retry = () => {
    if (stopped || attempts >= retryDelays.length) return
    timer = setTimeout(() => { attempts++; register() }, retryDelays[attempts])
  }

  register()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
    unregister?.()
  }
}
