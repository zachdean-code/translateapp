// === API ===
const API_URL = "https://translateapp-1.onrender.com/translate";

// === STATE ===
let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;
let confirmationMode = null;

// === HELPERS ===
function el(id) {
  return document.getElementById(id);
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstExistingId(ids) {
  for (const id of ids) {
    const node = el(id);
    if (node) return node;
  }
  return null;
}

function setText(id, value) {
  const node = el(id);
  if (!node) return;
  node.textContent = value ?? "";
}

function setValue(id, value) {
  const node = el(id);
  if (!node) return;
  node.value = value ?? "";
}

function show(node) {
  if (!node) return;
  node.hidden = false;
  node.style.display = "";
  node.setAttribute("aria-hidden", "false");
}

function hide(node) {
  if (!node) return;
  node.hidden = true;
  node.style.display = "none";
  node.setAttribute("aria-hidden", "true");
}

function setTabEnabled(node, enabled) {
  if (!node) return;
  if (enabled) {
    node.removeAttribute("tabindex");
    node.setAttribute("aria-hidden", "false");
  } else {
    node.setAttribute("tabindex", "-1");
    node.setAttribute("aria-hidden", "true");
  }
}

function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// === ELEMENT LOOKUP ===
// Keep these IDs aligned with your HTML.
// If your HTML uses different IDs, change them here once.
const ui = {
  sourceText: firstExistingId(["sourceText", "inputText", "textInput", "sourceInput"]),
  translateBtn: firstExistingId(["translateBtn", "translateButton"]),
  copyBtn: firstExistingId(["copyBtn", "copyButton"]),
  clearBtn: firstExistingId(["clearBtn", "clearButton"]),
  darkModeToggle: firstExistingId(["darkModeToggle", "themeToggle", "darkToggle"]),
  siteLanguage: firstExistingId(["siteLanguage"]),
  sourceLanguage: firstExistingId(["sourceLanguage", "inputLanguage"]),
  targetLanguage: firstExistingId(["targetLanguage", "outputLanguage"]),
  outputText: firstExistingId(["translationOutput", "outputText", "translatedText"]),
  pronunciationToggle: firstExistingId(["showPronunciation", "pronunciationToggle"]),
  pronunciationWrap: firstExistingId(["pronunciationSection", "pronunciationWrap"]),
  pronunciationOutput: firstExistingId(["pronunciationOutput", "pronunciationGuide"]),
  detectLabel: firstExistingId(["detectedLanguageLabel", "detectedLanguage", "inputLanguageStatus"]),
  confirmWrap: firstExistingId(["languageConfirmWrap", "confirmLanguageWrap"]),
  confirmText: firstExistingId(["languageConfirmText", "confirmLanguageText"]),
  confirmYes: firstExistingId(["confirmLanguageYes", "languageConfirmYes"]),
  confirmNo: firstExistingId(["confirmLanguageNo", "languageConfirmNo"]),
  status: firstExistingId(["statusMessage", "statusText", "appStatus"])
};

// === LANGUAGE CATALOG ===
// Expects window.languageCatalog or window.languages if you already have one.
// If not present, fallback to a small safe list.
const LANGUAGE_CATALOG =
  safeArray(window.languageCatalog).length
    ? window.languageCatalog
    : safeArray(window.languages).length
      ? window.languages
      : [
          { code: "en", name: "English", aliases: ["english", "inglés", "ingles"] },
          { code: "es", name: "Spanish", aliases: ["spanish", "español", "espanol"] },
          { code: "fr", name: "French", aliases: ["french", "français", "francais"] },
          { code: "pt", name: "Portuguese", aliases: ["portuguese", "português", "portugues"] }
        ];

function findLanguage(input) {
  const needle = normalize(input);
  if (!needle) return null;

  for (const lang of LANGUAGE_CATALOG) {
    const names = [
      lang.code,
      lang.name,
      ...(Array.isArray(lang.aliases) ? lang.aliases : [])
    ].map(normalize);

    if (names.includes(needle)) return lang;
  }

  for (const lang of LANGUAGE_CATALOG) {
    const names = [
      lang.code,
      lang.name,
      ...(Array.isArray(lang.aliases) ? lang.aliases : [])
    ].map(normalize);

    if (names.some(name => name.includes(needle) || needle.includes(name))) {
      return lang;
    }
  }

  return null;
}

function getSelectedLanguage(selectEl) {
  if (!selectEl) return null;
  const raw = selectEl.value || "";
  return findLanguage(raw) || { code: raw, name: raw };
}

// === ACCESSIBILITY / TAB ORDER HARDENING ===
function hardenFocusModel() {
  // Output areas should not be tabbable.
  if (ui.outputText) {
    ui.outputText.setAttribute("readonly", "readonly");
    ui.outputText.setAttribute("tabindex", "-1");
    ui.outputText.setAttribute("aria-readonly", "true");
  }

  if (ui.pronunciationOutput) {
    ui.pronunciationOutput.setAttribute("tabindex", "-1");
    ui.pronunciationOutput.setAttribute("aria-readonly", "true");
  }

  // Hidden pronunciation section should stay out of tab flow.
  updatePronunciationVisibility();

  // Confirmation buttons only tabbable when visible.
  if (ui.confirmWrap && ui.confirmWrap.hidden) {
    setTabEnabled(ui.confirmYes, false);
    setTabEnabled(ui.confirmNo, false);
  }
}

function updatePronunciationVisibility() {
  const enabled = !!ui.pronunciationToggle?.checked;

  if (!ui.pronunciationWrap) return;

  if (enabled) {
    show(ui.pronunciationWrap);
    setTabEnabled(ui.pronunciationOutput, false); // output still not tabbable
  } else {
    hide(ui.pronunciationWrap);
    setTabEnabled(ui.pronunciationOutput, false);
  }
}

// === THEME ===
function applySavedTheme() {
  const saved = localStorage.getItem("theme");
  const dark = saved === "dark";
  document.documentElement.classList.toggle("dark", dark);
  if (ui.darkModeToggle) ui.darkModeToggle.checked = dark;
}

function bindTheme() {
  if (!ui.darkModeToggle) return;

  ui.darkModeToggle.addEventListener("change", () => {
    const dark = !!ui.darkModeToggle.checked;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
}

// === LANGUAGE CONFIRMATION ===
function showLanguageConfirmation(detectedName) {
  if (!ui.confirmWrap || !ui.confirmText) return;

  confirmationMode = "pending";
  show(ui.confirmWrap);
  setTabEnabled(ui.confirmYes, true);
  setTabEnabled(ui.confirmNo, true);
  ui.confirmText.textContent = `I detected the input as ${detectedName}. Is that correct?`;
}

function hideLanguageConfirmation() {
  if (!ui.confirmWrap) return;

  confirmationMode = null;
  hide(ui.confirmWrap);
  setTabEnabled(ui.confirmYes, false);
  setTabEnabled(ui.confirmNo, false);
}

function updateDetectedLabel() {
  const text =
    confirmedInputLanguage?.name ||
    detectedSelection?.name ||
    "Input language not confirmed";
  if (ui.detectLabel) ui.detectLabel.textContent = text;
}

function bindLanguageConfirmation() {
  if (ui.confirmYes) {
    ui.confirmYes.addEventListener("click", () => {
      confirmedInputLanguage = detectedSelection;
      updateDetectedLabel();
      hideLanguageConfirmation();
    });
  }

  if (ui.confirmNo) {
    ui.confirmNo.addEventListener("click", () => {
      confirmedInputLanguage = getSelectedLanguage(ui.sourceLanguage);
      updateDetectedLabel();
      hideLanguageConfirmation();
      if (ui.sourceLanguage) ui.sourceLanguage.focus();
    });
  }

  if (ui.sourceLanguage) {
    ui.sourceLanguage.addEventListener("change", () => {
      confirmedInputLanguage = getSelectedLanguage(ui.sourceLanguage);
      updateDetectedLabel();
      hideLanguageConfirmation();
    });
  }
}

// === OUTPUT ===
function renderTranslation(result) {
  const translated =
    result?.translation ??
    result?.output ??
    result?.translated_text ??
    "";

  const pronunciation =
    result?.pronunciation ??
    result?.pronunciation_guide ??
    "";

  if (ui.outputText) {
    if ("value" in ui.outputText) ui.outputText.value = translated;
    else ui.outputText.textContent = translated;
  }

  if (ui.pronunciationOutput) {
    if ("value" in ui.pronunciationOutput) ui.pronunciationOutput.value = pronunciation;
    else ui.pronunciationOutput.textContent = pronunciation;
  }

  setStatus(translated ? "Translation complete." : "No translation returned.");
}

function clearOutputs() {
  if (ui.outputText) {
    if ("value" in ui.outputText) ui.outputText.value = "";
    else ui.outputText.textContent = "";
  }

  if (ui.pronunciationOutput) {
    if ("value" in ui.pronunciationOutput) ui.pronunciationOutput.value = "";
    else ui.pronunciationOutput.textContent = "";
  }

  setStatus("");
}

function setStatus(message) {
  if (ui.status) ui.status.textContent = message || "";
}

// === COPY ===
async function copyOutput() {
  const value =
    ui.outputText && "value" in ui.outputText
      ? ui.outputText.value
      : ui.outputText?.textContent || "";

  if (!isNonEmpty(value)) {
    setStatus("Nothing to copy yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Copied.");
    // Do not force focus anywhere. This avoids the tab loop problem.
  } catch (error) {
    console.error("Copy failed:", error);
    setStatus("Copy failed.");
  }
}

// === DETECTION ===
function inferDetectedLanguage(apiResult) {
  const raw =
    apiResult?.detected_language ||
    apiResult?.detectedLanguage ||
    apiResult?.source_language ||
    apiResult?.input_language ||
    "";

  const match = findLanguage(raw);
  return match || (raw ? { code: raw, name: raw } : null);
}

// === REQUEST ===
async function runTranslation() {
  const text = ui.sourceText?.value?.trim() || "";
  targetSelection = getSelectedLanguage(ui.targetLanguage);
  const selectedInput = getSelectedLanguage(ui.sourceLanguage);

  if (!text) {
    setStatus("Enter text first.");
    ui.sourceText?.focus();
    return;
  }

  if (!targetSelection?.code) {
    setStatus("Choose a target language.");
    ui.targetLanguage?.focus();
    return;
  }

  setStatus("Translating...");

  if (ui.translateBtn) {
    ui.translateBtn.disabled = true;
    ui.translateBtn.setAttribute("aria-busy", "true");
  }

  try {
    const payload = {
      text,
      target_language: targetSelection.code,
      input_language: confirmedInputLanguage?.code || selectedInput?.code || "auto",
      site_language: ui.siteLanguage?.value || "en",
      include_pronunciation: !!ui.pronunciationToggle?.checked
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    renderTranslation(result);

    const detected = inferDetectedLanguage(result);
    if (detected) {
      detectedSelection = detected;

      if (!confirmedInputLanguage && normalize(selectedInput?.code) === "auto") {
        showLanguageConfirmation(detected.name);
      } else {
        updateDetectedLabel();
      }
    }
  } catch (error) {
    console.error("Translation failed:", error);
    setStatus("Translation failed. Check API / Render logs.");
  } finally {
    if (ui.translateBtn) {
      ui.translateBtn.disabled = false;
      ui.translateBtn.removeAttribute("aria-busy");
    }
  }
}

// === BINDINGS ===
function bindPrimaryActions() {
  ui.translateBtn?.addEventListener("click", runTranslation);
  ui.copyBtn?.addEventListener("click", copyOutput);

  ui.clearBtn?.addEventListener("click", () => {
    if (ui.sourceText) ui.sourceText.value = "";
    clearOutputs();
    detectedSelection = null;
    confirmedInputLanguage = null;
    updateDetectedLabel();
    hideLanguageConfirmation();
    ui.sourceText?.focus();
  });

  ui.pronunciationToggle?.addEventListener("change", () => {
    updatePronunciationVisibility();
  });

  ui.sourceText?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runTranslation();
    }
  });
}

// === INIT ===
function init() {
  applySavedTheme();
  bindTheme();
  bindLanguageConfirmation();
  bindPrimaryActions();
  hardenFocusModel();
  updateDetectedLabel();
  setStatus("");
}

document.addEventListener("DOMContentLoaded", init);}

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
