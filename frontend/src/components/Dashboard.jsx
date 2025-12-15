import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

// ★全39名分の画像付き作家リスト
const FEATURED_AUTHORS = [
  // --- 第1弾 (20名) ---
  { name: '宮本百合子', file: 'miyamoto_yuriko.png' },
  { name: '宮沢賢治', file: 'miyazawa_kenji.png' },
  { name: '小川未明', file: 'ogawa_mimei.png' },
  { name: '芥川竜之介', file: 'akutagawa_ryunosuke.png' },
  { name: '泉鏡花', file: 'izumi_kyoka.png' },
  { name: '萩原朔太郎', file: 'hagiwara_sakutarou.png' },
  { name: '牧野信一', file: 'makino_shinichi.png' },
  { name: '豊島与志雄', file: 'toyoshima_toshio.png' },
  { name: '太宰治', file: 'dazai_osamu.png' },
  { name: '坂口安吾', file: 'sakaguchi_ango.png' },
  { name: '岸田国士', file: 'kishida_kunio.png' },
  { name: '折口信夫', file: 'origuchi_nobuo.png' },
  { name: '寺田寅彦', file: 'terada_torahiko.png' },
  { name: '中谷宇吉郎', file: 'nakaya_ukichiro.png' },
  { name: '海野十三', file: 'uno_juza.png' },
  { name: '北大路魯山人', file: 'kitaooji_rosannzin.png' },
  { name: '岡本綺堂', file: 'okamoto_kido.png' },
  { name: '野村胡堂', file: 'nomura_kodou.png' },
  { name: '田中貢太郎', file: 'tanaka_koutarou.png' },
  { name: '山本周五郎', file: 'yamamoto_shugorou.png' },
  // --- 第2弾 (19名) ---
  { name: '堀辰雄', file: 'hori_tatsuo.png' },
  { name: '中原中也', file: 'nakahara_chuya.png' },
  { name: '坂本竜馬', file: 'sakamoto_ryoma.png' },
  { name: '原民喜', file: 'hara_tamiki.png' },
  { name: '岡本かの子', file: 'okamoto_kanoko.png' },
  { name: '永井荷風', file: 'nagai_kafu.png' },
  { name: '吉川英治', file: 'yoshikawa_eiji.png' },
  { name: '田山録弥', file: 'tayama_rokuya.png' },
  { name: '国枝史郎', file: 'kunieda_shiro.png' },
  { name: '新美南吉', file: 'niimi_nankichi.png' },
  { name: '今野大力', file: 'konno_dairiki.png' },
  { name: '夏目漱石', file: 'natsume_soseki.png' },
  { name: '江戸川乱歩', file: 'edogawa_ranpo.png' },
  { name: '夢野久作', file: 'yumeno_kyusaku.png' },
  { name: '久生十蘭', file: 'hisao_juran.png' },
  { name: '伊藤野枝', file: 'ito_noe.png' },
  { name: '佐藤垢石', file: 'sato_kaseki.png' },
  { name: '菊池寛', file: 'kikuchi_kan.png' },
];

// 本のカードコンポーネント
const BookCardItem = ({ book, onClick, getBookColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.bookCard,
        ...(isHovered ? styles.bookCardHover : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         {book.image_url ? (
           <img 
             src={book.image_url}
             alt={`${book.title} - ${book.authorName} の要約・あらすじ`}
             style={{
               ...styles.bookImage,
               ...(isHovered ? styles.bookImageHover : {})
             }} 
           />
         ) : (
           <div style={{
             width: '100%', 
             height: '100%', 
             background: `linear-gradient(135deg, ${getBookColor(book.id)} 10%, #fff 150%)`, 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center'
           }}>
             <span style={{fontSize:'40px'}}>📖</span>
           </div>
         )}
         <div style={styles.gradientOverlay}></div>
      </div>

      <div style={styles.bookInfo}>
        <h4 style={styles.bookTitle}>{book.title}</h4>
        <p style={styles.bookAuthor}>{book.authorName}</p>
      </div>
    </div>
  );
};

// 作家カードコンポーネント
const AuthorCardItem = ({ authorName, imageFile, onClick, isSlider = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const cardStyle = isSlider ? {
      ...styles.authorCard,
      minWidth: '120px', 
      maxWidth: '120px',
      flexShrink: 0,
      scrollSnapAlign: 'start',
  } : {
      ...styles.authorCard,
      width: '100%',
  };

  const getFallbackColor = (name) => {
    const colors = ['#5d4037', '#795548', '#8d6e63', '#455a64', '#37474f', '#263238'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      style={{
        ...cardStyle,
        ...(isHovered ? {transform: 'translateY(-4px)'} : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         {imageFile ? (
           <img 
               src={`https://assets.smartbrief.jp/${imageFile}`}
               alt={authorName}
               style={{
                 ...styles.bookImage,
                 ...(isHovered ? styles.bookImageHover : {})
               }} 
           />
         ) : (
           <div style={{
             width: '100%', height: '100%',
             background: getFallbackColor(authorName),
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             flexDirection: 'column'
           }}>
             <span style={{fontSize: '32px', opacity: 0.8, color: '#fff'}}>✒️</span>
           </div>
         )}
         <div style={styles.gradientOverlay}></div>
      </div>
      <div style={styles.bookInfo}>
        <p style={{...styles.bookAuthor, fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>作家</p>
        <h4 style={{...styles.bookTitle, fontSize: '13px', marginBottom: '5px'}}>{authorName}</h4>
      </div>
    </div>
  );
};

const Dashboard = ({ token, onLogout, onBookSelect, onUpgrade, onManage }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('history');
  
  // ★レスポンシブ対応用のState
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // スマホメニューの開閉

  const [historyBooks, setHistoryBooks] = useState([]);
  const [rankingBooks, setRankingBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const authorScrollRef = useRef(null);
  const LINE_FRIEND_URL = 'https://lin.ee/xxxxx'; 

  // 画面サイズ監視
  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBookColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC', '#4facfe'];
    return colors[id % colors.length];
  };

  useEffect(() => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
        fetch('/api/v1/billing/status', { headers }).then(res => res.json()).catch(() => null),
        fetch('/api/v1/books/history', { headers }).then(res => res.json()).catch(() => []),
        fetch('/api/v1/books/ranking', { headers }).then(res => res.json()).catch(() => []),
        fetch('/api/v1/books/favorites', { headers }).then(res => res.json()).catch(() => []),
        fetch('/api/v1/books/authors/all', { headers }).then(res => res.json()).catch(() => [])
    ]).then(([user, history, ranking, favorites, authors]) => {
        setUserData(user);
        setHistoryBooks(history || []);
        setRankingBooks(ranking || []);
        setFavoriteBooks(favorites || []);
        const uniqueAuthors = [...new Set(authors || [])];
        setAllAuthors(uniqueAuthors);
        setLoading(false);
    });
  }, [token]);

  const getViewInfo = () => {
    switch (activeView) {
      case 'history': return { title: 'マイ・ライブラリ', desc: 'おかえりなさい。あなたが最近旅した物語です。' };
      case 'ranking': return { title: '人気ランキング', desc: '今、最も多くの人に読まれている名作たちです。' };
      case 'favorites': return { title: 'お気に入り', desc: 'あなたが心に残した、大切な作品コレクションです。' };
      case 'authors': return { title: '作家一覧', desc: '日本文学を代表する文豪たちの世界へ。' };
      default: return { title: '', desc: '' };
    }
  };
  const viewInfo = getViewInfo();

  const handleAuthorClick = (authorName) => {
      navigate(`/search?q=${encodeURIComponent(authorName)}`);
      setIsSidebarOpen(false);
  };

  // メニュークリック時のハンドラ（スマホ用）
  const handleMenuClick = (view) => {
      setActiveView(view);
      setIsSidebarOpen(false); // メニューを閉じる
  };

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const amount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const getAuthorImage = (name) => {
    if (!name) return null;
    const cleanName = name.replace(/[\s　]/g, ''); 
    const found = FEATURED_AUTHORS.find(a => a.name.replace(/[\s　]/g, '') === cleanName);
    return found ? found.file : null;
  };

  const BookList = ({ books, emptyMessage, isLoading }) => {
    if (isLoading) return <div style={{padding:'20px', color:'#8d6e63'}}>書架を整理中...</div>;

    if (!books || books.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>📚</div>
          <p style={styles.emptyText}>{emptyMessage}</p>
        </div>
      );
    }

    // スマホ時はGridのgapとカラム幅を調整
    const currentGridStyle = isMobile ? {
        ...styles.bookGrid,
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', // スマホは小さくして2列確保
        gap: '15px'
    } : styles.bookGrid;

    return (
      <div style={currentGridStyle}>
        {books.map((book, index) => (
          <BookCardItem 
            key={index} 
            book={book} 
            onClick={() => onBookSelect(book.id)} 
            getBookColor={getBookColor}
          />
        ))}
      </div>
    );
  };

  // ★モバイルヘッダー（ハンバーガーメニュー含む）
  const MobileHeader = () => (
      <div style={styles.mobileHeader}>
          <button onClick={() => setIsSidebarOpen(true)} style={styles.hamburgerBtn}>
              ☰
          </button>
          <span style={styles.mobileLogoText}>SmartBrief</span>
          <div style={{width: '40px'}}></div>{/* バランス取り用のダミー */}
      </div>
  );

  return (
    <div style={styles.wrapper}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-btn:hover { background-color: rgba(255,255,255,1) !important; transform: scale(1.1); }
      `}</style>

      {/* ★スマホ用オーバーレイ（メニューが開いている時、背景を暗くする） */}
      {isMobile && isSidebarOpen && (
          <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* ★スマホ用ヘッダー */}
      {isMobile && <MobileHeader />}

      {/* サイドバー（スマホ時はスライドメニューとして動作） */}
      <aside style={{
          ...styles.sidebar,
          ...(isMobile ? styles.sidebarMobile : {}),
          ...(isMobile && isSidebarOpen ? styles.sidebarMobileOpen : {})
      }}>
        {/* スマホ用閉じるボタン */}
        {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>×</button>
        )}

        <div style={styles.logoArea}>
          <h1 style={styles.logoText}>SmartBrief</h1>
          <p style={styles.logoSub}>Library</p>
        </div>

        <nav style={styles.nav}>
          <button style={activeView === 'history' ? styles.navItemActive : styles.navItem} onClick={() => handleMenuClick('history')}>
            🕰️ 閲覧履歴 
          </button>
          <button style={activeView === 'ranking' ? styles.navItemActive : styles.navItem} onClick={() => handleMenuClick('ranking')}>
            🏆 人気ランキング
          </button>
          <button style={activeView === 'favorites' ? styles.navItemActive : styles.navItem} onClick={() => handleMenuClick('favorites')}>
            🔖 お気に入り
          </button>
          <button style={activeView === 'authors' ? styles.navItemActive : styles.navItem} onClick={() => handleMenuClick('authors')}>
            ✒️ 作家一覧
          </button>

          <div style={styles.separator}></div>

          <button onClick={() => {navigate('/search'); setIsSidebarOpen(false);}} style={styles.navItem}>
            🔍 蔵書検索
          </button>
          <button onClick={() => {navigate('/genres'); setIsSidebarOpen(false);}} style={styles.navItem}>
            🎨 ジャンル一覧
          </button>
        </nav>

        <div style={styles.lineArea}>
          <p style={styles.lineText}>スマホで読むなら</p>
          <a href={LINE_FRIEND_URL} target="_blank" rel="noopener noreferrer" style={styles.lineButton}>
            <span style={{marginRight:'8px', fontSize:'16px'}}>💬</span>
            公式LINEを登録
          </a>
        </div>

        <div style={styles.userArea}>
          <div style={styles.userCard}>
            <p style={styles.userName}>{userData?.username || 'Guest'}</p>
            <p style={styles.userPlan}>{userData?.premium ? '💎 Premium Member' : '🌱 Free Member'}</p>

            {!userData?.premium ? (
              <button onClick={onUpgrade} style={styles.upgradeBtnSmall}>💎 Premiumに登録</button>
            ) : (
              <button onClick={onManage} style={styles.manageBtnSmall}>⚙️ 契約の管理</button>
            )}
            
            <a href="mailto:info@smartbrief.jp" style={styles.contactBtn}>📩 お問い合わせ</a>
          </div>
          
          <button onClick={onLogout} style={styles.logoutBtn}>ログアウト</button>
          <div style={{marginTop: '20px'}}>
             <Footer color="#a1887f" separatorColor="#4e342e" />
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main style={{
          ...styles.main,
          ...(isMobile ? styles.mainMobile : {})
      }}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{viewInfo.title}</h2>
          <p style={styles.greeting}>{viewInfo.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {activeView === 'history' && (<BookList books={historyBooks.slice(0, 20)} isLoading={loading} emptyMessage="まだ読んだ本はありません。" />)}
          
          {activeView === 'ranking' && <BookList books={rankingBooks} isLoading={loading} emptyMessage="ランキングデータの取得中です..." />}

          {activeView === 'favorites' && <BookList books={favoriteBooks} isLoading={loading} emptyMessage="お気に入りはまだありません。" />}

          {/* ★ 作家一覧ビュー */}
          {activeView === 'authors' && (
             <div>
                {/* 1. 上段: ピックアップ */}
                <h3 style={styles.sectionHeading}>✨ Pick Up Authors (39)</h3>
                <div style={{position: 'relative', marginBottom: '50px'}}>
                    {!isMobile && (
                        <button className="scroll-btn" onClick={() => scrollContainer(authorScrollRef, 'left')} style={{...styles.scrollButton, left: '-20px'}}>&#10094;</button>
                    )}
                    <div ref={authorScrollRef} className="hide-scrollbar" style={styles.authorScrollContainer}>
                        {FEATURED_AUTHORS.map((author, index) => (
                            <AuthorCardItem 
                                key={`slide-${index}`} 
                                authorName={author.name}
                                imageFile={author.file}
                                isSlider={true} 
                                onClick={() => handleAuthorClick(author.name)} 
                            />
                        ))}
                    </div>
                    {!isMobile && (
                        <button className="scroll-btn" onClick={() => scrollContainer(authorScrollRef, 'right')} style={{...styles.scrollButton, right: '-20px'}}>&#10095;</button>
                    )}
                </div>

                {/* 2. 下段: 全作家リスト */}
                <h3 style={styles.sectionHeading}>👥 All Authors ({allAuthors.length})</h3>
                {loading ? (
                    <div style={{padding:'20px', color:'#8d6e63'}}>作家リストを読み込み中...</div>
                ) : (
                    <div style={isMobile ? {
                        ...styles.bookGrid,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '15px'
                    } : styles.bookGrid}>
                        {allAuthors.map((authorName, index) => (
                          <AuthorCardItem 
                            key={`grid-${index}`} 
                            authorName={authorName}
                            imageFile={getAuthorImage(authorName)}
                            isSlider={false} 
                            onClick={() => handleAuthorClick(authorName)} 
                          />
                        ))}
                    </div>
                )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  // --- 基本レイアウト ---
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f1ea', fontFamily: '"Shippori Mincho", "Yu Mincho", serif', color: '#4a3b32', position: 'relative', overflowX: 'hidden' },
  
  // デスクトップ用サイドバー
  sidebar: { width: '260px', backgroundColor: '#2d2420', color: '#efebe9', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.05)', flexShrink: 0, zIndex: 50, transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' },
  
  // ★スマホ用サイドバー（初期状態は画面外）
  sidebarMobile: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '280px',
      height: '100vh',
      transform: 'translateX(-100%)', // 画面左に隠す
      boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
      overflowY: 'auto'
  },
  // ★スマホ用サイドバー（開いた状態）
  sidebarMobileOpen: {
      transform: 'translateX(0)',
  },
  // ★オーバーレイ
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  
  // ★スマホ用ヘッダー
  mobileHeader: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '60px',
      backgroundColor: '#f4f1ea', borderBottom: '1px solid #d7ccc8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 15px', zIndex: 30, boxSizing: 'border-box'
  },
  hamburgerBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#4e342e' },
  mobileLogoText: { fontSize: '18px', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif', color: '#4e342e' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' },

  // メインエリア
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto', transition: 'padding 0.3s' },
  mainMobile: { padding: '80px 20px 40px 20px' }, // ヘッダー分(60px) + 余白

  // --- ロゴ・ナビゲーション ---
  logoArea: { marginBottom: '30px', textAlign: 'center' },
  logoText: { margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif' },
  logoSub: { margin: 0, fontSize: '12px', opacity: 0.7, letterSpacing: '4px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { background: 'transparent', border: 'none', color: '#a1887f', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'pointer', transition: '0.2s', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' },
  navItemActive: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#efebe9', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'default', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  separator: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' },

  // --- LINE・ユーザーエリア ---
  lineArea: { marginTop: '20px', padding: '15px', backgroundColor: 'rgba(6, 199, 85, 0.1)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(6, 199, 85, 0.3)' },
  lineText: { fontSize: '12px', color: '#a1887f', marginBottom: '8px', fontWeight: 'bold' },
  lineButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', backgroundColor: '#06c755', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'opacity 0.2s', boxSizing: 'border-box' },
  userArea: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userCard: { marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
  userName: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' },
  userPlan: { margin: 0, fontSize: '12px', color: '#ffd700' },
  logoutBtn: { background: 'transparent', border: '1px solid #a1887f', color: '#a1887f', width: '100%', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
  upgradeBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#5d4037', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  manageBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  contactBtn: {display: 'block',marginTop: '10px', width: '100%', padding: '8px', fontSize: '11px',backgroundColor: 'transparent', color: '#a1887f',border: '1px dashed #a1887f', borderRadius: '4px',textAlign: 'center', textDecoration: 'none',cursor: 'pointer', transition: '0.2s',boxSizing: 'border-box'},

  // --- ヘッダー・コンテンツ ---
  header: { marginBottom: '30px', borderBottom: '1px solid #d7ccc8', paddingBottom: '15px' },
  pageTitle: { fontSize: '24px', margin: '0 0 5px 0', color: '#4e342e', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif' },
  greeting: { fontSize: '13px', color: '#8d6e63', margin: 0 },
  contentArea: { paddingBottom: '20px' },

  // --- 本・作家のグリッド表示 ---
  bookGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: '20px'
  },
  
  bookCard: { 
    position: 'relative',
    borderRadius: '12px',
    boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
    cursor: 'pointer', 
    transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
    overflow: 'hidden', 
    aspectRatio: '2 / 3',
    backgroundColor: '#000',
  },

  bookCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },

  bookCover: { 
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },

  bookImage: {
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },

  bookImageHover: {
    transform: 'scale(1.08)',
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '70%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },

  bookInfo: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0,
    width: '100%',
    padding: '15px 12px', 
    zIndex: 2,
    boxSizing: 'border-box',
    textAlign: 'left',
  },

  bookTitle: { 
    margin: '0 0 4px 0', 
    fontSize: '14px', 
    fontWeight: 'bold', 
    lineHeight: '1.4', 
    color: '#fff', 
    display: '-webkit-box', 
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    letterSpacing: '0.5px',
  },
  
  bookAuthor: { 
    margin: 0, 
    fontSize: '11px', 
    color: 'rgba(255,255,255,0.85)', 
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
    fontFamily: '"sans-serif"',
  },

  // --- 作家カードスタイル ---
  authorCard: {
    position: 'relative',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    cursor: 'pointer', 
    transition: 'transform 0.3s ease', 
    overflow: 'hidden', 
    aspectRatio: '2 / 3',
    backgroundColor: '#000',
  },

  // --- スライド・セクションスタイル ---
  sectionHeading: {
    fontSize: '16px',
    color: '#4e342e',
    marginBottom: '15px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  authorScrollContainer: {
    display: 'flex',
    overflowX: 'auto',
    gap: '12px',
    paddingBottom: '10px',
    scrollSnapType: 'x mandatory',
  },
  
  scrollButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, fontSize: '18px', color: '#5d4037', transition: 'all 0.2s' },

  // --- 空の状態 ---
  emptyContainer: { textAlign: 'center', padding: '60px 0', opacity: 0.6 },
  emptyIcon: { fontSize: '48px', marginBottom: '15px', filter: 'grayscale(100%)' },
  emptyText: { fontSize: '14px', color: '#8d6e63', letterSpacing: '1px' },
};

export default Dashboard;