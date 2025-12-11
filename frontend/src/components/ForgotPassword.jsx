import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('パスワード再設定用のメールを送信しました。メールをご確認ください。');
      } else {
        const errText = await response.text();
        setError(errText || '送信に失敗しました。');
      }
    } catch (err) {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>パスワードをお忘れの方</h2>
        <p style={styles.text}>
          登録したメールアドレスを入力してください。<br/>
          パスワード再設定用のリンクをお送りします。
        </p>

        {message ? (
          <div style={styles.successBox}>
            <p>{message}</p>
            <button onClick={() => navigate('/login')} style={styles.linkButton}>
              ログイン画面に戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              style={styles.input}
              required
            />
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? '送信中...' : 'メールを送信'}
            </button>
            
            <div style={styles.footer}>
              <button type="button" onClick={() => navigate('/login')} style={styles.linkButton}>
                キャンセルして戻る
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  card: { width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' },
  title: { marginBottom: '20px', color: '#333', fontSize: '24px', fontWeight: 'bold' },
  text: { fontSize: '14px', color: '#666', marginBottom: '30px', lineHeight: '1.6' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  button: { padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#dc3545', fontSize: '14px' },
  successBox: { backgroundColor: '#d4edda', color: '#155724', padding: '20px', borderRadius: '4px' },
  footer: { marginTop: '20px', fontSize: '14px' },
  linkButton: { background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }
};

export default ForgotPassword;