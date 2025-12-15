import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from './Footer';

// ★ Dashboardと同じ高品質カードコンポーネント（ランキング対応版）
const BookCardItem = ({ book, onClick, index, isRanking = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // ランキング用のスタイル調整
  const cardStyle = isRanking ? {
    ...styles.bookCard,
    minWidth: '140px', // ランキングは少し小さめ固定
    maxWidth: '140px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    marginRight: '15px' // カード間の隙間
  } : styles.bookCard;

  const getCoverColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[id % colors.length];
  };

  return (
    <div 
      style={{
        ...cardStyle,
        ...(isHovered && !isRanking ? styles.bookCardHover : {}), // ランキング時は大きく浮かせない（横スクロールの邪魔になるため）
        ...(isHovered && isRanking ? {transform: 'translateY(-4px)'} : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ランキングバッジ */}
      {isRanking && (
        <div style={styles.rankBadge}>{index + 1}</div>
      )}

      {/* 画像エリア */}
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
             background: `linear-gradient(135deg, ${getCoverColor(book.id || index)} 0%, #fff 150%)`, 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center'
           }}>
             <span style={{fontSize: isRanking ? '24px' : '40px'}}>📖</span>
           </div>
         )}
         
         {/* グラデーション（常時表示） */}
         <div style={styles.gradientOverlay}></div>
      </div>

      {/* 情報エリア */}
      <div style={styles.bookInfo}>
        <h4 style={{...styles.bookTitle, fontSize: isRanking ? '13px' : '15px'}}>{book.title}</h4>
        <p style={{...styles.bookAuthor, fontSize: isRanking ? '11px' : '12px'}}>{book.authorName}</p>
        
        {/* HQバッジ (ランキング以外で表示) */}
        {!isRanking && book.highQuality && (
           <span style={styles.hqBadge}>✨ Pro Quality</span>
        )}
      </div>
    </div>
  );
};

const BookSearch = ({ token, onBookSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ページネーション・タブ
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearchType, setCurrentSearchType] = useState(null); 
  const [lastSearchWord, setLastSearchWord] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 

  const LIMIT = 50; 
  const [searchParams] = useSearchParams(); 
  const [rankingBooks, setRankingBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const rankingScrollRef = useRef(null);

  // 初期データ取得
  useEffect(() => {
    fetch('/api/v1/books/ranking?limit=20', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setRankingBooks(data))
    .catch(err => console.error(err));

    fetch('/api/v1/books/authors', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setAuthors(data))
    .catch(err => console.error(err));
  }, [token]);

  // 検索関数
  const fetchBooks = async (type, word, newOffset, isAppend = false) => {
    if (type !== 'translation' && !word) return;
    
    if (!isAppend) {
      setLoading(true);
      setListLoading(true);
      setBooks([]);
    } else {
      setListLoading(true);
    }
    
    setError(null);

    try {
      let url = '';
      const params = `limit=${LIMIT}&offset=${newOffset}&sort=length_desc`;

      if (type === 'text') {
        url = `/api/v1/books/search?q=${encodeURIComponent(word)}&${params}`;
      } else if (type === 'genre') {
        url = `/api/v1/books/search/genre?q=${encodeURIComponent(word)}&${params}`;
      } else if (type === 'translation') {
        url = `/api/v1/books/search?type=translation&${params}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('検索に失敗しました');
      const data = await response.json();

      if (isAppend) {
        setBooks(prev => [...prev, ...data]);
      } else {
        setBooks(data);
      }

      setHasMore(data.length === LIMIT);
      setOffset(newOffset);
      setCurrentSearchType(type);
      setLastSearchWord(word);

    } catch (err) {
      setError('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  const executeSearch = (searchWord) => {
    if (!searchWord || !searchWord.trim()) return;
    setQuery(searchWord);
    setSuggestions([]); setShowSuggestions(false);
    setActiveTab('all');
    fetchBooks('text', searchWord, 0, false);
  };

  const executeGenreSearch = (genreWord) => {
    if (!genreWord) return;
    setQuery(''); 
    setSuggestions([]); setShowSuggestions(false);
    setActiveTab('all'); 
    fetchBooks('genre', genreWord, 0, false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'translation') {
        setQuery('');
        fetchBooks('translation', null, 0, false);
    } else {
        setBooks([]);
        setHasMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || listLoading) return;
    const nextOffset = offset + LIMIT;
    fetchBooks(currentSearchType, lastSearchWord, nextOffset, true);
  };

  useEffect(() => {
    const genreQuery = searchParams.get('genre');
    const textQuery = searchParams.get('q');
    if (genreQuery) executeGenreSearch(genreQuery);
    else if (textQuery) executeSearch(textQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchSubmit = (e) => { e.preventDefault(); executeSearch(query); };

  // サジェスト
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

  const scrollRanking = (direction) => {
    if (rankingScrollRef.current) {
      const { current } = rankingScrollRef;
      const amount = 300;
      current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ranking-scroll::-webkit-scrollbar { display: none; }
        .ranking-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-btn:hover { background-color: rgba(255,255,255,1) !important; transform: scale(1.1); }
        .load-more-btn:hover { background-color: #2b6cb0 !important; }
        .load-more-btn:disabled { background-color: #cbd5e0 !important; cursor: not-allowed; }
      `}</style>
      
      <div style={styles.headerArea}>
        <h2 style={styles.heading}>📚 蔵書検索</h2>
        <p style={styles.subText}>AIが要約した名作文学の世界へ</p>
      </div>

      {/* ランキング */}
      {rankingBooks.length > 0 && activeTab === 'all' && !query && (
        <div style={{marginBottom: '50px'}}>
          <h3 style={styles.sectionTitle}>
            <span>👑</span> 今週の人気ランキング
          </h3>
          <div style={{position: 'relative'}}>
            <button className="scroll-btn" onClick={() => scrollRanking('left')} style={{...styles.scrollButton, left: '-20px'}}>&#10094;</button>
            <div ref={rankingScrollRef} className="ranking-scroll" style={styles.rankingGrid}>
              {rankingBooks.map((book, index) => (
                <BookCardItem 
                  key={`rank-${book.id || index}`}
                  book={book}
                  index={index}
                  onClick={() => onBookSelect(book.id)}
                  isRanking={true}
                />
              ))}
            </div>
            <button className="scroll-btn" onClick={() => scrollRanking('right')} style={{...styles.scrollButton, right: '-20px'}}>&#10095;</button>
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
                <li key={item.id || index} style={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(item)}>
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

      {/* タブ */}
      <div style={styles.tabWrapper}>
          <button 
            style={activeTab === 'all' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => handleTabChange('all')}
          >
            すべて
          </button>
          <button 
            style={activeTab === 'translation' ? styles.activeTabBtn : styles.tabBtn} 
            onClick={() => handleTabChange('translation')}
          >
            🌍 海外翻訳作品
          </button>
      </div>

      {/* 作家チップス */}
      {activeTab === 'all' && authors.length > 0 && !query && (
        <div style={styles.authorSection}>
          <p style={styles.authorLabel}>人気の作家から探す</p>
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

      {/* 検索結果グリッド */}
      <div className="book-grid-container" style={{marginBottom: '40px'}}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={{...styles.spinner, borderColor: '#ccc', borderTopColor: '#007bff'}}></div>
            <span style={{marginLeft: '10px', color: '#666'}}>本棚から探しています...</span>
          </div>
        ) : books.length > 0 ? (
          <>
            <div style={styles.grid}>
              {books.map((book, index) => (
                <BookCardItem 
                  key={`${book.id}-${index}`} 
                  book={book} 
                  index={index}
                  onClick={() => onBookSelect(book.id)} 
                />
              ))}
            </div>

            {hasMore && (
              <div style={{textAlign: 'center', marginTop: '40px'}}>
                <button 
                  className="load-more-btn"
                  onClick={loadMore} 
                  disabled={listLoading}
                  style={styles.loadMoreButton}
                >
                  {listLoading ? (
                    <span style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div style={{...styles.spinner, width:'15px', height:'15px'}}></div> 読み込み中...
                    </span>
                  ) : (
                    'もっと見る'
                  )}
                </button>
              </div>
            )}
          </>
        ) : ( 
          !loading && (query || activeTab === 'translation') && !error && (
            <div style={styles.emptyState}>
              <div style={{fontSize: '48px', marginBottom: '10px'}}>🤔</div>
              <p style={styles.noResult}>本が見つかりませんでした</p>
              <p style={{fontSize: '14px'}}>キーワードを変えるか、作家名で検索してみてください</p>
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
};

// --- Styles (Dashboardと共通化) ---
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: '"Shippori Mincho", "Yu Mincho", serif', color: '#4a3b32' },
  headerArea: { textAlign: 'center', marginBottom: '40px' },
  heading: { fontSize: '32px', color: '#2d2420', marginBottom: '10px', fontWeight: 'bold' },
  subText: { color: '#8d6e63', fontSize: '15px', letterSpacing: '1px' },
  
  sectionTitle: { fontSize: '20px', color: '#4a3b32', marginBottom: '20px', display:'flex', alignItems:'center', gap:'10px', fontWeight: 'bold' },

  // --- 検索フォーム ---
  form: { display: 'flex', gap: '10px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px auto', position: 'relative' },
  inputWrapper: { flex: 1, position: 'relative' },
  input: { 
    width: '100%', 
    padding: '16px 24px', 
    fontSize: '16px', 
    border: '1px solid #d7ccc8', 
    borderRadius: '50px', 
    outline: 'none', 
    boxSizing: 'border-box', 
    transition: 'all 0.2s', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    fontFamily: '"Noto Sans JP", sans-serif'
  },
  button: { 
    padding: '0 30px', 
    backgroundColor: '#5d4037', 
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: '16px', 
    minWidth: '100px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s'
  },
  
  // --- カードデザイン (Dashboardと完全統一) ---
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
    gap: '30px' 
  },
  
  rankingGrid: { display: 'flex', overflowX: 'auto', padding: '10px 5px 20px 5px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' },

  bookCard: { 
    position: 'relative',
    backgroundColor: '#000', // 画像ロード前
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)', 
    cursor: 'pointer', 
    transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
    border: 'none',
    aspectRatio: '2 / 3', // ★ 縦横比固定
  },

  bookCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },

  bookCover: { 
    height: '100%', 
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  },

  bookImage: {
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },

  bookImageHover: {
    transform: 'scale(1.08)', // ズーム
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '70%', 
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },

  bookInfo: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0,
    width: '100%',
    padding: '15px', 
    zIndex: 2,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    textAlign: 'left'
  },

  bookTitle: { 
    margin: '0 0 5px 0',
    fontWeight: 'bold', 
    color: '#fff', 
    lineHeight: '1.4',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    display: '-webkit-box', 
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden',
  },
  
  bookAuthor: { 
    margin: 0,
    color: 'rgba(255,255,255,0.85)', 
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
    fontFamily: '"sans-serif"'
  },

  hqBadge: {
    marginTop: '6px',
    alignSelf: 'flex-start',
    fontSize: '10px',
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },

  rankBadge: { position: 'absolute', top: '0', left: '0', width: '30px', height: '30px', backgroundColor: '#FFD700', color: '#4a3b32', borderBottomRightRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', zIndex: 10, boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' },
  
  // --- その他パーツ ---
  scrollButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, fontSize: '18px', color: '#5d4037', transition: 'all 0.2s' },
  
  loadMoreButton: { padding: '12px 50px', backgroundColor: 'transparent', color: '#5d4037', border: '2px solid #5d4037', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  
  tabWrapper: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' },
  tabBtn: { padding: '10px 24px', borderRadius: '25px', border: '1px solid #d7ccc8', backgroundColor: 'transparent', color: '#8d6e63', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '14px' },
  activeTabBtn: { padding: '10px 24px', borderRadius: '25px', border: 'none', backgroundColor: '#5d4037', color: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(93, 64, 55, 0.3)', fontSize: '14px' },

  suggestionList: { position: 'absolute', top: '100%', left: '10px', right: '10px', backgroundColor: 'white', border: 'none', borderRadius: '12px', listStyle: 'none', padding: '10px 0', margin: '10px 0 0 0', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  suggestionItem: { padding: '12px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' },
  suggestionTitle: { fontWeight: 'bold', color: '#2d3748' },
  suggestionAuthor: { fontSize: '12px', color: '#718096' },
  
  authorSection: { marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px auto', textAlign: 'center' },
  authorLabel: { fontSize: '13px', color: '#8d6e63', marginBottom: '15px', fontWeight: 'bold', letterSpacing: '1px' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' },
  authorChip: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #d7ccc8', backgroundColor: '#fff', color: '#5d4037', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  
  spinner: { width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' },
  error: { color: '#e53e3e', textAlign: 'center' },
  loadingContainer: { textAlign: 'center', padding: '60px' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#8d6e63' },
  noResult: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#5d4037' },
};

export default BookSearch;