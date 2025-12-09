import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  // viewMode: 'login' | 'register' | 'reset' で画面を切り替え
  const [viewMode, setViewMode] = useState('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // APIへログインリクエスト
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // ★修正: 親コンポーネント(App.js)にトークンを渡す
        onLogin(data.token);
      } else {
        setMessage('ログインに失敗しました。ユーザー名かパスワードが違います。');
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 新規会員登録処理（修正版） ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    // === 1. セキュリティチェックを追加 (ここから) ===
    
    // IDとパスワードが同じかチェック
    if (username === password) {
      setMessage('IDと同じパスワードは使用できません。');
      return; // 処理を中断
    }

    // パスワードの強度チェック
    // 条件: 8文字以上、大文字・小文字・数字・記号(!@#$%^&*)を含む
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    
    if (!strongPasswordRegex.test(password)) {
      setMessage('パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を全て含めてください。');
      return; // 処理を中断
    }
    // === セキュリティチェック (ここまで) ===


    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        alert('登録が完了しました！ログインしてください。');
        setViewMode('login'); // ログイン画面に戻す
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

  // --- パスワードリセット処理（今回はモック） ---
  const handleReset = (e) => {
    e.preventDefault();
    // 本格的な実装にはメール送信サーバーが必要です。今回はアラートのみ。
    alert('管理者にお問い合わせください。(未実装)');
  };

  // --- 共通のフォームコンポーネント ---
  const renderForm = (title, buttonText, onSubmit) => (
    <form onSubmit={onSubmit} style={styles.form}>
      <h2 style={styles.title}>{title}</h2>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
      </div>

      {message && <p style={styles.error}>{message}</p>}

      <button type="submit" style={styles.button} disabled={isLoading}>
        {isLoading ? '処理中...' : buttonText}
      </button>
    </form>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* === 1. ログイン画面 === */}
        {viewMode === 'login' && (
          <>
            {renderForm('SmartBrief ログイン', 'ログイン', handleLogin)}
            <div style={styles.footer}>
              <p>アカウントをお持ちでないですか？</p>
              <button onClick={() => setViewMode('register')} style={styles.linkButton}>
                新規会員登録
              </button>
              <br />
              <button onClick={() => setViewMode('reset')} style={styles.linkButtonSmall}>
                パスワードを忘れましたか？
              </button>
            </div>
          </>
        )}

        {/* === 2. 新規登録画面 === */}
        {viewMode === 'register' && (
          <>
            {renderForm('新規会員登録', '登録する', handleRegister)}
            <div style={styles.footer}>
              <button onClick={() => setViewMode('login')} style={styles.linkButton}>
                ログイン画面に戻る
              </button>
            </div>
          </>
        )}

        {/* === 3. パスワードリセット画面 === */}
        {viewMode === 'reset' && (
          <div style={styles.form}>
            <h2 style={styles.title}>パスワード再設定</h2>
            <p style={{marginBottom: '20px'}}>
              登録したユーザー名を入力してください。<br/>
              （※現在はデモ機能です）
            </p>
            <input
              type="text"
              placeholder="Username"
              style={styles.input}
            />
            <button onClick={handleReset} style={styles.button}>
              リセットメールを送信
            </button>
            <div style={styles.footer}>
              <button onClick={() => setViewMode('login')} style={styles.linkButton}>
                キャンセル
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- スタイル定義 (中央寄せレイアウト) ---
const styles = {
  container: {
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    backgroundColor: '#f0f2f5',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    marginBottom: '24px',
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#666',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    marginTop: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  error: {
    color: '#dc3545',
    marginBottom: '10px',
    fontSize: '14px',
  },
  footer: {
    marginTop: '24px',
    borderTop: '1px solid #eee',
    paddingTop: '16px',
    fontSize: '14px',
    color: '#666',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    padding: '5px',
  },
  linkButtonSmall: {
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '10px',
  },
};

export default Login;6