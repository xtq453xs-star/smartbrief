import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from './Footer';

// ★修正: 検索ヒット率を上げるため、姓と名の間に半角スペースを追加
// これでDB上の「宮沢 賢治」と一致しやすくなります
const POPULAR_AUTHORS = [
  // --- グループA: 幻想・ロマン ---
  { name: '宮沢 賢治', file: 'miyazawa_kenji.png' },
  { name: '小川 未明', file: 'ogawa_mimei.png' },
  { name: '泉 鏡花', file: 'izumi_kyoka.png' },
  { name: '萩原 朔太郎', file: 'hagiwara_sakutarou.png' },
  { name: '堀 辰雄', file: 'hori_tatsuo.png' },
  { name: '中原 中也', file: 'nakahara_chuya.png' },
  { name: '牧野 信一', file: 'makino_shinichi.png' },
  { name: '豊島 与志雄', file: 'toyoshima_toshio.png' },
  
  // --- グループB: 無頼・近代 ---
  { name: '太宰 治', file: 'dazai_osamu.png' },
  { name: '坂口 安吾', file: 'sakaguchi_ango.png' },
  { name: '芥川 龍之介', file: 'akutagawa_ryunosuke.png' },
  { name: '夏目 漱石', file: 'natsume_soseki.png' },
  { name: '田山 録弥', file: 'tayama_rokuya.png' },
  { name: '菊池 寛', file: 'kikuchi_kan.png' },
  { name: '山本 周五郎', file: 'yamamoto_shugorou.png' },
  
  // --- グループC: 科学・思想・芸術 ---
  { name: '寺田 寅彦', file: 'terada_torahiko.png' },
  { name: '中谷 宇吉郎', file: 'nakaya_ukichiro.png' },
  { name: '北大路 魯山人', file: 'kitaooji_rosannzin.png' },
  { name: '岡本 かの子', file: 'okamoto_kanoko.png' },
  { name: '宮本 百合子', file: 'miyamoto_yuriko.png' },
  { name: '伊藤 野枝', file: 'ito_noe.png' },
  { name: '原 民喜', file: 'hara_tamiki.png' },
  { name: '岸田 國士', file: 'kishida_kunio.png' },
  { name: '折口 信夫', file: 'origuchi_nobuo.png' },
  
  // --- グループD: エンタメ・ミステリー ---
  { name: '江戸川 乱歩', file: 'edogawa_ranpo.png' },
  { name: '夢野 久作', file: 'yumeno_kyusaku.png' },
  { name: '海野 十三', file: 'uno_juza.png' },
  { name: '国枝 史郎', file: 'kunieda_shiro.png' },
  { name: '久生 十蘭', file: 'hisao_juran.png' },
  { name: '岡本 綺堂', file: 'okamoto_kido.png' },
  { name: '野村 胡堂', file: 'nomura_kodou.png' },
  { name: '吉川 英治', file: 'yoshikawa_eiji.png' },
  { name: '坂本 竜馬', file: 'sakamoto_ryoma.png' },
  { name: '永井 荷風', file: 'nagai_kafu.png' },
  { name: '新美 南吉', file: 'niimi_nankichi.png' },
  { name: '今野 大力', file: 'konno_dairiki.png' },
  { name: '佐藤 垢石', file: 'sato_kaseki.png' },
  { name: '田中 貢太郎', file: 'tanaka_koutarou.png' },
];

// --- コンポーネント定義 ---

// 通常の作品カード
const BookCardItem = ({ book, onClick, index, isRanking = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // ランキング・作家カード用の共通スタイルベース
  const cardStyle = isRanking ? {
    ...styles.bookCard,
    minWidth: '120px', 
    maxWidth: '120px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    marginRight: '15px'
  } : styles.bookCard;

  const getCoverColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[id % colors.length];
  };

  return (
    <div 
      style={{
        ...cardStyle,
        ...(isHovered && !isRanking ? styles.bookCardHover : {}),
        ...(isHovered && isRanking ? {transform: 'translateY(-4px)'} : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRanking && <div style={styles.rankBadge}>{index + 1}</div>}

      <div style={styles.bookCover}>
         {book.image_url ? (
           <img 
             src={book.image_url} 
             alt={`${book.title} - ${book.authorName} の要約・あらすじ`}
             style={{
               ...styles.bookImage,
               ...(isHovered ? styles.bookImageHover : {})
             }} 
           />
         ) : (
           <div style={{
             width: '100%', height: '100%', 
             background: `linear-gradient(135deg, ${getCoverColor(book.id || index)} 0%, #fff 150%)`, 
             display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
             <span style={{fontSize: isRanking ? '24px' : '40px'}}>📖</span>
           </div>
         )}
         <div style={styles.gradientOverlay}></div>
      </div>

      <div style={styles.bookInfo}>
        <h4 style={{...styles.bookTitle, fontSize: isRanking ? '12px' : '15px'}}>{book.title}</h4>
        <p style={{...styles.bookAuthor, fontSize: isRanking ? '10px' : '12px'}}>{book.authorName}</p>
        {!isRanking && book.highQuality && <span style={styles.hqBadge}>✨ Pro</span>}
      </div>
    </div>
  );
};

// 作家カードコンポーネント
const AuthorCardItem = ({ author, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.bookCard, // 基本スタイルは本と同じ
        minWidth: '120px',
        maxWidth: '120px',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        marginRight: '15px',
        ...(isHovered ? {transform: 'translateY(-4px)'} : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         <img 
             src={`https://assets.smartbrief.jp/${author.file}`}
             alt={`${author.name}の作品一覧`}
             style={{
               ...styles.bookImage,
               ...(isHovered ? styles.bookImageHover : {})
             }} 
         />
         <div style={styles.gradientOverlay}></div>
      </div>

      <div style={styles.bookInfo}>
        <p style={{...styles.bookAuthor, fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>作家</p>
        <h4 style={{...styles.bookTitle, fontSize: '13px', marginBottom: '5px'}}>{author.name}</h4>
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
  
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearchType, setCurrentSearchType] = useState(null); 
  const [lastSearchWord, setLastSearchWord] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 

  const LIMIT = 50; 
  const [searchParams] = useSearchParams(); 
  const [rankingBooks, setRankingBooks] = useState([]);
  
  // スクロール用Ref
  const rankingScrollRef = useRef(null);
  const authorScrollRef = useRef(null);

  // 初期データ取得
  useEffect(() => {
    fetch('/api/v1/books/ranking?limit=20', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : [])
    .then(data => setRankingBooks(data))
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
    // 検索したらトップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // 横スクロール関数
  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const amount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-btn:hover { background-color: rgba(255,255,255,1) !important; transform: scale(1.1); }
        .load-more-btn:hover { background-color: #2b6cb0 !important; }
        .load-more-btn:disabled { background-color: #cbd5e0 !important; cursor: not-allowed; }
      `}</style>
      
      <div style={styles.headerArea}>
        <h2 style={styles.heading}>📚 蔵書検索</h2>
        <p style={styles.subText}>AIが要約した名作文学の世界へ</p>
      </div>

      {/* --- ランキングセクション --- */}
      {rankingBooks.length > 0 && activeTab === 'all' && !query && (
        <div style={{marginBottom: '50px'}}>
          <h3 style={styles.sectionTitle}>
            <span>👑</span> 今週の人気ランキング
          </h3>
          <div style={{position: 'relative'}}>
            <button className="scroll-btn" onClick={() => scrollContainer(rankingScrollRef, 'left')} style={{...styles.scrollButton, left: '-20px'}}>&#10094;</button>
            <div ref={rankingScrollRef} className="hide-scrollbar" style={styles.rankingGrid}>
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
            <button className="scroll-btn" onClick={() => scrollContainer(rankingScrollRef, 'right')} style={{...styles.scrollButton, right: '-20px'}}>&#10095;</button>
          </div>
        </div>
      )}

      {/* --- 人気作家セクション --- */}
      {activeTab === 'all' && !query && (
        <div style={{marginBottom: '50px'}}>
          <h3 style={styles.sectionTitle}>
            <span>✒️</span> 人気作家から探す
          </h3>
          <div style={{position: 'relative'}}>
            <button className="scroll-btn" onClick={() => scrollContainer(authorScrollRef, 'left')} style={{...styles.scrollButton, left: '-20px'}}>&#10094;</button>
            <div ref={authorScrollRef} className="hide-scrollbar" style={styles.rankingGrid}>
              {POPULAR_AUTHORS.map((author, index) => (
                <AuthorCardItem 
                  key={`auth-${index}`}
                  author={author}
                  onClick={() => executeSearch(author.name)}
                />
              ))}
            </div>
            <button className="scroll-btn" onClick={() => scrollContainer(authorScrollRef, 'right')} style={{...styles.scrollButton, right: '-20px'}}>&#10095;</button>
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

// --- Styles ---
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
  
  // --- カードデザイン ---
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: '20px' 
  },
  
  // 横スクロール用コンテナ
  rankingGrid: { display: 'flex', overflowX: 'auto', padding: '10px 5px 20px 5px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' },

  bookCard: { 
    position: 'relative',
    backgroundColor: '#000', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)', 
    cursor: 'pointer', 
    transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
    border: 'none',
    aspectRatio: '2 / 3', 
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
    transform: 'scale(1.08)', 
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
    padding: '10px', 
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
  
  scrollButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, fontSize: '18px', color: '#5d4037', transition: 'all 0.2s' },
  
  loadMoreButton: { padding: '12px 50px', backgroundColor: 'transparent', color: '#5d4037', border: '2px solid #5d4037', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  
  tabWrapper: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' },
  tabBtn: { padding: '10px 24px', borderRadius: '25px', border: '1px solid #d7ccc8', backgroundColor: 'transparent', color: '#8d6e63', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '14px' },
  activeTabBtn: { padding: '10px 24px', borderRadius: '25px', border: 'none', backgroundColor: '#5d4037', color: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(93, 64, 55, 0.3)', fontSize: '14px' },

  suggestionList: { position: 'absolute', top: '100%', left: '10px', right: '10px', backgroundColor: 'white', border: 'none', borderRadius: '12px', listStyle: 'none', padding: '10px 0', margin: '10px 0 0 0', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  suggestionItem: { padding: '12px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' },
  suggestionTitle: { fontWeight: 'bold', color: '#2d3748' },
  suggestionAuthor: { fontSize: '12px', color: '#718096' },
  
  spinner: { width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' },
  error: { color: '#e53e3e', textAlign: 'center' },
  loadingContainer: { textAlign: 'center', padding: '60px' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#8d6e63' },
  noResult: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#5d4037' },
};

export default BookSearch;