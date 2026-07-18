export interface WebpageSnapshot {
  title?: string
  text?: string
  visibleText?: string
  shadowText?: string
  html?: string
  url?: string
}

export interface ReadableWebpage {
  title: string
  author?: string
  excerpt?: string
  text: string
  url: string
}

const collapseText = (value = '') => value
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const textFromHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,noscript,template,svg,canvas').forEach(node => node.remove())
  doc.querySelectorAll('br').forEach(node => node.replaceWith('\n'))
  doc.querySelectorAll('p,div,section,article,main,li,h1,h2,h3,h4,h5,h6,blockquote,pre').forEach(node => node.append('\n'))
  return {
    title: doc.querySelector('h1')?.textContent?.trim() || doc.title.trim(),
    author: doc.querySelector('meta[name="author"]')?.getAttribute('content')?.trim() || undefined,
    excerpt: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || undefined,
    text: collapseText(doc.body?.textContent || ''),
  }
}

const looksLikeHtml = (value: string) => /<\/?(?:html|body|article|main|p|div|h1)[\s>]/i.test(value)

export const extractReadableWebpage = async (url: string, snapshot?: string | WebpageSnapshot): Promise<ReadableWebpage> => {
  const data = typeof snapshot === 'string' ? { text: snapshot } : snapshot || {}
  let html = data.html || ''
  let fallbackText = data.text || data.visibleText || data.shadowText || ''

  if (!html && fallbackText && looksLikeHtml(fallbackText)) {
    html = fallbackText
    fallbackText = ''
  }

  if (!html && !fallbackText) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`网页加载失败（${response.status}）`)
    html = await response.text()
  }

  const parsed = html ? textFromHtml(html) : { title: '', author: undefined, excerpt: undefined, text: collapseText(fallbackText) }
  const text = parsed.text || collapseText(fallbackText)
  if (!text) throw new Error('当前网页没有可转换的正文')

  let hostname = ''
  try { hostname = new URL(url).hostname }
  catch {}

  return {
    title: data.title?.trim() || parsed.title || hostname || '网页阅读',
    author: parsed.author,
    excerpt: parsed.excerpt,
    text,
    url: data.url || url,
  }
}

export const createReadableWebpageTxtFile = async (url: string, snapshot?: string | WebpageSnapshot) => {
  const page = await extractReadableWebpage(url, snapshot)
  const safeTitle = page.title.replace(/[\\/:*?"<>|]+/g, '_').trim() || '网页阅读'
  return {
    page,
    file: new File([page.text], `${safeTitle}.txt`, { type: 'text/plain;charset=utf-8' }),
  }
}
