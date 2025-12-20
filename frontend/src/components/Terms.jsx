import React from 'react';
import Footer from './Footer';
import { theme } from '../theme';

const Terms = () => {
  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <a href="/" style={styles.navTitle}>SmartBrief</a>
      </nav>

      <main style={styles.paperContainer}>
        <header style={styles.header}>
            <span style={styles.headerIcon}>📜</span>
            <h1 style={styles.title}>利用規約</h1>
        </header>

        <div style={styles.content}>
          <p>この利用規約（以下「本規約」といいます。）は、SmartBrief運営事務局（以下「運営者」といいます。）が提供するサービス「SmartBrief」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。</p>

          <section style={styles.section}>
            <h3 style={styles.heading}>第1条（適用）</h3>
            <ol style={styles.list}>
              <li>本規約は、ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
              <li>運営者は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第2条（利用登録）</h3>
            <p>本サービスにおいては、登録希望者が本規約に同意の上、運営者の定める方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第3条（ユーザーIDおよびパスワードの管理）</h3>
            <ol style={styles.list}>
              <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
              <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第4条（利用料金および支払方法）</h3>
            <ol style={styles.list}>
              <li>ユーザーは、本サービスの有料部分の対価として、運営者が別途定め、本ウェブサイトに表示する利用料金を、運営者が指定する方法（Stripe決済等）により支払うものとします。</li>
              <li>ユーザーが利用料金の支払を遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第5条（禁止事項）</h3>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ol style={styles.list}>
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為（要約コンテンツの無断転載・再配布を含む）</li>
              <li>運営者、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>運営者のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第6条（本サービスの提供の停止等）</h3>
            <p>運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
            <ol style={styles.list}>
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第7条（免責事項）</h3>
            <ol style={styles.list}>
              <li>運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
              <li>本サービスで提供される要約等のコンテンツはAIによって生成されたものであり、その内容の正確性について運営者は責任を負いません。</li>
              <li>運営者は、本サービスに起因してユーザーに生じたあらゆる損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第8条（サービス内容の変更等）</h3>
            <p>運営者は、ユーザーへの事前の通知なく、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第9条（利用規約の変更）</h3>
            <p>運営者は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。</p>
            <ol style={styles.list}>
              <li>本規約の変更がユーザーの一般の利益に適合するとき。</li>
              <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h3 style={styles.heading}>第10条（準拠法・裁判管轄）</h3>
            <ol style={styles.list}>
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。</li>
            </ol>
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
  list: { paddingLeft: '20px', lineHeight: '1.8' },
  backLink: { color: theme.colors.textSub, textDecoration: 'underline', fontSize: '14px' }
};

export default Terms;