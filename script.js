const API_URL = "https://translateapp-1.onrender.com/translate";

/* 🔥 WAKE RENDER */
fetch("https://translateapp-1.onrender.com/")
  .then(() => console.log("API warm"))
  .catch(() => console.log("API failed"));

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

function el(id) { return document.getElementById(id); }

function normalize(v) {
  return (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
}

/* ---------- DROPDOWNS ---------- */

function findMatches(q) {
  q = normalize(q);
  return window.languageCatalog.filter(l =>
    normalize(l.label).includes(q) ||
    (l.aliases || []).some(a => normalize(a).includes(q))
  );
}

function renderSuggestions(box, matches, onPick) {
  box.innerHTML = "";

  matches.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizedLanguage(item.label);

    div.onclick = () => {
      onPick(item);
      box.style.display = "none";
    };

    box.appendChild(div);
  });

  box.style.display = matches.length ? "block" : "none";
}

function setupSearch(inputId, boxId, onPick) {
  const input = el(inputId);
  const box = el(boxId);

  let matches = [];
  let index = -1;

  input.addEventListener("input", () => {
    matches = findMatches(input.value);
    index = -1;
    renderSuggestions(box, matches, onPick);
  });

  input.addEventListener("keydown", (e) => {
    if (!matches.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      index = (index + 1) % matches.length;
      highlight(box, index);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      index = (index - 1 + matches.length) % matches.length;
      highlight(box, index);
    }

    if (e.key === "Enter" && index >= 0) {
      e.preventDefault();
      onPick(matches[index]);
      box.style.display = "none";
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.style.display = "none";
    }
  });
}

function highlight(box, index) {
  [...box.children].forEach((c, i) =>
    c.classList.toggle("activeSuggestion", i === index)
  );
}

/* ---------- DETECTION ---------- */

function detectInput(text) {
  if (/[áéíóúñ¿¡]/i.test(text)) return { label: "Spanish — LATAM (Neutral)" };
  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput").value.trim();
  const card = el("detectedCard");

  confirmedInputLanguage = null;

  if (!text) {
    card.classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);
  el("detectedLanguageDialect").innerText =
    t("detected") + ": " + localizedLanguage(detectedSelection.label);

  card.classList.remove("hidden");
}

function keepDetected() {
  confirmedInputLanguage = detectedSelection.label;
  el("detectedLanguageDialect").innerText =
    t("confirmed") + ": " + localizedLanguage(confirmedInputLanguage);

  el("keepDetectedButton").style.display = "none";
}

/* ---------- TRANSLATE ---------- */

async function translateText() {
  const input = el("userInput").value.trim();

  if (!confirmedInputLanguage) {
    alert(t("confirmInputFirst"));
    return;
  }

  if (!input || !targetSelection) {
    alert(t("enterTextTarget"));
    return;
  }

  const btn = el("translateButton");
  btn.innerText = t("translating");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      text: input,
      target: targetSelection.label
    })
  });

  const data = await res.json();

  el("output").value = data.output || "";

  if (data.additional_information) {
    el("additionalInfo").value = data.additional_information;
    el("additionalInfoSection").classList.remove("hidden");
  }

  btn.innerText = t("translate");
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("siteLanguage") || "en";
  el("siteLanguage").value = lang;
  applySiteLanguage(lang);

  el("siteLanguage").onchange = e => applySiteLanguage(e.target.value);

  el("userInput").addEventListener("input", updateDetection);
  el("keepDetectedButton").onclick = keepDetected;
  el("translateButton").onclick = translateText;

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizedLanguage(item.label);
  });

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    el("detectedSearch").value = localizedLanguage(item.label);
  });
});
