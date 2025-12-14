import React from 'react';
import Footer from './Footer';

const Legal = () => {
  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>特定商取引法に基づく表記</h1>
        <div style={styles.content}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <th style={styles.th}>販売事業者名</th>
                <td style={styles.td}>SmartBrief 運営事務局</td>
              </tr>
              <tr>
                <th style={styles.th}>代表責任者</th>
                <td style={styles.td}>伊深 康一</td>
              </tr>
              <tr>
                <th style={styles.th}>所在地</th>
                <td style={styles.td}>〒143-0024 東京都大田区中央5-12-1 IRIS西馬込 101</td>
              </tr>
              <tr>
                <th style={styles.th}>電話番号</th>
                <td style={styles.td}>
                  080-4360-6004<br/>
                  <span style={styles.note}>※サービスに関するお問い合わせは、記録保持の観点からメールにてお願いいたします。</span>
                </td>
              </tr>
              <tr>
                <th style={styles.th}>メールアドレス</th>
                <td style={styles.td}>info@smartbrief.jp</td>
              </tr>
              <tr>
                <th style={styles.th}>販売価格</th>
                <td style={styles.td}>
                  <strong>プレミアムプラン：月額 1,000円 (税込)</strong>
                </td>
              </tr>
              <tr>
                <th style={styles.th}>商品代金以外の<br/>必要料金</th>
                <td style={styles.td}>サイト閲覧、コンテンツダウンロード等に必要となるインターネット接続料金、通信料金。</td>
              </tr>
              <tr>
                <th style={styles.th}>お支払方法</th>
                <td style={styles.td}>クレジットカード決済 (Visa, Mastercard, American Express, JCB, Diners Club, Discover)</td>
              </tr>
              <tr>
                <th style={styles.th}>お支払時期</th>
                <td style={styles.td}>初回お申込み時に即時決済され、以降は毎月同日に自動更新されます。</td>
              </tr>
              <tr>
                <th style={styles.th}>商品の引渡時期</th>
                <td style={styles.td}>クレジットカード決済完了後、即時に有料コンテンツ（全文閲覧機能等）をご利用いただけます。</td>
              </tr>
              <tr>
                <th style={styles.th}>解約・返品について</th>
                <td style={styles.td}>
                  <p style={{marginBottom:'10px'}}>
                    <strong>【解約について】</strong><br/>
                    マイページの「契約の管理」より、いつでも解約手続きが可能です。<br/>
                    次回更新日の24時間前までに解約手続きを行った場合、次回の請求は発生しません。
                  </p>
                  <p>
                    <strong>【返品・返金について】</strong><br/>
                    デジタルコンテンツの性質上、決済完了後の返品・返金には応じられません。予めご了承ください。<br/>
                    月の途中で解約された場合も、日割り計算による返金は行われません（契約期間終了日までサービスをご利用いただけます）。
                  </p>
                </td>
              </tr>
              <tr>
                <th style={styles.th}>動作環境</th>
                <td style={styles.td}>
                  推奨ブラウザ：Google Chrome, Safari, Microsoft Edge の最新版<br/>
                  ※JavaScript、Cookieが有効な状態でご利用ください。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <a href="/login" style={styles.backLink}>トップページへ戻る</a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  pageContainer: { backgroundColor: '#f9f9f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '60px 20px', flex: 1, fontFamily: '"Noto Sans JP", sans-serif', color: '#333' },
  title: { textAlign: 'center', marginBottom: '40px', fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px' },
  content: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', lineHeight: '1.8' },
  th: { borderBottom: '1px solid #eee', padding: '20px', textAlign: 'left', fontWeight: 'bold', width: '25%', color: '#555', verticalAlign: 'top', backgroundColor: '#fafafa' },
  td: { borderBottom: '1px solid #eee', padding: '20px', color: '#333' },
  note: { fontSize: '12px', color: '#888', marginTop: '5px', display: 'block' },
  backLink: { color: '#8d6e63', textDecoration: 'underline', fontSize: '14px' }
};

export default Legal;