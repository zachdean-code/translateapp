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

function safeText(id, value) {
  const node = el(id);
  if (node) node.innerText = value;
}

function safePlaceholder(id, value) {
  const node = el(id);
  if (node) node.placeholder = value || "";
}

function normalizeText(value) {
  return (value || "").toLowerCase().trim();
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
  if (s.startsWith("indonesian")) return "indonesian";
  if (s.startsWith("persian") || s.startsWith("farsi")) return "persian";
  if (s.startsWith("turkish")) return "turkish";
  if (s.startsWith("greek")) return "greek";
  if (s.startsWith("polish")) return "polish";
  if (s.startsWith("thai")) return "thai";
  if (s.startsWith("vietnamese")) return "vietnamese";
  if (s.startsWith("hebrew")) return "hebrew";

  return s;
}

function getUnavailableMessage(inputBase) {
  const messages = {
    english: "Unavailable at this time for selected language pairs.",
    spanish: "No disponible en este momento para los pares de idiomas seleccionados."
  };

  return messages[inputBase] || messages.english;
}

function ensurePronunciationStatus() {
  let status = el("pronunciationStatus");
  if (status) return status;

  const toggleRow = document.querySelector(".toggleRow");
  if (!toggleRow) return null;

  status = document.createElement("span");
  status.id = "pronunciationStatus";
  status.style.marginLeft = "8px";
  status.style.fontSize = "13px";
  status.style.opacity = "0.75";
  toggleRow.appendChild(status);
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
  safeText("pronunciationToggleLabel", t("pronunciationToggleLabel", lang));
  safeText("pronunciationLabel", t("pronunciationLabel", lang));
  safeText("speakNormalButton", t("speakNormalButton", lang));
  safeText("speakSlowButton", t("speakSlowButton", lang));
  safeText("footerProduct", t("footerProduct", lang));
  safeText("footerCopyright", t("footerCopyright", lang));
  safeText("footerPatent", t("footerPatent", lang));

  safePlaceholder("userInput", t("inputPlaceholder", lang));
  safePlaceholder("targetSearch", t("targetSearchPlaceholder", lang));
  safePlaceholder("detectedSearch", t("targetSearchPlaceholder", lang));
  safePlaceholder("output", t("outputPlaceholder", lang));
  safePlaceholder("pronunciation", t("pronunciationPlaceholder", lang));

  const useBtn = el("keepDetectedButton");
  if (useBtn && !detectionConfirmed) {
    useBtn.innerText = "Use";
  }

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
  const q = normalizeText(value);

  if (!q) return languageCatalog.slice(0, 12);

  return languageCatalog.filter((item) => {
    if (normalizeText(item.label).includes(q)) return true;
    return (item.aliases || []).some((alias) => normalizeText(alias).includes(q));
  }).slice(0, 12);
}

function closeSuggestions(container, type) {
  if (!container) return;
  container.style.display = "none";

  if (type === "target") {
    targetMatches = [];
    targetActiveIndex = -1;
  } else {
    detectedMatches = [];
    detectedActiveIndex = -1;
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

    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(item);
      closeSuggestions(container, type);
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick, type) {
  const input = el(inputId);
  const box = el(suggestionId);
  if (!input || !box) return;

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("keydown", (e) => {
    const matches = type === "target" ? targetMatches : detectedMatches;
    let activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!matches.length) {
        renderSuggestions(box, findMatches(input.value), onPick, type);
        return;
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
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if (currentMatches[idx]) {
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
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
  const lower = normalizeText(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Arabic — Modern Standard" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Chinese — Simplified" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (lower.includes("parce") || lower.includes("qué más pues")) {
    return { label: "Spanish — Colombian — Paisa (Medellín)" };
  }

  if (lower.includes("bacano") || lower.includes("sumercé")) {
    return { label: "Spanish — Colombian — Rolo (Bogotá)" };
  }

  if (lower.includes("órale") || lower.includes("wey") || lower.includes("no manches")) {
    return { label: "Spanish — Mexican" };
  }

  if (lower.includes("che ") || lower.includes("boludo") || lower.includes("vos ")) {
    return { label: "Spanish — Argentine" };
  }

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM Neutral" };
  }

  return { label: "English — American" };
}

function updateDetectionCard() {
  const input = el("userInput");
  const card = el("detectedCard");
  const display = el("detectedLanguageDialect");
  const useBtn = el("keepDetectedButton");
  const changeBtn = el("changeDetectedButton");
  const changeWrap = el("changeDetectedWrap");

  if (!input || !card || !display) return;

  const text = input.value.trim();

  if (!text) {
    card.classList.add("hidden");
    if (changeWrap) changeWrap.classList.add("hidden");
    detectedSelection = null;
    confirmedInputSelection = null;
    detectionConfirmed = false;
    return;
  }

  if (!detectionConfirmed) {
    detectedSelection = detectInput(text);
    display.innerText = `Detected language: ${detectedSelection.label}`;
    if (useBtn) {
      useBtn.classList.remove("hidden");
      useBtn.innerText = "Use";
    }
    if (changeBtn) {
      changeBtn.classList.remove("hidden");
      changeBtn.innerText = "Change";
    }
  } else {
    display.innerText = `Input language: ${confirmedInputSelection.label}`;
    if (useBtn) useBtn.classList.add("hidden");
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
    PRONUNCIATION_SUPPORTED_BASES.has(inputBase) &&
    PRONUNCIATION_SUPPORTED_BASES.has(targetBase) &&
    PRONUNCIATION_SUPPORTED_PAIRS.has(key);

  return {
    mode: supported ? "supported" : "unsupported",
    inputBase,
    targetBase
  };
}

function showPronunciationToggleRow() {
  const toggleRow = document.querySelector(".toggleRow");
  if (toggleRow) toggleRow.style.display = "";
}

function hidePronunciationToggleRow() {
  const toggleRow = document.querySelector(".toggleRow");
  if (toggleRow) toggleRow.style.display = "none";
}

function updatePronunciationAvailability() {
  const inputLabel = (confirmedInputSelection || detectedSelection || {}).label || "";
  const targetLabel = targetSelection
    ? targetSelection.label
    : (el("targetSearch")?.value.trim() || "");

  const section = el("pronunciationSection");
  const toggle = el("pronToggle");
  const toggleLabel = el("pronunciationToggleLabel");
  const status = ensurePronunciationStatus();

  if (!section || !toggle || !toggleLabel) return;

  if (!inputLabel || !targetLabel) {
    showPronunciationToggleRow();
    toggle.disabled = false;
    toggleLabel.style.opacity = "1";
    if (status) status.innerText = "";
    return;
  }

  const state = getPronunciationPairState(inputLabel, targetLabel);

  if (state.mode === "hidden") {
    hidePronunciationToggleRow();
    section.classList.add("hidden");
    toggle.checked = false;
    if (status) status.innerText = "";
    return;
  }

  showPronunciationToggleRow();

  if (state.mode === "unsupported") {
    toggle.checked = false;
    toggle.disabled = true;
    toggleLabel.style.opacity = "0.5";
    section.classList.add("hidden");
    if (status) status.innerText = getUnavailableMessage(state.inputBase);
    return;
  }

  toggle.disabled = false;
  toggleLabel.style.opacity = "1";
  if (status) status.innerText = "";
}

function latinToEnglishReaderPhonetics(text) {
  return text
    .split(/\s+/)
    .map((raw) => {
      return raw
        .toLowerCase()
        .replace(/[¡!¿?.,;:()"']/g, "")
        .replace(/á/g, "AH")
        .replace(/é/g, "AY")
        .replace(/í/g, "EE")
        .replace(/ó/g, "OH")
        .replace(/ú/g, "OO")
        .replace(/à|â/g, "AH")
        .replace(/è|ê|ë/g, "EH")
        .replace(/ì|î/g, "EE")
        .replace(/ò|ô/g, "OH")
        .replace(/ù|û/g, "OO")
        .replace(/ñ/g, "ny")
        .replace(/ll/g, "y")
        .replace(/ch/g, "ch")
        .replace(/qu/g, "k")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/j/g, "h")
        .replace(/ce/g, "say")
        .replace(/ci/g, "see")
        .replace(/ç/g, "s")
        .replace(/z/g, "z")
        .replace(/v/g, "v")
        .replace(/^hola$/g, "oh-lah")
        .replace(/^parce$/g, "par-SAY")
        .replace(/^parcero$/g, "par-SAY-roh")
        .replace(/^que$/g, "kay")
        .replace(/^qué$/g, "kay")
        .replace(/^mas$/g, "mahs")
        .replace(/^más$/g, "mahs");
    })
    .join("   ");
}

function latinToSpanishReaderPhonetics(text) {
  return text
    .split(/\s+/)
    .map((raw) => {
      return raw
        .toLowerCase()
        .replace(/[.,;:!?()"']/g, "")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/tion/g, "shon")
        .replace(/ing\b/g, "ing")
        .replace(/oo/g, "u")
        .replace(/ee/g, "i")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/a/g, "a")
        .replace(/e/g, "e")
        .replace(/i/g, "ai")
        .replace(/o/g, "ou")
        .replace(/u/g, "iu");
    })
    .join("   ");
}

function buildPronunciation(text, inputLabel, targetLabel) {
  const state = getPronunciationPairState(inputLabel, targetLabel);

  if (state.mode !== "supported") return "";

  if (state.inputBase === "english") {
    return latinToEnglishReaderPhonetics(text);
  }

  if (state.inputBase === "spanish") {
    return latinToSpanishReaderPhonetics(text);
  }

  return text;
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
      if (el("output")) el("output").value = data.error || "Translation error";
      return;
    }

    let translated = data.output || "";

    translated = translated
      .replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "")
      .trim()
      .replace(/^[\"“”']+|[\"“”']+$/g, "");

    if (el("output")) el("output").value = translated;

    const state = getPronunciationPairState(confirmedInputSelection.label, target);

    if (state.mode === "supported" && el("pronToggle")?.checked) {
      if (el("pronunciation")) {
        el("pronunciation").value = buildPronunciation(
          translated,
          confirmedInputSelection.label,
          target
        );
      }
      el("pronunciationSection")?.classList.remove("hidden");
    } else {
      if (el("pronunciation")) el("pronunciation").value = "";
      el("pronunciationSection")?.classList.add("hidden");
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
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
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
    siteLanguage.addEventListener("change", (e) => applyLanguage(e.target.value));
  }

  applyLanguage(savedLang);

  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("pronToggle")?.addEventListener("change", togglePronunciation);
  el("speakNormalButton")?.addEventListener("click", () => speak(1.0));
  el("speakSlowButton")?.addEventListener("click", () => speak(0.6));
  el("keepDetectedButton")?.addEventListener("click", confirmDetectedLanguage);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);

  el("userInput")?.addEventListener("input", () => {
    if (!detectionConfirmed) {
      detectedSelection = detectInput(el("userInput").value || "");
    }
    updateDetectionCard();
    updatePronunciationAvailability();
  });

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    if (el("targetSearch")) el("targetSearch").value = item.label;
    updatePronunciationAvailability();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = { label: item.label };
    confirmedInputSelection = { label: item.label };
    detectionConfirmed = true;
    if (el("detectedSearch")) el("detectedSearch").value = item.label;
    el("changeDetectedWrap")?.classList.add("hidden");
    updateDetectionCard();
    updatePronunciationAvailability();
  }, "detected");

  updateDetectionCard();
  updatePronunciationAvailability();
});
