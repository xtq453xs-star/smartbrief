import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ★追加: Footerを読み込み (パスは作成場所に合わせる。例: ./Footer)
import Footer from './Footer'; 

const Dashboard = ({ token, onLogout, onBookSelect, onUpgrade, onManage }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('history');
  
  const [historyBooks, setHistoryBooks] = useState([]);
  const [rankingBooks, setRankingBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // LINE設定
  const LINE_FRIEND_URL = 'https://lin.ee/xxxxx'; // ★あなたのIDに書き換えてください

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
      case 'history': return { title: 'マイ・ライブラリ', desc: 'おかえりなさい。あなたが最近旅した物語です。' };
      case 'ranking': return { title: '人気ランキング', desc: '今、最も多くの人に読まれている名作たちです。' };
      case 'favorites': return { title: 'お気に入り', desc: 'あなたが心に残した、大切な作品コレクションです。' };
      default: return { title: '', desc: '' };
    }
  };
  const viewInfo = getViewInfo();

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

    return (
      <div style={styles.bookGrid}>
        {books.map((book, index) => (
          <div key={index} style={styles.bookCard} onClick={() => onBookSelect(book.id)}>
            <div style={{...styles.bookCover, background: `linear-gradient(135deg, ${getBookColor(book.id)} 10%, #fff 150%)`}}>
              <span style={{fontSize:'40px'}}>📖</span>
            </div>
            <div style={styles.bookInfo}>
              <h4 style={styles.bookTitle}>{book.title}</h4>
              <p style={styles.bookAuthor}>{book.authorName}</p>
            </div>
          </div>
        ))}
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
          <button style={activeView === 'history' ? styles.navItemActive : styles.navItem} onClick={() => setActiveView('history')}>
            🕰️ 閲覧履歴 
          </button>
          <button style={activeView === 'ranking' ? styles.navItemActive : styles.navItem} onClick={() => setActiveView('ranking')}>
            🏆 人気ランキング
          </button>
          <button style={activeView === 'favorites' ? styles.navItemActive : styles.navItem} onClick={() => setActiveView('favorites')}>
            🔖 お気に入り
          </button>

          <div style={styles.separator}></div>

          <button onClick={() => navigate('/search')} style={styles.navItem}>
            🔍 蔵書検索
          </button>
          <button onClick={() => navigate('/genres')} style={styles.navItem}>
            🎨 ジャンル一覧
          </button>
          <button onClick={() => navigate('/authors')} style={styles.navItem}>
            👥 作家一覧
          </button>
        </nav>

        {/* LINE友だち追加エリア */}
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

          {/* ★修正: 共通Footerを使用 (文字色をサイドバー用に調整) */}
          <div style={{marginTop: '20px'}}>
             <Footer color="#a1887f" separatorColor="#4e342e" />
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{viewInfo.title}</h2>
          <p style={styles.greeting}>{viewInfo.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {activeView === 'history' && <BookList books={historyBooks} isLoading={loading} emptyMessage="まだ読んだ本はありません。" />}
          {activeView === 'ranking' && <BookList books={rankingBooks} isLoading={loading} emptyMessage="ランキングデータの取得中です..." />}
          {activeView === 'favorites' && <BookList books={favoriteBooks} isLoading={loading} emptyMessage="お気に入りはまだありません。" />}
        </div>
      </main>
    </div>
  );
};

const styles = {
  // 既存のデザイン定義 (変更なし)
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f1ea', fontFamily: '"Shippori Mincho", "Yu Mincho", serif', color: '#4a3b32' },
  sidebar: { width: '260px', backgroundColor: '#2d2420', color: '#efebe9', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.05)', flexShrink: 0 },
  logoArea: { marginBottom: '30px', textAlign: 'center' },
  logoText: { margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif' },
  logoSub: { margin: 0, fontSize: '12px', opacity: 0.7, letterSpacing: '4px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { background: 'transparent', border: 'none', color: '#a1887f', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'pointer', transition: '0.2s', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' },
  navItemActive: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#efebe9', padding: '12px 15px', textAlign: 'left', fontSize: '14px', cursor: 'default', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  separator: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' },
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
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto' },
  header: { marginBottom: '40px', borderBottom: '1px solid #d7ccc8', paddingBottom: '20px' },
  pageTitle: { fontSize: '28px', margin: '0 0 10px 0', color: '#4e342e', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif' },
  greeting: { fontSize: '14px', color: '#8d6e63', margin: 0 },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' },
  bookCard: { backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #efebe9', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '280px' },
  bookCover: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bookInfo: { flex: 1, padding: '15px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  bookTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', color: '#3e2723', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  bookAuthor: { margin: 0, fontSize: '12px', color: '#a1887f' },
  emptyContainer: { textAlign: 'center', padding: '60px 0', opacity: 0.6 },
  emptyIcon: { fontSize: '48px', marginBottom: '20px', filter: 'grayscale(100%)' },
  emptyText: { fontSize: '16px', color: '#8d6e63' },
};

export default Dashboard;