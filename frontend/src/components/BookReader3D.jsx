import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';

// 長いテキストをページごとに分割する関数
// 段落（改行）を維持しつつ、溢れる場合は強制分割して「読了ワープ」を防ぐ
const splitTextToPages = (text, charsPerPage) => {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const pages = [];
  let currentPage = "";

  paragraphs.forEach((para) => {
    let remainingPara = para;
    
    // 1段落が制限文字数より長い場合に備えたループ処理
    while (remainingPara.length > 0) {
      const availableSpace = charsPerPage - currentPage.length;
      
      if (remainingPara.length <= availableSpace) {
        // 段落全体が現在のページに入る場合
        currentPage += remainingPara + "\n";
        remainingPara = "";
      } else {
        // 現在のページに入り切らない分を分割して追加
        currentPage += remainingPara.substring(0, availableSpace);
        pages.push(currentPage.trim());
        currentPage = "";
        remainingPara = remainingPara.substring(availableSpace);
      }
    }

    // ページ容量の9割に達したら、キリよく次のページへ
    if (currentPage.length > charsPerPage * 0.9) {
      pages.push(currentPage.trim());
      currentPage = "";
    }
  });

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  return pages;
};

// 1ページ分のコンポーネント
const Page = React.forwardRef((props, ref) => {
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
  
  const [bookSettings, setBookSettings] = useState({
      width: 350,
      height: 500,
      fontSize: '16px',
      lineHeight: '2.0',
      charsPerPage: 300,
      isMobile: true
  });

  useEffect(() => {
    const handleResize = () => {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        if (winWidth > 768) {
            const newHeight = Math.min(winHeight * 0.85, 800);
            const newWidth = Math.floor(newHeight * 0.70);
            
            setBookSettings({
                width: newWidth,
                height: Math.floor(newHeight),
                fontSize: '19px',
                lineHeight: '2.2',
                charsPerPage: 420, // ★ PC版: 550から420に調整して溢れを防止
                isMobile: false
            });
        } else {
            setBookSettings({
                width: 350,
                height: 500,
                fontSize: '16px',
                lineHeight: '2.0',
                charsPerPage: 280, // ★ スマホ版も少し余裕を持たせる
                isMobile: true
            });
        }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeText = bodyText || "本文データがありません。";
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
          key={bookSettings.isMobile ? 'mobile' : 'pc'}
        >
          <Page number="" title="" isCover={true} fontSize={bookSettings.fontSize}>
             <div style={{...styles.pageInterior, ...styles.coverPage}}>
                <div style={styles.coverBorder}>
                  <h2 style={styles.coverTitle}>{title}</h2>
                  <p style={styles.coverText}>ページをめくって<br/>お読みください</p>
                </div>
             </div>
          </Page>

          {pages.map((text, i) => (
             <Page 
                key={i} 
                number={i + 1} 
                title={title}
                fontSize={bookSettings.fontSize}
                lineHeight={bookSettings.lineHeight}
             >
               {text}
             </Page>
          ))}

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
    width: '100%', height: '100%'
  },
  pageInterior: {
    backgroundColor: '#fdfbf7',
    width: '100%',
    height: '100%',
    padding: '25px', // パディングを少し広げる
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
    fontFamily: '"Shippori Mincho", "Yu Mincho", serif', 
    textAlign: 'justify', 
    whiteSpace: 'pre-wrap', 
    overflow: 'hidden', 
    padding: '10px 0',
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all',
    marginBottom: '15px' // フッターとの衝突防止
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