const uiTranslations = {
  pageTitle: {
    en: "Cross-Cultural Translator™",
    es: "Traductor Intercultural™"
  },
  pageSubtitle: {
    en: "Beyond translation — real cross-cultural communication",
    es: "Más allá de la traducción — comunicación intercultural real"
  },
  pageDescription: {
    en: "Dialect-aware translation, pronunciation guidance, and cultural clarity",
    es: "Traducción con conciencia dialectal, guía de pronunciación y claridad cultural"
  },
  uiLanguageLabel: {
    en: "Site Language",
    es: "Idioma del sitio"
  },
  darkModeButton: {
    en: "🌙 Dark",
    es: "🌙 Oscuro"
  },
  inputLabel: {
    en: "Input Text",
    es: "Texto de entrada"
  },
  detectedLanguageLabel: {
    en: "Detected Language",
    es: "Idioma detectado"
  },
  detectedDialectLabel: {
    en: "Detected Dialect",
    es: "Dialecto detectado"
  },
  confidenceLabel: {
    en: "Confidence",
    es: "Confianza"
  },
  keepDetectedButton: {
    en: "Keep",
    es: "Mantener"
  },
  changeDetectedButton: {
    en: "Change",
    es: "Cambiar"
  },
  changeDetectedLabel: {
    en: "Change Detected Language",
    es: "Cambiar idioma detectado"
  },
  translateToLabel: {
    en: "Translate To",
    es: "Traducir a"
  },
  translateButton: {
    en: "Translate",
    es: "Traducir"
  },
  translationLabel: {
    en: "Translation",
    es: "Traducción"
  },
  copyButton: {
    en: "Copy",
    es: "Copiar"
  },
  pronunciationToggleLabel: {
    en: "Show Pronunciation",
    es: "Mostrar pronunciación"
  },
  pronunciationLabel: {
    en: "Pronunciation Guide",
    es: "Guía de pronunciación"
  },
  speakSlowButton: {
    en: "Speak Slowly",
    es: "Hablar despacio"
  },
  speakNormalButton: {
    en: "Speak Normally",
    es: "Hablar normal"
  },
  footerProduct: {
    en: "Cross-Cultural Translator™",
    es: "Traductor Intercultural™"
  },
  footerTagline: {
    en: "Beyond translation — real cross-cultural communication",
    es: "Más allá de la traducción — comunicación intercultural real"
  },
  footerDescriptor: {
    en: "Dialect-aware translation • Pronunciation guidance • Cultural clarity",
    es: "Traducción con conciencia dialectal • Guía de pronunciación • Claridad cultural"
  },
  footerCopyright: {
    en: "© 2026 CCTLA-TBD, LLC",
    es: "© 2026 CCTLA-TBD, LLC"
  },
  footerPatent: {
    en: "Patent pending.",
    es: "Patente en trámite."
  }
};

function t(key, lang){
  const group = uiTranslations[key] || {};
  return group[lang] || group.en || key;
}
