/* eslint-disable react-refresh/only-export-components */
// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { theme } from '../theme';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // トーストを追加する関数
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // 3秒後に自動で消す
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ショートカット関数
  const success = (msg) => showToast(msg, 'success');
  const error = (msg) => showToast(msg, 'error');

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      
      {/* トーストの表示エリア（画面右上） */}
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{...styles.toast, ...styles[toast.type]}}>
            <span style={styles.icon}>
              {toast.type === 'success' ? '✅' : '⚠️'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const styles = {
  toastContainer: {
    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  toast: {
    minWidth: '250px', padding: '15px 20px', borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', fontWeight: 'bold', color: '#fff',
    animation: 'slideIn 0.3s ease-out',
    fontFamily: theme.fonts.body,
  },
  success: { backgroundColor: theme.colors.primary }, // 勝色
  error: { backgroundColor: theme.colors.error },     // 赤
  icon: { fontSize: '16px' }
};