import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Textarea,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  hint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginTop: '8px',
  },
  code: {
    background: tokens.colorNeutralBackground4,
    color: tokens.colorBrandForeground1,
    padding: '1px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
})

interface PromptDialogProps {
  open: boolean
  systemPrompt: string
  onOpenChange: (open: boolean) => void
  onSystemPromptChange: (val: string) => void
}

export default function PromptDialog({
  open,
  systemPrompt,
  onOpenChange,
  onSystemPromptChange,
}: PromptDialogProps) {
  const styles = useStyles()

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>翻译提示词</DialogTitle>
          <Textarea
            value={systemPrompt}
            onChange={(_, data) => onSystemPromptChange(data.value)}
            rows={4}
            placeholder="自定义翻译提示词..."
          />
          <div className={styles.hint}>
            占位符 <code className={styles.code}>{'{source}'}</code> 源语言,{' '}
            <code className={styles.code}>{'{target}'}</code> 目标语言
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={() => onOpenChange(false)}>
            确定
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
