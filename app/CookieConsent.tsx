"use client";

import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { queueMicrotask(() => setVisible(!window.localStorage.getItem("nsos-analytics-consent"))); }, []);
  function choose(value: "accepted" | "rejected") {
    window.localStorage.setItem("nsos-analytics-consent", value); window.dispatchEvent(new Event("nsos-consent-change")); setVisible(false);
  }
  if (!visible) return null;
  return <aside className="cookie-consent" aria-label="Analytics cookie preferences"><div><strong>Your privacy choices</strong><p>We use optional analytics to understand website usage. You can accept or decline; essential website functions remain available.</p><a href="/cookie-policy">Cookie Policy</a></div><div><button className="secondary" onClick={() => choose("rejected")}>Decline analytics</button><button className="primary" onClick={() => choose("accepted")}>Accept analytics</button></div></aside>;
}
