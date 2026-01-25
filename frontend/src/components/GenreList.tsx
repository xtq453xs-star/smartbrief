import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore'; // ★1. Storeをインポート

// ★2. Propsの型定義 (onBackのみにする)
interface GenreListProps {
  onBack: () => void;
}

const GenreList: React.FC<GenreListProps> = ({ onBack }) => {
  // ★3. Propsから消した token と logout を Storeから取得
  const { isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // ★4. ジャンル一覧の型を <string[]> に指定
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ★ 2. isLoggedIn で判定
    if (!isLoggedIn) return;

    const loadGenres = async () => {
      setLoading(true);
      // ★5. APIレスポンスも <string[]> で型付け
      const res = await apiClient.get<string[]>('/books/genres');
      
      if (!res.ok) {
        showToast(res.message || 'エラーが発生しました', 'error');
        if (res.status === 401) logout(); // ★6. logout() を使用
        setLoading(false);
        return;
      }
      setGenres(res.data || []);
      setLoading(false);
    };

    loadGenres();
  }, [logout, showToast, isLoggedIn]);

  const handleGenreClick = (genre: string) => { // ★引数に型
    navigate(`/search?genre=${encodeURIComponent(genre)}`);
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>書架を整理中...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
           <span style={{fontSize:'18px'}}>←</span> ダッシュボードへ
        </button>
        <div style={styles.navTitle}>ジャンル一覧</div>
        <div style={{width:'80px'}}></div>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>🏷️</span>
            <h2 style={styles.title}>ジャンルから探す</h2>
            <p style={styles.sub}>全 {genres.length} 種類のカテゴリから選べます</p>
        </header>

        <div style={styles.grid}>
          {genres.map((genre, index) => (
            <button 
              key={index} 
              style={styles.genreCard}
              onClick={() => handleGenreClick(genre)}
            >
              <div style={styles.cardContent}>
                  <span style={styles.hash}>#</span>
                  <span style={styles.name}>{genre}</span>
              </div>
            </button>
          ))}
        </div>

        <div style={styles.footerArea}>
           <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
        </div>
      </main>
    </div>
  );
};

// ★8. スタイルに型定義を追加
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: { minHeight: '100vh', backgroundColor: theme.colors.background, color: theme.colors.textMain, fontFamily: theme.fonts.body, paddingBottom: '40px' },
  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(252, 249, 242, 0.95)', borderBottom: `1px solid ${theme.colors.border}`, backdropFilter: 'blur(5px)' },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textSub, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: theme.fonts.heading },
  navTitle: { fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  paperContainer: { maxWidth: '900px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)', borderTop: `6px solid ${theme.colors.accent}`, padding: '40px', minHeight: '600px' },
  header: { textAlign: 'center', marginBottom: '50px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '10px' },
  title: { fontSize: '28px', color: theme.colors.accent, fontFamily: theme.fonts.heading, marginBottom: '10px', letterSpacing: '0.1em' },
  sub: { color: theme.colors.textSub, fontSize: '14px', fontFamily: theme.fonts.body },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '60px' },
  genreCard: { backgroundColor: '#f8f9fa', border: 'none', borderLeft: `4px solid ${theme.colors.accent}`, borderRadius: '4px', padding: '15px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardContent: { display: 'flex', alignItems: 'center', gap: '10px' },
  hash: { color: theme.colors.accent, fontWeight: 'bold', fontSize: '18px', opacity: 0.5 },
  name: { fontWeight: 'bold', color: '#4a5568', fontSize: '15px', fontFamily: theme.fonts.heading },
  footerArea: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: '20px' },
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  spinner: { width: '40px', height: '40px', border: '3px solid #eee', borderTop: `3px solid ${theme.colors.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontFamily: theme.fonts.heading, color: theme.colors.textSub },
};

export default GenreList;