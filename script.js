const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

// ==========================
// LANGUAGE LABELS
// ==========================
const TARGET_LANGUAGE_TRANSLATIONS = {
  en: {
    "American English": "American English",
    "British English": "British English",
    "French": "French",
    "German": "German",
    "Italian": "Italian",
    "Mexican Spanish": "Mexican Spanish",
    "LATAM Spanish": "LATAM Spanish",
    "Mandarin Chinese": "Mandarin Chinese",
    "Korean": "Korean",
    "Japanese": "Japanese",
    "Russian": "Russian"
  },
  es: {
    "American English": "Inglés estadounidense",
    "British English": "Inglés británico",
    "French": "Francés",
    "German": "Alemán",
    "Italian": "Italiano",
    "Mexican Spanish": "Español mexicano",
    "LATAM Spanish": "Español latinoamericano",
    "Mandarin Chinese": "Chino mandarín",
    "Korean": "Coreano",
    "Japanese": "Japonés",
    "Russian": "Ruso"
  }
};

// ==========================
// HELPERS
// ==========================

function el(id) {
  return document.getElementById(id);
}

function isSpanishUI() {
  return (el("siteLanguage")?.value || "en").startsWith("es");
}

function localizeLanguageLabel(label) {
  const lang = isSpanishUI() ? "es" : "en";
  return TARGET_LANGUAGE_TRANSLATIONS[lang][label] || label;
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}
function updateAdditionalInfo(text) {
  const box = el("additionalInfo");
  const section = el("additionalInfoSection");

  if (!box || !section) return;

  if (text) {
    box.value = text;
    section.classList.remove("hidden");
  } else {
    box.value = "";
    section.classList.add("hidden");
  }
}

function togglePronunciation() {
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
}

function updateTranslateState() {
  const button = el("translateButton");
  if (!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasLang = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasLang && hasTarget);
}function detectInput(text) {
  const lower = normalize(text);

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "LATAM Spanish" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput")?.value.trim();

  if (!text) {
    detectedSelection = null;
    return;
  }

  detectedSelection = detectInput(text);
}

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  confirmationMode = "detected";
  updateTranslateState();
}
function buildPronunciation(text, source, target) {
  if (!text) return "";

  if (source.includes("English") && target.includes("Spanish")) {
    return text.replace(/a/g, "ah").replace(/e/g, "eh");
  }

  if (source.includes("Spanish") && target.includes("English")) {
    return text.replace(/j/g, "h");
  }

  return "";
}

async function translateText() {
  const input = el("userInput")?.value.trim();
  const target = targetSelection?.label;

  if (!input || !target) return;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      text: input,
      targetLanguage: target,
      sourceLanguage: confirmedInputLanguage
    })
  });

  const data = await response.json();

  if (el("output")) el("output").value = data.output || "";

  if (el("pronunciation")) {
    el("pronunciation").value =
      buildPronunciation(data.output, confirmedInputLanguage, target);
  }
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if (btn) {
    btn.innerText = isDark ? "🌙 Dark" : "☀️ Light";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("translateButton")?.addEventListener("click", translateText);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("pronToggle")?.addEventListener("change", togglePronunciation);

});
