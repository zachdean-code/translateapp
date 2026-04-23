// === API ===
const API_URL = "https://translateapp-1.onrender.com/translate";

// === ELEMENTS ===
const userInput = document.getElementById("userInput");
const targetSearch = document.getElementById("targetSearch");
const translateButton = document.getElementById("translateButton");
const output = document.getElementById("output");
const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");
const darkModeButton = document.getElementById("darkModeButton");

// Optional existing elements in your HTML we will safely ignore unless present
const copyButton = document.getElementById("copyButton");

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

function setHidden(el, shouldHide) {
  if (!el) return;
  if (shouldHide) {
    el.classList.add("hidden");
  } else {
    el.classList.remove("hidden");
  }
}

function setOutput(text) {
  if (output) output.value = text || "";
}

function setAdditionalInfo(text) {
  const clean = (text || "").trim();

  if (!additionalInfo || !additionalInfoSection) return;

  additionalInfo.value = clean;
  setHidden(additionalInfoSection, clean === "");
}

function clearResults() {
  setOutput("");
  setAdditionalInfo("");
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

  if (darkModeButton) {
    darkModeButton.addEventListener("click", () => {
      const currentlyDark = document.documentElement.classList.contains("dark");
      applyTheme(currentlyDark ? "light" : "dark");
    });
  }
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        targetLanguage: selectedTargetLanguage,
        dialect: "Standard",
        tone: "natural",
        audience: "general",
        goal: "translate accurately",
        includeAdditionalInformation: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    setOutput(data.output || "");
    setAdditionalInfo(data.additional_information || "");
  } catch (error) {
    console.error("Translation error:", error);
    setOutput("");
    setAdditionalInfo("");
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
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// === INIT ===
function init() {
  initTheme();
  clearResults();

  if (translateButton) {
    translateButton.addEventListener("click", runTranslation);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyTranslation);
  }

  if (userInput) {
    userInput.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runTranslation();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
