const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let targetMatches = [];
let targetActiveIndex = -1;

let detectedSelection = null;
let confirmedInputSelection = null;
let detectionConfirmed = false;

const SUPPORTED_PRONUNCIATION_BASES = new Set([
  "english",
  "spanish",
  "italian",
  "french",
  "german",
  "portuguese",
  "dutch"
]);

const SUPPORTED_PRONUNCIATION_PAIRS = new Set([
  "english|spanish",
  "spanish|english",
  "english|italian",
  "italian|english",
  "english|french",
  "french|english",
  "english|german",
  "german|english",
  "english|portuguese",
  "portuguese|english",
  "english|dutch",
  "dutch|english"
]);

function safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function safePlaceholder(id, value) {
  const el = document.getElementById(id);
  if (el) el.placeholder = value || "";
}

function el(id) {
  return document.getElementById(id);
}

function getOrCreatePronunciationStatus() {
  const toggleRow = document.querySelector(".toggleRow");
  if (!toggleRow) return null;

  let status = el("pronunciationStatus");
  if (!status) {
    status = document.createElement("span");
    status.id = "pronunciationStatus";
    status.style.marginLeft = "8px";
    status.style.fontSize = "13px";
    status.style.opacity = "0.75";
    toggleRow.appendChild(status);
  }
  return status;
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
  safeText("keepDetectedButton", "Use");
  safeText("changeDetectedButton", t("changeDetectedButton", lang));
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

function normalizeText(value) {
  return (value || "").toLowerCase().trim();
}

function parseBaseLanguage(label) {
  const s = normalizeText(label);

  if (s.startsWith("english")) return "english";
  if (s.startsWith("spanish")) return "spanish";
  if (s.startsWith("italian")) return "italian";
  if (s.startsWith("french")) return "french";
  if (s.startsWith("german")) return "german";
  if (s.startsWith("portuguese")) return "portuguese";
  if (s.startsWith("dutch")) return "dutch";
  if (s.startsWith("arabic")) return "arabic";
  if (s.startsWith("persian") || s.startsWith("farsi")) return "persian";
  if (s.startsWith("hindi")) return "hindi";
  if (s.startsWith("indonesian")) return "indonesian";
  if (s.startsWith("tagalog") || s.startsWith("filipino")) return "tagalog";
  if (s.startsWith("swahili")) return "swahili";
  if (s.startsWith("amharic")) return "amharic";
  if (s.startsWith("turkish")) return "turkish";
  if (s.startsWith("chinese")) return "chinese";
  if (s.startsWith("japanese")) return "japanese";
  if (s.startsWith("korean")) return "korean";
  if (s.startsWith("russian")) return "russian";
  return s;
}

function getMessageLanguageCodeFromBase(base) {
  const map = {
    english: "en",
    spanish: "es"
  };
  return map[base] || "en";
}

function getUnavailableMessage(base) {
  const lang = getMessageLanguageCodeFromBase(base);
  const messages = {
    en: "Unavailable at this time for language pairs selected.",
    es: "No disponible en este momento para los pares de idiomas seleccionados."
  };
  return messages[lang] || messages.en;
}

function findMatches(value) {
  const q = normalizeText(value);
  if (!q) return languageCatalog.slice(0, 12);

  return languageCatalog
    .filter((item) => {
      if (normalizeText(item.label).includes(q)) return true;
      return (item.aliases || []).some((alias) => normalizeText(alias).includes(q));
    })
    .slice(0, 12);
}

function closeSuggestions(container) {
  if (!container) return;
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
  const input = el(inputId);
  const box = el(suggestionId);
  if (!input || !box) return;

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
  const lower = normalizeText(text);

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

function updateDetectionCard() {
  const card = el("detectedCard");
  const text = el("userInput")?.value.trim() || "";
  const display = el("detectedLanguageDialect");
  const changeWrap = el("changeDetectedWrap");

  if (!card || !display) return;

  if (!text) {
    card.classList.add("hidden");
    if (changeWrap) changeWrap.classList.add("hidden");
    detectedSelection = null;
    confirmedInputSelection = null;
    detectionConfirmed = false;
    return;
  }

  if (!detectedSelection) {
    detectedSelection = detectInput(text);
  }

  if (detectionConfirmed && confirmedInputSelection) {
    display.innerText = `Input language: ${confirmedInputSelection.label}`;
    const keepBtn = el("keepDetectedButton");
    const changeBtn = el("changeDetectedButton");
    if (keepBtn) keepBtn.classList.add("hidden");
    if (changeBtn) {
      changeBtn.classList.remove("hidden");
      changeBtn.innerText = "Change";
    }
  } else {
    display.innerText = `Detected language: ${detectedSelection.label}`;
    const keepBtn = el("keepDetectedButton");
    const changeBtn = el("changeDetectedButton");
    if (keepBtn) {
      keepBtn.classList.remove("hidden");
      keepBtn.innerText = "Use";
    }
    if (changeBtn) {
      changeBtn.classList.remove("hidden");
      changeBtn.innerText = "Change";
    }
  }

  card.classList.remove("hidden");
}

function confirmDetectedLanguage() {
  if (!detectedSelection) return;
  confirmedInputSelection = { ...detectedSelection };
  detectionConfirmed = true;
  const changeWrap = el("changeDetectedWrap");
  if (changeWrap) changeWrap.classList.add("hidden");
  updateDetectionCard();
  updatePronunciationAvailability();
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");
  if (!wrap.classList.contains("hidden")) {
    const input = el("detectedSearch");
    if (input) input.focus();
  }
}

function normalizeEnglishWordForSpanishReader(word) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"']/g, "")
    .replace(/th/g, "d")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/tion/g, "shun")
    .replace(/ing\b/g, "ing")
    .replace(/oo/g, "u")
    .replace(/ee/g, "i")
    .replace(/igh/g, "ai")
    .replace(/a/g, "ei")
    .replace(/e/g, "i")
    .replace(/i/g, "ai")
    .replace(/o/g, "ou")
    .replace(/u/g, "iu");
}

function englishToSpanishReaderPhonetics(text) {
  return text
    .split(/\s+/)
    .map((raw) => normalizeEnglishWordForSpanishReader(raw))
    .join("   ");
}

function spanishToEnglishPhonetics(text, targetLabel) {
  const profile = normalizeText(targetLabel);
  const words = text.split(/\s+/);

  return words
    .map((raw) => {
      let word = raw
        .toLowerCase()
        .replace(/[¡!¿?.,;:()"']/g, "")
        .replace(/á/g, "AH")
        .replace(/é/g, "AY")
        .replace(/í/g, "EE")
        .replace(/ó/g, "OH")
        .replace(/ú/g, "OO")
        .replace(/ñ/g, "ny")
        .replace(/ll/g, profile.includes("spain") ? "y" : "y")
        .replace(/ch/g, "ch")
        .replace(/qu/g, "k")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/j/g, "h")
        .replace(/ce/g, profile.includes("spain") ? "thay" : "say")
        .replace(/ci/g, profile.includes("spain") ? "thee" : "see")
        .replace(/z/g, profile.includes("spain") ? "th" : "s")
        .replace(/v/g, "b");

      word = word
        .replace(/^hola$/g, "oh-lah")
        .replace(/^parce$/g, "par-SAY")
        .replace(/^parcero$/g, "par-SAY-roh")
        .replace(/^que$/g, "kay")
        .replace(/^qué$/g, "kay")
        .replace(/^mas$/g, "mahs")
        .replace(/^más$/g, "mahs");

      word = word
        .replace(/a/g, "ah")
        .replace(/e/g, "ay")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");

      return word;
    })
    .join("   ");
}

function getPronunciationPairState(inputLabel, targetLabel) {
  const inputBase = parseBaseLanguage(inputLabel);
  const targetBase = parseBaseLanguage(targetLabel);

  if (!inputBase || !targetBase) {
    return { mode: "unsupported", inputBase, targetBase };
  }

  if (inputBase === targetBase) {
    return { mode: "hidden", inputBase, targetBase };
  }

  const key = `${inputBase}|${targetBase}`;
  const supported =
    SUPPORTED_PRONUNCIATION_BASES.has(inputBase) &&
    SUPPORTED_PRONUNCIATION_BASES.has(targetBase) &&
    SUPPORTED_PRONUNCIATION_PAIRS.has(key);

  return {
    mode: supported ? "supported" : "unsupported",
    inputBase,
    targetBase
  };
}

function updatePronunciationAvailability() {
  const inputLabel = (confirmedInputSelection || detectedSelection || {}).label || "";
  const targetLabel = (targetSelection || {}).label || (el("targetSearch")?.value.trim() || "");

  const pronSection = el("pronunciationSection");
  const pronToggle = el("pronToggle");
  const pronLabel = el("pronunciationToggleLabel");
  const pronStatus = getOrCreatePronunciationStatus();

  if (!pronSection || !pronToggle || !pronLabel) return;

  if (!inputLabel || !targetLabel) {
    if (pronStatus) pronStatus.innerText = "";
    pronToggle.disabled = false;
    pronLabel.style.opacity = "1";
    return;
  }

  const state = getPronunciationPairState(inputLabel, targetLabel);

  if (state.mode === "hidden") {
    pronSection.classList.add("hidden");
    const toggleRow = document.querySelector(".toggleRow");
    if (toggleRow) toggleRow.style.display = "none";
    if (pronStatus) pronStatus.innerText = "";
    return;
  }

  const toggleRow = document.querySelector(".toggleRow");
  if (toggleRow) toggleRow.style.display = "";

  if (state.mode === "unsupported") {
    pronSection.classList.add("hidden");
    pronToggle.checked = false;
    pronToggle.disabled = true;
    pronLabel.style.opacity = "0.5";
    if (pronStatus) {
      pronStatus.innerText = getUnavailableMessage(state.inputBase);
    }
    return;
  }

  pronToggle.disabled = false;
  pronLabel.style.opacity = "1";
  if (pronStatus) pronStatus.innerText = "";
}

function buildPronunciation(text, inputLabel, targetLabel) {
  const state = getPronunciationPairState(inputLabel, targetLabel);

  if (state.mode !== "supported") return "";

  if (state.inputBase === "english" && state.targetBase === "spanish") {
    return spanishToEnglishPhonetics(text, targetLabel);
  }

  if (state.inputBase === "spanish" && state.targetBase === "english") {
    return englishToSpanishReaderPhonetics(text);
  }

  return text;
}

async function translateText() {
  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection ? targetSelection.label : (el("targetSearch")?.value.trim() || "");

  if (!input || !target) {
    alert("Enter text and choose a language.");
    return;
  }

  if (!detectedSelection) {
    detectedSelection = detectInput(input);
  }

  if (!confirmedInputSelection) {
    confirmedInputSelection = { ...detectedSelection };
    detectionConfirmed = true;
    updateDetectionCard();
  }

  updatePronunciationAvailability();

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
      el("output").value = data.error || "Translation error";
      return;
    }

    let translated = data.output || "";

    translated = translated
      .replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "");

    if (el("output")) el("output").value = translated;

    const state = getPronunciationPairState(confirmedInputSelection.label, target);
    const pronToggle = el("pronToggle");
    if (state.mode === "supported" && pronToggle && pronToggle.checked) {
      el("pronunciation").value = buildPronunciation(
        translated,
        confirmedInputSelection.label,
        target
      );
      el("pronunciationSection").classList.remove("hidden");
    } else {
      if (el("pronunciation")) el("pronunciation").value = "";
      el("pronunciationSection").classList.add("hidden");
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

function togglePronunciation() {
  const checked = !!el("pronToggle")?.checked;
  const section = el("pronunciationSection");
  if (section) section.classList.toggle("hidden", !checked);
}

function speak(rate) {
  const text = el("output")?.value.trim() || "";
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

  const siteLanguage = el("siteLanguage");

  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) =>
      applyLanguage(e.target.value)
    );
  }

  applyLanguage(savedLang);

  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("pronToggle")?.addEventListener("change", togglePronunciation);
  el("speakNormalButton")?.addEventListener("click", () => speak(1.0));
  el("speakSlowButton")?.addEventListener("click", () => speak(0.6));

  el("userInput")?.addEventListener("input", () => {
    detectedSelection = detectInput(el("userInput").value || "");
    if (!detectionConfirmed) {
      confirmedInputSelection = null;
    }
    updateDetectionCard();
    updatePronunciationAvailability();
  });

  el("keepDetectedButton")?.addEventListener("click", confirmDetectedLanguage);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    if (el("targetSearch")) el("targetSearch").value = item.label;
    closeSuggestions(el("targetSuggestions"));
    updatePronunciationAvailability();
  });

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = { label: item.label };
    confirmedInputSelection = { label: item.label };
    detectionConfirmed = true;
    if (el("detectedSearch")) el("detectedSearch").value = item.label;
    closeSuggestions(el("detectedSuggestions"));
    if (el("changeDetectedWrap")) el("changeDetectedWrap").classList.add("hidden");
    updateDetectionCard();
    updatePronunciationAvailability();
  });

  updateDetectionCard();
  updatePronunciationAvailability();
});
