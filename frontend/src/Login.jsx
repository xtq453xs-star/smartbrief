import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'register'
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ★追加: 規約同意のチェック状態
  const [agreed, setAgreed] = useState(false);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 法的表記の表示モード: 'tokusho' | 'privacy' | 'terms' | null
  const [legalMode, setLegalMode] = useState(null); 

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), 
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.token);
      } else {
        setMessage('書架に見当たりません。IDかパスワードをご確認ください。');
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 新規会員登録処理 ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    // ★追加: 同意チェック
    if (!agreed) {
      setMessage('利用規約とプライバシーポリシーへの同意が必要です。');
      return;
    }

    if (username === password) {
      setMessage('IDと同じパスワードは使用できません。');
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setMessage('パスワードは8文字以上で、大文字・小文字・数字・記号を含めてください。');
      return;
    }
    if (!email || !email.includes('@')) {
      setMessage('有効なメールアドレスを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (response.ok) {
        alert('利用者カードを作成しました！ログインしてください。');
        setViewMode('login');
        setPassword('');
        setAgreed(false);
      } else {
        const errText = await response.text();
        setMessage(`登録エラー: ${errText}`);
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 共通フォーム部品 ---
  const renderInput = (label, type, value, setter, placeholder) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => setter(e.target.value)} 
        style={styles.input} 
        placeholder={placeholder}
        required 
      />
    </div>
  );

  // --- 法的表記：特定商取引法 ---
  const renderTokusho = () => (
    <div style={styles.legalContainer}>
      <h3 style={styles.legalTitle}>特定商取引法に基づく表記</h3>
      <table style={styles.legalTable}>
        <tbody>
          <tr><th>販売業者</th><td>SmartBrief 運営事務局</td></tr>
          <tr><th>代表責任者</th><td>伊深 康一</td></tr>
          <tr><th>所在地</th><td>〒143-0024 東京都大田区中央5-12-1 IRIS西馬込 101</td></tr>
          <tr><th>電話番号</th><td>080-4360-6004</td></tr>
          <tr><th>メールアドレス</th><td>info@smartbrief.jp</td></tr>
          <tr><th>販売価格</th><td>月額 1,000円 (税込)</td></tr>
          <tr><th>支払方法</th><td>クレジットカード決済 (Stripe)</td></tr>
          <tr><th>支払時期</th><td>初回申込時および翌月以降毎月請求</td></tr>
          <tr><th>商品の引渡時期</th><td>決済完了後、即時利用可能</td></tr>
          <tr>
            <th>返品・キャンセル</th>
            <td>デジタルコンテンツの性質上、返品・返金には応じられません。<br/>解約はマイページよりいつでも可能です。次回更新日より請求は停止されます。</td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => setLegalMode(null)} style={styles.closeButton}>閉じる</button>
    </div>
  );

  // --- 法的表記：プライバシーポリシー ---
  const renderPrivacy = () => (
    <div style={styles.legalContainer}>
      <h3 style={styles.legalTitle}>プライバシーポリシー</h3>
      <div style={styles.legalText}>
        <p>SmartBrief（以下「当サービス」）は、ユーザーの個人情報を適切に保護します。</p>
        <h4>1. 収集する情報</h4>
        <p>ユーザー名、パスワード、メールアドレス、閲覧履歴、決済情報（Stripe経由）。</p>
        <h4>2. 利用目的</h4>
        <p>サービスの提供、本人確認、パスワードリセット、利用料金の請求、サービス改善のため。</p>
        <h4>3. 第三者への提供</h4>
        <p>法令に基づく場合を除き、同意なく第三者に提供しません。</p>
      </div>
      <button onClick={() => setLegalMode(null)} style={styles.closeButton}>閉じる</button>
    </div>
  );

  // --- ★追加：利用規約 ---
  const renderTerms = () => (
    <div style={styles.legalContainer}>
      <h3 style={styles.legalTitle}>利用規約</h3>
      <div style={styles.legalText}>
        <p>この利用規約（以下「本規約」）は、SmartBrief（以下「当サービス」）の利用条件を定めるものです。</p>
        <h4>1. サービスの概要</h4>
        <p>当サービスは、AIを用いて青空文庫等の作品を要約・提供するサービスです。</p>
        <h4>2. 免責事項</h4>
        <p>当サービスが提供する要約内容はAIによって生成されたものであり、その正確性や完全性を保証するものではありません。また、当サービスの利用により生じた損害について、運営者は一切の責任を負いません。</p>
        <h4>3. 禁止事項</h4>
        <p>コンテンツの無断転載、不正アクセス、その他運営者が不適切と判断する行為を禁止します。</p>
        <h4>4. 規約の変更</h4>
        <p>運営者は、必要と判断した場合、ユーザーへの通知なく本規約を変更することができるものとします。</p>
      </div>
      <button onClick={() => setLegalMode(null)} style={styles.closeButton}>閉じる</button>
    </div>
  );

  // --- サービス概要（図書館風デザイン） ---
  const renderServiceInfo = () => (
    <div style={styles.infoBox}>
      <div style={styles.infoBoxHeader}>
        <span style={styles.infoBoxIcon}>📖</span>
        <h3 style={styles.infoTitle}>SmartBrief 利用案内</h3>
      </div>
      
      <p style={styles.infoText}>
        当館は、青空文庫の名作文学をAIが読みやすく要約して提供する、<br/>
        <strong>会員制「時短読書プラットフォーム」</strong>です。
      </p>
      
      <div style={styles.infoSection}>
         <strong style={styles.infoLabel}>【 蔵書・機能 】</strong>
         <ul style={styles.infoList}>
           <li>名作文学のAI要約（雑誌風レイアウト）の無制限閲覧</li>
           <li>今の気分に合わせた書籍検索機能</li>
           <li>LINE連携によるスマートフォン最適化表示</li>
         </ul>
      </div>
         
      <div style={styles.infoSection}>
         <strong style={styles.infoLabel}>【 入館システム 】</strong>
         <p style={styles.infoTextSmall}>
           有料コンテンツ（要約記事全文）を含んだ会員制サイトの利用料です。<br/>
           ※利用者登録および決済完了後、<strong>即時に</strong>プレミアム機能を提供します。
         </p>
      </div>

      <div style={{...styles.infoSection, borderBottom: 'none', marginBottom: 0}}>
         <strong style={styles.infoLabel}>【 料金プラン 】</strong>
         <ul style={styles.infoList}>
           <li style={{color: '#8d6e63', fontWeight: 'bold'}}>プレミアムプラン：¥1,000/月（税込）</li>
           <li>フリープラン：¥0/月</li>
         </ul>
      </div>
    </div>
  );

  // --- コンテンツ切り替え ---
  const renderContent = () => {
    if (legalMode === 'tokusho') return renderTokusho();
    if (legalMode === 'privacy') return renderPrivacy();
    if (legalMode === 'terms') return renderTerms(); // ★追加

    if (viewMode === 'register') {
      return (
        <form onSubmit={handleRegister} style={styles.form}>
          <h2 style={styles.formTitle}>新規利用者登録</h2>
          
          {renderInput('ユーザーID', 'text', username, setUsername, '半角英数')}
          {renderInput('メールアドレス', 'email', email, setEmail, 'example@email.com')}
          {renderInput('パスワード', 'password', password, setPassword, '8文字以上(英数記号混在)')}

          {/* ★追加: 同意チェックボックス */}
          <div style={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="agreeCheck" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="agreeCheck" style={styles.checkboxLabel}>
              <button type="button" onClick={() => setLegalMode('terms')} style={styles.linkInLabel}>利用規約</button>
              と
              <button type="button" onClick={() => setLegalMode('privacy')} style={styles.linkInLabel}>プライバシーポリシー</button>
              に同意する
            </label>
          </div>

          {message && <p style={styles.error}>{message}</p>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? '登録中...' : '利用者カードを作成'}
          </button>

          <div style={styles.footer}>
            <button type="button" onClick={() => setViewMode('login')} style={styles.linkButton}>
              ログイン画面に戻る
            </button>
          </div>
        </form>
      );
    }

    // Default: Login
    return (
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.formTitle}>ログイン</h2>
        
        {renderInput('ユーザーID / メールアドレス', 'text', username, setUsername, '')}
        {renderInput('パスワード', 'password', password, setPassword, '')}

        {message && <p style={styles.error}>{message}</p>}

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? '入館する' : 'ログイン'}
        </button>

        <div style={styles.footer}>
          <p>初めてのご利用ですか？</p>
          <button type="button" onClick={() => setViewMode('register')} style={styles.linkButton}>
            新規利用者登録
          </button>
          <br />
          <button type="button" onClick={() => navigate('/forgot-password')} style={styles.linkButtonSmall}>
            パスワードを忘れましたか？
          </button>
        </div>
      </form>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* ロゴとキャッチコピー */}
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
           <h1 style={styles.logo}>SmartBrief</h1>
           <p style={styles.catchphrase}>
             時を超えた名作を、現代のスピードで。<br />
             教養深まる、AI要約図書館。
           </p>
        </div>

        {/* サービス概要（法的表記モード時は隠す） */}
        {!legalMode && renderServiceInfo()}

        {/* メインカード */}
        <div style={styles.card}>
          {renderContent()}
        </div>

        {/* フッターリンク */}
        <footer style={styles.siteFooter}>
          <button onClick={() => setLegalMode('terms')} style={styles.footerLink}>利用規約</button>
          <span style={styles.footerSeparator}>|</span>
          <button onClick={() => setLegalMode('tokusho')} style={styles.footerLink}>特定商取引法に基づく表記</button>
          <span style={styles.footerSeparator}>|</span>
          <button onClick={() => setLegalMode('privacy')} style={styles.footerLink}>プライバシーポリシー</button>
          <p style={styles.copyright}>© 2025 SmartBrief Library</p>
        </footer>

      </div>
    </div>
  );
};

// ★デザイン：落ち着いた図書館テーマ
const styles = {
  container: { 
    display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', 
    backgroundColor: '#f4f1ea', // 生成り色（古紙風）
    color: '#4a3b32', // ダークブラウン（インク色）
    fontFamily: '"Shippori Mincho", "Yu Mincho", serif', // 明朝体で文学的に
    padding: '40px 20px'
  },
  wrapper: { width: '100%', maxWidth: '460px' },

  logo: { 
    fontSize: '3.5rem', margin: '0 0 10px 0', color: '#3e2723', 
    letterSpacing: '2px', fontWeight: 'bold', textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
  },
  catchphrase: { 
    color: '#6d4c41', fontSize: '1.1rem', lineHeight: '1.8', margin: '0', fontStyle: 'italic' 
  },

  // サービス概要（案内板風）
  infoBox: { 
    backgroundColor: '#fffcf5', // 明るいクリーム色
    padding: '25px 30px', 
    borderRadius: '4px', // 角を少し丸くする程度（カード風）
    marginBottom: '25px', 
    border: '1px solid #d7ccc8', 
    boxShadow: '0 2px 5px rgba(62, 39, 35, 0.05)',
    borderTop: '4px solid #8d6e63' // 背表紙のようなアクセント
  },
  infoBoxHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
  infoBoxIcon: { fontSize: '24px' },
  infoTitle: { fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#4e342e' },
  infoText: { fontSize: '14px', lineHeight: '1.8', color: '#5d4037', margin: '0 0 15px 0', textAlign: 'center' },
  infoTextSmall: { fontSize: '13px', lineHeight: '1.6', color: '#5d4037', margin: 0 },
  infoSection: { marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px dashed #d7ccc8' },
  infoLabel: { display: 'block', fontSize: '13px', color: '#3e2723', marginBottom: '8px', fontWeight: 'bold' },
  infoList: { fontSize: '13px', lineHeight: '1.8', color: '#5d4037', paddingLeft: '20px', margin: '0' },

  // カード（入力フォーム）
  card: { 
    padding: '40px', backgroundColor: '#ffffff', borderRadius: '4px', 
    boxShadow: '0 10px 30px rgba(62, 39, 35, 0.1)', 
    textAlign: 'center', marginBottom: '40px', border: '1px solid #efebe9'
  },
  formTitle: { marginBottom: '24px', color: '#3e2723', fontSize: '22px', fontWeight: 'bold', borderBottom: '2px solid #f4f1ea', display: 'inline-block', paddingBottom: '5px' },
  form: { display: 'flex', flexDirection: 'column' },
  
  inputGroup: { marginBottom: '20px', textAlign: 'left' },
  label: { display: 'block', marginBottom: '8px', color: '#6d4c41', fontSize: '14px', fontFamily: 'sans-serif', fontSize: '13px' }, // 入力ラベルは視認性のためゴシックも可だが、今回は雰囲気を優先
  input: { 
    width: '100%', padding: '12px', fontSize: '16px', 
    border: '1px solid #d7ccc8', borderRadius: '2px', // 角ばらせる
    backgroundColor: '#fffcf5', color: '#4e342e',
    boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'sans-serif'
  },

  button: { 
    width: '100%', padding: '14px', marginTop: '15px', 
    backgroundColor: '#5d4037', // 革のような濃い茶色
    color: '#fff', border: 'none', borderRadius: '2px', 
    fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', letterSpacing: '1px',
    transition: 'background-color 0.2s'
  },
  
  error: { color: '#b71c1c', marginBottom: '15px', fontSize: '14px', backgroundColor: '#ffebee', padding: '10px', borderRadius: '2px' },

  footer: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #efebe9', fontSize: '14px', color: '#8d6e63' },
  linkButton: { background: 'none', border: 'none', color: '#5d4037', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: '5px', fontWeight: 'bold' },
  linkButtonSmall: { background: 'none', border: 'none', color: '#a1887f', cursor: 'pointer', fontSize: '12px', marginTop: '15px', textDecoration: 'underline' },

  // チェックボックス周り
  checkboxContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '10px 0 20px 0' },
  checkbox: { cursor: 'pointer', width: '16px', height: '16px', accentColor: '#5d4037' },
  checkboxLabel: { fontSize: '13px', color: '#5d4037' },
  linkInLabel: { background: 'none', border: 'none', color: '#3e2723', textDecoration: 'underline', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' },

  // フッター
  siteFooter: { textAlign: 'center', fontSize: '12px', color: '#a1887f' },
  footerLink: { background: 'none', border: 'none', color: '#8d6e63', cursor: 'pointer', textDecoration: 'none', fontSize: '12px', padding: '5px', fontFamily: '"Shippori Mincho", serif' },
  footerSeparator: { margin: '0 5px', color: '#d7ccc8' },
  copyright: { marginTop: '15px', fontFamily: 'sans-serif', fontSize: '11px', opacity: 0.8 },

  // 法的表記エリア
  legalContainer: { textAlign: 'left' },
  legalTitle: { fontSize: '18px', borderBottom: '1px solid #d7ccc8', paddingBottom: '10px', marginBottom: '15px', color: '#3e2723' },
  legalText: { fontSize: '13px', lineHeight: '1.8', color: '#5d4037', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' },
  legalTable: { width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '20px', lineHeight: '1.8', color: '#4e342e' },
  closeButton: { padding: '8px 20px', backgroundColor: '#8d6e63', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', marginTop: '10px' }
};

// ホバーエフェクト（JS側で簡易実装）
styles.button[':hover'] = { backgroundColor: '#3e2723' };

export default Login;