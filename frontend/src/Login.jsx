import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from "./components/Footer";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'register'
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ★追加: 再送ボタン制御用
  const [showResendLink, setShowResendLink] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setShowResendLink(false); // 初期化
    setResendStatus('');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), 
      });

      const data = await response.json(); // エラー時もメッセージを読むためにパース

      if (response.ok) {
        if (data.token) {
            onLogin(data.token);
            // navigate('/') は App.jsx 側の制御に任せても良いが、念のため
            navigate('/');
        }
      } else {
        // エラーメッセージを表示
        setMessage(data.message || 'IDまたはパスワードが正しくありません。');

        // ★追加: バックエンドから「認証」関連のエラーが来たら再送ボタンを出す
        if (response.status === 401 && data.message && data.message.includes('認証')) {
            setShowResendLink(true);
        }
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ★追加: 認証メール再送処理 ---
  const handleResendEmail = async () => {
    // 簡易チェック: 入力欄に @ がなければ警告
    if (!username.includes('@')) {
        setResendStatus('※上の入力欄に「メールアドレス」を入力してください。');
        return;
    }

    setResendStatus('送信中...');

    try {
        const res = await fetch('/api/v1/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username }) // 入力欄の値をemailとして送信
        });
        
        if (res.ok) {
            setResendStatus('✅ 再送しました！迷惑メールフォルダも確認してください。');
        } else {
            setResendStatus('❌ 再送に失敗しました。メールアドレスを確認してください。');
        }
    } catch (err) {
        setResendStatus('❌ 通信エラー');
    }
  };

  // --- 新規登録処理 ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) { setMessage('規約への同意が必要です。'); return; }
    
    setIsLoading(true);
    try {
        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        if(response.ok) {
            alert('仮登録が完了しました！\n届いたメール内のリンクをクリックして認証してください。');
            setViewMode('login');
            setMessage('');
        } else {
            const txt = await response.text();
            // JSONで返ってくる場合もあるので整形できればベターだが、一旦textで表示
            setMessage(txt.replace(/["{}]/g, '')); 
        }
    } catch(e) { setMessage('エラーが発生しました'); } finally { setIsLoading(false); }
  };

  // --- 入力フォーム部品 (共通) ---
  const renderInput = (label, type, value, setter, placeholder) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input type={type} value={value} onChange={(e) => setter(e.target.value)} style={styles.input} placeholder={placeholder} required />
    </div>
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.heroSection}>
        <div style={styles.logoArea}>
           <h1 style={styles.logo}>SmartBrief</h1>
           <p style={styles.catchphrase}>名作を、現代のスピードで。</p>
           <p style={styles.subCatch}>教養深まる、AI要約図書館</p>
        </div>
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

          {/* 右側: ログイン/登録フォーム */}
          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h2 style={styles.formTitle}>
                {viewMode === 'login' ? '書架への入り口' : '新規利用者カード作成'}
              </h2>
              
              {viewMode === 'login' ? (
                <form onSubmit={handleLogin} style={styles.form}>
                  {renderInput('ユーザーID / Email', 'text', username, setUsername, 'user@example.com')}
                  {renderInput('パスワード', 'password', password, setPassword, '')}
                  
                  {message && <p style={styles.error}>{message}</p>}

                  {/* ★追加: 再送リンクエリア */}
                  {showResendLink && (
                    <div style={styles.resendArea}>
                        <p style={{fontSize:'13px', marginBottom:'5px', color:'#e65100'}}>メールが届いていませんか？</p>
                        <button 
                            type="button" 
                            onClick={handleResendEmail} 
                            style={styles.resendBtn}
                        >
                            📩 認証メールを再送する
                        </button>
                        {resendStatus && <p style={styles.resendMsg}>{resendStatus}</p>}
                    </div>
                  )}

                  <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? '照会中...' : '入館する (ログイン)'}</button>
                  <div style={styles.formFooter}>
                    <p>初めての方はこちら</p>
                    <button type="button" onClick={() => setViewMode('register')} style={styles.switchButton}>新規登録 (無料)</button>
                    <button type="button" onClick={() => navigate('/forgot-password')} style={styles.forgotLink}>パスワードを忘れた場合</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={styles.form}>
                  {renderInput('ユーザーID', 'text', username, setUsername, '半角英数')}
                  {renderInput('メールアドレス', 'email', email, setEmail, '')}
                  {renderInput('パスワード', 'password', password, setPassword, '8文字以上')}
                  
                  <div style={styles.checkboxContainer}>
                    <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                    <label htmlFor="agree" style={{marginLeft:'5px', fontSize:'13px'}}>
                      <Link to="/terms" target="_blank">利用規約</Link> と <Link to="/privacy" target="_blank">プライバシーポリシー</Link> に同意する
                    </label>
                  </div>

                  {message && <p style={styles.error}>{message}</p>}
                  <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? '作成中...' : '登録して始める'}</button>
                  <div style={styles.formFooter}>
                    <button type="button" onClick={() => setViewMode('login')} style={styles.switchButton}>ログインに戻る</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer color="#6d4c41" separatorColor="#a1887f" />
    </div>
  );
};

const styles = {
  pageWrapper: { backgroundColor: '#f4f1ea', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '"Shippori Mincho", serif', color: '#4a3b32' },
  heroSection: { textAlign: 'center', padding: '60px 20px 40px', backgroundColor: '#fffcf5', borderBottom: '1px solid #e0e0e0' },
  logo: { fontSize: '3.5rem', margin: '0 0 10px 0', color: '#3e2723', letterSpacing: '2px', fontFamily: '"Shippori Mincho", serif' },
  catchphrase: { fontSize: '1.4rem', color: '#5d4037', margin: 0, fontWeight: 'bold' },
  subCatch: { fontSize: '1rem', color: '#8d6e63', marginTop: '10px' },
  
  container: { flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 20px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', alignItems: 'start' },
  
  // 左カラム
  infoColumn: { paddingTop: '20px' },
  featureBox: { padding: '0 20px' },
  featureTitle: { fontSize: '20px', borderBottom: '2px solid #8d6e63', display: 'inline-block', marginBottom: '20px', paddingBottom: '5px' },
  featureText: { lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' },
  featureList: { lineHeight: '2.2', fontSize: '15px', paddingLeft: '20px', color: '#3e2723' },
  priceBox: { marginTop: '30px', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #d7ccc8', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  priceLabel: { display: 'block', fontSize: '12px', color: '#8d6e63', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' },
  priceValue: { fontSize: '28px', fontWeight: 'bold', color: '#3e2723' },
  priceNote: { fontSize: '12px', color: '#a1887f', marginTop: '10px' },

  // 右カラム
  formColumn: { },
  card: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(62, 39, 35, 0.08)', border: '1px solid #efebe9' },
  formTitle: { textAlign: 'center', fontSize: '18px', marginBottom: '30px', color: '#5d4037' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', color: '#6d4c41' },
  input: { width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #d7ccc8', backgroundColor: '#fffcf5', fontSize: '16px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', backgroundColor: '#5d4037', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  error: { color: '#c62828', fontSize: '13px', marginBottom: '15px', textAlign: 'center', whiteSpace: 'pre-wrap' },
  formFooter: { marginTop: '25px', textAlign: 'center', fontSize: '13px', color: '#8d6e63' },
  switchButton: { background: 'none', border: 'none', color: '#3e2723', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  forgotLink: { display: 'block', marginTop: '10px', background: 'none', border: 'none', color: '#a1887f', cursor: 'pointer', fontSize: '12px' },
  checkboxContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },

  // ★追加: 再送エリアのスタイル
  resendArea: { backgroundColor: '#fff8e1', padding: '15px', borderRadius: '6px', border: '1px dashed #ffb74d', marginBottom: '15px', textAlign: 'center' },
  resendBtn: { background: 'none', border: 'none', color: '#e65100', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  resendMsg: { fontSize: '12px', marginTop: '8px', fontWeight: 'bold', color: '#333' }
};

export default Login;