import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
        setError('トークンが無効です。もう一度メールからアクセスしてください。');
        return;
    }
    if (password !== confirmPassword) {
        setError('パスワードが一致しません。');
        return;
    }
    // パスワード強度チェック
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError('パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setMessage('パスワードを変更しました！');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const errText = await response.text();
        setError(errText || '変更に失敗しました。リンクの有効期限が切れている可能性があります。');
      }
    } catch (err) {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <div style={{textAlign:'center', padding:'50px'}}>無効なリンクです。</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>新しいパスワードの設定</h2>
        
        {message ? (
          <div style={styles.successBox}>
            <p>{message}</p>
            <p style={{fontSize:'12px'}}>3秒後にログイン画面へ移動します...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="新しいパスワード"
              style={styles.input}
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワード（確認用）"
              style={styles.input}
              required
            />
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
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
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  button: { padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#dc3545', fontSize: '14px' },
  successBox: { backgroundColor: '#d4edda', color: '#155724', padding: '20px', borderRadius: '4px' }
};

export default ResetPassword;