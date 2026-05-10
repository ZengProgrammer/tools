import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Button,
  Checkbox,
  Dropdown,
  Option,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  ArrowSyncRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  CopyRegular,
} from '@fluentui/react-icons'
import { getInputHistory, getInputHistoryCount, deleteInputHistory, type InputRecord } from '../api/deepseek'

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexWrap: 'wrap',
    gap: '8px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  sortBtn: {
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: tokens.colorNeutralForeground4,
    transition: 'all 0.15s',
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '50vh',
    overflowY: 'auto',
    minHeight: '100px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 12px',
    background: tokens.colorNeutralBackground4,
    borderRadius: '8px',
  },
  check: { flexShrink: 0, marginTop: '4px' },
  body: { flex: 1, minWidth: 0 },
  meta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  time: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    fontFamily: "'JetBrains Mono', Consolas, monospace",
  },
  text: {
    margin: 0,
    padding: '8px 10px',
    background: '#1a1a2e',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '6px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: '12px',
    lineHeight: 1.55,
    color: '#c0c0d8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflowY: 'auto',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  empty: { textAlign: 'center', color: tokens.colorNeutralForeground4, padding: '50px 0', fontSize: '14px' },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
    paddingTop: '10px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  pages: { display: 'flex', alignItems: 'center', gap: '2px' },
  pageInfo: { fontSize: '13px', color: tokens.colorNeutralForeground2, padding: '0 8px' },
  total: { fontSize: '12px', color: tokens.colorNeutralForeground4, marginLeft: 'auto' },
  copyBtn: { opacity: 0, transition: 'opacity 0.15s' },
})

const pageSizes = [5, 10, 20]

interface InputHistoryDialogProps {
  open: boolean
  tool: string
  onOpenChange: (open: boolean) => void
  onUseText: (text: string) => void
}

export default function InputHistoryDialog({
  open,
  tool,
  onOpenChange,
  onUseText,
}: InputHistoryDialogProps) {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [records, setRecords] = useState<InputRecord[]>([])
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortDesc, setSortDesc] = useState(true)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id))
  const anySelected = selectedIds.size > 0
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = anySelected && !allSelected
    }
  }, [anySelected, allSelected])

  function formatTime(dt: string) {
    if (!dt) return ''
    const d = dt.replace('T', ' ').replace('Z', '')
    return d.length >= 19 ? d.substring(0, 19) : d
  }

  async function copyItem(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(records.map((r) => r.id)))
  }

  async function loadTotal() {
    setTotal(await getInputHistoryCount(tool))
  }

  async function loadPage() {
    setLoading(true)
    try {
      const maxPage = Math.max(1, Math.ceil(total / pageSize))
      const p = page > maxPage ? maxPage : page
      if (p !== page) setPage(p)
      setRecords(await getInputHistory(tool, (p - 1) * pageSize, pageSize, sortDesc))
      setSelectedIds(new Set())
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'加载失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
    setLoading(false)
  }

  async function fullReload() {
    await loadTotal()
    await loadPage()
  }

  async function goPage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  async function refresh() {
    setPage(1)
    await fullReload()
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    try {
      await deleteInputHistory(tool, [...selectedIds])
      setTotal(await getInputHistoryCount(tool))
      setSelectedIds(new Set())
      await loadPage()
    } catch {}
  }

  async function deleteAll() {
    try {
      await deleteInputHistory(tool, [])
      setPage(1)
      setTotal(0)
      setRecords([])
      setSelectedIds(new Set())
    } catch {}
  }

  function useRecord(text: string) {
    onUseText(text)
    onOpenChange(false)
  }

  const handleOpen = useCallback(() => {
    setPage(1)
    setSelectedIds(new Set())
    fullReload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open) handleOpen()
  }, [open, handleOpen])

  useEffect(() => {
    if (open) { loadPage() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortDesc])

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>输入历史</DialogTitle>

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <Checkbox
                ref={allCheckboxRef}
                checked={allSelected}
                onChange={toggleAll}
                label="全选"
              />
              {anySelected && (
                <Button
                  icon={<DeleteRegular />}
                  size="small"
                  appearance="primary"
                  onClick={deleteSelected}
                >
                  删除({selectedIds.size})
                </Button>
              )}
            </div>
            <div className={styles.toolbarRight}>
              <span
                className={`${styles.sortBtn} ${sortDesc ? styles.sortBtnActive : ''}`}
                onClick={() => setSortDesc(!sortDesc)}
                title="排序"
              >
                {sortDesc ? <ArrowSortDownRegular fontSize={16} /> : <ArrowSortUpRegular fontSize={16} />}
              </span>
              <Button
                icon={<ArrowSyncRegular />}
                size="small"
                appearance="subtle"
                disabled={loading}
                onClick={refresh}
              >
                刷新
              </Button>
              <Button size="small" appearance="subtle" onClick={deleteAll}>
                清空全部
              </Button>
            </div>
          </div>

          <div className={styles.list}>
            {loading ? (
              <Spinner />
            ) : records.length === 0 ? (
              <div className={styles.empty}>暂无记录（双击可回填）</div>
            ) : (
              records.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    className={styles.check}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span className={styles.time}>{formatTime(item.created_at)}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyItem(item.input_text)}
                        title="复制"
                      />
                    </div>
                    <pre className={styles.text} onDoubleClick={() => useRecord(item.input_text)}>
                      {item.input_text}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.pager}>
            <Dropdown
              value={String(pageSize)}
              onOptionSelect={(_, data) => setPageSize(Number(data.optionValue))}
              style={{ width: '80px' }}
              size="small"
            >
              {pageSizes.map((s) => (
                <Option key={s} value={String(s)} text={`${s}条/页`}>
                  {s}条/页
                </Option>
              ))}
            </Dropdown>
            <div className={styles.pages}>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(1)}>
                «
              </Button>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                ‹
              </Button>
              <span className={styles.pageInfo}>
                {page} / {totalPages}
              </span>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                ›
              </Button>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(totalPages)}
              >
                »
              </Button>
            </div>
            <span className={styles.total}>共 {total} 条</span>
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
