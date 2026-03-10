const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

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
  safeText("changeDetectedLabel", t("changeDetectedLabel", lang));
  safeText("translateToLabel", t("translateToLabel", lang));
  safeText("translateButton", t("translateButton", lang));
  safeText("translationLabel", t("translationLabel", lang));
  safeText("copyButton", t("copyButton", lang));
  safeText("keepDetectedButton", t("keepDetectedButton", lang));
  safeText("changeDetectedButton", t("changeDetectedButton", lang));
  safeText("pronunciationToggleLabel", t("pronunciationToggleLabel", lang));
  safeText("pronunciationLabel", t("pronunciationLabel", lang));
  safeText("speakNormalButton", t("speakNormalButton", lang));
  safeText("speakSlowButton", t("speakSlowButton", lang));
  safeText("footerProduct", t("footerProduct", lang));
  safeText("footerTagline", t("footerTagline", lang));
  safeText("footerDescriptor", t("footerDescriptor", lang));
  safeText("footerCopyright", t("footerCopyright", lang));
  safeText("footerPatent", t("footerPatent", lang));

  safePlaceholder("userInput", t("inputPlaceholder", lang));
  safePlaceholder("targetSearch", t("targetSearchPlaceholder", lang));
  safePlaceholder("detectedSearch", t("targetSearchPlaceholder", lang));
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

  return languageCatalog.filter((item) => {
    if (item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some((alias) => alias.toLowerCase().includes(q));
  }).slice(0, 12);
}

function closeSuggestions(container, type) {
  container.style.display = "none";
  if (type === "target") {
    targetActiveIndex = -1;
    targetMatches = [];
  } else {
    detectedActiveIndex = -1;
    detectedMatches = [];
  }
}

function highlightActive(container, type) {
  const items = container.querySelectorAll(".suggestionItem");
  const activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((item, index) => {
    item.classList.toggle("activeSuggestion", index === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick, type) {
  container.innerHTML = "";

  if (!matches.length) {
    closeSuggestions(container, type);
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
    div.innerText = item.label;
    div.onclick = () => onPick(item);
    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick, type) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionId);

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("keydown", (e) => {
    let matches = type === "target" ? targetMatches : detectedMatches;
    let activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!matches.length) {
        renderSuggestions(box, findMatches(input.value), onPick, type);
        matches = type === "target" ? targetMatches : detectedMatches;
        if (!matches.length) return;
      }
      activeIndex = (activeIndex + 1) % matches.length;
      if (type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;
      highlightActive(box, type);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!matches.length) return;
      activeIndex = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
      if (type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;
      highlightActive(box, type);
    }

    if (e.key === "Enter") {
      const idx = type === "target" ? targetActiveIndex : detectedActiveIndex;
      const list = type === "target" ? targetMatches : detectedMatches;

      if (box.style.display === "block" && idx >= 0 && list[idx]) {
        e.preventDefault();
        onPick(list[idx]);
      }
    }

    if (e.key === "Escape") {
      closeSuggestions(box, type);
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      closeSuggestions(box, type);
    }
  });
}

function detectInput(text) {
  const lower = text.toLowerCase();

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Arabic — Modern Standard" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (lower.includes("parce") || lower.includes("quiubo") || lower.includes("qué más pues")) {
    return { label: "Spanish — Paisa (Medellín)" };
  }

  if (lower.includes("che ") || lower.includes("boludo") || lower.includes("vení") || lower.includes("sos ")) {
    return { label: "Spanish — Argentine" };
  }

  if (lower.includes("órale") || lower.includes("wey") || lower.includes("no manches")) {
    return { label: "Spanish — Mexican" };
  }

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "English — American" };
}

function updateDetection() {
  const text = document.getElementById("userInput").value.trim();
  const card = document.getElementById("detectedCard");

  if (!text) {
    card.classList.add("hidden");
    detectedSelection = null;
    document.getElementById("changeDetectedWrap").classList.add("hidden");
    return;
  }

  if (!detectedSelection) {
    detectedSelection = detectInput(text);
  }

  document.getElementById("detectedLanguageDialect").innerText =
    "Detected Language and Dialect: " + detectedSelection.label;

  card.classList.remove("hidden");
}

function keepDetected() {
  document.getElementById("changeDetectedWrap").classList.add("hidden");
  document.getElementById("detectedSearch").value = "";
  closeSuggestions(document.getElementById("detectedSuggestions"), "detected");
}

function toggleDetectedChange() {
  const wrap = document.getElementById("changeDetectedWrap");
  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    document.getElementById("detectedSearch").focus();
  }
}

function normalizeSpanishWord(word) {
  return word
    .toLowerCase()
    .replace(/[¡!¿?.,;:()"']/g, "")
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/gue/g, "ge")
    .replace(/gui/g, "gi")
    .replace(/que/g, "ke")
    .replace(/qui/g, "ki")
    .replace(/ll/g, "y")
    .replace(/ñ/g, "ny")
    .replace(/ch/g, "ch")
    .replace(/j/g, "h")
    .replace(/ge/g, "he")
    .replace(/gi/g, "hee")
    .replace(/ce/g, "seh")
    .replace(/ci/g, "see")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/h/g, "")
    .replace(/y$/g, "ee");
}

function spanishToEnglishPhonetics(text) {
  const cleaned = text.replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  return words.map((raw) => {
    const punctuation = raw.match(/[¡!¿?.,;:()"']+$/)?.[0] || "";
    const word = normalizeSpanishWord(raw);

    const transformed = word
      .replace(/a/g, "ah")
      .replace(/e/g, "eh")
      .replace(/i/g, "ee")
      .replace(/o/g, "oh")
      .replace(/u/g, "oo")
      .replace(/b/g, "b")
      .replace(/c/g, "k")
      .replace(/d/g, "d")
      .replace(/f/g, "f")
      .replace(/g/g, "g")
      .replace(/k/g, "k")
      .replace(/l/g, "l")
      .replace(/m/g, "m")
      .replace(/n/g, "n")
      .replace(/p/g, "p")
      .replace(/q/g, "k")
      .replace(/r/g, "r")
      .replace(/s/g, "s")
      .replace(/t/g, "t")
      .replace(/w/g, "w")
      .replace(/x/g, "ks")
      .replace(/y/g, "y")
      .replace(/ny/g, "ny")
      .replace(/rr/g, "rr");

    return transformed + punctuation;
  }).join(" ");
}

function buildPronunciation(text, target) {
  const lowerTarget = (target || "").toLowerCase();

  if (lowerTarget.includes("spanish")) {
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

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("output").value = data.error || "Translation error";
      return;
    }

    let translated = data.output || data.translation || "";
    translated = translated.replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "").trim();

    document.getElementById("output").value = translated;
    document.getElementById("pronunciation").value = buildPronunciation(translated, target);

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
  document.getElementById("pronunciationSection").classList.toggle("hidden", !checked);
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

  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const siteLanguage = document.getElementById("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applyLanguage(e.target.value));
  }
  applyLanguage(savedLang);

  document.getElementById("darkModeButton").addEventListener("click", toggleDarkMode);
  document.getElementById("userInput").addEventListener("input", () => {
    detectedSelection = null;
    updateDetection();
  });
  document.getElementById("keepDetectedButton").addEventListener("click", keepDetected);
  document.getElementById("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  document.getElementById("translateButton").addEventListener("click", translateText);
  document.getElementById("copyButton").addEventListener("click", copyTranslation);
  document.getElementById("pronToggle").addEventListener("change", togglePronunciation);

  document.getElementById("speakNormalButton").addEventListener("click", () => speak(1.0));
  document.getElementById("speakSlowButton").addEventListener("click", () => speak(0.6));

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    document.getElementById("targetSearch").value = item.label;
    closeSuggestions(document.getElementById("targetSuggestions"), "target");
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = { label: item.label };
    document.getElementById("detectedSearch").value = item.label;
    closeSuggestions(document.getElementById("detectedSuggestions"), "detected");
    updateDetection();
    document.getElementById("changeDetectedWrap").classList.add("hidden");
  }, "detected");
});
