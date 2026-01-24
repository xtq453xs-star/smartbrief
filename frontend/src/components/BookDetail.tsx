import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // ★ 追加: 上限時の移動用
import Footer from './Footer';
import { theme } from '../theme';
import BookReader3D from './BookReader3D';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore'; // ★1. Storeをインポート

// --- 型定義 ---
interface BookDetailProps {
  bookId: string | undefined;
  onBack: () => void;
}

// ★ 1. まず、この型定義をコンポーネント内（または上部の型定義エリア）に追加
interface SummarySection {
  title: string | null;
  content: string;
 }

// バックエンドのWorkエンティティに合わせた型
interface BookData {
  id: number;
  title: string;
  authorName: string;
  category?: string;
  catchphrase?: string;
  insight?: string;
  summaryText?: string;
  summary_300?: string;
  bodyText?: string;
  image_url?: string;
  aozoraUrl?: string;
  locked?: boolean;
}

interface FavoriteResponse {
  isFavorite: boolean;
}

// --- サブコンポーネント ---
const LoadingView = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.spinner}></div>
    <p style={styles.loadingText}>紐解いております...</p>
  </div>
);

// --- メインコンポーネント ---
const BookDetail: React.FC<BookDetailProps> = ({ bookId, onBack }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ★2. Propsから消した isPremium と logout を取得
  const { isPremium, logout } = useAuthStore(); 

  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [show3DReader, setShow3DReader] = useState(false);

  // ★3. 親にあった「無料枠上限到達時の処理」をここに移動
  const handleLimitReached = useCallback(() => {
    if (window.confirm("無料枠の上限に達しました。\nプレミアムプラン詳細ページへ移動しますか？")) {
      navigate('/'); // ダッシュボードへ戻してアップグレードを促す
    }
  }, [navigate]);

  // --- API通信ヘルパー (Generics対応) ---
  const fetchData = useCallback(async <T,>(endpoint: string, method = 'GET'): Promise<T | null> => {
    const res = method === 'POST'
      ? await apiClient.post<T>(endpoint, {})
      : await apiClient.get<T>(endpoint);

    if (res.ok) return res.data;

    // 403 Forbidden は閲覧上限
    if (res.status === 403) {
      handleLimitReached();
      return null;
    }

    showToast(res.message || '通信エラーが発生しました', 'error');
    if (res.status === 401) logout();
    return null;
  }, [handleLimitReached, logout, showToast]);

  // --- データ取得 ---
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!bookId) return;
      if (isMounted) setLoading(true);
      try {
        // 型を指定して並列取得
        const [bookData, favData] = await Promise.all([
          fetchData<BookData>(`/books/${bookId}`),
          fetchData<FavoriteResponse>(`/books/${bookId}/favorite`)
        ]);

        if (isMounted) {
            if (bookData) setBook(bookData);
            else throw new Error('本の情報を取得できませんでした');
            
            if (favData) setIsFavorite(favData.isFavorite);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [bookId, fetchData]);

  // --- お気に入り切り替え ---
  const toggleFavorite = async () => {
    if (favLoading || !bookId) return;
    setFavLoading(true);
    const data = await fetchData<FavoriteResponse>(`/books/${bookId}/favorite`, 'POST');
    if (data) setIsFavorite(data.isFavorite);
    setFavLoading(false);
  };

  // --- テキストパース処理 ---
const parseSummary = (text: string | undefined): SummarySection[] => {
    if (!text) return [];
    if (text.includes('【') && text.includes('】')) {
        const parts = text.split(/(【[^】]+】)/).filter(Boolean);
        // ★ 3. 配列の宣言にも型をつける
        const sections: SummarySection[] = []; 
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].match(/【[^】]+】/) && parts[i+1]) {
            sections.push({ title: parts[i].replace(/[【】]/g, ''), content: parts[i+1].trim() });
            i++;
          }
        }
        if (sections.length > 0) return sections;
    }
    return [{ title: null, content: text }];
  };

  const parseCatchphrase = (text: string | undefined) => {
      if (!text) return { tag: null, text: null };
      const match = text.match(/^(【[^】]+】)\s*(.*)/);
      return match ? { tag: match[1], text: match[2] } : { tag: null, text: text };
  };

  // --- レンダリング準備 ---
  if (loading) return <LoadingView />;
  if (error) return <div style={styles.errorContainer}><p>{error}</p><button onClick={onBack} style={styles.backLink}>戻る</button></div>;
  if (!book) return null;

  const isTranslation = book.category === 'Gutenberg' || book.category === 'TRANSLATION';
  const { tag: contentTag, text: displayCatchphrase } = parseCatchphrase(book.catchphrase);
  const isFullTranslation = contentTag && contentTag.includes('完訳');

  // ★ Zustand の isPremium を判定に使う
  const isTranslationLock = isTranslation && !isPremium;
  const isLimitLock = book.locked === true;
  const isLocked = isTranslationLock || isLimitLock;

  const rawSummary = isLocked ? (book.summary_300 || book.summaryText) : book.summaryText;
  // ★ 4. 受け取る変数にも型をつける
  let summarySections: SummarySection[] = parseSummary(rawSummary || "");
  
  if (isLocked && summarySections.length > 0) {
      summarySections = [summarySections[0]];
      const lines = summarySections[0].content.split('\n');
      summarySections[0].content = lines.slice(0, 5).join('\n');
  }

  const allReaderLines = (book.bodyText || "").split('\n');
  const displayedReaderLines = isTranslationLock ? [] : (isLimitLock ? allReaderLines.slice(0, 10) : allReaderLines);

  return (
    <div style={styles.wrapper}>
      {/* ...JSX部分は元のままなので省略せず表示します... */}
      <nav style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
           <span style={{fontSize:'18px'}}>←</span> 書架に戻る
        </button>
        <div style={styles.navTitle}>{book.title}</div>
        <div style={{width:'80px'}}></div>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.bookHeader}>
            <div style={styles.metaInfo}>
                <span style={styles.categoryLabel}>{isTranslation ? 'FOREIGN LITERATURE' : 'JAPANESE LITERATURE'}</span>
                {contentTag && <span style={styles.tagLabel}>{contentTag.replace(/[【】]/g, '')}</span>}
            </div>
            
            <h1 style={styles.title}>{book.title}</h1>
            <p style={styles.author}>著：{book.authorName}</p>
            
            <div style={styles.actionRow}>
                <button onClick={toggleFavorite} style={styles.favButton}>
                    {isFavorite ? '❤️ お気に入り' : '🤍 お気に入り'}
                </button>

                {!!book.bodyText && (
                    <button 
                        onClick={() => setShow3DReader(true)}
                        style={styles.immersiveButton}
                        disabled={isLocked}
                    >
                        <span style={{marginRight: '5px'}}>📖</span> 
                        {isLocked ? 'プレミアム限定' : '没入モードで読む'}
                    </button>
                )}
            </div>

            {displayCatchphrase && (
                <div style={styles.catchphraseBox}>
                    <p style={styles.catchphraseText}>{displayCatchphrase}</p>
                </div>
            )}
        </header>

        <div style={styles.tabWrapper}>
            <button 
                style={viewMode === 'summary' ? styles.activeTab : styles.tab}
                onClick={() => setViewMode('summary')}
            >
                解説・あらすじ
            </button>
            {(!!book.bodyText || book.aozoraUrl) && (
                <button 
                    style={viewMode === 'full' ? styles.activeTab : styles.tab}
                    onClick={() => setViewMode('full')}
                >
                    {isFullTranslation ? '全文を読む' : '本文を読む'}
                </button>
            )}
        </div>

        <div style={styles.contentBody}>
            {viewMode === 'summary' ? (
                <>
                    <div style={styles.textBlock}>
                        {summarySections.map((section, idx) => (
                            <div key={idx} style={{marginBottom: '40px'}}>
                                {(!isLocked && section.title) && <h3 style={styles.sectionTitle}>{section.title}</h3>}
                                {section.content.split('\n').map((line, i) => (
                                    line.trim() && <p key={i} style={styles.paragraph}>{line}</p>
                                ))}
                            </div>
                        ))}
                    </div>

                    {isLocked && <LockScreen type={isTranslationLock ? 'translation' : 'limit'} onUpgrade={handleLimitReached} />}

                    {!isLocked && book.insight && (
                        <div style={styles.insightBox}>
                            <h4 style={styles.insightTitle}>
                                <span style={{marginRight:'8px'}}>💡</span>
                                {isTranslation ? '作品の背景・考察' : '編集者の考察メモ'}
                            </h4>
                            {book.insight.split('\n').map((line, i) => (
                                line.trim() && <p key={i} style={styles.insightText}>{line}</p>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {book.bodyText ? (
                        <div style={styles.textBlock}>
                            {displayedReaderLines.map((line, i) => (
                                line.trim() && <p key={i} style={styles.readerParagraph}>{line}</p>
                            ))}
                            
                            {isLocked ? (
                                <LockScreen type={isTranslationLock ? 'translation' : 'limit'} onUpgrade={handleLimitReached} isReader />
                            ) : (
                                <div style={styles.endMark}>― 完 ―</div>
                            )}
                        </div>
                    ) : (
                        <div style={styles.externalLinkBox}>
                            <p>この作品は外部サイト（青空文庫）で閲覧できます。</p>
                            {book.aozoraUrl && (
                                <a href={book.aozoraUrl} target="_blank" rel="noopener noreferrer" style={styles.externalButton}>
                                    青空文庫を開く ↗
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>

        <footer style={styles.bookFooter}>
            <div style={styles.footerItem}>
                <span style={styles.footerLabel}>読了目安</span>
                <span style={styles.footerValue}>{isFullTranslation ? '15分' : '5分'}</span>
            </div>
            <div style={styles.footerItem}>
                <a 
                    href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title + ' ' + book.authorName)}`} 
                    target="_blank" rel="noopener noreferrer" 
                    style={styles.amazonLink}
                >
                    Amazonで原作を探す ↗
                </a>
            </div>
        </footer>

      </main>

      <div style={{marginTop: '40px'}}>
        <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
      </div>

      {show3DReader && book.bodyText && (
         <BookReader3D 
             title={book.title}
             bodyText={book.bodyText}
             onClose={() => setShow3DReader(false)}
         />
      )}
    </div>
  );
};

// --- ロック画面コンポーネント ---
const LockScreen: React.FC<{ type: 'translation' | 'limit', onUpgrade: () => void, isReader?: boolean }> = ({ type, onUpgrade, isReader = false }) => (
    <div style={styles.lockOverlay}>
        <div style={styles.lockCard}>
            <div style={{fontSize: '32px', marginBottom: '10px'}}>🔒</div>
            <h3 style={styles.lockTitle}>
                {type === 'translation' ? 'プレミアム限定コンテンツ' : '続きはプレミアムで'}
            </h3>
            <p style={styles.lockText}>
                {type === 'translation' 
                    ? (isReader ? "この翻訳作品の全文を読むには\nプレミアムプランへの登録が必要です。" : "詳細な解説と要約を読むには\nプレミアムプランへの登録が必要です。")
                    : "無料会員の閲覧上限に達しました。\n続きはプレミアムプランでお楽しみください。"
                }
            </p>
            <button style={styles.upgradeButton} onClick={onUpgrade}>
                プレミアムプラン詳細へ
            </button>
        </div>
    </div>
);

// --- スタイル定義 ---
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: { minHeight: '100vh', backgroundColor: theme.colors.background, color: theme.colors.textMain, fontFamily: theme.fonts.body, paddingBottom: '20px' },
  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(252, 249, 242, 0.95)', borderBottom: `1px solid ${theme.colors.border}`, backdropFilter: 'blur(5px)' },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textSub, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: theme.fonts.heading },
  navTitle: { fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' },
  paperContainer: { maxWidth: '720px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)', borderLeft: `6px solid ${theme.colors.primary}`, overflow: 'hidden', position: 'relative' },
  bookHeader: { padding: '60px 40px 40px', textAlign: 'center', backgroundImage: 'radial-gradient(circle at center, #fafafa 0%, #fff 100%)' },
  metaInfo: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  categoryLabel: { fontSize: '11px', letterSpacing: '0.15em', color: theme.colors.primary, fontWeight: 'bold', border: `1px solid ${theme.colors.primary}`, padding: '4px 8px', borderRadius: '2px' },
  tagLabel: { fontSize: '11px', color: '#fff', backgroundColor: theme.colors.accent, padding: '5px 8px', borderRadius: '2px', fontWeight: 'bold' },
  title: { fontFamily: theme.fonts.heading, fontSize: '36px', fontWeight: 'bold', color: theme.colors.textMain, marginBottom: '10px', lineHeight: '1.3' },
  author: { fontFamily: theme.fonts.heading, fontSize: '18px', color: theme.colors.textSub, marginBottom: '30px' },
  actionRow: { marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' },
  favButton: { background: 'transparent', border: `1px solid ${theme.colors.border}`, borderRadius: '20px', padding: '8px 20px', fontSize: '13px', color: theme.colors.textSub, cursor: 'pointer', transition: 'all 0.2s' },
  immersiveButton: { ...theme.ui.buttonPrimary, borderRadius: '30px', padding: '8px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(30, 42, 74, 0.3)', transition: 'transform 0.2s', cursor: 'pointer' },
  catchphraseBox: { marginTop: '20px', padding: '20px', borderTop: `1px solid ${theme.colors.border}`, borderBottom: `1px solid ${theme.colors.border}` },
  catchphraseText: { fontFamily: theme.fonts.heading, fontSize: '18px', fontStyle: 'italic', color: theme.colors.textMain, lineHeight: '1.8' },
  tabWrapper: { display: 'flex', borderBottom: `1px solid ${theme.colors.border}`, backgroundColor: '#fafafa' },
  tab: { flex: 1, padding: '15px', border: 'none', background: 'transparent', color: theme.colors.textSub, fontFamily: theme.fonts.heading, fontSize: '15px', cursor: 'pointer', transition: '0.2s', borderBottom: '3px solid transparent' },
  activeTab: { flex: 1, padding: '15px', border: 'none', background: '#fff', color: theme.colors.primary, fontFamily: theme.fonts.heading, fontSize: '15px', fontWeight: 'bold', cursor: 'default', borderBottom: `3px solid ${theme.colors.primary}` },
  contentBody: { padding: '50px 40px', minHeight: '300px' },
  textBlock: {},
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: '20px', color: theme.colors.primary, marginBottom: '20px', borderBottom: `1px dotted ${theme.colors.border}`, paddingBottom: '5px', display: 'inline-block' },
  paragraph: { fontSize: '16px', lineHeight: '1.9', color: theme.colors.textMain, marginBottom: '1.5em', textAlign: 'justify' },
  readerParagraph: { fontSize: '18px', lineHeight: '2.2', fontFamily: theme.fonts.heading, color: '#222', marginBottom: '2em', textAlign: 'justify' },
  insightBox: { marginTop: '50px', padding: '30px', backgroundColor: '#f8f9fa', borderLeft: `4px solid ${theme.colors.accent}`, borderRadius: '0 4px 4px 0' },
  insightTitle: { fontSize: '16px', fontWeight: 'bold', color: theme.colors.textMain, marginBottom: '15px', display: 'flex', alignItems: 'center' },
  insightText: { fontSize: '15px', lineHeight: '1.8', color: '#444', marginBottom: '10px' },
  lockOverlay: { marginTop: '40px', padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 30%)' },
  lockCard: { display: 'inline-block', padding: '30px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `1px solid ${theme.colors.border}`, maxWidth: '400px' },
  lockTitle: { fontSize: '18px', fontWeight: 'bold', color: theme.colors.primary, marginBottom: '10px' },
  lockText: { fontSize: '14px', color: theme.colors.textSub, marginBottom: '20px', whiteSpace: 'pre-wrap' },
  upgradeButton: { ...theme.ui.buttonPrimary, borderRadius: '30px', padding: '12px 30px', fontSize: '15px' },
  bookFooter: { marginTop: '60px', padding: '30px 40px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  footerItem: { display: 'flex', flexDirection: 'column', gap: '5px' },
  footerLabel: { fontSize: '11px', color: theme.colors.textSub },
  footerValue: { fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain },
  amazonLink: { fontSize: '13px', color: theme.colors.primary, textDecoration: 'none', borderBottom: `1px solid ${theme.colors.primary}`, paddingBottom: '2px' },
  externalLinkBox: { textAlign: 'center', padding: '50px 20px', color: theme.colors.textSub },
  externalButton: { display: 'inline-block', marginTop: '15px', padding: '10px 20px', border: `1px solid ${theme.colors.border}`, borderRadius: '4px', textDecoration: 'none', color: theme.colors.textMain },
  endMark: { textAlign: 'center', marginTop: '60px', color: theme.colors.textSub, fontFamily: theme.fonts.heading, letterSpacing: '0.2em' },
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '40px', height: '40px', border: '3px solid #eee', borderTop: `3px solid ${theme.colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontFamily: theme.fonts.heading, color: theme.colors.textSub },
  errorContainer: { padding: '50px', textAlign: 'center', color: theme.colors.error },
  backLink: { marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: theme.colors.textSub },
};

export default BookDetail;