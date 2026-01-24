import React from 'react';
import Footer from './Footer';
import { theme } from '../theme';

const Privacy: React.FC = () => {
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

          <section style={styles.section}>
            <h3 style={styles.heading}>第2条（個人情報の収集方法）</h3>
            <p>運営者は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、運営者の提携先（情報提供元、広告主、広告配信先などを含みます。以下、｢提携先｣といいます。）などから収集することがあります。</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第3条（個人情報を収集・利用する目的）</h3>
            <p>運営者が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol style={styles.list}>
              <li>運営者サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び運営者が提供する他のサービスの案内のメールを送付するため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
              <li>上記の利用目的に付随する目的</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第4条（利用目的の変更）</h3>
            <ol style={styles.list}>
              <li>運営者は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
              <li>利用目的の変更を行った場合には、変更後の目的について、運営者所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第5条（個人情報の第三者提供）</h3>
            <ol style={styles.list}>
              <li>運営者は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                <ol style={{...styles.list, listStyleType: 'lower-alpha', marginTop: '10px'}}>
                  <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                </ol>
              </li>
              <li>前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
                <ol style={{...styles.list, listStyleType: 'lower-alpha', marginTop: '10px'}}>
                  <li>運営者が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                  <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                </ol>
              </li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第6条（個人情報の開示・訂正および利用停止等）</h3>
            <p>ユーザーは、運営者の保有する自己の個人情報が誤った情報である場合には、運営者が定める手続きにより、運営者に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。運営者は、ユーザーから当該請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</p>
          </section>

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

// ★ ここに型を追加！
const styles: Record<string, React.CSSProperties> = {
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