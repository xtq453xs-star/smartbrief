import React, { useState, useEffect } from 'react';
// ★追加: 共通フッターを読み込み
import Footer from './Footer';

const BookDetail = ({ bookId, token, onBack, onLimitReached }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);

  // お気に入り状態管理
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // 表示モード (summary: あらすじ, full: 本文)
  const [viewMode, setViewMode] = useState('summary');

  const getAccentColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[id % colors.length];
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      if (isMounted) setLoading(true);
      try {
        const response = await fetch(`/api/v1/books/${bookId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (isMounted) {
            if (response.status === 403) {
              onLimitReached();
              return;
            }
            if (!response.ok) {
              throw new Error('詳細データの取得に失敗しました');
            }

            const data = await response.json();
            setBook(data);
            
            // お気に入り状態のチェック
            checkFavoriteStatus();
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // お気に入り確認API
    const checkFavoriteStatus = async () => {
      try {
        const res = await fetch(`/api/v1/books/${bookId}/favorite`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (isMounted) setIsFavorite(data.isFavorite);
        }
      } catch (e) { console.error(e); }
    };

    fetchDetail();

    return () => { isMounted = false; };
  }, [bookId, token, onLimitReached]);

  // お気に入りトグル処理
  const toggleFavorite = async () => {
      if (favLoading) return;
      setFavLoading(true);
      try {
          const res = await fetch(`/api/v1/books/${bookId}/favorite`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setIsFavorite(data.isFavorite);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setFavLoading(false);
      }
  };

  // --- 文字列操作ロジック ---

  const extractLead = (text) => {
    if (!text) return null;
    const matchHQ = text.match(/【1分要約】([\s\S]*?)(?=\n【|$)/);
    if (matchHQ) return { type: 'HQ', text: matchHQ[1].trim() };

    const sentences = text.split('。');
    if (sentences.length > 0) {
      let lead = sentences.slice(0, 3).join('。');
      if (lead.length > 200) lead = lead.substring(0, 200) + '...';
      if (!lead.endsWith('。') && !lead.endsWith('...')) lead += '。';
      return { type: 'STD', text: lead };
    }
    return { type: 'STD', text: text.substring(0, 150) + '...' };
  };

  const extractBody = (text) => {
    if (!text) return "";
    const match = text.match(/【詳細あらすじ】([\s\S]*)/);
    if (match) return match[1].trim();
    return text; 
  };

  const renderLeadContent = (leadData) => {
    if (!leadData) return null;
    if (leadData.type === 'HQ') {
      return (
        <div style={styles.pointText}>
          {leadData.text}
        </div>
      );
    }
    return (
      <div style={styles.leadTextContainer}>
         <span style={styles.leadIcon}>❝</span>
         <p style={styles.leadText}>
           {leadData.text}
         </p>
      </div>
    );
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={{marginTop: '20px', fontFamily: '"Shippori Mincho", serif'}}>ページをめくっています...</p>
    </div>
  );
  
  if (error) return <p style={styles.error}>{error}</p>;
  if (!book) return null;

  const accentColor = getAccentColor(bookId);
  const rawText = book.summaryText || "";
  
  const leadData = extractLead(rawText);
  const bodyText = extractBody(rawText);
  
  // 翻訳作品判定
  const isTranslation = book.category === 'TRANSLATION';

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
          ← 本棚に戻る
        </button>
      </div>

      <article style={styles.article}>
        {/* ヘッダー */}
        <header style={{...styles.header, background: `linear-gradient(135deg, ${accentColor}20 0%, #fff 100%)`, borderTop: `6px solid ${accentColor}`}}>
          <div style={styles.headerContent}>
            <div style={styles.metaLabel}>
                {isTranslation ? 'WORLD MASTERPIECE' : 'CLASSIC LITERATURE'}
            </div>
            
            {/* タイトルとお気に入りボタン */}
            <h1 style={styles.title}>
                {book.title}
                <button 
                    onClick={toggleFavorite} 
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', 
                        fontSize: '24px', marginLeft: '15px', color: isFavorite ? '#e74c3c' : '#ccc',
                        verticalAlign: 'middle'
                    }}
                    title={isFavorite ? "お気に入り解除" : "お気に入り登録"}
                >
                    {isFavorite ? '❤️' : '🤍'}
                </button>
            </h1>
            
            {book.originalTitle && (
                <p style={styles.originalTitle}>{book.originalTitle}</p>
            )}

            <div style={styles.author}>
              <span style={styles.authorLabel}>著</span> {book.authorName}
            </div>
            {book.catchphrase && (
               <div style={styles.catchphrase}>{book.catchphrase}</div>
            )}
          </div>
        </header>

        <div style={styles.contentBody}>
          
          {/* リード文セクション */}
          {leadData && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={{...styles.marker, background: accentColor}}></span>
                {leadData.type === 'HQ' ? '要約のポイント（1分で読む）' : 'ハイライト'}
              </h2>
              <div style={styles.pointBox}>
                {renderLeadContent(leadData)}
              </div>
            </section>
          )}

          {/* タブ切り替えボタン */}
          <div style={styles.tabContainer}>
            <button 
              style={viewMode === 'summary' ? styles.activeTab : styles.tab}
              onClick={() => setViewMode('summary')}
            >
              📖 あらすじ
            </button>
            <button 
              style={viewMode === 'full' ? styles.activeTab : styles.tab}
              onClick={() => setViewMode('full')}
            >
              📄 本文を読む
            </button>
          </div>

          {/* コンテンツ切り替えエリア */}
          <div style={styles.contentBox}>
             {viewMode === 'summary' ? (
                // あらすじ表示
                <section style={styles.section}>
                   <div style={styles.textBody}>
                     {bodyText.split('\n').map((line, i) => (
                       line.trim() && (
                         <p key={i} style={styles.paragraph}>{line}</p>
                       )
                     ))}
                   </div>
                </section>
             ) : (
                // 本文表示 (翻訳分岐)
                isTranslation ? (
                    <section style={styles.section}>
                        <div style={{padding: '20px', backgroundColor: '#fdfbf7', borderRadius: '8px', border: '1px solid #f0e6d2'}}>
                             <h3 style={{fontSize:'16px', color:'#8c7b60', marginBottom:'20px', textAlign:'center'}}>
                                 - 本文プレビュー (AI翻訳) -
                             </h3>
                             <div style={styles.textBody}>
                                 {book.bodyText ? book.bodyText.split('\n').map((line, i) => (
                                   line.trim() && <p key={i} style={styles.paragraph}>{line}</p>
                                 )) : <p style={{textAlign:'center', color:'#999'}}>本文データがありません。</p>}
                             </div>
                        </div>
                    </section>
                ) : (
                    <div style={{textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                        <p style={{marginBottom: '20px'}}>青空文庫の公式サイトで全文を閲覧します。</p>
                        {book.aozoraUrl ? (
                          <a 
                            href={book.aozoraUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={styles.amazonButton} 
                          >
                            青空文庫で開く ↗
                          </a>
                        ) : (
                          <p style={{color: '#999'}}>本文リンクが見つかりませんでした。</p>
                        )}
                    </div>
                )
             )}
          </div>

          <footer style={styles.bookFooter}>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>作品名</span>
              <span style={styles.footerValue}>{book.title}</span>
            </div>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>著者</span>
              <span style={styles.footerValue}>{book.authorName}</span>
            </div>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>種別</span>
              <span style={styles.footerValue}>{isTranslation ? '海外翻訳' : '青空文庫'}</span>
            </div>
          </footer>

          <div style={styles.actionArea}>
              <a 
                href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title + ' ' + book.authorName)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.amazonButton}
              >
                Amazonで原作を探す
              </a>
          </div>

        </div>
      </article>

      {/* ★追加: 共通フッター */}
      <Footer />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px 60px',
    fontFamily: '"Noto Sans JP", sans-serif',
    color: '#333',
  },
  loadingContainer: {
    height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#718096',
  },
  spinner: {
    width: '40px', height: '40px', border: '4px solid #eee', borderRadius: '50%', borderTopColor: '#333', animation: 'spin 1s linear infinite',
  },
  error: { color: '#e53e3e', textAlign: 'center', marginTop: '50px' },
  
  navBar: { padding: '20px 0' },
  backButton: {
    background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s',
  },
  article: {
    backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden',
  },
  header: { padding: '60px 40px', textAlign: 'center', position: 'relative' },
  metaLabel: { fontSize: '12px', letterSpacing: '0.1em', color: '#718096', marginBottom: '10px', fontWeight: 'bold' },
  title: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '32px', fontWeight: 'bold', color: '#1a202c', marginBottom: '15px', lineHeight: '1.4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  originalTitle: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '16px', color: '#718096', marginBottom: '20px', fontStyle: 'italic',
  },
  author: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '18px', color: '#4a5568', marginBottom: '30px',
  },
  authorLabel: {
    fontSize: '12px', background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '2px', marginRight: '8px', verticalAlign: 'middle',
  },
  catchphrase: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '20px', color: '#2d3748', lineHeight: '1.8', fontStyle: 'italic', padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'inline-block',
  },
  contentBody: { padding: '40px' },
  section: { marginBottom: '50px' },
  sectionTitle: {
    fontSize: '20px', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', fontFamily: '"Shippori Mincho", serif',
  },
  marker: { width: '6px', height: '24px', marginRight: '12px', borderRadius: '2px', display: 'inline-block' },
  
  pointBox: {
    backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #ccc',
  },
  pointText: {
    lineHeight: '1.8', color: '#4a5568', fontWeight: 'bold', whiteSpace: 'pre-wrap',
  },
  leadTextContainer: {
    position: 'relative',
    padding: '0 10px',
  },
  leadIcon: {
    fontSize: '40px',
    color: '#e2e8f0',
    position: 'absolute',
    top: '-20px',
    left: '-15px',
    fontFamily: 'serif',
    lineHeight: 1,
  },
  leadText: {
    fontSize: '16px',
    lineHeight: '2.2',
    color: '#4a5568',
    fontWeight: '500',
    fontFamily: '"Shippori Mincho", serif',
    margin: 0,
    zIndex: 1,
    position: 'relative',
  },
  textBody: { marginBottom: '40px' },
  paragraph: { marginBottom: '1.5em', lineHeight: '1.8', fontSize: '16px' },

  tabContainer: {
    display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '30px',
  },
  tab: {
    flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent',
    cursor: 'pointer', fontSize: '16px', color: '#999', fontFamily: '"Shippori Mincho", serif',
    borderBottom: '3px solid transparent', transition: '0.2s',
  },
  activeTab: {
    flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent',
    cursor: 'pointer', fontSize: '16px', color: '#2c3e50', fontFamily: '"Shippori Mincho", serif',
    borderBottom: '3px solid #2c3e50', fontWeight: 'bold',
  },
  contentBox: { minHeight: '200px' },

  bookFooter: {
      borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '50px',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center'
  },
  footerRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
  footerLabel: { fontSize: '11px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' },
  footerValue: { fontSize: '14px', fontWeight: 'bold' },

  actionArea: { marginTop: '40px', textAlign: 'center' },
  amazonButton: {
      display: 'inline-block', backgroundColor: '#FF9900', color: '#fff',
      padding: '12px 30px', borderRadius: '50px', textDecoration: 'none',
      fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 153, 0, 0.3)',
      transition: 'transform 0.2s',
  }
};

export default BookDetail;