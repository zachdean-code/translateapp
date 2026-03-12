const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let detectedLanguage = null;

let targetMatches = [];
let targetActiveIndex = -1;

function safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function safePlaceholder(id, value) {
  const el = document.getElementById(id);
  if (el) el.placeholder = value || "";
}

function applyLanguage(lang) {
  document.documentElement.lang = lang;

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
  safeText("pronunciationToggleLabel", t("pronunciationToggleLabel", lang));
  safeText("pronunciationLabel", t("pronunciationLabel", lang));
  safeText("speakNormalButton", t("speakNormalButton", lang));
  safeText("speakSlowButton", t("speakSlowButton", lang));
  safeText("footerProduct", t("footerProduct", lang));
  safeText("footerCopyright", t("footerCopyright", lang));
  safeText("footerPatent", t("footerPatent", lang));

  safePlaceholder("userInput", t("inputPlaceholder", lang));
  safePlaceholder("targetSearch", t("targetSearchPlaceholder", lang));
  safePlaceholder("output", t("outputPlaceholder", lang));
  safePlaceholder("pronunciation", t("pronunciationPlaceholder", lang));

  localStorage.setItem("siteLanguage", lang);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

function findMatches(value) {
  const q = value.trim().toLowerCase();
  if (!q) return languageCatalog.slice(0, 12);

  return languageCatalog
    .filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      return item.aliases.some((alias) => alias.toLowerCase().includes(q));
    })
    .slice(0, 12);
}

function closeSuggestions(container) {
  container.style.display = "none";
  targetActiveIndex = -1;
  targetMatches = [];
}

function highlightActive(container) {
  const items = container.querySelectorAll(".suggestionItem");

  items.forEach((item, index) => {
    item.classList.toggle("activeSuggestion", index === targetActiveIndex);
  });

  if (targetActiveIndex >= 0 && items[targetActiveIndex]) {
    items[targetActiveIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick) {
  container.innerHTML = "";

  if (!matches.length) {
    closeSuggestions(container);
    return;
  }

  targetMatches = matches;
  targetActiveIndex = -1;

  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;
    div.onclick = () => onPick(item);
    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionId);

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!targetMatches.length) {
        renderSuggestions(box, findMatches(input.value), onPick);
        if (!targetMatches.length) return;
      }
      targetActiveIndex = (targetActiveIndex + 1) % targetMatches.length;
      highlightActive(box);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!targetMatches.length) return;
      targetActiveIndex =
        targetActiveIndex <= 0
          ? targetMatches.length - 1
          : targetActiveIndex - 1;
      highlightActive(box);
    }

    if (e.key === "Enter") {
      if (targetMatches[targetActiveIndex]) {
        e.preventDefault();
        onPick(targetMatches[targetActiveIndex]);
      }
    }

    if (e.key === "Escape") {
      closeSuggestions(box);
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      closeSuggestions(box);
    }
  });
}

function detectInput(text) {
  const lower = text.toLowerCase();

  if (/[\u0600-\u06FF]/.test(text)) return "arabic";
  if (/[\u0400-\u04FF]/.test(text)) return "russian";
  if (/[\u3040-\u30ff]/.test(text)) return "japanese";
  if (/[\u4e00-\u9fff]/.test(text)) return "chinese";
  if (/[\uAC00-\uD7AF]/.test(text)) return "korean";

  if (/[áéíóúñ¿¡]/i.test(text)) return "spanish";

  if (
    lower.includes("parce") ||
    lower.includes("quiubo") ||
    lower.includes("qué más pues")
  ) {
    return "spanish";
  }

  return "english";
}

function spanishToEnglishPhonetics(text) {
  const words = text.split(/\s+/);

  return words
    .map((raw) => {
      let word = raw
        .toLowerCase()
        .replace(/[¡!¿?.,;:()"']/g, "")
        .replace(/á/g, "ah")
        .replace(/é/g, "eh")
        .replace(/í/g, "ee")
        .replace(/ó/g, "oh")
        .replace(/ú/g, "oo")
        .replace(/ñ/g, "ny")
        .replace(/ll/g, "y")
        .replace(/ch/g, "ch")
        .replace(/qu/g, "k")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/j/g, "h")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/z/g, "s")
        .replace(/v/g, "b");

      word = word
        .replace(/que\b/g, "kay")
        .replace(/ca\b/g, "kah")
        .replace(/co\b/g, "koh")
        .replace(/e\b/g, "eh")
        .replace(/o\b/g, "oh");

      word = word
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");

      return word;
    })
    .join(" ");
}

function buildPronunciation(text, target) {
  const lang = detectedLanguage || detectInput(text);

  if (target.toLowerCase().includes("spanish") && lang === "english") {
    return spanishToEnglishPhonetics(text);
  }

  return text;
}

async function translateText() {
  const input = document.getElementById("userInput").value.trim();

  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if (!input || !target) {
    alert("Enter text and choose a language.");
    return;
  }

  detectedLanguage = detectInput(input);

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
      document.getElementById("output").value =
        data.error || "Translation error";
      return;
    }

    let translated = data.output || "";

    translated = translated
      .replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "");

    document.getElementById("output").value = translated;

    const pronunciation = buildPronunciation(translated, target);
    document.getElementById("pronunciation").value = pronunciation;
  } catch (err) {
    document.getElementById("output").value = "Network or server error";
  }
}

function copyTranslation() {
  const output = document.getElementById("output");
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation() {
  const checked = document.getElementById("pronToggle").checked;
  document
    .getElementById("pronunciationSection")
    .classList.toggle("hidden", !checked);
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
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const browserLang = navigator.language.slice(0, 2);
  const savedLang =
    localStorage.getItem("siteLanguage") ||
    (browserLang === "es" ? "es" : "en");

  const siteLanguage = document.getElementById("siteLanguage");

  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) =>
      applyLanguage(e.target.value)
    );
  }

  applyLanguage(savedLang);

  document
    .getElementById("darkModeButton")
    .addEventListener("click", toggleDarkMode);

  document
    .getElementById("translateButton")
    .addEventListener("click", translateText);

  document
    .getElementById("copyButton")
    .addEventListener("click", copyTranslation);

  document
    .getElementById("pronToggle")
    .addEventListener("change", togglePronunciation);

  document
    .getElementById("speakNormalButton")
    .addEventListener("click", () => speak(1.0));

  document
    .getElementById("speakSlowButton")
    .addEventListener("click", () => speak(0.6));

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    document.getElementById("targetSearch").value = item.label;
    closeSuggestions(document.getElementById("targetSuggestions"));
  });
});
