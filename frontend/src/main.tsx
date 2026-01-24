import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx' // App.jsxはまだJSXのままでもOK（allowJs: true設定のおかげ）

// 「!」は「rootは絶対にあるから安心して！」というTSへのサインです
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)