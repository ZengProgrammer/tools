import { useParams } from 'react-router-dom'
import TranslateView from './TranslateView'
import JsonView from './JsonView'
import SqlView from './SqlView'

export default function ToolStandalone() {
  const { tool } = useParams<{ tool: string }>()

  return (
    <div style={{ height: '100vh', overflow: 'hidden', padding: '12px' }}>
      {tool === 'translate' && <TranslateView />}
      {tool === 'json' && <JsonView />}
      {tool === 'sql' && <SqlView />}
    </div>
  )
}
