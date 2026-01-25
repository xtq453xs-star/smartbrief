import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/authStore';

interface AuthorListProps {
  onBack: () => void;
}

// ★38名分の完璧な画像マッピング
const AUTHOR_IMAGES: Record<string, string> = {
  // グループA: 幻想・ロマン
  '宮沢 賢治': 'miyazawa_kenji.png',
  '小川 未明': 'ogawa_mimei.png',
  '泉 鏡花': 'izumi_kyoka.png',
  '萩原 朔太郎': 'hagiwara_sakutarou.png',
  '堀 辰雄': 'hori_tatsuo.png',
  '中原 中也': 'nakahara_chuya.png',
  '牧野 信一': 'makino_shinichi.png',
  '豊島 与志雄': 'toyoshima_toshio.png',
  // グループB: 無頼・近代
  '太宰 治': 'dazai_osamu.png',
  '坂口 安吾': 'sakaguchi_ango.png',
  '芥川 竜之介': 'akutagawa_ryunosuke.png',
  '夏目 漱石': 'natsume_soseki.png',
  '田山 録弥': 'tayama_rokuya.png',
  '菊池 寛': 'kikuchi_kan.png',
  '山本 周五郎': 'yamamoto_shugorou.png',
  // グループC: 科学・思想・芸術
  '寺田 寅彦': 'terada_torahiko.png',
  '中谷 宇吉郎': 'nakaya_ukichiro.png',
  '北大路 魯山人': 'kitaooji_rosannzin.png',
  '岡本 かの子': 'okamoto_kanoko.png',
  '宮本 百合子': 'miyamoto_yuriko.png',
  '伊藤 野枝': 'ito_noe.png',
  '原 民喜': 'hara_tamiki.png',
  '岸田 國士': 'kishida_kunio.png',
  '折口 信夫': 'origuchi_nobuo.png',
  // グループD: エンタメ・ミステリー
  '江戸川 乱歩': 'edogawa_ranpo.png',
  '夢野 久作': 'yumeno_kyusaku.png',
  '海野 十三': 'uno_juza.png',
  '国枝 史郎': 'kunieda_shiro.png',
  '久生 十蘭': 'hisao_juran.png',
  '岡本 綺堂': 'okamoto_kido.png',
  '野村 胡堂': 'nomura_kodou.png',
  '吉川 英治': 'yoshikawa_eiji.png',
  '坂本 竜馬': 'sakamoto_ryoma.png',
  '永井 荷風': 'nagai_kafu.png',
  '新美 南吉': 'niimi_nankichi.png',
  '今野 大力': 'konno_dairiki.png',
  '佐藤 垢石': 'sato_kaseki.png',
  '田中 貢太郎': 'tanaka_koutarou.png',
};

const AuthorList: React.FC<AuthorListProps> = ({ onBack }) => {
  const { isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadAuthors = async () => {
      setLoading(true);
      const res = await apiClient.get<string[]>('/books/authors/all');
      
      if (!res.ok) {
        showToast(res.message || 'エラーが発生しました', 'error');
        if (res.status === 401) logout();
        setLoading(false);
        return;
      }
      setAuthors(res.data || []);
      setLoading(false);
    };

    loadAuthors();
  }, [logout, showToast, isLoggedIn]);

  const handleAuthorClick = (authorName: string) => {
    navigate(`/search?q=${encodeURIComponent(authorName)}`);
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>作家名簿を検索中...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <button onClick={onBack} style={styles.backButton}>
           <span style={{fontSize:'18px'}}>←</span> ダッシュボードへ
        </button>
        <div style={styles.navTitle}>作家一覧</div>
        <div style={{width:'80px'}}></div>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>✒️</span>
            <h2 style={styles.title}>収録作家一覧</h2>
            <p style={styles.sub}>全 {authors.length} 名の作家を収蔵しています</p>
        </header>

        {/* 1.7万件に耐える効率的なグリッド */}
        <div style={styles.grid}>
          {authors.map((author, index) => {
            // ★名前から画像ファイル名を取得
            const imageFile = AUTHOR_IMAGES[author];

            return (
              <button 
                key={index} 
                style={styles.authorCard}
                onClick={() => handleAuthorClick(author)}
              >
                {/* 図書カードのインデックス番号 */}
                <div style={styles.cardIndex}>{index + 1}</div>

                {/* ★画像がある場合は肖像画を、ない場合はアイコンを表示 */}
                <div style={styles.portraitWrapper}>
                  {imageFile ? (
                    <img 
                      src={`https://assets.smartbrief.jp/${imageFile}`} 
                      alt={author} 
                      style={styles.portraitImage} 
                    />
                  ) : (
                    <div style={styles.defaultIcon}>✒️</div>
                  )}
                </div>

                <span style={styles.name}>{author}</span>
                <div style={styles.cardLine}></div>
              </button>
            );
          })}
        </div>

        <div style={styles.footerArea}>
           <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: { minHeight: '100vh', backgroundColor: theme.colors.background, color: theme.colors.textMain, fontFamily: theme.fonts.body, paddingBottom: '40px' },
  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(252, 249, 242, 0.95)', borderBottom: `1px solid ${theme.colors.border}`, backdropFilter: 'blur(5px)' },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textSub, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: theme.fonts.heading },
  navTitle: { fontSize: '14px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  paperContainer: { maxWidth: '1000px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)', borderTop: `6px solid ${theme.colors.primary}`, padding: '40px 20px', minHeight: '600px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  headerIcon: { fontSize: '32px', display: 'block', marginBottom: '10px' },
  title: { fontSize: '24px', color: theme.colors.primary, fontFamily: theme.fonts.heading, marginBottom: '8px', letterSpacing: '0.1em' },
  sub: { color: theme.colors.textSub, fontSize: '13px', fontFamily: theme.fonts.body },
  
  // 最小幅を140pxに絞り、より多くのカードを1行に詰め込む
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: '12px', 
    marginBottom: '60px' 
  },
  
  // 図書カード風のデザイン
  authorCard: { 
    position: 'relative',
    backgroundColor: '#fdfbf7', // わずかに紙のような色
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: '4px', 
    padding: '20px 10px 15px', 
    cursor: 'pointer', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    overflow: 'hidden'
  },
  cardIndex: { position: 'absolute', top: '5px', left: '5px', fontSize: '9px', color: '#ccc', fontFamily: 'serif' },
  
  // ★追加：肖像画用コンテナのスタイル
  portraitWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    overflow: 'hidden',
    marginBottom: '10px',
    border: `2px solid ${theme.colors.accent}`,
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
  },
  portraitImage: { width: '100%', height: '100%', objectFit: 'cover' },
  defaultIcon: { fontSize: '20px', opacity: 0.3 },

  name: { fontWeight: 'bold', color: theme.colors.textMain, fontSize: '14px', fontFamily: theme.fonts.heading, textAlign: 'center', zIndex: 2 },
  cardLine: { width: '40px', height: '1px', backgroundColor: theme.colors.accent, marginTop: '8px', opacity: 0.6 },

  footerArea: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: '20px' },
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  spinner: { width: '40px', height: '40px', border: '3px solid #eee', borderTop: `3px solid ${theme.colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontFamily: theme.fonts.heading, color: theme.colors.textSub },
};

export default AuthorList;