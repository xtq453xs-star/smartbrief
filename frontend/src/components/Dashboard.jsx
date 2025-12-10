import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ token, onLogout, onBookSelect }) => {
  const navigate = useNavigate();
  // 初期表示は 'history' (ホーム)
  const [activeView, setActiveView] = useState('history');
  
  const [historyBooks, setHistoryBooks] = useState([]);
  const [rankingBooks, setRankingBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 本の色をIDに基づいて決める関数
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
        fetch('/api/v1/books/favorites', { headers }).then(res => res.json()).catch(() => [])
    ]).then(([user, history, ranking, favorites]) => {
        setUserData(user);
        setHistoryBooks(history || []);
        setRankingBooks(ranking || []);
        setFavoriteBooks(favorites || []);
        setLoading(false);
    });
  }, [token]);

  const getViewInfo = () => {
    switch (activeView) {
      case 'history':
        return { title: 'マイ・ライブラリ', desc: 'おかえりなさい。あなたが最近旅した物語です。' };
      case 'ranking':
        return { title: '人気ランキング', desc: '今、最も多くの人に読まれている名作たちです。' };
      case 'favorites':
        return { title: 'お気に入り', desc: 'あなたが心に残した、大切な作品コレクションです。' };
      default:
        return { title: '', desc: '' };
    }
  };

  const viewInfo = getViewInfo();

  const BookList = ({ books, emptyMessage, isLoading }) => {
    if (isLoading) {
      return (
        <div style={styles.bookGrid}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{...styles.bookCard, ...styles.skeletonCard}}>
              <div style={styles.skeletonImg}></div>
              <div style={styles.skeletonText}></div>
              <div style={styles.skeletonTextShort}></div>
            </div>
          ))}
        </div>
      );
    }

    if (!books || books.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>📚</div>
          <p style={styles.emptyText}>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div style={styles.bookGrid}>
        {books.map((book, index) => {
          const coverColor = getBookColor(book.id || index);
          return (
            <div 
              key={index} 
              style={styles.bookCard} 
              onClick={() => onBookSelect(book.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 15px 30px rgba(0,0,0,0.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{...styles.bookCover, background: `linear-gradient(135deg, ${coverColor} 10%, #fff 150%)`}}>
                <div style={styles.bookCoverIcon}>📖</div>
                {book.highQuality && <span style={styles.hqBadgeOnCover}>HQ</span>}
              </div>
              <div style={styles.bookInfo}>
                <h4 style={styles.bookTitle}>{book.title}</h4>
                <p style={styles.bookAuthor}>{book.authorName}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoText}>SmartBrief</h1>
          <p style={styles.logoSub}>Library</p>
        </div>

        <nav style={styles.nav}>
          <button 
             style={activeView === 'history' ? styles.navItemActive : styles.navItem}
             onClick={() => setActiveView('history')}
          >
            🕰️ 閲覧履歴 
          </button>
          
          <button 
             style={activeView === 'ranking' ? styles.navItemActive : styles.navItem}
             onClick={() => setActiveView('ranking')}
          >
            🏆 人気ランキング
          </button>
          
          <button 
             style={activeView === 'favorites' ? styles.navItemActive : styles.navItem}
             onClick={() => setActiveView('favorites')}
          >
            🔖 お気に入り
          </button>

          <div style={styles.separator}></div>

          <button onClick={() => navigate('/search')} style={styles.navItem}>
            🔍 蔵書検索
          </button>
          
          {/* ★追加: ジャンル一覧ボタン */}
          <button onClick={() => navigate('/genres')} style={styles.navItem}>
            🎨 ジャンル一覧
          </button>

          {/* ★追加: 作家一覧ボタン */}
          <button onClick={() => navigate('/authors')} style={styles.navItem}>
            👥 作家一覧
          </button>
        </nav>

        <div style={styles.userArea}>
          <div style={styles.userCard}>
            <p style={styles.userName}>{userData?.username || 'Guest'}</p>
            <p style={styles.userPlan}>
              {userData?.premium ? '💎 Premium' : '🌱 Free Plan'}
            </p>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>ログアウト</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{viewInfo.title}</h2>
          <p style={styles.greeting}>{viewInfo.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {activeView === 'history' && (
            <BookList books={historyBooks} isLoading={loading} emptyMessage="まだ読んだ本はありません。検索から探してみましょう。" />
          )}
          {activeView === 'ranking' && (
            <BookList books={rankingBooks} isLoading={loading} emptyMessage="ランキングデータの取得中です..." />
          )}
          {activeView === 'favorites' && (
            <BookList books={favoriteBooks} isLoading={loading} emptyMessage="お気に入りはまだありません。詳細画面のハートマークを押して追加しましょう。" />
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f7f6f2', fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif', color: '#3e3e3e' },
  sidebar: { width: '260px', backgroundColor: '#2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.05)', flexShrink: 0 },
  logoArea: { marginBottom: '40px', textAlign: 'center' },
  logoText: { margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', fontFamily: 'sans-serif' },
  logoSub: { margin: 0, fontSize: '12px', opacity: 0.7, letterSpacing: '4px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { background: 'transparent', border: 'none', color: '#b0c4de', padding: '12px 15px', textAlign: 'left', fontSize: '15px', cursor: 'pointer', transition: '0.2s', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' },
  navItemActive: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px 15px', textAlign: 'left', fontSize: '15px', cursor: 'default', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  separator: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' },
  userArea: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userCard: { marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' },
  userName: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' },
  userPlan: { margin: 0, fontSize: '12px', color: '#ffd700' },
  logoutBtn: { background: 'transparent', border: '1px solid #b0c4de', color: '#b0c4de', width: '100%', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto' },
  header: { marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' },
  pageTitle: { fontSize: '28px', margin: '0 0 10px 0', color: '#2c3e50', fontWeight: 'bold' },
  greeting: { fontSize: '14px', color: '#666', margin: 0 },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' },
  bookCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', border: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '280px' },
  bookCover: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bookCoverIcon: { fontSize: '60px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))' },
  hqBadgeOnCover: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' },
  bookInfo: { flex: 1, padding: '15px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  bookTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', color: '#2c3e50', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  bookAuthor: { margin: 0, fontSize: '12px', color: '#95a5a6' },
  emptyContainer: { textAlign: 'center', padding: '60px 0', opacity: 0.6 },
  emptyIcon: { fontSize: '48px', marginBottom: '20px', filter: 'grayscale(100%)' },
  emptyText: { fontSize: '16px', color: '#7f8c8d' },
  skeletonCard: { backgroundColor: '#fff', border: '1px solid #eee', pointerEvents: 'none' },
  skeletonImg: { width: '100%', height: '160px', backgroundColor: '#eee', animation: 'pulse 1.5s infinite' },
  skeletonText: { height: '16px', width: '80%', backgroundColor: '#eee', margin: '15px auto 10px', borderRadius: '4px', animation: 'pulse 1.5s infinite' },
  skeletonTextShort: { height: '12px', width: '50%', backgroundColor: '#eee', margin: '0 auto', borderRadius: '4px', animation: 'pulse 1.5s infinite' }
};

export default Dashboard;