// === API ===
const API_URL = "https://translateapp-1.onrender.com/translate";

// === STATE ===
let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;
let targetSelection = null;

// === HELPERS ===
function el(id) { return document.getElementById(id); }

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// === TARGET MAPPING (CRITICAL FIX) ===
function getTargetConfig(label) {
  if (!label) return { targetLanguage: "English", dialect: "Standard" };

  if (label.includes("Spanish")) {
    return { targetLanguage: "Spanish", dialect: label };
  }

  if (label.includes("English")) {
    return { targetLanguage: "English", dialect: label };
  }

  if (label.includes("Portuguese")) {
    return { targetLanguage: "Portuguese", dialect: label };
  }

  return { targetLanguage: label, dialect: "Standard" };
}

// === CONTEXT MAPPING ===
function getToneValue() {
  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };
  return map[el("contextTone")?.value] || "natural";
}

function getAudienceValue() {
  const map = {
    friend: "friend",
    romantic: "romantic interest",
    professional: "professional contact",
    stranger: "stranger",
    service: "service employee"
  };
  return map[el("contextAudience")?.value] || "general";
}

function getGoalValue() {
  const map = {
    travel: "travel communication",
    business: "professional communication",
    social: "natural conversation",
    conflict: "resolve issue clearly",
    flirting: "romantic or flirty communication"
  };
  return map[el("contextSituation")?.value] || "translate accurately";
}

// === BUILD PAYLOAD ===
function buildRequestPayload() {
  const targetLabel = targetSelection?.label || "";
  const targetConfig = getTargetConfig(targetLabel);
  const enhanced = !!el("contextToggle")?.checked;

  return {
    text: el("userInput")?.value.trim() || "",
    target: targetLabel,

    targetLanguage: targetConfig.targetLanguage,
    dialect: targetConfig.dialect,

    sourceLanguage: confirmedInputLanguage || "",

    tone: enhanced ? getToneValue() : "natural",
    audience: enhanced ? getAudienceValue() : "general",
    goal: enhanced ? getGoalValue() : "translate accurately",

    includeAdditionalInformation: true
  };
}

// === TRANSLATE ===
async function translateText() {
  const input = el("userInput")?.value.trim();
  const target = targetSelection?.label;

  if (!confirmedInputLanguage) {
    alert("Confirm input language first");
    return;
  }

  if (!input || !target) {
    alert("Enter text and choose a language");
    return;
  }

  const button = el("translateButton");
  const output = el("output");

  try {
    button.disabled = true;
    button.innerText = "Translating...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestPayload())
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    output.value = data.output || "";

    const info = data.additional_information || "";
    const infoBox = el("additionalInfo");

    if (info && infoBox) {
      infoBox.value = info;
      el("additionalInfoSection").classList.remove("hidden");
    } else {
      el("additionalInfoSection").classList.add("hidden");
    }

  } catch (err) {
    console.error(err);
    output.value = "Error";
  } finally {
    button.disabled = false;
    button.innerText = "Translate";
  }
}

// === DETECTION (simplified, keep yours if preferred) ===
function detectInput(text) {
  const t = normalize(text);

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput").value.trim();
  if (!text) return;

  detectedSelection = detectInput(text);
  confirmedInputLanguage = detectedSelection.label;
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  el("userInput")?.addEventListener("input", updateDetection);
  el("translateButton")?.addEventListener("click", translateText);
});const contextOutput = document.getElementById("contextOutput");

const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");

// === STATE ===
let selectedTargetLanguage = "";
let selectedTargetDialect = "Standard";
let detectedInputLanguage = "";
let confirmedInputLanguage = "";

// === HELPERS ===
function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function showElement(el, displayValue = "block") {
  if (!el) return;
  el.classList.remove("hidden");
  el.hidden = false;
  el.style.display = displayValue;
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.hidden = true;
  el.style.display = "none";
}

function setTextareaValue(el, value) {
  if (!el) return;
  el.value = value || "";
}

function clearSuggestions(el) {
  if (!el) return;
  el.innerHTML = "";
  hideElement(el);
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

function setAdditionalInfo(text) {
  const clean = (text || "").trim();

  setTextareaValue(additionalInfo, clean);

  if (clean) {
    showElement(additionalInfoSection, "flex");
  } else {
    hideElement(additionalInfoSection);
  }

  console.log("additional_information:", clean);
}

function clearResults() {
  setTextareaValue(output, "");
  setTextareaValue(contextOutput, "");
  setTextareaValue(pronunciation, "");
  setTextareaValue(additionalInfo, "");

  hideElement(contextOutputSection);
  hideElement(pronunciationSection);
  hideElement(additionalInfoSection);
}

function updateTranslateButtonState() {
  if (!translateButton) return;

  const hasInput = !!(userInput?.value || "").trim();
  const hasTarget = !!selectedTargetLanguage;
  const hasInputLanguage = !!(confirmedInputLanguage || detectedInputLanguage);

  translateButton.disabled = !(hasInput && hasTarget && hasInputLanguage);
}

// === TARGET LANGUAGE / DIALECT RESOLUTION ===
function resolveTargetConfig(raw) {
  const value = normalize(raw);

  const map = {
    english: { targetLanguage: "English", dialect: "American English" },
    en: { targetLanguage: "English", dialect: "American English" },
    "american english": { targetLanguage: "English", dialect: "American English" },
    "english — american": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "english — british": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },
    "english — australian": { targetLanguage: "English", dialect: "Australian English" },

    spanish: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    espanol: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    español: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    es: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    latam: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latam spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latin american spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latin american spanish (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
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
    "spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "medellin spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },

    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "rolo spanish (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "bogota spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },

    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "cali spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },

    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    "santander spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    "spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    french: { targetLanguage: "French", dialect: "Standard" },
    francais: { targetLanguage: "French", dialect: "Standard" },
    français: { targetLanguage: "French", dialect: "Standard" },
    fr: { targetLanguage: "French", dialect: "Standard" },

    german: { targetLanguage: "German", dialect: "Standard" },
    deutsch: { targetLanguage: "German", dialect: "Standard" },
    de: { targetLanguage: "German", dialect: "Standard" },

    italian: { targetLanguage: "Italian", dialect: "Standard" },
    italiano: { targetLanguage: "Italian", dialect: "Standard" },
    it: { targetLanguage: "Italian", dialect: "Standard" },

    portuguese: { targetLanguage: "Portuguese", dialect: "Standard" },
    portugues: { targetLanguage: "Portuguese", dialect: "Standard" },
    português: { targetLanguage: "Portuguese", dialect: "Standard" },
    pt: { targetLanguage: "Portuguese", dialect: "Standard" },
    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    arabic: { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    ar: { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    hindi: { targetLanguage: "Hindi", dialect: "Standard" },
    hi: { targetLanguage: "Hindi", dialect: "Standard" },

    indonesian: { targetLanguage: "Indonesian", dialect: "Standard" },
    id: { targetLanguage: "Indonesian", dialect: "Standard" },

    tagalog: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    filipino: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    tl: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },

    swahili: { targetLanguage: "Swahili", dialect: "Standard" },
    sw: { targetLanguage: "Swahili", dialect: "Standard" },

    amharic: { targetLanguage: "Amharic", dialect: "Standard" },
    am: { targetLanguage: "Amharic", dialect: "Standard" },

    farsi: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    persian: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    fa: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    "iranian persian — farsi": { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    "afghan persian — dari": { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    dari: { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    "tajik persian — tajik": { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },
    tajik: { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    turkish: { targetLanguage: "Turkish", dialect: "Standard" },
    tr: { targetLanguage: "Turkish", dialect: "Standard" },

    russian: { targetLanguage: "Russian", dialect: "Standard" },
    ru: { targetLanguage: "Russian", dialect: "Standard" },

    japanese: { targetLanguage: "Japanese", dialect: "Standard" },
    ja: { targetLanguage: "Japanese", dialect: "Standard" },

    korean: { targetLanguage: "Korean", dialect: "Standard" },
    ko: { targetLanguage: "Korean", dialect: "Standard" },

    chinese: { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    zh: { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" }
  };

  return map[value] || {
    targetLanguage: raw.trim(),
    dialect: "Standard"
  };
}

// === INPUT LANGUAGE DETECTION ===
function detectInputLanguage(text) {
  const lower = normalize(text);
  const tokens = normalize(text).split(/[\s—()\/,.:;!?-]+/).filter(Boolean);

  if (/[\u0600-\u06FF]/.test(text)) return "Modern Standard Arabic";
  if (/[\u0400-\u04FF]/.test(text)) return "Russian";
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\u4e00-\u9fff]/.test(text)) return "Mandarin Chinese";
  if (/[\uAC00-\uD7AF]/.test(text)) return "Korean";

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return "British English";
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return "Australian English";
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return "Colombian Spanish — Paisa (Medellín)";
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return "Colombian Spanish — Rolo (Bogotá)";
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return "Spanish — Mexican";
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
    return "Spanish — LATAM (Neutral)";
  }

  if (tokens.length < 2 && lower.length < 6) {
    return "";
  }

  return "American English";
}

function updateDetectedLanguageState() {
  const text = (userInput?.value || "").trim();

  detectedInputLanguage = "";
  confirmedInputLanguage = "";
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  if (!text) {
    updateTranslateButtonState();
    return;
  }

  const detected = detectInputLanguage(text);

  if (!detected) {
    updateTranslateButtonState();
    return;
  }

  detectedInputLanguage = detected;
  detectedLanguageDialect.textContent = isSpanishUI()
    ? `Idioma detectado: ${detected}`
    : `Detected language: ${detected}`;

  showElement(detectedCard, "block");
  updateTranslateButtonState();
}

// === CONTEXT ===
function getAudienceValue() {
  if (!contextToggle?.checked) return "general";

  const map = {
    friend: "friend",
    romantic: "romantic interest",
    professional: "boss or professional contact",
    stranger: "stranger",
    service: "service employee"
  };

  return map[(contextAudience?.value || "").trim()] || "general";
}

function getToneValue() {
  if (!contextToggle?.checked) return "natural";

  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };

  return map[(contextTone?.value || "").trim()] || "natural";
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

  return map[(contextSituation?.value || "").trim()] || "translate accurately";
}

function updateContextVisibility() {
  if (contextToggle?.checked) {
    showElement(contextSection, "grid");
    setSectionDisabled(contextSection, false);
  } else {
    hideElement(contextSection);
    setSectionDisabled(contextSection, true);
    if (contextAudience) contextAudience.value = "";
    if (contextTone) contextTone.value = "";
    if (contextSituation) contextSituation.value = "";
  }
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
    .map((word) => {
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
    .map((word) => {
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
  const shouldShow = !!pronToggle?.checked && !!(output?.value || "").trim();

  if (shouldShow) {
    showElement(pronunciationSection, "flex");
    if (speakNormal) speakNormal.disabled = false;
    if (speakSlow) speakSlow.disabled = false;
  } else {
    hideElement(pronunciationSection);
    if (speakNormal) speakNormal.disabled = true;
    if (speakSlow) speakSlow.disabled = true;
  }
}

// === DETECTED LANGUAGE UI ===
function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);
  clearSuggestions(detectedSuggestions);

  keepDetectedButton?.addEventListener("click", () => {
    if (detectedInputLanguage) {
      confirmedInputLanguage = detectedInputLanguage;
      detectedLanguageDialect.textContent = isSpanishUI()
        ? `Idioma confirmado: ${confirmedInputLanguage}`
        : `Input language confirmed: ${confirmedInputLanguage}`;
    }

    hideElement(changeDetectedWrap);
    updateTranslateButtonState();
  });

  changeDetectedButton?.addEventListener("click", () => {
    showElement(changeDetectedWrap, "block");
    detectedSearch?.focus();
  });

  detectedSearch?.addEventListener("input", () => {
    clearSuggestions(detectedSuggestions);

    const entered = (detectedSearch?.value || "").trim();
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
function buildRequestPayload(text) {
  return {
    text,
    targetLanguage: selectedTargetLanguage,
    dialect: selectedTargetDialect,
    sourceLanguage: confirmedInputLanguage || detectedInputLanguage || "",
    tone: getToneValue(),
    audience: getAudienceValue(),
    goal: getGoalValue(),
    includeAdditionalInformation: true
  };
}

async function runTranslation() {
  const text = (userInput?.value || "").trim();
  const targetRaw = (targetSearch?.value || "").trim();

  if (!text) {
    alert(isSpanishUI() ? "Primero escribe texto." : "Enter text first.");
    userInput?.focus();
    return;
  }

  if (!targetRaw) {
    alert(isSpanishUI() ? "Primero escribe un idioma de destino." : "Enter a target language first.");
    targetSearch?.focus();
    return;
  }

  const targetConfig = resolveTargetConfig(targetRaw);
  selectedTargetLanguage = targetConfig.targetLanguage;
  selectedTargetDialect = targetConfig.dialect;

  if (!confirmedInputLanguage && detectedInputLanguage) {
    confirmedInputLanguage = detectedInputLanguage;
  }

  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? "Primero confirma el idioma de entrada." : "Confirm the input language first.");
    userInput?.focus();
    return;
  }

  translateButton.disabled = true;
  translateButton.textContent = isSpanishUI() ? "Traduciendo..." : "Translating...";

  clearResults();

  try {
    const payload = buildRequestPayload(text);
    console.log("Sending payload:", payload);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("API response:", data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const translatedText = data.output || "";
    setTextareaValue(output, translatedText);
    setAdditionalInfo(data.additional_information || "");

    const pronunciationText = buildPronunciation(
      translatedText,
      confirmedInputLanguage,
      selectedTargetLanguage
    );

    setTextareaValue(pronunciation, normalizePronunciationStyle(pronunciationText));
    updatePronunciationVisibility();
  } catch (error) {
    console.error("Translation error:", error);
    clearResults();
    alert(`${isSpanishUI() ? "La traducción falló:" : "Translation failed:"} ${error.message}`);
  } finally {
    translateButton.disabled = false;
    translateButton.textContent = isSpanishUI() ? "Traducir" : "Translate";
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
  if (speakNormal) speakNormal.disabled = true;
  if (speakSlow) speakSlow.disabled = true;

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", runTranslation);
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
    updateDetectedLanguageState();
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runTranslation();
    }
  });

  targetSearch?.addEventListener("input", () => {
    clearSuggestions(targetSuggestions);

    const targetRaw = (targetSearch?.value || "").trim();
    if (!targetRaw) {
      selectedTargetLanguage = "";
      selectedTargetDialect = "Standard";
    } else {
      const targetConfig = resolveTargetConfig(targetRaw);
      selectedTargetLanguage = targetConfig.targetLanguage;
      selectedTargetDialect = targetConfig.dialect;
    }

    updateTranslateButtonState();
  });

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

document.addEventListener("DOMContentLoaded", init);    playful: "playful and natural",
    urgent: "urgent and direct"
  };

  return map[(contextTone?.value || "").trim()] || "natural";
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

  return map[(contextSituation?.value || "").trim()] || "translate accurately";
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
    .map((word) => {
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
    .map((word) => {
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
  const shouldShow = !!pronToggle?.checked && !!(output?.value || "").trim();

  if (shouldShow) {
    showElement(pronunciationSection, "flex");
    if (speakNormal) speakNormal.disabled = false;
    if (speakSlow) speakSlow.disabled = false;
  } else {
    hideElement(pronunciationSection);
    if (speakNormal) speakNormal.disabled = true;
    if (speakSlow) speakSlow.disabled = true;
  }
}

// === DETECTED LANGUAGE UI ===
function detectInputLanguage(text) {
  const lower = normalize(text);
  const tokens = normalize(text).split(/[\s—()\/,.:;!?-]+/).filter(Boolean);

  if (/[\u0600-\u06FF]/.test(text)) return "Modern Standard Arabic";
  if (/[\u0400-\u04FF]/.test(text)) return "Russian";
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\u4e00-\u9fff]/.test(text)) return "Mandarin Chinese";
  if (/[\uAC00-\uD7AF]/.test(text)) return "Korean";

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return "British English";
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return "Australian English";
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return "Colombian Spanish — Paisa (Medellín)";
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return "Colombian Spanish — Rolo (Bogotá)";
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return "Spanish — Mexican";
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
    return "Spanish — LATAM (Neutral)";
  }

  if (tokens.length < 2 && lower.length < 6) {
    return "";
  }

  return "American English";
}

function updateDetectedLanguageState() {
  const text = (userInput?.value || "").trim();

  detectedInputLanguage = "";
  confirmedInputLanguage = "";
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  if (!text) {
    updateTranslateButtonState();
    return;
  }

  const detected = detectInputLanguage(text);

  if (!detected) {
    updateTranslateButtonState();
    return;
  }

  detectedInputLanguage = detected;
  detectedLanguageDialect.textContent = isSpanishUI()
    ? `Idioma detectado: ${detected}`
    : `Detected language: ${detected}`;

  showElement(detectedCard, "block");
  updateTranslateButtonState();
}

function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);
  clearSuggestions(detectedSuggestions);

  keepDetectedButton?.addEventListener("click", () => {
    if (!detectedInputLanguage) return;

    confirmedInputLanguage = detectedInputLanguage;
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
    clearSuggestions(detectedSuggestions);
    const entered = (detectedSearch.value || "").trim();
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
  return {
    text: (userInput?.value || "").trim(),
    targetLanguage: selectedTargetLanguage || "English",
    dialect: selectedTargetDialect || "Standard",
    sourceLanguage: confirmedInputLanguage || detectedInputLanguage || "",
    tone: getToneValue(),
    audience: getAudienceValue(),
    goal: getGoalValue(),
    includeAdditionalInformation: true
  };
}

async function runTranslation() {
  const text = (userInput?.value || "").trim();
  const targetRaw = (targetSearch?.value || "").trim();

  if (!text) {
    alert(isSpanishUI() ? "Primero escribe texto." : "Enter text first.");
    userInput?.focus();
    return;
  }

  if (!targetRaw) {
    alert(isSpanishUI() ? "Primero escribe un idioma de destino." : "Enter a target language first.");
    targetSearch?.focus();
    return;
  }

  const targetConfig = getTargetConfig(targetRaw);
  selectedTargetLanguage = targetConfig.targetLanguage;
  selectedTargetDialect = targetConfig.dialect;

  if (!confirmedInputLanguage && detectedInputLanguage) {
    confirmedInputLanguage = detectedInputLanguage;
  }

  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? "Primero confirma el idioma de entrada." : "Confirm the input language first.");
    userInput?.focus();
    return;
  }

  translateButton.disabled = true;
  translateButton.textContent = isSpanishUI() ? "Traduciendo..." : "Translating...";

  clearResults();

  try {
    const payload = buildRequestPayload();
    console.log("Sending payload:", payload);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("API response:", data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const translatedText = data.output || "";
    setTextareaValue(output, translatedText);
    setAdditionalInfo(data.additional_information || "");

    const pronunciationText = buildPronunciation(
      translatedText,
      confirmedInputLanguage,
      selectedTargetLanguage
    );

    setTextareaValue(pronunciation, normalizePronunciationStyle(pronunciationText));
    updatePronunciationVisibility();
  } catch (error) {
    console.error("Translation error:", error);
    clearResults();
    alert(`${isSpanishUI() ? "La traducción falló:" : "Translation failed:"} ${error.message}`);
  } finally {
    translateButton.textContent = isSpanishUI() ? "Traducir" : "Translate";
    updateTranslateButtonState();
  }
}

// === COPY ===
async function copyTranslation() {
  const text = output?.value || "";
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);

    const original = copyButton.textContent;
    copyButton.textContent = isSpanishUI() ? "Copiado" : "Copied";

    setTimeout(() => {
      copyButton.textContent = original;
    }, 1000);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// === SPEAK ===
function speak(rate) {
  const pronunciationText = sanitizeForSpeech(pronunciation?.value || "");
  const translationText = sanitizeForSpeech(output?.value || "");
  const text = pronunciationText || translationText;

  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

// === INIT ===
function init() {
  initTheme();
  initDetectedLanguageUI();
  updateContextVisibility();
  updatePronunciationVisibility();
  clearResults();

  setSectionDisabled(contextSection, true);
  clearSuggestions(targetSuggestions);
  clearSuggestions(detectedSuggestions);

  if (speakNormal) speakNormal.disabled = true;
  if (speakSlow) speakSlow.disabled = true;

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", runTranslation);
  copyButton?.addEventListener("click", copyTranslation);

  speakNormal?.addEventListener("click", () => speak(0.7));
  speakSlow?.addEventListener("click", () => speak(0.2));

  userInput?.addEventListener("input", () => {
    clearResults();
    updateDetectedLanguageState();
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runTranslation();
    }
  });

  targetSearch?.addEventListener("input", () => {
    const targetRaw = (targetSearch.value || "").trim();

    if (!targetRaw) {
      selectedTargetLanguage = "";
      selectedTargetDialect = "Standard";
    } else {
      const targetConfig = getTargetConfig(targetRaw);
      selectedTargetLanguage = targetConfig.targetLanguage;
      selectedTargetDialect = targetConfig.dialect;
    }

    clearSuggestions(targetSuggestions);
    updateTranslateButtonState();
  });

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

document.addEventListener("DOMContentLoaded", init);const contextOutput = document.getElementById("contextOutput");

const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");

// === STATE ===
let selectedTargetLanguage = "";
let selectedTargetDialect = "Standard";
let detectedInputLanguage = "";
let confirmedInputLanguage = "";
let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

// === CONFIG ===
const languageCatalog = [
  { label: "American English", targetLanguage: "English", dialect: "American English", aliases: ["English", "English — American"] },
  { label: "British English", targetLanguage: "English", dialect: "British English", aliases: ["English — British"] },
  { label: "Australian English", targetLanguage: "English", dialect: "Australian English", aliases: ["English — Australian"] },

  { label: "Spanish — LATAM (Neutral)", targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)", aliases: ["Spanish", "LATAM Spanish", "Latin American Spanish", "Latin American Spanish (Neutral)"] },
  { label: "Spanish — Mexican", targetLanguage: "Spanish", dialect: "Spanish — Mexican", aliases: ["Mexican Spanish"] },
  { label: "Spanish — Central American", targetLanguage: "Spanish", dialect: "Spanish — Central American", aliases: ["Central American Spanish"] },
  { label: "Spanish — Caribbean", targetLanguage: "Spanish", dialect: "Spanish — Caribbean", aliases: ["Caribbean Spanish"] },
  { label: "Spanish — Peruvian", targetLanguage: "Spanish", dialect: "Spanish — Peruvian", aliases: ["Peruvian Spanish"] },
  { label: "Spanish — Argentine", targetLanguage: "Spanish", dialect: "Spanish — Argentine", aliases: ["Argentine Spanish"] },
  { label: "Spanish — Chilean", targetLanguage: "Spanish", dialect: "Spanish — Chilean", aliases: ["Chilean Spanish"] },

  { label: "Spanish — General Colombian", targetLanguage: "Spanish", dialect: "Spanish — General Colombian", aliases: ["General Colombian Spanish", "Colombian Spanish"] },
  { label: "Colombian Spanish — Paisa (Medellín)", targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)", aliases: ["Paisa Spanish (Medellín)", "Spanish — Paisa (Medellín)", "Paisa Colombian Spanish", "Medellín Spanish"] },
  { label: "Colombian Spanish — Rolo (Bogotá)", targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)", aliases: ["Rolo Spanish (Bogotá)", "Spanish — Rolo (Bogotá)", "Bogotá Spanish"] },
  { label: "Colombian Spanish — Cali", targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali", aliases: ["Cali Spanish", "Spanish — Cali"] },
  { label: "Colombian Spanish — Santander", targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander", aliases: ["Santander Spanish", "Spanish — Santander"] },
  { label: "Spanish — Venezuelan", targetLanguage: "Spanish", dialect: "Spanish — Venezuelan", aliases: ["Venezuelan Spanish"] },

  { label: "French", targetLanguage: "French", dialect: "Standard", aliases: [] },
  { label: "German", targetLanguage: "German", dialect: "Standard", aliases: [] },
  { label: "Italian", targetLanguage: "Italian", dialect: "Standard", aliases: [] },

  { label: "Brazilian Portuguese", targetLanguage: "Portuguese", dialect: "Brazilian Portuguese", aliases: [] },
  { label: "European Portuguese", targetLanguage: "Portuguese", dialect: "European Portuguese", aliases: [] },

  { label: "Modern Standard Arabic", targetLanguage: "Arabic", dialect: "Modern Standard Arabic", aliases: ["Arabic"] },
  { label: "Egyptian Arabic", targetLanguage: "Arabic", dialect: "Egyptian Arabic", aliases: [] },

  { label: "Iranian Persian — Farsi", targetLanguage: "Persian", dialect: "Iranian Persian — Farsi", aliases: ["Farsi", "Persian"] },
  { label: "Afghan Persian — Dari", targetLanguage: "Persian", dialect: "Afghan Persian — Dari", aliases: ["Dari"] },
  { label: "Tajik Persian — Tajik", targetLanguage: "Persian", dialect: "Tajik Persian — Tajik", aliases: ["Tajik"] },

  { label: "Hindi", targetLanguage: "Hindi", dialect: "Standard", aliases: [] },
  { label: "Indonesian", targetLanguage: "Indonesian", dialect: "Standard", aliases: [] },
  { label: "Filipino (Tagalog)", targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)", aliases: ["Tagalog", "Filipino"] },
  { label: "Swahili", targetLanguage: "Swahili", dialect: "Standard", aliases: [] },
  { label: "Amharic", targetLanguage: "Amharic", dialect: "Standard", aliases: [] },
  { label: "Turkish", targetLanguage: "Turkish", dialect: "Standard", aliases: [] },

  { label: "Mandarin Chinese", targetLanguage: "Chinese", dialect: "Mandarin Chinese", aliases: ["Chinese"] },
  { label: "Korean", targetLanguage: "Korean", dialect: "Standard", aliases: [] },
  { label: "Japanese", targetLanguage: "Japanese", dialect: "Standard", aliases: [] },
  { label: "Russian", targetLanguage: "Russian", dialect: "Standard", aliases: [] }
];

const uiText = {
  en: {
    dark: "🌙 Dark",
    light: "☀️ Light",
    translating: "Translating...",
    translate: "Translate",
    copied: "Copied",
    noInput: "Enter text first.",
    noTarget: "Enter or choose a target language first.",
    noDetected: "Confirm the input language first.",
    errorPrefix: "Translation failed:"
  },
  es: {
    dark: "🌙 Oscuro",
    light: "☀️ Claro",
    translating: "Traduciendo...",
    translate: "Traducir",
    copied: "Copiado",
    noInput: "Primero escribe texto.",
    noTarget: "Primero escribe o elige un idioma de destino.",
    noDetected: "Primero confirma el idioma de entrada.",
    errorPrefix: "La traducción falló:"
  }
};

// === HELPERS ===
function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSpanishUI() {
  return (siteLanguage?.value || "en") === "es";
}

function t(key) {
  return uiText[isSpanishUI() ? "es" : "en"][key];
}

function showElement(element, displayValue = "block") {
  if (!element) return;
  element.classList.remove("hidden");
  element.hidden = false;
  element.style.display = displayValue;
}

function hideElement(element) {
  if (!element) return;
  element.classList.add("hidden");
  element.hidden = true;
  element.style.display = "none";
}

function setTextareaValue(element, value) {
  if (!element) return;
  element.value = value || "";
}

function clearSuggestions(element) {
  if (!element) return;
  element.innerHTML = "";
  hideElement(element);
}

function setDisabledForSection(section, disabled) {
  if (!section) return;
  const controls = section.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    control.disabled = disabled;
  });
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

function tokenize(value) {
  return normalize(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}

function setAdditionalInfo(text) {
  const clean = (text || "").trim();
  setTextareaValue(additionalInfo, clean);

  if (clean) {
    showElement(additionalInfoSection, "flex");
  } else {
    hideElement(additionalInfoSection);
  }
}

function clearResults() {
  setTextareaValue(output, "");
  setTextareaValue(contextOutput, "");
  setTextareaValue(pronunciation, "");
  setTextareaValue(additionalInfo, "");

  hideElement(contextOutputSection);
  hideElement(pronunciationSection);
  hideElement(additionalInfoSection);
}

function updateTranslateButtonState() {
  if (!translateButton) return;
  const hasInput = !!(userInput?.value || "").trim();
  const hasTarget = !!selectedTargetLanguage;
  const hasDetected = !!confirmedInputLanguage;
  translateButton.disabled = !(hasInput && hasTarget && hasDetected);
}

// === THEME ===
function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  if (darkModeButton) {
    darkModeButton.textContent = isDark ? t("light") : t("dark");
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

// === CONTEXT ===
function updateContextVisibility() {
  if (contextToggle?.checked) {
    showElement(contextSection, "grid");
    setDisabledForSection(contextSection, false);
  } else {
    hideElement(contextSection);
    setDisabledForSection(contextSection, true);
    if (contextAudience) contextAudience.value = "";
    if (contextTone) contextTone.value = "";
    if (contextSituation) contextSituation.value = "";
  }
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

  return map[(contextAudience?.value || "").trim()] || "general";
}

function getToneValue() {
  if (!contextToggle?.checked) return "natural";

  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };

  return map[(contextTone?.value || "").trim()] || "natural";
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

  return map[(contextSituation?.value || "").trim()] || "translate accurately";
}

// === PRONUNCIATION ===
function updatePronunciationVisibility() {
  const shouldShow = !!pronToggle?.checked && !!(output?.value || "").trim();

  if (shouldShow) {
    showElement(pronunciationSection, "flex");
    if (speakNormal) speakNormal.disabled = false;
    if (speakSlow) speakSlow.disabled = false;
  } else {
    hideElement(pronunciationSection);
    if (speakNormal) speakNormal.disabled = true;
    if (speakSlow) speakSlow.disabled = true;
  }
}

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
    .map((word) => {
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
    .map((word) => {
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

// === LANGUAGE SEARCH ===
function scoreLanguageMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalize(value);

  if (!q) return languageCatalog.slice(0, 12);

  return languageCatalog
    .map((item) => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter((row) => row.score < 9999)
    .sort((a, b) => (a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label)))
    .map((row) => row.item)
    .slice(0, 12);
}

function renderSuggestions(container, matches, type) {
  if (!container) return;
  container.innerHTML = "";

  if (!matches.length) {
    hideElement(container);
    return;
  }

  if (type === "target") {
    targetMatches = matches;
    targetActiveIndex = -1;
  } else {
    detectedMatches = matches;
    detectedActiveIndex = -1;
  }

  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.textContent = item.label;

    div.addEventListener("mousedown", (event) => {
      event.preventDefault();

      if (type === "target") {
        applyTargetSelection(item);
      } else {
        applyDetectedSelection(item.label);
      }

      clearSuggestions(container);
    });

    container.appendChild(div);
  });

  showElement(container, "block");
}

function highlightActive(container, activeIndex) {
  if (!container) return;
  const items = container.querySelectorAll(".suggestionItem");

  items.forEach((item, index) => {
    item.classList.toggle("activeSuggestion", index === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function applyTargetSelection(item) {
  selectedTargetLanguage = item.targetLanguage;
  selectedTargetDialect = item.dialect;
  targetSearch.value = item.label;
  clearSuggestions(targetSuggestions);
  updateTranslateButtonState();
}

function applyDetectedSelection(label) {
  confirmedInputLanguage = label;
  detectedInputLanguage = label;
  detectedLanguageDialect.textContent = `Input language: ${label}`;
  hideElement(changeDetectedWrap);
  showElement(detectedCard, "block");
  clearSuggestions(detectedSuggestions);
  updateTranslateButtonState();
}

function setupSearchInputs() {
  targetSearch?.addEventListener("focus", () => {
    renderSuggestions(targetSuggestions, findMatches(targetSearch.value), "target");
  });

  targetSearch?.addEventListener("input", () => {
    selectedTargetLanguage = "";
    selectedTargetDialect = "Standard";
    renderSuggestions(targetSuggestions, findMatches(targetSearch.value), "target");
    updateTranslateButtonState();
  });

  targetSearch?.addEventListener("keydown", (event) => {
    if (!targetMatches.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      renderSuggestions(targetSuggestions, findMatches(targetSearch.value), "target");
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!targetMatches.length) return;
      targetActiveIndex = (targetActiveIndex + 1) % targetMatches.length;
      highlightActive(targetSuggestions, targetActiveIndex);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!targetMatches.length) return;
      targetActiveIndex = targetActiveIndex <= 0 ? targetMatches.length - 1 : targetActiveIndex - 1;
      highlightActive(targetSuggestions, targetActiveIndex);
    }

    if (event.key === "Enter") {
      if (targetMatches[targetActiveIndex]) {
        event.preventDefault();
        applyTargetSelection(targetMatches[targetActiveIndex]);
      }
    }

    if (event.key === "Escape") {
      clearSuggestions(targetSuggestions);
    }
  });

  detectedSearch?.addEventListener("focus", () => {
    renderSuggestions(detectedSuggestions, findMatches(detectedSearch.value), "detected");
  });

  detectedSearch?.addEventListener("input", () => {
    renderSuggestions(detectedSuggestions, findMatches(detectedSearch.value), "detected");
  });

  detectedSearch?.addEventListener("keydown", (event) => {
    if (!detectedMatches.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      renderSuggestions(detectedSuggestions, findMatches(detectedSearch.value), "detected");
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!detectedMatches.length) return;
      detectedActiveIndex = (detectedActiveIndex + 1) % detectedMatches.length;
      highlightActive(detectedSuggestions, detectedActiveIndex);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!detectedMatches.length) return;
      detectedActiveIndex = detectedActiveIndex <= 0 ? detectedMatches.length - 1 : detectedActiveIndex - 1;
      highlightActive(detectedSuggestions, detectedActiveIndex);
    }

    if (event.key === "Enter") {
      if (detectedMatches[detectedActiveIndex]) {
        event.preventDefault();
        applyDetectedSelection(detectedMatches[detectedActiveIndex].label);
      }
    }

    if (event.key === "Escape") {
      clearSuggestions(detectedSuggestions);
    }
  });

  document.addEventListener("click", (event) => {
    if (!targetSearch?.contains(event.target) && !targetSuggestions?.contains(event.target)) {
      clearSuggestions(targetSuggestions);
    }

    if (!detectedSearch?.contains(event.target) && !detectedSuggestions?.contains(event.target)) {
      clearSuggestions(detectedSuggestions);
    }
  });
}

// === INPUT DETECTION ===
function detectInputLanguage(text) {
  const lower = normalize(text);
  const tokens = tokenize(text);

  if (/[\u0600-\u06FF]/.test(text)) return "Modern Standard Arabic";
  if (/[\u0400-\u04FF]/.test(text)) return "Russian";
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\u4e00-\u9fff]/.test(text)) return "Mandarin Chinese";
  if (/[\uAC00-\uD7AF]/.test(text)) return "Korean";

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return "British English";
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return "Australian English";
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return "Colombian Spanish — Paisa (Medellín)";
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return "Colombian Spanish — Rolo (Bogotá)";
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return "Spanish — Mexican";
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
    return "Spanish — LATAM (Neutral)";
  }

  if (tokens.length < 2 && lower.length < 6) {
    return "";
  }

  return "American English";
}

function updateDetectedLanguageState() {
  const text = (userInput?.value || "").trim();

  detectedInputLanguage = "";
  confirmedInputLanguage = "";
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  if (!text) {
    updateTranslateButtonState();
    return;
  }

  const detected = detectInputLanguage(text);

  if (!detected) {
    updateTranslateButtonState();
    return;
  }

  detectedInputLanguage = detected;
  detectedLanguageDialect.textContent = `Detected language: ${detected}`;
  showElement(detectedCard, "block");
  updateTranslateButtonState();
}

// === PAYLOAD ===
function buildRequestPayload() {
  return {
    text: (userInput?.value || "").trim(),
    targetLanguage: selectedTargetLanguage || "English",
    dialect: selectedTargetDialect || "Standard",
    sourceLanguage: confirmedInputLanguage || detectedInputLanguage || "",
    tone: getToneValue(),
    audience: getAudienceValue(),
    goal: getGoalValue(),
    includeAdditionalInformation: true
  };
}

// === TRANSLATE ===
async function runTranslation() {
  const text = (userInput?.value || "").trim();
  const targetRaw = (targetSearch?.value || "").trim();

  if (!text) {
    alert(t("noInput"));
    userInput?.focus();
    return;
  }

  if (!targetRaw || !selectedTargetLanguage) {
    alert(t("noTarget"));
    targetSearch?.focus();
    return;
  }

  if (!confirmedInputLanguage && !detectedInputLanguage) {
    alert(t("noDetected"));
    userInput?.focus();
    return;
  }

  if (!confirmedInputLanguage && detectedInputLanguage) {
    confirmedInputLanguage = detectedInputLanguage;
  }

  translateButton.disabled = true;
  translateButton.textContent = t("translating");

  clearResults();

  try {
    const payload = buildRequestPayload();
    console.log("Sending payload:", payload);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("API response:", data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const translatedText = data.output || "";
    setTextareaValue(output, translatedText);
    setAdditionalInfo(data.additional_information || "");

    const pronunciationText = buildPronunciation(
      translatedText,
      confirmedInputLanguage,
      selectedTargetLanguage
    );

    setTextareaValue(pronunciation, normalizePronunciationStyle(pronunciationText));
    updatePronunciationVisibility();
  } catch (error) {
    console.error("Translation error:", error);
    clearResults();
    alert(`${t("errorPrefix")} ${error.message}`);
  } finally {
    translateButton.textContent = t("translate");
    updateTranslateButtonState();
  }
}

// === COPY ===
async function copyTranslation() {
  const text = output?.value || "";
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const original = copyButton.textContent;
    copyButton.textContent = t("copied");
    setTimeout(() => {
      copyButton.textContent = original;
    }, 1000);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// === SPEAK ===
function speak(rate) {
  const pronunciationText = sanitizeForSpeech(pronunciation?.value || "");
  const translationText = sanitizeForSpeech(output?.value || "");
  const text = pronunciationText || translationText;

  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

// === INIT ===
function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  keepDetectedButton?.addEventListener("click", () => {
    if (!detectedInputLanguage) return;
    confirmedInputLanguage = detectedInputLanguage;
    detectedLanguageDialect.textContent = `Input language confirmed: ${confirmedInputLanguage}`;
    hideElement(changeDetectedWrap);
    showElement(detectedCard, "block");
    updateTranslateButtonState();
  });

  changeDetectedButton?.addEventListener("click", () => {
    showElement(changeDetectedWrap, "block");
    detectedSearch?.focus();
  });
}

function init() {
  initTheme();
  initDetectedLanguageUI();
  setupSearchInputs();
  updateContextVisibility();
  updatePronunciationVisibility();
  clearResults();

  setDisabledForSection(contextSection, true);
  if (speakNormal) speakNormal.disabled = true;
  if (speakSlow) speakSlow.disabled = true;

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", runTranslation);
  copyButton?.addEventListener("click", copyTranslation);

  speakNormal?.addEventListener("click", () => speak(0.7));
  speakSlow?.addEventListener("click", () => speak(0.2));

  userInput?.addEventListener("input", () => {
    clearResults();
    updateDetectedLanguageState();
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runTranslation();
    }
  });

  siteLanguage?.addEventListener("change", () => {
    applyTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    if (translateButton && !translateButton.disabled) {
      translateButton.textContent = t("translate");
    }
  });

  updateTranslateButtonState();
}

document.addEventListener("DOMContentLoaded", init);const contextOutput = document.getElementById("contextOutput");

const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");

// === STATE ===
let selectedTargetLanguage = "";

// === HELPERS ===
function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function showElement(el, displayValue = "block") {
  if (!el) return;
  el.classList.remove("hidden");
  el.hidden = false;
  el.style.display = displayValue;
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.hidden = true;
  el.style.display = "none";
}

function setTextareaValue(el, value) {
  if (!el) return;
  el.value = value || "";
}

function clearSuggestions(el) {
  if (!el) return;
  el.innerHTML = "";
  hideElement(el);
}

function resolveTargetLanguage(raw) {
  const value = normalize(raw);

  const languageMap = {
    english: "English",
    en: "English",

    spanish: "Spanish",
    espanol: "Spanish",
    español: "Spanish",
    es: "Spanish",

    french: "French",
    francais: "French",
    français: "French",
    fr: "French",

    german: "German",
    deutsch: "German",
    de: "German",

    italian: "Italian",
    italiano: "Italian",
    it: "Italian",

    portuguese: "Portuguese",
    portugues: "Portuguese",
    português: "Portuguese",
    pt: "Portuguese",

    arabic: "Arabic",
    ar: "Arabic",

    hindi: "Hindi",
    hi: "Hindi",

    indonesian: "Indonesian",
    id: "Indonesian",

    tagalog: "Tagalog",
    filipino: "Tagalog",
    tl: "Tagalog",

    swahili: "Swahili",
    sw: "Swahili",

    amharic: "Amharic",
    am: "Amharic",

    farsi: "Farsi",
    persian: "Farsi",
    fa: "Farsi",

    turkish: "Turkish",
    tr: "Turkish",

    russian: "Russian",
    ru: "Russian",

    japanese: "Japanese",
    ja: "Japanese",

    korean: "Korean",
    ko: "Korean",

    chinese: "Chinese",
    zh: "Chinese"
  };

  return languageMap[value] || raw.trim();
}

function setAdditionalInfo(text) {
  const clean = (text || "").trim();

  setTextareaValue(additionalInfo, clean);

  if (clean) {
    showElement(additionalInfoSection, "block");
  } else {
    hideElement(additionalInfoSection);
  }

  console.log("additional_information:", clean);
}

function clearResults() {
  setTextareaValue(output, "");
  setTextareaValue(contextOutput, "");
  setTextareaValue(pronunciation, "");
  setTextareaValue(additionalInfo, "");

  hideElement(contextOutputSection);
  hideElement(pronunciationSection);
  hideElement(additionalInfoSection);
}

function getAudienceValue() {
  if (!contextToggle?.checked) return "general";
  return (contextAudience?.value || "").trim() || "general";
}

function getToneValue() {
  if (!contextToggle?.checked) return "natural";
  return (contextTone?.value || "").trim() || "natural";
}

function getGoalValue() {
  if (!contextToggle?.checked) return "translate accurately";
  return (contextSituation?.value || "").trim() || "translate accurately";
}

// === THEME ===
function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  if (darkModeButton) {
    darkModeButton.textContent = isDark ? "☀️ Light" : "🌙 Dark";
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

// === CONTEXT ===
function updateContextVisibility() {
  if (contextToggle?.checked) {
    showElement(contextSection, "block");
  } else {
    hideElement(contextSection);
  }
}

// === PRONUNCIATION ===
// Intentionally not connected to backend yet.
// This only controls visibility so the UI does not feel broken.
function updatePronunciationVisibility() {
  if (pronToggle?.checked) {
    showElement(pronunciationSection, "block");
  } else {
    hideElement(pronunciationSection);
  }
}

// === DETECTED LANGUAGE UI ===
// Left in place, but not active yet against current backend.
function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  keepDetectedButton?.addEventListener("click", () => {
    hideElement(detectedCard);
    hideElement(changeDetectedWrap);
  });

  changeDetectedButton?.addEventListener("click", () => {
    showElement(changeDetectedWrap, "block");
    detectedSearch?.focus();
  });

  detectedSearch?.addEventListener("input", () => {
    clearSuggestions(detectedSuggestions);
  });
}

// === TRANSLATE ===
async function runTranslation() {
  const text = (userInput?.value || "").trim();
  const targetRaw = (targetSearch?.value || "").trim();
  const targetLanguage = resolveTargetLanguage(targetRaw);

  if (!text) {
    alert("Enter text first.");
    userInput?.focus();
    return;
  }

  if (!targetRaw) {
    alert("Enter a target language first.");
    targetSearch?.focus();
    return;
  }

  selectedTargetLanguage = targetLanguage;

  translateButton.disabled = true;
  translateButton.textContent = "Translating...";

  clearResults();

  try {
    const payload = {
      text,
      targetLanguage: selectedTargetLanguage,
      dialect: "Standard",
      tone: getToneValue(),
      audience: getAudienceValue(),
      goal: getGoalValue(),
      includeAdditionalInformation: true
    };

    console.log("Sending payload:", payload);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("API response:", data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    setTextareaValue(output, data.output || "");
    setAdditionalInfo(data.additional_information || "");
  } catch (error) {
    console.error("Translation error:", error);
    clearResults();
    alert(`Translation failed: ${error.message}`);
  } finally {
    translateButton.disabled = false;
    translateButton.textContent = "Translate";
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

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", runTranslation);
  copyButton?.addEventListener("click", copyTranslation);

  speakNormal?.addEventListener("click", () => {
    console.log("Pronunciation speak normal clicked. Not connected yet.");
  });

  speakSlow?.addEventListener("click", () => {
    console.log("Pronunciation speak slow clicked. Not connected yet.");
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runTranslation();
    }
  });

  targetSearch?.addEventListener("input", () => {
    clearSuggestions(targetSuggestions);
  });
}

document.addEventListener("DOMContentLoaded", init);
