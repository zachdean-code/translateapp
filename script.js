const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

function el(id) {
  return document.getElementById(id);
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getCatalog() {
  return window.languageCatalog || [];
}

function getLanguageTranslations() {
  return window.TARGET_LANGUAGE_TRANSLATIONS || {};
}

function t(key) {
  const lang = el("siteLanguage")?.value || "en";
  return window.UI_TEXT?.[lang]?.[key] || key;
}

function localizedLanguage(label) {
  const lang = el("siteLanguage")?.value || "en";
  const translations = getLanguageTranslations();
  return translations?.[lang]?.[label] || label;
}

/* ---------- SITE LANGUAGE ---------- */

function applySiteLanguage(lang) {
  localStorage.setItem("siteLanguage", lang);

  document.querySelector('label[for="siteLanguage"]').innerText = t("siteLanguage");
  document.querySelector("h1").innerText = t("title");
  document.querySelector(".subtitle").innerText = t("subtitle");
  document.querySelector(".description").innerText = t("description");

  el("inputLabel").innerText = t("inputText");
  el("keepDetectedButton").innerText = t("keep");
  el("changeDetectedButton").innerText = t("change");
  el("translateButton").innerText = t("translate");
  el("copyButton").innerText = t("copy");

  document.querySelector('label[for="detectedSearch"]').innerText = t("changeInput");
  document.querySelector('label[for="targetSearch"]').innerText = t("translateTo");
  document.querySelector('label[for="output"]').innerText = t("translation");
  document.querySelector('label[for="additionalInfo"]').innerText = t("additionalInfo");

  if (confirmedInputLanguage && el("detectedSearch")) {
    el("detectedSearch").value = localizedLanguage(confirmedInputLanguage);
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizedLanguage(targetSelection.label);
  }
}

/* ---------- DARK MODE ---------- */

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

/* ---------- DROPDOWN ---------- */

function findMatches(query) {
  const q = normalize(query);
  const catalog = getCatalog();

  if (!q) return catalog;

  return catalog.filter(item => {
    const label = normalize(item.label);
    const localized = normalize(localizedLanguage(item.label));
    const aliases = (item.aliases || []).map(normalize);

    return (
      label.includes(q) ||
      localized.includes(q) ||
      aliases.some(a => a.includes(q))
    );
  });
}

function renderSuggestions(container, matches, onPick) {
  if (!container) return;

  container.innerHTML = "";

  if (!matches.length) {
    container.style.display = "none";
    return;
  }

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizedLanguage(item.label);

    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(item);
      container.innerHTML = "";
      container.style.display = "none";
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick) {
  const input = el(inputId);
  const box = el(suggestionId);

  if (!input || !box) return;

  input.addEventListener("focus", () => {
    renderSuggestions(box, getCatalog(), onPick);
  });

  input.addEventListener("click", () => {
    renderSuggestions(box, getCatalog(), onPick);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.style.display = "none";
    }
  });
}

/* ---------- DETECTION ---------- */

function detectInput(text) {
  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM (Neutral)" };
  }
  return { label: "American English" };
}

function setDetectedDisplay(label) {
  el("detectedLanguageDialect").innerText =
    t("detected") + ": " + localizedLanguage(label);
}

function setConfirmedDisplay(label) {
  el("detectedLanguageDialect").innerText =
    localizedLanguage(label);
}

function confirmedInputButtons() {
  el("keepDetectedButton").style.display = "none";
}

function updateDetection() {
  const text = el("userInput").value.trim();

  confirmedInputLanguage = null;
  el("keepDetectedButton").style.display = "";

  if (!text) {
    el("detectedCard").classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);
  setDetectedDisplay(detectedSelection.label);
  el("detectedCard").classList.remove("hidden");
}

function keepDetected() {
  confirmedInputLanguage = detectedSelection.label;
  setConfirmedDisplay(confirmedInputLanguage);
  confirmedInputButtons();
}

function chooseDetectedLanguage(item) {
  confirmedInputLanguage = item.label;
  detectedSelection = item;

  el("detectedSearch").value = localizedLanguage(item.label);
  setConfirmedDisplay(item.label);
  confirmedInputButtons();

  el("changeDetectedWrap").classList.add("hidden");
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    renderSuggestions(
      el("detectedSuggestions"),
      getCatalog(),
      chooseDetectedLanguage
    );
  }
}

/* ---------- TRANSLATE ---------- */

async function translateText() {
  const input = el("userInput").value.trim();
  const target = targetSelection?.label;

  if (!confirmedInputLanguage) {
    alert(t("confirmInputFirst"));
    return;
  }

  if (!input || !target) {
    alert(t("enterTextTarget"));
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: target,
        sourceLanguage: confirmedInputLanguage
      })
    });

    const data = await res.json();

    el("output").value = data.output || "";

    if (data.additional_information) {
      el("additionalInfo").value = data.additional_information;
      el("additionalInfoSection").classList.remove("hidden");
    } else {
      el("additionalInfoSection").classList.add("hidden");
    }

  } catch {
    el("output").value = "Error";
  }
}

/* ---------- COPY ---------- */

function copyTranslation() {
  const box = el("output");
  box.select();
  document.execCommand("copy");
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const savedLang = localStorage.getItem("siteLanguage") || "en";
  el("siteLanguage").value = savedLang;

  el("siteLanguage").addEventListener("change", (e) => {
    applySiteLanguage(e.target.value);
  });

  el("userInput").addEventListener("input", updateDetection);
  el("keepDetectedButton").addEventListener("click", keepDetected);
  el("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  el("translateButton").addEventListener("click", translateText);
  el("copyButton").addEventListener("click", copyTranslation);
  el("darkModeButton").addEventListener("click", toggleDarkMode);

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizedLanguage(item.label);
  });

  setupSearch("detectedSearch", "detectedSuggestions", chooseDetectedLanguage);

  applySiteLanguage(savedLang);
});
