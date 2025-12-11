import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'register'
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // ★追加
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 法的表記の表示モード
  const [legalMode, setLegalMode] = useState(null); // 'tokusho' | 'privacy' | null

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // ユーザー名は ID または Email として扱われる
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), 
      });

      if (response.ok) {
        const data = await response.json();
        // ★修正: 親コンポーネント(App.js)のonLoginを呼び出す
        // App.js側でlocalStorageへの保存とsetTokenを行う
        onLogin(data.token);
      } else {
        setMessage('ログインに失敗しました。ID/メールまたはパスワードが違います。');
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 新規会員登録処理 (3点セット必須) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    // バリデーション
    if (username === password) {
      setMessage('IDと同じパスワードは使用できません。');
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setMessage('パスワードは8文字以上で、大文字・小文字・数字・記号を含めてください。');
      return;
    }
    // ★追加: 簡易メールチェック
    if (!email || !email.includes('@')) {
      setMessage('有効なメールアドレスを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ★修正: email も送信する
        body: JSON.stringify({ username, email, password }),
      });
      if (response.ok) {
        alert('登録が完了しました！ログインしてください。');
        setViewMode('login');
        setPassword(''); // パスワードだけクリア
      } else {
        const errText = await response.text();
        setMessage(`登録エラー: ${errText}`);
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 共通フォーム部品 ---
  const renderInput = (label, type, value, setter, placeholder) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => setter(e.target.value)} 
        style={styles.input} 
        placeholder={placeholder}
        required 
      />
    </div>
  );

  // --- 法的表記：特定商取引法 ---
  const renderTokusho = () => (
    <div style={styles.legalContainer}>
      <h3>特定商取引法に基づく表記</h3>
      <table style={styles.legalTable}>
        <tbody>
          <tr><th>販売業者</th><td>SmartBrief 運営事務局</td></tr>
          <tr><th>代表責任者</th><td>伊深 康一</td></tr>
          <tr><th>所在地</th><td>〒143-0024 東京都大田区中央5-12-1 IRIS西馬込 101</td></tr>
          <tr><th>電話番号</th><td>080-4360-6004</td></tr>
          <tr><th>メールアドレス</th><td>info@smartbrief.jp</td></tr>
          <tr><th>販売価格</th><td>月額 1,000円 (税込)</td></tr>
          <tr><th>商品代金以外の必要料金</th><td>インターネット接続料金</td></tr>
          <tr><th>支払方法</th><td>クレジットカード決済 (Stripe)</td></tr>
          <tr><th>支払時期</th><td>初回申込時および翌月以降毎月請求</td></tr>
          <tr><th>商品の引渡時期</th><td>決済完了後、即時利用可能</td></tr>
          <tr>
            <th>返品・キャンセル</th>
            <td>デジタルコンテンツの性質上、返品・返金には応じられません。<br/>解約はマイページよりいつでも可能です。次回更新日より請求は停止されます。</td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => setLegalMode(null)} style={styles.closeButton}>閉じる</button>
    </div>
  );

  // --- 法的表記：プライバシーポリシー ---
  const renderPrivacy = () => (
    <div style={styles.legalContainer}>
      <h3>プライバシーポリシー</h3>
      <div style={{textAlign: 'left', fontSize: '14px', lineHeight: '1.6'}}>
        <p>SmartBrief（以下「当サービス」）は、ユーザーの個人情報を適切に保護します。</p>
        <h4>1. 収集する情報</h4>
        <p>ユーザー名、パスワード、メールアドレス、閲覧履歴、決済情報（Stripe経由）。</p>
        <h4>2. 利用目的</h4>
        <p>サービスの提供、本人確認、パスワードリセット、利用料金の請求、サービス改善のため。</p>
        <h4>3. 第三者への提供</h4>
        <p>法令に基づく場合を除き、同意なく第三者に提供しません。</p>
      </div>
      <button onClick={() => setLegalMode(null)} style={styles.closeButton}>閉じる</button>
    </div>
  );

  // --- コンテンツ切り替え ---
  const renderContent = () => {
    // 1. 法的表記モードならそれを表示
    if (legalMode === 'tokusho') return renderTokusho();
    if (legalMode === 'privacy') return renderPrivacy();

    // 2. 通常のログイン/登録モード
    if (viewMode === 'register') {
      return (
        <form onSubmit={handleRegister} style={styles.form}>
          <h2 style={styles.title}>新規会員登録</h2>
          
          {renderInput('ユーザーID', 'text', username, setUsername, '半角英数')}
          {/* ★追加: メールアドレス入力欄 */}
          {renderInput('メールアドレス', 'email', email, setEmail, 'example@email.com')}
          {renderInput('パスワード', 'password', password, setPassword, '8文字以上(英数記号混在)')}

          {message && <p style={styles.error}>{message}</p>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? '登録中...' : 'アカウント作成'}
          </button>

          <div style={styles.footer}>
            <button type="button" onClick={() => setViewMode('login')} style={styles.linkButton}>
              ログイン画面に戻る
            </button>
          </div>
        </form>
      );
    }

    // Default: Login
    return (
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>ログイン</h2>
        
        {/* ★修正: ラベル変更 */}
        {renderInput('ユーザーID / メールアドレス', 'text', username, setUsername, '')}
        {renderInput('パスワード', 'password', password, setPassword, '')}

        {message && <p style={styles.error}>{message}</p>}

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? '認証中...' : 'ログイン'}
        </button>

        <div style={styles.footer}>
          <p>アカウントをお持ちでないですか？</p>
          <button type="button" onClick={() => setViewMode('register')} style={styles.linkButton}>
            新規会員登録
          </button>
          <br />
          {/* ★修正: パスワードリセット画面へ遷移 */}
          <button type="button" onClick={() => navigate('/forgot-password')} style={styles.linkButtonSmall}>
            パスワードを忘れましたか？
          </button>
        </div>
      </form>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* サービスロゴ・説明エリア */}
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
           <h1 style={{color: '#333', fontSize: '3rem', margin: '0 0 10px 0'}}>SmartBrief</h1>
           <p style={{color: '#666', fontSize: '1.2rem', lineHeight: '1.8', margin: '0 0 20px 0'}}>
             青空文庫をAIで超要約。<br />
             忙しいあなたのための読書体験。
           </p>
           <p style={{color: '#28a745', fontWeight: 'bold', fontSize: '1.1rem'}}>
             月額 ¥1,000 で読み放題
           </p>
        </div>

        {/* コンテンツエリア (カード) */}
        <div style={styles.card}>
          {renderContent()}
        </div>

        {/* フッターリンク */}
        <footer style={styles.siteFooter}>
          <button onClick={() => setLegalMode('tokusho')} style={styles.footerLink}>特定商取引法に基づく表記</button>
          <span style={{margin: '0 10px'}}>|</span>
          <button onClick={() => setLegalMode('privacy')} style={styles.footerLink}>プライバシーポリシー</button>
          <p style={{marginTop: '20px', fontSize: '12px', color: '#999'}}>© 2025 SmartBrief</p>
        </footer>

      </div>
    </div>
  );
};

// スタイル (変更なし)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif', padding: '20px' },
  wrapper: { width: '100%', maxWidth: '400px' },
  card: { padding: '40px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', marginBottom: '40px' },
  title: { marginBottom: '24px', color: '#333', fontSize: '24px', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' },
  input: { width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#dc3545', marginBottom: '10px', fontSize: '14px' },
  footer: { marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px', fontSize: '14px', color: '#666' },
  linkButton: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: '5px' },
  linkButtonSmall: { background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '12px', marginTop: '10px' },
  siteFooter: { textAlign: 'center', fontSize: '12px', color: '#666' },
  footerLink: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' },
  legalContainer: { textAlign: 'left' },
  legalTable: { width: '100%', fontSize: '14px', borderCollapse: 'collapse', marginBottom: '20px' },
  closeButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Login;