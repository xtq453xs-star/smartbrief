import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  
  // React.StrictModeによる2回実行を防ぐためのフラグ
  const isCalledRef = useRef(false);

  useEffect(() => {
    // 既に実行済みなら何もしない
    if (isCalledRef.current) return;

    const token = searchParams.get('token');
    
    if (!token) {
        setStatus('error');
        return;
    }

    isCalledRef.current = true;
    
    // ★修正: パスをJavaのControllerに合わせ、localhostを削除
    fetch(`/api/v1/auth/verify-email?token=${token}`, { 
        method: 'POST' 
    })
      .then(async (res) => {
        // バックエンドが 200 OK なら成功（「既に認証済み」の場合も200で返る仕様なのでOK）
        if (res.ok) {
          setStatus('success');
        } else {
          // 400 Bad Request などの場合
          setStatus('error');
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md max-w-md w-full">
        {status === 'verifying' && (
             <div className="text-center">
                 <p className="text-lg font-bold text-gray-600">認証中...</p>
                 <p className="text-sm text-gray-500 mt-2">少々お待ちください</p>
             </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">認証成功！</h2>
            <p className="mb-6 text-gray-700">アカウント登録が完了しました。<br/>以下のボタンからログインしてください。</p>
            <button 
                onClick={() => navigate('/login')}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition duration-200"
            >
                ログイン画面へ進む
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">認証失敗</h2>
            <p className="mb-6 text-gray-700">
                リンクが無効になっているか、有効期限（24時間）が切れています。
            </p>
            {/* エラー時もトップやログインに戻れるようにする */}
            <div className="space-y-3">
                <button 
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition duration-200"
                >
                    ログイン画面に戻る
                </button>
                <p className="text-xs text-gray-500">
                    ※ログイン画面から認証メールの再送が可能です
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;