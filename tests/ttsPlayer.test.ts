import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('siyuan', () => ({ showMessage: vi.fn() }), { virtual: true })
vi.mock('foliate-js/tts.js', () => ({ TTS: class { start() { return '' } } }), { virtual: true })
vi.mock('foliate-js/text-walker.js', () => ({ textWalker: {} }), { virtual: true })
vi.mock('foliate-js/overlayer.js', () => ({ Overlayer: { highlight: vi.fn() } }), { virtual: true })
vi.mock('@/services/TTSEngine', () => ({
  EdgeTTSCore: class { setVoice() {} close() {} toSSMLStream = vi.fn(async () => new Uint8Array([1, 2, 3])) },
  loadLocalVoices: vi.fn(async () => []),
  toArrayBuffer: vi.fn(() => new ArrayBuffer(4)),
}), { virtual: true })
vi.mock('@/services/TTSExtractor', () => ({ ttsNodeFilter: {} }), { virtual: true })
vi.mock('@/services/OfflineTTS', () => ({
  OfflineTTSManager: class { getManifest = vi.fn(async (id: string) => ({ id, name: '测试语音', kind: 'piper-vits', model: 'model.onnx', tokens: 'tokens.txt', installed: true })) },
  initializeOfflineTTS: vi.fn(async () => {}),
  synthesizeOfflineTTS: vi.fn(async () => ({ samples: new Float32Array([0.1, 0.2]), sampleRate: 22050 })),
}), { virtual: true })

class AudioContextMock {
  state = 'running'
  destination = {}
  async resume() {}
  async decodeAudioData() { return {} }
  createBuffer() { return { copyToChannel() {} } }
  createBufferSource() {
    let ended: (() => void) | undefined
    return { buffer: null, connect() {}, addEventListener(_name: string, handler: () => void) { ended = handler }, start() { ended?.() }, stop() {} }
  }
}

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('TTS reader progression', () => {
  it('continues through current-page sentences when automatic page turning is disabled', async () => {
    vi.stubGlobal('AudioContext', AudioContextMock)
    vi.stubGlobal('Node', { ELEMENT_NODE: 1 })
    vi.stubGlobal('DOMParser', class { parseFromString(value: string) { return { documentElement: { textContent: String(value || '').replace(/<[^>]*>/g, '') } } } })

    const sentences = ['第一句。', '第二句。']
    let cursor = -1
    const tts = {
      doc: {},
      start() {},
      resume: () => '',
      nextMark: () => { cursor++; return sentences[cursor] ? `<speak><mark name="m${cursor}"/>${sentences[cursor]}</speak>` : '' },
      setMark() {},
      getLastRange: () => undefined,
    }
    const view = { renderer: {}, tts, initTTS: vi.fn(async () => {}), next: vi.fn(async () => {}) }
    const spoken: string[] = []
    const { EdgeTTSPlayer } = await import('@/services/TTSPlayer')
    const player = new EdgeTTSPlayer(view, { voice: 'en-US-test', autoTurnPage: false, highlightText: false, onBlock: (text: string) => spoken.push(text) })

    await player.play()

    expect(spoken).toEqual(sentences)
    expect(view.next).not.toHaveBeenCalled()
  })

  it('highlights the cloned offline sentence range when its audio starts', async () => {
    vi.stubGlobal('AudioContext', AudioContextMock)
    vi.stubGlobal('Node', { ELEMENT_NODE: 1 })
    vi.stubGlobal('DOMParser', class { parseFromString(value: string) { return { documentElement: { textContent: String(value || '').replace(/<[^>]*>/g, '') } } } })
    vi.stubGlobal('document', { implementation: { createHTMLDocument: () => ({ body: { appendChild() {} } }) } })

    const ownerDocument = {}
    const playbackRange = { startContainer: { ownerDocument }, toString: () => '当前离线句。', cloneContents: () => ({}) }
    const activeRange = { ...playbackRange }
    const overlayer = { add: vi.fn(), remove: vi.fn() }
    let consumed = false
    const tts = {
      doc: {},
      start() {},
      resume: () => '',
      nextMark: () => { if (consumed) return ''; consumed = true; return '<speak><mark name="current"/>当前离线句。</speak>' },
      setMark() {},
      getLastRange: () => ({ ...activeRange, cloneRange: () => playbackRange }),
    }
    const view = {
      renderer: { scrollToAnchor: vi.fn(), getContents: () => [{ doc: ownerDocument, overlayer }] },
      tts,
      initTTS: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
    }
    const { EdgeTTSPlayer } = await import('@/services/TTSPlayer')
    const player = new EdgeTTSPlayer(view, { voice: 'offline:zh-CN-xiao-ya', autoTurnPage: false, highlightText: true })

    await player.play()

    expect(overlayer.add).toHaveBeenCalledWith('sireader-tts-current', playbackRange, expect.any(Function), expect.any(Object))
  })
})
