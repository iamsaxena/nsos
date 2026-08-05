import type { Metadata } from "next";
import { notFound } from "next/navigation";
import legalSource from "../../content/legal-policies.md?raw";

const pages = {
  "terms-and-conditions": { marker: "PAGE 1: TERMS AND CONDITIONS", title: "Terms and Conditions" },
  "privacy-policy": { marker: "PAGE 2: PRIVACY POLICY", title: "Privacy Policy" },
  "refund-and-cancellation-policy": { marker: "PAGE 3: REFUND AND CANCELLATION POLICY", title: "Refund and Cancellation Policy" },
  "cookie-policy": { marker: "PAGE 4: COOKIE POLICY", title: "Cookie Policy" },
  "certification-policy": { marker: "PAGE 5: CERTIFICATION POLICY", title: "Certification Policy" },
  "intellectual-property-policy": { marker: "PAGE 6: INTELLECTUAL PROPERTY AND CONTENT USE POLICY", title: "Intellectual Property Policy" },
  "code-of-conduct": { marker: "PAGE 7: PARTICIPANT CODE OF CONDUCT", title: "Participant Code of Conduct" },
  accessibility: { marker: "PAGE 8: ACCESSIBILITY STATEMENT", title: "Accessibility Statement" },
  disclaimer: { marker: "PAGE 9: DISCLAIMER", title: "Disclaimer" },
  "grievance-redressal": { marker: "PAGE 10: GRIEVANCE REDRESSAL POLICY", title: "Grievance Redressal Policy" },
  sitemap: { marker: "PAGE 11: WEBSITE SITEMAP", title: "Website Sitemap" },
  copyright: { marker: "PAGE 12: COPYRIGHT NOTICE", title: "Copyright Notice" },
} as const;

type LegalSlug = keyof typeof pages;
const knownReplacements: Array<[string, string]> = [
  ["[DD Month YYYY]", "04 August 2026"], ["[Year]", "2026"],
  ["[Website URL]", "https://www.nsos.live/"], ["[Support Email Address]", "help@nsos.live"],
  ["[Legal or Support Email]", "help@nsos.live"], ["[Privacy Email Address]", "help@nsos.live"],
  ["[Marketing Opt-Out Email]", "help@nsos.live"], ["[Billing Email Address]", "help@nsos.live"],
  ["[Certificate Support Email]", "help@nsos.live"], ["[Copyright Email Address]", "help@nsos.live"],
  ["[Conduct Email Address]", "help@nsos.live"], ["[Accessibility Email Address]", "help@nsos.live"],
  ["[Grievance Email Address]", "help@nsos.live"], ["[Escalation Email Address]", "help@nsos.live"],
  ["[Phone Number]", "+91 70757 29458"], ["[7]", "7"], ["[3]", "3"], ["[15]", "15"],
];

function extractPage(marker: string) {
  const start = legalSource.indexOf(`# ${marker}`);
  if (start < 0) return "";
  const next = legalSource.indexOf("\n---\n\n# PAGE", start);
  let value = legalSource.slice(start, next < 0 ? legalSource.length : next);
  value = value.replace(/^# .*\n/, "").replace(/^\*\*Suggested URL:\*\*.*\n/m, "").replace(/^\*\*Page title:\*\*.*\n/m, "");
  for (const [from, to] of knownReplacements) value = value.split(from).join(to);
  return value.trim();
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2,-2)}</strong> : part);
}

function PolicyContent({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line || line === "---") { i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={i}>{inline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("### ")) { blocks.push(<h3 key={i}>{inline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("* ")) { items.push(lines[i].trim().slice(2)); i++; }
      blocks.push(<ul key={`list-${i}`}>{items.map((item,index) => <li key={index}>{inline(item)}</li>)}</ul>); continue;
    }
    blocks.push(<p key={i}>{inline(line)}</p>); i++;
  }
  return <>{blocks}</>;
}

export function generateStaticParams() { return Object.keys(pages).map((legalSlug) => ({ legalSlug })); }

export async function generateMetadata({ params }: { params: Promise<{ legalSlug: string }> }): Promise<Metadata> {
  const { legalSlug } = await params;
  const page = pages[legalSlug as LegalSlug];
  return page ? { title: `${page.title} | Namahmi School of Skills`, description: `${page.title} for Namahmi School of Skills.` } : {};
}

export default async function LegalPolicyPage({ params }: { params: Promise<{ legalSlug: string }> }) {
  const { legalSlug } = await params;
  const page = pages[legalSlug as LegalSlug];
  if (!page) notFound();
  const source = extractPage(page.marker);
  return <main className="legal-page"><header className="legal-header"><a className="wordmark" href="/"><span className="brand-mark">न</span><span>Namahmi<small>School of Skills</small></span></a><a href="/legal">All legal policies</a></header><section className="policy-hero"><span className="kicker">Legal · NSOS</span><h1>{page.title}</h1><p>Last updated: 04 August 2026</p></section><article className="policy-document"><div className="policy-alert">Review notice: registered-office address and grievance-officer details must be completed before go-live.</div><PolicyContent source={source} /></article></main>;
}
