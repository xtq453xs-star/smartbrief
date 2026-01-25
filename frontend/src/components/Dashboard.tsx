import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore';

// --- 型定義 ---
interface Book {
  id: number;
  title: string;
  authorName: string;
  image_url?: string;
}

interface UserData {
  username: string;
  premium: boolean;
}

interface DashboardProps {
  onBookSelect: (id: number) => void;
  onUpgrade: () => void;
  onManage: () => void;
}

interface BookCardItemProps {
  book: Book;
  onClick: () => void;
}

interface AuthorCardItemProps {
  authorName: string;
  imageFile: string | null;
  onClick: () => void;
  isSlider?: boolean;
}

interface BookListProps {
  books: Book[];
  onSelect: (id: number) => void;
  emptyMsg: string;
  isMobile: boolean;
}

// --- 定数データ ---
const FEATURED_AUTHORS = [
  { name: '宮本 百合子', file: 'miyamoto_yuriko.png' },
  { name: '宮沢 賢治', file: 'miyazawa_kenji.png' },
  { name: '小川 未明', file: 'ogawa_mimei.png' },
  { name: '芥川竜之介', file: 'akutagawa_ryunosuke.png' },
  { name: '泉鏡 花', file: 'izumi_kyoka.png' },
  { name: '萩原 朔太郎', file: 'hagiwara_sakutarou.png' },
  { name: '牧野 信一', file: 'makino_shinichi.png' },
  { name: '豊島 与志雄', file: 'toyoshima_toshio.png' },
  { name: '太宰 治', file: 'dazai_osamu.png' },
  { name: '坂口 安吾', file: 'sakaguchi_ango.png' },
  { name: '岸田 国士', file: 'kishida_kunio.png' },
  { name: '折口 信夫', file: 'origuchi_nobuo.png' },
  { name: '寺田 寅彦', file: 'terada_torahiko.png' },
  { name: '中谷 宇吉郎', file: 'nakaya_ukichiro.png' },
  { name: '海野 十三', file: 'uno_juza.png' },
  { name: '北大路 魯山人', file: 'kitaooji_rosannzin.png' },
  { name: '岡本綺堂', file: 'okamoto_kido.png' },
  { name: '野村 胡堂', file: 'nomura_kodou.png' },
  { name: '田中 貢太郎', file: 'tanaka_koutarou.png' },
  { name: '山本 周五郎', file: 'yamamoto_shugorou.png' },
  { name: '堀 辰雄', file: 'hori_tatsuo.png' },
  { name: '中原 中也', file: 'nakahara_chuya.png' },
  { name: '坂本 竜馬', file: 'sakamoto_ryoma.png' },
  { name: '原 民喜', file: 'hara_tamiki.png' },
  { name: '岡本 かの子', file: 'okamoto_kanoko.png' },
  { name: '永井 荷風', file: 'nagai_kafu.png' },
  { name: '吉川 英治', file: 'yoshikawa_eiji.png' },
  { name: '田山 録弥', file: 'tayama_rokuya.png' },
  { name: '国枝 史郎', file: 'kunieda_shiro.png' },
  { name: '新美 南吉', file: 'niimi_nankichi.png' },
  { name: '今野 大力', file: 'konno_dairiki.png' },
  { name: '夏目 漱石', file: 'natsume_soseki.png' },
  { name: '江戸川 乱歩', file: 'edogawa_ranpo.png' },
  { name: '夢野 久作', file: 'yumeno_kyusaku.png' },
  { name: '久生 十蘭', file: 'hisao_juran.png' },
  { name: '伊藤 野枝', file: 'ito_noe.png' },
  { name: '佐藤 垢石', file: 'sato_kaseki.png' },
  { name: '菊池 寛', file: 'kikuchi_kan.png' },
];

const LINE_FRIEND_URL = 'https://lin.ee/FSfu49T'; 

// --- サブコンポーネント ---
const MobileHeader: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => (
  <div style={styles.mobileHeader}>
    <button onClick={onOpenSidebar} style={styles.hamburgerBtn}>☰</button>
    <span style={styles.mobileLogoText}>SmartBrief</span>
    <div style={{ width: '40px' }}></div>
  </div>
);

const BookCardItem: React.FC<BookCardItemProps> = ({ book, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{ ...styles.bookCard, ...(isHovered ? styles.bookCardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         {book.image_url ? (
           <img src={book.image_url} alt={book.title} style={{...styles.bookImage, ...(isHovered ? styles.bookImageHover : {})}} />
         ) : (
           <div style={styles.noImageCover}>
             <span style={{fontSize:'32px'}}>📖</span>
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

const AuthorCardItem: React.FC<AuthorCardItemProps> = ({ authorName, imageFile, onClick, isSlider = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const containerStyle = {
    ...styles.authorCard,
    ...(isSlider ? { minWidth: '120px', maxWidth: '120px', flexShrink: 0, scrollSnapAlign: 'start' } : { width: '100%' }),
    ...(isHovered ? { transform: 'translateY(-4px)' } : {})
  };

  return (
    <div 
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         {imageFile ? (
           <img src={`https://assets.smartbrief.jp/${imageFile}`} alt={authorName} style={{...styles.bookImage, ...(isHovered ? styles.bookImageHover : {})}} />
         ) : (
           <div style={styles.noImageCover}>
             <span style={{fontSize:'28px', color:'#fff'}}>✒️</span>
           </div>
         )}
         <div style={styles.gradientOverlay}></div>
      </div>
      <div style={styles.bookInfo}>
        <p style={{...styles.bookAuthor, fontSize: '10px', color: '#ccc'}}>作家</p>
        <h4 style={{...styles.bookTitle, fontSize: '13px'}}>{authorName}</h4>
      </div>
    </div>
  );
};

const BookList: React.FC<BookListProps> = ({ books, onSelect, emptyMsg, isMobile }) => {
    if (!books || books.length === 0) {
        return <div style={styles.emptyContainer}><div style={styles.emptyIcon}>📚</div><p>{emptyMsg}</p></div>;
    }
    const gridStyle = isMobile ? {...styles.bookGrid, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px'} : styles.bookGrid;
    return (
        <div style={gridStyle}>
            {books.map((book) => <BookCardItem key={book.id} book={book} onClick={() => onSelect(book.id)} />)}
        </div>
    );
};

// --- メインコンポーネント ---
const Dashboard: React.FC<DashboardProps> = ({ onBookSelect, onUpgrade, onManage }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  // ★ 1. token の代わりに isLoggedIn を取得
  const { isLoggedIn, logout } = useAuthStore();
  
  const [activeView, setActiveView] = useState<'history' | 'ranking' | 'favorites' | 'authors'>('history');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [historyBooks, setHistoryBooks] = useState<Book[]>([]);
  const [rankingBooks, setRankingBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [allAuthors, setAllAuthors] = useState<string[]>([]);
  const [displayedAuthorCount, setDisplayedAuthorCount] = useState(50); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const authorScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async <T,>(endpoint: string): Promise<T | null> => {
    const res = await apiClient.get<T>(endpoint);
    if (res.ok) return res.data;
    showToast(res.message || 'データ取得エラー', 'error');
    if (res.status === 401) logout(); 
    return null;
  }, [logout, showToast]);

  useEffect(() => {
    // ★ 2. isLoggedIn で判定
    if (!isLoggedIn) return;
    setLoading(true);
    
    Promise.all([
        fetchData<UserData>('/billing/status'),
        fetchData<Book[]>('/books/history'),
        fetchData<Book[]>('/books/ranking'),
        fetchData<Book[]>('/books/favorites'),
        fetchData<string[]>('/books/authors/all')
    ]).then(([user, history, ranking, favorites, authors]) => {
        setUserData(user);
        setHistoryBooks(history || []);
        setRankingBooks(ranking || []);
        setFavoriteBooks(favorites || []);
        setAllAuthors([...new Set(authors || [])]);
        setLoading(false);
    });
  // ★ 3. 依存配列も isLoggedIn に変更  
  }, [fetchData, isLoggedIn]);

  const viewInfo = {
    history: { title: 'マイ・ライブラリ', desc: 'おかえりなさい。あなたが最近旅した物語です。' },
    ranking: { title: '人気ランキング', desc: '今、最も多くの人に読まれている名作たちです。' },
    favorites: { title: 'お気に入り', desc: 'あなたが心に残した、大切な作品コレクションです。' },
    authors: { title: '作家一覧', desc: '日本文学を代表する文豪たちの世界へ。' },
  }[activeView] || { title: '', desc: '' };

  const handleAuthorClick = (authorName: string) => {
      navigate(`/search?q=${encodeURIComponent(authorName)}`);
      setIsSidebarOpen(false);
  };

  const handleMenuClick = (view: 'history' | 'ranking' | 'favorites' | 'authors') => {
      setIsSidebarOpen(false);
      setTimeout(() => {
        setActiveView(view);
        if (view === 'authors') setDisplayedAuthorCount(50);
      }, 0); 
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const getAuthorImage = (name: string) => {
    if (!name) return null;
    const cleanName = name.replace(/[\s\u3000]/g, '');
    const found = FEATURED_AUTHORS.find(a => a.name.replace(/[\s\u3000]/g, '') === cleanName);
    return found ? found.file : null;
  };

  return (
    <div style={styles.wrapper}>
      {isMobile && isSidebarOpen && <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
      {isMobile && <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />}

      <aside style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}), ...(isMobile && isSidebarOpen ? styles.sidebarMobileOpen : {}) }}>
        {isMobile && <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>×</button>}

        {/* 復活: ロゴエリア */}
        <div style={styles.logoArea}>
          <h1 style={styles.logoText}>SmartBrief</h1>
          <p style={styles.logoSub}>Library</p>
        </div>

        {/* 復活: ナビゲーションメニュー */}
        <nav style={styles.nav}>
          {[
            { id: 'history' as const, icon: '🕰️', label: '閲覧履歴' },
            { id: 'ranking' as const, icon: '🏆', label: '人気ランキング' },
            { id: 'favorites' as const, icon: '🔖', label: 'お気に入り' },
            { id: 'authors' as const, icon: '✒️', label: '作家一覧' },
          ].map(item => (
            <button 
                key={item.id}
                style={activeView === item.id ? styles.navItemActive : styles.navItem} 
                onClick={() => handleMenuClick(item.id)}
            >
                {item.icon} {item.label}
            </button>
          ))}

          <div style={styles.separator}></div>

          <button onClick={() => {navigate('/search'); setIsSidebarOpen(false);}} style={styles.navItem}>🔍 蔵書検索</button>
          <button onClick={() => {navigate('/genres'); setIsSidebarOpen(false);}} style={styles.navItem}>🎨 ジャンル一覧</button>
        </nav>

        {/* 復活: LINE公式登録エリア */}
        <div style={styles.lineArea}>
          <p style={styles.lineText}>スマホで読むなら</p>
          <a href={LINE_FRIEND_URL} target="_blank" rel="noopener noreferrer" style={styles.lineButton}>
            <span style={{marginRight:'8px'}}>💬</span> 公式LINEを登録
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
          
          <button onClick={logout} style={styles.logoutBtn}>ログアウト</button>
          
          <div style={{marginTop: '20px'}}>
             <Footer color={theme.colors.textSub} separatorColor="rgba(255,255,255,0.1)" />
          </div>
        </div>
      </aside>

      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{viewInfo.title}</h2>
          <p style={styles.greeting}>{viewInfo.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {loading ? (
             <div style={{padding:'40px', textAlign:'center', color: theme.colors.textSub}}>
                書架のデータを読み込んでいます...
             </div>
          ) : (
            <>
                {activeView !== 'authors' && (
                    <BookList 
                        books={
                            activeView === 'history' ? historyBooks.slice(0, 20) :
                            activeView === 'ranking' ? rankingBooks :
                            favoriteBooks
                        } 
                        onSelect={onBookSelect}
                        emptyMsg={
                            activeView === 'history' ? "まだ読んだ本はありません。" :
                            activeView === 'favorites' ? "お気に入りはまだありません。" : "データがありません。"
                        }
                        isMobile={isMobile}
                    />
                )}

                {activeView === 'authors' && (
                  <div>
                    <h3 style={styles.sectionHeading}>✨ Pick Up Authors (39)</h3>
                    <div style={{position: 'relative', marginBottom: '50px'}}>
                        {!isMobile && <button onClick={() => scrollContainer(authorScrollRef, 'left')} style={{...styles.scrollButton, left: '-20px'}}>&#10094;</button>}
                        <div ref={authorScrollRef} style={styles.authorScrollContainer}>
                            {FEATURED_AUTHORS.map((author, i) => (
                                <AuthorCardItem 
                                    key={`slide-${i}`} 
                                    authorName={author.name} 
                                    imageFile={author.file} 
                                    isSlider={true} 
                                    onClick={() => handleAuthorClick(author.name)} 
                                />
                            ))}
                        </div>
                        {!isMobile && <button onClick={() => scrollContainer(authorScrollRef, 'right')} style={{...styles.scrollButton, right: '-20px'}}>&#10095;</button>}
                    </div>

                    <h3 style={styles.sectionHeading}>👥 All Authors ({allAuthors.length})</h3>
                    <div style={isMobile ? {...styles.bookGrid, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px'} : styles.bookGrid}>
                        {allAuthors.slice(0, displayedAuthorCount).map((authorName, i) => (
                            <AuthorCardItem 
                                key={`grid-${i}`} 
                                authorName={authorName} 
                                imageFile={getAuthorImage(authorName)} 
                                onClick={() => handleAuthorClick(authorName)} 
                            />
                        ))}
                    </div>
                    {displayedAuthorCount < allAuthors.length && (
                        <div style={{textAlign: 'center', marginTop: '30px'}}>
                            <button 
                                onClick={() => setDisplayedAuthorCount(c => c + 50)} 
                                style={styles.loadMoreButton}
                            >
                                さらに作家を表示
                            </button>
                            <p style={styles.authorDisplayStatus}>（{displayedAuthorCount} / {allAuthors.length} 名表示中）</p>
                        </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: theme.colors.background, fontFamily: theme.fonts.body, color: theme.colors.textMain, overflowX: 'hidden' },
  sidebar: { width: '260px', backgroundColor: theme.colors.primary, color: '#efebe9', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.05)', flexShrink: 0, zIndex: 50, transition: 'transform 0.3s' },
  sidebarMobile: { position: 'fixed', top: 0, left: 0, width: '280px', height: '100vh', transform: 'translateX(-100%)', boxShadow: '4px 0 15px rgba(0,0,0,0.5)', overflowY: 'auto' },
  sidebarMobileOpen: { transform: 'translateX(0)' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  mobileHeader: { position: 'fixed', top: 0, left: 0, width: '100%', height: '60px', backgroundColor: theme.colors.background, borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', zIndex: 30 },
  hamburgerBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.colors.primary },
  mobileLogoText: { fontSize: '18px', fontWeight: 'bold', fontFamily: theme.fonts.heading, color: theme.colors.primary },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' },
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto', transition: 'padding 0.3s' },
  mainMobile: { padding: '80px 20px 40px 20px' },
  logoArea: { marginBottom: '30px', textAlign: 'center' },
  logoText: { margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', fontFamily: theme.fonts.heading },
  logoSub: { margin: 0, fontSize: '12px', opacity: 0.7, letterSpacing: '4px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { background: 'transparent', border: 'none', color: '#ccc', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' },
  navItemActive: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'default', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  separator: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' },
  lineArea: { marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  lineText: { fontSize: '12px', color: '#ccc', marginBottom: '8px', fontWeight: 'bold' },
  lineButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', backgroundColor: '#06c755', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' },
  userArea: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userCard: { marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
  userName: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' },
  userPlan: { margin: 0, fontSize: '12px', color: '#ffd700' },
  upgradeBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#5d4037', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  manageBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  contactBtn: { display: 'block', marginTop: '10px', width: '100%', padding: '8px', fontSize: '11px', backgroundColor: 'transparent', color: '#ccc', border: '1px dashed #ccc', borderRadius: '4px', textAlign: 'center', textDecoration: 'none' },
  logoutBtn: { background: 'transparent', border: '1px solid #ccc', color: '#ccc', width: '100%', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  header: { marginBottom: '30px', borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: '15px' },
  pageTitle: { fontSize: '24px', margin: '0 0 5px 0', color: theme.colors.primary, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  greeting: { fontSize: '13px', color: theme.colors.textSub, margin: 0 },
  contentArea: { paddingBottom: '20px' },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' },
  bookCard: { position: 'relative', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease', overflow: 'hidden', aspectRatio: '2 / 3', backgroundColor: '#2b2222' },
  bookCardHover: { transform: 'translateY(-5px)', boxShadow: '0 15px 30px rgba(0,0,0,0.15)' },
  bookCover: { width: '100%', height: '100%', position: 'relative' },
  bookImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' },
  bookImageHover: { transform: 'scale(1.05)' },
  noImageCover: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #4e342e 10%, #8d6e63 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', pointerEvents: 'none' },
  bookInfo: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '12px', boxSizing: 'border-box', zIndex: 2 },
  bookTitle: { margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontFamily: theme.fonts.heading },
  bookAuthor: { margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)' },
  authorCard: { position: 'relative', borderRadius: '4px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease', overflow: 'hidden', aspectRatio: '2 / 3', backgroundColor: '#000' },
  sectionHeading: { fontSize: '18px', color: theme.colors.primary, marginBottom: '15px', fontWeight: 'bold', fontFamily: theme.fonts.heading, borderBottom: `1px solid ${theme.colors.accent}`, paddingBottom: '5px', display: 'inline-block' },
  authorScrollContainer: { display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' },
  scrollButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, color: theme.colors.primary },
  emptyContainer: { textAlign: 'center', padding: '60px 0', opacity: 0.7, color: theme.colors.textSub },
  emptyIcon: { fontSize: '48px', marginBottom: '15px' },
  loadMoreButton: { ...theme.ui.buttonPrimary, padding: '10px 30px', borderRadius: '30px' },
  authorDisplayStatus: { fontSize: '12px', color: theme.colors.textSub, marginTop: '10px' }
};

export default Dashboard;