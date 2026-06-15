import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Privacy Policy: Lekhsetu" };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display text-xl font-bold text-ink mb-4">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-10">
          <p className="text-xs text-muted mb-2">Last updated: June 2026</p>
          <h1 className="font-display text-4xl font-bold text-ink mb-3">Privacy Policy</h1>
          <p className="text-muted">We believe in transparency. Here is exactly what data we collect and why.</p>
        </div>

        <Section title="1. What We Collect">
          <p><strong className="text-ink">Account data:</strong> When you sign up, we collect your email address and display name.</p>
          <p><strong className="text-ink">Profile data:</strong> Username, bio, and any optional information you add to your profile.</p>
          <p><strong className="text-ink">Content:</strong> Stories, comments, and tags you publish on the Platform.</p>
          <p><strong className="text-ink">Usage data:</strong> View counts, reactions, and interaction data to show you relevant content.</p>
          <p><strong className="text-ink">Technical data:</strong> Browser type and approximate location for performance and security purposes.</p>
        </Section>

        <Section title="2. What We Do Not Collect">
          <ul className="list-disc ml-5 space-y-1">
            <li>We do not sell your personal data to third parties</li>
            <li>We do not track you across other websites</li>
            <li>We do not use your data for advertising profiling</li>
            <li>We do not store payment information (no payments exist on the Platform currently)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use your data to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Provide and improve the Platform</li>
            <li>Show your stories to readers</li>
            <li>Send account-related communications (no marketing without consent)</li>
            <li>Detect and prevent abuse</li>
          </ul>
        </Section>

        <Section title="4. Anonymous Stories">
          <p>When you publish a story anonymously, your name and profile are hidden from readers. However, we still store the association internally to comply with legal obligations and prevent abuse.</p>
        </Section>

        <Section title="5. Data Storage">
          <p>Your data is stored securely on Supabase infrastructure. We use industry-standard encryption and access controls.</p>
          <p>Your data may be stored in servers outside India. By using the Platform, you consent to this transfer.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your stories at any time</li>
          </ul>
          <p>To exercise these rights, contact us at <span style={{ color: "#F5A623" }}>support@lekhsetu.com</span></p>
        </Section>

        <Section title="7. Cookies">
          <p>We use session cookies only to keep you signed in. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="8. Children">
          <p>Lekhsetu is not intended for children under 13. If we discover an account belonging to a child under 13, we will delete it.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this policy. We will notify you of significant changes via email or a notice on the Platform.</p>
        </Section>

        <Section title="10. Contact">
          <p>Privacy questions? Contact us at <span style={{ color: "#F5A623" }}>support@lekhsetu.com</span></p>
        </Section>

        <div className="mt-10 pt-8 border-t border-border">
          <Link href="/terms" className="text-sm hover:text-saffron transition-colors text-muted">
            Read our Terms of Service →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
