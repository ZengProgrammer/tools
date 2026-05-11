import { useState, useEffect, useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import {
  Button,
  Dropdown,
  Option,
  Input,
  Textarea,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowSortRegular,
  DeleteRegular,
  SettingsRegular,
  MicRegular,
  HistoryRegular,
} from '@fluentui/react-icons'
import { translate, loadSettings, saveSetting } from '../api/deepseek'
import HistoryDialog from '../components/HistoryDialog'
import PromptDialog from '../components/PromptDialog'

const winId = getCurrentWindow().label

const DEFAULT_PROMPT = '你是一名专业翻译。将以下文本从{source}翻译成{target}。只返回翻译结果，不要添加任何解释、注释或引号。'

const languages = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'Chinese' },
  { label: 'English', value: 'English' },
  { label: '한국어', value: 'Korean' },
  { label: '日本語', value: 'Japanese' },
  { label: 'Deutsch', value: 'German' },
  { label: 'Français', value: 'French' },
  { label: 'العربية', value: 'Arabic' },
]

const modelOptions = [
  { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
  { label: 'deepseek-v4-pro', value: 'deepseek-v4-pro' },
  { label: '自定义', value: 'custom' },
]

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  controlRow: {
    display: 'flex', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden',
    padding: '8px 10px',
    border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: '8px',
  },
  langGroup: { display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 1, minWidth: 0 },
  label: { fontSize: '12px', color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  actionGroup: { display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '6px' },
  settingsPanel: { marginTop: '8px' },
  settingGrid: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' },
  textRow: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '14px', minHeight: 0, overflow: 'hidden',
  },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  panelActions: { display: 'flex', gap: '2px' },
  taInput: { flex: 1, minHeight: 0 },
  alert: {
    marginTop: '6px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: '6px',
    padding: '8px 12px',
    color: tokens.colorStatusDangerForeground1,
    fontSize: '13px',
  },
  bottomBar: { textAlign: 'center', flexShrink: 0 },
})

export default function TranslateView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-v4-flash')
  const [customModel, setCustomModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT)
  const [showSettings, setShowSettings] = useState(false)
  const effectiveModel = model === 'custom' ? (customModel || 'deepseek-v4-flash') : model

  const [sourceText, setSourceText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('English')
  const [result, setResult] = useState('')
  const [translating, setTranslating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [showPrompt, setShowPrompt] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Refs for latest values (same as Vue refs)
  const sourceTextRef = useRef(sourceText)
  const resultRef = useRef(result)
  sourceTextRef.current = sourceText
  resultRef.current = result

  // syncOut: emit current state (exactly like Vue)
  function syncOut() {
    emit('translate-sync', { from: winId, sourceText: sourceTextRef.current, result: resultRef.current })
  }

  useEffect(() => {
    let unlistenSync: UnlistenFn | null = null
    let unlistenSwitch: UnlistenFn | null = null

    async function setup() {
      try {
        const settings = await loadSettings()
        if (settings.api_key) setApiKey(settings.api_key)
        if (settings.model) setModel(settings.model)
        if (settings.custom_model) setCustomModel(settings.custom_model)
        if (settings.system_prompt) setSystemPrompt(settings.system_prompt)
      } catch (e) {
        dispatchToast(<Toast><ToastTitle>{'加载设置失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
      }

      // Listen for sync from other window
      unlistenSync = await listen<{ from: string; sourceText: string; result: string }>('translate-sync', (e) => {
        if (e.payload.from === winId) return
        setSourceText(e.payload.sourceText)
        setResult(e.payload.result)
      })

      // Listen for settings sync
      const unlistenSettings = await listen<{ from: string; apiKey: string; model: string; customModel: string; systemPrompt: string }>('settings-sync', (s) => {
        if (s.payload.from === winId) return
        setApiKey(s.payload.apiKey)
        setModel(s.payload.model)
        setCustomModel(s.payload.customModel)
        if (s.payload.systemPrompt) setSystemPrompt(s.payload.systemPrompt)
      })

      // When tray switches: source broadcasts, target clears
      unlistenSwitch = await listen<string>('switch-sync', (e) => {
        if (e.payload === winId) {
          syncOut()
        } else {
          setSourceText('')
          setResult('')
          setErrorMsg('')
        }
      })

      return () => { unlistenSettings() }
    }

    const cleanup = setup()
    return () => { cleanup.then(fn => fn?.()); unlistenSync?.(); unlistenSwitch?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveSettings() {
    try {
      await saveSetting('api_key', apiKey)
      await saveSetting('model', model)
      await saveSetting('custom_model', customModel)
      await saveSetting('system_prompt', systemPrompt)
      dispatchToast(<Toast><ToastTitle>设置已保存</ToastTitle></Toast>, { intent: 'success' })
      emit('settings-sync', { from: winId, apiKey, model, customModel, systemPrompt })
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'保存失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  async function doTranslate() {
    if (!apiKey.trim()) {
      dispatchToast(<Toast><ToastTitle>请先配置 DeepSeek API Key</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    if (!sourceText.trim()) {
      dispatchToast(<Toast><ToastTitle>请输入要翻译的文本</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      dispatchToast(<Toast><ToastTitle>源语言和目标语言不能相同</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    setErrorMsg('')
    setTranslating(true)
    try {
      const res = await translate({
        apiKey: apiKey.trim(), model: effectiveModel,
        sourceLang, targetLang, text: sourceText.trim(), systemPrompt,
      })
      setResult(res)
      dispatchToast(<Toast><ToastTitle>翻译完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) {
      setErrorMsg(String(e))
    }
    setTranslating(false)
  }

  async function copyResult() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      dispatchToast(<Toast><ToastTitle>已复制到剪贴板</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function swapLanguages() {
    if (sourceLang === 'auto') return
    const src = sourceLang
    const tgt = targetLang
    setSourceLang(tgt)
    setTargetLang(src)
  }

  return (
    <div className={styles.page}>
      <div className={styles.controlRow} style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <div className={styles.langGroup}>
          <Dropdown value={sourceLang} onOptionSelect={(_, d) => setSourceLang(d.optionValue!)} style={{ width: '50px' }}>
            {languages.map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
          </Dropdown>
          <Button icon={<ArrowSortRegular />} size="small" disabled={sourceLang === 'auto'} onClick={swapLanguages} />
          <Dropdown value={targetLang} onOptionSelect={(_, d) => setTargetLang(d.optionValue!)} style={{ width: '50px' }}>
            {languages.filter((x) => x.value !== 'auto').map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
          </Dropdown>
        </div>
        <div className={styles.actionGroup}>
          <Button icon={<SettingsRegular />} size="small" onClick={() => setShowSettings(!showSettings)} />
          <Button appearance="primary" size="medium" disabled={translating} onClick={doTranslate}>
            翻译
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingGrid}>
            <Input
              value={apiKey}
              onChange={(_, d) => setApiKey(d.value)}
              type="password"
              placeholder="DeepSeek API Key (sk-...)"
              contentBefore={<span style={{ fontWeight: 600 }}>Key</span>}
            />
            <Dropdown value={model} onOptionSelect={(_, d) => setModel(d.optionValue!)} style={{ width: '200px' }}>
              {modelOptions.map((m) => <Option key={m.value} value={m.value}>{m.label}</Option>)}
            </Dropdown>
            {model === 'custom' && (
              <Input value={customModel} onChange={(_, d) => setCustomModel(d.value)} placeholder="自定义模型名..." style={{ width: '220px' }} />
            )}
            <Button appearance="primary" onClick={handleSaveSettings}>保存设置</Button>
          </div>
        </div>
      )}

      <div className={styles.textRow}>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>源文本</span>
            {sourceText && (
              <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={() => setSourceText('')}>清空</Button>
            )}
          </div>
          <Textarea className={styles.taInput} value={sourceText} onChange={(_, d) => setSourceText(d.value)} placeholder="输入要翻译的文本..." />
        </div>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>翻译结果</span>
            <div className={styles.panelActions}>
              {result && <Button appearance="subtle" size="small" onClick={copyResult}>复制</Button>}
              {result && <Button appearance="subtle" size="small" onClick={() => { setResult(''); setErrorMsg('') }}>清空</Button>}
            </div>
          </div>
          <Textarea className={styles.taInput} value={errorMsg ? '' : result} readOnly placeholder="翻译结果将显示在这里" />
          {errorMsg && <div className={styles.alert}>{errorMsg}</div>}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <Button appearance="subtle" icon={<MicRegular />} onClick={() => setShowPrompt(true)}>提示词</Button>
        <Button appearance="subtle" icon={<HistoryRegular />} onClick={() => setShowHistory(true)}>翻译历史</Button>
      </div>

      <PromptDialog open={showPrompt} systemPrompt={systemPrompt} onOpenChange={setShowPrompt} onSystemPromptChange={setSystemPrompt} />
      <HistoryDialog open={showHistory} onOpenChange={setShowHistory} />
    </div>
  )
}
