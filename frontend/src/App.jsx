import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'; // ★追加
import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import Login from './Login';
import PaymentSuccess from './components/PaymentSuccess'; // ★追加

// --- メイン画面コンポーネント (今までのAppの中身をここに移動) ---
function MainLayout({ token, setToken }) {
  const [status, setStatus] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
  const [message, setMessage] = useState(''); // 使っていない場合は削除可

  const handleBookSelect = (bookId) => {
    setSelectedBookId(bookId);
  };

  const handleBackToSearch = () => {
    setSelectedBookId(null);
  };

  const handleLimitReached = () => {
    setSelectedBookId(null);
    setShowUpgradeScreen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken'); // ここで明示的に消す
    setStatus(null);
    setSelectedBookId(null);
    setShowUpgradeScreen(false);
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/v1/billing/status', {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (data.premium) setShowUpgradeScreen(false);
      }
    } catch (err) { console.error(err); }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (token) fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- 課金促進画面 ---
  if (showUpgradeScreen) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{fontSize: '3rem', margin: '0 0 20px'}}>⚠️</h1>
        <h2 style={{color: '#c62828'}}>無料プランの閲覧制限に達しました</h2>
        <p style={{fontSize: '18px', lineHeight: '1.6', margin: '20px 0'}}>
          本日の無料閲覧回数（3回）を使い切りました。<br/>
          続きを無制限で楽しむには、プレミアムプランへのアップグレードが必要です。
        </p>
        
        <div style={{border: '2px solid #28a745', padding: '30px', borderRadius: '10px', backgroundColor: '#f0fff4', margin: '30px 0'}}>
          <h3>💎 プレミアムプラン</h3>
          <p style={{fontSize: '24px', fontWeight: 'bold', margin: '10px 0'}}>¥1,000 / 月</p>
          <ul style={{textAlign: 'left', margin: '20px auto', maxWidth: '300px', lineHeight: '2'}}>
            <li>✅ 閲覧回数：<strong>無制限</strong></li>
            <li>✅ AI要約：<strong>高品質 (HQ) 版</strong></li>
            <li>✅ 広告なし</li>
          </ul>
          <button onClick={handleCheckout} style={styles.premiumButton}>
            今すぐアップグレードする
          </button>
        </div>

        <button onClick={() => setShowUpgradeScreen(false)} style={{textDecoration: 'underline', background: 'none', border: 'none', color: '#666', cursor: 'pointer'}}>
          トップに戻る
        </button>
      </div>
    );
  }

  // --- 通常メイン画面 ---
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0 }}>SmartBrief</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>ログアウト</button>
      </header>
      
      {!selectedBookId && (
        <BookSearch 
          token={token} 
          onBookSelect={handleBookSelect} 
        />
      )}

      {selectedBookId && token && (
        <BookDetail 
          bookId={selectedBookId} 
          token={token} 
          onBack={handleBackToSearch}
          onLimitReached={handleLimitReached}
        />
      )}

<hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* ★★★ 日本語化 ＆ 中央揃えデザイン ★★★ */}
      <div style={styles.statusSection}>
        <h3 style={{color: '#4a5568', marginBottom: '15px', textAlign: 'center'}}>会員証</h3>
        
        <div style={status?.premium ? styles.premiumCard : styles.freeCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>現在のプラン</span>
            {status?.premium ? (
              <span style={styles.premiumBadge}>💎 プレミアム</span>
            ) : (
              <span style={styles.freeBadge}>🌱 フリープラン</span>
            )}
          </div>
          
          <div style={styles.cardBody}>
            <div style={styles.row}>
              <span style={styles.rowLabel}>ユーザー名</span>
              <span style={styles.rowValue}>{status?.username || '---'}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>有効期限</span>
              <span style={styles.rowValue}>
                {status ? formatDate(status.subscriptionExpiresAt) : '---'}
              </span>
            </div>
          </div>

          {!status?.premium && (
            <button onClick={handleCheckout} style={styles.upgradeButton}>
              プレミアムにアップグレード
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// --- ★修正: Appコンポーネントはルーター定義に専念する ---
function App() {
  // トークン管理はここで行う
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // トークン更新時にlocalStorageも同期
  useEffect(() => {
    if (token) localStorage.setItem('authToken', token);
    else localStorage.removeItem('authToken');
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. ログイン画面 */}
        <Route path="/login" element={
          !token ? <Login onLogin={(t) => setToken(t)} /> : <Navigate to="/" />
        } />
        
        {/* 2. 決済成功画面 (ここが欲しかったルート！) */}
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* 3. メイン画面 (ログイン必須) */}
        <Route path="/" element={
          token ? <MainLayout token={token} setToken={setToken} /> : <Navigate to="/login" />
        } />
        
        {/* 4. 未知のURLはホームへ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  logoutButton: { padding: '8px 12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  premiumButton: { padding: '15px 30px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%' },
  
  // --- ★中央揃え＆日本語化対応スタイル ---
  statusSection: {
    maxWidth: '350px', // 少しスリムに
    margin: '30px auto 0', // ★これでカード自体が画面中央に来ます
    textAlign: 'center',
  },
  premiumCard: {
    backgroundColor: '#fff',
    border: '2px solid #F59E0B',
    borderRadius: '16px', // 丸みを強く
    padding: '30px 20px',
    boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.3), 0 8px 10px -6px rgba(245, 158, 11, 0.1)',
    background: 'linear-gradient(135deg, #ffffff 0%, #fffdf5 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  freeCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '30px 20px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column', // ★縦並びに変更
    alignItems: 'center',     // ★中央揃え
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px dashed #e2e8f0',
    paddingBottom: '20px',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#718096',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  premiumBadge: {
    backgroundColor: '#FFFBEB',
    color: '#D97706',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: '1px solid #FCD34D',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)',
  },
  freeBadge: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  row: {
    display: 'flex',
    justifyContent: 'center', // ★行の中身も中央寄せ
    alignItems: 'center',
    gap: '10px',
  },
  rowLabel: {
    color: '#A0AEC0',
    fontSize: '13px',
    fontWeight: '500',
  },
  rowValue: {
    color: '#2D3748',
    fontWeight: '600',
    fontSize: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  upgradeButton: {
    marginTop: '25px',
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)',
  }
};

export default App;