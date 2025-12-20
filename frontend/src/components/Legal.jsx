import React from 'react';
import Footer from './Footer';
import { theme } from '../theme';

const Legal = () => {
  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <a href="/" style={styles.navTitle}>SmartBrief</a>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>⚖️</span>
            <h1 style={styles.title}>特定商取引法に基づく表記</h1>
        </header>

        <div style={styles.content}>
          <table style={styles.table}>
            <tbody>
              <Row title="販売事業者名" content="SmartBrief 運営事務局" />
              <Row title="代表責任者" content="伊深 康一" />
              <Row title="所在地" content="〒143-0024 東京都大田区中央5-12-1 IRIS西馬込 101" />
              <Row 
                title="電話番号" 
                content={
                  <>
                    080-4360-6004<br/>
                    <span style={styles.note}>※サービスに関するお問い合わせは、記録保持の観点からメールにてお願いいたします。</span>
                  </>
                } 
              />
              <Row title="メールアドレス" content="info@smartbrief.jp" />
              <Row 
                title="販売価格" 
                content={<strong>プレミアムプラン：月額 1,000円 (税込)</strong>} 
              />
              <Row title="商品代金以外の必要料金" content="サイト閲覧、コンテンツダウンロード等に必要となるインターネット接続料金、通信料金。" />
              <Row title="お支払方法" content="クレジットカード決済 (Visa, Mastercard, American Express, JCB, Diners Club, Discover)" />
              <Row title="お支払時期" content="初回お申込み時に即時決済され、以降は毎月同日に自動更新されます。" />
              <Row title="商品の引渡時期" content="クレジットカード決済完了後、即時に有料コンテンツ（全文閲覧機能等）をご利用いただけます。" />
              <Row 
                title="解約・返品について" 
                content={
                  <>
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
                  </>
                } 
              />
              <Row 
                title="動作環境" 
                content={
                  <>
                    推奨ブラウザ：Google Chrome, Safari, Microsoft Edge の最新版<br/>
                    ※JavaScript、Cookieが有効な状態でご利用ください。
                  </>
                } 
              />
            </tbody>
          </table>
        </div>

        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <a href="/" style={styles.backLink}>トップページへ戻る</a>
        </div>
      </main>
      <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
    </div>
  );
};

// 行コンポーネント
const Row = ({ title, content }) => (
  <tr>
    <th style={styles.th}>{title}</th>
    <td style={styles.td}>{content}</td>
  </tr>
);

const styles = {
  wrapper: {
    minHeight: '100vh', backgroundColor: theme.colors.background,
    color: theme.colors.textMain, fontFamily: theme.fonts.body,
    paddingBottom: '20px'
  },
  navBar: {
    padding: '15px 20px', backgroundColor: 'rgba(252, 249, 242, 0.95)',
    borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'center'
  },
  navTitle: { fontSize: '18px', fontWeight: 'bold', fontFamily: theme.fonts.heading, color: theme.colors.textMain, textDecoration: 'none' },

  paperContainer: {
    maxWidth: '800px', margin: '40px auto', backgroundColor: '#fff',
    borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    borderTop: `6px solid ${theme.colors.primary}`, padding: '40px 30px'
  },
  header: { textAlign: 'center', marginBottom: '40px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '10px' },
  title: { fontSize: '24px', fontFamily: theme.fonts.heading, color: theme.colors.primary },

  content: { fontSize: '14px', lineHeight: '1.8' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { 
    borderBottom: `1px solid ${theme.colors.border}`, padding: '20px', textAlign: 'left', 
    fontWeight: 'bold', width: '25%', color: theme.colors.primary, verticalAlign: 'top', 
    backgroundColor: '#fafafa', fontFamily: theme.fonts.heading 
  },
  td: { borderBottom: `1px solid ${theme.colors.border}`, padding: '20px', color: '#333' },
  note: { fontSize: '12px', color: '#888', marginTop: '5px', display: 'block' },
  backLink: { color: theme.colors.textSub, textDecoration: 'underline', fontSize: '14px' }
};

export default Legal;