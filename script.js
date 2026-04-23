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
const detectedSuggestions = document.getElementById("detectedSuggestions");

const contextToggle = document.getElementById("contextToggle");
const contextSection = document.getElementById("contextSection");
const contextAudience = document.getElementById("contextAudience");
const contextTone = document.getElementById("contextTone");
const contextSituation = document.getElementById("contextSituation");

const targetSearch = document.getElementById("targetSearch");
const targetSuggestions = document.getElementById("targetSuggestions");
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
