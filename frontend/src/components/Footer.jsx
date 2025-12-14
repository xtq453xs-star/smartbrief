import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ color = '#8d6e63', separatorColor = '#d7ccc8' }) => {
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

const styles = {
  footer: {
    padding: '30px 0',
    textAlign: 'center',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    marginTop: 'auto', // 最下部に固定
    fontFamily: '"Shippori Mincho", "Yu Mincho", serif',
  },
  linkContainer: {
    marginBottom: '10px',
  },
  link: {
    textDecoration: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'opacity 0.2s',
  },
  sep: {
    margin: '0 10px',
    fontSize: '10px',
  },
  copyright: {
    fontSize: '11px',
    opacity: 0.8,
    fontFamily: '"Noto Sans JP", sans-serif',
    margin: 0,
  }
};

export default Footer;