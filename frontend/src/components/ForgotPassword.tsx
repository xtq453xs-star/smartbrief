import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { theme } from '../theme'; 
import { apiClient } from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ★ イベントの型を React.FormEvent に指定
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });

      if (res.ok) {
        setMessage('パスワード再設定用のメールを送信しました。\nメールをご確認ください。');
        showToast('再設定メールを送信しました。', 'success');
      } else {
        setError(res.message || '送信に失敗しました。');
        showToast(res.message || '送信に失敗しました。', 'error');
      }
    } catch {
      setError('通信エラーが発生しました。');
      showToast('通信エラーが発生しました。', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>🔑</span>
            <h2 style={styles.title}>パスワードをお忘れの方</h2>
            <p style={styles.sub}>
              ご登録のメールアドレスを入力してください。<br/>
              再設定用の案内状をお送りいたします。
            </p>
        </header>

        {message ? (
          <div style={styles.successBox}>
            <div style={{fontSize: '40px', marginBottom: '10px'}}>📨</div>
            <p style={styles.successText}>{message}</p>
            <button onClick={() => navigate('/login')} style={styles.primaryButton}>
              ログイン画面に戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="library@example.com"
                  style={styles.input}
                  required
                />
            </div>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? '送信中...' : '再設定メールを送る'}
            </button>
            
            <div style={styles.linkArea}>
              <button type="button" onClick={() => navigate('/login')} style={styles.textLink}>
                キャンセルして戻る
              </button>
            </div>
          </form>
        )}
      </main>

      <div style={styles.footerArea}>
        <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
      </div>
    </div>
  );
};

// ★ スタイルの型定義を追加
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background, 
    color: theme.colors.textMain,
    fontFamily: theme.fonts.body,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  paperContainer: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#fff', 
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
    borderTop: `6px solid ${theme.colors.primary}`,
    padding: '40px 30px',
    marginBottom: '40px',
    textAlign: 'center'
  },
  header: { marginBottom: '30px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '15px' },
  title: { 
    fontSize: '24px', color: theme.colors.primary, 
    fontFamily: theme.fonts.heading, marginBottom: '15px', letterSpacing: '0.05em'
  },
  sub: { color: theme.colors.textSub, fontSize: '14px', lineHeight: '1.8', fontFamily: theme.fonts.body },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: theme.colors.primary, letterSpacing: '0.05em' },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    backgroundColor: '#fdfbf7', 
    outline: 'none',
    transition: 'border 0.2s',
    fontFamily: theme.fonts.body,
    color: theme.colors.textMain
  },
  primaryButton: {
    ...theme.ui.buttonPrimary,
    width: '100%',
    padding: '12px',
    borderRadius: '30px',
    fontSize: '15px',
    marginTop: '10px',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  errorBox: { 
    color: '#e53e3e', fontSize: '14px', backgroundColor: '#fff5f5', 
    padding: '10px', borderRadius: '4px', border: '1px solid #feb2b2', textAlign: 'center' 
  },
  successBox: { 
    padding: '30px 20px', backgroundColor: '#f0fff4', borderRadius: '8px', 
    border: '1px solid #c6f6d5', display: 'flex', flexDirection: 'column', alignItems: 'center' 
  },
  successText: { color: '#2f855a', marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontWeight: 'bold' },
  linkArea: { textAlign: 'center', marginTop: '10px' },
  textLink: {
    background: 'none', border: 'none', color: theme.colors.textSub, cursor: 'pointer', 
    textDecoration: 'underline', fontSize: '13px', fontFamily: theme.fonts.heading
  },
  footerArea: { width: '100%', maxWidth: '900px' },
};

export default ForgotPassword;