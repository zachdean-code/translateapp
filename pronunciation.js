function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sanitizeForSpeech(text) {
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/[.,;:!?()\"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePronunciationStyle(text) {
  return (text || "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function hasPronunciationSupport(sourceLanguage, targetLanguage) {
  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  return (
    (source.includes("spanish") && target.includes("english")) ||
    (source.includes("english") && target.includes("spanish"))
  );
}

function englishPronunciationForSpanishReader(text) {
  const specialWords = {
    "how": "jau",
    "are": "ar",
    "you": "yu",
    "hello": "jelou"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/th/g, "d")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u");
    })
    .filter(Boolean)
    .join(" ");
}

function spanishPronunciationForEnglishReader(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if (!clean) return "";

      return clean
        .replace(/ll/g, "y")
        .replace(/ñ/g, "ny")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");
    })
    .filter(Boolean)
    .join(" ");
}

function buildPronunciation(text, sourceLanguage, targetLanguage) {
  if (!text || !hasPronunciationSupport(sourceLanguage, targetLanguage)) return "";

  const source = normalize(sourceLanguage);
  const target = normalize(targetLanguage);

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(text);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(text);
  }

  return "";
}
