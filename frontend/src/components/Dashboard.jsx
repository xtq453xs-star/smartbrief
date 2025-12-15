import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer'; 

// ★追加: 1つのカードを管理するコンポーネント（ホバーアニメーション用）
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
             alt={book.title} 
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
         
         {/* グラデーションオーバーレイ（常時表示） */}
         <div style={styles.gradientOverlay}></div>
      </div>

      <div style={styles.bookInfo}>
        <h4 style={styles.bookTitle}>{book.title}</h4>
        <p style={styles.bookAuthor}>{book.authorName}</p>
      </div>
    </div>
  );
};

const Dashboard = ({ token, onLogout, onBookSelect, onUpgrade, onManage }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('history');
  
  const [historyBooks, setHistoryBooks] = useState([]);
  const [rankingBooks, setRankingBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // LINE設定
  const LINE_FRIEND_URL = 'https://lin.ee/xxxxx'; 

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
          // ★修正: 新しいコンポーネントを使用
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

      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{viewInfo.title}</h2>
          <p style={styles.greeting}>{viewInfo.desc}</p>
        </header>

        <div style={styles.contentArea}>
          {activeView === 'history' && (<BookList books={historyBooks.slice(0, 20)} isLoading={loading} emptyMessage="まだ読んだ本はありません。" />)}
          {activeView === 'ranking' && <BookList books={rankingBooks} isLoading={loading} emptyMessage="ランキングデータの取得中です..." />}
          {activeView === 'favorites' && <BookList books={favoriteBooks} isLoading={loading} emptyMessage="お気に入りはまだありません。" />}
        </div>
      </main>
    </div>
  );
};

const styles = {
  // --- 基本レイアウト ---
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f1ea', fontFamily: '"Shippori Mincho", "Yu Mincho", serif', color: '#4a3b32' },
  sidebar: { width: '260px', backgroundColor: '#2d2420', color: '#efebe9', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.05)', flexShrink: 0 },
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto' },
  
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
  header: { marginBottom: '40px', borderBottom: '1px solid #d7ccc8', paddingBottom: '20px' },
  pageTitle: { fontSize: '28px', margin: '0 0 10px 0', color: '#4e342e', fontWeight: 'bold', fontFamily: '"Shippori Mincho", serif' },
  greeting: { fontSize: '14px', color: '#8d6e63', margin: 0 },
  contentArea: { paddingBottom: '20px' },

  // --- 本のリスト表示 (Pro仕様に更新) ---
  bookGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
    gap: '30px' // 間隔を少し広げて優雅に
  },
  
  bookCard: { 
    position: 'relative',
    borderRadius: '12px', // 角丸を少し大きく
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)', // 影を深く、柔らかく
    cursor: 'pointer', 
    transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
    overflow: 'hidden', 
    aspectRatio: '2 / 3', // ★重要: 縦横比を「本」らしく固定
    backgroundColor: '#000', // 画像ロード前は黒
  },

  // ホバー時のカードスタイル
  bookCardHover: {
    transform: 'translateY(-8px)', // ふわりと浮き上がる
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)', // 影が伸びる
  },

  bookCover: { 
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden', // 画像拡大時に枠からはみ出さないように
  },

  bookImage: {
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    transition: 'transform 0.5s ease', // ゆっくりズームさせる
  },

  // ホバー時の画像スタイル
  bookImageHover: {
    transform: 'scale(1.08)', // 画像がじわっと近づいてくる
  },

  // グラデーション専用レイヤー
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '70%', // 下半分を中心に
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none', // クリックを邪魔しない
  },

  bookInfo: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0,
    width: '100%',
    padding: '20px 15px', 
    zIndex: 2,
    boxSizing: 'border-box',
    textAlign: 'left',
  },

  bookTitle: { 
    margin: '0 0 6px 0', 
    fontSize: '16px', // 少し大きく
    fontWeight: 'bold', 
    lineHeight: '1.4', 
    color: '#fff', 
    display: '-webkit-box', 
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)', // 影を少し拡散させて上品に
    letterSpacing: '0.5px', // 字間を少し空けて読みやすく
  },
  
  bookAuthor: { 
    margin: 0, 
    fontSize: '13px', 
    color: 'rgba(255,255,255,0.85)', 
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
    fontFamily: '"sans-serif"', // 著者はゴシック体でもスッキリする
  },

  // --- 空の状態 ---
  emptyContainer: { textAlign: 'center', padding: '80px 0', opacity: 0.6 },
  emptyIcon: { fontSize: '56px', marginBottom: '20px', filter: 'grayscale(100%)' },
  emptyText: { fontSize: '16px', color: '#8d6e63', letterSpacing: '1px' },
};

export default Dashboard;