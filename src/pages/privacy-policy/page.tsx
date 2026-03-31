import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";

const lastUpdated = "29 March 2026";

const sections = [
  {
    id: "who-we-are",
    title: "1. Who We Are",
    content: `Dleading Creative Designs ("we", "us", "our") is a digital agency based in Holbeck, Leeds, West Yorkshire, United Kingdom. We provide web design, web development, SEO, graphic design, social media marketing, and related digital services.

For the purposes of UK data protection law (UK GDPR and the Data Protection Act 2018), we are the data controller of any personal data you provide to us.

Contact details:
• Business name: Dleading Creative Designs
• Address: Holbeck, Leeds, West Yorkshire, United Kingdom
• Email: info@creativedleading.co.uk
• WhatsApp: +44 742 725 9935`,
  },
  {
    id: "data-we-collect",
    title: "2. Personal Data We Collect",
    content: `We may collect and process the following categories of personal data:

Identity & Contact Data
• Full name, email address, phone number
• Company or business name
• Details you provide when using our contact or enquiry forms

Technical Data
• IP address, browser type and version, operating system
• Pages visited, time spent on pages, referral source
• Cookie identifiers (see our Cookie Policy for details)

Communications Data
• Messages, enquiries, or feedback you send us
• Records of correspondence (email, WhatsApp, phone)

Marketing Preferences
• Your preferences for receiving marketing communications from us

We do not collect any Special Category Data (such as health, racial, or financial data) and we do not knowingly collect data from children under 16.`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Data",
    content: `We use your personal data for the following purposes:

• To respond to enquiries and provide quotes for our services
• To deliver the services you have contracted us to provide
• To send you relevant marketing communications (with your consent)
• To improve our website and user experience through analytics
• To comply with our legal obligations
• To prevent fraud and ensure website security

We will never sell your personal data to third parties.`,
  },
  {
    id: "legal-basis",
    title: "4. Legal Basis for Processing (UK GDPR)",
    content: `Under UK GDPR, we rely on the following lawful bases:

• Contract (Article 6(1)(b)): Processing necessary to fulfil a contract with you or to take steps before entering a contract.
• Legitimate Interests (Article 6(1)(f)): Processing for our legitimate business interests such as improving our services, fraud prevention, and direct marketing to existing customers — provided your interests don't override ours.
• Consent (Article 6(1)(a)): Where you have given clear, freely-given consent — for example, signing up to marketing emails or accepting non-essential cookies.
• Legal Obligation (Article 6(1)(c)): Processing required to comply with applicable laws.

You can withdraw consent at any time by contacting us or using the unsubscribe link in any email we send.`,
  },
  {
    id: "data-sharing",
    title: "5. Who We Share Your Data With",
    content: `We may share your personal data with trusted third parties strictly where necessary:

• IT & Hosting Providers: Servers and cloud infrastructure we use to run our website
• Email Marketing Platforms: If you opt in to marketing communications
• Analytics Providers: Such as Google Analytics (data is anonymised where possible)
• Payment Processors: Where you make a payment for our services
• Professional Advisers: Solicitors, accountants, or auditors where required by law

All third-party processors are bound by data processing agreements and are required to keep your data confidential and secure. We do not transfer your data outside of the UK/EEA unless adequate safeguards are in place.`,
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    content: `We retain personal data only for as long as necessary:

• Enquiries & contact forms: Up to 2 years from the date of last contact
• Client records (active contracts): Duration of the contract plus 6 years (UK limitation period)
• Marketing preferences: Until you withdraw consent or 3 years of inactivity
• Website analytics: Aggregated data held for up to 26 months

After the relevant retention period, data is securely deleted or anonymised.`,
  },
  {
    id: "your-rights",
    title: "7. Your Rights Under UK GDPR",
    content: `You have the following rights regarding your personal data:

• Right of Access: Request a copy of the personal data we hold about you.
• Right to Rectification: Ask us to correct inaccurate or incomplete data.
• Right to Erasure ("Right to be Forgotten"): Request deletion of your data where there is no compelling reason to continue processing it.
• Right to Restrict Processing: Ask us to pause processing your data in certain circumstances.
• Right to Data Portability: Receive your data in a structured, commonly used format.
• Right to Object: Object to processing based on legitimate interests, including direct marketing.
• Rights related to Automated Decision-Making: We do not use automated decision-making or profiling.

To exercise any of these rights, please contact us at info@creativedleading.co.uk. We will respond within 30 days. We may need to verify your identity before fulfilling the request.`,
  },
  {
    id: "cookies",
    title: "8. Cookies",
    content: `We use cookies and similar tracking technologies on our website. For full details of the cookies we use, their purpose, and how to manage your preferences, please read our Cookie Policy.`,
  },
  {
    id: "security",
    title: "9. Data Security",
    content: `We take appropriate technical and organisational measures to protect your personal data against accidental loss, unauthorised access, alteration, or disclosure. These include:

• Encrypted connections (HTTPS/SSL) on all pages
• Access controls limiting who within our team can access data
• Regular review of our data practices and vendor agreements

While we take every reasonable precaution, no internet transmission is 100% secure. If you have reason to believe your data has been compromised, please contact us immediately.`,
  },
  {
    id: "third-party-links",
    title: "10. Third-Party Links",
    content: `Our website may contain links to third-party websites (e.g. our social media profiles, partner sites). We are not responsible for the privacy practices of those websites and recommend you review their privacy policies independently.`,
  },
  {
    id: "ico",
    title: "11. Right to Complain",
    content: `If you believe we have not handled your personal data in compliance with UK data protection law, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):

• Website: ico.org.uk
• Phone: 0303 123 1113
• Address: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF

We would, however, appreciate the opportunity to address your concerns before you contact the ICO. Please reach out to us first at info@creativedleading.co.uk.`,
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. The "Last Updated" date at the top of this page will reflect the most recent revision. We encourage you to review this policy periodically.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#111] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,157,1,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 bg-[#F69D01]/15 text-[#F69D01] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <i className="ri-shield-user-line"></i> Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
          <p className="text-gray-300 text-sm mt-3 max-w-2xl leading-relaxed">
            This policy explains how Dleading Creative Designs collects, uses, and protects your personal data in accordance with UK GDPR and the Data Protection Act 2018.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 md:py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Sidebar TOC — desktop only */}
            <aside className="hidden lg:block lg:w-56 shrink-0">
              <div className="lg:sticky lg:top-24">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contents</p>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-xs text-gray-500 hover:text-[#F65901] transition-colors py-1 leading-snug cursor-pointer"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
                <div className="mt-6 p-4 bg-[#fdf8f4] rounded-xl border border-orange-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Questions?</p>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">Contact us directly about your data rights.</p>
                  <a
                    href="mailto:info@creativedleading.co.uk"
                    className="block text-center text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Email Us
                  </a>
                </div>
              </div>
            </aside>

            {/* Sections */}
            <article className="flex-1 min-w-0">
              <div className="space-y-10">
                {sections.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{s.title}</h2>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</div>
                    {s.id === "cookies" && (
                      <Link
                        to="/cookie-policy"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#F65901] hover:underline cursor-pointer"
                      >
                        <i className="ri-external-link-line text-sm"></i>
                        Read our Cookie Policy
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom contact strip */}
              <div className="mt-12 bg-[#fdf8f4] rounded-2xl p-6 border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F69D01]/15 text-[#F69D01] shrink-0">
                  <i className="ri-mail-send-line text-base"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Data rights requests</p>
                  <p className="text-gray-500 text-xs mt-0.5">To exercise any of your rights under UK GDPR, email us and we&apos;ll respond within 30 days.</p>
                </div>
                <a
                  href="mailto:info@creativedleading.co.uk"
                  className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  info@creativedleading.co.uk
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
