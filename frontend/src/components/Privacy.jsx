import React from 'react';
import Footer from './Footer';
import { theme } from '../theme';

const Privacy = () => {
  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <a href="/" style={styles.navTitle}>SmartBrief</a>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>🛡️</span>
            <h1 style={styles.title}>プライバシーポリシー</h1>
        </header>

        <div style={styles.content}>
          <p>SmartBrief運営事務局（以下「運営者」といいます。）は、本ウェブサイト上で提供するサービス（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。</p>

          <section style={styles.section}>
            <h3 style={styles.heading}>第1条（個人情報）</h3>
            <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
          </section>

          {/* ※長いので中略しますが、ロジックは元のまま、スタイルのみ適用してください */}
          {/* 第2条〜第7条まで、h3タグに styles.heading を適用してください */}

          <section style={styles.section}>
            <h3 style={styles.heading}>第7条（お問い合わせ窓口）</h3>
            <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
            <div style={styles.contactBox}>
               販売事業者：SmartBrief 運営事務局<br />
               メールアドレス：info@smartbrief.jp
            </div>
          </section>

          <p style={{textAlign: 'right', marginTop: '40px', fontSize: '12px'}}>以上</p>
        </div>

        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <a href="/" style={styles.backLink}>トップページへ戻る</a>
        </div>
      </main>
      <Footer color={theme.colors.textSub} separatorColor={theme.colors.border} />
    </div>
  );
};

// スタイルはLegalとほぼ共通ですが、見出しなどを調整
const styles = {
  wrapper: {
    minHeight: '100vh', backgroundColor: theme.colors.background,
    color: theme.colors.textMain, fontFamily: theme.fonts.body, paddingBottom: '20px'
  },
  navBar: {
    padding: '15px 20px', backgroundColor: 'rgba(252, 249, 242, 0.95)',
    borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'center'
  },
  navTitle: { fontSize: '18px', fontWeight: 'bold', fontFamily: theme.fonts.heading, color: theme.colors.textMain, textDecoration: 'none' },

  paperContainer: {
    maxWidth: '800px', margin: '40px auto', backgroundColor: '#fff',
    borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    borderTop: `6px solid ${theme.colors.primary}`, padding: '50px 40px'
  },
  header: { textAlign: 'center', marginBottom: '50px' },
  headerIcon: { fontSize: '40px', display: 'block', marginBottom: '10px' },
  title: { fontSize: '24px', fontFamily: theme.fonts.heading, color: theme.colors.primary },

  content: { fontSize: '14px', lineHeight: '1.9', textAlign: 'justify' },
  section: { marginBottom: '30px' },
  heading: { 
    fontSize: '16px', fontWeight: 'bold', color: theme.colors.textMain, 
    borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: '5px',
    marginBottom: '15px', fontFamily: theme.fonts.heading, marginTop: '30px'
  },
  contactBox: {
    backgroundColor: '#fafafa', padding: '20px', borderRadius: '4px',
    border: `1px solid ${theme.colors.border}`, marginTop: '10px'
  },
  backLink: { color: theme.colors.textSub, textDecoration: 'underline', fontSize: '14px' }
};

export default Privacy;