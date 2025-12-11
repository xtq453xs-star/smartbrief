import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ★追加: Footer読み込み
import Footer from './Footer';

const AuthorList = ({ token, onBack }) => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/books/authors/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setAuthors(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  const handleAuthorClick = (authorName) => {
    navigate(`/search?q=${encodeURIComponent(authorName)}`);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>← ダッシュボードへ</button>
      
      <h2 style={styles.title}>👥 収録作家一覧 ({authors.length}名)</h2>
      <p style={styles.sub}>作品数が多い順に表示しています</p>

      <div style={styles.grid}>
        {authors.map((author, index) => (
          <button 
            key={index} 
            style={styles.authorCard}
            onClick={() => handleAuthorClick(author)}
          >
            <div style={styles.icon}>✒️</div>
            <div style={styles.name}>{author}</div>
          </button>
        ))}
      </div>

      {/* ★追加: 共通フッター */}
      <Footer />
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px 20px 60px' },
  backButton: { padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' },
  title: { fontSize: '28px', color: '#2c3e50', marginBottom: '5px' },
  sub: { color: '#7f8c8d', marginBottom: '30px' },
  grid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: '15px', marginBottom: '40px' 
  },
  authorCard: {
    backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px',
    padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', transition: '0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  icon: { fontSize: '24px', marginBottom: '10px' },
  name: { fontWeight: 'bold', color: '#333', fontSize: '14px' }
};

export default AuthorList;