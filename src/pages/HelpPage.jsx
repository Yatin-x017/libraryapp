import { useState } from 'react'
import { useLang } from '../context/LanguageContext'

const content = {
  en: {
    title: 'Help & Guide',
    subtitle: 'Everything you need to manage Balaji Library',
    sections: [
      {
        icon: '📊',
        heading: 'Dashboard',
        items: [
          { q: 'What does the Dashboard show?', a: 'A live overview — total active members, how many are present today, how many have paid fees this month, and how many are overdue. Use Quick Actions to jump to common tasks.' },
          { q: 'Why are my numbers 0?', a: 'If you just set up the system, no data has been entered yet. Add members first, then mark attendance and record fees.' },
        ]
      },
      {
        icon: '📅',
        heading: 'Attendance',
        items: [
          { q: 'How do I mark a member present?', a: 'Go to Mark Attendance → find the member → click "Mark Present". The row turns green instantly and the count updates.' },
          { q: 'What does Reset All do?', a: 'It removes all of today\'s attendance marks. Use it only if you made a mistake — this cannot be undone.' },
          { q: 'Does attendance reset on its own?', a: 'Yes. Every day at midnight the system starts fresh. Yesterday\'s records are saved in Monthly Logs.' },
          { q: 'How do I see past attendance?', a: 'Switch to the Monthly Logs tab. Pick any date from the left panel to see who was present that day and the overall summary since 1 June.' },
        ]
      },
      {
        icon: '👥',
        heading: 'Members',
        items: [
          { q: 'How do I add a new member?', a: 'Members → "+ Add Member" → fill in Member ID, full name, phone, monthly fee and due day → Save. The member is active immediately.' },
          { q: 'How do I deactivate a member without deleting them?', a: 'Members → Edit the member → change Status to "Inactive" → Save. They won\'t appear in attendance or overdue lists.' },
          { q: 'Can I delete a member?', a: 'Yes, but it also deletes all their attendance and fee records permanently. Use deactivation unless you\'re sure.' },
          { q: 'What is Member ID?', a: 'A short code you assign, like LIB-001 or B-42. It helps you find members quickly and must be unique.' },
        ]
      },
      {
        icon: '💳',
        heading: 'Fee Payments',
        items: [
          { q: 'How do I record a fee payment?', a: 'Fee Payments → "+ Record Payment" → select the member, month, year, and amount → Save. The payment is logged with a timestamp and your name.' },
          { q: 'Can I record payment for a past month?', a: 'Yes. Change the month and year in the payment form to any previous period.' },
          { q: 'What if a member pays twice for the same month?', a: 'The system will warn you that the member already paid for that month. You can still save if needed (e.g. partial + balance).' },
        ]
      },
      {
        icon: '⚠️',
        heading: 'Overdue Fees',
        items: [
          { q: 'Who appears in Overdue Fees?', a: 'Any active member who has not had a fee payment recorded for the selected month and year.' },
          { q: 'How do I collect from here?', a: 'Click "Collect Fee" next to the member\'s name. It opens the payment form pre-filled with their details.' },
          { q: 'What is the Copy Alert List button?', a: 'It copies a formatted SMS/WhatsApp-ready list of all overdue members to your clipboard so you can paste and send in bulk.' },
        ]
      },
      {
        icon: '🛡️',
        heading: 'Staff',
        items: [
          { q: 'Who can access the Staff page?', a: 'Only admins. Staff members see all other pages but cannot add or view other staff accounts.' },
          { q: 'How do I add a new staff login?', a: 'Staff → "+ Add Staff" → enter their name, email, password, and role. They can sign in immediately.' },
          { q: 'What is the difference between admin and staff?', a: 'Admins can manage staff accounts. Staff can do everything else — attendance, members, fees, and overdue.' },
        ]
      },
      {
        icon: '🌐',
        heading: 'Language',
        items: [
          { q: 'How do I switch to Hindi?', a: 'Click the English / हिंदी toggle at the bottom of the left sidebar. The entire interface switches instantly.' },
          { q: 'Does the language setting save?', a: 'It resets to English when you refresh. A future update will remember your preference.' },
        ]
      },
      {
        icon: '🔒',
        heading: 'Account & Security',
        items: [
          { q: 'How do I sign out?', a: 'Click "Sign Out" at the bottom of the left sidebar.' },
          { q: 'I forgot my password. What do I do?', a: 'Ask your admin to reset your password directly in Supabase Authentication, or use the "Forgot password" email flow if enabled.' },
          { q: 'Is the data safe?', a: 'Yes. All data is stored in Supabase with row-level security. Only authenticated staff can read or write records.' },
        ]
      },
    ]
  },
  hi: {
    title: 'सहायता और मार्गदर्शिका',
    subtitle: 'बालाजी लाइब्रेरी प्रबंधन की पूरी जानकारी',
    sections: [
      {
        icon: '📊',
        heading: 'डैशबोर्ड',
        items: [
          { q: 'डैशबोर्ड क्या दिखाता है?', a: 'कुल सक्रिय सदस्य, आज कितने उपस्थित हैं, इस महीने कितने ने शुल्क दिया, और कितने बकाया हैं — यह सब एक नज़र में।' },
          { q: 'मेरे नंबर 0 क्यों हैं?', a: 'यदि सिस्टम अभी सेटअप हुआ है तो पहले सदस्य जोड़ें, फिर उपस्थिति दर्ज करें और शुल्क रिकॉर्ड करें।' },
        ]
      },
      {
        icon: '📅',
        heading: 'उपस्थिति',
        items: [
          { q: 'सदस्य को उपस्थित कैसे करें?', a: 'उपस्थिति दर्ज करें → सदस्य खोजें → "उपस्थित करें" पर क्लिक करें। पंक्ति तुरंत हरी हो जाएगी।' },
          { q: 'सभी रीसेट करें क्या करता है?', a: 'आज की सभी उपस्थिति हट जाती है। यह पूर्ववत नहीं हो सकता।' },
          { q: 'क्या उपस्थिति अपने आप रीसेट होती है?', a: 'हाँ। हर रात आधी रात को सिस्टम नया शुरू होता है। पिछले दिन के रिकॉर्ड मासिक लॉग में सुरक्षित रहते हैं।' },
          { q: 'पुरानी उपस्थिति कैसे देखें?', a: 'मासिक लॉग टैब में जाएं। बाईं ओर से कोई भी तिथि चुनें और देखें कि उस दिन कौन उपस्थित था।' },
        ]
      },
      {
        icon: '👥',
        heading: 'सदस्य',
        items: [
          { q: 'नया सदस्य कैसे जोड़ें?', a: 'सदस्य → "+ सदस्य जोड़ें" → सदस्य ID, नाम, फ़ोन, मासिक शुल्क और देय दिन भरें → सहेजें।' },
          { q: 'सदस्य को हटाए बिना निष्क्रिय कैसे करें?', a: 'सदस्य → संपादित करें → स्थिति "निष्क्रिय" करें → सहेजें। वे उपस्थिति और बकाया सूची में नहीं दिखेंगे।' },
          { q: 'सदस्य ID क्या है?', a: 'आपका दिया हुआ छोटा कोड जैसे LIB-001 या B-42। यह अद्वितीय होना चाहिए।' },
        ]
      },
      {
        icon: '💳',
        heading: 'शुल्क भुगतान',
        items: [
          { q: 'शुल्क भुगतान कैसे दर्ज करें?', a: 'शुल्क भुगतान → "+ भुगतान दर्ज करें" → सदस्य, महीना, वर्ष और राशि चुनें → सहेजें।' },
          { q: 'क्या पिछले महीने का भुगतान दर्ज हो सकता है?', a: 'हाँ। फॉर्म में महीना और वर्ष बदल दें।' },
        ]
      },
      {
        icon: '⚠️',
        heading: 'बकाया शुल्क',
        items: [
          { q: 'बकाया सूची में कौन आता है?', a: 'वे सक्रिय सदस्य जिन्होंने चुने हुए महीने का शुल्क नहीं दिया।' },
          { q: 'सूची कॉपी बटन क्या करता है?', a: 'सभी बकाया सदस्यों की सूची क्लिपबोर्ड पर कॉपी होती है जिसे WhatsApp पर भेज सकते हैं।' },
        ]
      },
      {
        icon: '🛡️',
        heading: 'स्टाफ',
        items: [
          { q: 'स्टाफ पेज कौन देख सकता है?', a: 'केवल व्यवस्थापक (Admin)।' },
          { q: 'नया स्टाफ कैसे जोड़ें?', a: 'स्टाफ → "+ स्टाफ जोड़ें" → नाम, ईमेल, पासवर्ड और भूमिका भरें। वे तुरंत लॉगिन कर सकते हैं।' },
        ]
      },
      {
        icon: '🌐',
        heading: 'भाषा',
        items: [
          { q: 'हिंदी में कैसे बदलें?', a: 'बाईं साइडबार के नीचे English / हिंदी टॉगल पर क्लिक करें। पूरा इंटरफ़ेस तुरंत बदल जाएगा।' },
        ]
      },
      {
        icon: '🔒',
        heading: 'खाता और सुरक्षा',
        items: [
          { q: 'साइन आउट कैसे करें?', a: 'बाईं साइडबार के नीचे "साइन आउट" पर क्लिक करें।' },
          { q: 'पासवर्ड भूल गए?', a: 'अपने व्यवस्थापक से Supabase में पासवर्ड रीसेट करवाएं।' },
          { q: 'क्या डेटा सुरक्षित है?', a: 'हाँ। सभी डेटा Supabase में row-level security के साथ सुरक्षित है। केवल प्रमाणित स्टाफ ही पढ़/लिख सकता है।' },
        ]
      },
    ]
  }
}

export default function HelpPage() {
  const { lang } = useLang()
  const c = content[lang] || content.en
  const [open, setOpen] = useState({})

  function toggle(sid, qid) {
    const key = `${sid}-${qid}`
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <div className="page-header">
        <h2>❓ {c.title}</h2>
        <p>{c.subtitle}</p>
      </div>

      {/* Quick contact banner */}
      <div className="card" style={{ marginBottom: 24, background: 'var(--accent-light)', borderColor: '#c8ddb0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 32 }}>📚</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>Balaji Library — Staff Portal</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {lang === 'hi'
              ? 'किसी समस्या के लिए अपने व्यवस्थापक से संपर्क करें।'
              : 'For any issues, contact your system administrator.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>📱 {lang === 'hi' ? 'व्हाट्सएप पर संपर्क करें' : 'WhatsApp your admin'}</span>
        </div>
      </div>

      {/* FAQ sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {c.sections.map((section, sid) => (
          <div key={sid} className="card" style={{ padding: 0 }}>
            {/* Section header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{section.heading}</span>
            </div>

            {/* Questions */}
            <div>
              {section.items.map((item, qid) => {
                const key = `${sid}-${qid}`
                const isOpen = !!open[key]
                return (
                  <div
                    key={qid}
                    style={{ borderBottom: qid < section.items.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <button
                      onClick={() => toggle(sid, qid)}
                      style={{
                        width: '100%', padding: '13px 20px',
                        background: isOpen ? 'var(--surface2)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        textAlign: 'left', gap: 12, transition: 'background 0.12s',
                      }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{item.q}</span>
                      <span style={{
                        fontSize: 18, color: 'var(--text-muted)', flexShrink: 0,
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'transform 0.2s', lineHeight: 1,
                      }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 20px 14px 20px',
                        fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65,
                        background: 'var(--surface2)',
                        borderTop: '1px solid var(--border)',
                      }}>
                        <div style={{ paddingTop: 12 }}>{item.a}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {lang === 'hi'
            ? 'यह सॉफ्टवेयर विशेष रूप से बालाजी लाइब्रेरी के लिए बनाया गया है। सभी डेटा Supabase क्लाउड में सुरक्षित है और केवल अधिकृत स्टाफ ही एक्सेस कर सकता है।'
            : 'This software is built specifically for Balaji Library. All data is securely stored in the Supabase cloud and accessible only to authorised staff members.'}
        </p>
      </div>
    </div>
  )
}
