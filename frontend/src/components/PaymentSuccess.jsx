import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        <h2 style={styles.title}>お申し込みありがとうございます！</h2>
        <p style={styles.text}>
          プレミアムプランへの登録が完了しました。<br />
          制限なしで全ての要約をお楽しみいただけます。
        </p>
        <button 
          style={styles.button}
          onClick={() => navigate('/search')} // 検索画面へ遷移
        >
          さっそく本を探す
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    color: '#2d3748',
    marginBottom: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  text: {
    color: '#718096',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  button: {
    backgroundColor: '#10B981', // エメラルドグリーン
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'opacity 0.2s',
  }
};

export default PaymentSuccess;