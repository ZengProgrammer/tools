import { useState } from 'react'
import {
  Button,
  Input,
  Toast,
  ToastTitle,
  useToastController,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { SearchRegular, CopyRegular } from '@fluentui/react-icons'
import { resolveDns, pingDomain, checkSsl, type DnsResult, type PingResult, type SslResult } from '../api/deepseek'

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  domainInput: { flex: 1 },
  resultCard: { padding: '14px 18px', borderRadius: '8px', border: `1px solid ${tokens.colorNeutralStroke1}` },
  sectionTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '8px' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px' },
  label: { color: tokens.colorNeutralForeground4, flexShrink: 0 },
  value: { color: tokens.colorNeutralForeground2, wordBreak: 'break-all' },
  valueOk: { color: tokens.colorStatusSuccessForeground1 },
  valueWarn: { color: tokens.colorStatusWarningForeground1 },
  valueErr: { color: tokens.colorStatusDangerForeground1 },
  addrList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  addrBadge: {
    fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '13px',
    padding: '4px 10px', borderRadius: '4px',
    background: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground1,
  },
  section: { display: 'flex', flexDirection: 'column', gap: '12px' },
})

export default function DomainView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()
  const [domain, setDomain] = useState('')
  const [checking, setChecking] = useState(false)
  const [dns, setDns] = useState<DnsResult | null>(null)
  const [ping, setPing] = useState<PingResult | null>(null)
  const [ssl, setSsl] = useState<SslResult | null>(null)

  async function doCheck() {
    const d = domain.trim()
    if (!d) {
      dispatchToast(<Toast><ToastTitle>请输入域名</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    // Strip protocol
    const clean = d.replace(/^https?:\/\//, '').split('/')[0]
    setChecking(true)
    setDns(null); setPing(null); setSsl(null)

    const [dnsR, pingR, sslR] = await Promise.all([
      resolveDns(clean).catch(e => ({ addresses: [], error: String(e) } as DnsResult)),
      pingDomain(clean).catch(e => ({ success: false, output: String(e), stats: null } as PingResult)),
      checkSsl(clean).catch(e => ({ valid: false, subject: null, issuer: null, not_before: null, not_after: null, days_remaining: null, error: String(e) } as SslResult)),
    ])
    setDns(dnsR)
    setPing(pingR)
    setSsl(sslR)
    setChecking(false)
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' }) }
    catch { dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' }) }
  }

  function daysStyle(days: number | null) {
    if (days === null) return styles.value
    if (days <= 0) return styles.valueErr
    if (days < 30) return styles.valueWarn
    return styles.valueOk
  }

  return (
    <div className={styles.page}>
      <div className={styles.inputRow}>
        <Input
          className={styles.domainInput}
          value={domain}
          onChange={(_, d) => setDomain(d.value)}
          placeholder="输入域名，如 example.com"
          onKeyDown={(e) => { if (e.key === 'Enter') doCheck() }}
          size="large"
        />
        <Button icon={<SearchRegular />} appearance="primary" size="large" disabled={checking} onClick={doCheck}>
          检测
        </Button>
      </div>

      {checking && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size="medium" /></div>
      )}

      {!checking && (dns || ping || ssl) && (
        <div className={styles.section}>
          {/* DNS */}
          {dns && (
            <div className={styles.resultCard}>
              <div className={styles.sectionTitle}>DNS 解析</div>
              {dns.error ? (
                <span className={styles.valueErr}>{dns.error}</span>
              ) : (
                <div className={styles.addrList}>
                  {dns.addresses.map((a, i) => (
                    <span key={i} className={styles.addrBadge}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ping */}
          {ping && (
            <div className={styles.resultCard}>
              <div className={styles.sectionTitle}>
                Ping 检测 {' '}
                {ping.stats && (
                  <span className={ping.stats.lost === 4 ? styles.valueErr : styles.valueOk}>
                    ({ping.stats.received}/{ping.stats.sent} 响应, {ping.stats.lost === 4 ? '超时' : `${ping.stats.avg_ms}ms`})
                  </span>
                )}
              </div>
              {ping.stats ? (
                <div>
                  <div className={styles.itemRow}>
                    <span className={styles.label}>最小/最大/平均</span>
                    <span className={styles.value}>{ping.stats.min_ms}ms / {ping.stats.max_ms}ms / {ping.stats.avg_ms}ms</span>
                  </div>
                  <div className={styles.itemRow}>
                    <span className={styles.label}>丢包</span>
                    <span className={ping.stats.lost > 0 ? styles.valueErr : styles.valueOk}>{ping.stats.lost} ({ping.stats.lost * 100 / ping.stats.sent}%)</span>
                  </div>
                </div>
              ) : (
                <div className={styles.itemRow}><span className={styles.valueErr}>{ping.output}</span></div>
              )}
            </div>
          )}

          {/* SSL */}
          {ssl && (
            <div className={styles.resultCard}>
              <div className={styles.sectionTitle}>
                SSL 证书 {' '}
                {ssl.error ? (
                  <span className={styles.valueErr}>(无证书或连接失败)</span>
                ) : ssl.valid ? (
                  <span className={styles.valueOk}>(有效)</span>
                ) : (
                  <span className={styles.valueErr}>(已过期)</span>
                )}
              </div>
              {ssl.error && <span className={styles.valueErr}>{ssl.error}</span>}
              {ssl.subject && (
                <div className={styles.itemRow}>
                  <span className={styles.label}>颁发给</span>
                  <span className={styles.value}>{ssl.subject}</span>
                  <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={() => copyText(ssl.subject!)} />
                </div>
              )}
              {ssl.issuer && (
                <div className={styles.itemRow}>
                  <span className={styles.label}>颁发者</span>
                  <span className={styles.value}>{ssl.issuer}</span>
                </div>
              )}
              {ssl.not_before && (
                <div className={styles.itemRow}>
                  <span className={styles.label}>有效期</span>
                  <span className={styles.value}>{ssl.not_before} ~ {ssl.not_after}</span>
                </div>
              )}
              {ssl.days_remaining != null && (
                <div className={styles.itemRow}>
                  <span className={styles.label}>剩余天数</span>
                  <span className={daysStyle(ssl.days_remaining)}>
                    {ssl.days_remaining > 0 ? `${ssl.days_remaining} 天` : '已过期'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!checking && !dns && !ping && !ssl && (
        <div style={{ textAlign: 'center', color: tokens.colorNeutralForeground4, padding: '60px 0', fontSize: '14px' }}>
          输入域名开始检测
        </div>
      )}
    </div>
  )
}
