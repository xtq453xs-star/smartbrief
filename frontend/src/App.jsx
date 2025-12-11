import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import Login from './Login';
import PaymentSuccess from './components/PaymentSuccess';
import Dashboard from './components/Dashboard';
import AuthorList from './components/AuthorList';
import GenreList from './components/GenreList';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

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

  // --- 課金処理 (Stripe Checkout) ---
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

  // --- 契約管理 (Stripe Portal) ---
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
      <Route path="/login" element={ !token ? <Login onLogin={(t) => setToken(t)} /> : <Navigate to="/" /> } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ★修正: Dashboardに課金/管理用の関数を渡す */}
      <Route path="/" element={
        token ? (
          <Dashboard 
            token={token} 
            onLogout={handleLogout} 
            onBookSelect={handleBookSelect}
            onUpgrade={handleCheckout}           // ★追加
            onManage={handleManageSubscription}  // ★追加
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