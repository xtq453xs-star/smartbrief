import React from 'react';

const Footer = ({ color = '#999', separatorColor = '#ddd' }) => {
  
  // リンクをクリックした時の動作
  // 現状はアラートですが、将来的に専用ページを作ったら navigate('/terms') などに変えればOK
  const handleLegalClick = (e) => {
    e.preventDefault();
    alert("利用規約・プライバシーポリシー・特商法表記は、\nログイン画面（トップページ）下部にてご確認いただけます。");
  };

  return (
    <div style={{ ...styles.container, color: color }}>
      <button onClick={handleLegalClick} style={{ ...styles.link, color: color }}>利用規約</button>
      <span style={{ ...styles.sep, color: separatorColor }}>|</span>
      <button onClick={handleLegalClick} style={{ ...styles.link, color: color }}>プライバシーポリシー</button>
      <span style={{ ...styles.sep, color: separatorColor }}>|</span>
      <button onClick={handleLegalClick} style={{ ...styles.link, color: color }}>特定商取引法に基づく表記</button>
      
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
    fontFamily: 'inherit'
  },
  sep: { margin: '0 5px' },
  copyright: { marginTop: '10px', fontSize: '11px', opacity: 0.8, fontFamily: 'sans-serif' }
};

export default Footer;