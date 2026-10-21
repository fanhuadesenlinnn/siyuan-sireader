export type OfflineTTSModelKind = 'piper-vits' | 'kokoro'

export interface OfflineTTSModelManifest {
  id: string
  name: string
  kind: OfflineTTSModelKind
  model: string
  tokens: string
  config?: string
  lexicon?: string
  voices?: string
  dataDir?: string
  ruleFsts?: string
  sampleRate?: number
  sid?: number
  installed?: boolean
  files?: string[]
  storagePaths?: Record<string, string>
}

export interface ImportFileMetadata {
  name: string
  relativePath: string
  text?: string
}

export const isSafeOfflineModelId = (id: string) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(id)

export const validateOfflineModelAssetPath = (relativePath: string) => {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) throw new Error('模型文件路径无效')
  const parts = normalized.split('/')
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error('模型文件路径包含不安全目录')
  return parts.join('/')
}

export const modelAssetStoragePath = (relativePath: string) => {
  const runtimePath = validateOfflineModelAssetPath(relativePath)
  return { runtimePath, path: runtimePath.replace(/(^|\/)!v(?=\/|$)/g, '$1__sireader_v__') }
}

export const safeTarFilePath = (prefix: string, name: string, type: number) => {
  if (![0, 48, 55].includes(type)) return null
  return validateOfflineModelAssetPath(prefix ? `${prefix}/${name}` : name)
}

export const validateArchiveFiles = (paths: string[], manifest: OfflineTTSModelManifest) => {
  const required = [manifest.model, manifest.tokens, manifest.voices, ...manifest.lexicon?.split(',') || []].filter(Boolean) as string[]
  const hasFile = (name: string) => paths.some(path => path === name || path.endsWith(`/${name}`))
  const missing = required.filter(name => !hasFile(name))
  if (missing.length) throw new Error(`模型压缩包缺少必要文件：${missing.join('、')}`)
  if (manifest.dataDir && !paths.some(path => path.startsWith(`${manifest.dataDir}/`) || path.includes(`/${manifest.dataDir}/`))) {
    throw new Error(`模型压缩包缺少 ${manifest.dataDir} 资源目录`)
  }
}

export const normalizeModelRelativePath = (relativePath: string) => {
  const normalized = validateOfflineModelAssetPath(relativePath)
  const parts = normalized.split('/')
  // webkitRelativePath includes the selected directory name; files from a
  // flat picker or an archive already use their model-relative name.
  if (parts.length > 1) parts.shift()
  const result = parts.join('/')
  if (!result) throw new Error('模型文件路径为空')
  return result
}

export const createPiperImportManifest = (files: ImportFileMetadata[]): OfflineTTSModelManifest => {
  if (!files.length) throw new Error('没有选择模型文件')
  const normalized = files.map(file => ({ ...file, path: normalizeModelRelativePath(file.relativePath) }))
  const paths = normalized.map(file => file.path)
  if (new Set(paths).size !== paths.length) throw new Error('模型目录中存在重复文件名')

  const modelFile = normalized.find(file => /\.onnx$/i.test(file.path) && !/\.onnx\.json$/i.test(file.path))
  if (!modelFile) throw new Error('缺少 Piper ONNX 模型文件')
  const config = normalized.find(file => file.path.toLowerCase() === `${modelFile.path}.json`.toLowerCase())
  if (!config?.text) throw new Error(`缺少模型配置文件：${modelFile.name}.json`)
  const tokens = normalized.find(file => file.path.toLowerCase() === 'tokens.txt')
  if (!tokens) throw new Error('缺少 tokens.txt')

  let metadata: any
  try { metadata = JSON.parse(config.text) } catch { throw new Error('模型 JSON 配置格式无效') }
  const phonemeType = String(metadata.phoneme_type || '').toLowerCase()
  if (!['pinyin', 'espeak'].includes(phonemeType)) throw new Error(`不支持的 Piper phoneme_type（音素类型）：${phonemeType || '未声明'}`)

  const lexicon = normalized.find(file => file.path.toLowerCase() === 'lexicon.txt')
  if (phonemeType === 'pinyin' && !lexicon) throw new Error('Piper pinyin 模型缺少 lexicon.txt')
  const hasEspeakData = normalized.some(file => file.path.startsWith('espeak-ng-data/'))
  if (phonemeType === 'espeak' && !hasEspeakData) throw new Error('Piper espeak 模型缺少 espeak-ng-data 资源目录')
  const ruleFsts = ['phone.fst', 'date.fst', 'number.fst'].filter(name => paths.some(path => path.toLowerCase() === name)).join(',')
  const firstFolder = files[0].relativePath.replace(/\\/g, '/').split('/')[0]
  const folderName = files[0].relativePath.includes('/') ? firstFolder : modelFile.name.replace(/\.onnx$/i, '')
  const id = folderName.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'imported-piper'
  const safeId = isSafeOfflineModelId(id) ? id : `imported-${id}`.slice(0, 64)
  const filesForManifest = [...new Set(paths)]

  return {
    id: safeId,
    name: folderName,
    kind: 'piper-vits',
    model: modelFile.path,
    tokens: tokens.path,
    config: config.path,
    lexicon: lexicon?.path,
    dataDir: hasEspeakData ? 'espeak-ng-data' : '',
    ruleFsts,
    sampleRate: Number(metadata.audio?.sample_rate) || undefined,
    files: filesForManifest,
  }
}

export const BUILTIN_XIAO_YA: OfflineTTSModelManifest = {
  id: 'zh-CN-xiao-ya',
  name: '中文 · 小雅（Piper / Melo 数据集）',
  kind: 'piper-vits',
  model: 'zh_CN-xiao_ya-medium.onnx',
  tokens: 'tokens.txt',
  config: 'zh_CN-xiao_ya-medium.onnx.json',
  lexicon: 'lexicon.txt',
  dataDir: '',
  ruleFsts: 'phone.fst,date.fst,number.fst',
  sampleRate: 22050,
  installed: false,
}

export const BUILTIN_KOKORO: OfflineTTSModelManifest = {
  id: 'kokoro-82m-zh-en',
  name: 'Kokoro-82M · 中英（103 声音）',
  kind: 'kokoro',
  model: 'model.onnx',
  voices: 'voices.bin',
  tokens: 'tokens.txt',
  dataDir: 'espeak-ng-data',
  lexicon: 'lexicon-us-en.txt,lexicon-zh.txt',
  sampleRate: 24000,
  sid: 3,
  installed: false,
}

export const OFFLINE_MODEL_VOICES = (manifest: OfflineTTSModelManifest) => {
  if (manifest.kind === 'kokoro') {
    const speakers = ['af_maple', 'af_sol', 'bf_vale', 'zf_001', 'zf_002', 'zf_003', 'zf_004', 'zf_005', 'zf_006', 'zf_007', 'zf_008', 'zf_017', 'zf_018', 'zf_019', 'zf_021', 'zf_022', 'zf_023', 'zf_024', 'zf_026', 'zf_027', 'zf_028', 'zf_032', 'zf_036', 'zf_038', 'zf_039', 'zf_040', 'zf_042', 'zf_043', 'zf_044', 'zf_046', 'zf_047', 'zf_048', 'zf_049', 'zf_051', 'zf_059', 'zf_060', 'zf_067', 'zf_070', 'zf_071', 'zf_072', 'zf_073', 'zf_074', 'zf_075', 'zf_076', 'zf_077', 'zf_078', 'zf_079', 'zf_083', 'zf_084', 'zf_085', 'zf_086', 'zf_087', 'zf_088', 'zf_090', 'zf_092', 'zf_093', 'zf_094', 'zf_099', 'zm_009', 'zm_010', 'zm_011', 'zm_012', 'zm_013', 'zm_014', 'zm_015', 'zm_016', 'zm_020', 'zm_025', 'zm_029', 'zm_030', 'zm_031', 'zm_033', 'zm_034', 'zm_035', 'zm_037', 'zm_041', 'zm_045', 'zm_050', 'zm_052', 'zm_053', 'zm_054', 'zm_055', 'zm_056', 'zm_057', 'zm_058', 'zm_061', 'zm_062', 'zm_063', 'zm_064', 'zm_065', 'zm_066', 'zm_068', 'zm_069', 'zm_080', 'zm_081', 'zm_082', 'zm_089', 'zm_091', 'zm_095', 'zm_096', 'zm_097', 'zm_098', 'zm_100']
    return speakers.map((speaker, sid) => ({
      name: `offline:${manifest.id}:${sid}`,
      displayName: `Kokoro · ${speaker}${sid < 2 ? ' · 美式英语女声' : sid === 2 ? ' · 英式英语女声' : sid < 58 ? ' · 中文女声' : ' · 中文男声'}`,
      locale: sid < 2 ? 'en-US' : sid === 2 ? 'en-GB' : 'zh-CN',
      isOffline: true,
    }))
  }
  return [{
    name: `offline:${manifest.id}`,
    displayName: manifest.name,
    locale: 'zh-CN',
    isOffline: true,
  }]
}

export const offlineVoiceModel = (voice: string) => {
  const match = /^offline:([a-zA-Z0-9][a-zA-Z0-9_-]{0,63})(?::(\d+))?$/.exec(voice)
  return match ? { modelId: match[1], sid: Number(match[2] ?? 0) } : null
}
