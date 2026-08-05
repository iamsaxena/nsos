import type { Metadata } from "next";

export const metadata: Metadata = { title: "Legal — Namahmi School of Skills", description: "Policies governing NSOS programs, services, privacy, payments, and participation." };

const policies = [
  ["/terms-and-conditions","Terms and Conditions","Platform and Program terms"], ["/privacy-policy","Privacy Policy","How personal data is handled"],
  ["/refund-and-cancellation-policy","Refund and Cancellation Policy","Payments, refunds, and cancellations"], ["/cookie-policy","Cookie Policy","Cookies and preference controls"],
  ["/certification-policy","Certification Policy","Certificate eligibility and verification"], ["/intellectual-property-policy","Intellectual Property Policy","Content ownership and permitted use"],
  ["/code-of-conduct","Code of Conduct","Expected participant behaviour"], ["/accessibility","Accessibility Statement","Accessibility approach and support"],
  ["/disclaimer","Disclaimer","Educational-purpose limitations"], ["/grievance-redressal","Grievance Redressal","Complaint and escalation process"],
  ["/sitemap","Sitemap","Website navigation index"], ["/copyright","Copyright Notice","Ownership and permission requests"],
];

export default function LegalPage() { return <main className="legal-page"><header className="legal-header"><a className="wordmark" href="/"><span className="brand-mark">न</span><span>Namahmi<small>School of Skills</small></span></a><a href="/">← Back to home</a></header><section className="legal-hero"><span className="kicker">Trust & transparency</span><h1>Legal information</h1><p>Policies governing the NSOS website, learning experiences, payments, certificates, data, and community participation.</p></section><section className="legal-directory">{policies.map(([href,title,description],index) => <a href={href} key={href}><span>{String(index+1).padStart(2,"0")}</span><h2>{title}</h2><p>{description}</p><b>Read policy →</b></a>)}</section></main>; }
