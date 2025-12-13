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

  // --- 解析ロジック (バックエンドに合わせて修正) ---
  const parseHqSummary = (text) => {
    if (!text) return [];
    // 300文字版などが来た場合、セクション分けされていないのでそのまま返す
    if (!text.includes('【')) {
        return [{ title: null, content: text }];
    }

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
    if (sections.length === 0 && text) {
        return [{ title: null, content: text }];
    }
    return sections;
  };

  // --- タグ抽出ロジック ---
  const parseCatchphrase = (text) => {
      if (!text) return { tag: null, text: null };
      const match = text.match(/^(【[^】]+】)\s*(.*)/);
      if (match) {
          return { tag: match[1], text: match[2] };
      }
      return { tag: null, text: text };
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
  const hasBodyText = !!book.bodyText;
  
  // ★重要: バックエンドのレスポンスに合わせて判定
  // isHighQuality: 作品としてHQデータを持っているか
  // isLocked: ユーザーにとってロックされているか（無料会員など）
  const isHQ = book.highQuality === true;
  const isLocked = book.locked === true; 

  const { tag: contentTag, text: displayCatchphrase } = parseCatchphrase(book.catchphrase);
  
  // カテゴリ判定: TRANSLATION かどうか
  const isTranslation = book.category === 'TRANSLATION';
  const isFullTranslation = contentTag === '【完訳】' || isTranslation;
  const isDigest = contentTag === '【長編ダイジェスト】' || contentTag?.includes('ダイジェスト');

  // 要約データの準備
  // isLockedの場合でも summaryText には "300文字版" が入っているのでそれを表示に使う
  const summarySections = parseHqSummary(book.summaryText || "");
  const insightText = book.insight;

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>← 本棚に戻る</button>
      </div>

      <article style={styles.article}>
        <header style={{...styles.header, background: `linear-gradient(135deg, ${accentColor}15 0%, #fff 100%)`, borderTop: `6px solid ${accentColor}`}}>
          <div style={styles.headerContent}>
            
            <div style={styles.labelRow}>
                <span style={styles.metaLabel}>
                    {isTranslation ? 'WORLD MASTERPIECE' : 'CLASSIC LITERATURE'}
                </span>
                {contentTag && (
                    <span style={{
                        ...styles.contentTag, 
                        backgroundColor: isFullTranslation ? '#2ecc71' : '#e67e22'
                    }}>
                        {contentTag.replace(/[【】]/g, '')}
                    </span>
                )}
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

            {/* HQかつロックされていない場合のみキャッチフレーズを強調表示 */}
            {isHQ && !isLocked && displayCatchphrase && (
               <div style={styles.hqCatchphrase}>
                 ❝ {displayCatchphrase} ❞
               </div>
            )}
            
            {(!isHQ || isLocked) && book.catchphrase && (
               <div style={styles.catchphrase}>{book.catchphrase}</div>
            )}
          </div>
        </header>

        <div style={styles.contentBody}>
          
          <div style={styles.tabContainer}>
            <button 
              style={viewMode === 'summary' ? styles.activeTab : styles.tab}
              onClick={() => setViewMode('summary')}
            >
              📖 解説・あらすじ
            </button>
            
            {(hasBodyText || book.aozoraUrl) && (
                <button 
                style={viewMode === 'full' ? styles.activeTab : styles.tab}
                onClick={() => setViewMode('full')}
                >
                {isFullTranslation ? '📄 全文を読む (完訳)' 
                    : isDigest ? '📄 物語を読む (ダイジェスト)' 
                    : '📄 本文を読む'}
                </button>
            )}
          </div>

          <div style={styles.contentBox}>
             {viewMode === 'summary' ? (
                <>
                {/* --- ★ロック機能付き要約表示エリア --- */}
                <section style={{...styles.section, position: 'relative'}}>
                    <div style={styles.textBody}>
                      {summarySections.map((section, idx) => (
                        <div key={idx} style={styles.summaryBlock}>
                           {/* ロック時はタイトルを出さない（300文字版なので） */}
                           {!isLocked && section.title && (
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

                    {/* ★ロック時のオーバーレイ表示 */}
                    {isLocked && (
                        <div style={styles.lockOverlay}>
                            <div style={styles.lockMessage}>
                                <div style={{fontSize: '40px', marginBottom: '10px'}}>🔒</div>
                                <h3 style={{marginBottom: '10px', color: '#2d3748'}}>高品質な要約はプレミアム限定です</h3>
                                <p style={{fontSize: '14px', color: '#718096', marginBottom: '20px'}}>
                                    この作品の深い考察と詳細な要約を読むには<br/>プレミアムプランへの登録が必要です。
                                </p>
                                {/* ここで設定ページや登録ページへ飛ばす */}
                                <button style={styles.upgradeButton} onClick={() => alert('設定ページへ移動します')}>
                                    プレミアムプラン詳細へ
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Insightはロックされていない場合のみ表示 */}
                {!isLocked && insightText && (
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
                <>
                {/* 本文タブの中身 */}
                {hasBodyText ? (
                    <section style={styles.section}>
                        <div style={isHQ ? styles.readerBox : styles.previewBox}>
                             {isHQ && <h3 style={styles.readerTitle}>{book.title}</h3>}
                             <div style={styles.textBody}>
                                 {book.bodyText.split('\n').map((line, i) => (
                                   line.trim() && <p key={i} style={styles.readerParagraph}>{line}</p>
                                 ))}
                             </div>
                             <div style={styles.readerFooter}>
                                 {isFullTranslation ? '― 完 ―' : '― ダイジェスト版 終了 ―'}
                             </div>
                        </div>
                    </section>
                ) : (
                    <div style={styles.aozoraBox}>
                        <p style={{marginBottom: '20px'}}>この作品は全文翻訳データがありません。<br/>青空文庫の公式サイトで原文を閲覧します。</p>
                        {book.aozoraUrl ? (
                          <a href={book.aozoraUrl} target="_blank" rel="noopener noreferrer" style={styles.amazonButton}>
                            青空文庫で開く ↗
                          </a>
                        ) : (
                          <p style={{color: '#999'}}>本文リンクが見つかりませんでした。</p>
                        )}
                    </div>
                )}
                </>
             )}
          </div>

          <footer style={styles.bookFooter}>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>カテゴリ</span>
              <span style={styles.footerValue}>
                  {isTranslation ? '海外翻訳文学' : '日本文学'}
              </span>
            </div>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>著者</span>
              <span style={styles.footerValue}>{book.authorName}</span>
            </div>
            <div style={styles.footerRow}>
              <span style={styles.footerLabel}>読了目安</span>
              <span style={styles.footerValue}>
                  {isFullTranslation ? '15〜30分' : '5〜10分'}
              </span>
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

// --- スタイル定義 (lockOverlay等を追加) ---
const styles = {
  // 既存のスタイル...
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px', fontFamily: '"Noto Sans JP", sans-serif', color: '#333' },
  loadingContainer: { height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#718096' },
  spinner: { width: '40px', height: '40px', border: '4px solid #eee', borderRadius: '50%', borderTopColor: '#333', animation: 'spin 1s linear infinite' },
  error: { color: '#e53e3e', textAlign: 'center', marginTop: '50px' },
  navBar: { padding: '20px 0' },
  backButton: { background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: 0 },
  article: { backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' },
  header: { padding: '60px 40px', textAlign: 'center', position: 'relative' },
  headerContent: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  labelRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  metaLabel: { fontSize: '12px', letterSpacing: '0.1em', color: '#718096', fontWeight: 'bold' },
  contentTag: { fontSize: '12px', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.05em' },
  title: { fontFamily: '"Shippori Mincho", serif', fontSize: '32px', fontWeight: 'bold', color: '#1a202c', marginBottom: '15px', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  favButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginLeft: '15px', verticalAlign: 'middle' },
  originalTitle: { fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '16px', color: '#718096', marginBottom: '20px', fontStyle: 'italic' },
  author: { fontFamily: '"Shippori Mincho", serif', fontSize: '18px', color: '#4a5568', marginBottom: '30px' },
  authorLabel: { fontSize: '12px', background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '2px', marginRight: '8px' },
  hqCatchphrase: { fontFamily: '"Shippori Mincho", serif', fontSize: '22px', color: '#2d3748', lineHeight: '1.8', fontStyle: 'italic', padding: '30px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', display: 'inline-block', marginTop: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  catchphrase: { fontFamily: '"Shippori Mincho", serif', fontSize: '20px', color: '#2d3748', lineHeight: '1.8', fontStyle: 'italic', padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'inline-block' },
  contentBody: { padding: '40px' },
  section: { marginBottom: '40px' },
  summaryBlock: { marginBottom: '30px' },
  subTitle: { fontSize: '18px', fontFamily: '"Shippori Mincho", serif', fontWeight: 'bold', paddingLeft: '12px', marginBottom: '15px' },
  paragraph: { marginBottom: '1.5em', lineHeight: '1.8', fontSize: '16px', textAlign: 'justify' },
  insightSection: { marginTop: '60px', padding: '30px', backgroundColor: '#f0f4f8', borderRadius: '12px', position: 'relative' },
  insightHeader: { fontSize: '18px', fontWeight: 'bold', color: '#2c5282', marginBottom: '15px', display: 'flex', alignItems: 'center', fontFamily: '"Shippori Mincho", serif' },
  insightIcon: { marginRight: '10px', fontSize: '20px' },
  insightContent: { borderTop: '1px solid #cbd5e0', paddingTop: '15px' },
  insightParagraph: { fontSize: '15px', lineHeight: '1.8', color: '#4a5568', marginBottom: '10px' },
  tabContainer: { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '30px' },
  tab: { flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#999', fontFamily: '"Shippori Mincho", serif', borderBottom: '3px solid transparent', transition: '0.2s' },
  activeTab: { flex: 1, padding: '15px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#2c3e50', fontFamily: '"Shippori Mincho", serif', borderBottom: '3px solid #2c3e50', fontWeight: 'bold' },
  contentBox: { minHeight: '200px' },
  readerBox: { padding: '40px', backgroundColor: '#fff', borderRadius: '2px' },
  readerTitle: { textAlign: 'center', fontSize: '24px', fontFamily: '"Shippori Mincho", serif', marginBottom: '40px', color: '#333' },
  readerParagraph: { marginBottom: '1.8em', lineHeight: '2.0', fontSize: '17px', textAlign: 'justify', fontFamily: '"Shippori Mincho", serif', color: '#2d3748' },
  readerFooter: { textAlign: 'center', marginTop: '60px', color: '#a0aec0', fontSize: '14px', letterSpacing: '0.2em' },
  previewBox: { padding: '20px', backgroundColor: '#fdfbf7', borderRadius: '8px', border: '1px solid #f0e6d2' },
  aozoraBox: { textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
  bookFooter: { borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' },
  footerRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
  footerLabel: { fontSize: '11px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' },
  footerValue: { fontSize: '14px', fontWeight: 'bold' },
  actionArea: { marginTop: '40px', textAlign: 'center' },
  amazonButton: { display: 'inline-block', backgroundColor: '#FF9900', color: '#fff', padding: '12px 30px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 153, 0, 0.3)', transition: 'transform 0.2s' },

  // ★ 新規追加: ロックオーバーレイ用スタイル
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '250px', // 下部を覆う
    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 40%, rgba(255,255,255,1) 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '40px',
    zIndex: 10,
    pointerEvents: 'none' // クリックイベントを透過させないため、内部のボタンには pointer-events: auto が必要
  },
  lockMessage: {
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #edf2f7',
    maxWidth: '90%',
    pointerEvents: 'auto' // これでボタンがクリック可能になる
  },
  upgradeButton: {
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(49, 130, 206, 0.4)',
    transition: 'transform 0.2s',
  }
};

export default BookDetail;