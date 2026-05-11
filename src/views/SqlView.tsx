import { useState, useEffect, useRef, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
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
  HistoryRegular,
} from '@fluentui/react-icons'
import { saveInputHistory } from '../api/deepseek'
import InputHistoryDialog from '../components/InputHistoryDialog'
import { format } from 'sql-formatter'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('sql', sql)

const winId = getCurrentWindow().label

const dialects = [
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'TSQL', value: 'tsql' },
  { label: 'MariaDB', value: 'mariadb' },
]

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', flexWrap: 'wrap', gap: '10px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolbarRight: { display: 'flex', gap: '8px' },
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

export default function SqlView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dialect, setDialect] = useState('sqlite')
  const [uppercase, setUppercase] = useState(false)
  const [tabWidth, setTabWidth] = useState('2')
  const [showHistory, setShowHistory] = useState(false)

  const inputRef = useRef(input)
  const outputRef = useRef(output)
  inputRef.current = input
  outputRef.current = output

  function syncOut() {
    emit('sql-sync', { from: winId, input: inputRef.current, output: outputRef.current })
  }

  useEffect(() => {
    let unlistenSync: UnlistenFn | null = null
    let unlistenSwitch: UnlistenFn | null = null

    async function setup() {
      unlistenSync = await listen<{ from: string; input: string; output: string }>('sql-sync', (e) => {
        if (e.payload.from === winId) return
        setInput(e.payload.input)
        setOutput(e.payload.output)
      })

      unlistenSwitch = await listen<string>('switch-sync', (e) => {
        if (e.payload === winId) {
          syncOut()
        } else {
          setInput(''); setOutput(''); setErrorMsg('')
        }
      })
    }

    setup()
    return () => { unlistenSync?.(); unlistenSwitch?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const highlightedOutput = useMemo(
    () => (output ? hljs.highlight(output, { language: 'sql' }).value : ''),
    [output],
  )

  function doFormat() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) {
      dispatchToast(<Toast><ToastTitle>请输入 SQL 文本</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    try {
      setOutput(format(input, {
        language: dialect as any,
        keywordCase: uppercase ? 'upper' : 'lower',
        ...(tabWidth === 'tab' ? { useTabs: true } : { tabWidth: Number(tabWidth) }),
      }))
      saveInputHistory('sql', input)
      dispatchToast(<Toast><ToastTitle>格式化完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  function doCompress() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) {
      dispatchToast(<Toast><ToastTitle>请输入 SQL 文本</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    try {
      const formatted = format(input, { language: dialect as any })
      setOutput(formatted.replace(/\n\s*/g, ' ').trim())
      saveInputHistory('sql', input)
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
          <Dropdown value={dialect} onOptionSelect={(_, d) => setDialect(d.optionValue!)} style={{ width: '130px' }}>
            {dialects.map((d) => <Option key={d.value} value={d.value}>{d.label}</Option>)}
          </Dropdown>
          <Dropdown value={tabWidth} onOptionSelect={(_, d) => setTabWidth(d.optionValue!)} style={{ width: '100px' }}>
            <Option value="2" text="2 空格">2 空格</Option>
            <Option value="4" text="4 空格">4 空格</Option>
            <Option value="tab" text="Tab">Tab</Option>
          </Dropdown>
          <Checkbox checked={uppercase} onChange={(_, d) => setUppercase(d.checked === true)} label="关键字大写" />
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
          <Textarea className={styles.taInput} value={input} onChange={(_, d) => setInput(d.value)} placeholder="粘贴 SQL 语句..." />
          {errorMsg && (
            <div style={{
              marginTop: '6px', backgroundColor: tokens.colorStatusDangerBackground1,
              border: `1px solid ${tokens.colorStatusDangerBorder1}`, borderRadius: '6px',
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

      <InputHistoryDialog open={showHistory} tool="sql" onOpenChange={setShowHistory} onUseText={setInput} />
    </div>
  )
}
