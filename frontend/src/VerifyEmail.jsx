import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Footer from './components/Footer'; // パスは環境に合わせて調整してください
import { theme } from './theme';
import { apiClient } from './utils/apiClient';
import { useToast } from './contexts/ToastContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const effectiveStatus = token ? status : 'error';

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      const res = await apiClient.get(`/auth/verify?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        setStatus('success');
        return;
      }
      setStatus('error');
      showToast(res.message || '認証に失敗しました。', 'error');
    };

    verify();
  }, [token, showToast]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>
          {effectiveStatus === 'verifying' && '⏳'}
          {effectiveStatus === 'success' && '✅'}
          {effectiveStatus === 'error' && '⚠️'}
        </div>
        
        <h2 style={styles.title}>
          {effectiveStatus === 'verifying' && '認証中...'}
          {effectiveStatus === 'success' && 'メール認証完了'}
          {effectiveStatus === 'error' && '認証エラー'}
        </h2>
        
        <div style={styles.divider}></div>

        <p style={styles.text}>
          {effectiveStatus === 'verifying' && 'メールアドレスの確認を行っています。'}
          {effectiveStatus === 'success' && 'メールアドレスの確認がとれました。\nログインしてサービスをご利用ください。'}
          {effectiveStatus === 'error' && '無効なリンクか、期限切れの可能性があります。\n再度登録を行うか、サポートまでお問い合わせください。'}
        </p>

        {effectiveStatus !== 'verifying' && (
          <button 
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            ログイン画面へ
          </button>
        )}
      </div>
      
      {/* 画面下部にフッター固定 */}
      <div style={styles.footerArea}>
        <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.background, fontFamily: theme.fonts.body, padding: '20px'
  },
  card: {
    backgroundColor: '#fff', padding: '50px 40px', borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center',
    maxWidth: '420px', width: '90%', border: `1px solid ${theme.colors.border}`,
    borderTop: `6px solid ${theme.colors.primary}`,
    flex: 1, maxHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
  },
  icon: { fontSize: '60px', marginBottom: '20px' },
  title: {
    color: theme.colors.primary, marginBottom: '20px', fontSize: '24px',
    fontWeight: 'bold', fontFamily: theme.fonts.heading, letterSpacing: '0.05em'
  },
  divider: {
    width: '40px', height: '2px', backgroundColor: theme.colors.accent,
    margin: '0 auto 30px'
  },
  text: { 
    color: theme.colors.textMain, lineHeight: '1.8', marginBottom: '40px', 
    whiteSpace: 'pre-wrap', fontSize: '15px' 
  },
  button: {
    ...theme.ui.buttonPrimary,
    width: '100%', padding: '14px', borderRadius: '30px',
    fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  footerArea: { marginTop: 'auto', width: '100%' }
};

export default VerifyEmail;