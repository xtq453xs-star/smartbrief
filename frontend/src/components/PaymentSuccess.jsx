import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        <h2 style={styles.title}>Welcome to Premium</h2>
        <div style={styles.divider}></div>
        <p style={styles.text}>
          お申し込みありがとうございます。<br />
          プレミアムプランへの登録が完了しました。
        </p>
        <p style={styles.subText}>
          これより、すべての蔵書を<br/>
          無制限にお楽しみいただけます。
        </p>
        <button 
          style={styles.button}
          onClick={() => navigate('/')} 
        >
          書斎へ移動する
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.background, fontFamily: theme.fonts.body
  },
  card: {
    backgroundColor: '#fff', padding: '50px 40px', borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center',
    maxWidth: '420px', width: '90%', border: `1px solid ${theme.colors.border}`,
    borderTop: `6px solid ${theme.colors.primary}`
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
  text: { color: theme.colors.textMain, lineHeight: '1.8', marginBottom: '15px', fontWeight: 'bold' },
  subText: { color: theme.colors.textSub, lineHeight: '1.6', marginBottom: '40px', fontSize: '14px' },
  button: {
    ...theme.ui.buttonPrimary,
    width: '100%', padding: '14px', borderRadius: '30px',
    fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  }
};

export default PaymentSuccess;