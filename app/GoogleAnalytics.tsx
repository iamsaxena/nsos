"use client";

import { useEffect, useState } from "react";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => setAllowed(window.localStorage.getItem("nsos-analytics-consent") === "accepted");
    update(); window.addEventListener("nsos-consent-change", update); return () => window.removeEventListener("nsos-consent-change", update);
  }, []);
  if (!allowed || !measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return null;

  return <>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
    <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});` }} />
  </>;
}
