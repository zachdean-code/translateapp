const targetLanguageValues = [
  "American English",
  "British English",
  "Australian English",
  "French",
  "German",
  "Italian",
  "Mexican Spanish",
  "LATAM Spanish",
  "General Colombian Spanish",
  "Paisa Spanish (Medellín)",
  "Rolo Spanish (Bogotá)",
  "Cali Spanish",
  "Santander Spanish",
  "Venezuelan Spanish",
  "Chinese",
  "Korean",
  "Japanese",
  "Russian"
];

function renderTargetLanguageOptions(lang) {
  const select = document.getElementById("targetLanguage");
  const selectedValue = select.value || "American English";
  const labels = (translations[lang] || translations.en).targetLanguageOptions;

  select.innerHTML = "";

  targetLanguageValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labels[value] || value;
    if (value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function translateText() {
  const input = document.getElementById("userInput").value;
  const target = document.getElementById("targetLanguage").value;

  fetch("https://translateapp-1.onrender.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input,
      targetLanguage: target,
    }),
  })
    .then(async (response) => {
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        document.getElementById("output").value = data.output || "";
        document.getElementById("pronunciation").value = data.pronunciation || "";
      } catch (e) {
        document.getElementById("output").value = text;
        document.getElementById("pronunciation").value = "";
      }
    })
    .catch((err) => {
      document.getElementById("output").value = "Error: " + err;
      document.getElementById("pronunciation").value = "";
    });
}

function copyTranslation() {
  const box = document.getElementById("output");
  box.select();
  document.execCommand("copy");
}

function speakSlow() {
  const text = document.getElementById("output").value;
  if (!text) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.6;
  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

function speakNormal() {
  const text = document.getElementById("output").value;
  if (!text) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

function applyLanguage(lang) {
  const t = translations[lang] || translations["en"];

  document.documentElement.lang = lang;
  document.getElementById("uiLanguageLabel").innerText = t.uiLanguageLabel;
  document.getElementById("darkModeButton").innerText = t.darkModeButton;
  document.getElementById("pageTitle").innerText = t.pageTitle;
  document.getElementById("pageSubtitle").innerText = t.pageSubtitle;
  document.getElementById("inputLabel").innerText = t.inputLabel;
  document.getElementById("translateToLabel").innerText = t.translateToLabel;
  document.getElementById("translateButton").innerText = t.translateButton;
  document.getElementById("copyButton").innerText = t.copyButton;
  document.getElementById("speakSlowButton").innerText = t.speakSlowButton;
  document.getElementById("speakNormalButton").innerText = t.speakNormalButton;
  document.getElementById("translationLabel").innerText = t.translationLabel;
  document.getElementById("pronunciationLabel").innerText = t.pronunciationLabel;
  document.getElementById("footerLine1").innerText = t.footerLine1;
  document.getElementById("footerLine2").innerText = t.footerLine2;
  document.getElementById("footerLine3").innerText = t.footerLine3;
  document.getElementById("footerLine4").innerText = t.footerLine4;
  document.getElementById("userInput").placeholder = t.userInputPlaceholder;
  document.getElementById("output").placeholder = t.outputPlaceholder;
  document.getElementById("pronunciation").placeholder = t.pronunciationPlaceholder;

  renderTargetLanguageOptions(lang);

  document.getElementById("siteLanguage").value = lang;
  localStorage.setItem("siteLanguage", lang);
}

function changeSiteLanguage() {
  const lang = document.getElementById("siteLanguage").value;
  applyLanguage(lang);
}

function detectInitialLanguage() {
  const saved = localStorage.getItem("siteLanguage");
  if (saved && translations[saved]) {
    return saved;
  }

  const browserLang = (navigator.language || "en").toLowerCase();

  if (browserLang.startsWith("es-419")) return "es-419";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("it")) return "it";
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("ko")) return "ko";
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("ru")) return "ru";

  return "en";
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const initialLanguage = detectInitialLanguage();
  applyLanguage(initialLanguage);
});
