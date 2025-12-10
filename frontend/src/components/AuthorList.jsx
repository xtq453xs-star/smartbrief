import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // 作家をクリックした時の処理
  const handleAuthorClick = (authorName) => {
    // 検索画面へ遷移し、クエリパラメータで作家名を渡すなどの工夫が必要ですが
    // ここではシンプルに検索画面のコンポーネントを呼び出すための準備として
    // App.jsx側でハンドリングしやすいように設計するか、
    // ここでは navigate('/search') して、検索窓に自動入力させるのがスマートです。
    
    // 今回は「検索画面へ遷移して、その作家で検索させる」ために
    // BookSearchコンポーネントがURLパラメータを受け取れるようにするのがベストですが
    // 手っ取り早く、state経由などで実装します。
    // (※App.jsxの改修で /search?q=作家名 で開けるようにします)
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
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' },
  title: { fontSize: '28px', color: '#2c3e50', marginBottom: '5px' },
  sub: { color: '#7f8c8d', marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' },
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