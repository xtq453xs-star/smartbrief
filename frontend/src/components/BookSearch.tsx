import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore'; // ★1. Storeをインポート

// --- 型定義 ---
interface Book {
  id: number;
  title: string;
  authorName: string;
  image_url?: string;
  highQuality?: boolean;
}

interface Author {
  name: string;
  file: string;
}

interface Suggestion {
  id: number;
  title: string;
  authorName: string;
}

interface BookSearchProps {
  onBookSelect: (id: number) => void;
}

// サブコンポーネント用のProps型
interface BookCardItemProps {
  book: Book;
  onClick: () => void;
  index: number;
  isRanking?: boolean;
}

interface AuthorCardItemProps {
  author: Author;
  onClick: () => void;
}

// --- 作家リスト ---
const POPULAR_AUTHORS: Author[] = [
  // ... (中略：データは元のまま) ...
  { name: '宮沢 賢治', file: 'miyazawa_kenji.png' },
  { name: '小川 未明', file: 'ogawa_mimei.png' },
  { name: '泉 鏡花', file: 'izumi_kyoka.png' },
  { name: '萩原 朔太郎', file: 'hagiwara_sakutarou.png' },
  { name: '堀 辰雄', file: 'hori_tatsuo.png' },
  { name: '中原 中也', file: 'nakahara_chuya.png' },
  { name: '牧野 信一', file: 'makino_shinichi.png' },
  { name: '豊島 与志雄', file: 'toyoshima_toshio.png' },
  { name: '太宰 治', file: 'dazai_osamu.png' },
  { name: '坂口 安吾', file: 'sakaguchi_ango.png' },
  { name: '芥川 竜之介', file: 'akutagawa_ryunosuke.png' },
  { name: '夏目 漱石', file: 'natsume_soseki.png' },
  { name: '田山 録弥', file: 'tayama_rokuya.png' },
  { name: '菊池 寛', file: 'kikuchi_kan.png' },
  { name: '山本 周五郎', file: 'yamamoto_shugorou.png' },
  { name: '寺田 寅彦', file: 'terada_torahiko.png' },
  { name: '中谷 宇吉郎', file: 'nakaya_ukichiro.png' },
  { name: '北大路 魯山人', file: 'kitaooji_rosannzin.png' },
  { name: '岡本 かの子', file: 'okamoto_kanoko.png' },
  { name: '宮本 百合子', file: 'miyamoto_yuriko.png' },
  { name: '伊藤 野枝', file: 'ito_noe.png' },
  { name: '原 民喜', file: 'hara_tamiki.png' },
  { name: '岸田 國士', file: 'kishida_kunio.png' },
  { name: '折口 信夫', file: 'origuchi_nobuo.png' },
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

// --- 共通BookCardコンポーネント ---
const BookCardItem: React.FC<BookCardItemProps> = ({ book, onClick, index, isRanking = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    ...styles.bookCard,
    ...(isRanking ? { minWidth: '120px', maxWidth: '120px', flexShrink: 0, scrollSnapAlign: 'start', marginRight: '15px' } as React.CSSProperties : {}),
    ...(isHovered ? styles.bookCardHover : {}),
  };

  const getCoverColor = (id: number) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[(id || 0) % colors.length];
  };

  return (
    <div 
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRanking && <div style={styles.rankBadge}>{index + 1}</div>}

      <div style={styles.bookCover}>
         {book.image_url ? (
           <img src={book.image_url} alt={book.title} style={{...styles.bookImage, ...(isHovered ? styles.bookImageHover : {})}} />
         ) : (
           <div style={{...styles.noImageCover, background: `linear-gradient(135deg, ${getCoverColor(book.id)} 0%, #fff 150%)`}}>
             <span style={{fontSize: isRanking ? '24px' : '40px'}}>📖</span>
           </div>
         )}
         <div style={styles.gradientOverlay}></div>
      </div>

      <div style={styles.bookInfo}>
        <h4 style={{...styles.bookTitle, fontSize: isRanking ? '12px' : '14px'}}>{book.title}</h4>
        <p style={{...styles.bookAuthor, fontSize: isRanking ? '10px' : '11px'}}>{book.authorName}</p>
        {!isRanking && book.highQuality && <span style={styles.hqBadge}>✨ Pro</span>}
      </div>
    </div>
  );
};

// --- 共通AuthorCardコンポーネント ---
const AuthorCardItem: React.FC<AuthorCardItemProps> = ({ author, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.bookCard,
        minWidth: '120px', maxWidth: '120px', flexShrink: 0, scrollSnapAlign: 'start', marginRight: '15px',
        ...(isHovered ? styles.bookCardHover : {})
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.bookCover}>
         <img 
             src={`https://assets.smartbrief.jp/${author.file}`} 
             alt={author.name} 
             style={{...styles.bookImage, ...(isHovered ? styles.bookImageHover : {})}} 
         />
         <div style={styles.gradientOverlay}></div>
      </div>
      <div style={styles.bookInfo}>
        <p style={{...styles.bookAuthor, fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>作家</p>
        <h4 style={{...styles.bookTitle, fontSize: '13px'}}>{author.name}</h4>
      </div>
    </div>
  );
};

// --- メインコンポーネント ---
const BookSearch: React.FC<BookSearchProps> = ({ onBookSelect }) => {
  const { showToast } = useToast();
  // ★2. Propsから消した onLogout を Storeから取得
  const { logout } = useAuthStore(); 
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearchType, setCurrentSearchType] = useState<string | null>(null); 
  const [lastSearchWord, setLastSearchWord] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [rankingBooks, setRankingBooks] = useState<Book[]>([]);

  const [searchMode, setSearchMode] = useState<'keyword' | 'ai'>('keyword');

  const LIMIT = 50; 
  const [searchParams] = useSearchParams(); 
  
  // ★3. useRef に型と初期値 null を指定
  const rankingScrollRef = useRef<HTMLDivElement | null>(null);
  const authorScrollRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(async <T,>(endpoint: string): Promise<T | null> => {
    const res = await apiClient.get<T>(endpoint);
    if (res.ok) return res.data;
    showToast(res.message || 'データ取得エラー', 'error');
    if (res.status === 401) logout();
    return null;
  }, [logout, showToast]);

  useEffect(() => {
    fetchData<Book[]>('/books/ranking?limit=20').then(data => setRankingBooks(data || []));
  }, [fetchData]);

  const fetchBooks = async (type: string, word: string | null, newOffset: number, isAppend = false) => {
    if (type !== 'translation' && !word) return;
    
    if (!isAppend) { setLoading(true); setListLoading(true); setBooks([]); } 
    else { setListLoading(true); }
    
    setError(null);

    try {
      let url = '';
      const encodedWord = encodeURIComponent(word || '');

      if (type === 'ai') {
          url = `/books/search/ai?q=${encodedWord}`;
          if (isAppend) { setLoading(false); setListLoading(false); return; }
      } else {
          const params = `limit=${LIMIT}&offset=${newOffset}&sort=length_desc`;
          if (type === 'text') url = `/books/search?q=${encodedWord}&${params}`;
          else if (type === 'genre') url = `/books/search/genre?q=${encodedWord}&${params}`;
          else if (type === 'translation') url = `/books/search?type=translation&${params}`;
      }

      const data = await fetchData<Book[]>(url);
      if (!data) throw new Error('検索エラー');

      if (isAppend) setBooks(prev => [...prev, ...data]);
      else setBooks(data);

      setHasMore(data.length === LIMIT);
      setOffset(newOffset);
      setCurrentSearchType(type);
      setLastSearchWord(word || '');

    } catch {
      setError('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  const executeSearch = (searchWord: string) => {
    if (!searchWord || !searchWord.trim()) return;
    setQuery(searchWord);
    setSuggestions([]); setShowSuggestions(false);
    setActiveTab('all');
    
    const type = searchMode === 'ai' ? 'ai' : 'text';
    fetchBooks(type, searchWord, 0, false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeGenreSearch = (genreWord: string) => {
    if (!genreWord) return;
    setQuery(''); setSuggestions([]); setShowSuggestions(false);
    setActiveTab('all'); 
    fetchBooks('genre', genreWord, 0, false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'translation') {
        setQuery('');
        fetchBooks('translation', null, 0, false);
    } else {
        setBooks([]); setHasMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || listLoading || currentSearchType === 'ai') return;
    fetchBooks(currentSearchType!, lastSearchWord, offset + LIMIT, true);
  };

  useEffect(() => {
    const genreQuery = searchParams.get('genre');
    const textQuery = searchParams.get('q');
    if (genreQuery) executeGenreSearch(genreQuery);
    else if (textQuery) executeSearch(textQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); executeSearch(query); };

  useEffect(() => {
    if (searchMode === 'ai') { setSuggestions([]); return; }
    if (!query || !query.trim() || query.startsWith('ジャンル:')) { setSuggestions([]); return; }

    const timer = setTimeout(async () => {
        try {
            const encodedQ = encodeURIComponent(query.trim());
            const res = await apiClient.get<Suggestion[]>(`/books/suggest?q=${encodedQ}`);
            if (res.ok && res.data) {
                 setSuggestions(res.data); 
                 setShowSuggestions(true);
            }
        } catch (e) {
            console.error("Suggestion silent error:", e);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMode]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container}>
      {/* ...JSXは変更なしのため省略せず全て記述... */}
      <div style={styles.headerArea}>
        <h2 style={styles.heading}>📚 蔵書検索</h2>
        <p style={styles.subText}>AIが要約した名作文学の世界へ</p>
      </div>

      {rankingBooks.length > 0 && activeTab === 'all' && !query && (
        <div style={{marginBottom: '50px'}}>
          <h3 style={styles.sectionTitle}>👑 今週の人気ランキング</h3>
          <div style={{position: 'relative'}}>
            <button style={{...styles.scrollButton, left: '-20px'}} onClick={() => scrollContainer(rankingScrollRef, 'left')}>&#10094;</button>
            <div ref={rankingScrollRef} style={styles.horizontalScroll}>
              {rankingBooks.map((book, i) => (
                <BookCardItem key={`rank-${i}`} book={book} index={i} onClick={() => onBookSelect(book.id)} isRanking={true} />
              ))}
            </div>
            <button style={{...styles.scrollButton, right: '-20px'}} onClick={() => scrollContainer(rankingScrollRef, 'right')}>&#10095;</button>
          </div>
        </div>
      )}

      {activeTab === 'all' && !query && (
        <div style={{marginBottom: '50px'}}>
          <h3 style={styles.sectionTitle}>✒️ 人気作家から探す</h3>
          <div style={{position: 'relative'}}>
            <button style={{...styles.scrollButton, left: '-20px'}} onClick={() => scrollContainer(authorScrollRef, 'left')}>&#10094;</button>
            <div ref={authorScrollRef} style={styles.horizontalScroll}>
              {POPULAR_AUTHORS.map((author, i) => (
                <AuthorCardItem key={`auth-${i}`} author={author} onClick={() => executeSearch(author.name)} />
              ))}
            </div>
            <button style={{...styles.scrollButton, right: '-20px'}} onClick={() => scrollContainer(authorScrollRef, 'right')}>&#10095;</button>
          </div>
        </div>
      )}
      
      <div style={styles.toggleContainer}>
          <button style={searchMode === 'keyword' ? styles.toggleActive : styles.toggle} onClick={() => { setSearchMode('keyword'); setQuery(''); setBooks([]); }}>キーワード検索</button>
          <button style={searchMode === 'ai' ? styles.toggleActiveAi : styles.toggle} onClick={() => { setSearchMode('ai'); setQuery(''); setBooks([]); }}>✨ AI感情検索</button>
      </div>

      <form onSubmit={handleSearchSubmit} style={styles.form}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && !query.startsWith('ジャンル:') && searchMode !== 'ai' && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={searchMode === 'ai' ? "例：切なくて涙が出るような物語、勇気が湧いてくる話" : "作品名・作家名で検索..."}
            style={styles.input}
          />
          {showSuggestions && suggestions.length > 0 && searchMode !== 'ai' && (
            <ul style={styles.suggestionList}>
              {suggestions.map((item, i) => (
                <li key={i} style={styles.suggestionItem} onMouseDown={() => {setQuery(item.title); setSuggestions([]); onBookSelect(item.id);}}>
                  <span style={styles.suggestionTitle}>{item.title}</span>
                  <span style={styles.suggestionAuthor}>{item.authorName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '...' : '検索'}
        </button>
      </form>

      {searchMode === 'ai' && !query && (
          <p style={styles.aiHint}>
              ※ AI検索では、作品の「雰囲気」や「読後の感情」を入力して検索できます。<br/>
              単語ではなく、文章で入力すると精度が上がります。
          </p>
      )}

      <div style={styles.tabWrapper}>
          <button style={activeTab === 'all' ? styles.activeTabBtn : styles.tabBtn} onClick={() => handleTabChange('all')}>すべて</button>
          <button style={activeTab === 'translation' ? styles.activeTabBtn : styles.tabBtn} onClick={() => handleTabChange('translation')}>🌍 海外翻訳作品</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={{marginBottom: '40px'}}>
        {loading && !listLoading ? (
          <div style={styles.loadingContainer}>{searchMode === 'ai' ? 'AIが思考の海から本を探しています...' : '書架を探しています...'}</div>
        ) : books.length > 0 ? (
          <>
            <div style={styles.grid}>
              {books.map((book, i) => <BookCardItem key={`${book.id}-${i}`} book={book} index={i} onClick={() => onBookSelect(book.id)} />)}
            </div>
            {hasMore && currentSearchType !== 'ai' && (
              <div style={{textAlign: 'center', marginTop: '40px'}}>
                <button onClick={loadMore} disabled={listLoading} style={styles.loadMoreButton}>{listLoading ? '読み込み中...' : 'もっと見る'}</button>
              </div>
            )}
          </>
        ) : ( 
          !loading && (query || activeTab === 'translation') && !error && (
            <div style={styles.emptyState}>
              <div style={{fontSize: '48px', marginBottom: '10px'}}>🤔</div>
              <p style={styles.noResult}>本が見つかりませんでした</p>
            </div>
          )
        )}
      </div>

      <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
    </div>
  );
};

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: theme.fonts.body, color: theme.colors.textMain, backgroundColor: theme.colors.background },
  headerArea: { textAlign: 'center', marginBottom: '40px' },
  heading: { fontSize: '28px', color: theme.colors.primary, marginBottom: '10px', fontWeight: 'bold', fontFamily: theme.fonts.heading },
  subText: { color: theme.colors.textSub, fontSize: '14px', letterSpacing: '1px' },
  sectionTitle: { fontSize: '18px', color: theme.colors.primary, marginBottom: '20px', fontWeight: 'bold', fontFamily: theme.fonts.heading },
  toggleContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  toggle: { padding: '8px 20px', borderRadius: '25px', border: 'none', background: '#e2e8f0', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize: '13px', transition: '0.2s' },
  toggleActive: { padding: '8px 20px', borderRadius: '25px', border: 'none', background: theme.colors.primary, cursor: 'default', color: '#fff', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontSize: '13px' },
  toggleActiveAi: { padding: '8px 20px', borderRadius: '25px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', cursor: 'default', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(118, 75, 162, 0.4)', fontSize: '13px' },
  aiHint: { fontSize: '12px', color: theme.colors.textSub, marginTop: '-20px', marginBottom: '30px', textAlign: 'center', lineHeight: '1.6' },
  form: { display: 'flex', gap: '0px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px auto', position: 'relative' },
  inputWrapper: { flex: 1, position: 'relative', minWidth: 0 },
  input: { width: '100%', padding: '14px 20px', fontSize: '16px', border: `1px solid ${theme.colors.border}`, borderRadius: '4px', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.2s', fontFamily: theme.fonts.body, boxSizing: 'border-box' },
  button: { ...theme.ui.buttonPrimary, borderRadius: '4px', fontWeight: 'bold', flexShrink: 0, whiteSpace: 'nowrap', minWidth: '80px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' },
  horizontalScroll: { display: 'flex', overflowX: 'auto', padding: '10px 5px 20px 5px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none' },
  bookCard: { position: 'relative', backgroundColor: '#2b2222', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease', overflow: 'hidden', aspectRatio: '2 / 3' },
  bookCardHover: { transform: 'translateY(-5px)', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' },
  bookCover: { height: '100%', width: '100%', position: 'relative', overflow: 'hidden' },
  bookImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' },
  bookImageHover: { transform: 'scale(1.05)' },
  noImageCover: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', pointerEvents: 'none' },
  bookInfo: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '10px', boxSizing: 'border-box', zIndex: 2 },
  bookTitle: { margin: '0 0 4px 0', fontWeight: 'bold', color: '#fff', lineHeight: '1.4', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontFamily: theme.fonts.heading },
  bookAuthor: { margin: 0, color: 'rgba(255,255,255,0.8)' },
  hqBadge: { marginTop: '4px', fontSize: '10px', backgroundColor: theme.colors.accent, color: '#fff', padding: '2px 6px', borderRadius: '2px', display: 'inline-block' },
  rankBadge: { position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', backgroundColor: theme.colors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', zIndex: 10 },
  scrollButton: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, color: theme.colors.primary },
  loadMoreButton: { ...theme.ui.buttonPrimary, padding: '10px 30px', borderRadius: '30px', backgroundColor: 'transparent', color: theme.colors.primary, border: `1px solid ${theme.colors.primary}` },
  tabWrapper: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' },
  tabBtn: { padding: '8px 20px', borderRadius: '20px', border: `1px solid ${theme.colors.border}`, backgroundColor: 'transparent', color: theme.colors.textSub, cursor: 'pointer', fontSize: '14px' },
  activeTabBtn: { padding: '8px 20px', borderRadius: '20px', border: 'none', backgroundColor: theme.colors.primary, color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  suggestionList: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '4px', listStyle: 'none', padding: '5px 0', margin: '5px 0 0 0', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: `1px solid ${theme.colors.border}` },
  suggestionItem: { padding: '10px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.colors.border}` },
  suggestionTitle: { fontWeight: 'bold', color: theme.colors.textMain },
  suggestionAuthor: { fontSize: '12px', color: theme.colors.textSub },
  error: { color: theme.colors.error, textAlign: 'center' },
  loadingContainer: { textAlign: 'center', padding: '60px', color: theme.colors.textSub },
  emptyState: { textAlign: 'center', padding: '60px', color: theme.colors.textSub },
  noResult: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: theme.colors.primary },
};

export default BookSearch;