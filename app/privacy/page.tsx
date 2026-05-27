import Link from "next/link";

const EFFECTIVE_DATE = "May 27, 2026";

const SECTIONS = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "legal-bases", label: "Legal Bases" },
  { id: "how-we-share-information", label: "How We Share Information" },
  { id: "advertising", label: "Advertising" },
  { id: "cookies", label: "Cookies (Web)" },
  { id: "data-retention", label: "Data Retention" },
  { id: "security", label: "Security" },
  { id: "children", label: "Children’s Privacy" },
  { id: "international-transfers", label: "International Transfers" },
  { id: "your-rights", label: "Your Rights & Choices" },
  { id: "third-parties", label: "Third-Party Services" },
  { id: "changes", label: "Changes To This Policy" },
  { id: "contact", label: "Contact" },
  { id: "delete-request", label: "Request To Delete Data" },
] as const;

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr,0.38fr]">
        <div className="space-y-10">
          <div className="space-y-5">
            <div className="text-xs font-medium tracking-widest text-cyan-200/70">
              PRIVACY
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              Privacy Policy
            </h1>
            <div className="space-y-2 text-sm leading-7 text-zinc-200/70 sm:text-base">
              <p>
                Effective date: <span className="text-zinc-100">{EFFECTIVE_DATE}</span>
              </p>
              <p>
                This Privacy Policy explains how we collect, use, share, and protect
                information across our games and related services (including demos,
                betas, DLC, in-game features, websites, and community channels that
                link to this policy).
              </p>
              <p>
                If you have questions about privacy, contact{" "}
                <a
                  className="text-zinc-100 underline decoration-white/20 underline-offset-4 transition hover:decoration-white/60"
                  href="mailto:support@stardew.net"
                >
                  support@stardew.net
                </a>
                .
              </p>
            </div>
          </div>

          <section
            id="information-we-collect"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              1) Information We Collect
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              The information we collect depends on how you use the Services and which
              platform you play on.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm font-semibold text-zinc-50">
                  A. Information you provide
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
                  <li>Support requests, bug reports, and any details you include.</li>
                  <li>
                    Account/profile details where applicable (display name, email,
                    settings you choose).
                  </li>
                  <li>
                    User-generated content where applicable (chat, posts, uploads, or
                    content you create).
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm font-semibold text-zinc-50">
                  B. Information collected automatically
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
                  <li>
                    Device and technical data (device type, OS, language, app version,
                    performance metrics).
                  </li>
                  <li>
                    Identifiers (IP address, platform user IDs, session IDs, and
                    device/advertising IDs where enabled by the platform).
                  </li>
                  <li>
                    Usage data (gameplay events, feature usage, in-game settings, crash
                    reports, and error logs).
                  </li>
                  <li>
                    Approximate location derived from IP (generally city/region level),
                    used for security, analytics, and compliance.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm font-semibold text-zinc-50">
                  C. Information from platforms and third parties
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
                  If you access the Services through third-party platforms (for example
                  Steam, Epic, PlayStation, Xbox, Nintendo, Apple App Store, Google
                  Play), we may receive identifiers and purchase/entitlement
                  confirmations from that platform. We do not receive your platform
                  password.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm font-semibold text-zinc-50">
                  D. Payments and purchases
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
                  Purchases are generally processed by the platform/store or payment
                  provider. We typically receive purchase confirmations and
                  entitlements, not full payment card details.
                </p>
              </div>
            </div>
          </section>

          <section
            id="how-we-use-information"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              2) How We Use Information
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
              <li>Provide and operate the Services (features, content, entitlements).</li>
              <li>Maintain security and prevent abuse (fraud, cheating, account protection).</li>
              <li>Fix bugs and improve performance (crash diagnostics and quality monitoring).</li>
              <li>Provide customer support and respond to requests.</li>
              <li>Communicate service updates and important notices.</li>
              <li>Analytics to understand usage trends and improve design.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section
            id="legal-bases"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              3) Legal Bases (EEA/UK, where applicable)
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              If you are located in the EEA or UK, we process personal data under one or
              more of these legal bases:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
              <li>Contract: to provide the Services you request.</li>
              <li>Legitimate interests: to secure, improve, and operate the Services.</li>
              <li>Consent: where required for certain processing.</li>
              <li>Legal obligation: to comply with laws and lawful requests.</li>
            </ul>
          </section>

          <section
            id="how-we-share-information"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              4) How We Share Information
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
              <li>
                Service providers that help us operate the Services (hosting, crash
                reporting, analytics, customer support tooling).
              </li>
              <li>
                Platforms/stores for entitlements, compliance, refunds, and platform
                functionality.
              </li>
              <li>
                Legal and safety reasons (to comply with law, protect rights, and
                prevent harm).
              </li>
              <li>
                Business transfers (merger, acquisition, financing, or asset sale),
                subject to appropriate protections.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-7 text-zinc-200/70 sm:text-base">
              We do not sell personal information in the ordinary sense. Where local
              laws define “sale” or “sharing” broadly (including certain advertising
              activities), you may have opt-out rights described below.
            </p>
          </section>

          <section
            id="advertising"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              5) Advertising (If Applicable)
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              Some versions of the Services may show contextual ads (based on content)
              or personalized ads (based on interests), where enabled by the platform
              and permitted by law. Ad choices are typically managed through device and
              platform settings, and in-game settings where available.
            </p>
          </section>

          <section
            id="cookies"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              6) Cookies and Similar Technologies (Web)
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              If we operate websites, they may use cookies, local storage, and similar
              technologies for essential functionality, security, preferences, and
              analytics. You can control cookies through browser settings, but blocking
              some cookies may affect site functionality.
            </p>
          </section>

          <section
            id="data-retention"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              7) Data Retention
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              We keep information only as long as reasonably necessary to operate the
              Services, provide support, maintain security, and comply with legal and
              accounting requirements. Retention periods vary by data type.
            </p>
          </section>

          <section
            id="security"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              8) Security
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              We use reasonable administrative, technical, and physical safeguards
              designed to protect information. No method of transmission or storage is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section
            id="children"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              9) Children’s Privacy
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              The Services are not intended for children under 13 (or the minimum age
              required by local law). We do not knowingly collect personal information
              from children under that age. If you believe a child provided personal
              information, contact us to request deletion.
            </p>
          </section>

          <section
            id="international-transfers"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              10) International Data Transfers
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              Your information may be processed in countries other than where you live.
              When required, we use appropriate safeguards for international transfers.
            </p>
          </section>

          <section
            id="your-rights"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              11) Your Privacy Rights and Choices
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              Depending on where you live, you may have rights to access, correct, or
              delete your personal data, object to or restrict certain processing, and
              request portability. You can also withdraw consent where processing is
              based on consent.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              To make a privacy request, contact{" "}
              <a
                className="text-zinc-100 underline decoration-white/20 underline-offset-4 transition hover:decoration-white/60"
                href="mailto:support@stardew.net"
              >
                support@stardew.net
              </a>
              .
            </p>
          </section>

          <section
            id="third-parties"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              12) Third-Party Links and Services
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              The Services may include links to third-party sites, stores, or platform
              features. Their privacy practices are governed by their own policies.
            </p>
          </section>

          <section
            id="changes"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              13) Changes to This Policy
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              We may update this Privacy Policy from time to time. If changes are
              material, we will provide notice as required (for example in-game or on a
              website). The effective date above reflects the current version.
            </p>
          </section>

          <section
            id="contact"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              14) Contact
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              For privacy questions, email{" "}
              <a
                className="text-zinc-100 underline decoration-white/20 underline-offset-4 transition hover:decoration-white/60"
                href="mailto:support@stardew.net"
              >
                support@stardew.net
              </a>
              .
            </p>
          </section>

          <section
            id="delete-request"
            className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Request to Delete Data or Account (Compliance)
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-200/70 sm:text-base">
              To request deletion of your personal data and/or an associated account
              (where applicable), email{" "}
              <a
                className="text-zinc-100 underline decoration-white/20 underline-offset-4 transition hover:decoration-white/60"
                href="mailto:support@stardew.net"
              >
                support@stardew.net
              </a>{" "}
              with:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-200/70 sm:text-base">
              <li>The game/app name and platform (Steam/iOS/Android/console).</li>
              <li>Your in-game name or platform ID (do not send passwords).</li>
              <li>
                The email used (if any) and a clear statement that you are requesting
                deletion.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-7 text-zinc-200/70 sm:text-base">
              We may ask for additional information to verify your request before
              completing deletion, and we will respond within the time required by
              applicable law.
            </p>
          </section>

          <div className="pt-2">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-200/70 transition hover:text-zinc-50"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-medium tracking-widest text-zinc-200/60">
              ON THIS PAGE
            </div>
            <nav className="mt-4 space-y-2 text-sm text-zinc-200/70">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block transition hover:text-zinc-50"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
