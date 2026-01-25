import { useAuthStore } from '../store/authStore';

const BASE_URL = '/api/v1';

// 1. レスポンスの基本形を定義
interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  message?: string;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};

async function request<T>(endpoint: string, method: string, body: any = null): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      // ★修正: JSONでデータを送ることをバックエンドに伝えるヘッダーを明示
      headers: {
        'Content-Type': 'application/json',
      },
      // ★重要: HttpOnly Cookieをブラウザに自動送信させる
      credentials: 'include', 
      body: body ? JSON.stringify(body) : null,
    });

    // ★ 401 (認証エラー) が返ってきたら、Zustand の logout() を呼んで全体をリセット
    if (res.status === 401) {
      useAuthStore.getState().logout();
    }

    // ★ 修正後：Content-Typeを見て、JSONかテキストかをスマートに判別
    let data: any = null;
    const isJson = res.headers.get('content-type')?.includes('application/json');

    try {
      data = isJson ? await res.json() : await res.text();
    } catch {
      data = {}; // パース失敗時の安全策
    }

    // --- エラー時のハンドリング ---
    if (!res.ok) {
      let finalMsg = `Error: ${res.status} (${res.statusText})`;
      
      // バックエンドから返されたエラーメッセージを抽出
      if (typeof data === 'string' && data.trim().length > 0) {
        finalMsg = data;
      } else if (data && typeof data === 'object') {
        finalMsg = data.message || data.error || data.detail || finalMsg;
      }

      return { ok: false, status: res.status, message: finalMsg, data };
    }

    // --- 成功時 ---
    return { ok: true, status: res.status, data: data as T };

  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, message: '通信エラーが発生しました。', data: null as any };
  }
}