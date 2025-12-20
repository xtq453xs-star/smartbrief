// src/utils/apiClient.js

// APIのベースURL（必要に応じて変更）
const BASE_URL = '/api/v1';

export const apiClient = {
  get: (endpoint) => request(endpoint, 'GET'),
  post: (endpoint, body) => request(endpoint, 'POST', body),
  put: (endpoint, body) => request(endpoint, 'PUT', body),
  delete: (endpoint) => request(endpoint, 'DELETE'),
};

async function request(endpoint, method, body = null) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    // 401エラー（認証切れ）の共通処理
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      // 強制リダイレクトさせるか、呼び出し元で処理するか
      // ここではステータスを返して呼び出し元に任せる
      return { ok: false, status: 401, message: 'セッションが切れました。再ログインしてください。' };
    }

    // レスポンスのパース（空の場合の対策）
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
        // エラーメッセージの優先順位: サーバーからのmsg > ステータスコード
        const errorMsg = data.message || `Error: ${res.status}`;
        return { ok: false, status: res.status, message: errorMsg, data };
    }

    return { ok: true, status: res.status, data };

  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, message: '通信エラーが発生しました。ネットワークを確認してください。' };
  }
}