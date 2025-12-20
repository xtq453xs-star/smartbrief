import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { theme } from './theme'; // ★ theme.js をインポート
import { ToastProvider, useToast } from './contexts/ToastContext'; // ★追加
import { apiClient } from './utils/apiClient';

// --- コンポーネント群 ---
import Dashboard from './components/Dashboard';
import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import AuthorList from './components/AuthorList';
import GenreList from './components/GenreList';
import PaymentSuccess from './components/PaymentSuccess';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Legal from './components/Legal';
import Login from './Login'; 
import VerifyEmail from './VerifyEmail';

function AppWrapper() {
  // 初期値をlocalStorageから取得
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // ★修正: setTokenの代わりに、この「強化版関数」を使います
  const updateToken = (newToken) => {
    if (newToken) {
      // 1. State更新より先に、物理的に書き込む（これでapiClientが確実に拾える）
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
    // 2. その後にStateを更新して再レンダリング
    setToken(newToken);
  };

  return (
    <ToastProvider> {/* ★全体をこれで包むだけ！ */}
      <BrowserRouter>
        {/* setTokenの代わりに updateToken を渡す */}
        <AppContent token={token} setToken={updateToken} />
      </BrowserRouter>
    </ToastProvider>
  );
}

// 共通のコンテナスタイル（画面幅制御）
const PageContainer = ({ children }) => (
  <div style={styles.pageContainer}>{children}</div>
);

function AppContent({ token, setToken }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isPremium, setIsPremium] = useState(false);

  // ログアウト処理
  const handleLogout = useCallback(() => {
    setToken(null);
    setIsPremium(false);
    navigate('/login');
  }, [navigate, setToken]);

  // ユーザープラン確認
  useEffect(() => {
    const loadPlan = async () => {
      if (!token) {
        setIsPremium(false);
        return;
      }

      const res = await apiClient.get('/auth/me');
      if (!res.ok) {
        if (res.status === 401) handleLogout();
        else setIsPremium(false);
        return;
      }
      setIsPremium(res.data?.plan === 'PREMIUM');
    };

    loadPlan();
  }, [token, handleLogout]);

  const handleBookSelect = (bookId) => navigate(`/book/${bookId}`);

  // 課金・契約管理
  const handleCheckout = async () => {
    try {
      const res = await apiClient.post('/checkout/create-session', {});
      if (!res.ok) {
        showToast(res.message, 'error');
        if (res.status === 401) handleLogout();
        return;
      }
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch {
      showToast('通信エラーが発生しました。', 'error');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await apiClient.post('/billing/portal', {});
      if (!res.ok) {
        showToast(res.message, 'error');
        if (res.status === 401) handleLogout();
        return;
      }
      if (res.data?.portalUrl) window.location.href = res.data.portalUrl;
    } catch {
      showToast('通信エラーが発生しました。', 'error');
    }
  };

  return (
    <div style={styles.appRoot}>
      <Routes>
        {/* 公開ページ */}
        <Route path="/login" element={ !token ? <Login onLogin={setToken} /> : <Navigate to="/" /> } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/legal" element={<Legal />} />

        {/* 認証必須ページ */}
        <Route path="/" element={
          token ? (
            <Dashboard 
              token={token} 
              onLogout={handleLogout} 
              onBookSelect={handleBookSelect}
              onUpgrade={handleCheckout}
              onManage={handleManageSubscription}
            />
          ) : <Navigate to="/login" />
        } />

        <Route path="/search" element={
          token ? (
            <PageContainer>
               <button onClick={() => navigate('/')} style={styles.backLink}>← ダッシュボードへ</button>
               <BookSearch onBookSelect={handleBookSelect} onLogout={handleLogout} />
            </PageContainer>
          ) : <Navigate to="/login" />
        } />

        <Route path="/authors" element={ token ? <AuthorList token={token} onBack={() => navigate('/')} onLogout={handleLogout} /> : <Navigate to="/login" /> } />
        <Route path="/genres" element={ token ? <GenreList token={token} onBack={() => navigate('/')} onLogout={handleLogout} /> : <Navigate to="/login" /> } />

        <Route path="/book/:bookId" element={
          token ? (
            <PageContainer>
              <BookDetailWrapper navigate={navigate} isPremium={isPremium} onLogout={handleLogout} />
            </PageContainer>
          ) : <Navigate to="/login" />
        } />

        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

const BookDetailWrapper = ({ navigate, isPremium, onLogout }) => {
  const { bookId } = useParams();
  const handleLimitReached = useCallback(() => {
    // confirmを使うと少し上品になります
    if (window.confirm("無料枠の上限に達しました。\nプレミアムプラン詳細ページへ移動しますか？")) {
      navigate('/'); // ダッシュボードへ戻してアップグレードを促す
    }
  }, [navigate]);
  return (
    <BookDetail 
      bookId={bookId} 
      onBack={() => navigate(-1)}
      onLogout={onLogout}
      onLimitReached={handleLimitReached}
      isPremium={isPremium} 
    />
  );
};

// theme.js を活用したスタイル
const styles = {
  appRoot: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    fontFamily: theme.fonts.body,
    color: theme.colors.textMain,
  },
  pageContainer: {
    padding: '20px', 
    maxWidth: '900px', 
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  backLink: {
    background: 'none', 
    border: 'none', 
    color: theme.colors.textSub, 
    cursor: 'pointer',
    fontSize: '14px', 
    marginBottom: '15px', 
    padding: 0, 
    fontFamily: theme.fonts.heading,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'color 0.2s',
  }
};

export default AppWrapper;