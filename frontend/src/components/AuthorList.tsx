import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore'; // ★1. Storeをインポート

interface AuthorListProps {
  onBack: () => void;
}

const AuthorList: React.FC<AuthorListProps> = ({ onBack }) => {
  // ★2. Propsから消した代わりに、Storeから token と logout を取得
  const { token, logout } = useAuthStore(); 
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // ★3. useState に <string[]> と型をつける
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return; // トークンがない場合は何もしない

    const loadAuthors = async () => {
      setLoading(true);
      // ★4. get<string[]> で「文字列の配列が返る」と宣言
      const res = await apiClient.get<string[]>('/books/authors/all');
      
      if (!res.ok) {
        showToast(res.message || 'エラーが発生しました', 'error');
        if (res.status === 401) logout(); // ★5. onLogout() を logout() に変更
        setLoading(false);
        return;
      }
      setAuthors(res.data || []);
      setLoading(false);
    };

    loadAuthors();
  }, [logout, showToast, token]); // ★6. 依存配列を修正 (onLogout -> logout)

  const handleAuthorClick = (authorName: string) => { // ★引数に型
    navigate(`/search?q=${encodeURIComponent(authorName)}`);
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>作家名簿を検索中...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
           <span style={{fontSize:'18px'}}>←</span> ダッシュボードへ
        </button>
        <div style={styles.navTitle}>作家一覧</div>
        <div style={{width:'80px'}}></div>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>✒️</span>
            <h2 style={styles.title}>収録作家一覧</h2>
            <p style={styles.sub}>全 {authors.length} 名の作家を収蔵しています</p>
        </header>

        <div style={styles.grid}>
          {authors.map((author, index) => (
            <button 
              key={index} 
              style={styles.authorCard}
              onClick={() => handleAuthorClick(author)}
            >
              <span style={styles.cardIcon}>📖</span>
              <span style={styles.name}>{author}</span>
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

// ★7. styles に型定義を追加
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: { minHeight: '100vh', backgroundColor: theme.colors.background, color: theme.colors.textMain, fontFamily: theme.fonts.body, paddingBottom: '40px' },
  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(252, 249, 242, 0.95)', borderBottom: `1px solid ${theme.colors.border}`, backdropFilter: 'blur(5px)' },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textSub, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: theme.fonts.heading },
  navTitle: { fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  paperContainer: { maxWidth: '900px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)', borderTop: `6px solid ${theme.colors.primary}`, padding: '40px', minHeight: '600px' },
  header: { textAlign: 'center', marginBottom: '50px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '10px' },
  title: { fontSize: '28px', color: theme.colors.primary, fontFamily: theme.fonts.heading, marginBottom: '10px', letterSpacing: '0.1em' },
  sub: { color: theme.colors.textSub, fontSize: '14px', fontFamily: theme.fonts.body },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginBottom: '60px' },
  authorCard: { backgroundColor: '#fff', border: `1px solid ${theme.colors.border}`, borderRadius: '4px', padding: '20px 15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s ease', boxShadow: '0 2px 0 rgba(0,0,0,0.03)' },
  cardIcon: { fontSize: '20px', opacity: 0.6 },
  name: { fontWeight: 'bold', color: theme.colors.textMain, fontSize: '16px', fontFamily: theme.fonts.heading },
  footerArea: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: '20px' },
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  spinner: { width: '40px', height: '40px', border: '3px solid #eee', borderTop: `3px solid ${theme.colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontFamily: theme.fonts.heading, color: theme.colors.textSub },
};

export default AuthorList;