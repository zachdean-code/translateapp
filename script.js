const API_URL = "https://translateapp-1.onrender.com/translate";
const API_ROOT = "https://translateapp-1.onrender.com/";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;
let lastDetectedInput = "";
let lastTranslationOutput = "";

function el(id) {
  return document.getElementById(id);
}

function normalize(v) {
  return window.AppHelpers?.normalize
    ? window.AppHelpers.normalize(v)
    : (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function showElement(node, displayValue = "block") {
  if (window.AppHelpers?.showElement) return window.AppHelpers.showElement(node, displayValue);
  if (!node) return;
  node.classList.remove("hidden");
  node.hidden = false;
  node.style.display = displayValue;
}

function hideElement(node) {
  if (window.AppHelpers?.hideElement) return window.AppHelpers.hideElement(node);
  if (!node) return;
  node.classList.add("hidden");
  node.hidden = true;
  node.style.display = "none";
}

function t(key) {
  const lang = el("siteLanguage")?.value || "en";
  return window.UI_TEXT?.[lang]?.[key] || window.UI_TEXT?.en?.[key] || key;
}

function tOption(group, key) {
  const lang = el("siteLanguage")?.value || "en";
  return window.UI_TEXT?.[lang]?.[group]?.[key] || window.UI_TEXT?.en?.[group]?.[key] || key;
}

function localizedLanguage(label) {
  const lang = el("siteLanguage")?.value || "en";
  return window.TARGET_LANGUAGE_TRANSLATIONS?.[lang]?.[label] || label;
}

function wakeApi() {
  fetch(API_ROOT)
    .then(() => console.log("API warm"))
    .catch(() => console.log("API wake failed"));
}

/* ---------- SITE LANGUAGE / THEME ---------- */

function applySiteLanguage(lang) {
  localStorage.setItem("siteLanguage", lang);
  document.documentElement.lang = lang;

  const siteLabel = document.querySelector('label[for="siteLanguage"]');
  if (siteLabel) siteLabel.innerText = t("siteLanguage");

  const title = document.querySelector("h1");
  if (title) title.innerText = t("title");

  const subtitle = document.querySelector(".subtitle");
  if (subtitle) subtitle.innerText = t("subtitle");

  const description = document.querySelector(".description");
  if (description) description.innerText = t("description");

  if (el("inputLabel")) el("inputLabel").innerText = t("inputText");
  if (el("keepDetectedButton")) el("keepDetectedButton").innerText = t("keep");
  if (el("changeDetectedButton")) el("changeDetectedButton").innerText = t("change");
  if (el("translateButton")) el("translateButton").innerText = t("translate");
  if (el("copyButton")) el("copyButton").innerText = t("copy");
  if (el("footerText")) el("footerText").innerText = t("footer");

  const detectedSearchLabel = document.querySelector('label[for="detectedSearch"]');
  if (detectedSearchLabel) detectedSearchLabel.innerText = t("changeInput");

  const targetSearchLabel = document.querySelector('label[for="targetSearch"]');
  if (targetSearchLabel) targetSearchLabel.innerText = t("translateTo");

  const outputLabel = document.querySelector('label[for="output"]');
  if (outputLabel) outputLabel.innerText = t("translation");

  const additionalInfoLabel = document.querySelector('label[for="additionalInfo"]');
  if (additionalInfoLabel) additionalInfoLabel.innerText = t("additionalInfo");

  if (el("audienceLabel")) el("audienceLabel").innerText = t("audience");
  if (el("toneLabel")) el("toneLabel").innerText = t("tone");
  if (el("goalLabel")) el("goalLabel").innerText = t("goal");
  if (el("contextModeLabel")) el("contextModeLabel").innerText = t("contextMode");
  if (el("situationLabel")) el("situationLabel").innerText = t("situation");
  if (el("situationInput")) el("situationInput").placeholder = t("situationPlaceholder");
  if (el("includeInfoLabel")) el("includeInfoLabel").innerText = t("includeInfo");
  if (el("pronunciationToggleLabel")) el("pronunciationToggleLabel").innerText = t("pronunciationToggleLabel");
  if (el("pronunciationLabel")) el("pronunciationLabel").innerText = t("pronunciation");
  if (el("speakNormalButton")) el("speakNormalButton").innerText = t("speakNormal");
  if (el("speakSlowButton")) el("speakSlowButton").innerText = t("speakSlow");

  populateContextSelects(false);
  updateThemeButton();
  refreshDisplayedLanguageNames();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "default");
  updateThemeButton();
}

function updateThemeButton() {
  const btn = el("darkModeButton");
  if (!btn) return;
  btn.innerText = document.body.classList.contains("dark") ? t("light") : t("dark");
}

function refreshDisplayedLanguageNames() {
  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizedLanguage(targetSelection.label);
  }

  if (confirmedInputLanguage && el("detectedLanguageDialect")) {
    el("detectedLanguageDialect").innerText = `${t("confirmed")}: ${localizedLanguage(confirmedInputLanguage)}`;
  } else if (detectedSelection && el("detectedLanguageDialect")) {
    el("detectedLanguageDialect").innerText = `${t("detected")}: ${localizedLanguage(detectedSelection.label)}`;
  }
}

/* ---------- CONTEXT CONTROLS ---------- */

function populateSelect(selectId, configGroup, textGroup, defaultValue) {
  const select = el(selectId);
  const group = window.CONTEXT_CONFIG?.[configGroup] || {};
  if (!select) return;

  const current = select.value || defaultValue;
  select.innerHTML = "";

  Object.keys(group).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.innerText = tOption(textGroup, key);
    select.appendChild(option);
  });

  select.value = group[current] ? current : defaultValue;
}

function populateContextSelects(reset = false) {
  populateSelect("audienceSelect", "audience", "audienceOptions", "general");
  populateSelect("toneSelect", "tone", "toneOptions", "natural");
  populateSelect("goalSelect", "goal", "goalOptions", "translate");
  populateSelect("contextModeSelect", "contextMode", "contextModeOptions", "normal");

  if (reset) {
    if (el("audienceSelect")) el("audienceSelect").value = "general";
    if (el("toneSelect")) el("toneSelect").value = "natural";
    if (el("goalSelect")) el("goalSelect").value = "translate";
    if (el("contextModeSelect")) el("contextModeSelect").value = "normal";
    if (el("situationInput")) el("situationInput").value = "";
    if (el("includeInfoToggle")) el("includeInfoToggle").checked = true;
  }
}

function selectedContextValue(selectId, groupName, fallbackKey) {
  const key = el(selectId)?.value || fallbackKey;
  return window.CONTEXT_CONFIG?.[groupName]?.[key] || key;
}

/* ---------- LANGUAGE SEARCH ---------- */

function scoreLanguageMatch(item, query, priorLabel) {
  const q = normalize(query);
  const label = normalize(item.label);
  const aliases = item.aliases || [];
  const normalizedAliases = aliases.map((alias) => normalize(alias));

  if (!q) return (item.popularity || 0) / 100;

  let score = 0;
  if (label === q) score += 1000;
  if (normalizedAliases.some((alias) => alias === q)) score += 900;
  if (label.startsWith(q)) score += 800;
  if (normalizedAliases.some((alias) => alias.startsWith(q))) score += 700;
  if (q === "col" && item.dialectGroup === "colombian") score += 650;
  if (label.includes(q)) score += 500;
  if (normalizedAliases.some((alias) => alias.includes(q))) score += 450;
  if (priorLabel && item.label === priorLabel) score += 100;
  score += item.popularity || 0;

  return score;
}

function findMatches(query, priorLabel = null) {
  const q = normalize(query);
  const catalog = window.languageCatalog || [];

  if (!q) return catalog.slice(0, 12);

  return catalog
    .map((item) => ({ item, score: scoreLanguageMatch(item, q, priorLabel) }))
    .filter(({ item, score }) => {
      if (score > (item.popularity || 0)) return true;
      const label = normalize(item.label);
      const aliases = item.aliases || [];
      return label.includes(q) || aliases.some((alias) => normalize(alias).includes(q));
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 12);
}

function renderSuggestions(box, matches, onPick) {
  if (!box) return;
  box.innerHTML = "";

  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.tabIndex = -1;
    div.innerText = localizedLanguage(item.label);

    div.addEventListener("mousedown", (event) => {
      event.preventDefault();
      onPick(item);
      box.style.display = "none";
    });

    box.appendChild(div);
  });

  box.style.display = matches.length ? "block" : "none";
}

function setupSearch(inputId, boxId, onPick, getPriorLabel = () => null) {
  const input = el(inputId);
  const box = el(boxId);
  if (!input || !box) return;

  let matches = [];
  let index = -1;

  function updateMatches() {
    matches = findMatches(input.value, getPriorLabel());
    index = -1;
    renderSuggestions(box, matches, onPick);
  }

  input.addEventListener("input", () => {
    if (inputId === "targetSearch") targetSelection = null;
    updateMatches();
  });
  input.addEventListener("focus", updateMatches);

  input.addEventListener("keydown", (event) => {
    if (!matches.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      index = (index + 1) % matches.length;
      highlight(box, index);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      index = (index - 1 + matches.length) % matches.length;
      highlight(box, index);
    }

    if (event.key === "Enter" && index >= 0) {
      event.preventDefault();
      onPick(matches[index]);
      box.style.display = "none";
    }

    if (event.key === "Escape") {
      box.style.display = "none";
    }
  });

  document.addEventListener("click", (event) => {
    if (!input.contains(event.target) && !box.contains(event.target)) {
      box.style.display = "none";
    }
  });
}

function highlight(box, index) {
  [...box.children].forEach((child, i) => {
    child.classList.toggle("activeSuggestion", i === index);
  });
}

/* ---------- DETECTION ---------- */

function detectInput(text) {
  const normalized = normalize(text);
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  if (compact.length < 3) {
    return { label: null, confidence: "low" };
  }

  const hasSpanishMarkers = /[áéíóúñ¿¡]/i.test(text);
  const paisaMarkers = /\b(parce|parcero|parcera|que mas|q mas|quiubo|quihubo|gonorrea|pues parce)\b/i.test(normalized);
  const roloMarkers = /\b(sumerc[eé]|sumerce|ala|chino|china|parce pero)\b/i.test(normalized);
  const argentineMarkers = /\b(vos sos|sos|che|boludo|boluda|laburo)\b/i.test(normalized);
  const mexicanMarkers = /\b(que onda|qué onda|wey|güey|no manches|órale|orale)\b/i.test(normalized);
  const spanishWords = /\b(que|qué|porque|hola|gracias|usted|ustedes|para|pero|como|cómo|estoy|quiero|necesito|mañana|manana|tambien|también|buenos|buenas|dias|días|tarde|noche)\b/i.test(normalized);

  const australianMarkers = /\b(gday|g'day|aussie|arvo|reckon|no worries mate|mate)\b/i.test(normalized) && /\b(gday|g'day|aussie|arvo|no worries)\b/i.test(normalized);
  const britishMarkers = /\b(cheers mate|cheers|queue|colour|favour|mum|bloody|brilliant|proper|rubbish|mate)\b/i.test(normalized) && !australianMarkers;
  const englishWords = /\b(the|and|you|your|are|how|hello|thanks|thank|please|today|tomorrow|want|need|hope|good|great|morning|night|i|we|they|he|she|it)\b/i.test(normalized);

  if (paisaMarkers) return { label: "Colombian Spanish — Paisa (Medellín)", confidence: "medium" };
  if (roloMarkers) return { label: "Colombian Spanish — Rolo (Bogotá)", confidence: "medium" };
  if (argentineMarkers) return { label: "Spanish — Argentine", confidence: "medium" };
  if (mexicanMarkers) return { label: "Spanish — Mexican", confidence: "medium" };
  if (hasSpanishMarkers || spanishWords) return { label: "Spanish — LATAM (Neutral)", confidence: "medium" };
  if (australianMarkers) return { label: "Australian English", confidence: "medium" };
  if (britishMarkers) return { label: "British English", confidence: "medium" };
  if (englishWords || wordCount >= 3 || compact.length >= 12) return { label: "American English", confidence: "medium" };

  return { label: null, confidence: "low" };
}

function inputChangedSignificantly(previous, current) {
  if (!previous) return true;
  const oldText = normalize(previous);
  const newText = normalize(current);
  if (Math.abs(oldText.length - newText.length) > 8) return true;
  return oldText.slice(0, 24) !== newText.slice(0, 24);
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");
  if (!card) return;

  if (!text) {
    detectedSelection = null;
    confirmedInputLanguage = null;
    lastDetectedInput = "";
    hideElement(card);
    hideElement(el("changeDetectedWrap"));
    return;
  }

  if (confirmedInputLanguage && !inputChangedSignificantly(lastDetectedInput, text)) {
    return;
  }

  confirmedInputLanguage = null;
  detectedSelection = detectInput(text);
  lastDetectedInput = text;

  card.classList.remove("confirmed");
  hideElement(el("changeDetectedWrap"));

  if (!detectedSelection.label || detectedSelection.confidence === "low") {
    detectedSelection = null;
    hideElement(card);
    return;
  }

  showElement(el("keepDetectedButton"), "inline-block");
  el("detectedLanguageDialect").innerText = `${t("detected")}: ${localizedLanguage(detectedSelection.label)}`;
  showElement(card);
}

function keepDetected() {
  if (!detectedSelection) return;
  confirmedInputLanguage = detectedSelection.label;
  lastDetectedInput = el("userInput")?.value.trim() || "";

  const card = el("detectedCard");
  card?.classList.add("confirmed");
  el("detectedLanguageDialect").innerText = `${t("confirmed")}: ${localizedLanguage(confirmedInputLanguage)}`;
  hideElement(el("keepDetectedButton"));
  hideElement(el("changeDetectedWrap"));
}

function openDetectedChange() {
  showElement(el("changeDetectedWrap"));
  const search = el("detectedSearch");
  if (search) {
    search.value = "";
    search.focus();
  }
}

function setConfirmedInputLanguage(item) {
  confirmedInputLanguage = item.label;
  detectedSelection = item;
  lastDetectedInput = el("userInput")?.value.trim() || "";

  const card = el("detectedCard");
  card?.classList.add("confirmed");
  el("detectedLanguageDialect").innerText = `${t("confirmed")}: ${localizedLanguage(confirmedInputLanguage)}`;
  hideElement(el("keepDetectedButton"));
  hideElement(el("changeDetectedWrap"));
}

/* ---------- PAYLOAD ---------- */

function getTargetDialect(label) {
  return label || "";
}

function buildPayload(input) {
  const targetLabel = targetSelection?.label || "";
  const situationText = el("situationInput")?.value.trim() || "general communication";

  return {
    text: input,
    sourceLanguage: confirmedInputLanguage || "Auto-detected or user-confirmed",
    targetLanguage: targetLabel,
    target: targetLabel,
    dialect: getTargetDialect(targetLabel),
    tone: selectedContextValue("toneSelect", "tone", "natural"),
    audience: selectedContextValue("audienceSelect", "audience", "general"),
    situation: situationText,
    goal: selectedContextValue("goalSelect", "goal", "translate"),
    contextMode: selectedContextValue("contextModeSelect", "contextMode", "normal"),
    outputMode: window.CONTEXT_CONFIG?.outputMode?.translate || "translate",
    includeAdditionalInformation: !!el("includeInfoToggle")?.checked
  };
}

/* ---------- TRANSLATE ---------- */

async function translateText() {
  const input = el("userInput")?.value.trim() || "";

  if (!confirmedInputLanguage) {
    alert(t("confirmInputFirst"));
    return;
  }

  if (!input || !targetSelection) {
    alert(t("enterTextTarget"));
    return;
  }

  const btn = el("translateButton");
  if (btn) {
    btn.disabled = true;
    btn.innerText = t("translating");
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(input))
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || t("genericError"));
    }

    lastTranslationOutput = data.output || "";
    el("output").value = lastTranslationOutput;
    updatePronunciation();

    if (data.additional_information) {
      el("additionalInfo").value = data.additional_information;
      showElement(el("additionalInfoSection"), "flex");
    } else {
      el("additionalInfo").value = "";
      hideElement(el("additionalInfoSection"));
    }

  } catch (error) {
    console.error("Translation error:", error);
    alert(error.message || t("genericError"));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = t("translate");
    }
  }
}

function copyOutput() {
  const output = el("output");
  const text = output?.value || "";
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const btn = el("copyButton");
    if (!btn) return;
    const original = t("copy");
    btn.innerText = t("copied");
    setTimeout(() => {
      btn.innerText = original;
    }, 1200);
  }).catch(() => {
    output.focus();
    output.select();
    document.execCommand("copy");
  });
}

/* ---------- PRONUNCIATION ---------- */

function updatePronunciation() {
  const toggle = el("pronToggle");
  const section = el("pronunciationSection");
  const output = el("pronunciationOutput");
  if (!toggle || !section || !output) return;

  if (!toggle.checked || !lastTranslationOutput) {
    hideElement(section);
    return;
  }

  const pron = typeof buildPronunciation === "function"
    ? buildPronunciation(lastTranslationOutput, confirmedInputLanguage, targetSelection?.label || "")
    : "";

  if (pron) {
    output.value = pron;
  } else {
    output.value = t("unsupportedPronunciation");
  }

  showElement(section, "flex");
}

function speakOutput(rate = 1) {
  const text = el("output")?.value || "";
  if (!text || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  wakeApi();

  const lang = localStorage.getItem("siteLanguage") || "en";
  if (el("siteLanguage")) el("siteLanguage").value = lang;

  applyTheme(localStorage.getItem("theme") || "default");
  populateContextSelects(true);
  applySiteLanguage(lang);

  el("siteLanguage")?.addEventListener("change", (event) => applySiteLanguage(event.target.value));
  el("darkModeButton")?.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "default" : "dark");
  });

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", openDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyOutput);
  el("pronToggle")?.addEventListener("change", updatePronunciation);
  el("speakNormalButton")?.addEventListener("click", () => speakOutput(1));
  el("speakSlowButton")?.addEventListener("click", () => speakOutput(0.75));

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizedLanguage(item.label);
  }, () => targetSelection?.label || null);

  setupSearch("detectedSearch", "detectedSuggestions", setConfirmedInputLanguage, () => confirmedInputLanguage);

  // Do not auto-fill target language on page load. Keep selected target only during current page session.
  targetSelection = null;
  if (el("targetSearch")) el("targetSearch").value = "";
});
