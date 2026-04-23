// === API ===
const API_URL = "https://translateapp-1.onrender.com/translate";

// === ELEMENTS ===
const siteLanguage = document.getElementById("siteLanguage");
const darkModeButton = document.getElementById("darkModeButton");

const userInput = document.getElementById("userInput");
const detectedCard = document.getElementById("detectedCard");
const detectedLanguageDialect = document.getElementById("detectedLanguageDialect");
const keepDetectedButton = document.getElementById("keepDetectedButton");
const changeDetectedButton = document.getElementById("changeDetectedButton");
const changeDetectedWrap = document.getElementById("changeDetectedWrap");
const detectedSearch = document.getElementById("detectedSearch");

const contextToggle = document.getElementById("contextToggle");
const contextSection = document.getElementById("contextSection");
const contextAudience = document.getElementById("contextAudience");
const contextTone = document.getElementById("contextTone");
const contextSituation = document.getElementById("contextSituation");

const targetSearch = document.getElementById("targetSearch");
const translateButton = document.getElementById("translateButton");

const output = document.getElementById("output");
const copyButton = document.getElementById("copyButton");

const pronToggle = document.getElementById("pronToggle");
const pronunciationSection = document.getElementById("pronunciationSection");
const pronunciation = document.getElementById("pronunciation");
const speakNormal = document.getElementById("speakNormal");
const speakSlow = document.getElementById("speakSlow");

const contextOutputSection = document.getElementById("contextOutputSection");
const contextOutput = document.getElementById("contextOutput");

const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");

// === STATE ===
let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;

// === HELPERS ===
function el(id) {
  return document.getElementById(id);
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function showElement(node, displayValue = "block") {
  if (!node) return;
  node.classList.remove("hidden");
  node.hidden = false;
  node.style.display = displayValue;
}

function hideElement(node) {
  if (!node) return;
  node.classList.add("hidden");
  node.hidden = true;
  node.style.display = "none";
}

function setSectionDisabled(section, disabled) {
  if (!section) return;
  const controls = section.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function isSpanishUI() {
  return (siteLanguage?.value || "en") === "es";
}

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

function setAdditionalInfo(text) {
  const clean = (text || "").trim();
  additionalInfo.value = clean;

  if (clean) {
    showElement(additionalInfoSection, "flex");
  } else {
    hideElement(additionalInfoSection);
  }
}

function clearResults() {
  output.value = "";
  contextOutput.value = "";
  pronunciation.value = "";
  additionalInfo.value = "";

  hideElement(contextOutputSection);
  hideElement(pronunciationSection);
  hideElement(additionalInfoSection);
}

function updateTranslateButtonState() {
  const hasInput = !!(userInput?.value || "").trim();
  const hasTarget = !!(targetSearch?.value || "").trim();
  const hasDetected = !!confirmedInputLanguage;

  if (translateButton) {
    translateButton.disabled = !(hasInput && hasTarget && hasDetected);
  }
}

// === TARGET LANGUAGE / DIALECT MAPPING ===
function getTargetConfig(raw) {
  const value = normalize(raw);

  const map = {
    english: { targetLanguage: "English", dialect: "American English" },
    en: { targetLanguage: "English", dialect: "American English" },
    "american english": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },

    spanish: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    es: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    espanol: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    español: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    latam: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latam spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latin american spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "spanish — latam (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },

    "spanish — mexican": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "mexican spanish": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },

    "spanish — central american": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "central american spanish": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },

    "spanish — caribbean": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "caribbean spanish": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },

    "spanish — peruvian": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "peruvian spanish": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },

    "spanish — argentine": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "argentine spanish": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },

    "spanish — chilean": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "chilean spanish": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },

    "spanish — general colombian": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "general colombian spanish": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "colombian spanish": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },

    "spanish — venezuelan": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },
    "venezuelan spanish": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },

    "colombian spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "paisa spanish (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "medellin spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    paisa: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },

    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "rolo spanish (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "bogota spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    rolo: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },

    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "cali spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    cali: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },

    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    "santander spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    santander: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    french: { targetLanguage: "French", dialect: "Standard" },
    german: { targetLanguage: "German", dialect: "Standard" },
    italian: { targetLanguage: "Italian", dialect: "Standard" },

    portuguese: { targetLanguage: "Portuguese", dialect: "Standard" },
    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    arabic: { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    farsi: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    persian: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    dari: { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    tajik: { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    hindi: { targetLanguage: "Hindi", dialect: "Standard" },
    indonesian: { targetLanguage: "Indonesian", dialect: "Standard" },
    filipino: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    tagalog: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    swahili: { targetLanguage: "Swahili", dialect: "Standard" },
    amharic: { targetLanguage: "Amharic", dialect: "Standard" },
    turkish: { targetLanguage: "Turkish", dialect: "Standard" },
    russian: { targetLanguage: "Russian", dialect: "Standard" },
    japanese: { targetLanguage: "Japanese", dialect: "Standard" },
    korean: { targetLanguage: "Korean", dialect: "Standard" },
    chinese: { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" }
  };

  return map[value] || {
    targetLanguage: raw.trim() || "English",
    dialect: "Standard"
  };
}

// === CONTEXT MAPPING ===
function getToneValue() {
  if (!contextToggle?.checked) return "natural";

  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };

  return map[contextTone?.value] || "natural";
}

function getAudienceValue() {
  if (!contextToggle?.checked) return "general";

  const map = {
    friend: "friend",
    romantic: "romantic interest",
    professional: "boss or professional contact",
    stranger: "stranger",
    service: "service employee"
  };

  return map[contextAudience?.value] || "general";
}

function getGoalValue() {
  if (!contextToggle?.checked) return "translate accurately";

  const map = {
    travel: "communicate clearly for travel or logistics",
    business: "communicate professionally and clearly",
    social: "communicate naturally and smoothly",
    conflict: "resolve tension clearly and effectively",
    flirting: "communicate with chemistry and natural attraction"
  };

  return map[contextSituation?.value] || "translate accurately";
}

// === THEME ===
function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  if (darkModeButton) {
    if (isSpanishUI()) {
      darkModeButton.textContent = isDark ? "☀️ Claro" : "🌙 Oscuro";
    } else {
      darkModeButton.textContent = isDark ? "☀️ Light" : "🌙 Dark";
    }
  }

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  darkModeButton?.addEventListener("click", () => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    applyTheme(currentlyDark ? "light" : "dark");
  });
}

// === CONTEXT UI ===
function updateContextVisibility() {
  if (contextToggle?.checked) {
    showElement(contextSection, "grid");
    setSectionDisabled(contextSection, false);
  } else {
    hideElement(contextSection);
    setSectionDisabled(contextSection, true);
    contextAudience.value = "";
    contextTone.value = "";
    contextSituation.value = "";
  }
}

// === PRONUNCIATION ===
function englishPronunciationForSpanishReader(text) {
  const specialWords = {
    how: "jau",
    are: "ar",
    you: "yu",
    hello: "jelou",
    friend: "frend",
    weather: "ueder",
    today: "tudei",
    what: "uat",
    is: "is",
    the: "de"
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
    hola: "oh-LAH",
    parcero: "par-SEH-roh",
    gracias: "GRAH-syahs",
    donde: "DOHN-deh",
    esta: "ehs-TAH",
    el: "ehl",
    bano: "BAHN-yoh",
    necesito: "neh-seh-SEE-toh",
    hablar: "ah-BLAR",
    contigo: "kohn-TEE-goh",
    como: "KOH-moh",
    estas: "ehs-TAHS",
    clima: "KLEE-mah",
    hoy: "oy",
    puedo: "pweh-DOH",
    tener: "teh-NEHR",
    una: "oo-nah",
    mejora: "meh-HOH-rah"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const raw = word.replace(/[^\p{L}]/gu, "");
      const clean = normalize(raw).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      let out = clean
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

      out = out
        .replace(/([a-z]{2,})(ah|eh|ee|oh|oo)/gi, "$1-$2")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      return out;
    })
    .filter(Boolean)
    .join(" ");
}

function buildPronunciation(translatedText, sourceLanguage, targetLanguage) {
  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if (!translatedText) return "";

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(translatedText);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return "";
}

function updatePronunciationVisibility() {
  const shouldShow = !!pronToggle?.checked && !!output?.value.trim();

  if (shouldShow) {
    showElement(pronunciationSection, "flex");
    speakNormal.disabled = false;
    speakSlow.disabled = false;
  } else {
    hideElement(pronunciationSection);
    speakNormal.disabled = true;
    speakSlow.disabled = true;
  }
}

// === DETECTION ===
function detectInput(text) {
  const lower = normalize(text);
  const tokens = normalize(text).split(/[\s—()\/,.:;!?-]+/).filter(Boolean);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = userInput?.value.trim() || "";

  detectedSelection = null;
  confirmedInputLanguage = null;
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  if (!text) {
    detectedInputLanguage = "";
    updateTranslateButtonState();
    return;
  }

  detectedSelection = detectInput(text);
  detectedInputLanguage = detectedSelection.label;

  detectedLanguageDialect.textContent = isSpanishUI()
    ? `Idioma detectado: ${detectedInputLanguage}`
    : `Detected language: ${detectedInputLanguage}`;

  showElement(detectedCard, "block");
  updateTranslateButtonState();
}

function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  keepDetectedButton?.addEventListener("click", () => {
    if (!detectedSelection) return;
    confirmedInputLanguage = detectedSelection.label;

    detectedLanguageDialect.textContent = isSpanishUI()
      ? `Idioma confirmado: ${confirmedInputLanguage}`
      : `Input language confirmed: ${confirmedInputLanguage}`;

    hideElement(changeDetectedWrap);
    updateTranslateButtonState();
  });

  changeDetectedButton?.addEventListener("click", () => {
    showElement(changeDetectedWrap, "block");
    detectedSearch?.focus();
  });

  detectedSearch?.addEventListener("input", () => {
    const entered = detectedSearch.value.trim();
    if (!entered) return;

    confirmedInputLanguage = entered;

    detectedLanguageDialect.textContent = isSpanishUI()
      ? `Idioma elegido: ${confirmedInputLanguage}`
      : `Input language chosen: ${confirmedInputLanguage}`;

    showElement(detectedCard, "block");
    updateTranslateButtonState();
  });
}

// === TRANSLATE ===
function buildRequestPayload() {
  const targetRaw = targetSearch?.value.trim() || "";
  const targetConfig = getTargetConfig(targetRaw);
  const enhanced = !!contextToggle?.checked;

  return {
    text: userInput?.value.trim() || "",
    target: targetRaw,
    targetLanguage: targetConfig.targetLanguage,
    dialect: targetConfig.dialect,
    sourceLanguage: confirmedInputLanguage || "",
    tone: enhanced ? getToneValue() : "natural",
    audience: enhanced ? getAudienceValue() : "general",
    goal: enhanced ? getGoalValue() : "translate accurately",
    includeAdditionalInformation: true
  };
}

async function translateText() {
  const input = userInput?.value.trim();
  const target = targetSearch?.value.trim();

  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? "Confirma primero el idioma de entrada." : "Confirm input language first");
    return;
  }

  if (!input || !target) {
    alert(isSpanishUI() ? "Escribe texto y un idioma." : "Enter text and choose a language");
    return;
  }

  const button = translateButton;

  try {
    button.disabled = true;
    button.innerText = isSpanishUI() ? "Traduciendo..." : "Translating...";

    clearResults();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestPayload())
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Request failed");

    output.value = data.output || "";

    const info = data.additional_information || "";
    setAdditionalInfo(info);

    const targetConfig = getTargetConfig(target);
    const pron = buildPronunciation(output.value, confirmedInputLanguage, targetConfig.targetLanguage);
    pronunciation.value = normalizePronunciationStyle(pron);
    updatePronunciationVisibility();

  } catch (err) {
    console.error(err);
    output.value = isSpanishUI() ? "Error" : "Error";
  } finally {
    button.disabled = false;
    button.innerText = isSpanishUI() ? "Traducir" : "Translate";
    updateTranslateButtonState();
  }
}

// === COPY ===
async function copyTranslation() {
  const text = output?.value || "";

  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied translation.");
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// === INIT ===
function init() {
  initTheme();
  initDetectedLanguageUI();
  updateContextVisibility();
  updatePronunciationVisibility();
  clearResults();

  setSectionDisabled(contextSection, true);
  speakNormal.disabled = true;
  speakSlow.disabled = true;

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", translateText);
  copyButton?.addEventListener("click", copyTranslation);

  speakNormal?.addEventListener("click", () => {
    const text = sanitizeForSpeech(pronunciation?.value || output?.value || "");
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  });

  speakSlow?.addEventListener("click", () => {
    const text = sanitizeForSpeech(pronunciation?.value || output?.value || "");
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.2;
    window.speechSynthesis.speak(utterance);
  });

  userInput?.addEventListener("input", () => {
    clearResults();
    updateDetection();
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      translateText();
    }
  });

  targetSearch?.addEventListener("input", updateTranslateButtonState);
  detectedSearch?.addEventListener("input", updateTranslateButtonState);

  siteLanguage?.addEventListener("change", () => {
    applyTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

    if (detectedInputLanguage && !confirmedInputLanguage) {
      detectedLanguageDialect.textContent = isSpanishUI()
        ? `Idioma detectado: ${detectedInputLanguage}`
        : `Detected language: ${detectedInputLanguage}`;
    }

    if (confirmedInputLanguage) {
      detectedLanguageDialect.textContent = isSpanishUI()
        ? `Idioma confirmado: ${confirmedInputLanguage}`
        : `Input language confirmed: ${confirmedInputLanguage}`;
    }
  });

  updateTranslateButtonState();
}

document.addEventListener("DOMContentLoaded", init);
