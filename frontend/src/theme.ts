// src/theme.js

export const theme = {
  colors: {
    primary: '#1e2a4a',       // 勝色（メイン）
    primaryHover: '#2c3e50',
    accent: '#e6bf00',        // 山吹色（アクセント）
    background: '#fdfbf7',    // クリーム色（背景）
    surface: '#ffffff',       // カード背景
    textMain: '#333333',      // 墨色
    textSub: '#718096',       // 鈍色
    border: '#e2e8f0',        // 薄いグレー
    error: '#e53e3e',
  },
  fonts: {
    heading: '"Shippori Mincho", serif',
    body: '"Noto Sans JP", sans-serif',
  },
  ui: {
    // 【共通カード】: これを使えば全ページのカードデザインが揃う
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
      borderTop: '6px solid #1e2a4a', // primary color
    },
    // 【標準ボタン】: 四角いタイプ（フォーム送信など）
    buttonPrimary: {
      backgroundColor: '#1e2a4a',
      color: '#fff',
      border: 'none',
      borderRadius: '4px', // 角を少しだけ丸く
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      padding: '10px 20px',
      fontSize: '14px',
    },
    // 【ピル型ボタン】: 丸いタイプ（リンクや強調アクション）
    buttonPill: {
      backgroundColor: '#1e2a4a',
      color: '#fff',
      border: 'none',
      borderRadius: '30px', // 完全に丸く
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      padding: '10px 24px',
      fontSize: '14px',
    }
  }
};