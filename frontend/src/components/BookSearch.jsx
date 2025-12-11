import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// ★追加: Footer読み込み
import Footer from './Footer';

const BookSearch = ({ token, onBookSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchParams] = useSearchParams(); 
  const [rankingBooks, setRankingBooks] = useState([]);
  const [authors, setAuthors] = useState([]);

  // --- 初期データ取得 ---
  useEffect(() => {
    fetch('/api/v1/books/ranking', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setRankingBooks(data))
    .catch(err => console.error("Ranking fetch error", err));

    fetch('/api/v1/books/authors', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setAuthors(data))
    .catch(err => console.error("Authors fetch error", err));
  }, [token]);

  // --- 通常検索実行 ---
  const executeSearch = async (searchWord) => {
    if (!searchWord || !searchWord.trim()) return;
    setLoading(true); setListLoading(true); setError(null);
    setSuggestions([]); setShowSuggestions(false); setBooks([]); setQuery(searchWord);

    try {
      const response = await fetch(`/api/v1/books/search?q=${encodeURIComponent(searchWord)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('検索に失敗しました');
      const data = await response.json();
      setBooks(data);
    } catch (err) { setError('検索中にエラーが発生しました。'); } 
    finally { setLoading(false); setListLoading(false); }
  };

  // --- ジャンル検索実行 ---
  const executeGenreSearch = async (genreWord) => {
    if (!genreWord) return;
    setLoading(true); setListLoading(true); setError(null);
    setSuggestions([]); setShowSuggestions(false); setBooks([]); setQuery(`ジャンル: ${genreWord}`);

    try {
      const response = await fetch(`/api/v1/books/search/genre?q=${encodeURIComponent(genreWord)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('ジャンル検索に失敗しました');
      const data = await response.json();
      setBooks(data);
    } catch (err) { setError('検索中にエラーが発生しました。'); } 
    finally { setLoading(false); setListLoading(false); }
  };

  // --- URLパラメータ監視 ---
  useEffect(() => {
    const genreQuery = searchParams.get('genre');
    const textQuery = searchParams.get('q');
    if (genreQuery) executeGenreSearch(genreQuery);
    else if (textQuery) executeSearch(textQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchSubmit = (e) => { e.preventDefault(); executeSearch(query); };

  // --- デバウンス処理 ---
  useEffect(() => {
    if (!query.trim() || query.startsWith('ジャンル:')) { setSuggestions([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/books/suggest?q=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data); setShowSuggestions(true);
        }
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  const handleSuggestionClick = (book) => {
    setQuery(book.title); setSuggestions([]); onBookSelect(book.id);
  };

  const getCoverColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[id % colors.length];
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .book-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .ranking-scroll::-webkit-scrollbar { display: none; }
        .ranking-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div style={styles.headerArea}>
        <h2 style={styles.heading}>📚 本を探す</h2>
        <p style={styles.subText}>AIが要約した名作文学の世界へ</p>
      </div>

      {/* ランキング表示 */}
      {rankingBooks.length > 0 && (
        <div style={{marginBottom: '40px'}}>
          <h3 style={{fontSize: '18px', color: '#4a5568', marginBottom: '15px', display:'flex', alignItems:'center', gap:'8px'}}>
            <span>👑</span> 今週の人気ランキング
          </h3>
          <div className="ranking-scroll" style={styles.rankingGrid}>
            {rankingBooks.map((book, index) => (
              <div key={`rank-${book.id || index}`} style={styles.rankingCard} onClick={() => onBookSelect(book.id)}>
                <div style={styles.rankBadge}>{index + 1}</div>
                <div style={{...styles.coverImage, height: '100px', background: `linear-gradient(135deg, ${getCoverColor(book.id || index)} 0%, #fff 100%)`}}>
                  <span style={{...styles.coverTitle, fontSize: '10px'}}>{book.title}</span>
                </div>
                <div style={{padding: '10px'}}>
                  <div style={{...styles.bookTitle, fontSize: '12px'}}>{book.title}</div>
                  <div style={{...styles.bookAuthor, fontSize: '10px'}}>{book.authorName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 検索フォーム */}
      <form onSubmit={handleSearchSubmit} style={styles.form}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && !query.startsWith('ジャンル:') && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="作品名・作家名で検索..."
            style={styles.input}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={styles.suggestionList}>
              {suggestions.map((item, index) => (
                <li 
                  key={item.id || index}
                  style={styles.suggestionItem}
                  onMouseDown={() => handleSuggestionClick(item)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span style={styles.suggestionTitle}>{item.title}</span>
                  <span style={styles.suggestionAuthor}>{item.authorName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? <div style={styles.spinner} /> : '検索'}
        </button>
      </form>

      {/* 人気作家チップス */}
      {authors.length > 0 && (
        <div style={styles.authorSection}>
          <p style={styles.authorLabel}>👩‍🏫 人気の作家から探す:</p>
          <div style={styles.chipContainer}>
            {authors.map((author, index) => (
              <button key={index} style={styles.authorChip} onClick={() => executeSearch(author)}>
                {author}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* 検索結果 */}
      <div className="book-grid-container" style={{marginBottom: '40px'}}>
        {listLoading ? (
          <div style={styles.loadingContainer}>
            <div style={{...styles.spinner, borderColor: '#ccc', borderTopColor: '#007bff'}}></div>
            <span style={{marginLeft: '10px', color: '#666'}}>本棚から探しています...</span>
          </div>
        ) : books.length > 0 ? (
          <div style={styles.grid}>
            {books.map((book, index) => (
              <div 
                key={book.id || index}
                className="book-card"
                style={styles.card}
                onClick={() => onBookSelect(book.id)}
              >
                <div style={{...styles.coverImage, background: `linear-gradient(135deg, ${getCoverColor(book.id || index)} 0%, #fff 100%)`}}>
                  <span style={styles.coverTitle}>{book.title}</span>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.bookTitle}>{book.title}</div>
                  <div style={styles.bookAuthor}>{book.authorName}</div>
                  {(book.highQuality || book.isHq) && <span style={styles.hqBadge}>✨ おすすめ</span>}
                </div>
              </div>
            ))}
          </div>
        ) : ( 
          !loading && query && !error && (
            <div style={styles.emptyState}>
              <p style={styles.noResult}>本が見つかりませんでした 😢</p>
              <p style={{fontSize: '14px'}}>別のキーワードを試してみてください</p>
            </div>
          )
        )}
      </div>

      {/* ★追加: 共通フッター */}
      <Footer />
    </div>
  );
};

// スタイル定義
const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
  headerArea: { textAlign: 'center', marginBottom: '30px' },
  heading: { fontSize: '28px', color: '#1a202c', marginBottom: '10px' },
  subText: { color: '#718096', fontSize: '16px' },
  form: { display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px auto', position: 'relative' },
  inputWrapper: { flex: 1, position: 'relative' },
  input: { width: '100%', padding: '15px 20px', fontSize: '16px', border: '2px solid #edf2f7', borderRadius: '50px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  button: { padding: '0 30px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(49, 130, 206, 0.2)' },
  suggestionList: { position: 'absolute', top: '100%', left: '10px', right: '10px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', listStyle: 'none', padding: '5px 0', margin: '5px 0 0 0', zIndex: 1000, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
  suggestionItem: { padding: '12px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  suggestionTitle: { fontWeight: 'bold', color: '#2d3748' },
  suggestionAuthor: { fontSize: '12px', color: '#718096' },
  spinner: { width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' },
  error: { color: '#e53e3e', textAlign: 'center' },
  loadingContainer: { textAlign: 'center', padding: '50px' },
  emptyState: { textAlign: 'center', padding: '50px', color: '#718096' },
  noResult: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' },
  authorSection: { marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px auto', textAlign: 'center' },
  authorLabel: { fontSize: '13px', color: '#7f8c8d', marginBottom: '10px', fontWeight: 'bold' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  authorChip: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#4a5568', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' },
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' },
  coverImage: { height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: '#1a202c', position: 'relative' },
  coverTitle: { fontSize: '14px', fontWeight: 'bold', opacity: 0.7, maxHeight: '100%', overflow: 'hidden' },
  cardContent: { padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  bookTitle: { fontWeight: 'bold', fontSize: '15px', color: '#2d3748', marginBottom: '5px', lineHeight: '1.4' },
  bookAuthor: { color: '#718096', fontSize: '13px', marginBottom: '10px' },
  hqBadge: { fontSize: '11px', backgroundColor: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '10px', border: '1px solid #FCD34D', alignSelf: 'flex-start', fontWeight: 'bold' },
  rankingGrid: { display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollSnapType: 'x mandatory' },
  rankingCard: { minWidth: '120px', maxWidth: '120px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #f0f0f0', position: 'relative', flexShrink: 0, scrollSnapAlign: 'start' },
  rankBadge: { position: 'absolute', top: '5px', left: '5px', width: '24px', height: '24px', backgroundColor: '#FFD700', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }
};

export default BookSearch;