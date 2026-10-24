import type { LegalDocument } from "@/app/lib/legal/documents";

const CONTACT = "hello@presh.me";

export const TERMS_DOCUMENT_EN: LegalDocument = {
  title: "Terms of use",
  updatedAt: "2026-10-24",
  intro: [
    "These terms govern the use of Presh (presh.me). By registering or continuing to use the service, you agree to these terms, the Privacy policy and the Cookie policy.",
  ],
  sections: [
    {
      id: "content",
      title: "1. Content",
      paragraphs: [
        "You are responsible for all material you publish on your Presh page. By publishing content, you grant Presh the right to use, display and distribute it within the service. You keep rights to your content, but you guarantee that it does not break the law, intellectual property rights, or contain malicious code.",
        "Presh may remove or edit content at its discretion, including with automated systems, if it breaks these terms or policies.",
      ],
    },
    {
      id: "prohibited",
      title: "2. Prohibited content",
      paragraphs: ["You must not use Presh to publish, distribute or link to:"],
      bullets: [
        "fraudulent or misleading content, including phishing and schemes;",
        "pyramid schemes, MLM traps or promises of high-return investments;",
        "links to malicious or suspicious external resources;",
        "illegal activity or content that breaks applicable law;",
        "hate speech, harassment or content that endangers others;",
        "spam or unwanted mass messaging;",
        "content that sexualizes, exploits or endangers minors, including CSAM;",
        "ads for sexual services (even where those are otherwise allowed);",
        "intimate images or video without the person’s consent, including AI-generated ones.",
      ],
      afterBullets: [
        "Presh may remove content and suspend or close an account without prior notice. There is zero tolerance for sexual exploitation of minors: content is removed, the account is closed, and the case may be reported to competent authorities.",
      ],
    },
    {
      id: "adult",
      title: "3. Adult content",
      paragraphs: ["Adult content creators may use Presh within these limits:"],
      bullets: [
        "you must be at least 18 to publish or link adult content;",
        "you may link to adult content on platforms that verify age (e.g. OnlyFans);",
        "your Presh page must not show nudity or sexually explicit images, video or text (profile, background, blocks, embeds);",
        "you must not sell or deliver adult content outside those platforms via payment apps or file links.",
      ],
      afterBullets: [
        "Presh may add an age warning and exclude such pages from promotional materials.",
      ],
    },
    {
      id: "accounts",
      title: "4. Accounts",
      paragraphs: [
        "To use Presh you must be at least 13 (or older if required by law in your country). If you are under 18, a parent or guardian’s consent is required. For adult content you must be at least 18.",
        "Keep account details accurate. You are responsible for password security and activity on your account. Usernames must not infringe others’ rights or be abusive. “Reserving” links without real use is forbidden.",
      ],
    },
    {
      id: "access",
      title: "5. Access and IP",
      paragraphs: [
        "Presh and its design are our intellectual property. You receive a limited, non-exclusive right to use the platform. You must not separate artwork from text or copy the service for commercial purposes without permission.",
      ],
    },
    {
      id: "third-party",
      title: "6. Third-party links",
      paragraphs: [
        "External links on a page are for convenience. Presh is not responsible for third-party content, privacy or practices. You open them at your own risk.",
      ],
    },
    {
      id: "termination",
      title: "7. Suspension and closure",
      paragraphs: [
        "Presh may immediately suspend or close an account without notice, including for breaches of the terms. Suspension decisions are final at our discretion.",
      ],
    },
    {
      id: "indemnity",
      title: "8. Indemnity",
      paragraphs: [
        "You agree to indemnify Presh for losses, costs and liability arising from your use or breach of the terms.",
      ],
    },
    {
      id: "liability",
      title: "9. Limitation of liability",
      paragraphs: [
        "Presh is not liable for losses arising from use of the service, to the extent permitted by law. Liability is limited to the amount you have paid us (if any). You are responsible for your own data security and backups.",
      ],
    },
    {
      id: "disclaimer",
      title: "10. Disclaimer",
      paragraphs: [
        "The service is provided “as is”, without warranties. We do not guarantee uninterrupted operation, bug fixes or freedom from viruses.",
      ],
    },
    {
      id: "law",
      title: "11. Governing law",
      paragraphs: [
        "These terms are governed by the laws of the Republic of Latvia, unless mandatory consumer protection rules say otherwise.",
      ],
    },
    {
      id: "changes",
      title: "12. Changes",
      paragraphs: [
        "Presh may change the terms. We will give reasonable notice of material changes. Continuing to use the service after changes means you accept them.",
      ],
    },
    {
      id: "contact",
      title: "13. Contact",
      paragraphs: [
        `Questions about the terms: write to ${CONTACT}. To report a violation, include the page link and a short description. If it concerns child safety or intimate images without consent, put that in the subject line. Immediate danger — contact local police.`,
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT_EN: LegalDocument = {
  title: "Privacy policy",
  updatedAt: "2026-10-24",
  intro: [
    "Presh cares about your privacy. This policy explains what data we collect, why, and what your rights are.",
    "By using the service you agree to this policy, the Cookie policy and the Terms of use.",
  ],
  sections: [
    {
      id: "collect",
      title: "1. What data we collect",
      paragraphs: [
        "For the account: name, email, password (stored hashed or encrypted, never as plain text), chosen link and page content you enter.",
        "When using the site we may receive IP address, device and browser information, and data via cookies (see the Cookie policy).",
        "In support requests: email, message content and related information.",
      ],
    },
    {
      id: "use",
      title: "2. Why we use data",
      paragraphs: [
        "To provide the account and your public page, reset passwords, improve the service, keep it secure and answer questions.",
        "On the public page only what you publish is visible (name, bio, images, links). Email is not visible to visitors.",
      ],
    },
    {
      id: "sharing",
      title: "3. Sharing data",
      paragraphs: [
        "We may share data with service providers (hosting, email, payments, security, analytics) only as needed and with a duty to protect the data.",
        "We may disclose information if required by law or to protect legitimate interests. This policy does not cover other sites’ privacy practices.",
      ],
    },
    {
      id: "retention",
      title: "4. Retention",
      paragraphs: [
        "We keep data while the account is active. After closure we may keep some data for legal duties, disputes and fraud prevention.",
      ],
    },
    {
      id: "rights",
      title: "5. Your rights",
      paragraphs: [
        `EU / EEA users have rights to access, correct and delete personal data. Write to ${CONTACT}.`,
      ],
    },
    {
      id: "security",
      title: "6. Security",
      paragraphs: [
        "We use reasonable security measures, but absolute security on the internet cannot be guaranteed.",
      ],
    },
    {
      id: "changes",
      title: "7. Changes",
      paragraphs: [
        "Policy changes take effect when the updated version is published. Continuing to use Presh means you accept the updates.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      paragraphs: [`For data questions or complaints: ${CONTACT}.`],
    },
  ],
};

export const COOKIES_DOCUMENT_EN: LegalDocument = {
  title: "Cookie policy",
  updatedAt: "2026-10-24",
  intro: [
    "This policy explains which cookies and similar technologies Presh may use and why.",
  ],
  sections: [
    {
      id: "what",
      title: "1. What cookies are",
      paragraphs: [
        "Cookies are small text files a site stores on your device. The browser uses them to recognize the device and remember choices on later visits.",
      ],
    },
    {
      id: "types",
      title: "2. Which cookies we use",
      paragraphs: [
        "Necessary — required for the site to work and to store your cookie consent. Without them the system does not work correctly.",
        "Preference — remember your interface choices (when those features exist).",
        "Analytics — help understand how the site is used (e.g. anonymous analytics), only with your consent.",
        "Marketing — for personalized communication; Presh does not actively use them now, but the category is ready if we add them later.",
      ],
    },
    {
      id: "third",
      title: "3. Third-party cookies",
      paragraphs: [
        "If we enable third-party tools (e.g. analytics), their cookies are controlled by that provider under its own policy.",
      ],
    },
    {
      id: "manage",
      title: "4. How to manage",
      paragraphs: [
        "You can change consent anytime in cookie settings (the button on this page or the banner). You can also delete cookies in browser settings; some features may then stop working.",
      ],
    },
    {
      id: "changes",
      title: "5. Changes",
      paragraphs: [
        "We may update this policy. Continuing to use the site means you accept the current version.",
      ],
    },
    {
      id: "contact",
      title: "6. Contact",
      paragraphs: [`Questions: ${CONTACT}.`],
    },
  ],
};
