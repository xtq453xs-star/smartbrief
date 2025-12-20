// src/utils/apiClient.js

const BASE_URL = '/api/v1';

export const apiClient = {
  get: (endpoint) => request(endpoint, 'GET'),
  post: (endpoint, body) => request(endpoint, 'POST', body),
  put: (endpoint, body) => request(endpoint, 'PUT', body),
  delete: (endpoint) => request(endpoint, 'DELETE'),
};

async function request(endpoint, method, body = null) {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 401) {
      localStorage.removeItem('authToken');
    }

    const text = await res.text();
    let data = null;
    let errorMessage = null;

    // 1. JSONパースを試みる
    try {
      data = JSON.parse(text);
    } catch {
      // JSONじゃないなら、生テキストをそのままメッセージ候補にする
      errorMessage = text;
    }

    if (!res.ok) {
      // エラー時のメッセージ抽出ロジック（優先度順）
      if (!errorMessage) {
        if (typeof data === 'string') {
          // パターンA: サーバーが "エラーです" (JSON文字列) を返した場合
          errorMessage = data;
        } else if (data && typeof data === 'object') {
          // パターンB: サーバーが { message: "...", error: "..." } を返した場合
          // messageプロパティ、なければ errorプロパティ、それもなければ detailプロパティを探す
          errorMessage = data.message || data.error || data.detail;
          
          // それでも見つからなければ、オブジェクトを文字列化してみる（デバッグ用）
          if (!errorMessage) errorMessage = JSON.stringify(data);
        }
      }

      // 最終防衛ライン: 何も取れなかったらステータスコードを表示
      const finalMsg = errorMessage || `Error: ${res.status} (${res.statusText})`;
      
      return { ok: false, status: res.status, message: finalMsg, data };
    }

    return { ok: true, status: res.status, data };

  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, message: '通信エラーが発生しました。ネットワークを確認してください。' };
  }
}