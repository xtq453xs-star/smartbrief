import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// --- コンポーネントの読み込み ---
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
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) localStorage.setItem('authToken', token);
    else localStorage.removeItem('authToken');
  }, [token]);

  return (
    <BrowserRouter>
      <AppContent token={token} setToken={setToken} />
    </BrowserRouter>
  );
}

function AppContent({ token, setToken }) {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);

  // ★ログアウト処理をここに関数化（useEffect内でも呼べるように）
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    setIsPremium(false);
    navigate('/login');
  };

  // ★追加: ログイン時(tokenがある時)にプランを確認
  useEffect(() => {
    if (token) {
      fetch('/api/v1/auth/me', { 
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        // ★★★ 修正ポイント: 401エラー（トークン無効）なら強制ログアウト ★★★
        if (res.status === 401) {
            console.warn("トークンの有効期限が切れているか無効です。ログアウトします。");
            handleLogout(); 
            return null;
        }
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.plan === 'PREMIUM') {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      })
      .catch(err => {
        console.error("ユーザー情報の取得に失敗:", err);
        setIsPremium(false);
      });
    } else {
      setIsPremium(false);
    }
  }, [token]);

  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  // --- 課金処理 (Stripe) ---
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/v1/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({}), 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) window.location.href = data.checkoutUrl; 
      } else if (response.status === 401) {
          handleLogout(); // ここでも401チェックを入れると親切
      }
    } catch (err) { alert(`通信エラー: ${err.message}`); }
  };

  // --- 契約管理 ---
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({})
      });
      if (response.ok) {
        const data = await response.json();
        if (data.portalUrl) window.location.href = data.portalUrl;
      } else {
        alert("契約情報の取得に失敗しました");
      }
    } catch (err) { alert(`通信エラー: ${err.message}`); }
  };

  return (
    <Routes>
      {/* 公開ページ (ログイン不要) */}
      <Route path="/login" element={ !token ? <Login onLogin={(t) => setToken(t)} /> : <Navigate to="/" /> } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify" element={<VerifyEmail />} />
      
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/legal" element={<Legal />} />

      {/* ログインが必要なページ */}
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
          <div style={{padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
             <button onClick={() => navigate('/')} style={styles.backLink}>← ダッシュボードへ</button>
             <BookSearch token={token} onBookSelect={handleBookSelect} />
          </div>
        ) : <Navigate to="/login" />
      } />

      <Route path="/authors" element={ token ? <AuthorList token={token} onBack={() => navigate('/')} /> : <Navigate to="/login" /> } />
      <Route path="/genres" element={ token ? <GenreList token={token} onBack={() => navigate('/')} /> : <Navigate to="/login" /> } />

      <Route path="/book/:bookId" element={
        token ? (
          <div style={{padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
            {/* ここで isPremium を渡しているのは正しいです！ */}
            <BookDetailWrapper token={token} navigate={navigate} isPremium={isPremium} />
          </div>
        ) : <Navigate to="/login" />
      } />

      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Wrapperも正しいです
const BookDetailWrapper = ({ token, navigate, isPremium }) => {
  const { bookId } = useParams();
  const handleLimitReached = () => {
      alert("無料枠の上限に達しました。ダッシュボードからアップグレードしてください。");
      navigate('/');
  };
  return (
    <BookDetail 
      bookId={bookId} 
      token={token} 
      onBack={() => navigate(-1)}
      onLimitReached={handleLimitReached}
      isPremium={isPremium} 
    />
  );
};

const styles = {
  backLink: {
    background: 'none', border: 'none', color: '#666', cursor: 'pointer',
    fontSize: '14px', marginBottom: '10px', padding: 0, textDecoration: 'underline'
  }
};

export default AppWrapper;