const API_URL = "https://translateapp-1.onrender.com/translate";
const API_ROOT = "https://translateapp-1.onrender.com/";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;
let lastDetectedInput = "";

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

  input.addEventListener("input", updateMatches);
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
  const hasSpanishMarkers = /[áéíóúñ¿¡]/i.test(text);
  const spanishWords = /\b(que|porque|hola|gracias|usted|ustedes|para|pero|como|estoy|quiero|necesito|mañana|tambien|también)\b/i.test(normalized);

  if (hasSpanishMarkers || spanishWords) return { label: "Spanish — LATAM (Neutral)", confidence: "medium" };
  return { label: "American English", confidence: "medium" };
}

function inputChangedSignificantly(previous, current) {
  if (!previous) return true;
  const oldText = normalize(previous);
  const newText = normalize(current);
  if (Math.abs(oldText.length - newText.length) > 8) return true;
  return oldText.slice(0, 20) !== newText.slice(0, 20);
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
  showElement(el("keepDetectedButton"), "inline-block");
  hideElement(el("changeDetectedWrap"));

  el("detectedLanguageDialect").innerText = `${t("detected")}: ${localizedLanguage(detectedSelection.label)}`;
  showElement(card);
}

function keepDetected() {
  if (!detectedSelection) return;
  confirmedInputLanguage = detectedSelection.label;
  lastDetectedInput = el("userInput")?.value.trim() || "";
  localStorage.setItem("lastSourceLanguage", confirmedInputLanguage);

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
  localStorage.setItem("lastSourceLanguage", confirmedInputLanguage);

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

  return {
    text: input,
    sourceLanguage: confirmedInputLanguage || "Auto-detected or user-confirmed",
    targetLanguage: targetLabel,
    target: targetLabel,
    dialect: getTargetDialect(targetLabel),
    tone: window.CONTEXT_CONFIG?.tone?.natural || "natural and clear",
    audience: window.CONTEXT_CONFIG?.audience?.general || "general audience",
    situation: "general communication",
    goal: window.CONTEXT_CONFIG?.goal?.translate || "translate accurately",
    contextMode: window.CONTEXT_CONFIG?.contextMode?.normal || "normal",
    outputMode: window.CONTEXT_CONFIG?.outputMode?.translate || "translate",
    includeAdditionalInformation: true
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

    el("output").value = data.output || "";

    if (data.additional_information) {
      el("additionalInfo").value = data.additional_information;
      showElement(el("additionalInfoSection"), "flex");
    } else {
      el("additionalInfo").value = "";
      hideElement(el("additionalInfoSection"));
    }

    localStorage.setItem("lastTargetLanguage", targetSelection.label);
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

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  wakeApi();

  const lang = localStorage.getItem("siteLanguage") || "en";
  if (el("siteLanguage")) el("siteLanguage").value = lang;

  applyTheme(localStorage.getItem("theme") || "default");
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

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizedLanguage(item.label);
    localStorage.setItem("lastTargetLanguage", item.label);
  }, () => localStorage.getItem("lastTargetLanguage"));

  setupSearch("detectedSearch", "detectedSuggestions", setConfirmedInputLanguage, () => confirmedInputLanguage);

  const lastTarget = localStorage.getItem("lastTargetLanguage");
  if (lastTarget) {
    const found = (window.languageCatalog || []).find((item) => item.label === lastTarget);
    if (found) {
      targetSelection = found;
      el("targetSearch").value = localizedLanguage(found.label);
    }
  }
});
