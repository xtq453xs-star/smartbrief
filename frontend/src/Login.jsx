import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from './components/Footer'; 
import { theme } from './theme'; // theme.js をインポート
import { apiClient } from './utils/apiClient'; // ★追加
import { useToast } from './contexts/ToastContext'; // ★追加

// --- 共通コンポーネント（デザイン統一） ---
const InputField = ({ label, type, value, onChange, placeholder, required = true }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.input}
      placeholder={placeholder}
      required={required}
      // フォーカス時の色変化
      onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
      onBlur={(e) => e.target.style.borderColor = theme.colors.border}
    />
  </div>
);

const ActionButton = ({ onClick, disabled, children, secondary = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={secondary ? styles.buttonSecondary : styles.buttonPrimary}
    // hover効果は簡易的にJSで制御
    onMouseOver={(e) => !disabled && (e.currentTarget.style.opacity = '0.9')}
    onMouseOut={(e) => !disabled && (e.currentTarget.style.opacity = '1')}
  >
    {children}
  </button>
);

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'register'
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ★追加: 再送ボタンの表示制御
  const [showResendLink, setShowResendLink] = useState(false);

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResendLink(false); // リセット

    const res = await apiClient.post('/auth/login', { username, password });

    if (res.ok) {
      success('おかえりなさい！');
      onLogin(res.data.token);
      navigate('/');
    } else {
      showError(res.message);
      
      // ★ここが重要: 401かつメッセージに「認証」が含まれていれば再送ボタンを表示
      // (バックエンドのメッセージ: "メールアドレスの認証が完了していません...")
      if (res.status === 401 && (res.message.includes('認証') || res.message.includes('verify'))) {
        setShowResendLink(true);
      }
    }
    setIsLoading(false);
  };

  // --- 新規登録処理 ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) { showError('規約への同意が必要です。'); return; }
    
    setIsLoading(true);
    const res = await apiClient.post('/auth/register', { username, email, password });

    if (res.ok) {
        setViewMode('login');
        success('仮登録が完了しました！メールを確認してください。');
    } else {
        showError(res.message);
    }
    setIsLoading(false);
  };

  // --- 認証メール再送処理 ---
  const handleResendEmail = async () => {
    // ログインID欄に入力された値を使うため、メールアドレス形式かチェック
    if (!username.includes('@')) {
        showError('再送するためには、ユーザーID欄に正確なメールアドレスを入力してください。');
        return;
    }
    
    setIsLoading(true); // 連打防止
    // バックエンドは { email: "..." } を期待しているため、username を email として送信
    const res = await apiClient.post('/auth/resend-verification', { email: username });
    
    if (res.ok) {
        success('認証メールを再送しました。受信トレイを確認してください。');
        setShowResendLink(false); // 送信できたらボタンを隠す
    } else {
        showError(res.message || '再送に失敗しました。');
    }
    setIsLoading(false);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* ヒーローヘッダー */}
      <div style={styles.heroSection}>
         <h1 style={styles.logo}>SmartBrief</h1>
         <p style={styles.catchphrase}>名作を、現代のスピードで。</p>
         <p style={styles.subCatch}>教養深まる、AI要約図書館</p>
      </div>

      <div style={styles.container}>
        <div style={styles.contentGrid}>
          
          {/* 左側: サービス紹介 */}
          <div style={styles.infoColumn}>
            <div style={styles.featureBox}>
              <h3 style={styles.featureTitle}>📚 SmartBriefとは？</h3>
              <p style={styles.featureText}>
                青空文庫の名作文学を、AIが現代人向けに読みやすく要約。<br/>
                「教養として読んでおきたいけれど、時間がない」<br/>
                そんなあなたのための、新しい読書体験プラットフォームです。
              </p>
              
              <ul style={styles.featureList}>
                <li>⏱ <strong>1冊5分で読了</strong>：要点だけを抽出した高品質な要約</li>
                <li>🧠 <strong>AIによる考察</strong>：作品の背景や現代的解釈を解説</li>
                <li>📱 <strong>スマホ最適化</strong>：通勤・通学中も快適に</li>
              </ul>

              <div style={styles.priceBox}>
                <span style={styles.priceLabel}>Premium Plan</span>
                <div style={styles.priceValue}>
                  <span style={{fontSize:'16px'}}>月額</span> 1,000円 <span style={{fontSize:'14px'}}>(税込)</span>
                </div>
                <p style={styles.priceNote}>初月解約も可能です。まずは1冊、読んでみませんか？</p>
              </div>
            </div>
          </div>

          {/* 右側: フォームエリア */}
          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h2 style={styles.formTitle}>
                {viewMode === 'login' ? '書架への入り口' : '新規利用者カード作成'}
              </h2>
              
              {viewMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <InputField label="ユーザーID / Email" type="text" value={username} onChange={setUsername} placeholder="user@example.com" />
                  <InputField label="パスワード" type="password" value={password} onChange={setPassword} placeholder="" />
                  
                  {/* ★再送リンクエリア */}
                  {showResendLink && (
                    <div style={styles.resendArea}>
                        <p style={{fontSize:'13px', marginBottom:'5px', color: theme.colors.error}}>
                            メール認証が完了していません。
                        </p>
                        <button type="button" onClick={handleResendEmail} style={styles.resendBtn} disabled={isLoading}>
                            {isLoading ? '送信中...' : '📩 認証メールを再送する'}
                        </button>
                    </div>
                  )}

                  <ActionButton disabled={isLoading}>
                    {isLoading ? '照会中...' : '入館する (ログイン)'}
                  </ActionButton>

                  <div style={styles.formFooter}>
                    <p>初めての方はこちら</p>
                    <button type="button" onClick={() => setViewMode('register')} style={styles.switchButton}>新規登録 (無料)</button>
                    <button type="button" onClick={() => navigate('/forgot-password')} style={styles.forgotLink}>パスワードを忘れた場合</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <InputField label="ユーザーID" type="text" value={username} onChange={setUsername} placeholder="半角英数" />
                  <InputField label="メールアドレス" type="email" value={email} onChange={setEmail} placeholder="example@mail.com" />
                  <InputField label="パスワード" type="password" value={password} onChange={setPassword} placeholder="8文字以上" />
                  
                  <div style={styles.checkboxContainer}>
                    <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{accentColor: theme.colors.primary}} />
                    <label htmlFor="agree" style={{marginLeft:'8px', fontSize:'13px'}}>
                      <Link to="/terms" target="_blank" style={{color: theme.colors.primary}}>利用規約</Link> と <Link to="/privacy" target="_blank" style={{color: theme.colors.primary}}>プライバシーポリシー</Link> に同意する
                    </label>
                  </div>

                  <ActionButton disabled={isLoading}>
                    {isLoading ? '作成中...' : '登録して始める'}
                  </ActionButton>

                  <div style={styles.formFooter}>
                    <button type="button" onClick={() => setViewMode('login')} style={styles.switchButton}>ログインに戻る</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
    </div>
  );
};

// --- スタイル定義（theme.js 完全準拠） ---
const styles = {
  pageWrapper: { 
    backgroundColor: theme.colors.background, // クリーム色
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    fontFamily: theme.fonts.body, 
    color: theme.colors.textMain 
  },
  heroSection: { 
    textAlign: 'center', 
    padding: '60px 20px 40px', 
    backgroundColor: '#fffcf5', // ヘッダーは少し明るく
    borderBottom: `1px solid ${theme.colors.border}` 
  },
  logo: { 
    fontSize: '3.5rem', 
    margin: '0 0 10px 0', 
    color: theme.colors.textMain, 
    letterSpacing: '0.1em', 
    fontFamily: theme.fonts.heading 
  },
  catchphrase: { fontSize: '1.4rem', color: theme.colors.primary, margin: 0, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  subCatch: { fontSize: '1rem', color: theme.colors.textSub, marginTop: '10px' },
  
  container: { flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 20px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', alignItems: 'start' },
  
  // 左カラム
  infoColumn: { paddingTop: '20px' },
  featureBox: { padding: '0 20px' },
  featureTitle: { 
    fontSize: '20px', 
    borderBottom: `2px solid ${theme.colors.accent}`, // 茜色の下線
    display: 'inline-block', 
    marginBottom: '20px', 
    paddingBottom: '5px',
    fontFamily: theme.fonts.heading
  },
  featureText: { lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' },
  featureList: { lineHeight: '2.2', fontSize: '15px', paddingLeft: '20px', color: theme.colors.textMain },
  priceBox: { 
    marginTop: '30px', 
    backgroundColor: '#fff', // 白地
    padding: '25px', 
    borderRadius: '4px', // 角張らせる
    border: `1px solid ${theme.colors.border}`, 
    textAlign: 'center', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)' 
  },
  priceLabel: { display: 'block', fontSize: '12px', color: theme.colors.primary, fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' },
  priceValue: { fontSize: '28px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  priceNote: { fontSize: '12px', color: theme.colors.textSub, marginTop: '10px' },

  // 右カラム（フォーム）
  formColumn: { },
  card: { 
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
    borderTop: `6px solid ${theme.colors.primary}`, // アクセントライン
    padding: '40px', 
  },
  formTitle: { textAlign: 'center', fontSize: '20px', marginBottom: '30px', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.colors.primary, fontWeight: 'bold' },
  input: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '2px', // 角張らせる
    border: `1px solid ${theme.colors.border}`, 
    backgroundColor: '#fdfbf7', // 入力欄も少しクリーム色
    fontSize: '16px', 
    boxSizing: 'border-box',
    fontFamily: theme.fonts.body,
    outline: 'none',
    transition: 'border-color 0.2s',
    color: theme.colors.textMain
  },
  
  // ボタン
  buttonPrimary: {
    ...theme.ui.buttonPrimary, // theme.js のボタン
    width: '100%',
    marginTop: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '30px', // 柔らかさを出す
    padding: '12px'
  },
  buttonSecondary: {
    width: '100%', 
    padding: '14px', 
    backgroundColor: 'transparent', 
    color: theme.colors.textSub, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: '2px', 
    fontSize: '14px', 
    cursor: 'pointer', 
    marginTop: '10px'
  },
  
  error: { 
    color: theme.colors.error, 
    fontSize: '14px', 
    marginBottom: '15px', 
    textAlign: 'center', 
    whiteSpace: 'pre-wrap',
    backgroundColor: '#fff5f5', // 薄い赤背景
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #feb2b2'
  },
  formFooter: { marginTop: '25px', textAlign: 'center', fontSize: '13px', color: theme.colors.textSub },
  switchButton: { background: 'none', border: 'none', color: theme.colors.primary, textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: theme.fonts.body },
  forgotLink: { display: 'block', marginTop: '10px', background: 'none', border: 'none', color: theme.colors.textSub, cursor: 'pointer', fontSize: '12px' },
  checkboxContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },

  // 再送エリア
  resendArea: { 
    backgroundColor: '#fff8e1', 
    padding: '15px', 
    borderRadius: '4px', 
    border: '1px dashed #ffb74d', 
    marginBottom: '15px', 
    textAlign: 'center' 
  },
  resendBtn: { background: 'none', border: 'none', color: '#e65100', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  resendMsg: { fontSize: '12px', marginTop: '8px', fontWeight: 'bold', color: theme.colors.textMain }
};

export default Login;