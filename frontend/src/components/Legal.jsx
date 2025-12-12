import React from 'react';

const Legal = () => {
  return (
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
              <td style={styles.td}>080-4360-6004<br/><span style={styles.note}>※お電話でのサポートは受け付けておりません。お問い合わせはメールにてお願いいたします。</span></td>
            </tr>
            <tr>
              <th style={styles.th}>メールアドレス</th>
              <td style={styles.td}>info@smartbrief.jp</td>
            </tr>
            <tr>
              <th style={styles.th}>販売価格</th>
              <td style={styles.td}>月額 1,000円 (税込)</td>
            </tr>
            <tr>
              <th style={styles.th}>商品代金以外の必要料金</th>
              <td style={styles.td}>インターネット接続料金、通信料金等はお客様のご負担となります。</td>
            </tr>
            <tr>
              <th style={styles.th}>お支払方法</th>
              <td style={styles.td}>クレジットカード決済 (Stripe)</td>
            </tr>
            <tr>
              <th style={styles.th}>お支払時期</th>
              <td style={styles.td}>初回お申込み時、および翌月以降毎月請求されます。</td>
            </tr>
            <tr>
              <th style={styles.th}>商品の引渡時期</th>
              <td style={styles.td}>クレジットカード決済完了後、即時に有料コンテンツをご利用いただけます。</td>
            </tr>
            <tr>
              <th style={styles.th}>返品・キャンセルについて</th>
              <td style={styles.td}>
                デジタルコンテンツの性質上、決済後の返品・返金には応じられません。<br/>
                解約はマイページ（契約の管理）よりいつでも可能です。解約手続き完了後、次回の請求は発生しませんが、日割り計算による返金は行われません。
              </td>
            </tr>
            <tr>
              <th style={styles.th}>動作環境</th>
              <td style={styles.td}>
                インターネットに接続されたPC、スマートフォン、タブレット等のブラウザ（Google Chrome, Safari等）でご利用いただけます。
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{textAlign: 'center', marginTop: '40px'}}>
        <a href="/" style={styles.link}>トップページへ戻る</a>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '"Noto Sans JP", sans-serif', color: '#333' },
  title: { borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px', fontSize: '24px' },
  content: { lineHeight: '1.8', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { border: '1px solid #ddd', padding: '15px', background: '#f9f9f9', width: '30%', textAlign: 'left', fontWeight: 'bold' },
  td: { border: '1px solid #ddd', padding: '15px' },
  note: { fontSize: '12px', color: '#666' },
  link: { color: '#007bff', textDecoration: 'none' }
};

export default Legal;