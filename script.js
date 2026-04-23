// === API ===
const API_URL = "https://translateapp-1.onrender.com/translate";

// === STATE ===
let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

// === HELPERS ===
function el(id) { return document.getElementById(id); }

// === DETECT LANGUAGE ===
function detectInput(text) {
  if (!text) return null;

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput").value.trim();
  if (!text) return;

  detectedSelection = detectInput(text);

  if (detectedSelection) {
    confirmedInputLanguage = detectedSelection.label;
    const display = el("detectedLanguageDialect");
    if (display) {
      display.innerText = "Detected: " + detectedSelection.label;
      el("detectedCard").classList.remove("hidden");
    }
  }
}

// === CONTEXT HELPERS ===
function getTone() {
  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };
  return map[el("contextTone")?.value] || "natural";
}

function getAudience() {
  const map = {
    friend: "friend",
    romantic: "romantic interest",
    professional: "professional contact",
    stranger: "stranger",
    service: "service employee"
  };
  return map[el("contextAudience")?.value] || "general";
}

function getGoal() {
  const map = {
    travel: "travel communication",
    business: "professional communication",
    social: "natural conversation",
    conflict: "resolve issue clearly",
    flirting: "romantic communication"
  };
  return map[el("contextSituation")?.value] || "translate accurately";
}

// === TRANSLATE ===
async function translateText() {
  const input = el("userInput")?.value.trim();
  const target = targetSelection?.label || "English";

  if (!confirmedInputLanguage) {
    alert("Confirm input language first");
    return;
  }

  if (!input) {
    alert("Enter text");
    return;
  }

  const btn = el("translateButton");
  btn.disabled = true;
  btn.innerText = "Translating...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        targetLanguage: target,
        dialect: target,
        sourceLanguage: confirmedInputLanguage,
        tone: getTone(),
        audience: getAudience(),
        goal: getGoal(),
        includeAdditionalInformation: true
      })
    });

    const data = await res.json();

    el("output").value = data.output || "";

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
    el("output").value = "Error";
  } finally {
    btn.disabled = false;
    btn.innerText = "Translate";
  }
}

// === DARK MODE ===
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {

  el("userInput")?.addEventListener("input", updateDetection);
  el("translateButton")?.addEventListener("click", translateText);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);

  const contextToggle = el("contextToggle");
  if (contextToggle) {
    el("contextSection")?.classList.toggle("hidden", !contextToggle.checked);

    contextToggle.addEventListener("change", (e) => {
      el("contextSection")?.classList.toggle("hidden", !e.target.checked);
    });
  }
});
