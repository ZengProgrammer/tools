import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Textarea,
  Button,
  Input,
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
  Divider,
} from '@fluentui/react-components'
import { AddRegular, StarRegular, StarOffRegular } from '@fluentui/react-icons'
import {
  getPromptTemplates,
  savePromptTemplate,
  setDefaultPromptTemplate,
  type PromptTemplate,
} from '../api/deepseek'

const DEFAULT_PROMPT_CONTENT = '你是一名专业翻译。将以下文本从{source}翻译成{target}。只返回翻译结果，不要添加任何解释、注释或引号。'
const DEFAULT_PROMPT_DESC = '默认提示词'

const useStyles = makeStyles({
  hint: { fontSize: '12px', color: tokens.colorNeutralForeground4 },
  code: {
    background: tokens.colorNeutralBackground4, color: tokens.colorBrandForeground1,
    padding: '1px 6px', borderRadius: '4px', fontSize: '12px',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '12px' },
  templateRow: { display: 'flex', gap: '6px', alignItems: 'center' },
})

interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSystemPromptChange: (val: string) => void
}

export default function PromptDialog({
  open,
  onOpenChange,
  onSystemPromptChange,
}: PromptDialogProps) {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newContent, setNewContent] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)

  function loadTemplates() {
    getPromptTemplates().then(async (list) => {
      if (list.length === 0) {
        await savePromptTemplate(DEFAULT_PROMPT_DESC, DEFAULT_PROMPT_CONTENT)
        const updated = await getPromptTemplates()
        setTemplates(updated)
        setSelectedId(updated[0]?.id ?? null)
      } else {
        setTemplates(list)
        const def = list.find((t) => t.is_default)
        setSelectedId(def ? def.id : list[0].id)
      }
    }).catch(() => {})
  }

  useEffect(() => {
    if (open) loadTemplates()
  }, [open])

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  function handleSelect(id: number) {
    setSelectedId(id)
    const t = templates.find((tmpl) => tmpl.id === id)
    if (t) onSystemPromptChange(t.content)
  }

  async function handleCreate() {
    if (!newDesc.trim() || !newContent.trim()) {
      dispatchToast(<Toast><ToastTitle>描述和内容不能为空</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    try {
      await savePromptTemplate(newDesc.trim(), newContent.trim())
      dispatchToast(<Toast><ToastTitle>模板已创建</ToastTitle></Toast>, { intent: 'success' })
      setShowNew(false); setNewDesc(''); setNewContent('')
      loadTemplates()
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'创建失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  async function handleSetDefault() {
    if (!selectedId) return
    try {
      await setDefaultPromptTemplate(selectedId)
      dispatchToast(<Toast><ToastTitle>已设为默认提示词</ToastTitle></Toast>, { intent: 'success' })
      loadTemplates()
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'设置失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function handleConfirm() {
    if (selectedTemplate) onSystemPromptChange(selectedTemplate.content)
    onOpenChange(false)
  }

  function optionText(t: PromptTemplate) {
    return `${t.description}${t.is_default ? ' (默认)' : ''}`
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) setCancelConfirm(true) }}>
      <DialogSurface style={{ width: 'calc(100vw - 40px)', maxWidth: '700px' }}>
        <DialogBody style={{ display: 'block' }}>
          <DialogTitle style={{ textAlign: 'center' }}>翻译提示词</DialogTitle>

          <div className={styles.section}>
            {/* Template selector */}
            <div className={styles.templateRow} style={{ justifyContent: 'flex-end' }}>
              <Dropdown
                value={selectedId ? optionText(selectedTemplate!) : ''}
                selectedOptions={selectedId ? [String(selectedId)] : []}
                onOptionSelect={(_, d) => handleSelect(Number(d.optionValue))}
                style={{ flex: 1 }}
                placeholder="选择提示词模板..."
              >
                {templates.map((t) => (
                  <Option key={t.id} value={String(t.id)} text={optionText(t)}>
                    {optionText(t)}
                  </Option>
                ))}
              </Dropdown>
              <Button
                icon={selectedTemplate?.is_default ? <StarRegular /> : <StarOffRegular />}
                size="small"
                disabled={!selectedId || selectedTemplate?.is_default}
                onClick={handleSetDefault}
                title="设为默认"
              />
              <Button icon={<AddRegular />} size="small" onClick={() => setShowNew(true)} title="新建模板" />
            </div>

            <Divider />

            {/* Prompt editor */}
            <div style={{ width: '100%' }}>
              <Textarea
                value={selectedTemplate?.content ?? ''}
                onChange={(_, data) => { if (selectedTemplate) onSystemPromptChange(data.value) }}
                rows={8}
                placeholder="选择模板以编辑提示词..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Placeholder hint */}
            <div className={styles.hint} style={{ textAlign: 'right' }}>
              <code className={styles.code}>{'{source}'}</code> 源语言{'  '}
              <code className={styles.code}>{'{target}'}</code> 目标语言
            </div>
          </div>
        </DialogBody>
        <DialogActions style={{ justifyContent: 'space-between' }}>
          <Button appearance="secondary" onClick={() => setCancelConfirm(true)}>取消</Button>
          <Button appearance="primary" onClick={handleConfirm}>确认</Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>

    {/* New template dialog */}
    <Dialog open={showNew} onOpenChange={(_, d) => setShowNew(d.open)}>
      <DialogSurface>
        <DialogBody style={{ display: 'block' }}>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ flexShrink: 0 }}>新建模板</span>
            <Input value={newDesc} onChange={(_, d) => setNewDesc(d.value)} placeholder="模板描述（必填）" style={{ flex: 1 }} />
          </DialogTitle>
          <div style={{ width: '100%' }}>
            <Textarea value={newContent} onChange={(_, d) => setNewContent(d.value)} placeholder="提示词内容（必填）" rows={6} style={{ width: '100%', resize: 'vertical' }} />
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={() => { setShowNew(false); setNewDesc(''); setNewContent('') }}>取消</Button>
          <Button appearance="primary" onClick={handleCreate}>创建</Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>

    {/* Cancel confirmation */}
    <Dialog open={cancelConfirm} onOpenChange={(_, d) => setCancelConfirm(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>取消修改</DialogTitle>
          确定要退出吗？所有未保存的设置和选择将被丢弃。
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={() => setCancelConfirm(false)}>取消</Button>
          <Button appearance="primary" onClick={() => { setCancelConfirm(false); onOpenChange(false) }}>确认</Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
    </>
  )
}
