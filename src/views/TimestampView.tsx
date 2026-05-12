import { useState, useEffect, useRef } from 'react'
import {
  Button,
  Input,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowSyncRegular,
  CopyRegular,
  DeleteRegular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', gap: '10px',
  },
  toolbarRight: { display: 'flex', gap: '8px' },
  textRow: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minHeight: 0, overflow: 'hidden' },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  dateInput: {
    height: '32px', padding: '0 8px',
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground1, fontSize: '14px',
    fontFamily: "'JetBrains Mono', Consolas, monospace", outline: 'none',
  },
  precisionRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' },
  precisionLabel: { fontSize: '12px', color: tokens.colorNeutralForeground4, width: '30px', flexShrink: 0 },
  precisionValue: {
    flex: 1, fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '12px',
    color: tokens.colorNeutralForeground2, wordBreak: 'break-all',
  },
  errorText: { fontSize: '12px', color: tokens.colorStatusDangerForeground1, marginTop: '4px' },
  liveBadge: { fontSize: '11px', color: tokens.colorStatusSuccessForeground1 },
})

function formatDateTime(ts: number): string {
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export default function TimestampView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [tsInput, setTsInput] = useState('')
  const [tsOutput, setTsOutput] = useState('')
  const [dateOutput, setDateOutput] = useState('')
  const [msOutput, setMsOutput] = useState('')
  const [usOutput, setUsOutput] = useState('')
  const [nsOutput, setNsOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [live, setLive] = useState(true)
  const [inputSide, setInputSide] = useState<'ts' | 'date' | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  function getNow(): number {
    return Math.floor(Date.now() / 1000)
  }

  function updateOutputs(sec: number) {
    const d = new Date(sec * 1000)
    setTsOutput(String(sec))
    setDateOutput(formatDateTime(sec))
    const ms = d.getTime()
    setMsOutput(String(ms))
    setUsOutput(String(ms * 1000))
    setNsOutput(String(ms * 1000000))
  }

  function startLive() {
    setLive(true)
    setTsInput('')
    setInputSide(null)
    setErrorMsg('')
    updateOutputs(getNow())
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      updateOutputs(getNow())
    }, 1000)
  }

  function stopLive() {
    setLive(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  useEffect(() => {
    startLive()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTsFocus() {
    setInputSide('ts')
    stopLive()
  }

  function handleDateFocus() {
    setInputSide('date')
    stopLive()
  }

  function handleTsInput(val: string) {
    setTsInput(val)
    if (val === '') { startLive(); return }
  }

  function handleDateInput(val: string) {
    if (val === '') { startLive(); return }
  }

  function doConvert() {
    setErrorMsg('')
    if (inputSide === 'ts' && tsInput.trim()) {
      if (!/^\d{10}$/.test(tsInput.trim())) {
        setErrorMsg('仅支持秒级时间戳（10位数字）')
        return
      }
      updateOutputs(Number(tsInput.trim()))
    } else if (inputSide === 'date' && dateInputRef.current?.value) {
      const d = new Date(dateInputRef.current.value)
      if (isNaN(d.getTime())) {
        setErrorMsg('日期格式无效')
        return
      }
      const sec = Math.floor(d.getTime() / 1000)
      setTsOutput(String(sec))
      updateOutputs(sec)
    }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' }) }
    catch { dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' }) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <Button icon={<ArrowSyncRegular />} size="small" onClick={startLive}>刷新</Button>
          <Button size="small" appearance="primary" style={{ marginLeft: '8px' }} onClick={doConvert}>转换</Button>
        </div>
        <div className={styles.toolbarRight}>
          {live && <span className={styles.liveBadge}>实时更新中...</span>}
        </div>
      </div>

      <div className={styles.textRow}>
        {/* Left: Date/Time */}
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>日期时间</span>
            {dateOutput && <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(dateOutput)}>复制</Button>}
          </div>
          <input
            ref={dateInputRef}
            type="datetime-local"
            step="1"
            className={styles.dateInput}
            onFocus={handleDateFocus}
            onChange={(e) => handleDateInput(e.target.value)}
          />
          {inputSide === 'date' && (
            <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={() => { if (dateInputRef.current) dateInputRef.current.value = ''; if (!tsInput) startLive() }}>清空</Button>
          )}
          {dateOutput && (
            <div className={styles.precisionRow}>
              <span className={styles.precisionValue}>{dateOutput}</span>
              <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(dateOutput)} />
            </div>
          )}
          {msOutput && (
            <div className={styles.precisionRow}>
              <span className={styles.precisionLabel}>毫秒</span>
              <span className={styles.precisionValue}>{msOutput}</span>
              <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(msOutput)} />
            </div>
          )}
          {usOutput && (
            <div className={styles.precisionRow}>
              <span className={styles.precisionLabel}>微秒</span>
              <span className={styles.precisionValue}>{usOutput}</span>
              <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(usOutput)} />
            </div>
          )}
          {nsOutput && (
            <div className={styles.precisionRow}>
              <span className={styles.precisionLabel}>纳秒</span>
              <span className={styles.precisionValue}>{nsOutput}</span>
              <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(nsOutput)} />
            </div>
          )}
        </div>

        {/* Right: Timestamp */}
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>时间戳 (秒)</span>
            {tsOutput && <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(tsOutput)}>复制</Button>}
          </div>
          <Input
            value={live ? tsOutput : tsInput}
            onFocus={handleTsFocus}
            onChange={(_, d) => handleTsInput(d.value)}
            placeholder="输入秒级时间戳..."
            style={{ fontFamily: "'JetBrains Mono', Consolas, monospace" }}
          />
          {errorMsg && <div className={styles.errorText}>{errorMsg}</div>}
          {inputSide === 'ts' && tsInput && (
            <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={() => { setTsInput(''); if (!dateInputRef.current?.value) startLive() }}>清空</Button>
          )}
        </div>
      </div>
    </div>
  )
}
