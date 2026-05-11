import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

const LOADING_DURATION = 3000
const t0 = performance.now()

const root = createRoot(document.getElementById('root')!)

function render() {
  root.render(<App />)
}

const elapsed = performance.now() - t0
if (elapsed >= LOADING_DURATION) {
  render()
} else {
  setTimeout(render, LOADING_DURATION - elapsed)
}
