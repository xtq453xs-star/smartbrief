import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ color = '#999', separatorColor = '#ddd' }) => {
  return (
    <div style={{ ...styles.container, color: color }}>
      <Link to="/terms" style={{ ...styles.link, color: color }}>
        利用規約
      </Link>
      
      <span style={{ ...styles.sep, color: separatorColor }}>|</span>
      
      <Link to="/privacy" style={{ ...styles.link, color: color }}>
        プライバシーポリシー
      </Link>
      
      <span style={{ ...styles.sep, color: separatorColor }}>|</span>
      
      <Link to="/legal" style={{ ...styles.link, color: color }}>
        特定商取引法に基づく表記
      </Link>
      
      <p style={{ ...styles.copyright, color: color }}>© 2025 SmartBrief Library</p>
    </div>
  );
};

const styles = {
  container: { 
    textAlign: 'center', fontSize: '11px', padding: '20px 0', 
    fontFamily: '"Shippori Mincho", sans-serif' 
  },
  link: { 
    background: 'none', border: 'none', cursor: 'pointer', 
    textDecoration: 'underline', fontSize: '11px', padding: '0 5px',
    fontFamily: 'inherit',
    display: 'inline-block' // リンクの挙動を安定させるため
  },
  sep: { margin: '0 5px' },
  copyright: { marginTop: '10px', fontSize: '11px', opacity: 0.8, fontFamily: 'sans-serif' }
};

export default Footer;