import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Terms of Service: Lekhsetu" };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display text-xl font-bold text-ink mb-4">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-10">
          <p className="text-xs text-muted mb-2">Last updated: June 2026</p>
          <h1 className="font-display text-4xl font-bold text-ink mb-3">Terms of Service</h1>
          <p className="text-muted">Please read these terms carefully before using Lekhsetu.</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using Lekhsetu (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
        </Section>

        <Section title="2. Who Can Use Lekhsetu">
          <p>You must be at least 13 years old to use Lekhsetu. By using the Platform, you represent that you meet this requirement.</p>
          <p>You are responsible for maintaining the security of your account and all activity under it.</p>
        </Section>

        <Section title="3. Your Content">
          <p>You retain full ownership of all stories and content you publish on Lekhsetu.</p>
          <p>By publishing, you grant Lekhsetu a non-exclusive, royalty-free license to display your content on the Platform.</p>
          <p>You are solely responsible for the accuracy and legality of your content. Do not publish content that is false, defamatory, harassing, or violates any law.</p>
          <p>We reserve the right to remove content that violates these terms without prior notice.</p>
        </Section>

        <Section title="4. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Post spam, misleading, or fraudulent content</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Post content that is sexually explicit, violent, or hateful</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
            <li>Use automated tools to scrape or misuse the Platform</li>
            <li>Impersonate other people or entities</li>
          </ul>
        </Section>

        <Section title="5. Intellectual Property">
          <p>The Lekhsetu name, logo, and design are the property of Lekhsetu. You may not use them without permission.</p>
          <p>Other users&apos; content belongs to them. Do not reproduce their work without permission.</p>
        </Section>

        <Section title="6. Disclaimer of Warranties">
          <p>Lekhsetu is provided &quot;as is&quot; without any warranties. We do not guarantee uninterrupted service or the accuracy of any content on the Platform.</p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the maximum extent permitted by law, Lekhsetu shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
        </Section>

        <Section title="8. Changes to Terms">
          <p>We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
        </Section>

        <Section title="9. Contact">
          <p>Questions about these terms? Contact us at <span style={{ color: "#F5A623" }}>support@lekhsetu.com</span></p>
        </Section>

        <div className="mt-10 pt-8 border-t border-border">
          <Link href="/privacy" className="text-sm hover:text-saffron transition-colors text-muted">
            Read our Privacy Policy →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
