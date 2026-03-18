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
    es: "Traducción con sensibilidad dialectal, guía de pronunciación y claridad cultural"
  },

  uiLanguageLabel: {
    en: "Site Language",
    es: "Idioma del sitio"
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

  keepDetectedButton: {
    en: "Keep",
    es: "Mantener"
  },
  changeDetectedButton: {
    en: "Change",
    es: "Cambiar"
  },

  pronunciationToggleLabel: {
    en: "Show Pronunciation",
    es: "Mostrar pronunciación"
  },

  speakNormalButton: {
    en: "Speak Normally",
    es: "Hablar normal"
  },
  speakSlowButton: {
    en: "Speak Slowly",
    es: "Hablar lento"
  }
};

function t(key, lang) {
  const group = uiTranslations[key] || {};
  return group[lang] ?? group.en ?? "";
}
