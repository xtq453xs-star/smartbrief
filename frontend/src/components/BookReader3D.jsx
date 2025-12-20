import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';

// 長いテキストをページごとに分割する関数
// ★修正: PC版で文字数が増えることを考慮し、1ページあたりの文字数を調整可能に
const splitTextToPages = (text, charsPerPage) => {
  if (!text) return [];
  const pages = [];
  for (let i = 0; i < text.length; i += charsPerPage) {
    pages.push(text.slice(i, i + charsPerPage));
  }
  return pages;
};

// 1ページ分のコンポーネント
const Page = React.forwardRef((props, ref) => {
  // 影のスタイル（前回と同じ）
  let shadowStyle = {};
  if (props.isCover) {
     shadowStyle = { boxShadow: 'inset 15px 0 20px -10px rgba(0, 0, 0, 0.2)' };
  } else if (props.isBackCover) {
     shadowStyle = { boxShadow: 'inset -15px 0 20px -10px rgba(0, 0, 0, 0.2)' };
  } else if (props.number) {
     const pageNum = parseInt(props.number);
     if (pageNum % 2 !== 0) {
        shadowStyle = { boxShadow: 'inset -30px 0 40px -20px rgba(0, 0, 0, 0.15)' };
     } else {
        shadowStyle = { boxShadow: 'inset 30px 0 40px -20px rgba(0, 0, 0, 0.15)' };
     }
  }

  // ★修正: 文字サイズや行間を動的に受け取る
  const textStyle = {
      ...styles.textArea,
      fontSize: props.fontSize || '16px',
      lineHeight: props.lineHeight || '2.0'
  };

  return (
    <div className="page" ref={ref}>
      <div style={{...styles.pageInterior, ...shadowStyle}}>
        <div style={styles.pageContent}>
          <div style={styles.pageHeader}>{props.number}</div>
          
          {/* 本文エリア */}
          <div style={textStyle}>
            {props.children}
          </div>
          
          <div style={styles.pageFooter}>{props.title}</div>
        </div>
      </div>
    </div>
  );
});

const BookReader3D = ({ title, bodyText, onClose }) => {
  const bookRef = useRef();
  
  // ★追加: 画面サイズに応じた設定を管理するState
  const [bookSettings, setBookSettings] = useState({
      width: 350,
      height: 500,
      fontSize: '16px',
      lineHeight: '2.0',
      charsPerPage: 350,
      isMobile: true
  });

  // ★追加: リサイズ検知ロジック
  useEffect(() => {
    const handleResize = () => {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // PC基準（幅が768px以上）
        if (winWidth > 768) {
            // 画面の高さの85%くらいを本にする（最大800px）
            const newHeight = Math.min(winHeight * 0.85, 800);
            // 黄金比に近い比率 (1 : 1.41) で幅を決める
            const newWidth = Math.floor(newHeight * 0.70);
            
            setBookSettings({
                width: newWidth,
                height: Math.floor(newHeight),
                fontSize: '19px',      // PCなら文字大きく
                lineHeight: '2.2',     // 行間もゆったり
                charsPerPage: 550,     // ページが広い分、文字数も増やす
                isMobile: false
            });
        } else {
            // スマホ基準（既存設定）
            setBookSettings({
                width: 350,
                height: 500,
                fontSize: '16px',
                lineHeight: '2.0',
                charsPerPage: 350,
                isMobile: true
            });
        }
    };

    // 初回実行
    handleResize();
    // リサイズイベント登録
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeText = bodyText || "本文データがありません。";
  // 設定に基づいてページ分割を実行
  const pages = splitTextToPages(safeText, bookSettings.charsPerPage);

  return (
    <div style={styles.overlay}>
      <button onClick={onClose} style={styles.closeBtn}>× 閉じる</button>
      
      <div style={styles.bookContainer}>
        <HTMLFlipBook 
          width={bookSettings.width} 
          height={bookSettings.height} 
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="flip-book"
          ref={bookRef}
          // ★重要: keyを変えることで、PC/スマホ切り替え時に再描画させる
          key={bookSettings.isMobile ? 'mobile' : 'pc'}
        >
          {/* --- 表紙 --- */}
          <Page number="" title="" isCover={true} fontSize={bookSettings.fontSize}>
             <div style={{...styles.pageInterior, ...styles.coverPage}}>
                <div style={styles.coverBorder}>
                  <h2 style={styles.coverTitle}>{title}</h2>
                  <p style={styles.coverText}>ページをめくって<br/>お読みください</p>
                </div>
             </div>
          </Page>

          {/* --- 本文ページ --- */}
          {pages.map((text, i) => (
             <Page 
                key={i} 
                number={i + 1} 
                title={title}
                fontSize={bookSettings.fontSize}     // 文字サイズを渡す
                lineHeight={bookSettings.lineHeight} // 行間を渡す
             >
               {text}
             </Page>
          ))}

          {/* --- 裏表紙 --- */}
          <Page number="" title="" isBackCover={true} fontSize={bookSettings.fontSize}>
             <div style={{...styles.pageInterior, ...styles.coverPage}}>
                <div style={styles.coverBorder}>
                  <p style={styles.coverText}>読了</p>
                </div>
             </div>
          </Page>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

// スタイル定義（基本はそのまま）
const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  },
  closeBtn: { 
    position: 'absolute', top: '20px', right: '20px',
    padding: '10px 24px', borderRadius: '30px', border: 'none', 
    background: '#fff', cursor: 'pointer', fontWeight: 'bold',
    zIndex: 10000, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  },
  bookContainer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    width: '100%', height: '100%' // コンテナ自体も広げる
  },
  pageInterior: {
    backgroundColor: '#fdfbf7',
    width: '100%',
    height: '100%',
    padding: '20px',
    boxSizing: 'border-box',
    border: '1px solid #d7ccc8',
    color: '#333',
    overflow: 'hidden',
    position: 'relative'
  },
  pageContent: { 
    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' 
  },
  pageHeader: { fontSize: '10px', color: '#999', textAlign: 'right', fontFamily: 'serif' },
  textArea: { 
    flex: 1, 
    // fontSize, lineHeight は動的に上書きされるためここではデフォルト値
    fontFamily: '"Shippori Mincho", "Yu Mincho", serif', 
    textAlign: 'justify', 
    whiteSpace: 'pre-wrap', 
    overflow: 'hidden', 
    padding: '10px 0'
  },
  pageFooter: { fontSize: '10px', color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '8px' },
  coverPage: { 
    display: 'flex', flexDirection: 'column', 
    justifyContent: 'center', alignItems: 'center', textAlign: 'center', 
    color: '#1e2a4a', backgroundColor: 'transparent'
  },
  coverBorder: {
    border: 'double 4px #1e2a4a', padding: '30px 20px', width: '80%'
  },
  coverTitle: { 
    fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', fontFamily: '"Shippori Mincho", serif'
  },
  coverText: { 
    fontSize: '14px', lineHeight: '1.8', fontFamily: '"Shippori Mincho", serif'
  }
};

export default BookReader3D;