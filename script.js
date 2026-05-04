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

function t(key) {
  const lang = el("siteLanguage")?.value || "en";
  return window.UI_TEXT?.[lang]?.[key] || key;
}

function localizedLanguage(label) {
  const lang = el("siteLanguage")?.value || "en";
  return window.TARGET_LANGUAGE_TRANSLATIONS?.[lang]?.[label] || label;
}

/* ---------- SITE LANGUAGE ---------- */

function applySiteLanguage(lang) {
  localStorage.setItem("siteLanguage", lang);

  const siteLabel = document.querySelector('label[for="siteLanguage"]');
  if (siteLabel) siteLabel.innerText = t("siteLanguage");

  if (el("inputLabel")) el("inputLabel").innerText = t("inputText");
  if (el("keepDetectedButton")) el("keepDetectedButton").innerText = t("keep");
  if (el("changeDetectedButton")) el("changeDetectedButton").innerText = t("change");
  if (el("translateButton")) el("translateButton").innerText = t("translate");
  if (el("copyButton")) el("copyButton").innerText = t("copy");

  const changeInputLabel = document.querySelector('label[for="detectedSearch"]');
  if (changeInputLabel) changeInputLabel.innerText = t("changeInput");

  const targetLabel = document.querySelector('label[for="targetSearch"]');
  if (targetLabel) targetLabel.innerText = t("translateTo");

  const outputLabel = document.querySelector('label[for="output"]');
  if (outputLabel) outputLabel.innerText = t("translation");

  const infoLabel = document.querySelector('label[for="additionalInfo"]');
  if (infoLabel) infoLabel.innerText = t("additionalInfo");

  if (detectedSelection && !confirmedInputLanguage) {
    setDetectedDisplay(detectedSelection.label);
  }

  if (confirmedInputLanguage) {
    setConfirmedDisplay(confirmedInputLanguage);
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizedLanguage(targetSelection.label);
  }

  if (detectedSelection && el("detectedSearch")) {
    el("detectedSearch").value = localizedLanguage(detectedSelection.label);
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

/* ---------- SEARCH / DROPDOWNS ---------- */

function findMatches(query) {
  const q = normalize(query);

  const catalog = window.languageCatalog || [];

  if (!q) return catalog;

  return catalog.filter(item => {
    const label = normalize(item.label);
    const aliases = (item.aliases || []).map(normalize);

    return label.includes(q) || aliases.some(alias => alias.includes(q));
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
    renderSuggestions(box, findMatches(input.value), onPick);
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
  const lower = normalize(text);

  if (/[áéíóúñ¿¡]/i.test(text) || lower.includes("que")) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function setDetectedDisplay(label) {
  if (!el("detectedLanguageDialect")) return;

  el("detectedLanguageDialect").innerText =
    t("detected") + ": " + localizedLanguage(label);
}

function setConfirmedDisplay(label) {
  if (!el("detectedLanguageDialect")) return;

  el("detectedLanguageDialect").innerText =
    t("confirmed") + ": " + localizedLanguage(label);
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");

  confirmedInputLanguage = null;

  if (!text) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
}

/* ---------- BUTTONS ---------- */

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  setConfirmedDisplay(confirmedInputLanguage);
}

function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    el("detectedSearch")?.focus();
  }
}

/* ---------- TRANSLATE ---------- */

async function translateText() {
  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || el("targetSearch")?.value.trim() || "";

  if (!confirmedInputLanguage) {
    alert(t("confirmInputFirst"));
    return;
  }

  if (!input || !target) {
    alert(t("enterTextTarget"));
    return;
  }

  const button = el("translateButton");

  try {
    if (button) {
      button.disabled = true;
      button.innerText = t("translating");
    }

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
      el("additionalInfoSection")?.classList.add("hidden");
    }

  } catch (err) {
    console.error(err);
    el("output").value = "Error";
  } finally {
    if (button) {
      button.disabled = false;
      button.innerText = t("translate");
    }
  }
}

/* ---------- COPY ---------- */

function copyTranslation() {
  const box = el("output");
  if (!box) return;

  box.select();
  document.execCommand("copy");
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    const savedLang = localStorage.getItem("siteLanguage") || "en";
    siteLanguage.value = savedLang;

    siteLanguage.addEventListener("change", (e) => {
      applySiteLanguage(e.target.value);
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
    el("targetSearch").value = localizedLanguage(item.label);
  });

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    detectedSelection = item;
    el("detectedSearch").value = localizedLanguage(item.label);
    el("changeDetectedWrap")?.classList.add("hidden");
    setConfirmedDisplay(item.label);
  });

  applySiteLanguage(el("siteLanguage")?.value || "en");
});
