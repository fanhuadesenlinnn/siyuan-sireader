import { describe, expect, it } from 'vitest'
import { BUILTIN_KOKORO, createPiperImportManifest, isSafeOfflineModelId, modelAssetStoragePath, normalizeModelRelativePath, offlineVoiceModel, OFFLINE_MODEL_VOICES, safeTarFilePath, validateArchiveFiles, validateOfflineModelAssetPath } from '@/services/offlineTTSModels'

describe('offline TTS model metadata', () => {
  it('normalizes selected folder paths and rejects traversal', () => {
    expect(normalizeModelRelativePath('zh-CN-xiao-ya/tokens.txt')).toBe('tokens.txt')
    expect(validateOfflineModelAssetPath('espeak-ng-data/en-us')).toBe('espeak-ng-data/en-us')
    expect(() => normalizeModelRelativePath('voice/../../outside.txt')).toThrow()
    expect(isSafeOfflineModelId('../voice')).toBe(false)
  })

  it('skips TAR directory entries and keeps nested regular-file paths', () => {
    expect(safeTarFilePath('kokoro', 'espeak-ng-data/', 53)).toBeNull()
    expect(safeTarFilePath('kokoro/espeak-ng-data', 'en-us', 48)).toBe('kokoro/espeak-ng-data/en-us')
    expect(() => safeTarFilePath('kokoro', '../outside', 48)).toThrow(/不安全/)
  })

  it('stores SiYuan-rejected !v assets under a safe path while preserving runtime paths', () => {
    expect(modelAssetStoragePath('kokoro/espeak-ng-data/voices/!v/m8')).toEqual({
      path: 'kokoro/espeak-ng-data/voices/__sireader_v__/m8',
      runtimePath: 'kokoro/espeak-ng-data/voices/!v/m8',
    })
    expect(modelAssetStoragePath('kokoro/espeak-ng-data/en-us')).toEqual({
      path: 'kokoro/espeak-ng-data/en-us',
      runtimePath: 'kokoro/espeak-ng-data/en-us',
    })
  })

  it('requires the Kokoro model assets before importing a downloaded archive', () => {
    expect(() => validateArchiveFiles(['kokoro/model.onnx', 'kokoro/tokens.txt'], BUILTIN_KOKORO)).toThrow(/voices.bin/)
    expect(() => validateArchiveFiles([
      'kokoro/model.onnx', 'kokoro/voices.bin', 'kokoro/tokens.txt',
      'kokoro/lexicon-us-en.txt', 'kokoro/lexicon-zh.txt', 'kokoro/espeak-ng-data/en-us',
    ], BUILTIN_KOKORO)).not.toThrow()
  })

  it('accepts a complete Piper VITS folder and creates a stable import manifest', () => {
    const manifest = createPiperImportManifest([
      { name: 'voice.onnx', relativePath: 'zh-CN-xiao-ya/voice.onnx' },
      { name: 'voice.onnx.json', relativePath: 'zh-CN-xiao-ya/voice.onnx.json', text: JSON.stringify({ audio: { sample_rate: 22050 }, phoneme_type: 'pinyin' }) },
      { name: 'tokens.txt', relativePath: 'zh-CN-xiao-ya/tokens.txt' },
      { name: 'lexicon.txt', relativePath: 'zh-CN-xiao-ya/lexicon.txt' },
    ])

    expect(manifest).toMatchObject({ id: 'zh-CN-xiao-ya', kind: 'piper-vits', model: 'voice.onnx', tokens: 'tokens.txt', lexicon: 'lexicon.txt', sampleRate: 22050 })
  })

  it('reports missing required Piper files and rejects unsupported phonemizers', () => {
    expect(() => createPiperImportManifest([{ name: 'voice.onnx', relativePath: 'voice.onnx' }])).toThrow(/tokens|json/i)
    expect(() => createPiperImportManifest([
      { name: 'voice.onnx', relativePath: 'voice.onnx' },
      { name: 'voice.onnx.json', relativePath: 'voice.onnx.json', text: JSON.stringify({ phoneme_type: 'pinyin' }) },
      { name: 'tokens.txt', relativePath: 'tokens.txt' },
    ])).toThrow(/lexicon/i)
    expect(() => createPiperImportManifest([
      { name: 'voice.onnx', relativePath: 'voice.onnx' },
      { name: 'voice.onnx.json', relativePath: 'voice.onnx.json', text: JSON.stringify({ phoneme_type: 'unknown' }) },
      { name: 'tokens.txt', relativePath: 'tokens.txt' },
    ])).toThrow(/phoneme/i)
  })

  it('maps all Kokoro speaker IDs to the bundled multilingual preset', () => {
    const voices = OFFLINE_MODEL_VOICES(BUILTIN_KOKORO)
    expect(voices).toHaveLength(103)
    expect(voices[3]).toMatchObject({ name: 'offline:kokoro-82m-zh-en:3', displayName: expect.stringContaining('zf_001'), locale: 'zh-CN' })
    expect(offlineVoiceModel('offline:kokoro-82m-zh-en:102')).toEqual({ modelId: 'kokoro-82m-zh-en', sid: 102 })
  })
})
