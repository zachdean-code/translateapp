const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;
let targetActiveIndex = -1;
let currentSiteLanguage = "en";
let storedPronunciation = "";
let pronunciationAllowed = false;

function safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function applyLanguage(lang) {
  currentSiteLanguage = lang;
  document.documentElement.lang = lang;

  if (typeof t !== "function") return;

  safeText("uiLanguageLabel", t("uiLanguageLabel", lang));
  safeText("darkModeButton", t("darkModeButton", lang));
  safeText("pageTitle", t("pageTitle", lang));
  safeText("pageSubtitle", t("pageSubtitle", lang));
  safeText("pageDescription", t("pageDescription", lang));
  safeText("inputLabel", t("inputLabel", lang));
  safeText("translateToLabel", t("translateToLabel", lang));
  safeText("translateButton", t("translateButton", lang));
  safeText("translationLabel", t("translationLabel", lang));
  safeText("copyButton", t("copyButton", lang));
  safeText("keepDetectedButton", t("keepDetectedButton", lang));
  safeText("changeDetectedButton", t("changeDetectedButton", lang));
  safeText("usageNoteLabel", lang === "es" ? "Nota de uso" : "Usage Note");
  safeText("pronunciationToggleLabel", t("pronunciationToggleLabel", lang));
  safeText("pronunciationLabel", t("pronunciationLabel", lang));
  safeText("speakSlowButton", t("speakSlowButton", lang));
  safeText("speakNormalButton", t("speakNormalButton", lang));
  safeText("footerProduct", t("footerProduct", lang));
  safeText("footerCopyright", t("footerCopyright", lang));
  safeText("footerPatent", t("footerPatent", lang));
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

function findMatches(value) {
  const q = value.trim().toLowerCase();

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog.filter(item => {
    if (item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some(a => a.toLowerCase().includes(q));
  }).slice(0, 12);
}

function renderSuggestions(container, matches, onPick) {
  container.innerHTML = "";

  if (!matches.length) {
    container.style.display = "none";
    return;
  }

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;
    div.onclick = () => onPick(item);
    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch() {
  const input = document.getElementById("targetSearch");
  const box = document.getElementById("targetSuggestions");

  if (!input || !box) return;

  input.addEventListener("focus", () => {
    const matches = findMatches(input.value);
    renderSuggestions(box, matches, pickItem);
    targetActiveIndex = -1;
  });

  input.addEventListener("input", () => {
    const matches = findMatches(input.value);
    renderSuggestions(box, matches, pickItem);
    targetActiveIndex = -1;
  });

  input.addEventListener("keydown", (e) => {
    const items = box.querySelectorAll(".suggestionItem");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      targetActiveIndex++;
      if (targetActiveIndex >= items.length) targetActiveIndex = 0;
      highlight(items);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      targetActiveIndex--;
      if (targetActiveIndex < 0) targetActiveIndex = items.length - 1;
      highlight(items);
    }

    if (e.key === "Enter") {
      if (targetActiveIndex >= 0) {
        e.preventDefault();
        items[targetActiveIndex].click();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!box.contains(e.target) && e.target !== input) {
      box.style.display = "none";
    }
  });

  function pickItem(item) {
    targetSelection = item;
    input.value = item.label;
    box.style.display = "none";
  }

  function highlight(items) {
    items.forEach(i => i.classList.remove("active"));
    if (items[targetActiveIndex]) {
      items[targetActiveIndex].classList.add("active");
    }
  }
}

function detectInput(text) {
  const lower = text.toLowerCase();

  if (lower.includes("parce") || lower.includes("quiubo") || lower.includes("qué más pues")) {
    return "Spanish — Paisa (Medellín)";
  }

  if (lower.includes("che ") || lower.includes("boludo")) {
    return "Spanish — Argentine";
  }

  if (lower.includes("órale") || lower.includes("wey")) {
    return "Spanish — Mexican";
  }

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return "Spanish — LATAM (Neutral)";
  }

  return "English — American";
}

function updateDetection() {
  const text = document.getElementById("userInput").value.trim();
  const card = document.getElementById("detectedCard");

  if (!card) return;

  if (!text) {
    card.classList.add("hidden");
    detectedSelection = null;
    return;
  }

  const detected = detectInput(text);
  detectedSelection = detected;

  const label = document.getElementById("detectedLanguageDialect");
  if (label) {
    label.innerText =
      (currentSiteLanguage === "es" ? "Idioma y dialecto detectados: " : "Detected Language and Dialect: ")
      + detected;
  }

  card.classList.remove("hidden");
}

function keepDetected() {
  const wrap = document.getElementById("changeDetectedWrap");
  if (wrap) wrap.classList.add("hidden");
}

function toggleDetectedChange() {
  const wrap = document.getElementById("changeDetectedWrap");
  if (wrap) wrap.classList.toggle("hidden");
}

function updatePronunciationVisibility() {
  const pronSection = document.getElementById("pronunciationSection");
  const pronToggle = document.getElementById("pronToggle");
  const pronBox = document.getElementById("pronunciation");

  if (!pronSection || !pronToggle || !pronBox) return;

  if (!pronunciationAllowed) {
    pronSection.classList.add("hidden");
    pronBox.value = "";
    return;
  }

  if (pronToggle.checked) {
    pronBox.value = storedPronunciation || "";
    pronSection.classList.remove("hidden");
  } else {
    pronSection.classList.add("hidden");
  }
}

async function translateText() {
  const input = document.getElementById("userInput").value.trim();
  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if (!input || !target) {
    alert(currentSiteLanguage === "es" ? "Ingresa texto y elige un idioma." : "Enter text and choose a language.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        source: detectedSelection || ""
      })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("output").value = data.error || "Translation error";
      return;
    }

    const translation = data.translation_text || "";
    const usageNote = data.usage_note || "";
    const pronunciation = data.pronunciation_guide || "";

    document.getElementById("output").value = translation;

    storedPronunciation = pronunciation;
    pronunciationAllowed = !!data.show_pronunciation;

    const usageSection = document.getElementById("usageNoteSection");
    const usageBox = document.getElementById("usageNote");

    if (usageSection && usageBox) {
      if (data.show_usage_note && usageNote) {
        usageBox.value = usageNote;
        usageSection.classList.remove("hidden");
      } else {
        usageSection.classList.add("hidden");
        usageBox.value = "";
      }
    }

    updatePronunciationVisibility();
  } catch (err) {
    document.getElementById("output").value = "Network error";
  }
}

function copyTranslation() {
  const output = document.getElementById("output");
  if (!output) return;
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation() {
  updatePronunciationVisibility();
}

function speak(rate) {
  const text = document.getElementById("output").value.trim();
  if (!text) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("darkModeButton")?.addEventListener("click", toggleDarkMode);
  document.getElementById("userInput")?.addEventListener("input", updateDetection);
  document.getElementById("translateButton")?.addEventListener("click", translateText);
  document.getElementById("copyButton")?.addEventListener("click", copyTranslation);
  document.getElementById("pronToggle")?.addEventListener("change", togglePronunciation);
  document.getElementById("speakSlowButton")?.addEventListener("click", () => speak(0.6));
  document.getElementById("speakNormalButton")?.addEventListener("click", () => speak(1));
  document.getElementById("keepDetectedButton")?.addEventListener("click", keepDetected);
  document.getElementById("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  document.getElementById("siteLanguage")?.addEventListener("change", (e) => applyLanguage(e.target.value));

  applyLanguage(document.getElementById("siteLanguage")?.value || "en");
  setupSearch();
});
