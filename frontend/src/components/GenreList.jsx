import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme'; // theme.js をインポート
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';

const GenreList = ({ token, onBack, onLogout }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      setLoading(true);
      const res = await apiClient.get('/books/genres');
      if (!res.ok) {
        showToast(res.message, 'error');
        if (res.status === 401 && typeof onLogout === 'function') onLogout();
        setLoading(false);
        return;
      }
      setGenres(res.data || []);
      setLoading(false);
    };

    loadGenres();
  }, [onLogout, showToast, token]);

  const handleGenreClick = (genre) => {
    navigate(`/search?genre=${encodeURIComponent(genre)}`);
  };

  // ローディング表示（統一デザイン）
  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>書架を整理中...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      {/* ヘッダーナビ (統一デザイン) */}
      <nav style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
           <span style={{fontSize:'18px'}}>←</span> ダッシュボードへ
        </button>
        <div style={styles.navTitle}>ジャンル一覧</div>
        <div style={{width:'80px'}}></div>
      </nav>

      {/* メインコンテンツ（目録デザイン） */}
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

// スタイル定義
const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background, // クリーム色
    color: theme.colors.textMain,
    fontFamily: theme.fonts.body,
    paddingBottom: '40px',
  },
  // ナビゲーション（共通）
  navBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100,
    backgroundColor: 'rgba(252, 249, 242, 0.95)', borderBottom: `1px solid ${theme.colors.border}`,
    backdropFilter: 'blur(5px)',
  },
  backButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: theme.colors.textSub, fontSize: '14px', fontWeight: 'bold',
    display: 'flex', alignItems: 'center', gap: '5px', fontFamily: theme.fonts.heading
  },
  navTitle: {
    fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading
  },

  // 紙のコンテナ
  paperContainer: {
    maxWidth: '900px', margin: '30px auto',
    backgroundColor: '#fff', borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
    borderTop: `6px solid ${theme.colors.accent}`, // ジャンルはアクセントカラー（黄色系）で区別
    padding: '40px',
    minHeight: '600px'
  },

  // ヘッダーエリア
  header: { textAlign: 'center', marginBottom: '50px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '10px' },
  title: { 
    fontSize: '28px', color: theme.colors.accent, // アクセントカラー
    fontFamily: theme.fonts.heading, marginBottom: '10px', letterSpacing: '0.1em'
  },
  sub: { color: theme.colors.textSub, fontSize: '14px', fontFamily: theme.fonts.body },

  // グリッドレイアウト
  grid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '15px', marginBottom: '60px' 
  },
  
  // ジャンルカード（タグ・ラベル風デザイン）
  genreCard: {
    backgroundColor: '#f8f9fa', 
    border: 'none',
    borderLeft: `4px solid ${theme.colors.accent}`, // 左端に色帯をつけてタグっぽく
    borderRadius: '4px',
    padding: '15px 20px', 
    cursor: 'pointer', 
    textAlign: 'left',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    // hover効果は簡易的に
    ':hover': { transform: 'translateX(2px)' } 
  },
  cardContent: { display: 'flex', alignItems: 'center', gap: '10px' },
  hash: { color: theme.colors.accent, fontWeight: 'bold', fontSize: '18px', opacity: 0.5 },
  name: { fontWeight: 'bold', color: '#4a5568', fontSize: '15px', fontFamily: theme.fonts.heading },

  footerArea: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: '20px' },

  // ローディング
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  spinner: { width: '40px', height: '40px', border: '3px solid #eee', borderTop: `3px solid ${theme.colors.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontFamily: theme.fonts.heading, color: theme.colors.textSub },
};

export default GenreList;