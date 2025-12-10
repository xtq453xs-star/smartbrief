import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import Login from './Login';
import PaymentSuccess from './components/PaymentSuccess';
import Dashboard from './components/Dashboard'; // ★追加

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

// ルーティングと画面遷移ロジック
function AppContent({ token, setToken }) {
  const navigate = useNavigate();

  // --- ログアウト処理 ---
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // --- 本を選択した時の処理 (ダッシュボードから呼ばれる) ---
  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <Routes>
      {/* 1. ログイン */}
      <Route path="/login" element={
        !token ? <Login onLogin={(t) => setToken(t)} /> : <Navigate to="/" />
      } />

      {/* 2. ダッシュボード (トップページ) */}
      <Route path="/" element={
        token ? (
          <Dashboard 
            token={token} 
            onLogout={handleLogout} 
            onBookSelect={handleBookSelect} 
          />
        ) : <Navigate to="/login" />
      } />

      {/* 3. 検索画面 (独立) */}
      <Route path="/search" element={
        token ? (
          <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
             <button onClick={() => navigate('/')} style={{marginBottom: '20px'}}>← ダッシュボードへ</button>
             <BookSearch token={token} onBookSelect={handleBookSelect} />
          </div>
        ) : <Navigate to="/login" />
      } />

      {/* 4. 詳細画面 */}
      <Route path="/book/:bookId" element={
        token ? (
          <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
            <BookDetailWrapper token={token} navigate={navigate} />
          </div>
        ) : <Navigate to="/login" />
      } />

      {/* 5. 決済成功 */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// URLパラメータからIDを取得するためのラッパー
import { useParams } from 'react-router-dom';
const BookDetailWrapper = ({ token, navigate }) => {
  const { bookId } = useParams();
  
  // 制限到達時の処理
  const handleLimitReached = () => {
      // 簡易的にアラートを出してトップへ (本来は課金モーダルなどがベスト)
      alert("無料枠の上限に達しました。ダッシュボードからアップグレードしてください。");
      navigate('/');
  };

  return (
    <BookDetail 
      bookId={bookId} 
      token={token} 
      onBack={() => navigate(-1)} // ブラウザバックと同じ挙動
      onLimitReached={handleLimitReached}
    />
  );
};

export default AppWrapper;