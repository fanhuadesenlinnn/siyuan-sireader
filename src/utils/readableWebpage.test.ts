// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createReadableWebpageTxtFile, extractReadableWebpage } from './readableWebpage'

const readFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(reader.error)
  reader.onload = () => resolve(String(reader.result || ''))
  reader.readAsText(file)
})

describe('readable webpage conversion', () => {
  it('extracts readable text and metadata from HTML', async () => {
    const page = await extractReadableWebpage('https://example.com/article', {
      html: '<html><head><title>Example</title><meta name="author" content="Ada"></head><body><script>bad()</script><article><h1>Hello</h1><p>First paragraph.</p><p>Second paragraph.</p></article></body></html>',
    })

    expect(page.title).toBe('Hello')
    expect(page.author).toBe('Ada')
    expect(page.text).toContain('First paragraph.')
    expect(page.text).toContain('Second paragraph.')
    expect(page.text).not.toContain('bad()')
  })

  it('creates a safe TXT file from snapshot text', async () => {
    const { page, file } = await createReadableWebpageTxtFile('https://example.com', {
      title: 'A/B: C',
      text: 'One\n\n\nTwo',
    })

    expect(page.text).toBe('One\n\nTwo')
    expect(file.name).toBe('A_B_ C.txt')
    expect(await readFile(file)).toBe(page.text)
  })
})
