import React, { useState, useEffect } from 'react';
import Footer from './Footer';

const BookDetail = ({ bookId, token, onBack, onLimitReached }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
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
          if (!response.ok) throw new Error('詳細データの取得に失敗しました');

          const data = await response.json();
          setBook(data);
          checkFavoriteStatus();
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

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
      } catch (e) { console.error(e); } finally { setFavLoading(false); }
  };

  // --- Pattern A (HQ) 解析ロジック ---
  const parseHqSummary = (text) => {
    if (!text) return [];
    // 【見出し】で分割して配列化
    const parts = text.split(/(【[^】]+】)/).filter(Boolean);
    const sections = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].match(/【[^】]+】/) && parts[i+1]) {
        sections.push({
          title: parts[i].replace(/[【】]/g, ''),
          content: parts[i+1].trim()
        });
        i++;
      }
    }
    // もしPattern A形式でない場合（見出しがない場合）
    if (sections.length === 0 && text) {
        // もし【1分要約】などが残っていたら除去して本文扱いにする簡易処理
        const cleanText = text.replace(/【1分要約】[\s\S]*?(?=\n|$)/, '').trim();
        return [{ title: null, content: cleanText || text }];
    }
    return sections;
  };

  // --- 旧データ用ロジック ---
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

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={{marginTop: '20px', fontFamily: '"Shippori Mincho", serif'}}>ページをめくっています...</p>
    </div>
  );
  
  if (error) return <p style={styles.error}>{error}</p>;
  if (!book) return null;

  const accentColor = getAccentColor(bookId);
  const isTranslation = book.category === 'TRANSLATION';

  // ★★★ 修正ポイント: 実際のJSONに合わせて変数名を変更 ★★★
  // JSONでは "highQuality": true となっています
  const isHQ = book.highQuality === true;

  // データ準備
  let leadData = null;
  let summarySections = [];
  let insightText = null;

  if (isHQ) {
      // Pattern A
      // JSONでは "summaryText" に起承転結が入っています
      summarySections = parseHqSummary(book.summaryText);
      insightText = book.insight;
      
      // キャッチフレーズはヘッダーに出すため leadData は null (ハイライト非表示)
  } else {
      // Pattern B (旧データ)
      const rawText = book.summaryText || ""; 
      leadData = extractLead(rawText);
      const body = extractBody(rawText);
      summarySections = [{ title: null, content: body }];
  }

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>← 本棚に戻る</button>
      </div>

      <article style={styles.article}>
        <header style={{...styles.header, background: `linear-gradient(135deg, ${accentColor}15 0%, #fff 100%)`, borderTop: `6px solid ${accentColor}`}}>
          <div style={styles.headerContent}>
            <div style={styles.metaLabel}>
                {isTranslation ? 'WORLD MASTERPIECE' : 'CLASSIC LITERATURE'}
            </div>
            
            <h1 style={styles.title}>
                {book.title}
                <button 
                    onClick={toggleFavorite} 
                    style={{...styles.favButton, color: isFavorite ? '#e74c3c' : '#ccc'}}
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

            {/* Pattern A: キャッチフレーズ */}
            {isHQ && book.catchphrase && (
               <div style={styles.hqCatchphrase}>
                  ❝ {book.catchphrase} ❞
               </div>
            )}
            
            {/* 旧データ: Pattern Bの場合のキャッチ */}
            {!isHQ && book.catchphrase && (
               <div style={styles.catchphrase}>{book.catchphrase}</div>
            )}
          </div>
        </header>

        <div style={styles.contentBody}>
          
          {/* 旧データ用: リード文 (Pattern Aでは表示しない) */}
          {!isHQ && leadData && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={{...styles.marker, background: accentColor}}></span>
                {leadData.type === 'HQ' ? '要約のポイント' : 'ハイライト'}
              </h2>
              <div style={styles.pointBox}>
                 <div style={styles.pointText}>{leadData.text}</div>
              </div>
            </section>
          )}

          <div style={styles.tabContainer}>
            <button 
              style={viewMode === 'summary' ? styles.activeTab : styles.tab}
              onClick={() => setViewMode('summary')}
            >
              📖 あらすじ & 解説
            </button>
            <button 
              style={viewMode === 'full' ? styles.activeTab : styles.tab}
              onClick={() => setViewMode('full')}
            >
              📄 本文を読む
            </button>
          </div>

          <div style={styles.contentBox}>
             {viewMode === 'summary' ? (
                <>
                <section style={styles.section}>
                    <div style={styles.textBody}>
                      {summarySections.map((section, idx) => (
                        <div key={idx} style={styles.summaryBlock}>
                           {section.title && (
                             <h3 style={{...styles.subTitle, color: '#333', borderLeft: `4px solid ${accentColor}`}}>
                               {section.title}
                             </h3>
                           )}
                           {section.content.split('\n').map((line, i) => (
                             line.trim() && <p key={i} style={styles.paragraph}>{line}</p>
                           ))}
                        </div>
                      ))}
                    </div>
                </section>

                {/* Insight (考察) Pattern Aのみ */}
                {insightText && (
                    <section style={styles.insightSection}>
                        <div style={styles.insightHeader}>
                            <span style={styles.insightIcon}>💡</span> 編集者の考察メモ
                        </div>
                        <div style={styles.insightContent}>
                            {insightText.split('\n').map((line, i) => (
                                line.trim() && <p key={i} style={styles.insightParagraph}>{line}</p>
                            ))}
                        </div>
                    </section>
                )}
                </>
             ) : (
                isTranslation ? (
                    <section style={styles.section}>
                        <div style={styles.previewBox}>
                             <h3 style={styles.previewTitle}>- 本文プレビュー (AI翻訳) -</h3>
                             <div style={styles.textBody}>
                                 {book.bodyText ? book.bodyText.split('\n').map((line, i) => (
                                   line.trim() && <p key={i} style={styles.paragraph}>{line}</p>
                                 )) : <p style={styles.noText}>本文データがありません。</p>}
                             </div>
                        </div>
                    </section>
                ) : (
                    <div style={styles.aozoraBox}>
                        <p style={{marginBottom: '20px'}}>青空文庫の公式サイトで全文を閲覧します。</p>
                        {book.aozoraUrl ? (
                          <a href={book.aozoraUrl} target="_blank" rel="noopener noreferrer" style={styles.amazonButton}>
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
              <span style={styles.footerLabel}>読了時間目安</span>
              <span style={styles.footerValue}>約 10分</span>
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
      <Footer />
    </div>
  );
};

// スタイル定義 (以前と同じですが、念のため記載)
const styles = {
  container: {
    maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px', fontFamily: '"Noto Sans JP", sans-serif', color: '#333',
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
    background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: 0,
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
  favButton: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginLeft: '15px', verticalAlign: 'middle',
  },
  originalTitle: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '16px', color: '#718096', marginBottom: '20px', fontStyle: 'italic',
  },
  author: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '18px', color: '#4a5568', marginBottom: '30px',
  },
  authorLabel: {
    fontSize: '12px', background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '2px', marginRight: '8px',
  },
  hqCatchphrase: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '22px', color: '#2d3748', lineHeight: '1.8', fontStyle: 'italic',
    padding: '30px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', display: 'inline-block', marginTop: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
  },
  catchphrase: {
    fontFamily: '"Shippori Mincho", serif', fontSize: '20px', color: '#2d3748', lineHeight: '1.8', fontStyle: 'italic', 
    padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'inline-block',
  },
  contentBody: { padding: '40px' },
  section: { marginBottom: '40px' },
  sectionTitle: {
    fontSize: '20px', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', fontFamily: '"Shippori Mincho", serif',
  },
  marker: { width: '6px', height: '24px', marginRight: '12px', borderRadius: '2px', display: 'inline-block' },
  summaryBlock: { marginBottom: '30px' },
  subTitle: {
    fontSize: '18px', fontFamily: '"Shippori Mincho", serif', fontWeight: 'bold', paddingLeft: '12px', marginBottom: '15px',
  },
  pointBox: {
    backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #ccc',
  },
  pointText: { lineHeight: '1.8', color: '#4a5568', fontWeight: 'bold', whiteSpace: 'pre-wrap' },
  textBody: { marginBottom: '40px' },
  paragraph: { marginBottom: '1.5em', lineHeight: '1.8', fontSize: '16px', textAlign: 'justify' },
  
  insightSection: {
    marginTop: '60px', padding: '30px', backgroundColor: '#f0f4f8', borderRadius: '12px', position: 'relative',
  },
  insightHeader: {
    fontSize: '18px', fontWeight: 'bold', color: '#2c5282', marginBottom: '15px', display: 'flex', alignItems: 'center',
    fontFamily: '"Shippori Mincho", serif'
  },
  insightIcon: { marginRight: '10px', fontSize: '20px' },
  insightContent: { borderTop: '1px solid #cbd5e0', paddingTop: '15px' },
  insightParagraph: { fontSize: '15px', lineHeight: '1.8', color: '#4a5568', marginBottom: '10px' },

  tabContainer: { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '30px' },
  tab: {
    flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#999', 
    fontFamily: '"Shippori Mincho", serif', borderBottom: '3px solid transparent', transition: '0.2s',
  },
  activeTab: {
    flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#2c3e50', 
    fontFamily: '"Shippori Mincho", serif', borderBottom: '3px solid #2c3e50', fontWeight: 'bold',
  },
  contentBox: { minHeight: '200px' },
  previewBox: { padding: '20px', backgroundColor: '#fdfbf7', borderRadius: '8px', border: '1px solid #f0e6d2' },
  previewTitle: { fontSize:'16px', color:'#8c7b60', marginBottom:'20px', textAlign:'center' },
  noText: { textAlign:'center', color:'#999' },
  aozoraBox: { textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
  bookFooter: {
    borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center'
  },
  footerRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
  footerLabel: { fontSize: '11px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' },
  footerValue: { fontSize: '14px', fontWeight: 'bold' },
  actionArea: { marginTop: '40px', textAlign: 'center' },
  amazonButton: {
    display: 'inline-block', backgroundColor: '#FF9900', color: '#fff', padding: '12px 30px', borderRadius: '50px', 
    textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 153, 0, 0.3)', transition: 'transform 0.2s',
  }
};

export default BookDetail;