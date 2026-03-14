const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

/* -------------------------
   HELPERS
-------------------------- */

function el(id){
  return document.getElementById(id);
}

function safeTextById(id, value){
  const node = el(id);
  if(node) node.innerText = value;
}

function safeTextBySelector(selector, value){
  const node = document.querySelector(selector);
  if(node) node.innerText = value;
}

function closeSuggestions(container, type){
  if(!container) return;

  container.style.display = "none";

  if(type === "target"){
    targetMatches = [];
    targetActiveIndex = -1;
  }else if(type === "detected"){
    detectedMatches = [];
    detectedActiveIndex = -1;
  }
}

function highlightActive(container, type){
  const items = container.querySelectorAll(".suggestionItem");
  const activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((item, i) => {
    item.classList.toggle("activeSuggestion", i === activeIndex);
  });

  if(activeIndex >= 0 && items[activeIndex]){
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function updateTranslateState(){
  const button = el("translateButton");
  if(!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!(targetSelection?.label || el("targetSearch")?.value.trim());

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage(){
  confirmedInputLanguage = null;
  const wrap = el("changeDetectedWrap");
  if(wrap) wrap.classList.add("hidden");
  updateTranslateState();
}

function togglePronunciation(){
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
}

/* -------------------------
   SEARCH MATCHING
-------------------------- */

function normalize(value){
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value){
  return normalize(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}

function scoreLanguageMatch(item, query){
  const q = normalize(query);
  if(!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if(label === q) return 0;
  if(aliases.includes(q)) return 1;
  if(label.startsWith(q)) return 2;

  for(const alias of aliases){
    if(alias.startsWith(q)) return 3;
  }

  const words = tokenize(item.label);
  for(const word of words){
    if(word.startsWith(q)) return 4;
  }

  for(const alias of aliases){
    for(const word of tokenize(alias)){
      if(word.startsWith(q)) return 5;
    }
  }

  if(label.includes(q)) return 6;

  for(const alias of aliases){
    if(alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value){
  const q = normalize(value);

  if(!q){
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter(row => row.score < 9999)
    .sort((a, b) => {
      if(a.score !== b.score) return a.score - b.score;
      return a.item.label.localeCompare(b.item.label);
    })
    .map(row => row.item)
    .slice(0, 12);
}

/* -------------------------
   RENDER SUGGESTIONS
-------------------------- */

function renderSuggestions(container, matches, onPick, type){
  if(!container) return;

  container.innerHTML = "";

  if(!matches.length){
    closeSuggestions(container, type);
    return;
  }

  if(type === "target"){
    targetMatches = matches;
    targetActiveIndex = -1;
  }else{
    detectedMatches = matches;
    detectedActiveIndex = -1;
  }

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;

    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(item);
      closeSuggestions(container, type);
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

/* -------------------------
   SEARCH SETUP
-------------------------- */

function setupSearch(inputId, suggestionId, onPick, type){
  const input = el(inputId);
  const box = el(suggestionId);

  if(!input || !box) return;

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
    updateTranslateState();
  });

  input.addEventListener("keydown", (e) => {
    let matches = type === "target" ? targetMatches : detectedMatches;
    let activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

    if(e.key === "ArrowDown"){
      e.preventDefault();

      if(!matches.length){
        renderSuggestions(box, findMatches(input.value), onPick, type);
        matches = type === "target" ? targetMatches : detectedMatches;
        if(!matches.length) return;
      }

      activeIndex = (activeIndex + 1) % matches.length;

      if(type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;

      highlightActive(box, type);
    }

    if(e.key === "ArrowUp"){
      e.preventDefault();

      if(!matches.length) return;

      activeIndex = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;

      if(type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;

      highlightActive(box, type);
    }

    if(e.key === "Enter"){
      const idx = type === "target" ? targetActiveIndex : detectedActiveIndex;
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if(currentMatches[idx]){
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
      }
    }

    if(e.key === "Escape"){
      closeSuggestions(box, type);
    }
  });

  document.addEventListener("click", (e) => {
    if(!input.contains(e.target) && !box.contains(e.target)){
      closeSuggestions(box, type);
    }
  });
}

/* -------------------------
   LANGUAGE DETECTION
-------------------------- */

function detectInput(text){
  const lower = normalize(text);

  if(/[\u0600-\u06FF]/.test(text)) return { label: "Arabic — Modern Standard" };
  if(/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if(/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if(/[\u4e00-\u9fff]/.test(text)) return { label: "Chinese" };
  if(/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if(
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ){
    return { label: "Paisa Spanish (Medellín)" };
  }

  if(
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ){
    return { label: "Rolo Spanish (Bogotá)" };
  }

  if(
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ){
    return { label: "Mexican Spanish" };
  }

  const spanishSignals = [
    "hola","como","estas","que","para","porque","por","favor",
    "gracias","buenos","buenas","dias","noches","tardes",
    "amigo","amiga","con","sin","pero","muy","si","tambien",
    "quiero","puedo","necesito","vamos","bien","mal"
  ];

  let count = 0;
  for(const token of tokenize(text)){
    if(spanishSignals.includes(token)) count += 1;
  }

  if(/[áéíóúñ¿¡]/i.test(text) || count >= 2){
    return { label: "LATAM Spanish" };
  }

  return { label: "American English" };
}

function updateDetection(){
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");
  const display = el("detectedLanguageDialect");

  resetConfirmedLanguage();

  if(!text){
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);

  if(display){
    display.innerText = "Detected Language: " + detectedSelection.label;
  }

  card?.classList.remove("hidden");
}

/* -------------------------
   DETECTED CONFIRMATION
-------------------------- */

function keepDetected(){
  if(!detectedSelection) return;
  confirmedInputLanguage = detectedSelection.label;
  updateTranslateState();
}

function toggleDetectedChange(){
  const wrap = el("changeDetectedWrap");
  if(!wrap) return;

  wrap.classList.toggle("hidden");

  if(!wrap.classList.contains("hidden")){
    const input = el("detectedSearch");
    if(input){
      input.focus();
      renderSuggestions(
        el("detectedSuggestions"),
        findMatches(input.value),
        (item) => {
          confirmedInputLanguage = item.label;
          detectedSelection = { label: item.label };
          input.value = item.label;
          wrap.classList.add("hidden");
          const display = el("detectedLanguageDialect");
          if(display){
            display.innerText = "Input Language: " + item.label;
          }
          updateTranslateState();
        },
        "detected"
      );
    }
  }
}

/* -------------------------
   PRONUNCIATION
-------------------------- */

function spanishPronunciation(text){
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      return word
        .toLowerCase()
        .replace(/ñ/g, "ny")
        .replace(/ll/g, "y")
        .replace(/que/g, "kay")
        .replace(/qui/g, "kee")
        .replace(/ce/g, "say")
        .replace(/ci/g, "see")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");
    })
    .join("   ");
}

function buildPronunciation(translatedText, targetLanguage){
  if(!translatedText) return "";

  const target = (targetLanguage || "").toLowerCase();

  if(target.includes("spanish")){
    return spanishPronunciation(translatedText);
  }

  if(target.includes("english")){
    return translatedText;
  }

  return "";
}

/* -------------------------
   TRANSLATE
-------------------------- */

async function translateText(){
  if(!confirmedInputLanguage){
    alert("Please confirm the detected language first.");
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection
    ? targetSelection.label
    : (el("targetSearch")?.value.trim() || "");

  if(!input || !target){
    alert("Enter text and choose a language.");
    return;
  }

  try{
    const response = await fetch(API_URL, {
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

    const data = await response.json();
    const translated = data.output || "";

    if(el("output")) el("output").value = translated;
    if(el("pronunciation")) el("pronunciation").value = buildPronunciation(translated, target);

  }catch(err){
    if(el("output")) el("output").value = "Network error";
    if(el("pronunciation")) el("pronunciation").value = "";
  }
}

/* -------------------------
   COPY
-------------------------- */

function copyTranslation(){
  const box = el("output");
  if(!box) return;

  box.select();
  document.execCommand("copy");
}

/* -------------------------
   SPEECH
-------------------------- */

function speak(rate){
  const text = el("output")?.value || "";
  if(!text) return;

  speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

/* -------------------------
   DARK MODE
-------------------------- */

function toggleDarkMode(){
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if(btn){
    btn.innerText = isDark ? "🌙 Dark" : "☀️ Light";
  }
}

/* -------------------------
   SITE LANGUAGE
-------------------------- */

function applySiteLanguage(lang){
  if(lang === "es"){
    safeTextBySelector('label[for="siteLanguage"]', "Idioma del sitio");
    safeTextById("darkModeButton", document.body.classList.contains("dark") ? "🌙 Oscuro" : "☀️ Claro");
    safeTextBySelector("h1", "Traductor Intercultural™");
    safeTextBySelector(".subtitle", "Más que traducción — comunicación intercultural real");
    safeTextBySelector(".description", "Traducción con sensibilidad dialectal, guía de pronunciación y claridad cultural");
    safeTextById("inputLabel", "Texto de entrada");
    safeTextBySelector('label[for="detectedSearch"]', "Cambiar idioma de entrada a:");
    safeTextBySelector('label[for="targetSearch"]', "Traducir a");
    safeTextById("translateButton", "Traducir");
    safeTextBySelector('label[for="output"]', "Traducción");
    safeTextById("copyButton", "Copiar");
    safeTextById("pronToggleLabel", "Mostrar pronunciación");
    safeTextBySelector('label[for="pronunciation"]', "Guía de pronunciación");
    safeTextById("speakNormal", "Hablar normal");
    safeTextById("speakSlow", "Hablar lento");

    const footer = document.querySelector("footer");
    if(footer){
      footer.innerHTML = `
<strong>Traductor Intercultural™</strong>
Más que traducción — comunicación intercultural real<br>
Traducción con sensibilidad dialectal • Guía de pronunciación • Claridad cultural<br>
© 2026 CCTLA-TBD, LLC<br>
Patente pendiente.
`;
    }
  }else{
    safeTextBySelector('label[for="siteLanguage"]', "Site Language");
    safeTextById("darkModeButton", document.body.classList.contains("dark") ? "🌙 Dark" : "☀️ Light");
    safeTextBySelector("h1", "Cross-Cultural Translator™");
    safeTextBySelector(".subtitle", "Beyond translation — real cross-cultural communication");
    safeTextBySelector(".description", "Dialect-aware translation, pronunciation guidance, and cultural clarity");
    safeTextById("inputLabel", "Input Text");
    safeTextBySelector('label[for="detectedSearch"]', "Change input language to:");
    safeTextBySelector('label[for="targetSearch"]', "Translate To");
    safeTextById("translateButton", "Translate");
    safeTextBySelector('label[for="output"]', "Translation");
    safeTextById("copyButton", "Copy");
    safeTextById("pronToggleLabel", "Show Pronunciation");
    safeTextBySelector('label[for="pronunciation"]', "Pronunciation Guide");
    safeTextById("speakNormal", "Speak Normally");
    safeTextById("speakSlow", "Speak Slowly");

    const footer = document.querySelector("footer");
    if(footer){
      footer.innerHTML = `
<strong>Cross-Cultural Translator™</strong>
Beyond translation — real cross-cultural communication<br>
Dialect-aware translation • Pronunciation guidance • Cultural clarity<br>
© 2026 CCTLA-TBD, LLC<br>
Patent pending.
`;
    }
  }

  localStorage.setItem("siteLanguage", lang);
}

/* -------------------------
   STARTUP
-------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if(isDark){
    document.body.classList.add("dark");
  }

  const btn = el("darkModeButton");
  if(btn){
    btn.innerText = isDark ? "🌙 Dark" : "☀️ Light";
  }

  const siteLanguage = el("siteLanguage");
  if(siteLanguage){
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applySiteLanguage(e.target.value));
  }

  applySiteLanguage(savedLang);

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("pronToggle")?.addEventListener("change", togglePronunciation);
  el("speakNormal")?.addEventListener("click", () => speak(1.0));
  el("speakSlow")?.addEventListener("click", () => speak(0.6));

  setupSearch(
    "targetSearch",
    "targetSuggestions",
    (item) => {
      targetSelection = item;
      el("targetSearch").value = item.label;
      updateTranslateState();
    },
    "target"
  );

  setupSearch(
    "detectedSearch",
    "detectedSuggestions",
    (item) => {
      confirmedInputLanguage = item.label;
      detectedSelection = { label: item.label };
      el("detectedSearch").value = item.label;
      closeSuggestions(el("detectedSuggestions"), "detected");
      el("changeDetectedWrap")?.classList.add("hidden");
      const display = el("detectedLanguageDialect");
      if(display){
        display.innerText = "Input Language: " + item.label;
      }
      updateTranslateState();
    },
    "detected"
  );

  if(el("translateButton")) el("translateButton").disabled = true;
  if(el("pronunciationSection")) el("pronunciationSection").classList.add("hidden");
});
