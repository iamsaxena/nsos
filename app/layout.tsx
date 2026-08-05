import type { Metadata } from "next";
import "./globals.css";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { CookieConsent } from "./CookieConsent";

const siteUrl = "https://www.nsos.live";
const title = "NSOS — Live Skills Events for Ambitious Professionals";
const description = "Join expert-led live events and applied workshops in AI, product leadership, program management and entrepreneurship from Namahmi School of Skills.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | NSOS" },
  description,
  applicationName: "Namahmi School of Skills",
  authors: [{ name: "Namahmi School of Skills", url: siteUrl }],
  creator: "Namahmi School of Skills",
  publisher: "Namahmi Labs Private Limited",
  category: "Education",
  keywords: ["skill development", "live events", "professional training", "AI workshops", "product management", "program management", "entrepreneurship", "online certification", "corporate training", "NSOS"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Namahmi School of Skills",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NSOS — Live skills. Real outcomes." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Namahmi School of Skills",
    alternateName: "NSOS",
    url: siteUrl,
    logo: `${siteUrl}/nsos-brand.png`,
    description,
    email: "help@nsos.live",
    parentOrganization: { "@type": "Organization", name: "Namahmi Labs Private Limited", url: "https://www.namahmilabs.com" },
  };

  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }} /><GoogleAnalytics /><LanguageSwitcher />{children}<CookieConsent /></body></html>;
}
