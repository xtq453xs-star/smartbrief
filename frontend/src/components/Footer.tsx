import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../theme'; 

// ★ 1. Props の型を定義
interface FooterProps {
  color?: string;
  separatorColor?: string;
}

// デフォルト値を theme.js から取得するように変更
const Footer: React.FC<FooterProps> = ({ 
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

// ★ 2. Record<string, React.CSSProperties> を追加！
const styles: Record<string, React.CSSProperties> = {
  footer: {
    padding: '40px 0', 
    textAlign: 'center',
    borderTop: `1px solid ${theme.colors.border}`, 
    marginTop: 'auto', 
    fontFamily: theme.fonts.heading, 
    backgroundColor: 'transparent', 
  },
  linkContainer: {
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px', 
    flexWrap: 'wrap', 
  },
  link: {
    textDecoration: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
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
    fontFamily: theme.fonts.body, 
    margin: 0,
    letterSpacing: '0.05em',
  }
};

export default Footer;