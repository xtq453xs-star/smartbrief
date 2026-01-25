import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore';

// --- Types & Interfaces ---
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

// ★修正: 'authors' を除外。ダッシュボードは個人の動きとトレンドのみに集中する
type ViewType = 'history' | 'ranking' | 'favorites';

// --- Sub-Components ---
const BookCard: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
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
          <img src={book.image_url} alt={book.title} style={{ ...styles.bookImage, ...(isHovered ? styles.bookImageHover : {}) }} />
        ) : (
          <div style={styles.noImageCover}><span style={{ fontSize: '32px' }}>📖</span></div>
        )}
        <div style={styles.gradientOverlay} />
      </div>
      <div style={styles.bookInfo}>
        <h4 style={styles.bookTitle}>{book.title}</h4>
        <p style={styles.bookAuthor}>{book.authorName}</p>
      </div>
    </div>
  );
};

// --- Main Component ---
const Dashboard: React.FC<DashboardProps> = ({ onBookSelect, onUpgrade, onManage }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isLoggedIn, logout } = useAuthStore();

  const [activeView, setActiveView] = useState<ViewType>('history');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    user: null as UserData | null,
    history: [] as Book[],
    ranking: [] as Book[],
    favorites: [] as Book[]
  });

  const fetchData = useCallback(async <T,>(endpoint: string): Promise<T | null> => {
    const res = await apiClient.get<T>(endpoint);
    if (res.ok) return res.data;
    showToast(res.message || '通信エラーが発生しました', 'error');
    if (res.status === 401) logout();
    return null;
  }, [logout, showToast]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const loadAllInitialData = async () => {
      setLoading(true);
      // ★修正: authors の読み込みを廃止し、ダッシュボードの表示を高速化
      const [user, history, ranking, favorites] = await Promise.all([
        fetchData<UserData>('/billing/status'),
        fetchData<Book[]>('/books/history'),
        fetchData<Book[]>('/books/ranking'),
        fetchData<Book[]>('/books/favorites')
      ]);
      setData({
        user,
        history: history || [],
        ranking: ranking || [],
        favorites: favorites || []
      });
      setLoading(false);
    };
    loadAllInitialData();
  }, [isLoggedIn, fetchData]);

  const activeContent = useMemo(() => {
    const info = {
      history: { title: 'マイ・ライブラリ', desc: 'おかえりなさい。あなたが最近旅した物語です。', items: data.history.slice(0, 20), empty: 'まだ読んだ本はありません。' },
      ranking: { title: '人気ランキング', desc: '今、最も多くの人に読まれている名作たちです。', items: data.ranking, empty: 'ランキングデータがありません。' },
      favorites: { title: 'お気に入り', desc: 'あなたが心に残した、大切な作品コレクションです。', items: data.favorites, empty: 'お気に入りはまだありません。' }
    };
    return info[activeView];
  }, [activeView, data]);

  const handleMenuAction = (view: ViewType) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  const renderSidebar = () => (
    <aside style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}), ...(isMobile && isSidebarOpen ? styles.sidebarMobileOpen : {}) }}>
      {isMobile && <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>×</button>}
      <div style={styles.logoArea}>
        <h1 style={styles.logoText}>SmartBrief</h1>
        <p style={styles.logoSub}>Library</p>
      </div>
      <nav style={styles.nav}>
        {/* --- ダッシュボード内切り替えタブ --- */}
        {[
          { id: 'history' as const, icon: '🕰️', label: '閲覧履歴' },
          { id: 'ranking' as const, icon: '🏆', label: '人気ランキング' },
          { id: 'favorites' as const, icon: '🔖', label: 'お気に入り' },
        ].map(item => (
          <button 
            key={item.id} 
            style={activeView === item.id ? styles.navItemActive : styles.navItem} 
            onClick={() => handleMenuAction(item.id)}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <div style={styles.separator} />

        {/* --- ★修正: 別ページへの遷移 (探索・探索系) --- */}
        <button onClick={() => navigate('/search')} style={styles.navItem}>🔍 蔵書検索</button>
        <button onClick={() => navigate('/genres')} style={styles.navItem}>🎨 ジャンル一覧</button>
        {/* 作家一覧をここへ移動し、先ほど完成した専用ページへ飛ばす */}
        <button onClick={() => navigate('/authors')} style={styles.navItem}>✒️ 作家一覧</button>
      </nav>
      <div style={styles.userArea}>
        <div style={styles.userCard}>
          <p style={styles.userName}>{data.user?.username || 'Guest'}</p>
          <p style={styles.userPlan}>{data.user?.premium ? '💎 Premium Member' : '🌱 Free Member'}</p>
          {!data.user?.premium ? (
            <button onClick={onUpgrade} style={styles.upgradeBtnSmall}>💎 Premiumに登録</button>
          ) : (
            <button onClick={onManage} style={styles.manageBtnSmall}>⚙️ 契約の管理</button>
          )}
        </div>
        <button onClick={logout} style={styles.logoutBtn}>ログアウト</button>
      </div>
    </aside>
  );

  return (
    <div style={styles.wrapper}>
      {isMobile && isSidebarOpen && <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button onClick={() => setIsSidebarOpen(true)} style={styles.hamburgerBtn}>☰</button>
          <span style={styles.mobileLogoText}>SmartBrief</span>
          <div style={{ width: '40px' }} />
        </div>
      )}

      {renderSidebar()}

      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{activeContent.title}</h2>
          <p style={styles.greeting}>{activeContent.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {loading ? (
            <div style={styles.loadingContainer}>書架のデータを読み込んでいます...</div>
          ) : activeContent.items.length > 0 ? (
            <div style={{ ...styles.bookGrid, ...(isMobile ? styles.bookGridMobile : {}) }}>
              {activeContent.items.map(book => (
                <BookCard key={book.id} book={book} onClick={() => onBookSelect(book.id)} />
              ))}
            </div>
          ) : (
            <div style={styles.emptyContainer}><div style={styles.emptyIcon}>📚</div><p>{activeContent.empty}</p></div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Styles (※Author関係のスタイルを削除し、コード量を削減) ---
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
  userArea: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userCard: { marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
  userName: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' },
  userPlan: { margin: 0, fontSize: '12px', color: '#ffd700' },
  upgradeBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#5d4037', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  manageBtnSmall: { marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  logoutBtn: { background: 'transparent', border: '1px solid #ccc', color: '#ccc', width: '100%', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  header: { marginBottom: '30px', borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: '15px' },
  pageTitle: { fontSize: '24px', margin: '0 0 5px 0', color: theme.colors.primary, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  greeting: { fontSize: '13px', color: theme.colors.textSub, margin: 0 },
  contentArea: { paddingBottom: '20px' },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' },
  bookGridMobile: { gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' },
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
  loadingContainer: { padding: '40px', textAlign: 'center', color: theme.colors.textSub },
  emptyContainer: { textAlign: 'center', padding: '60px 0', opacity: 0.7, color: theme.colors.textSub },
  emptyIcon: { fontSize: '48px', marginBottom: '15px' }
};

export default Dashboard;