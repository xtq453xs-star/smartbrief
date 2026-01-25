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
      
      // ★重要: これをつけることで、ブラウザがHttpOnly Cookieを勝手にバックエンドへ送ってくれる
      credentials: 'include', 
      body: body ? JSON.stringify(body) : null,
    });

    // ★ 401 (認証エラー) が返ってきたら、Zustand の logout() を呼んで全体をリセット
    if (res.status === 401) {
      useAuthStore.getState().logout();
    }

    const text = await res.text();
    let data: any = null;
    let errorMessage: string | null = null;

    try {
      data = JSON.parse(text);
    } catch {
      errorMessage = text;
    }

    if (!res.ok) {
      if (!errorMessage) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data && typeof data === 'object') {
          errorMessage = data.message || data.error || data.detail;
        }
      }
      const finalMsg = errorMessage || `Error: ${res.status} (${res.statusText})`;
      return { ok: false, status: res.status, message: finalMsg, data };
    }

    return { ok: true, status: res.status, data: data as T };

  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, message: '通信エラーが発生しました。', data: null as any };
  }
}