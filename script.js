const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;
let targetSelection = null;

function el(id) {
  return document.getElementById(id);
}

/* ---------- UI ---------- */

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");
}

/* ---------- DETECTION ---------- */

function detectInput(text) {
  const lower = normalize(text);

  if (/[áéíóúñ¿¡]/i.test(text) || lower.includes("que")) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput").value.trim();
  const card = el("detectedCard");

  confirmedInputLanguage = null;

  if (!text) {
    card.classList.add("hidden");
    return;
  }

  const detected = detectInput(text);

  detectedSelection = detected;
  el("detectedLanguageDialect").innerText =
    "Detected: " + detected.label;

  card.classList.remove("hidden");
}

/* ---------- BUTTONS ---------- */

function keepDetected() {
  confirmedInputLanguage = detectedSelection.label;
}

function toggleDetectedChange() {
  el("changeDetectedWrap").classList.toggle("hidden");
}

/* ---------- TRANSLATE ---------- */

async function translateText() {
  const input = el("userInput").value.trim();
  const target = el("targetSearch").value.trim();

  if (!input || !target) {
    alert("Enter text + target");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await res.json();

    el("output").value = data.output || "";
    el("additionalInfo").value = data.additional_information || "";

    el("additionalInfoSection").classList.remove("hidden");

  } catch {
    el("output").value = "Error";
  }
}

/* ---------- COPY ---------- */

function copyTranslation() {
  const box = el("output");
  box.select();
  document.execCommand("copy");
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

  /* DARK MODE LOAD */
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  /* EVENTS */
  el("userInput").addEventListener("input", updateDetection);
  el("keepDetectedButton").addEventListener("click", keepDetected);
  el("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  el("translateButton").addEventListener("click", translateText);
  el("copyButton").addEventListener("click", copyTranslation);
  el("darkModeButton").addEventListener("click", toggleDarkMode);

});
