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

function t(key, lang) {
  if (!uiTranslations[key]) return key;
  return uiTranslations[key][lang] || uiTranslations[key]["en"] || key;
}

function renderTargetLanguageOptions(lang) {
  const select = document.getElementById("targetLanguage");
  const currentValue = select.value || "American English";

  select.innerHTML = "";

  targetLanguageValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;

    const labelSet = uiTranslations.targetLanguageOptions[value];
    option.textContent = (labelSet && (labelSet[lang] || labelSet.en)) || value;

    if (value === currentValue) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function applyLanguage(lang) {
  document.documentElement.lang = lang;

  document.getElementById("uiLanguageLabel").innerText = t("uiLanguageLabel", lang);
  document.getElementById("darkModeButton").innerText = t("darkModeButton", lang);
  document.getElementById("pageTitle").innerText = t("pageTitle", lang);
  document.getElementById("pageSubtitle").innerText = t("pageSubtitle", lang);
  document.getElementById("pageDescription").innerText = t("pageDescription", lang);
  document.getElementById("inputLabel").innerText = t("inputLabel", lang);
  document.getElementById("translateToLabel").innerText = t("translateToLabel", lang);
  document.getElementById("translateButton").innerText = t("translateButton", lang);
  document.getElementById("translationLabel").innerText = t("translationLabel", lang);
  document.getElementById("copyButton").innerText = t("copyButton", lang);
  document.getElementById("pronunciationLabel").innerText = t("pronunciationLabel", lang);
  document.getElementById("speakSlowButton").innerText = t("speakSlowButton", lang);
  document.getElementById("speakNormalButton").innerText = t("speakNormalButton", lang);

  document.getElementById("userInput").placeholder = t("inputPlaceholder", lang);
  document.getElementById("output").placeholder = t("outputPlaceholder", lang);
  document.getElementById("pronunciation").placeholder = t("pronunciationPlaceholder", lang);

  document.getElementById("footerProduct").innerText = t("footerProduct", lang);
  document.getElementById("footerTagline").innerText = t("footerTagline", lang);
  document.getElementById("footerDescriptor").innerText = t("footerDescriptor", lang);
  document.getElementById("footerCopyright").innerText = t("footerCopyright", lang);
  document.getElementById("footerPatent").innerText = t("footerPatent", lang);

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
  if (saved && ["en", "es", "es-419", "de", "fr", "it", "zh", "ko", "ja", "ru"].includes(saved)) {
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

function translateText() {
  const input = document.getElementById("userInput").value;
  const target = document.getElementById("targetLanguage").value;

  fetch("https://translateapp-1.onrender.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: input,
      targetLanguage: target
    })
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
  box.setSelectionRange(0, 99999);
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

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const initialLanguage = detectInitialLanguage();
  applyLanguage(initialLanguage);
});
