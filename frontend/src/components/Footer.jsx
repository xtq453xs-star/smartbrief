import { Link } from 'react-router-dom';
import { theme } from '../theme'; // ★ theme.js をインポート

// デフォルト値を theme.js から取得するように変更
const Footer = ({ 
  color = theme.colors.textSub, 
  separatorColor = theme.colors.border 
}) => {
  return (
    <footer style={styles.footer}>
      <div style={styles.linkContainer}>
        <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ ...styles.link, color }}>
          利用規約
        </Link>
        <span style={{ ...styles.sep, color: separatorColor }}>|</span>
        
        {/* ★Stripe審査で最重要項目★ */}
        <Link to="/legal" target="_blank" rel="noopener noreferrer" style={{ ...styles.link, color }}>
          特定商取引法に基づく表記
        </Link>
        
        <span style={{ ...styles.sep, color: separatorColor }}>|</span>
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ ...styles.link, color }}>
          プライバシーポリシー
        </Link>
      </div>
      <p style={{ ...styles.copyright, color }}>© 2025 SmartBrief Library</p>
    </footer>
  );
};

// theme.js を活用したスタイル定義
const styles = {
  footer: {
    padding: '40px 0', // 少しゆとりを持たせる
    textAlign: 'center',
    // 境界線を theme.colors.border に合わせる（薄くしたい場合は透明度を入れてもOK）
    borderTop: `1px solid ${theme.colors.border}`, 
    marginTop: 'auto', 
    fontFamily: theme.fonts.heading, // 明朝体で上品に
    backgroundColor: 'transparent', // 背景色は親要素に任せる
  },
  linkContainer: {
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px', // ここも gap で制御するとスマートです
    flexWrap: 'wrap', // スマホで折り返せるように
  },
  link: {
    textDecoration: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    // ホバー時の色はCSSで制御するのが理想ですが、インラインならこれでシンプルに
    opacity: 0.8,
  },
  sep: {
    margin: '0 8px',
    fontSize: '10px',
    opacity: 0.6,
  },
  copyright: {
    fontSize: '11px',
    opacity: 0.7,
    fontFamily: theme.fonts.body, // コピーライトは読みやすいゴシックで
    margin: 0,
    letterSpacing: '0.05em',
  }
};

export default Footer;