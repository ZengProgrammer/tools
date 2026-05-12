import { useNavigate } from 'react-router-dom'
import { Card, makeStyles, tokens } from '@fluentui/react-components'
import { MicRegular, CodeRegular, DataAreaRegular, ClockRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  home: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  hero: {
    textAlign: 'center',
    padding: '48px 0 56px',
  },
  title: {
    fontSize: '30px',
    fontWeight: 800,
    letterSpacing: '4px',
    lineHeight: '42px',
    margin: '0 0 8px',
    background: `linear-gradient(135deg, ${tokens.colorBrandForeground1}, ${tokens.colorBrandForeground2})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    margin: 0,
  },
  divider: {
    width: '50px',
    height: '2px',
    margin: '14px auto 0',
    background: `linear-gradient(90deg, transparent, ${tokens.colorBrandForeground1}, transparent)`,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  cardInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorBrandForeground1,
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  toolBody: {
    flex: 1,
    minWidth: 0,
  },
  toolName: {
    fontSize: '15px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    margin: '0 0 3px',
  },
  desc: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    margin: '0 0 3px',
  },
  detail: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    margin: 0,
    lineHeight: 1.5,
  },
  arrow: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    opacity: 0.4,
  },
})

const tools = [
  {
    name: '翻译工具',
    desc: '基于 DeepSeek AI 的智能翻译',
    detail: '支持中英韩日德法阿互译，自定义提示词，翻译历史记录。',
    route: '/translate',
    icon: MicRegular,
  },
  {
    name: 'JSON 工具',
    desc: 'JSON 格式化 / 校验 / 压缩',
    detail: '实时检测 JSON 格式是否正确，支持缩进切换、Key 排序、一键压缩。',
    route: '/json',
    icon: CodeRegular,
  },
  {
    name: 'SQL 工具',
    desc: 'SQL 格式化 / 压缩',
    detail: '支持 SQLite、MySQL、PostgreSQL、TSQL、MariaDB 方言，关键字大小写切换。',
    route: '/sql',
    icon: DataAreaRegular,
  },
  {
    name: '时间戳',
    desc: '时间戳 / 日期时间双向转换',
    detail: '支持秒/毫秒/微秒/纳秒，实时时钟，一键复制。',
    route: '/timestamp',
    icon: ClockRegular,
  },
]

export default function HomeView() {
  const styles = useStyles()
  const navigate = useNavigate()

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <h1 className={styles.title}>工具箱</h1>
        <p className={styles.subtitle}>实用桌面工具集合</p>
        <div className={styles.divider} />
      </div>

      <div className={styles.grid}>
        {tools.map((tool) => (
          <Card key={tool.name} className={styles.card} onClick={() => navigate(tool.route)}>
            <div className={styles.cardInner}>
              <div className={styles.iconWrap}>
                <tool.icon fontSize={24} />
              </div>
              <div className={styles.toolBody}>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.desc}>{tool.desc}</p>
                <p className={styles.detail}>{tool.detail}</p>
              </div>
              <tool.icon className={styles.arrow} fontSize={18} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
