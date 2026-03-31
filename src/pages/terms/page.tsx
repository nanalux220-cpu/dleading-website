import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";

const lastUpdated = "29 March 2026";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction & Definitions",
    content: `These Terms and Conditions ("Terms") govern the agreement between Dleading Creative Designs ("we", "us", "our", "the Agency") and any individual or business ("you", "the Client") who engages our services.

By signing a proposal, paying a deposit, or otherwise instructing us to begin work, you confirm that you have read, understood, and agree to be bound by these Terms.

Definitions:
• "Project" means the specific work agreed between the Agency and the Client as set out in a written proposal or statement of work.
• "Deliverables" means any design files, code, copy, or other outputs produced by the Agency for the Client.
• "Intellectual Property" or "IP" means patents, trademarks, copyrights, design rights, trade secrets, and any other form of intellectual property.
• "Confidential Information" means any non-public information shared between the parties in connection with the Project.`,
  },
  {
    id: "services",
    title: "2. Our Services",
    content: `Dleading Creative Designs provides the following services, among others:

• Custom website design and development
• E-commerce website development
• Search engine optimisation (SEO)
• Pay-per-click (PPC) advertising management
• Social media marketing and management
• Logo design and branding
• Graphic design services
• Website maintenance and management
• Video animation

The exact scope of work for each project will be agreed in writing before work begins. We reserve the right to decline any project or client at our discretion.`,
  },
  {
    id: "quotations",
    title: "3. Quotations & Project Scope",
    content: `All quotations provided by the Agency are valid for 30 days from the date of issue unless otherwise stated.

A quotation is based on the information provided by the Client at the time of enquiry. If the project scope changes after acceptance, revised pricing will be agreed in writing before additional work commences.

Scope Creep: Any requests for work that fall outside the agreed project scope ("scope creep") will be quoted and billed separately. We will notify the Client before undertaking any out-of-scope work.

We aim to deliver all projects within the estimated timeframes, but timelines depend on the prompt provision of content, feedback, and approvals from the Client. Delays caused by the Client may result in revised delivery dates.`,
  },
  {
    id: "payment",
    title: "4. Payment Terms",
    content: `Deposit: A non-refundable deposit of 50% of the total project value is required before work commences, unless otherwise agreed in writing.

Final Payment: The remaining balance is due upon project completion and before the final deliverables are handed over or the website is made live.

Ongoing Services: For retainer, SEO, PPC, or social media management services, invoices are issued monthly in advance. Payment is due within 14 days of the invoice date.

Late Payment: We reserve the right to charge interest on overdue invoices at a rate of 8% per annum above the Bank of England base rate, in accordance with the Late Payment of Commercial Debts (Interest) Act 1998.

Suspension of Work: We reserve the right to suspend all work on a project if payment is not received within 14 days of the due date. Work will resume upon receipt of the outstanding amount.

All prices are quoted in pounds sterling (GBP) and are exclusive of VAT unless stated otherwise. Where applicable, VAT will be added at the prevailing rate.`,
  },
  {
    id: "client-responsibilities",
    title: "5. Client Responsibilities",
    content: `To enable us to deliver your project on time and to the agreed standard, the Client is responsible for:

• Providing all required content (text, images, logos, brand assets) in a timely manner and in the formats requested.
• Reviewing and approving drafts, proofs, or staging versions within agreed timescales (typically 5 working days unless otherwise stated).
• Ensuring that all content and materials provided to us do not infringe any third-party intellectual property rights, are not defamatory, and comply with all applicable laws.
• Ensuring a designated point of contact is available to respond to queries during the project.
• Providing accurate and complete information. We are not responsible for errors arising from incorrect or incomplete information supplied by the Client.

If the Client fails to provide required materials or feedback within agreed timescales, we reserve the right to pause the project and/or revise the delivery date. Extended delays may result in the project being rescheduled and a re-activation fee may apply.`,
  },
  {
    id: "revisions",
    title: "6. Revisions & Amends",
    content: `Unless otherwise agreed in the project proposal, the following revision rounds are included:

• Web Design: Up to 2 rounds of revisions per page design.
• Logo Design: Up to 3 rounds of revisions within the agreed concept direction.
• Graphic Design: Up to 2 rounds of revisions per deliverable.

A "revision" means minor amends to an approved direction — not a complete redesign or change of concept. Significant changes to the agreed brief, style, or concept after approval will be treated as new work and quoted accordingly.

Additional revision rounds beyond those included can be purchased at our standard hourly rate.`,
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: `Our Work (Prior to Full Payment): All IP in Deliverables remains the property of Dleading Creative Designs until the Client has made payment in full.

Upon Full Payment: The Client will own the final agreed Deliverables (e.g. the completed website design, final logo files). This licence is exclusive and transferable.

What We Retain: We retain ownership of all underlying tools, frameworks, code libraries, templates, processes, know-how, and methodologies used in producing the Deliverables. We do not transfer ownership of any third-party software, plugins, or licences.

Portfolio Rights: Unless the Client requests otherwise in writing, we reserve the right to display the completed work in our portfolio, case studies, website, and marketing materials.

Third-Party Assets: If the project requires stock photography, fonts, icons, or plugins, these may be subject to separate third-party licences. We will advise the Client accordingly, and the cost of any third-party licences may be passed on to the Client.`,
  },
  {
    id: "confidentiality",
    title: "8. Confidentiality",
    content: `Both parties agree to keep confidential any sensitive business information, trade secrets, or proprietary data shared during the course of the project.

This obligation does not apply to information that:
• Is or becomes publicly available other than through a breach of this clause
• Was already known to the receiving party before disclosure
• Is required to be disclosed by law or a regulatory authority

This confidentiality obligation survives the termination of the agreement.`,
  },
  {
    id: "cancellation",
    title: "9. Cancellation & Termination",
    content: `By the Client: If the Client cancels a project after work has commenced, any deposit paid is non-refundable. If the amount of work completed exceeds the deposit value at our standard rates, the Client will be invoiced for the difference.

By the Agency: We reserve the right to terminate an agreement with immediate effect if:
• The Client is in material breach of these Terms and fails to remedy the breach within 14 days of written notice
• The Client acts in a manner that is abusive, threatening, or unreasonable towards our team
• Payment is more than 30 days overdue

Termination of any project or retainer does not affect accrued rights or obligations of either party.

Ongoing Retainer Cancellation: Retainer agreements (SEO, PPC, social media management) require 30 days' written notice to cancel. Cancellation part-way through a billing month does not entitle the Client to a pro-rata refund.`,
  },
  {
    id: "warranties",
    title: "10. Warranties & Guarantees",
    content: `We warrant that:
• Our services will be provided with reasonable skill and care in accordance with professional standards.
• We have the right to grant the licences described in Section 7.

We do not warrant:
• Specific results such as guaranteed Google rankings, traffic levels, or conversion rates. SEO and digital marketing results depend on many external factors outside our control.
• That third-party platforms, plugins, or services (such as WordPress, Shopify, or Google Ads) will remain uninterrupted or error-free.
• That websites will be free from all bugs or security vulnerabilities after handover, as technology evolves continuously.

Any guarantee of results stated in a proposal (e.g. "first page of Google") is an objective, not a contractual commitment, and subject to the Client's ongoing co-operation and market conditions.`,
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content: `Nothing in these Terms limits our liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation, or any other liability that cannot be excluded by law.

Subject to the above, our total liability to the Client in connection with any project or agreement shall not exceed the total fees paid by the Client for that specific project or the immediately preceding three months of retainer fees.

We shall not be liable for:
• Loss of profit, revenue, data, goodwill, or business opportunity
• Indirect, consequential, or special damages of any kind
• Losses arising from the Client's failure to maintain adequate backups of website content or data
• Losses arising from delays caused by the Client's failure to provide content, approvals, or feedback

These limitations apply whether the claim arises in contract, tort (including negligence), breach of statutory duty, or otherwise.`,
  },
  {
    id: "third-party",
    title: "12. Third-Party Services",
    content: `Certain services we provide may rely on third-party platforms (e.g. WordPress, Shopify, Google, Meta, Wix, Squarespace, hosting providers). We are not responsible for:

• Changes to third-party platforms, APIs, or pricing structures
• Outages, data loss, or failures on third-party platforms
• Third-party licensing costs beyond those quoted

Where we manage third-party ad spend (Google Ads, Meta Ads), the advertising budget belongs to the Client. We are not responsible for how third-party platforms allocate or charge ad spend once instructed.`,
  },
  {
    id: "data-protection",
    title: "13. Data Protection",
    content: `Both parties agree to comply with UK GDPR and the Data Protection Act 2018 in respect of any personal data processed in connection with the services.

Our full Privacy Policy, which governs how we collect, use, and protect your personal data, can be found on our website. In the event of any conflict between these Terms and our Privacy Policy regarding data protection, the Privacy Policy shall prevail.`,
  },
  {
    id: "force-majeure",
    title: "14. Force Majeure",
    content: `Neither party shall be liable for any failure or delay in performing their obligations where such failure or delay results from causes beyond their reasonable control, including but not limited to: acts of God, government actions, pandemics, war, fire, flood, civil disorder, or failure of third-party infrastructure.

Where a force majeure event occurs, the affected party shall notify the other in writing as soon as reasonably practicable. If the force majeure event continues for more than 30 days, either party may terminate the agreement by giving 14 days' written notice.`,
  },
  {
    id: "governing-law",
    title: "15. Governing Law & Disputes",
    content: `These Terms and any dispute or claim arising out of or in connection with them (including non-contractual disputes) shall be governed by and construed in accordance with the laws of England and Wales.

The parties agree to submit to the exclusive jurisdiction of the courts of England and Wales.

In the event of a dispute, both parties agree to attempt to resolve the matter in good faith through negotiation before initiating formal legal proceedings. Where a dispute cannot be resolved informally, either party may refer the matter to a mutually agreed mediator before pursuing litigation.`,
  },
  {
    id: "changes",
    title: "16. Changes to These Terms",
    content: `We may update these Terms from time to time. The most current version will always be available on our website. For existing project agreements, the Terms in force at the time of instruction will apply unless both parties agree in writing to adopt the updated Terms.

For ongoing retainer clients, we will provide at least 30 days' notice of any material changes to these Terms.`,
  },
  {
    id: "contact",
    title: "17. Contact Us",
    content: `If you have any questions about these Terms and Conditions, please get in touch:

Business: Dleading Creative Designs
Address: Holbeck, Leeds, West Yorkshire, United Kingdom
Email: info@creativedleading.co.uk
WhatsApp: +44 742 725 9935`,
  },
];

export default function TermsConditions() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#111] py-16 md:py-20 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,157,1,0.11) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,89,1,0.10) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 bg-[#F69D01]/15 text-[#F69D01] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <i className="ri-file-text-line"></i> Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
          <p className="text-gray-300 text-sm mt-3 max-w-2xl leading-relaxed">
            Please read these Terms carefully before engaging Dleading Creative Designs. They form a legally binding agreement between you and us under the laws of England and Wales.
          </p>
          {/* Quick stat pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: "ri-map-pin-line", text: "Governed by English Law" },
              { icon: "ri-building-2-line", text: "Leeds, West Yorkshire, UK" },
              { icon: "ri-calendar-check-line", text: `Updated ${lastUpdated}` },
            ].map((p) => (
              <span
                key={p.text}
                className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full"
              >
                <i className={`${p.icon} text-[#F69D01]`}></i>
                {p.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Important notice banner */}
      <div className="bg-[#fffbf2] border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-start gap-3">
          <div className="w-5 h-5 flex items-center justify-center text-[#F69D01] shrink-0 mt-0.5">
            <i className="ri-information-line text-base"></i>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important:</strong> By instructing us to begin work (verbally, in writing, or by paying a deposit), you confirm you have read and agree to these Terms. If you are accepting on behalf of a business, you confirm you have authority to do so.
          </p>
        </div>
      </div>

      {/* Main content */}
      <section className="py-12 md:py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Sticky sidebar TOC — desktop only */}
            <aside className="hidden lg:block lg:w-56 shrink-0">
              <div className="lg:sticky lg:top-24">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contents</p>
                <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
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

                {/* Key points summary card */}
                <div className="mt-6 p-4 bg-[#fdf8f4] rounded-xl border border-orange-100 space-y-3">
                  <p className="text-xs font-bold text-gray-700">Key Points</p>
                  {[
                    { icon: "ri-money-pound-circle-line", text: "50% deposit to start" },
                    { icon: "ri-refresh-line", text: "2–3 revision rounds included" },
                    { icon: "ri-time-line", text: "30-day notice for retainers" },
                    { icon: "ri-scales-3-line", text: "English law applies" },
                  ].map((kp) => (
                    <div key={kp.text} className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center text-[#F69D01] shrink-0">
                        <i className={`${kp.icon} text-sm`}></i>
                      </div>
                      <span className="text-xs text-gray-600">{kp.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-[#fdf8f4] rounded-xl border border-orange-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Questions?</p>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">We're happy to clarify anything before you engage us.</p>
                  <Link
                    to="/contact"
                    className="block text-center text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </aside>

            {/* Sections */}
            <article className="flex-1 min-w-0">
              <div className="space-y-10">
                {sections.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                      {s.title}
                    </h2>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {s.content}
                    </div>
                    {s.id === "data-protection" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link
                          to="/privacy-policy"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F65901] border border-[#F69D01]/30 px-3 py-1.5 rounded-full hover:bg-[#F69D01]/10 transition-colors cursor-pointer"
                        >
                          <i className="ri-external-link-line text-sm"></i>
                          Read Privacy Policy
                        </Link>
                        <Link
                          to="/cookie-policy"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F65901] border border-[#F69D01]/30 px-3 py-1.5 rounded-full hover:bg-[#F69D01]/10 transition-colors cursor-pointer"
                        >
                          <i className="ri-external-link-line text-sm"></i>
                          Read Cookie Policy
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom CTA strip */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#fdf8f4] rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F69D01]/15 text-[#F69D01] shrink-0">
                      <i className="ri-customer-service-2-line text-base"></i>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Start a Project</p>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    Ready to work together? Get in touch for a free, no-obligation quote.
                  </p>
                  <Link
                    to="/contact"
                    className="block text-center py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Get a Free Quote
                  </Link>
                </div>
                <div className="bg-[#111] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-[#F69D01] shrink-0">
                      <i className="ri-file-shield-2-line text-base"></i>
                    </div>
                    <p className="font-semibold text-white text-sm">Other Legal Docs</p>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    View our full privacy and cookie policies for details on how we handle your data.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to="/privacy-policy"
                      className="flex-1 block text-center py-2.5 rounded-lg text-xs font-semibold text-gray-300 border border-white/20 hover:border-[#F69D01]/50 hover:text-[#F69D01] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      to="/cookie-policy"
                      className="flex-1 block text-center py-2.5 rounded-lg text-xs font-semibold text-gray-300 border border-white/20 hover:border-[#F69D01]/50 hover:text-[#F69D01] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cookie Policy
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
