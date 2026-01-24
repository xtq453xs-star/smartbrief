import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from './components/Footer'; 
import { theme } from './theme';
import { apiClient } from './utils/apiClient';
import { useToast } from './contexts/ToastContext';
import { useAuthStore } from './store/authStore';

// --- 1. 共通コンポーネントのProps型定義 ---
interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
}

interface ActionButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  secondary?: boolean;
}

// --- 2. 共通コンポーネント（型適用） ---
const InputField: React.FC<InputFieldProps> = ({ label, type, value, onChange, placeholder, required = true }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.input}
      placeholder={placeholder}
      required={required}
      onFocus={(e) => (e.target.style.borderColor = theme.colors.primary)}
      onBlur={(e) => (e.target.style.borderColor = theme.colors.border)}
    />
  </div>
);

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, secondary = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={secondary ? styles.buttonSecondary : styles.buttonPrimary}
    onMouseOver={(e) => !disabled && (e.currentTarget.style.opacity = '0.9')}
    onMouseOut={(e) => !disabled && (e.currentTarget.style.opacity = '1')}
  >
    {children}
  </button>
);

// --- 3. メインコンポーネント ---
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();
  const { success, error: showError } = useToast();
  
  // viewModeに型リテラルを指定
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // res.data.token が存在することを保証するために型を指定（apiClient側で定義した形式に合わせる）
    const res = await apiClient.post<{ token: string }>('/auth/login', { username, password });

    if (res.ok && res.data) {
      success('おかえりなさい！');
      setToken(res.data.token);
      navigate('/');
    } else {
      showError(res.message || 'ログインに失敗しました');
      if (res.status === 401 && (res.message?.includes('認証') || res.message?.includes('verify'))) {
        setShowResendLink(true);
      }
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { showError('規約への同意が必要です。'); return; }
    
    setIsLoading(true);
    const res = await apiClient.post('/auth/register', { username, email, password });

    if (res.ok) {
        setViewMode('login');
        success('仮登録が完了しました！メールを確認してください。');
    } else {
        showError(res.message || '登録に失敗しました');
    }
    setIsLoading(false);
  };

  const handleResendEmail = async () => {
    if (!username.includes('@')) {
        showError('再送するためには、ユーザーID欄に正確なメールアドレスを入力してください。');
        return;
    }
    
    setIsLoading(true);
    const res = await apiClient.post('/auth/resend-verification', { email: username });
    
    if (res.ok) {
        success('認証メールを再送しました。受信トレイを確認してください。');
        setShowResendLink(false);
    } else {
        showError(res.message || '再送に失敗しました。');
    }
    setIsLoading(false);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.heroSection}>
         <h1 style={styles.logo}>SmartBrief</h1>
         <p style={styles.catchphrase}>名作を、現代のスピードで。</p>
         <p style={styles.subCatch}>教養深まる、AI要約図書館</p>
      </div>

      <div style={styles.container}>
        <div style={styles.contentGrid}>
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

          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h2 style={styles.formTitle}>
                {viewMode === 'login' ? '書架への入り口' : '新規利用者カード作成'}
              </h2>
              
              {viewMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <InputField label="ユーザーID / Email" type="text" value={username} onChange={setUsername} placeholder="user@example.com" />
                  <InputField label="パスワード" type="password" value={password} onChange={setPassword} placeholder="" />
                  
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

// --- スタイル定義 ---
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: { backgroundColor: theme.colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: theme.fonts.body, color: theme.colors.textMain },
  heroSection: { textAlign: 'center', padding: '60px 20px 40px', backgroundColor: '#fffcf5', borderBottom: `1px solid ${theme.colors.border}` },
  logo: { fontSize: '3.5rem', margin: '0 0 10px 0', color: theme.colors.textMain, letterSpacing: '0.1em', fontFamily: theme.fonts.heading },
  catchphrase: { fontSize: '1.4rem', color: theme.colors.primary, margin: 0, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  subCatch: { fontSize: '1rem', color: theme.colors.textSub, marginTop: '10px' },
  container: { flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 20px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', alignItems: 'start' },
  infoColumn: { paddingTop: '20px' },
  featureBox: { padding: '0 20px' },
  featureTitle: { fontSize: '20px', borderBottom: `2px solid ${theme.colors.accent}`, display: 'inline-block', marginBottom: '20px', paddingBottom: '5px', fontFamily: theme.fonts.heading },
  featureText: { lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' },
  featureList: { lineHeight: '2.2', fontSize: '15px', paddingLeft: '20px', color: theme.colors.textMain },
  priceBox: { marginTop: '30px', backgroundColor: '#fff', padding: '25px', borderRadius: '4px', border: `1px solid ${theme.colors.border}`, textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  priceLabel: { display: 'block', fontSize: '12px', color: theme.colors.primary, fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' },
  priceValue: { fontSize: '28px', fontWeight: 'bold', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  priceNote: { fontSize: '12px', color: theme.colors.textSub, marginTop: '10px' },
  formColumn: { },
  card: { backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)', borderTop: `6px solid ${theme.colors.primary}`, padding: '40px' },
  formTitle: { textAlign: 'center', fontSize: '20px', marginBottom: '30px', color: theme.colors.textMain, fontFamily: theme.fonts.heading },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', color: theme.colors.primary, fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', borderRadius: '2px', border: `1px solid ${theme.colors.border}`, backgroundColor: '#fdfbf7', fontSize: '16px', boxSizing: 'border-box', fontFamily: theme.fonts.body, outline: 'none', transition: 'border-color 0.2s', color: theme.colors.textMain },
  buttonPrimary: { ...theme.ui.buttonPrimary, width: '100%', marginTop: '10px', fontSize: '16px', fontWeight: 'bold', borderRadius: '30px', padding: '12px' },
  buttonSecondary: { width: '100%', padding: '14px', backgroundColor: 'transparent', color: theme.colors.textSub, border: `1px solid ${theme.colors.border}`, borderRadius: '2px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' },
  formFooter: { marginTop: '25px', textAlign: 'center', fontSize: '13px', color: theme.colors.textSub },
  switchButton: { background: 'none', border: 'none', color: theme.colors.primary, textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: theme.fonts.body },
  forgotLink: { display: 'block', marginTop: '10px', background: 'none', border: 'none', color: theme.colors.textSub, cursor: 'pointer', fontSize: '12px' },
  checkboxContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  resendArea: { backgroundColor: '#fff8e1', padding: '15px', borderRadius: '4px', border: '1px dashed #ffb74d', marginBottom: '15px', textAlign: 'center' },
  resendBtn: { background: 'none', border: 'none', color: '#e65100', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
};

export default Login;