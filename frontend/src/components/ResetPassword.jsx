import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme';
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();

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
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError('パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/reset-password', { token, password });

      if (res.ok) {
        setMessage('パスワードを変更しました！');
        showToast('パスワードを変更しました。', 'success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const msg = res.message || '変更に失敗しました。リンクの有効期限が切れている可能性があります。';
        setError(msg);
        showToast(msg, 'error');
      }
    } catch {
      setError('通信エラーが発生しました。');
      showToast('通信エラーが発生しました。', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div style={styles.wrapper}>
        <div style={styles.errorContainer}>無効なリンクです。</div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>🔐</span>
            <h2 style={styles.title}>新しいパスワードの設定</h2>
        </header>
        
        {message ? (
          <div style={styles.successBox}>
            <div style={{fontSize: '40px', marginBottom: '10px'}}>✅</div>
            <p style={styles.successText}>{message}</p>
            <p style={{fontSize:'12px', color: theme.colors.textSub}}>3秒後にログイン画面へ移動します...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="新しいパスワード"
                  style={styles.input}
                  required
                />
            </div>
            <div style={styles.inputGroup}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワード（確認用）"
                  style={styles.input}
                  required
                />
            </div>
            
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </form>
        )}
      </main>
      <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
    </div>
  );
};

// ForgotPasswordと同じスタイル定義
const styles = {
  wrapper: {
    minHeight: '100vh', backgroundColor: theme.colors.background,
    color: theme.colors.textMain, fontFamily: theme.fonts.body,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
  },
  paperContainer: {
    width: '100%', maxWidth: '480px', backgroundColor: '#fff', 
    borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
    borderTop: `6px solid ${theme.colors.primary}`, padding: '40px 30px', marginBottom: '40px', textAlign: 'center'
  },
  header: { marginBottom: '30px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '15px' },
  title: { 
    fontSize: '24px', color: theme.colors.primary, 
    fontFamily: theme.fonts.heading, marginBottom: '15px', letterSpacing: '0.05em'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: {
    padding: '12px', fontSize: '16px', border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px', backgroundColor: '#fdfbf7', outline: 'none',
    transition: 'border 0.2s', fontFamily: theme.fonts.body, color: theme.colors.textMain
  },
  primaryButton: {
    ...theme.ui.buttonPrimary, width: '100%', padding: '12px', borderRadius: '30px',
    fontSize: '15px', marginTop: '10px', cursor: 'pointer', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  errorBox: { 
    color: '#e53e3e', fontSize: '14px', backgroundColor: '#fff5f5', 
    padding: '10px', borderRadius: '4px', border: '1px solid #feb2b2', textAlign: 'center' 
  },
  successBox: { 
    padding: '30px 20px', backgroundColor: '#f0fff4', borderRadius: '8px', 
    border: '1px solid #c6f6d5', display: 'flex', flexDirection: 'column', alignItems: 'center' 
  },
  successText: { color: '#2f855a', marginBottom: '10px', fontWeight: 'bold' },
  errorContainer: { textAlign: 'center', padding: '50px', color: theme.colors.textSub }
};

export default ResetPassword;