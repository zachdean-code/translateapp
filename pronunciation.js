function sanitizeForSpeech(text) {
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/[.,;:!?()"']/g, "")
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

  if (source.includes("spanish") && target.includes("english")) return true;
  if (source.includes("english") && target.includes("spanish")) return true;

  return false;
}

function englishPronunciationForSpanishReader(text) {
  const specialWords = {
    "how": "jau",
    "are": "ar",
    "you": "yu",
    "hello": "jelou",
    "friend": "frend",
    "weather": "ueder",
    "today": "tudei",
    "what": "uat",
    "is": "is",
    "the": "de"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/tion/g, "shon")
        .replace(/sion/g, "shon")
        .replace(/ough/g, "ou")
        .replace(/augh/g, "au")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/ph/g, "f")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/ea/g, "i");
    })
    .filter(Boolean)
    .join(" ");
}

function spanishPronunciationForEnglishReader(text) {
  const specialWords = {
    "hola": "oh-LAH",
    "parcero": "par-SEH-roh",
    "gracias": "GRAH-syahs",
    "donde": "DOHN-deh",
    "esta": "ehs-TAH",
    "el": "ehl",
    "bano": "BAHN-yoh",
    "necesito": "neh-seh-SEE-toh",
    "hablar": "ah-BLAR",
    "contigo": "kohn-TEE-goh",
    "como": "KOH-moh",
    "estas": "ehs-TAHS",
    "clima": "KLEE-mah",
    "hoy": "oy",
    "puedo": "PWEH-doh",
    "obtener": "ob-teh-NEHR",
    "mi": "mee",
    "actualizacion": "ahk-too-ah-lee-sah-SYOHN",
    "actualización": "ahk-too-ah-lee-sah-SYOHN",
    "una": "oo-nah",
    "mejora": "meh-HOH-rah"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const raw = word.replace(/[^\p{L}]/gu, "");
      const clean = normalize(raw).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/que/g, "keh")
        .replace(/qui/g, "kee")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/ll/g, "y")
        .replace(/ñ/g, "ny")
        .replace(/ch/g, "ch")
        .replace(/j/g, "h")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");
    })
    .filter(Boolean)
    .join(" ");
}

function buildPronunciation(translatedText, sourceLanguage, targetLanguage) {
  if (!translatedText) return "";
  if (!hasPronunciationSupport(sourceLanguage, targetLanguage)) return "";

  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(translatedText);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return "";
}      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/tion/g, "shon")
        .replace(/sion/g, "shon")
        .replace(/ough/g, "ou")
        .replace(/augh/g, "au")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/ph/g, "f")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/ea/g, "i");
    })
    .filter(Boolean)
    .join(" ");
}

function spanishPronunciationForEnglishReader(text) {
  const specialWords = {
    "hola": "oh-LAH",
    "parcero": "par-SEH-roh",
    "gracias": "GRAH-syahs",
    "donde": "DOHN-deh",
    "esta": "ehs-TAH",
    "el": "ehl",
    "bano": "BAHN-yoh",
    "necesito": "neh-seh-SEE-toh",
    "hablar": "ah-BLAR",
    "contigo": "kohn-TEE-goh",
    "como": "KOH-moh",
    "estas": "ehs-TAHS",
    "clima": "KLEE-mah",
    "hoy": "oy",
    "puedo": "PWEH-doh",
    "obtener": "ob-teh-NEHR",
    "mi": "mee",
    "actualizacion": "ahk-too-ah-lee-sah-SYOHN",
    "actualización": "ahk-too-ah-lee-sah-SYOHN",
    "una": "oo-nah",
    "mejora": "meh-HOH-rah"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const raw = word.replace(/[^\p{L}]/gu, "");
      const clean = normalize(raw).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/que/g, "keh")
        .replace(/qui/g, "kee")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/ll/g, "y")
        .replace(/ñ/g, "ny")
        .replace(/ch/g, "ch")
        .replace(/j/g, "h")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");
    })
    .filter(Boolean)
    .join(" ");
}

function buildPronunciation(translatedText, sourceLanguage, targetLanguage) {
  if (!translatedText) return "";

  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(translatedText);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return "";
}
