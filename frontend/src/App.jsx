import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// --- コンポーネントの読み込み ---
// ※ フォルダ構成: src/components/ にあるもの
import Dashboard from './components/Dashboard';
import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import AuthorList from './components/AuthorList';
import GenreList from './components/GenreList';
import PaymentSuccess from './components/PaymentSuccess';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// ※ 新しく作った規約系も components にあると仮定
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Legal from './components/Legal';

// ※ Login は src/ の直下にある
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

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

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

      {/* ★ ここに追加！ (メール認証画面はログイン前でも見れる必要があるため) */}
      <Route path="/verify" element={<VerifyEmail />} />
      
      {/* ★ Stripe審査用リンク */}
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

      {/* ★ ここで AuthorList や GenreList を使います (これで警告が消えます) */}
      <Route path="/authors" element={ token ? <AuthorList token={token} onBack={() => navigate('/')} /> : <Navigate to="/login" /> } />
      <Route path="/genres" element={ token ? <GenreList token={token} onBack={() => navigate('/')} /> : <Navigate to="/login" /> } />

      <Route path="/book/:bookId" element={
        token ? (
          <div style={{padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
            <BookDetailWrapper token={token} navigate={navigate} />
          </div>
        ) : <Navigate to="/login" />
      } />

      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const BookDetailWrapper = ({ token, navigate }) => {
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