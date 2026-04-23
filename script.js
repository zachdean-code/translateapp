const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

function el(id) {
  return document.getElementById(id);
}

function isSpanishUI() {
  return (el("siteLanguage")?.value || "en").startsWith("es");
}

function localizeLanguageLabel(label) {
  const lang = isSpanishUI() ? "es" : "en";
  return TARGET_LANGUAGE_TRANSLATIONS[lang]?.[label] || label;
}

function updateAdditionalInfo(text) {
  const box = el("additionalInfo");
  const section = el("additionalInfoSection");
  if (!box || !section) return;

  const value = (text || "").trim();

  if (value) {
    box.value = value;
    section.classList.remove("hidden");
  } else {
    box.value = "";
    section.classList.add("hidden");
  }
}

function setDetectedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;
  display.innerText =
    (isSpanishUI() ? "Idioma detectado: " : "Detected language: ") +
    localizeLanguageLabel(label);
}

function setConfirmedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;

  if (confirmationMode === "chosen") {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada elegido: " : "Input language chosen: ") +
      localizeLanguageLabel(label);
  } else {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada detectado: " : "Input language detected: ") +
      localizeLanguageLabel(label);
  }
}

function styleConfirmationRow() {
  const keepBtn = el("keepDetectedButton");
  const row = document.querySelector(".detectedButtons");
  const card = el("detectedCard");
  if (!keepBtn || !row || !card) return;

  row.style.display = "flex";
  row.style.width = "100%";
  row.style.alignItems = "center";

  if (confirmedInputLanguage) {
    card.classList.add("confirmed");
    keepBtn.classList.add("hidden");
    row.style.justifyContent = "flex-end";
    row.style.gap = "10px";
    row.style.marginTop = "0";
  } else {
    card.classList.remove("confirmed");
    keepBtn.classList.remove("hidden");
    row.style.justifyContent = "flex-start";
    row.style.gap = "10px";
    row.style.marginTop = "10px";
  }
}

function updateTranslateState() {
  const button = el("translateButton");
  if (!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage() {
  confirmedInputLanguage = null;
  confirmationMode = null;

  el("changeDetectedWrap")?.classList.add("hidden");
  if (el("detectedSearch")) el("detectedSearch").value = "";

  updateAdditionalInfo("");
  styleConfirmationRow();
  updateTranslateState();
}

function scoreLanguageMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalize(value);

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter(row => row.score < 9999)
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label))
    .map(row => row.item)
    .slice(0, 12);
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

  items.forEach((item, i) => {
    item.classList.toggle("activeSuggestion", i === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick, type) {
  if (!container) return;
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

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizeLanguageLabel(item.label);

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
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("click", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      closeSuggestions(box, type);

      if (type === "target" && !input.value.trim() && targetSelection) {
        input.value = localizeLanguageLabel(targetSelection.label);
      }

      if (type === "detected") {
        if (!input.value.trim() && confirmedInputLanguage) {
          input.value = localizeLanguageLabel(confirmedInputLanguage);
        } else if (!input.value.trim() && detectedSelection) {
          input.value = localizeLanguageLabel(detectedSelection.label);
        }
      }
    }, 120);
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
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if (currentMatches[idx]) {
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
      }
    }

    if (e.key === "Escape" || e.key === "Tab") {
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
  const lower = normalize(text);
  const tokens = tokenize(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return { label: "British English" };
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return { label: "Australian English" };
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { label: "Spanish — Mexican" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  if (tokens.length < 2 && lower.length < 6) {
    return null;
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");

  resetConfirmedLanguage();

  if (!text) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  const detected = detectInput(text);

  if (!detected) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detected;
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
  styleConfirmationRow();
}

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  confirmationMode = "detected";
  setConfirmedDisplay(confirmedInputLanguage);
  el("changeDetectedWrap")?.classList.add("hidden");
  styleConfirmationRow();
  updateTranslateState();
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    const input = el("detectedSearch");
    if (input) {
      input.focus();
      renderSuggestions(el("detectedSuggestions"), findMatches(""), (item) => {
        confirmedInputLanguage = item.label;
        confirmationMode = "chosen";
        detectedSelection = { label: item.label };
        input.value = localizeLanguageLabel(item.label);
        wrap.classList.add("hidden");
        setConfirmedDisplay(item.label);
        styleConfirmationRow();
        updateTranslateState();
      }, "detected");
    }
  }
}

function getTargetConfig(label) {
  const normalized = normalize(label);

  const exact = {
    "american english": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },

    "spanish — latam (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "spanish — mexican": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "spanish — central american": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "spanish — caribbean": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "spanish — peruvian": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "spanish — argentine": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "spanish — chilean": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "spanish — general colombian": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "spanish — venezuelan": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },

    "colombian spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    "french": { targetLanguage: "French", dialect: "Standard" },
    "german": { targetLanguage: "German", dialect: "Standard" },
    "italian": { targetLanguage: "Italian", dialect: "Standard" },

    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    "iranian persian — farsi": { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    "afghan persian — dari": { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    "tajik persian — tajik": { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    "hindi": { targetLanguage: "Hindi", dialect: "Standard" },
    "indonesian": { targetLanguage: "Indonesian", dialect: "Standard" },
    "filipino (tagalog)": { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    "swahili": { targetLanguage: "Swahili", dialect: "Standard" },
    "amharic": { targetLanguage: "Amharic", dialect: "Standard" },
    "turkish": { targetLanguage: "Turkish", dialect: "Standard" },

    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "korean": { targetLanguage: "Korean", dialect: "Standard" },
    "japanese": { targetLanguage: "Japanese", dialect: "Standard" },
    "russian": { targetLanguage: "Russian", dialect: "Standard" }
  };

  if (exact[normalized]) return exact[normalized];

  if (normalized === "latam" || normalized === "spanish" || normalized === "espanol" || normalized === "español") {
    return { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" };
  }

  if (normalized === "paisa") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (normalized === "rolo") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (normalized === "cali") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" };
  }

  if (normalized === "santander") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" };
  }

  if (normalized === "english") {
    return { targetLanguage: "English", dialect: "American English" };
  }

  if (normalized === "arabic") {
    return { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" };
  }

  if (normalized === "persian" || normalized === "farsi") {
    return { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" };
  }

  if (normalized === "portuguese") {
    return { targetLanguage: "Portuguese", dialect: "Standard" };
  }

  if (normalized === "chinese") {
    return { targetLanguage: "Chinese", dialect: "Mandarin Chinese" };
  }

  return { targetLanguage: label, dialect: "Standard" };
}

function getAudienceValue() {
  const raw = el("contextAudience")?.value || "";
  return CONTEXT_AUDIENCE_MAP[raw] || "general";
}

function getToneValue() {
  const raw = el("contextTone")?.value || "";
  return CONTEXT_TONE_MAP[raw] || "natural";
}

function getGoalValue() {
  const raw = el("contextSituation")?.value || "";
  return CONTEXT_GOAL_MAP[raw] || "translate accurately";
}

async function translateText() {
  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.confirmInput : UI_TEXT.en.alerts.confirmInput);
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || "";

  if (!input || !target) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.enterTextAndLanguage : UI_TEXT.en.alerts.enterTextAndLanguage);
    return;
  }

  const enhanced = !!el("contextToggle")?.checked;
  const targetConfig = getTargetConfig(target);

  try {
    const button = el("translateButton");
    if (button) {
      button.disabled = true;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translating : UI_TEXT.en.buttons.translating;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: targetConfig.targetLanguage,
        dialect: targetConfig.dialect,
        sourceLanguage: confirmedInputLanguage,
        tone: enhanced ? getToneValue() : "natural",
        audience: enhanced ? getAudienceValue() : "general",
        goal: enhanced ? getGoalValue() : "translate accurately",
        includeAdditionalInformation: true
      })
    });

    const data = await response.json();

    const translated = data.output || "";
    const additionalInfo =
      data.additional_information ||
      data.additionalInfo ||
      data.context_note ||
      data.usage_note ||
      data.additionalNotes ||
      "";

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (el("output")) el("output").value = translated;
    updateAdditionalInfo(additionalInfo);
  } catch (err) {
    if (el("output")) el("output").value = isSpanishUI() ? "Error de red" : "Network error";
    updateAdditionalInfo("");
  } finally {
    const button = el("translateButton");
    if (button) {
      button.disabled = false;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translate : UI_TEXT.en.buttons.translate;
    }
    updateTranslateState();
  }
}

function copyTranslation() {
  const box = el("output");
  if (!box) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(box.value).catch(() => {});
  } else {
    box.select();
    document.execCommand("copy");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if (btn) {
    btn.innerText = isDark
      ? (isSpanishUI() ? UI_TEXT.es.buttons.dark : UI_TEXT.en.buttons.dark)
      : (isSpanishUI() ? UI_TEXT.es.buttons.light : UI_TEXT.en.buttons.light);
  }
}

function applySiteLanguage(lang) {
  const isSpanish = lang.startsWith("es");
  const pack = isSpanish ? UI_TEXT.es : UI_TEXT.en;

  const siteLabel = document.querySelector('label[for="siteLanguage"]');
  const title = document.querySelector("h1");
  const subtitle = document.querySelector(".subtitle");
  const description = document.querySelector(".description");
  const detectedLabel = document.querySelector('label[for="detectedSearch"]');
  const targetLabel = document.querySelector('label[for="targetSearch"]');
  const outputLabel = document.querySelector('label[for="output"]');
  const addlLabel = document.querySelector('label[for="additionalInfo"]');
  const contextToggleLabel = document.querySelector('label[for="contextToggle"]');
  const footer = document.querySelector("#footerText");

  if (siteLabel) siteLabel.innerText = pack.labels.siteLanguage;
  if (title) title.innerText = pack.title;
  if (subtitle) subtitle.innerText = pack.subtitle;
  if (description) description.innerText = pack.description;
  if (el("inputLabel")) el("inputLabel").innerText = pack.labels.inputText;
  if (el("keepDetectedButton")) el("keepDetectedButton").innerText = pack.buttons.keep;
  if (el("changeDetectedButton")) el("changeDetectedButton").innerText = pack.buttons.change;
  if (detectedLabel) detectedLabel.innerText = pack.labels.changeInputLanguage;
  if (targetLabel) targetLabel.innerText = pack.labels.translateTo;
  if (el("translateButton")) el("translateButton").innerText = pack.buttons.translate;
  if (outputLabel) outputLabel.innerText = pack.labels.translation;
  if (el("copyButton")) el("copyButton").innerText = pack.buttons.copy;
  if (addlLabel) addlLabel.innerText = pack.labels.additionalInformation;
  if (contextToggleLabel) contextToggleLabel.innerText = pack.labels.enhancedContext;
  if (footer) footer.innerHTML = pack.footer;

  const btn = el("darkModeButton");
  if (btn) {
    const isDark = document.body.classList.contains("dark");
    btn.innerText = isDark ? pack.buttons.dark : pack.buttons.light;
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizeLanguageLabel(targetSelection.label);
  }

  if (confirmedInputLanguage) {
    setConfirmedDisplay(confirmedInputLanguage);
  } else if (detectedSelection) {
    setDetectedDisplay(detectedSelection.label);
  }

  styleConfirmationRow();
  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if (isDark) {
    document.body.classList.add("dark");
  }

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applySiteLanguage(e.target.value));
  }

  applySiteLanguage(savedLang);

  const contextToggle = el("contextToggle");
  if (contextToggle) {
    el("contextSection")?.classList.toggle("hidden", !contextToggle.checked);
    setSectionDisabled(el("contextSection"), !contextToggle.checked);

    contextToggle.addEventListener("change", (e) => {
      el("contextSection")?.classList.toggle("hidden", !e.target.checked);
      setSectionDisabled(el("contextSection"), !e.target.checked);
    });
  }

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("targetSuggestions"), "target");
    updateTranslateState();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    confirmationMode = "chosen";
    detectedSelection = { label: item.label };
    el("detectedSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("detectedSuggestions"), "detected");
    el("changeDetectedWrap")?.classList.add("hidden");
    setConfirmedDisplay(item.label);
    styleConfirmationRow();
    updateTranslateState();
  }, "detected");

  if (el("translateButton")) el("translateButton").disabled = true;
  if (el("additionalInfoSection")) el("additionalInfoSection").classList.add("hidden");

  styleConfirmationRow();
  updateTranslateState();
});    box.value = "";
    section.classList.add("hidden");
  }
}

function setDetectedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;
  display.innerText =
    (isSpanishUI() ? "Idioma detectado: " : "Detected language: ") +
    localizeLanguageLabel(label);
}

function setConfirmedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;

  if (confirmationMode === "chosen") {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada elegido: " : "Input language chosen: ") +
      localizeLanguageLabel(label);
  } else {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada detectado: " : "Input language detected: ") +
      localizeLanguageLabel(label);
  }
}

function styleConfirmationRow() {
  const keepBtn = el("keepDetectedButton");
  const row = document.querySelector(".detectedButtons");
  const card = el("detectedCard");
  if (!keepBtn || !row || !card) return;

  row.style.display = "flex";
  row.style.width = "100%";
  row.style.alignItems = "center";

  if (confirmedInputLanguage) {
    card.classList.add("confirmed");
    keepBtn.classList.add("hidden");
    row.style.justifyContent = "flex-end";
    row.style.gap = "10px";
    row.style.marginTop = "0";
  } else {
    card.classList.remove("confirmed");
    keepBtn.classList.remove("hidden");
    row.style.justifyContent = "flex-start";
    row.style.gap = "10px";
    row.style.marginTop = "10px";
  }
}

function updateTranslateState() {
  const button = el("translateButton");
  if (!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage() {
  confirmedInputLanguage = null;
  confirmationMode = null;

  el("changeDetectedWrap")?.classList.add("hidden");
  if (el("detectedSearch")) el("detectedSearch").value = "";

  updateAdditionalInfo("");
  styleConfirmationRow();
  updateTranslateState();
}

function scoreLanguageMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalize(value);

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter(row => row.score < 9999)
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label))
    .map(row => row.item)
    .slice(0, 12);
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

  items.forEach((item, i) => {
    item.classList.toggle("activeSuggestion", i === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick, type) {
  if (!container) return;
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

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizeLanguageLabel(item.label);

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
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("click", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      closeSuggestions(box, type);

      if (type === "target" && !input.value.trim() && targetSelection) {
        input.value = localizeLanguageLabel(targetSelection.label);
      }

      if (type === "detected") {
        if (!input.value.trim() && confirmedInputLanguage) {
          input.value = localizeLanguageLabel(confirmedInputLanguage);
        } else if (!input.value.trim() && detectedSelection) {
          input.value = localizeLanguageLabel(detectedSelection.label);
        }
      }
    }, 120);
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
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if (currentMatches[idx]) {
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
      }
    }

    if (e.key === "Escape" || e.key === "Tab") {
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
  const lower = normalize(text);
  const tokens = tokenize(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return { label: "British English" };
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return { label: "Australian English" };
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { label: "Spanish — Mexican" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  if (tokens.length < 2 && lower.length < 6) {
    return null;
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");

  resetConfirmedLanguage();

  if (!text) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  const detected = detectInput(text);

  if (!detected) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detected;
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
  styleConfirmationRow();
}

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  confirmationMode = "detected";
  setConfirmedDisplay(confirmedInputLanguage);
  el("changeDetectedWrap")?.classList.add("hidden");
  styleConfirmationRow();
  updateTranslateState();
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    const input = el("detectedSearch");
    if (input) {
      input.focus();
      renderSuggestions(el("detectedSuggestions"), findMatches(""), (item) => {
        confirmedInputLanguage = item.label;
        confirmationMode = "chosen";
        detectedSelection = { label: item.label };
        input.value = localizeLanguageLabel(item.label);
        wrap.classList.add("hidden");
        setConfirmedDisplay(item.label);
        styleConfirmationRow();
        updateTranslateState();
      }, "detected");
    }
  }
}

function getTargetConfig(label) {
  const normalized = normalize(label);

  const exact = {
    "american english": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },

    "spanish — latam (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "spanish — mexican": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "spanish — central american": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "spanish — caribbean": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "spanish — peruvian": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "spanish — argentine": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "spanish — chilean": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "spanish — general colombian": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "spanish — venezuelan": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },

    "colombian spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    "french": { targetLanguage: "French", dialect: "Standard" },
    "german": { targetLanguage: "German", dialect: "Standard" },
    "italian": { targetLanguage: "Italian", dialect: "Standard" },

    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    "iranian persian — farsi": { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    "afghan persian — dari": { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    "tajik persian — tajik": { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    "hindi": { targetLanguage: "Hindi", dialect: "Standard" },
    "indonesian": { targetLanguage: "Indonesian", dialect: "Standard" },
    "filipino (tagalog)": { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    "swahili": { targetLanguage: "Swahili", dialect: "Standard" },
    "amharic": { targetLanguage: "Amharic", dialect: "Standard" },
    "turkish": { targetLanguage: "Turkish", dialect: "Standard" },

    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "korean": { targetLanguage: "Korean", dialect: "Standard" },
    "japanese": { targetLanguage: "Japanese", dialect: "Standard" },
    "russian": { targetLanguage: "Russian", dialect: "Standard" }
  };

  if (exact[normalized]) return exact[normalized];

  if (normalized === "latam" || normalized === "spanish" || normalized === "espanol" || normalized === "español") {
    return { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" };
  }

  if (normalized === "paisa") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (normalized === "rolo") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (normalized === "cali") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" };
  }

  if (normalized === "santander") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" };
  }

  if (normalized === "english") {
    return { targetLanguage: "English", dialect: "American English" };
  }

  if (normalized === "arabic") {
    return { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" };
  }

  if (normalized === "persian" || normalized === "farsi") {
    return { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" };
  }

  if (normalized === "portuguese") {
    return { targetLanguage: "Portuguese", dialect: "Standard" };
  }

  if (normalized === "chinese") {
    return { targetLanguage: "Chinese", dialect: "Mandarin Chinese" };
  }

  return { targetLanguage: label, dialect: "Standard" };
}

function getAudienceValue() {
  const raw = el("contextAudience")?.value || "";
  return CONTEXT_AUDIENCE_MAP[raw] || "general";
}

function getToneValue() {
  const raw = el("contextTone")?.value || "";
  return CONTEXT_TONE_MAP[raw] || "natural";
}

function getGoalValue() {
  const raw = el("contextSituation")?.value || "";
  return CONTEXT_GOAL_MAP[raw] || "translate accurately";
}

async function translateText() {
  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.confirmInput : UI_TEXT.en.alerts.confirmInput);
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || "";

  if (!input || !target) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.enterTextAndLanguage : UI_TEXT.en.alerts.enterTextAndLanguage);
    return;
  }

  const enhanced = !!el("contextToggle")?.checked;
  const targetConfig = getTargetConfig(target);

  try {
    const button = el("translateButton");
    if (button) {
      button.disabled = true;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translating : UI_TEXT.en.buttons.translating;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: targetConfig.targetLanguage,
        dialect: targetConfig.dialect,
        sourceLanguage: confirmedInputLanguage,
        tone: enhanced ? getToneValue() : "natural",
        audience: enhanced ? getAudienceValue() : "general",
        goal: enhanced ? getGoalValue() : "translate accurately",
        includeAdditionalInformation: true
      })
    });

    const data = await response.json();

    const translated = data.output || "";
    const additionalInfo =
      data.additional_information ||
      data.additionalInfo ||
      data.context_note ||
      data.usage_note ||
      data.additionalNotes ||
      "";

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (el("output")) el("output").value = translated;
    updateAdditionalInfo(additionalInfo);
  } catch (err) {
    if (el("output")) el("output").value = isSpanishUI() ? "Error de red" : "Network error";
    updateAdditionalInfo("");
  } finally {
    const button = el("translateButton");
    if (button) {
      button.disabled = false;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translate : UI_TEXT.en.buttons.translate;
    }
    updateTranslateState();
  }
}

function copyTranslation() {
  const box = el("output");
  if (!box) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(box.value).catch(() => {});
  } else {
    box.select();
    document.execCommand("copy");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if (btn) {
    btn.innerText = isDark
      ? (isSpanishUI() ? UI_TEXT.es.buttons.dark : UI_TEXT.en.buttons.dark)
      : (isSpanishUI() ? UI_TEXT.es.buttons.light : UI_TEXT.en.buttons.light);
  }
}

function applySiteLanguage(lang) {
  const isSpanish = lang.startsWith("es");
  const pack = isSpanish ? UI_TEXT.es : UI_TEXT.en;

  const siteLabel = document.querySelector('label[for="siteLanguage"]');
  const title = document.querySelector("h1");
  const subtitle = document.querySelector(".subtitle");
  const description = document.querySelector(".description");
  const detectedLabel = document.querySelector('label[for="detectedSearch"]');
  const targetLabel = document.querySelector('label[for="targetSearch"]');
  const outputLabel = document.querySelector('label[for="output"]');
  const addlLabel = document.querySelector('label[for="additionalInfo"]');
  const contextToggleLabel = document.querySelector('label[for="contextToggle"]');
  const footer = document.querySelector("#footerText");

  if (siteLabel) siteLabel.innerText = pack.labels.siteLanguage;
  if (title) title.innerText = pack.title;
  if (subtitle) subtitle.innerText = pack.subtitle;
  if (description) description.innerText = pack.description;
  if (el("inputLabel")) el("inputLabel").innerText = pack.labels.inputText;
  if (el("keepDetectedButton")) el("keepDetectedButton").innerText = pack.buttons.keep;
  if (el("changeDetectedButton")) el("changeDetectedButton").innerText = pack.buttons.change;
  if (detectedLabel) detectedLabel.innerText = pack.labels.changeInputLanguage;
  if (targetLabel) targetLabel.innerText = pack.labels.translateTo;
  if (el("translateButton")) el("translateButton").innerText = pack.buttons.translate;
  if (outputLabel) outputLabel.innerText = pack.labels.translation;
  if (el("copyButton")) el("copyButton").innerText = pack.buttons.copy;
  if (addlLabel) addlLabel.innerText = pack.labels.additionalInformation;
  if (contextToggleLabel) contextToggleLabel.innerText = pack.labels.enhancedContext;
  if (footer) footer.innerHTML = pack.footer;

  const btn = el("darkModeButton");
  if (btn) {
    const isDark = document.body.classList.contains("dark");
    btn.innerText = isDark ? pack.buttons.dark : pack.buttons.light;
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizeLanguageLabel(targetSelection.label);
  }

  if (confirmedInputLanguage) {
    setConfirmedDisplay(confirmedInputLanguage);
  } else if (detectedSelection) {
    setDetectedDisplay(detectedSelection.label);
  }

  styleConfirmationRow();
  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if (isDark) {
    document.body.classList.add("dark");
  }

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applySiteLanguage(e.target.value));
  }

  applySiteLanguage(savedLang);

  const contextToggle = el("contextToggle");
  if (contextToggle) {
    el("contextSection")?.classList.toggle("hidden", !contextToggle.checked);
    setSectionDisabled(el("contextSection"), !contextToggle.checked);

    contextToggle.addEventListener("change", (e) => {
      el("contextSection")?.classList.toggle("hidden", !e.target.checked);
      setSectionDisabled(el("contextSection"), !e.target.checked);
    });
  }

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("targetSuggestions"), "target");
    updateTranslateState();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    confirmationMode = "chosen";
    detectedSelection = { label: item.label };
    el("detectedSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("detectedSuggestions"), "detected");
    el("changeDetectedWrap")?.classList.add("hidden");
    setConfirmedDisplay(item.label);
    styleConfirmationRow();
    updateTranslateState();
  }, "detected");

  if (el("translateButton")) el("translateButton").disabled = true;
  if (el("additionalInfoSection")) el("additionalInfoSection").classList.add("hidden");

  styleConfirmationRow();
  updateTranslateState();
});    box.value = "";
    section.classList.add("hidden");
  }
}

function setDetectedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;
  display.innerText =
    (isSpanishUI() ? "Idioma detectado: " : "Detected language: ") +
    localizeLanguageLabel(label);
}

function setConfirmedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;

  if (confirmationMode === "chosen") {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada elegido: " : "Input language chosen: ") +
      localizeLanguageLabel(label);
  } else {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada detectado: " : "Input language detected: ") +
      localizeLanguageLabel(label);
  }
}

function styleConfirmationRow() {
  const keepBtn = el("keepDetectedButton");
  const row = document.querySelector(".detectedButtons");
  const card = el("detectedCard");
  if (!keepBtn || !row || !card) return;

  row.style.display = "flex";
  row.style.width = "100%";
  row.style.alignItems = "center";

  if (confirmedInputLanguage) {
    card.classList.add("confirmed");
    keepBtn.classList.add("hidden");
    row.style.justifyContent = "flex-end";
    row.style.gap = "10px";
    row.style.marginTop = "0";
  } else {
    card.classList.remove("confirmed");
    keepBtn.classList.remove("hidden");
    row.style.justifyContent = "flex-start";
    row.style.gap = "10px";
    row.style.marginTop = "10px";
  }
}

function updateTranslateState() {
  const button = el("translateButton");
  if (!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage() {
  confirmedInputLanguage = null;
  confirmationMode = null;

  el("changeDetectedWrap")?.classList.add("hidden");
  if (el("detectedSearch")) el("detectedSearch").value = "";

  updateAdditionalInfo("");
  styleConfirmationRow();
  updateTranslateState();
}

function scoreLanguageMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalize(value);

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter(row => row.score < 9999)
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label))
    .map(row => row.item)
    .slice(0, 12);
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

  items.forEach((item, i) => {
    item.classList.toggle("activeSuggestion", i === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick, type) {
  if (!container) return;
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

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizeLanguageLabel(item.label);

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
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("click", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      closeSuggestions(box, type);

      if (type === "target" && !input.value.trim() && targetSelection) {
        input.value = localizeLanguageLabel(targetSelection.label);
      }

      if (type === "detected") {
        if (!input.value.trim() && confirmedInputLanguage) {
          input.value = localizeLanguageLabel(confirmedInputLanguage);
        } else if (!input.value.trim() && detectedSelection) {
          input.value = localizeLanguageLabel(detectedSelection.label);
        }
      }
    }, 120);
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
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if (currentMatches[idx]) {
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
      }
    }

    if (e.key === "Escape" || e.key === "Tab") {
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
  const lower = normalize(text);
  const tokens = tokenize(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return { label: "British English" };
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return { label: "Australian English" };
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { label: "Spanish — Mexican" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  if (tokens.length < 2 && lower.length < 6) {
    return null;
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");

  resetConfirmedLanguage();

  if (!text) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  const detected = detectInput(text);

  if (!detected) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detected;
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
  styleConfirmationRow();
}

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  confirmationMode = "detected";
  setConfirmedDisplay(confirmedInputLanguage);
  el("changeDetectedWrap")?.classList.add("hidden");
  styleConfirmationRow();
  updateTranslateState();
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    const input = el("detectedSearch");
    if (input) {
      input.focus();
      renderSuggestions(el("detectedSuggestions"), findMatches(""), (item) => {
        confirmedInputLanguage = item.label;
        confirmationMode = "chosen";
        detectedSelection = { label: item.label };
        input.value = localizeLanguageLabel(item.label);
        wrap.classList.add("hidden");
        setConfirmedDisplay(item.label);
        styleConfirmationRow();
        updateTranslateState();
      }, "detected");
    }
  }
}

function getTargetConfig(label) {
  const normalized = normalize(label);

  const exact = {
    "american english": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },

    "spanish — latam (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "spanish — mexican": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "spanish — central american": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "spanish — caribbean": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "spanish — peruvian": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "spanish — argentine": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "spanish — chilean": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "spanish — general colombian": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "spanish — venezuelan": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },

    "colombian spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    "french": { targetLanguage: "French", dialect: "Standard" },
    "german": { targetLanguage: "German", dialect: "Standard" },
    "italian": { targetLanguage: "Italian", dialect: "Standard" },

    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    "iranian persian — farsi": { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    "afghan persian — dari": { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    "tajik persian — tajik": { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    "hindi": { targetLanguage: "Hindi", dialect: "Standard" },
    "indonesian": { targetLanguage: "Indonesian", dialect: "Standard" },
    "filipino (tagalog)": { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    "swahili": { targetLanguage: "Swahili", dialect: "Standard" },
    "amharic": { targetLanguage: "Amharic", dialect: "Standard" },
    "turkish": { targetLanguage: "Turkish", dialect: "Standard" },

    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "korean": { targetLanguage: "Korean", dialect: "Standard" },
    "japanese": { targetLanguage: "Japanese", dialect: "Standard" },
    "russian": { targetLanguage: "Russian", dialect: "Standard" }
  };

  if (exact[normalized]) return exact[normalized];

  if (normalized === "latam" || normalized === "spanish" || normalized === "espanol" || normalized === "español") {
    return { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" };
  }

  if (normalized === "paisa") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (normalized === "rolo") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (normalized === "cali") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" };
  }

  if (normalized === "santander") {
    return { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" };
  }

  if (normalized === "english") {
    return { targetLanguage: "English", dialect: "American English" };
  }

  if (normalized === "arabic") {
    return { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" };
  }

  if (normalized === "persian" || normalized === "farsi") {
    return { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" };
  }

  if (normalized === "portuguese") {
    return { targetLanguage: "Portuguese", dialect: "Standard" };
  }

  if (normalized === "chinese") {
    return { targetLanguage: "Chinese", dialect: "Mandarin Chinese" };
  }

  return { targetLanguage: label, dialect: "Standard" };
}

function getAudienceValue() {
  const raw = el("contextAudience")?.value || "";
  return CONTEXT_AUDIENCE_MAP[raw] || "general";
}

function getToneValue() {
  const raw = el("contextTone")?.value || "";
  return CONTEXT_TONE_MAP[raw] || "natural";
}

function getGoalValue() {
  const raw = el("contextSituation")?.value || "";
  return CONTEXT_GOAL_MAP[raw] || "translate accurately";
}

async function translateText() {
  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.confirmInput : UI_TEXT.en.alerts.confirmInput);
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || "";

  if (!input || !target) {
    alert(isSpanishUI() ? UI_TEXT.es.alerts.enterTextAndLanguage : UI_TEXT.en.alerts.enterTextAndLanguage);
    return;
  }

  const enhanced = !!el("contextToggle")?.checked;
  const targetConfig = getTargetConfig(target);

  try {
    const button = el("translateButton");
    if (button) {
      button.disabled = true;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translating : UI_TEXT.en.buttons.translating;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: targetConfig.targetLanguage,
        dialect: targetConfig.dialect,
        sourceLanguage: confirmedInputLanguage,
        tone: enhanced ? getToneValue() : "natural",
        audience: enhanced ? getAudienceValue() : "general",
        goal: enhanced ? getGoalValue() : "translate accurately",
        includeAdditionalInformation: true
      })
    });

    const data = await response.json();

    const translated = data.output || "";
    const additionalInfo =
      data.additional_information ||
      data.additionalInfo ||
      data.context_note ||
      data.usage_note ||
      data.additionalNotes ||
      "";

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    if (el("output")) el("output").value = translated;
    updateAdditionalInfo(additionalInfo);
  } catch (err) {
    if (el("output")) el("output").value = isSpanishUI() ? "Error de red" : "Network error";
    updateAdditionalInfo("");
  } finally {
    const button = el("translateButton");
    if (button) {
      button.disabled = false;
      button.innerText = isSpanishUI() ? UI_TEXT.es.buttons.translate : UI_TEXT.en.buttons.translate;
    }
    updateTranslateState();
  }
}

function copyTranslation() {
  const box = el("output");
  if (!box) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(box.value).catch(() => {});
  } else {
    box.select();
    document.execCommand("copy");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if (btn) {
    btn.innerText = isDark
      ? (isSpanishUI() ? UI_TEXT.es.buttons.dark : UI_TEXT.en.buttons.dark)
      : (isSpanishUI() ? UI_TEXT.es.buttons.light : UI_TEXT.en.buttons.light);
  }
}

function applySiteLanguage(lang) {
  const isSpanish = lang.startsWith("es");
  const pack = isSpanish ? UI_TEXT.es : UI_TEXT.en;

  document.querySelector('label[for="siteLanguage"]').innerText = pack.labels.siteLanguage;
  document.querySelector("h1").innerText = pack.title;
  document.querySelector(".subtitle").innerText = pack.subtitle;
  document.querySelector(".description").innerText = pack.description;
  el("inputLabel").innerText = pack.labels.inputText;
  el("keepDetectedButton").innerText = pack.buttons.keep;
  el("changeDetectedButton").innerText = pack.buttons.change;
  document.querySelector('label[for="detectedSearch"]').innerText = pack.labels.changeInputLanguage;
  document.querySelector('label[for="targetSearch"]').innerText = pack.labels.translateTo;
  el("translateButton").innerText = pack.buttons.translate;
  document.querySelector('label[for="output"]').innerText = pack.labels.translation;
  el("copyButton").innerText = pack.buttons.copy;
  document.querySelector('label[for="additionalInfo"]').innerText = pack.labels.additionalInformation;
  document.querySelector('label[for="contextToggle"]').innerText = pack.labels.enhancedContext;

  const btn = el("darkModeButton");
  if (btn) {
    const isDark = document.body.classList.contains("dark");
    btn.innerText = isDark ? pack.buttons.dark : pack.buttons.light;
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizeLanguageLabel(targetSelection.label);
  }

  if (confirmedInputLanguage) {
    setConfirmedDisplay(confirmedInputLanguage);
  } else if (detectedSelection) {
    setDetectedDisplay(detectedSelection.label);
  }

  styleConfirmationRow();

  const footer = document.querySelector("#footerText");
  if (footer) {
    footer.innerHTML = pack.footer;
  }

  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if (isDark) {
    document.body.classList.add("dark");
  }

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applySiteLanguage(e.target.value));
  }

  applySiteLanguage(savedLang);

  const contextToggle = el("contextToggle");
  if (contextToggle) {
    el("contextSection")?.classList.toggle("hidden", !contextToggle.checked);
    setSectionDisabled(el("contextSection"), !contextToggle.checked);

    contextToggle.addEventListener("change", (e) => {
      el("contextSection")?.classList.toggle("hidden", !e.target.checked);
      setSectionDisabled(el("contextSection"), !e.target.checked);
    });
  }

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("targetSuggestions"), "target");
    updateTranslateState();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    confirmationMode = "chosen";
    detectedSelection = { label: item.label };
    el("detectedSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("detectedSuggestions"), "detected");
    el("changeDetectedWrap")?.classList.add("hidden");
    setConfirmedDisplay(item.label);
    styleConfirmationRow();
    updateTranslateState();
  }, "detected");

  if (el("translateButton")) el("translateButton").disabled = true;
  if (el("additionalInfoSection")) el("additionalInfoSection").classList.add("hidden");

  styleConfirmationRow();
  updateTranslateState();
});
