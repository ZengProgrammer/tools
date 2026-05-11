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
import { getHistory, getHistoryCount, deleteHistory, type HistoryRecord } from '../api/deepseek'

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
    minHeight: '120px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 14px',
    background: tokens.colorNeutralBackground4,
    borderRadius: '8px',
  },
  check: { flexShrink: 0, marginTop: '2px' },
  body: { flex: 1, minWidth: 0 },
  meta: { display: 'flex', gap: '8px', marginBottom: '3px', fontSize: '12px', alignItems: 'center' },
  langs: { fontWeight: 600, color: tokens.colorBrandForeground1 },
  model: { color: tokens.colorNeutralForeground4, fontSize: '11px' },
  time: {
    marginLeft: 'auto',
    color: tokens.colorNeutralForeground4,
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', Consolas, monospace",
  },
  texts: { display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '13px', lineHeight: 1.55 },
  text: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: tokens.colorNeutralForeground2,
  },
  textResult: { color: tokens.colorStatusSuccessForeground1 },
  arrow: { flexShrink: 0, color: tokens.colorBrandForeground1, fontWeight: 600, opacity: 0.6 },
  copyBtn: { flexShrink: 0, opacity: 0.5, transition: 'opacity 0.15s' },
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
})

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

const pageSizes = [5, 10, 20]

export default function HistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortDesc, setSortDesc] = useState(true)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = history.length > 0 && history.every((h) => selectedIds.has(h.id))
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

  function langLabel(v: string) {
    return languages.find((l) => l.value === v)?.label ?? v
  }

  async function copyText(text: string) {
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
    setSelectedIds(allSelected ? new Set() : new Set(history.map((h) => h.id)))
  }

  async function loadTotal() {
    setTotal(await getHistoryCount())
  }

  async function loadPage() {
    setLoading(true)
    try {
      const maxPage = Math.max(1, Math.ceil(total / pageSize))
      const p = page > maxPage ? maxPage : page
      if (p !== page) setPage(p)
      setHistory(await getHistory((p - 1) * pageSize, pageSize, sortDesc))
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

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<'selected' | 'all' | null>(null)

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    try {
      await deleteHistory([...selectedIds])
      const newTotal = await getHistoryCount()
      setTotal(newTotal)
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize))
      setSelectedIds(new Set())
      if (page > maxPage) {
        setPage(maxPage)
      } else {
        await loadPageWithTotal(newTotal)
      }
    } catch {}
  }

  async function loadPageWithTotal(currentTotal: number) {
    setLoading(true)
    try {
      const maxPage = Math.max(1, Math.ceil(currentTotal / pageSize))
      const p = page > maxPage ? maxPage : page
      if (p !== page) setPage(p)
      setHistory(await getHistory((p - 1) * pageSize, pageSize, sortDesc))
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'加载失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
    setLoading(false)
  }

  async function deleteAll() {
    try {
      await deleteHistory([])
      setPage(1)
      setTotal(0)
      setHistory([])
      setSelectedIds(new Set())
    } catch {}
  }

  function handleConfirmDelete() {
    setConfirmOpen(false)
    if (pendingDelete === 'selected') deleteSelected()
    else if (pendingDelete === 'all') deleteAll()
    setPendingDelete(null)
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
    <>
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ width: 'calc(100vw - 40px)', maxWidth: '1000px', height: 'calc(100vh - 80px)' }}>
        <DialogBody style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <DialogTitle>翻译历史</DialogTitle>

          <div className={styles.toolbar} style={{ flexShrink: 0 }}>
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
                  onClick={() => { setPendingDelete('selected'); setConfirmOpen(true) }}
                >
                  删除({selectedIds.size})
                </Button>
              )}
            </div>
            <div className={styles.toolbarRight}>
              <span
                className={`${styles.sortBtn} ${sortDesc ? styles.sortBtnActive : ''}`}
                onClick={() => setSortDesc(!sortDesc)}
                title="切换排序"
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
              <Button size="small" appearance="subtle" onClick={() => { setPendingDelete('all'); setConfirmOpen(true) }}>
                清空全部
              </Button>
            </div>
          </div>

          <div className={styles.list} style={{ flex: '1 1 0', minHeight: 0, overflow: 'auto' }}>
            {loading ? (
              <Spinner />
            ) : history.length === 0 ? (
              <div className={styles.empty}>暂无翻译记录</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    className={styles.check}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span className={styles.langs}>
                        {langLabel(item.source_lang)} → {langLabel(item.target_lang)}
                      </span>
                      <span className={styles.model}>{item.model}</span>
                      <span className={styles.time}>{formatTime(item.created_at)}</span>
                    </div>
                    <div className={styles.texts}>
                      <span className={styles.text}>{item.source_text}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyText(item.source_text)}
                        title="复制源文本"
                      />
                      <span className={styles.arrow}>→</span>
                      <span className={`${styles.text} ${styles.textResult}`}>{item.result_text}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyText(item.result_text)}
                        title="复制译文"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.pager} style={{ flexShrink: 0 }}>
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

          <DialogActions style={{ flexShrink: 0, justifyContent: 'flex-end' }}>
            <Button appearance="primary" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>

    <Dialog open={confirmOpen} onOpenChange={(_, d) => setConfirmOpen(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>确认删除</DialogTitle>
          {pendingDelete === 'selected'
            ? `确定删除选中的 ${selectedIds.size} 条记录？`
            : '确定删除所有翻译历史记录？此操作不可撤销！'}
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={() => setConfirmOpen(false)}>取消</Button>
          <Button appearance="primary" onClick={handleConfirmDelete}>确定</Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
    </>
  )
}
