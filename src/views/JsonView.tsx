import { useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit, listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import {
  Button,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  CopyRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  HistoryRegular,
} from '@fluentui/react-icons'
import { saveInputHistory } from '../api/deepseek'
import { useWindowSync } from '../hooks/useWindowSync'
import InputHistoryDialog from '../components/InputHistoryDialog'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('json', json)

const winId = getCurrentWindow().label

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', flexWrap: 'wrap', gap: '10px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolbarRight: { display: 'flex', gap: '8px' },
  status: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 },
  statusOk: { color: tokens.colorStatusSuccessForeground1 },
  statusErr: { color: tokens.colorStatusDangerForeground1 },
  textRow: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minHeight: 0, overflow: 'hidden' },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  taInput: { flex: 1, minHeight: 0 },
  codeBlock: {
    flex: 1, minHeight: 0, height: '100%', margin: 0, padding: '14px 16px',
    background: '#1a1a2e', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', overflow: 'auto',
    fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
    fontSize: '13px', lineHeight: 1.7, color: '#c0c0d8', whiteSpace: 'pre',
  },
  codeEmpty: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colorNeutralForeground4 },
  charCount: { fontSize: '12px', color: tokens.colorNeutralForeground4, textAlign: 'right', margin: 0 },
})

export default function JsonView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useWindowSync<{ from: string; input: string; output: string }>(
    'json-sync', winId,
    (payload) => { setInput(payload.input); setOutput(payload.output) },
  )

  useEffect(() => {
    let unlisten: UnlistenFn | null = null
    listen<string>('switch-sync', (e) => {
      if (e.payload === winId) {
        emit('json-sync', { from: winId, input, output })
      } else {
        setInput(''); setOutput(''); setErrorMsg('')
      }
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const highlightedOutput = useMemo(
    () => (output ? hljs.highlight(output, { language: 'json' }).value : ''),
    [output],
  )

  const isValid = useMemo(() => {
    if (!input.trim()) return null
    try { JSON.parse(input); return true } catch { return false }
  }, [input])

  function sortObjectKeys(obj: any): any {
    if (Array.isArray(obj)) return obj.map(sortObjectKeys)
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key])
        return acc
      }, {} as Record<string, any>)
    }
    return obj
  }

  function doFormat() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 JSON 文本'); return }
    try {
      let obj = JSON.parse(input)
      if (sortKeys) obj = sortObjectKeys(obj)
      setOutput(JSON.stringify(obj, null, indent === 0 ? '\t' : indent))
      saveInputHistory('json', input)
      dispatchToast(<Toast><ToastTitle>格式化完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  function doCompress() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 JSON 文本'); return }
    try {
      setOutput(JSON.stringify(JSON.parse(input)))
      saveInputHistory('json', input)
      dispatchToast(<Toast><ToastTitle>压缩完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  async function copyOutput() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function clearInput() { setInput(''); setOutput(''); setErrorMsg('') }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Dropdown value={indent} onOptionSelect={(_, d) => setIndent(Number(d.optionValue))} style={{ width: '100px' }} size="small">
            <Option value="2">2 空格</Option>
            <Option value="4">4 空格</Option>
            <Option value="0">Tab</Option>
          </Dropdown>
          <Checkbox checked={sortKeys} onChange={(_, d) => setSortKeys(d.checked === true)} label="Key 排序" size="small" />
          {isValid === true && (
            <span className={`${styles.status} ${styles.statusOk}`}>
              <CheckmarkCircleRegular /> JSON 有效
            </span>
          )}
          {isValid === false && (
            <span className={`${styles.status} ${styles.statusErr}`}>
              <DismissCircleRegular /> JSON 无效
            </span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <Button size="small" appearance="primary" onClick={doFormat}>格式化</Button>
          <Button size="small" onClick={doCompress}>压缩</Button>
          <Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={() => setShowHistory(true)}>历史</Button>
        </div>
      </div>

      <div className={styles.textRow}>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输入</span>
            {input && <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={clearInput}>清空</Button>}
          </div>
          <Textarea className={styles.taInput} value={input} onChange={(_, d) => setInput(d.value)} placeholder="粘贴 JSON 文本..." />
          {errorMsg && (
            <div style={{
              marginTop: '6px', backgroundColor: tokens.colorStatusDangerBackground1,
              border: `1px solid ${tokens.colorStatusDangerStroke1}`, borderRadius: '6px',
              padding: '8px 12px', color: tokens.colorStatusDangerForeground1, fontSize: '13px',
            }}>
              {errorMsg}
            </div>
          )}
        </div>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输出</span>
            {output && <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={copyOutput}>复制</Button>}
          </div>
          {output ? (
            <pre className={styles.codeBlock}><code dangerouslySetInnerHTML={{ __html: highlightedOutput }} /></pre>
          ) : (
            <div className={`${styles.codeBlock} ${styles.codeEmpty}`}>格式化结果将显示在这里</div>
          )}
          {output && <p className={styles.charCount}>{output.length} 字符</p>}
        </div>
      </div>

      <InputHistoryDialog open={showHistory} tool="json" onOpenChange={setShowHistory} onUseText={setInput} />
    </div>
  )
}
