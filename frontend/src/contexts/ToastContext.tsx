/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { theme } from '../theme';

// --- 1. トースト1つ分のデータの型 ---
interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// --- 2. Contextで提供する関数たちの型（これが超重要！） ---
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

// --- 3. createContext に型を指定する ---
// 初期値は undefined になる可能性があるので | undefined をつける
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- 4. useToastのカスタムフック（安全に型を取り出す） ---
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ProviderのProps型定義
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // トーストを追加する関数
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // 3秒後に自動で消す
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ショートカット関数
  const success = (msg: string) => showToast(msg, 'success');
  const error = (msg: string) => showToast(msg, 'error');

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

// --- スタイル定義 ---
const styles: Record<string, React.CSSProperties> = {
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