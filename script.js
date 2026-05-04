const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;
let targetSelection = null;

/* ---------- HELPERS ---------- */

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

/* ---------- LANGUAGE LIST ---------- */

const languageCatalog = [
  { label: "American English", aliases: ["english"] },
  { label: "Spanish — LATAM (Neutral)", aliases: ["spanish", "latam"] },
  { label: "Spanish — Mexican", aliases: ["mexican"] },
  { label: "Spanish — Venezuelan", aliases: ["venezuelan"] },

  { label: "Colombian Spanish — Paisa (Medellín)", aliases: ["paisa", "medellin"] },
  { label: "Colombian Spanish — Rolo (Bogotá)", aliases: ["rolo", "bogota"] },
  { label: "Colombian Spanish — Cali", aliases: ["cali"] },
  { label: "Colombian Spanish — Santander", aliases: ["santander"] },

  { label: "French", aliases: [] },
  { label: "German", aliases: [] },
  { label: "Italian", aliases: [] },
  { label: "Portuguese", aliases: [] },
  { label: "Japanese", aliases: [] }
];

/* ---------- SEARCH ---------- */

function findMatches(query) {
  const q = normalize(query);

  return languageCatalog.filter(item => {
    const label = normalize(item.label);
    const aliases = item.aliases.map(normalize);

    return (
      label.includes(q) ||
      aliases.some(a => a.includes(q))
    );
  }).slice(0, 8);
}

function renderSuggestions(container, matches, onPick) {
  container.innerHTML = "";

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;

    div.addEventListener("mousedown", () => {
      onPick(item);
      container.innerHTML = "";
    });

    container.appendChild(div);
  });
}

function setupSearch(inputId, suggestionId, onPick) {
  const input = el(inputId);
  const box = el(suggestionId);

  if (!input || !box) return;

  input.addEventListener("input", () => {
    const matches = findMatches(input.value);
    renderSuggestions(box, matches, onPick);
  });

  input.addEventListener("focus", () => {
    const matches = findMatches(input.value);
    renderSuggestions(box, matches, onPick);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.innerHTML = "";
    }
  });
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
  const target = targetSelection?.label || el("targetSearch").value.trim();

  if (!confirmedInputLanguage) {
    alert("Confirm input language first");
    return;
  }

  if (!input || !target) {
    alert("Enter text + target");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: target,
        sourceLanguage: confirmedInputLanguage
      })
    });

    const data = await res.json();

    el("output").value = data.output || "";

    if (data.additional_information) {
      el("additionalInfo").value = data.additional_information;
      el("additionalInfoSection").classList.remove("hidden");
    } else {
      el("additionalInfoSection").classList.add("hidden");
    }

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

/* ---------- DARK MODE ---------- */

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  el("userInput").addEventListener("input", updateDetection);
  el("keepDetectedButton").addEventListener("click", keepDetected);
  el("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  el("translateButton").addEventListener("click", translateText);
  el("copyButton").addEventListener("click", copyTranslation);
  el("darkModeButton").addEventListener("click", toggleDarkMode);

  /* DROPDOWNS */

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = item.label;
  });

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    detectedSelection = item;
    el("detectedSearch").value = item.label;
    el("changeDetectedWrap").classList.add("hidden");
  });

});
