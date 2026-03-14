const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

const TARGET_LANGUAGE_TRANSLATIONS = {
  en: {
    "American English": "American English",
    "British English": "British English",
    "Australian English": "Australian English",
    "French": "French",
    "German": "German",
    "Italian": "Italian",
    "Mexican Spanish": "Mexican Spanish",
    "LATAM Spanish": "LATAM Spanish",
    "General Colombian Spanish": "General Colombian Spanish",
    "Paisa Spanish (Medellín)": "Paisa Spanish (Medellín)",
    "Rolo Spanish (Bogotá)": "Rolo Spanish (Bogotá)",
    "Cali Spanish": "Cali Spanish",
    "Santander Spanish": "Santander Spanish",
    "Venezuelan Spanish": "Venezuelan Spanish",
    "Chinese": "Chinese",
    "Korean": "Korean",
    "Japanese": "Japanese",
    "Russian": "Russian",
    "English — American": "American English",
    "English — British": "British English",
    "English — Australian": "Australian English",
    "Spanish — LATAM (Neutral)": "LATAM Spanish",
    "Spanish — Mexican": "Mexican Spanish",
    "Spanish — Central American": "Central American Spanish",
    "Spanish — Caribbean": "Caribbean Spanish",
    "Spanish — Peruvian": "Peruvian Spanish",
    "Spanish — Argentine": "Argentine Spanish",
    "Spanish — Chilean": "Chilean Spanish",
    "Spanish — Paisa (Medellín)": "Paisa Spanish (Medellín)",
    "Spanish — Rolo (Bogotá)": "Rolo Spanish (Bogotá)",
    "Spanish — Cali": "Cali Spanish",
    "Spanish — Santander": "Santander Spanish",
    "Spanish — Venezuelan": "Venezuelan Spanish",
    "Spanish — General Colombian": "General Colombian Spanish"
  },
  es: {
    "American English": "Inglés estadounidense",
    "British English": "Inglés británico",
    "Australian English": "Inglés australiano",
    "French": "Francés",
    "German": "Alemán",
    "Italian": "Italiano",
    "Mexican Spanish": "Español mexicano",
    "LATAM Spanish": "Español latinoamericano",
    "General Colombian Spanish": "Español colombiano",
    "Paisa Spanish (Medellín)": "Español paisa (Medellín)",
    "Rolo Spanish (Bogotá)": "Español rolo (Bogotá)",
    "Cali Spanish": "Español caleño",
    "Santander Spanish": "Español santandereano",
    "Venezuelan Spanish": "Español venezolano",
    "Chinese": "Chino",
    "Korean": "Coreano",
    "Japanese": "Japonés",
    "Russian": "Ruso",
    "English — American": "Inglés estadounidense",
    "English — British": "Inglés británico",
    "English — Australian": "Inglés australiano",
    "Spanish — LATAM (Neutral)": "Español latinoamericano",
    "Spanish — Mexican": "Español mexicano",
    "Spanish — Central American": "Español centroamericano",
    "Spanish — Caribbean": "Español caribeño",
    "Spanish — Peruvian": "Español peruano",
    "Spanish — Argentine": "Español argentino",
    "Spanish — Chilean": "Español chileno",
    "Spanish — Paisa (Medellín)": "Español paisa (Medellín)",
    "Spanish — Rolo (Bogotá)": "Español rolo (Bogotá)",
    "Spanish — Cali": "Español caleño",
    "Spanish — Santander": "Español santandereano",
    "Spanish — Venezuelan": "Español venezolano",
    "Spanish — General Colombian": "Español colombiano"
  }
};

function el(id){
  return document.getElementById(id);
}

function currentSiteLanguage(){
  return el("siteLanguage")?.value || localStorage.getItem("siteLanguage") || "en";
}

function isSpanishUI(){
  return currentSiteLanguage().startsWith("es");
}

function localizeLanguageLabel(label){
  const lang = isSpanishUI() ? "es" : "en";
  return TARGET_LANGUAGE_TRANSLATIONS[lang][label] || label;
}

function safeTextById(id, value){
  const node = el(id);
  if(node) node.innerText = value;
}

function safeTextBySelector(selector, value){
  const node = document.querySelector(selector);
  if(node) node.innerText = value;
}

function sanitizeForSpeech(text){
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/[.,;:!?()"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function setDetectedDisplay(label){
  const display = el("detectedLanguageDialect");
  if(!display) return;
  display.innerText = (isSpanishUI() ? "Idioma detectado: " : "Detected language: ") + localizeLanguageLabel(label);
}

function setSelectedDisplay(label){
  const display = el("detectedLanguageDialect");
  if(!display) return;
  display.innerText = (isSpanishUI() ? "Idioma de entrada seleccionado: " : "Input language selected: ") + localizeLanguageLabel(label);
}

function applyConfirmationButtonState(){
  const keepBtn = el("keepDetectedButton");
  const changeBtn = el("changeDetectedButton");
  const row = document.querySelector(".detectedButtons");
  if(!keepBtn || !changeBtn || !row) return;

  row.style.display = "flex";
  row.style.gap = "10px";
  row.style.width = "100%";
  row.style.alignItems = "center";

  if(confirmedInputLanguage){
    keepBtn.classList.add("hidden");
    row.style.justifyContent = "flex-end";
    changeBtn.style.padding = "6px 12px";
    changeBtn.style.fontSize = "12px";
    changeBtn.style.lineHeight = "1.2";
    changeBtn.style.marginTop = "0";
  }else{
    keepBtn.classList.remove("hidden");
    row.style.justifyContent = "flex-start";
    changeBtn.style.padding = "";
    changeBtn.style.fontSize = "";
    changeBtn.style.lineHeight = "";
    changeBtn.style.marginTop = "";
  }
}

function updateTranslateState(){
  const button = el("translateButton");
  if(!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage(){
  confirmedInputLanguage = null;
  const wrap = el("changeDetectedWrap");
  if(wrap) wrap.classList.add("hidden");
  if(el("detectedSearch")) el("detectedSearch").value = "";
  if(el("pronunciation")) el("pronunciation").value = "";
  if(el("pronToggle")) el("pronToggle").checked = false;
  if(el("pronunciationSection")) el("pronunciationSection").classList.add("hidden");
  applyConfirmationButtonState();
  updateTranslateState();
}

function togglePronunciation(){
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
}

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

  for(const word of tokenize(item.label)){
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
    div.innerText = localizeLanguageLabel(item.label);

    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(item);
      closeSuggestions(container, type);
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick, type){
  const input = el(inputId);
  const box = el(suggestionId);

  if(!input || !box) return;

  input.addEventListener("focus", () => {
    input.value = "";
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("click", () => {
    input.value = "";
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if(type === "target" && !input.value.trim() && targetSelection){
        input.value = localizeLanguageLabel(targetSelection.label);
      }
      if(type === "detected"){
        if(!input.value.trim() && confirmedInputLanguage){
          input.value = localizeLanguageLabel(confirmedInputLanguage);
        }else if(!input.value.trim() && detectedSelection){
          input.value = localizeLanguageLabel(detectedSelection.label);
        }
      }
    }, 120);
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

  resetConfirmedLanguage();

  if(!text){
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
  applyConfirmationButtonState();
}

function keepDetected(){
  if(!detectedSelection) return;
  confirmedInputLanguage = detectedSelection.label;
  setSelectedDisplay(confirmedInputLanguage);
  if(el("changeDetectedWrap")) el("changeDetectedWrap").classList.add("hidden");
  updateChangeButtonLayoutAndState();
  updateTranslateState();
}

function updateChangeButtonLayoutAndState(){
  applyConfirmationButtonState();
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
        findMatches(""),
        (item) => {
          confirmedInputLanguage = item.label;
          detectedSelection = { label: item.label };
          input.value = localizeLanguageLabel(item.label);
          wrap.classList.add("hidden");
          setSelectedDisplay(item.label);
          updateChangeButtonLayoutAndState();
          updateTranslateState();
        },
        "detected"
      );
    }
  }
}

function englishPronunciationForSpanishReader(text){
  const specialWords = {
    "how": "jau",
    "are": "ar",
    "you": "yu",
    "hello": "jelou",
    "friend": "frend",
    "weather": "ueder",
    "today": "tudei",
    "what": "uat",
    "is": "is",
    "the": "de",
    "good": "gud",
    "morning": "morning"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if(!clean) return "";

      if(specialWords[clean]) return specialWords[clean];

      let out = clean
        .replace(/tion/g, "shon")
        .replace(/sion/g, "shon")
        .replace(/ough/g, "ou")
        .replace(/augh/g, "au")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/ph/g, "f")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/ea/g, "i");

      return out;
    })
    .filter(Boolean)
    .join("   ");
}

function spanishPronunciationForEnglishReader(text){
  const specialWords = {
    "hola": "OH-lah",
    "parcero": "par-SEH-roh",
    "gracias": "GRAH-syahs",
    "donde": "DOHN-deh",
    "esta": "ehs-TAH",
    "el": "ehl",
    "bano": "BAHN-yoh",
    "necesito": "neh-seh-SEE-toh",
    "hablar": "ah-BLAR",
    "contigo": "kohn-TEE-goh",
    "como": "KOH-moh",
    "estas": "ehs-TAHS",
    "clima": "KLEE-mah",
    "hoy": "oy"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if(!clean) return "";

      if(specialWords[clean]) return specialWords[clean];

      let out = clean
        .replace(/ñ/g, "ny")
        .replace(/ll/g, "y")
        .replace(/que/g, "keh")
        .replace(/qui/g, "kee")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/ch/g, "ch")
        .replace(/j/g, "h")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");

      out = out
        .replace(/([aeiou]{1,2}[a-z]+)/g, "$1-")
        .replace(/-+/g, "-")
        .replace(/-$/, "");

      return out;
    })
    .filter(Boolean)
    .join("   ");
}

function buildPronunciation(translatedText, sourceLanguage, targetLanguage){
  if(!translatedText) return "";

  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if(source.includes("spanish") && target.includes("english")){
    return englishPronunciationForSpanishReader(translatedText);
  }

  if(source.includes("english") && target.includes("spanish")){
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return "";
}

async function translateText(){
  if(!confirmedInputLanguage){
    alert(isSpanishUI()
      ? "Confirma primero el idioma detectado."
      : "Please confirm the detected language first.");
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || "";

  if(!input || !target){
    alert(isSpanishUI()
      ? "Escribe texto y elige un idioma."
      : "Enter text and choose a language.");
    return;
  }

  try{
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    if(el("pronunciation")) el("pronunciation").value = buildPronunciation(translated, confirmedInputLanguage, target);

  }catch(err){
    if(el("output")) el("output").value = "Network error";
    if(el("pronunciation")) el("pronunciation").value = "";
  }
}

function copyTranslation(){
  const box = el("output");
  if(!box) return;
  box.select();
  document.execCommand("copy");
}

function speak(rate){
  const text = sanitizeForSpeech(el("output")?.value || "");
  if(!text) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

function toggleDarkMode(){
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if(btn){
    btn.innerText = isDark
      ? (isSpanishUI() ? "🌙 Oscuro" : "🌙 Dark")
      : (isSpanishUI() ? "☀️ Claro" : "☀️ Light");
  }
}

function applySiteLanguage(lang){
  const isSpanish = lang.startsWith("es");

  if(isSpanish){
    safeTextBySelector('label[for="siteLanguage"]', "Idioma del sitio");
    safeTextBySelector("h1", "Traductor Intercultural™");
    safeTextBySelector(".subtitle", "Más que traducción — comunicación intercultural real");
    safeTextBySelector(".description", "Traducción con sensibilidad dialectal, guía de pronunciación y claridad cultural");
    safeTextById("inputLabel", "Texto de entrada");
    safeTextById("keepDetectedButton", "Mantener");
    safeTextById("changeDetectedButton", "Cambiar");
    safeTextBySelector('label[for="detectedSearch"]', "Cambiar idioma de entrada a:");
    safeTextBySelector('label[for="targetSearch"]', "Traducir a");
    safeTextById("translateButton", "Traducir");
    safeTextBySelector('label[for="output"]', "Traducción");
    safeTextById("copyButton", "Copiar");
    safeTextById("pronToggleLabel", "Mostrar pronunciación");
    safeTextBySelector('label[for="pronunciation"]', "Guía de pronunciación");
    safeTextById("speakNormal", "Hablar normal");
    safeTextById("speakSlow", "Hablar lento");
  }else{
    safeTextBySelector('label[for="siteLanguage"]', "Site Language");
    safeTextBySelector("h1", "Cross-Cultural Translator™");
    safeTextBySelector(".subtitle", "Beyond translation — real cross-cultural communication");
    safeTextBySelector(".description", "Dialect-aware translation, pronunciation guidance, and cultural clarity");
    safeTextById("inputLabel", "Input Text");
    safeTextById("keepDetectedButton", "Keep");
    safeTextById("changeDetectedButton", "Change");
    safeTextBySelector('label[for="detectedSearch"]', "Change input language to:");
    safeTextBySelector('label[for="targetSearch"]', "Translate To");
    safeTextById("translateButton", "Translate");
    safeTextBySelector('label[for="output"]', "Translation");
    safeTextById("copyButton", "Copy");
    safeTextById("pronToggleLabel", "Show Pronunciation");
    safeTextBySelector('label[for="pronunciation"]', "Pronunciation Guide");
    safeTextById("speakNormal", "Speak Normally");
    safeTextById("speakSlow", "Speak Slowly");
  }

  const btn = el("darkModeButton");
  if(btn){
    const isDark = document.body.classList.contains("dark");
    btn.innerText = isDark
      ? (isSpanish ? "🌙 Oscuro" : "🌙 Dark")
      : (isSpanish ? "☀️ Claro" : "☀️ Light");
  }

  if(targetSelection && el("targetSearch")){
    el("targetSearch").value = localizeLanguageLabel(targetSelection.label);
  }

  if(confirmedInputLanguage){
    setSelectedDisplay(confirmedInputLanguage);
  }else if(detectedSelection){
    setDetectedDisplay(detectedSelection.label);
  }

  applyConfirmationButtonState();

  const footer = document.querySelector("footer");
  if(footer){
    footer.innerHTML = isSpanish
      ? `<strong>Traductor Intercultural™</strong>
Más que traducción — comunicación intercultural real<br>
Traducción con sensibilidad dialectal • Guía de pronunciación • Claridad cultural<br>
© 2026 CCTLA-TBD, LLC<br>
Patente pendiente.`
      : `<strong>Cross-Cultural Translator™</strong>
Beyond translation — real cross-cultural communication<br>
Dialect-aware translation • Pronunciation guidance • Cultural clarity<br>
© 2026 CCTLA-TBD, LLC<br>
Patent pending.`;
  }

  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if(isDark){
    document.body.classList.add("dark");
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
      el("targetSearch").value = localizeLanguageLabel(item.label);
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
      el("detectedSearch").value = localizeLanguageLabel(item.label);
      closeSuggestions(el("detectedSuggestions"), "detected");
      el("changeDetectedWrap")?.classList.add("hidden");
      setSelectedDisplay(item.label);
      updateChangeButtonLayoutAndState();
      updateTranslateState();
    },
    "detected"
  );

  if(el("translateButton")) el("translateButton").disabled = true;
  if(el("pronunciationSection")) el("pronunciationSection").classList.add("hidden");
  applyConfirmationButtonState();
});
