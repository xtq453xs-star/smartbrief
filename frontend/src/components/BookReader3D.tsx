import React, { useRef, useState, useEffect, ReactNode } from 'react';
import HTMLFlipBook from 'react-pageflip';

// --- 1. 型定義 ---
interface BookReader3DProps {
  title: string;
  bodyText: string;
  onClose: () => void;
}

interface PageProps {
  number: string | number;
  title: string;
  isCover?: boolean;
  isBackCover?: boolean;
  fontSize?: string;
  lineHeight?: string;
  isMobile?: boolean;
  children?: ReactNode;
}

interface BookSettings {
  width: number;
  height: number;
  fontSize: string;
  lineHeight: string;
  charsPerPage: number;
  isMobile: boolean;
}

// --- テキスト分割関数 ---
const splitTextToPages = (text: string | undefined, charsPerPage: number): string[] => {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const pages: string[] = [];
  let currentPage = "";

  paragraphs.forEach((para) => {
    let remainingPara = para;
    
    while (remainingPara.length > 0) {
      const availableSpace = charsPerPage - currentPage.length;
      
      if (remainingPara.length <= availableSpace) {
        currentPage += remainingPara + "\n";
        remainingPara = "";
      } else {
        currentPage += remainingPara.substring(0, availableSpace);
        pages.push(currentPage.trim());
        currentPage = "";
        remainingPara = remainingPara.substring(availableSpace);
      }
    }

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

// --- 2. Pageコンポーネント (forwardRefの型定義を追加) ---
// 第1引数に ref の型 (HTMLDivElement)、第2引数に Props の型を指定します
const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  const { isMobile } = props;

  let shadowStyle: React.CSSProperties = {};
  if (props.isCover) {
     shadowStyle = { boxShadow: 'inset 15px 0 20px -10px rgba(0, 0, 0, 0.2)' };
  } else if (props.isBackCover) {
     shadowStyle = { boxShadow: 'inset -15px 0 20px -10px rgba(0, 0, 0, 0.2)' };
  } else if (typeof props.number === 'number') {
     if (props.number % 2 !== 0) {
        shadowStyle = { boxShadow: 'inset -30px 0 40px -20px rgba(0, 0, 0, 0.15)' };
     } else {
        shadowStyle = { boxShadow: 'inset 30px 0 40px -20px rgba(0, 0, 0, 0.15)' };
     }
  }

  const textStyle: React.CSSProperties = {
      ...styles.textArea,
      fontSize: props.fontSize || '16px',
      lineHeight: props.lineHeight || '2.0',
      paddingBottom: isMobile ? '80px' : '30px', 
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
Page.displayName = 'Page'; // React DevTools用の設定

// --- 3. メインコンポーネント ---
const BookReader3D: React.FC<BookReader3DProps> = ({ title, bodyText, onClose }) => {
  // react-pageflipのrefは特殊なため、ここでは any で回避します
  const bookRef = useRef<any>(null);
  
  // BookSettingsの型を適用
  const [bookSettings, setBookSettings] = useState<BookSettings>({
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
                charsPerPage: 390,
                isMobile: false
            });
        } else {
            const safeMobileHeight = Math.floor(winHeight * 0.75);
            setBookSettings({
                width: 350,
                height: safeMobileHeight,
                fontSize: '15px',
                lineHeight: '1.85',
                charsPerPage: 280,
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
        {/* ↓ この1行を追加して、ライブラリの型定義の不備を無視します */}
        {/* @ts-ignore: react-pageflipの型定義が古いため、不要なPropsの要求を無視 */}
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
          // ★ TSエラー回避のため、styleプロップスは不要な場合は省略するか正しい型を渡す
        >
          <Page number="" title="" isCover={true} fontSize={bookSettings.fontSize} isMobile={bookSettings.isMobile}>
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
                isMobile={bookSettings.isMobile} 
             >
               {text}
             </Page>
          ))}

          <Page number="" title="" isBackCover={true} fontSize={bookSettings.fontSize} isMobile={bookSettings.isMobile}>
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

// --- 4. スタイル定義 (Record<string, React.CSSProperties> を適用) ---
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw',
    height: '100dvh', 
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
    padding: '25px', 
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
    minHeight: 0, 
    fontFamily: '"Shippori Mincho", "Yu Mincho", serif', 
    textAlign: 'justify', 
    whiteSpace: 'pre-wrap', 
    overflowY: 'auto', 
    paddingTop: '10px',
    paddingLeft: '5px',
    paddingRight: '5px',
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
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