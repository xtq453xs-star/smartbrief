import React, { useState, useEffect } from 'react';

const BookDetail = ({ bookId, token, onBack, onLimitReached }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAccentColor = (id) => {
    const colors = ['#FF9A9E', '#FECFEF', '#A18CD1', '#FBC2EB', '#8FD3F4', '#84FAB0', '#E0C3FC'];
    return colors[id % colors.length];
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/v1/books/${bookId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 403) {
          onLimitReached();
          return;
        }
        if (!response.ok) {
          throw new Error('詳細データの取得に失敗しました');
        }

        const data = await response.json();
        setBook(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bookId, token, onLimitReached]);

  // --- 文字列操作ロジック ---

  // 1. リード文（グレーの箱に入れるやつ）を抽出
  const extractLead = (text) => {
    if (!text) return null;

    // パターンA: HQ版 (【1分要約】タグがある)
    const matchHQ = text.match(/【1分要約】([\s\S]*?)(?=\n【|$)/);
    if (matchHQ) return { type: 'HQ', text: matchHQ[1].trim() };

    // パターンB: 標準版 (タグがない) -> 冒頭の3文くらいを抜き出す
    const sentences = text.split('。');
    if (sentences.length > 0) {
      // 3文だけ繋げて、末尾に「。」がなければつける
      let lead = sentences.slice(0, 3).join('。');
      if (lead.length > 200) lead = lead.substring(0, 200) + '...';
      if (!lead.endsWith('。') && !lead.endsWith('...')) lead += '。';
      return { type: 'STD', text: lead };
    }

    return { type: 'STD', text: text.substring(0, 150) + '...' };
  };

  // 2. 本文を抽出
  const extractBody = (text) => {
    if (!text) return "";
    const match = text.match(/【詳細あらすじ】([\s\S]*)/);
    if (match) return match[1].trim();
    return text; 
  };

  // 3. ★魔法の整形関数: テキストを「箇条書きリスト」に変換して表示
  const renderLeadContent = (leadData) => {
    if (!leadData) return null;

    // HQ版はそのまま表示 (改行は反映)
    if (leadData.type === 'HQ') {
      return (
        <div style={styles.pointText}>
          {leadData.text}
        </div>
      );
    }

    // ★変更点: 標準版（STD）の場合
    // 無理に「。」で区切ってリストにするのをやめ、
    // 「リード文」として美しくそのまま表示する。
    // これにより、エッセイなどの短い文章でも「物足りなさ」より「雰囲気」が勝つ。
    return (
      <div style={styles.leadTextContainer}>
         {/* 先頭に大きな引用符などを装飾でつけるとさらに雑誌っぽくなります */}
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
  const rawText = book.summaryText || book.summaryHq || book.summary300 || book.summary || "";
  
  // 抽出実行
  const leadData = extractLead(rawText);
  const bodyText = extractBody(rawText);

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
            <div style={styles.metaLabel}>CLASSIC LITERATURE</div>
            <h1 style={styles.title}>{book.title}</h1>
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
                {/* データの種類によってタイトルを変える */}
                {leadData.type === 'HQ' ? '要約のポイント（1分で読む）' : 'ハイライト'}
              </h2>
              <div style={styles.pointBox}>
                {renderLeadContent(leadData)}
              </div>
            </section>
          )}

          {/* 本文セクション */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={{...styles.marker, background: accentColor}}></span>
              あらすじ・解説
            </h2>
            
            <div style={styles.textBody}>
              {bodyText.split('\n').map((line, i) => (
                line.trim() && (
                  <p key={i} style={styles.paragraph}>{line}</p>
                )
              ))}
            </div>
          </section>

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
              <span style={styles.footerLabel}>底本</span>
              <span style={styles.footerValue}>青空文庫</span>
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
  
  // ポイントボックス
  pointBox: {
    backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #ccc',
  },
  pointText: {
    lineHeight: '1.8', color: '#4a5568', fontWeight: 'bold', whiteSpace: 'pre-wrap',
  },
  // ★追加: 標準版用のリード文スタイル（雑誌の導入部風）
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
    lineHeight: '2.2', // 行間を広めに取って「読ませる」
    color: '#4a5568',
    fontWeight: '500',
    fontFamily: '"Shippori Mincho", serif', // ここだけ明朝体にすると雰囲気爆上がり
    margin: 0,
    zIndex: 1,
    position: 'relative',
  },
};

export default BookDetail;