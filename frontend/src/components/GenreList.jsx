import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GenreList = ({ token, onBack }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ジャンル一覧を取得
    fetch('/api/v1/books/genres', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setGenres(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  const handleGenreClick = (genre) => {
    // 検索画面へ遷移 (genreパラメータを渡す)
    navigate(`/search?genre=${encodeURIComponent(genre)}`);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>読み込み中...</div>;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>← ダッシュボードへ</button>
      
      <div style={styles.header}>
        <h2 style={styles.title}>🎨 ジャンルから探す</h2>
        <p style={styles.sub}>
          全{genres.length}種類のジャンルから、今の気分に合う本を探せます。
        </p>
      </div>

      <div style={styles.grid}>
        {genres.map((genre, index) => (
          <button 
            key={index} 
            style={styles.genreCard}
            onClick={() => handleGenreClick(genre)}
          >
            <div style={styles.icon}>🏷️</div>
            <div style={styles.name}>{genre}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { 
    maxWidth: '900px', margin: '0 auto', padding: '20px 20px 60px',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  backButton: { 
    padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', 
    borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', color: '#555' 
  },
  header: { textAlign: 'center', marginBottom: '40px' },
  title: { fontSize: '28px', color: '#2c3e50', marginBottom: '10px', fontWeight: 'bold' },
  sub: { color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6' },
  
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: '15px' 
  },
  genreCard: {
    backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '30px', // 丸くする
    padding: '15px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    fontSize: '15px', color: '#333', fontWeight: 'bold'
  },
  icon: { fontSize: '18px' },
  name: { }
};

export default GenreList;