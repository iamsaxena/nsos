"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, callback: (response: unknown) => void) => void }; } }

type Status = "Published" | "Draft";
type EventRecord = {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  format: string;
  level: string;
  mrp: number;
  price: number;
  seats: number;
  status: Status;
  theme: string;
  image?: string;
  speakerName?: string;
  speakerTitle?: string;
  speakerExperience?: string;
  speakerBio?: string;
  speakerPhoto?: string;
  ppt?: string;
  recording?: string;
};

const initialEvents: EventRecord[] = [
  {
    id: 1,
    eyebrow: "Live masterclass",
    title: "Build AI Products People Trust",
    description: "Move from an ambiguous AI idea to a testable product direction. Learn discovery, evaluation design, responsible launch decisions, and the judgment that separates a demo from a dependable product.",
    date: "24 AUG 2026",
    time: "6:30 PM IST",
    duration: "120 minutes",
    format: "Live on Zoom",
    level: "Intermediate",
    mrp: 2499,
    price: 1499,
    seats: 18,
    status: "Published",
    theme: "blue",
    speakerName: "Sandeep Saxena",
    speakerTitle: "AI Product & Program Leader",
    speakerExperience: "15+ years building and leading technology products",
    speakerBio: "A practitioner focused on turning emerging technology into dependable products, capable teams and measurable outcomes.",
    ppt: "ai-product-trust-playbook.pptx",
  },
  {
    id: 2,
    eyebrow: "Founder workshop",
    title: "Validate Before You Build",
    description: "Pressure-test the problem, run customer interviews, design fast experiments, and identify genuine signal before committing months of product effort.",
    date: "06 SEP 2026",
    time: "11:00 AM IST",
    duration: "90 minutes",
    format: "Live on Zoom",
    level: "All levels",
    mrp: 1999,
    price: 999,
    seats: 31,
    status: "Published",
    theme: "gold",
    speakerName: "Sandeep Saxena",
    speakerTitle: "Founder & Product Mentor",
    speakerExperience: "15+ years across product, programs and entrepreneurship",
    speakerBio: "Works with founders and teams to validate real demand before committing expensive product effort.",
  },
  {
    id: 3,
    eyebrow: "Program leadership lab",
    title: "Run AI Programs Without the Chaos",
    description: "Create delivery cadence, manage dependencies and risk, and align technical and business stakeholders around measurable outcomes.",
    date: "20 SEP 2026",
    time: "5:00 PM IST",
    duration: "120 minutes",
    format: "Live on Zoom",
    level: "Intermediate",
    mrp: 2999,
    price: 1799,
    seats: 24,
    status: "Draft",
    theme: "violet",
  },
];

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function EventPlatform({ initialView = "home" }: { initialView?: "home" | "admin" }) {
  const [events, setEvents] = useState(initialEvents);
  const [view] = useState<"home" | "admin">(initialView);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [checkout, setCheckout] = useState<EventRecord | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminTab, setAdminTab] = useState<"events" | "enrollments" | "certificates">("events");
  const [certificateTemplate, setCertificateTemplate] = useState("NSOS-standard-certificate-template.pdf");
  const [showCertificate, setShowCertificate] = useState(false);

  const published = useMemo(() => events.filter((event) => event.status === "Published"), [events]);
  const featured = published[0];

  useEffect(() => {
    fetch("/api/events").then(async (response) => response.ok ? response.json() : []).then((stored: EventRecord[]) => { if (stored.length) setEvents(stored); }).catch(() => undefined);
    if (view === "admin") fetch("/api/auth/google/me").then(async (response) => response.ok ? response.json() : null).then((profile: { email?: string } | null) => { if (profile?.email) { setAdminEmail(profile.email); setSignedIn(true); } }).catch(() => undefined);
  }, [view]);

  async function deleteEvent(id: number) {
    const response = await fetch("/api/events", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { setNotice("This action requires one of the approved administrator accounts."); return; }
    setEvents((current) => current.filter((event) => event.id !== id));
    setNotice("Event removed from the catalogue.");
  }

  async function togglePublish(id: number) {
    const existing = events.find((event) => event.id === id);
    if (!existing) return;
    const status = existing.status === "Published" ? "Draft" : "Published";
    const response = await fetch("/api/events", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!response.ok) { setNotice("This action requires one of the approved administrator accounts."); return; }
    setEvents((current) => current.map((event) => event.id === id ? { ...event, status } : event));
    setNotice("Event status updated.");
  }

  async function saveEvent(event: EventRecord) {
    const updating = events.some((existing) => existing.id === event.id);
    const response = await fetch("/api/events", { method: updating ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event) });
    if (!response.ok) { setShowEditor(false); setNotice("The event was not saved. Sign in with one of the approved administrator accounts."); return; }
    const stored = await response.json() as EventRecord;
    setEvents((current) => updating ? current.map((item) => item.id === stored.id ? stored : item) : [stored, ...current]);
    setShowEditor(false);
    setEditingEvent(null);
    setNotice(event.status === "Published" ? "Event published and visible on the website." : "Draft saved.");
  }

  if (view === "admin") {
    return (
      <main className="admin-shell">
        <header className="admin-topbar">
          <button className="wordmark dark" onClick={() => { window.location.href = "/"; }} aria-label="Return to public website">
            <span className="brand-mark">न</span><span>Namahmi<small>School of Skills</small></span>
          </button>
          {signedIn && <div className="admin-account"><span className="avatar">SS</span><div><strong>Admin workspace</strong><small>{adminEmail}</small></div><button className="text-button" onClick={() => { window.location.href = "/api/auth/google/logout"; }}>Sign out</button></div>}
        </header>

        {!signedIn ? (
          <section className="login-panel">
            <div className="login-art"><span className="kicker">Protected workspace</span><h1>Shape the next learning experience.</h1><p>Only approved NSOS administrators can create, publish, and manage events.</p></div>
            <div className="login-card">
              <span className="brand-mark large">न</span>
              <h2>Admin sign in</h2>
              <p>Sign in with the authorized Google administrator account to continue.</p>
              <button className="google-button" onClick={() => { window.location.href = "/api/auth/google/start?returnTo=/adminpanel"; }}><span>G</span> Continue with Google</button>
              <small className="security-note">Only whoshobhitsaxena@gmail.com is authorized for this workspace.</small>
              <button className="back-link" onClick={() => { window.location.href = "/"; }}>← Back to nsos.live</button>
            </div>
          </section>
        ) : (
          <section className="dashboard">
            <aside className="side-nav"><p>Workspace</p><button className={adminTab === "events" ? "active" : ""} onClick={() => setAdminTab("events")}>Events <span>{events.length}</span></button><button className={adminTab === "enrollments" ? "active" : ""} onClick={() => setAdminTab("enrollments")}>Enrollments <span>0</span></button><button className={adminTab === "certificates" ? "active" : ""} onClick={() => setAdminTab("certificates")}>Certificates</button><div className="mode-card"><b>Integration pending</b><p>Google authentication, Razorpay verification and permanent records require production credentials before go-live.</p></div></aside>
            <div className="dashboard-main">
              {adminTab === "events" ? <>
              <div className="dashboard-heading"><div><span className="kicker">Event operations</span><h1>Your events</h1><p>Create the room where useful work begins.</p></div><button className="primary" onClick={() => { setEditingEvent(null); setShowEditor(true); }}>＋ Create event</button></div>
              {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}
              <div className="stats"><article><span>Published</span><strong>{published.length}</strong><small>Live on nsos.live</small></article><article><span>Drafts</span><strong>{events.length - published.length}</strong><small>Waiting for review</small></article><article><span>Verified enrollments</span><strong>0</strong><small>Connect Razorpay to populate</small></article><article><span>Verified revenue</span><strong>₹0</strong><small>No production payments yet</small></article></div>
              <div className="event-table-wrap"><div className="table-title"><h2>All events</h2><span>{events.length} total</span></div><div className="event-table">
                {events.map((event) => <article className="event-row" key={event.id}><div className={`event-thumb ${event.theme}`}><span>{event.date.split(" ")[0]}</span><b>{event.date.split(" ")[1]}</b></div><div className="event-main"><small>{event.eyebrow}</small><strong>{event.title}</strong><span>{event.date} · {event.time}</span></div><div className="event-price"><small>Offer price</small><strong>{inr.format(event.price)}</strong></div><span className={`status ${event.status.toLowerCase()}`}>{event.status}</span><div className="row-actions"><button onClick={() => { setEditingEvent(event); setShowEditor(true); }}>Edit</button><button onClick={() => togglePublish(event.id)}>{event.status === "Published" ? "Unpublish" : "Publish"}</button><button className="danger" onClick={() => window.confirm("Delete this event permanently?") && deleteEvent(event.id)}>Delete</button></div></article>)}
              </div></div>
              </> : adminTab === "enrollments" ? <EnrollmentAdmin /> : <CertificateAdmin template={certificateTemplate} onTemplate={setCertificateTemplate} />}
            </div>
          </section>
        )}
        {showEditor && <EventEditor event={editingEvent} onClose={() => { setShowEditor(false); setEditingEvent(null); }} onSave={saveEvent} />}
      </main>
    );
  }

  return (
    <main id="home">
      <nav className="nav">
        <button className="wordmark" onClick={() => window.scrollTo({top:0, behavior:"smooth"})}><span className="brand-mark">न</span><span>Namahmi<small>School of Skills</small></span></button>
        <div className="nav-links"><a href="#home">Home</a><a href="#events">Live Events</a><a href="#certifications">Certificates</a><a href="#corporate">Corporate Training</a><a href="#about">About</a><a href="#contact">Contact</a></div>
        <details className="mobile-menu"><summary>Menu</summary><div><a href="#home">Home</a><a href="#events">Live Events</a><a href="#certifications">Certificates</a><a href="#corporate">Corporate Training</a><a href="#about">About</a><a href="#contact">Contact</a></div></details>
      </nav>
      <section className="hero">
        <div className="hero-copy"><span className="kicker">An AI-first school · Built for professionals everywhere</span><h1>Learn the work.<br/><em>Do the work.</em></h1><p>Live workshops for product leaders, program managers, and founders building what comes next—with AI already in the room.</p><div className="hero-actions"><button className="primary" onClick={() => setSelected(featured)}>Explore next event</button><a href="#events">View all events ↓</a></div><div className="proof"><div><strong>Live</strong><span>Expert-led sessions</span></div><div><strong>Applied</strong><span>Build as you learn</span></div><div><strong>Focused</strong><span>Small cohorts</span></div></div></div>
        <div className="featured-card"><div className="featured-visual"><span className="live-pill">● ENROLLING NOW</span><div className="orb"><span>AI</span></div><p>PRODUCT<br/>LEADERSHIP</p></div><div className="featured-details"><span>{featured.date} · {featured.time}</span><h2>{featured.title}</h2><div className="price"><strong>{inr.format(featured.price)}</strong><del>{inr.format(featured.mrp)}</del><small>{featured.seats} seats left</small></div><button onClick={() => setCheckout(featured)}>Reserve your seat →</button></div></div>
      </section>

      <section className="manifesto"><span>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।</span><p>Focus on building, serving, and executing relentlessly. Success is the consequence—not the curriculum.</p></section>

      <section className="events-section" id="events"><div className="section-heading"><div><span className="kicker">Upcoming at NSOS</span><h2>Choose your next room.</h2></div><p>Practical, live learning designed around real decisions—not passive content.</p></div><div className="event-grid">{published.map((event, index) => <article className="public-event" key={event.id}><div className={`public-visual ${event.theme}`}>{event.image && <img className="event-cover" src={event.image} alt="" />}<span className="event-number">0{index + 1}</span><span className="event-type">{event.eyebrow}</span>{!event.image && <div className="visual-glyph">{index === 0 ? "◎" : "✦"}</div>}</div><div className="public-content"><div className="event-meta"><span>{event.date}</span><span>{event.time}</span></div><h3>{event.title}</h3><p>{event.description}</p><div className="chips"><span>{event.duration}</span><span>{event.format}</span><span>{event.level}</span></div><div className="card-bottom"><div><del>{inr.format(event.mrp)}</del><strong>{inr.format(event.price)}</strong></div><button onClick={() => setSelected(event)}>View event →</button></div></div></article>)}</div></section>

      <section className="learning-formats"><div className="format-intro"><span className="kicker">From registration to recognition</span><h2>A clear learning<br/>journey.</h2></div><article><span>01</span><h3>Attend live</h3><p>Join an expert-led, practical session built around decisions, exercises and tools you can use immediately.</p></article><article id="certifications"><span>02</span><h3>Access your certificate</h3><p>Eligible paid participants can securely retrieve their PDF certificate 24 hours after the event is completed.</p><small className="certificate-disclaimer">Certificates confirm participation, attendance, completion or achievement. Unless expressly stated, they are not a university degree, government licence, regulated professional qualification or guarantee of employment.</small><button className="certificate-link" onClick={() => setShowCertificate(true)}>Download your certificate →</button><a href="/certification-policy">Read certification policy →</a></article></section>
      <section className="about-section" id="about"><div><span className="kicker">About NSOS</span><h2>Professional learning for work that is changing now.</h2></div><div><p>Namahmi School of Skills is a professional skill-development initiative operated by Namahmi Labs Private Limited. We create focused learning experiences for professionals, founders and teams navigating AI-led change.</p><p>Our approach is live, applied and deliberately small-cohort: understand the idea, practise the decision and leave with something useful.</p><div className="about-values"><span><b>Practical</b>Built around real work</span><span><b>Current</b>Designed for emerging skills</span><span><b>Responsible</b>Clear about outcomes</span></div></div></section>
      <section className="community" id="corporate"><div><span className="kicker">Corporate training</span><h2>Bring the classroom<br/>to your team.</h2></div><div><p>We tailor the same applied workshops to your organisation’s context, tools, and goals—live across time zones.</p><a href="mailto:help@nsos.live?subject=Corporate%20Training">Plan a private session →</a></div></section>
      <section className="faq-section"><span className="kicker">Common questions</span><h2>Before you enroll.</h2><div><details><summary>When will I receive joining details?</summary><p>Joining instructions will be sent to the email and WhatsApp number provided during registration before the live event.</p></details><details><summary>When is my certificate available?</summary><p>Eligible certificates become available 24 hours after the event completion time, after payment and participation checks.</p></details><details><summary>Are event fees refundable?</summary><p>Fees are generally non-refundable after registration, subject to applicable law and the published Refund and Cancellation Policy.</p></details><details><summary>Will the session be recorded?</summary><p>The event page will state whether recording is planned. Participants receive a recording notice before joining.</p></details></div></section>
      <section className="contact-section" id="contact"><div className="contact-card"><div className="contact-card-head"><span className="kicker">Contact us</span><h2>Send us your query</h2><p>Share a few details and your question — we’ll reply by email.</p></div><a className="query-button" href="mailto:help@nsos.live?subject=NSOS%20query">Open the query form</a><div className="contact-divider"><span>OR REACH US DIRECTLY</span></div><div className="direct-contact"><a href="tel:+917075729458"><span className="contact-icon">⌕</span><span><small>PHONE</small><strong>+91 70757 29458</strong></span></a><a href="mailto:help@nsos.live"><span className="contact-icon">✉</span><span><small>EMAIL</small><strong>help@nsos.live</strong></span></a></div></div><div className="instagram-card"><div className="instagram-label"><span>◎</span> FOLLOW US ON INSTAGRAM</div><a className="instagram-qr" href="https://instagram.com/nsos.live" target="_blank" rel="noreferrer"><img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https%3A%2F%2Finstagram.com%2Fnsos.live" alt="Scan to follow NSOS on Instagram" width="240" height="240" /></a><a className="instagram-handle" href="https://instagram.com/nsos.live" target="_blank" rel="noreferrer">@<strong>NSOS.LIVE</strong></a><p>Scan with your camera to follow us</p></div></section>
      <div className="legal-nav"><span>Legal</span><nav aria-label="Legal navigation"><a href="/terms-and-conditions">Terms and Conditions</a><a href="/privacy-policy">Privacy Policy</a><a href="/refund-and-cancellation-policy">Refund Policy</a><a href="/cookie-policy">Cookie Policy</a><a href="/certification-policy">Certification Policy</a><a href="/intellectual-property-policy">Intellectual Property Policy</a><a href="/code-of-conduct">Code of Conduct</a><a href="/accessibility">Accessibility</a><a href="/disclaimer">Disclaimer</a><a href="/grievance-redressal">Grievance Redressal</a><a href="/sitemap">Sitemap</a></nav></div>
      <footer className="site-footer">
        <a className="make-in-india" href="https://www.makeinindia.com/" target="_blank" rel="noreferrer" aria-label="Visit Make in India">
          <img src="/make-in-india.jpg" alt="Make in India" width="210" height="70" />
        </a>
        <p className="footer-legal"><a href="https://www.nsos.live/" target="_blank" rel="noreferrer">Namahmi School of Skills</a> is a professional skill-development initiative operated by <a href="https://www.namahmilabs.com/" target="_blank" rel="noreferrer">Namahmi Labs Private Limited</a>.<span aria-hidden="true"> · </span>© 2026 Namahmi Labs Private Limited. All rights reserved.</p>
      </footer>
      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} onEnroll={() => { setSelected(null); setCheckout(selected); }} />}
      {checkout && <Checkout event={checkout} onClose={() => setCheckout(null)} />}
      {showCertificate && <CertificateAccess onClose={() => setShowCertificate(false)} template={certificateTemplate} />}
    </main>
  );
}

function EventDetail({ event, onClose, onEnroll }: { event: EventRecord; onClose: () => void; onEnroll: () => void }) {
  useEscapeClose(onClose);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="detail-modal" role="dialog" aria-modal="true" aria-label={event.title}><button className="modal-close" onClick={onClose} aria-label="Close event details">×</button><div className={`detail-hero ${event.theme}`}><span>{event.eyebrow}</span><h2>{event.title}</h2><p>{event.date} · {event.time}</p></div><div className="detail-body"><div><span className="kicker">What you will learn</span><p>{event.description}</p><ul><li>Turn ambiguity into a clear, testable direction</li><li>Use AI as a thoughtful collaborator—not a shortcut</li><li>Leave with templates you can use the next morning</li></ul>{event.speakerName && <div className="speaker-profile"><div className="speaker-avatar">{event.speakerPhoto ? <img src={event.speakerPhoto} alt={event.speakerName} /> : event.speakerName.split(" ").map((part) => part[0]).join("").slice(0,2)}</div><div><span className="kicker">Industry expert</span><h3>{event.speakerName}</h3><strong>{event.speakerTitle}</strong><small>{event.speakerExperience}</small><p>{event.speakerBio}</p></div></div>}<h3>Designed for</h3><p>Product professionals, program leaders, operators, and founders who want a practical working session.</p><div className="recording-notice"><strong>Recording notice</strong><p>This session may be recorded for educational delivery, revision, quality review and internal documentation. The recording may capture participant names, voices, video, questions and chat messages. By joining and participating, you acknowledge this recording notice. Public promotional use of identifiable participant content will require appropriate permission.</p></div></div><aside><span>Live online event</span><strong>{inr.format(event.price)}</strong><del>{inr.format(event.mrp)}</del><button className="primary" onClick={onEnroll}>Reserve your seat</button><button className="calendar-button" onClick={() => downloadCalendar(event)}>Add to calendar</button><small>No refunds · Secure checkout</small><dl><div><dt>Duration</dt><dd>{event.duration}</dd></div><div><dt>Format</dt><dd>{event.format}</dd></div><div><dt>Timezone</dt><dd>Asia/Kolkata</dd></div><div><dt>Seats left</dt><dd>{event.seats}</dd></div></dl></aside></div></section></div>;
}

function downloadCalendar(event: EventRecord) {
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NSOS//Events//EN", "BEGIN:VEVENT", `UID:nsos-${event.id}@nsos.live`, `SUMMARY:${event.title}`, `DESCRIPTION:${event.description.replace(/\n/g, " ")}`, `DTSTART:${event.date.replace(/[^0-9A-Z]/gi, "")}`, `LOCATION:${event.format}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar" })); const link = document.createElement("a"); link.href = url; link.download = `nsos-event-${event.id}.ics`; link.click(); URL.revokeObjectURL(url);
}

function useEscapeClose(onClose: () => void) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => { const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]'); if (existing) { existing.addEventListener("load", () => resolve(true), { once: true }); existing.addEventListener("error", () => resolve(false), { once: true }); return; } const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.head.appendChild(script); });
}

function Checkout({ event, onClose }: { event: EventRecord; onClose: () => void }) {
  useEscapeClose(onClose);
  const [step, setStep] = useState<"details" | "payment">("details");
  const [paid, setPaid] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [registration, setRegistration] = useState({ legalName: "", dob: "", countryCode: "+91", whatsapp: "", email: "", occupation: "" });
  const total = event.price;
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function captureDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setRegistration({ legalName: String(data.get("legalName")), dob: String(data.get("dob")), countryCode: String(data.get("countryCode")), whatsapp: String(data.get("whatsapp")), email: String(data.get("email")), occupation: String(data.get("occupation")) });
    setStep("payment");
  }
  async function pay(e: FormEvent) {
    e.preventDefault();
    setPaymentLoading(true); setPaymentError("");
    const scriptReady = await loadRazorpay();
    if (!scriptReady || !window.Razorpay) { setPaymentLoading(false); setPaymentError("Razorpay Checkout could not be loaded. Please try again."); return; }
    const response = await fetch("/api/payments/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...registration, eventId: event.id }) });
    if (!response.ok) { const failure = await response.json().catch(() => ({error:"Payment could not be started"})); setPaymentLoading(false); setPaymentError(String(failure.error)); return; }
    const order = await response.json() as {keyId:string;enrollmentId:number;orderId:string;amount:number;currency:string;eventTitle:string};
    const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "Namahmi School of Skills", description: order.eventTitle, order_id: order.orderId, prefill: { name: registration.legalName, email: registration.email, contact: `${registration.countryCode}${registration.whatsapp}` }, theme: { color: "#176da9" }, handler: async (payment: unknown) => { const verification = await fetch("/api/payments/verify", { method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ ...(payment as Record<string,unknown>), enrollmentId: order.enrollmentId }) }); setPaymentLoading(false); if (verification.ok) setPaid(true); else setPaymentError("Payment response could not be verified. Please contact support with your payment ID."); }, modal: { ondismiss: () => setPaymentLoading(false) } });
    checkout.open();
  }
  return <div className="modal-backdrop"><section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Event enrollment"><button className="modal-close" onClick={onClose} aria-label="Close enrollment">×</button>{paid ? <div className="success"><span>✓</span><h2>Payment verified. Your seat is reserved.</h2><p>Test payment confirmation has been verified for <strong>{registration.legalName}</strong> to attend <strong>{event.title}</strong>. The enrollment is now marked paid.</p><button className="primary" onClick={onClose}>Back to events</button></div> : <><div className="checkout-head"><span className="kicker">Secure enrollment · Step {step === "details" ? "1 of 2" : "2 of 2"}</span><h2>{step === "details" ? "Participant details" : "Review & pay"}</h2><p>{event.title}</p></div>{step === "details" ? <form onSubmit={captureDetails}><label>Legal name <small>This exact name will be used for certificate issuance.</small><input name="legalName" required autoComplete="name" placeholder="As shown on your official ID" /></label><label>Date of birth <small>Required later to securely retrieve your certificate.</small><input name="dob" required type="date" autoComplete="bday" /></label><label>WhatsApp number</label><div className="phone-field"><label><span className="sr-only">Country code</span><select name="countryCode" defaultValue="+91" aria-label="WhatsApp country code"><option value="+91">🇮🇳 +91</option><option value="+1">🇺🇸 +1</option><option value="+44">🇬🇧 +44</option><option value="+971">🇦🇪 +971</option><option value="+65">🇸🇬 +65</option><option value="+61">🇦🇺 +61</option><option value="+1">🇨🇦 +1</option><option value="+49">🇩🇪 +49</option></select></label><label><span className="sr-only">WhatsApp number</span><input name="whatsapp" required inputMode="numeric" pattern="[0-9]{7,15}" autoComplete="tel" placeholder="9876543210" /></label></div><label>Email ID<input name="email" required type="email" autoComplete="email" placeholder="you@company.com" /></label><label>Occupation<select name="occupation" required defaultValue=""><option value="" disabled>Select your occupation</option><option>Student</option><option>Working Professional</option><option>Founder / Entrepreneur</option><option>Self-employed / Freelancer</option><option>Educator / Trainer</option><option>Job Seeker</option><option>Other</option></select></label><button className="primary proceed-button" type="submit">Proceed to payment →</button></form> : <form onSubmit={pay}><div className="participant-summary"><div><span>Certificate name</span><strong>{registration.legalName}</strong></div><div><span>WhatsApp</span><strong>{registration.countryCode} {registration.whatsapp}</strong></div><div><span>Email</span><strong>{registration.email}</strong></div><button type="button" onClick={() => setStep("details")}>Edit details</button></div><div className="payment-summary"><div><span>Event fee</span><strong>{money.format(event.price)}</strong></div><div><span>Tax</span><strong>Not charged</strong></div><div className="payment-total"><span>Total payable</span><strong>{money.format(total)}</strong></div></div><small className="tax-note">GST is not collected while the business is not GST registered. Tax treatment must be updated if registration status changes.</small><label className="consent-check"><input required type="checkbox"/><span>By registering and making payment, I confirm that I have read and agree to the <a href="/terms-and-conditions" target="_blank">Terms and Conditions</a>, <a href="/privacy-policy" target="_blank">Privacy Policy</a> and <a href="/refund-and-cancellation-policy" target="_blank">Refund and Cancellation Policy</a>. I understand that fees are generally non-refundable after registration, subject to applicable law.</span></label>{paymentError && <div className="certificate-error"><strong>Payment unavailable</strong><p>{paymentError}</p></div>}<button className="razorpay" type="submit" disabled={paymentLoading}>{paymentLoading ? "Opening secure checkout…" : `Pay ${money.format(total)} securely`}<span>Razorpay · TEST MODE</span></button></form>}</>}</section></div>;
}

function CertificateAdmin({ template, onTemplate }: { template: string; onTemplate: (name: string) => void }) {
  async function uploadTemplate(file?: File) { if (!file) return; const body = new FormData(); body.set("file", file); body.set("purpose", "certificate-templates"); const response = await fetch("/api/uploads", {method:"POST",body}); if (response.ok) onTemplate(file.name); }
  return <section className="certificate-admin"><div className="dashboard-heading"><div><span className="kicker">Certificate operations</span><h1>Certificate template</h1><p>One approved PDF template is used for every eligible certificate.</p></div></div><div className="certificate-admin-grid"><article className="template-card"><span className="pdf-badge">PDF</span><div><small>ACTIVE TEMPLATE</small><h2>{template}</h2><p>The system fills the student name, event name, completion date and unique certificate number into this template.</p></div><strong>Active</strong></article><label className="template-upload"><span>↑</span><strong>Replace certificate template</strong><small>Upload a PDF with clear space for dynamic certificate fields. The file is stored securely in R2.</small><input type="file" accept="application/pdf,.pdf" onChange={(e) => uploadTemplate(e.target.files?.[0])} /></label></div><div className="certificate-rules"><h2>Issuance rules</h2><div><span>01</span><p><strong>Paid enrollment</strong>Payment must be confirmed before the participant becomes eligible.</p></div><div><span>02</span><p><strong>Completion window</strong>Download unlocks 24 hours after the event completion time.</p></div><div><span>03</span><p><strong>Identity match</strong>Legal name, email, date of birth and WhatsApp number must all match the enrollment record.</p></div></div></section>;
}

function EnrollmentAdmin() {
  const [rows, setRows] = useState<Array<{id:number;eventId:number;name:string;email:string;phone:string;amount:number;paymentStatus:string;attendanceStatus:string;createdAt:string}>>([]);
  useEffect(() => { fetch("/api/enrollments").then(async (response) => response.ok ? response.json() : []).then(setRows).catch(() => undefined); }, []);
  function exportCsv() { const csv = ["Name,Email,WhatsApp,Event,Amount,Payment,Attendance,Registered", ...rows.map((row) => [row.name,row.email,row.phone,row.eventId,row.amount,row.paymentStatus,row.attendanceStatus,row.createdAt].map((value) => `"${String(value).replace(/"/g,'""')}"`).join(","))].join("\n"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); const link=document.createElement("a");link.href=url;link.download="nsos-enrollments.csv";link.click();URL.revokeObjectURL(url); }
  return <section className="enrollment-admin"><div className="dashboard-heading"><div><span className="kicker">Enrollment operations</span><h1>Enrollments</h1><p>Registrations and their server-verified payment status appear here.</p></div><button className="secondary" disabled={!rows.length} onClick={exportCsv}>Export CSV</button></div>{rows.length ? <div className="enrollment-table"><div className="enrollment-table-head"><span>Student</span><span>Contact</span><span>Amount</span><span>Payment</span><span>Attendance</span></div>{rows.map((row) => <article key={row.id}><div><strong>{row.name}</strong><small>Event #{row.eventId}</small></div><div><span>{row.email}</span><small>{row.phone}</small></div><strong>{inr.format(row.amount)}</strong><span className={`status ${row.paymentStatus === "paid" ? "published" : "draft"}`}>{row.paymentStatus}</span><span>{row.attendanceStatus}</span></article>)}</div> : <div className="empty-state"><span>◎</span><h2>No enrollments yet</h2><p>New registrations will appear here. Payment remains “created” until Razorpay confirms it through a production webhook.</p></div>}</section>;
}

function escapePdf(value: string) { return value.replace(/[\\()]/g, "\\$&"); }
function makeCertificatePdf(certificate: {name:string;event:string;date:string;certificateId:string}) {
  const lines = ["NAMAHMI SCHOOL OF SKILLS", "CERTIFICATE OF COMPLETION", "This certificate is proudly presented to", certificate.name, `for successfully completing ${certificate.event}`, `Completed on ${certificate.date}`, `Certificate ID: ${certificate.certificateId}`];
  const commands = ["BT", "/F1 18 Tf", "72 500 Td", ...lines.flatMap((line, index) => index === 0 ? [`(${escapePdf(line)}) Tj`] : ["0 -48 Td", `(${escapePdf(line)}) Tj`]), "ET"].join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, "0") + " 00000 n ").join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a"); link.href = url; link.download = `${certificate.name.replace(/\s+/g, "-").toLowerCase()}-nsos-certificate.pdf`; link.click(); URL.revokeObjectURL(url);
}

function CertificateAccess({ onClose, template }: { onClose: () => void; template: string }) {
  useEscapeClose(onClose);
  const [result, setResult] = useState<"idle" | "eligible" | "invalid">("idle");
  const [certificate, setCertificate] = useState<{name:string;event:string;date:string;certificateId:string} | null>(null);
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const response = await fetch("/api/certificates/verify", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(data))});
    const found = response.ok ? await response.json() : {eligible:false};
    if (found.eligible) { setCertificate(found); setResult("eligible"); } else setResult("invalid");
  }
  return <div className="modal-backdrop"><section className="checkout-modal certificate-modal" role="dialog" aria-modal="true" aria-label="Certificate verification"><button className="modal-close" onClick={onClose} aria-label="Close certificate verification">×</button><div className="checkout-head"><span className="kicker">Secure certificate retrieval</span><h2>Download your certificate</h2><p>Available 24 hours after your event is completed.</p></div>{result === "eligible" && certificate ? <div className="certificate-result success"><span>✓</span><h2>Certificate verified</h2><p>Your paid enrollment, attendance and eligibility window have been verified.</p><div><small>{certificate.event}</small><strong>{certificate.name}</strong><span>{certificate.certificateId}</span></div><button className="primary" onClick={() => makeCertificatePdf(certificate)}>Download certificate PDF ↓</button><small>Generated using {template}</small></div> : <form onSubmit={verify}><label>Legal name<input required name="name" autoComplete="name" placeholder="As entered during enrollment" /></label><label>Email ID<input required name="email" type="email" autoComplete="email" placeholder="Enrollment email" /></label><label>Date of birth<input required name="dob" type="date" autoComplete="bday" /></label><label>WhatsApp number<input required name="whatsapp" inputMode="numeric" pattern="[0-9]{7,15}" placeholder="Number without country code" /></label>{result === "invalid" && <div className="certificate-error"><strong>Certificate not available</strong><p>We could not confirm an eligible paid enrollment from the details provided. Check your information or contact help@nsos.live.</p></div>}<button className="primary proceed-button" type="submit">Verify eligibility</button></form>}</section></div>;
}

function EventEditor({ event, onClose, onSave }: { event: EventRecord | null; onClose: () => void; onSave: (event: EventRecord) => void | Promise<void> }) {
  const [status, setStatus] = useState<Status>(event?.status ?? "Draft");
  const [saving, setSaving] = useState(false);
  useEscapeClose(onClose);
  async function upload(file: File | null, purpose: string, fallback?: string) {
    if (!file?.size) return fallback;
    const body = new FormData(); body.set("file", file); body.set("purpose", purpose);
    const response = await fetch("/api/uploads", { method: "POST", body });
    if (!response.ok) throw new Error("Upload failed");
    return String((await response.json()).key);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const data = new FormData(e.currentTarget);
    try {
      const [image, ppt, recording, speakerPhoto] = await Promise.all([upload(data.get("image") as File, "event-images", event?.image), upload(data.get("ppt") as File, "presentations", event?.ppt), upload(data.get("recording") as File, "recordings", event?.recording), upload(data.get("speakerPhoto") as File, "speaker-photos", event?.speakerPhoto)]);
      await onSave({ id: event?.id ?? Date.now(), eyebrow: String(data.get("type") || "Live workshop"), title: String(data.get("title")), description: String(data.get("description")), date: String(data.get("date") || "DATE TBA").toUpperCase(), time: String(data.get("time") || "TIME TBA"), duration: String(data.get("duration") || "90 minutes"), format: String(data.get("format") || "Live on Zoom"), level: String(data.get("level") || "All levels"), mrp: Number(data.get("mrp")), price: Number(data.get("price")), seats: Number(data.get("seats") || 30), status, theme: event?.theme ?? "blue", image, ppt, recording, speakerName: String(data.get("speakerName") || ""), speakerTitle: String(data.get("speakerTitle") || ""), speakerExperience: String(data.get("speakerExperience") || ""), speakerBio: String(data.get("speakerBio") || ""), speakerPhoto });
    } catch { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="editor-modal" role="dialog" aria-modal="true" aria-label={event ? "Edit event" : "Create event"}><div className="editor-head"><div><span className="kicker">{event ? "Update event" : "New event"}</span><h2>{event ? "Edit learning experience" : "Create a learning experience"}</h2></div><button className="modal-close static" onClick={onClose} aria-label="Close editor">×</button></div><form onSubmit={submit}><div className="editor-grid"><div className="fields"><label>Event title<input name="title" required defaultValue={event?.title} placeholder="e.g. Build AI Products People Trust" /></label><label>Short description<textarea name="description" required rows={5} defaultValue={event?.description} placeholder="What will people learn and why does it matter?" /></label><div className="two-col"><label>Event type<input name="type" defaultValue={event?.eyebrow} placeholder="Live masterclass" /></label><label>Date<input name="date" type="date" required defaultValue={event?.date.match(/^\d{4}-/) ? event.date : ""} /></label></div><div className="three-col"><label>Time<input name="time" type="time" required defaultValue={event?.time.match(/^\d{2}:/) ? event.time.slice(0,5) : ""} /></label><label>Duration<input name="duration" defaultValue={event?.duration} placeholder="120 minutes" /></label><label>Format<input name="format" defaultValue={event?.format ?? "Live on Zoom"} /></label></div><div className="three-col"><label>MRP (₹)<input name="mrp" type="number" min="0" required defaultValue={event?.mrp} /></label><label>Offer price (₹)<input name="price" type="number" min="0" required defaultValue={event?.price} /></label><label>Seats<input name="seats" type="number" min="1" defaultValue={event?.seats ?? 30} /></label></div><div className="speaker-fields"><h3>Industry expert</h3><div className="two-col"><label>Speaker name<input name="speakerName" defaultValue={event?.speakerName} /></label><label>Designation<input name="speakerTitle" defaultValue={event?.speakerTitle} /></label></div><label>Experience<input name="speakerExperience" defaultValue={event?.speakerExperience} placeholder="e.g. 15+ years in AI product leadership" /></label><label>Speaker bio<textarea name="speakerBio" rows={4} defaultValue={event?.speakerBio} /></label><label>Profile picture<input name="speakerPhoto" type="file" accept="image/png,image/jpeg,image/webp" /></label></div></div><aside className="upload-panel"><label className="dropzone"><span>＋</span><strong>Event picture</strong><small>PNG, JPG or WebP</small><input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Presentation<input name="ppt" type="file" accept=".ppt,.pptx,.pdf" /></label><label>Session recording<input name="recording" type="file" accept="video/*" /></label><div className="mock-warning"><b>Secure storage</b><p>New files are uploaded to private R2 storage. Existing files remain unchanged unless replaced.</p></div></aside></div><div className="editor-actions"><button type="button" className="discard" onClick={onClose}>Discard</button><button disabled={saving} type="submit" className="secondary" onClick={() => setStatus("Draft")}>Save as draft</button><button disabled={saving} type="submit" className="primary" onClick={() => setStatus("Published")}>{saving ? "Saving…" : event ? "Update & publish" : "Publish event"}</button></div></form></section></div>;
}
