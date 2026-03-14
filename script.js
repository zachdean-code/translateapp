
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

let detectedLanguage = null;
let confirmedInputLanguage = null;

/* ----------------------
   LANGUAGE OPTIONS
-----------------------*/

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

/* ----------------------
   SIMPLE LANGUAGE DETECT
-----------------------*/

function detectLanguage(text){

  if(/[áéíóúñ¿¡]/i.test(text)){
    return "Spanish";
  }

  return "English";
}

function updateDetection(){

  const text = document.getElementById("userInput").value.trim();

  confirmedInputLanguage = null;

  const translateButton = document.getElementById("translateButton");
  translateButton.disabled = true;

  if(!text){
    detectedLanguage = null;
    return;
  }

  detectedLanguage = detectLanguage(text);

  const detectedBox = document.getElementById("detectedLanguageDialect");
  if(detectedBox){
    detectedBox.innerText = "Detected Language: " + detectedLanguage;
  }
}

/* ----------------------
   CONFIRMATION LOGIC
-----------------------*/

function keepDetectedLanguage(){

  if(!detectedLanguage) return;

  confirmedInputLanguage = detectedLanguage;

  const translateButton = document.getElementById("translateButton");
  translateButton.disabled = false;
}

function changeDetectedLanguage(){

  const manual = document.getElementById("detectedSearch").value;

  if(!manual) return;

  confirmedInputLanguage = manual;

  const translateButton = document.getElementById("translateButton");
  translateButton.disabled = false;
}

/* ----------------------
   PRONUNCIATION
-----------------------*/

function spanishForEnglishReader(text){
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      return word
        .toLowerCase()
        .replace(/ñ/g,"ny")
        .replace(/ll/g,"y")
        .replace(/que/g,"kay")
        .replace(/qui/g,"kee")
        .replace(/ce/g,"say")
        .replace(/ci/g,"see")
        .replace(/a/g,"ah")
        .replace(/e/g,"eh")
        .replace(/i/g,"ee")
        .replace(/o/g,"oh")
        .replace(/u/g,"oo");
    })
    .join("   ");
}

function buildPronunciation(translatedText, targetLanguage){

  if(!translatedText) return "";

  const target = (targetLanguage || "").toLowerCase();

  if(target.includes("spanish")){
    return spanishForEnglishReader(translatedText);
  }

  if(target.includes("english")){
    return translatedText;
  }

  return "";
}

/* ----------------------
   TRANSLATION
-----------------------*/

function translateText() {

  if(!confirmedInputLanguage){
    alert("Please confirm the detected language first.");
    return;
  }

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
      sourceLanguage: confirmedInputLanguage
    }),
  })
    .then(async (response) => {
      const text = await response.text();

      try {
        const data = JSON.parse(text);

        const translated = data.output || "";

        document.getElementById("output").value = translated;

        const pronunciation = buildPronunciation(translated, target);

        document.getElementById("pronunciation").value = pronunciation;

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

/* ----------------------
   COPY
-----------------------*/

function copyTranslation() {
  const box = document.getElementById("output");
  box.select();
  document.execCommand("copy");
}

/* ----------------------
   SPEECH
-----------------------*/

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

/* ----------------------
   DARK MODE
-----------------------*/

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

/* ----------------------
   UI LANGUAGE
-----------------------*/

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

  renderTargetLanguageOptions(lang);

  document.getElementById("siteLanguage").value = lang;
  localStorage.setItem("siteLanguage", lang);
}

function changeSiteLanguage() {
  const lang = document.getElementById("siteLanguage").value;
  applyLanguage(lang);
}

/* ----------------------
   INITIAL LANGUAGE
-----------------------*/

function detectInitialLanguage() {
  const saved = localStorage.getItem("siteLanguage");
  if (saved && translations[saved]) {
    return saved;
  }

  const browserLang = (navigator.language || "en").toLowerCase();

  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("it")) return "it";

  return "en";
}

/* ----------------------
   STARTUP
-----------------------*/

window.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("userInput");

  if(input){
    input.addEventListener("input", updateDetection);
  }

  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const initialLanguage = detectInitialLanguage();
  applyLanguage(initialLanguage);
});
