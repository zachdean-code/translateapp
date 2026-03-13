const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let detectedSelection = null;
let confirmedInputSelection = null;
let detectionConfirmed = false;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

const PRONUNCIATION_SUPPORTED_BASES = new Set([
  "english",
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "dutch"
]);

const PRONUNCIATION_SUPPORTED_PAIRS = new Set([
  "english|spanish",
  "english|french",
  "english|german",
  "english|italian",
  "english|portuguese",
  "english|dutch",

  "spanish|english",
  "spanish|french",
  "spanish|german",
  "spanish|italian",
  "spanish|portuguese",
  "spanish|dutch",

  "french|english",
  "german|english",
  "italian|english",
  "portuguese|english",
  "dutch|english",

  "french|spanish",
  "german|spanish",
  "italian|spanish",
  "portuguese|spanish",
  "dutch|spanish"
]);

function el(id) {
  return document.getElementById(id);
}

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[\s—()\/,-]+/)
    .filter(Boolean);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

function parseBaseLanguage(label) {
  const s = normalizeText(label);

  if (s.startsWith("english")) return "english";
  if (s.startsWith("spanish")) return "spanish";
  if (s.startsWith("french")) return "french";
  if (s.startsWith("german")) return "german";
  if (s.startsWith("italian")) return "italian";
  if (s.startsWith("portuguese")) return "portuguese";
  if (s.startsWith("dutch")) return "dutch";
  if (s.startsWith("arabic")) return "arabic";
  if (s.startsWith("chinese")) return "chinese";
  if (s.startsWith("japanese")) return "japanese";
  if (s.startsWith("korean")) return "korean";
  if (s.startsWith("russian")) return "russian";
  if (s.startsWith("hindi")) return "hindi";
  if (s.startsWith("filipino") || s.startsWith("tagalog")) return "filipino";

  return s;
}

function scoreLanguageMatch(item, query) {
  const q = normalizeText(query);
  if (!q) return 1000;

  const label = normalizeText(item.label);
  const aliases = (item.aliases || []).map(normalizeText);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  const labelWords = tokenize(item.label);
  for (const word of labelWords) {
    if (word.startsWith(q)) return 4;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalizeText(value);

  if (!q) return languageCatalog.slice(0, 12);

  return languageCatalog
    .map((item) => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter((row) => row.score < 9999)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.item.label.localeCompare(b.item.label);
    })
    .map((row) => row.item)
    .slice(0, 12);
}

function detectInput(text) {
  const lower = normalizeText(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Arabic — Modern Standard" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Chinese — Simplified" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (lower.includes("parce")) return { label: "Spanish — Paisa (Medellín)" };
  if (lower.includes("sumercé") || lower.includes("sumerce")) return { label: "Spanish — Rolo (Bogotá)" };
  if (lower.includes("orale") || lower.includes("wey")) return { label: "Spanish — Mexican" };
  if (lower.includes("boludo") || lower.includes("che ")) return { label: "Spanish — Argentine" };

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "English — American" };
}

function updateDetectionCard() {
  const input = el("userInput");
  const card = el("detectedCard");
  const display = el("detectedLanguageDialect");

  if (!input || !card || !display) return;

  const text = input.value.trim();

  if (!text) {
    card.classList.add("hidden");
    detectedSelection = null;
    confirmedInputSelection = null;
    detectionConfirmed = false;
    return;
  }

  if (!detectionConfirmed) {
    detectedSelection = detectInput(text);
    display.innerText = `Detected language: ${detectedSelection.label}`;
  } else if (confirmedInputSelection) {
    display.innerText = `Input language: ${confirmedInputSelection.label}`;
  }

  card.classList.remove("hidden");
}

async function translateText() {
  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection
    ? targetSelection.label
    : (el("targetSearch")?.value.trim() || "");

  if (!input || !target) {
    alert("Enter text and choose a language.");
    return;
  }

  detectedSelection = detectInput(input);

  if (!detectionConfirmed) {
    confirmedInputSelection = { ...detectedSelection };
    detectionConfirmed = true;
  }

  updateDetectionCard();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (el("output")) el("output").value = data.error || "Translation error";
      return;
    }

    if (el("output")) {
      el("output").value = data.output || "";
    }
  } catch (err) {
    if (el("output")) el("output").value = "Network or server error";
  }
}

function copyTranslation() {
  const output = el("output");
  if (!output) return;
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);

  el("userInput")?.addEventListener("input", () => {
    detectionConfirmed = false;
    confirmedInputSelection = null;
    detectedSelection = detectInput(el("userInput").value || "");
    updateDetectionCard();
  });

  updateDetectionCard();
});
