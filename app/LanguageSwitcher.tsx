"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: { translate?: { TranslateElement?: new (options: Record<string, unknown>, elementId: string) => unknown } };
    nsosGoogleTranslateInit?: () => void;
  }
}

const languages = [
  ["en", "English"], ["hi", "हिन्दी"], ["kn", "ಕನ್ನಡ"], ["ta", "தமிழ்"],
  ["te", "తెలుగు"], ["ha", "Hausa"], ["yo", "Yorùbá"], ["ak", "Akan"],
] as const;

function applyLanguage(code: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  combo.value = code;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  document.documentElement.lang = code;
  return true;
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState(() => typeof window === "undefined" ? "en" : window.localStorage.getItem("nsos-language") || "en");

  useEffect(() => {
    const preferred = window.localStorage.getItem("nsos-language") || "en";
    window.nsosGoogleTranslateInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (TranslateElement && !document.querySelector(".goog-te-combo")) new TranslateElement({ pageLanguage: "en", includedLanguages: "en,hi,kn,ta,te,ha,yo,ak", autoDisplay: false }, "google_translate_element");
      window.setTimeout(() => applyLanguage(preferred), 400);
    };
    if (window.google?.translate?.TranslateElement) window.nsosGoogleTranslateInit();
    else if (!document.querySelector('script[data-nsos-translate="true"]')) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=nsosGoogleTranslateInit";
      script.async = true;
      script.dataset.nsosTranslate = "true";
      document.head.appendChild(script);
    }
  }, []);

  function change(code: string) {
    setLanguage(code);
    window.localStorage.setItem("nsos-language", code);
    if (!applyLanguage(code)) window.setTimeout(() => applyLanguage(code), 500);
  }

  return <div className="language-switcher"><span aria-hidden="true">◎</span><label><span className="sr-only">Website language</span><select value={language} onChange={(event) => change(event.target.value)} aria-label="Select website language">{languages.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label><div id="google_translate_element" aria-hidden="true" /></div>;
}
