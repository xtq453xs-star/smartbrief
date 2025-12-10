import React, { useState, useEffect } from 'react';
// useParams もここでまとめてインポートするのが一般的です
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'; 

import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import Login from './Login';
import PaymentSuccess from './components/PaymentSuccess';
import Dashboard from './components/Dashboard'; // ★重要: ダッシュボードのインポート
import AuthorList from './components/AuthorList'; // ★追加: 作家一覧のインポート
import GenreList from './components/GenreList'; // ★追加

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
          <div style={{padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
             <button 
                onClick={() => navigate('/')} 
                style={styles.backLink}
             >
                ← ダッシュボードへ
             </button>
             <BookSearch token={token} onBookSelect={handleBookSelect} />
          </div>
        ) : <Navigate to="/login" />
      } />

      {/* 4. ★追加: 作家一覧画面 */}
      <Route path="/authors" element={
        token ? (
          <AuthorList token={token} onBack={() => navigate('/')} />
        ) : <Navigate to="/login" />
      } />

      {/* ★追加: ジャンル一覧画面 */}
      <Route path="/genres" element={
        token ? (
          <GenreList token={token} onBack={() => navigate('/')} />
        ) : <Navigate to="/login" />
      } />

      {/* 5. 詳細画面 */}
      <Route path="/book/:bookId" element={
        token ? (
          <div style={{padding: '20px', maxWidth: '900px', margin: '0 auto'}}>
            <BookDetailWrapper token={token} navigate={navigate} />
          </div>
        ) : <Navigate to="/login" />
      } />

      {/* 6. 決済成功 */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// URLパラメータからIDを取得するためのラッパー
const BookDetailWrapper = ({ token, navigate }) => {
  const { bookId } = useParams();
  
  // 制限到達時の処理
  const handleLimitReached = () => {
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

// 簡易スタイル
const styles = {
  backLink: {
    background: 'none', border: 'none', color: '#666', cursor: 'pointer',
    fontSize: '14px', marginBottom: '10px', padding: 0, textDecoration: 'underline'
  }
};

export default AppWrapper;