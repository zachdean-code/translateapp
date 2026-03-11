const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;
let siteLanguage = localStorage.getItem("siteLanguage") || "en";

function safeText(id, value){
  const el = document.getElementById(id);
  if(el) el.innerText = value;
}

function safePlaceholder(id, value){
  const el = document.getElementById(id);
  if(el) el.placeholder = value || "";
}

function applyLanguage(lang){
  siteLanguage = lang;
  document.documentElement.lang = lang;
  safeText("uiLanguageLabel", t("uiLanguageLabel", lang));
  safeText("darkModeButton", t("darkModeButton", lang));
  safeText("pageTitle", t("pageTitle", lang));
  safeText("pageSubtitle", t("pageSubtitle", lang));
  safeText("pageDescription", t("pageDescription", lang));
  safeText("inputLabel", t("inputLabel", lang));
  safeText("changeDetectedLabel", t("changeDetectedLabel", lang));
  safeText("translateToLabel", t("translateToLabel", lang));
  safeText("translateButton", t("translateButton", lang));
  safeText("translationLabel", t("translationLabel", lang));
  safeText("copyButton", t("copyButton", lang));
  safeText("keepDetectedButton", t("keepDetectedButton", lang));
  safeText("changeDetectedButton", t("changeDetectedButton", lang));
  safeText("pronunciationToggleLabel", t("pronunciationToggleLabel", lang));
  safeText("pronunciationLabel", t("pronunciationLabel", lang));
  safeText("speakNormalButton", t("speakNormalButton", lang));
  safeText("speakSlowButton", t("speakSlowButton", lang));
  safeText("footerProduct", t("footerProduct", lang));
  safeText("footerCopyright", t("footerCopyright", lang));
  safeText("footerPatent", t("footerPatent", lang));
  safeText("usageNoteLabel", lang === "es" ? "Nota de uso" : "Usage Note");

  safePlaceholder("userInput", t("inputPlaceholder", lang));
  safePlaceholder("targetSearch", t("targetSearchPlaceholder", lang));
  safePlaceholder("output", t("outputPlaceholder", lang));
  safePlaceholder("pronunciation", t("pronunciationPlaceholder", lang));

  localStorage.setItem("siteLanguage", lang);
}

function toggleDarkMode(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}

function findMatches(value){
  const q = value.trim().toLowerCase();

  if(!q){
    return languageCatalog.slice(0,12);
  }

  return languageCatalog.filter(item=>{
    if(item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some(a=>a.toLowerCase().includes(q));
  }).slice(0,12);
}

function renderSuggestions(container, matches, onPick){
  if(!container) return;
  container.innerHTML = "";

  if(!matches.length){
    container.style.display = "none";
    return;
  }

  matches.forEach(item=>{
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;
    div.onclick = ()=> onPick(item);
    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, boxId, onPick){
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);

  if(!input || !box) return;

  const render = ()=>{
    renderSuggestions(box, findMatches(input.value), (item)=>{
      onPick(item);
      input.value = item.label;
      box.style.display = "none";
    });
  };

  input.addEventListener("focus", render);
  input.addEventListener("input", render);

  document.addEventListener("click", (e)=>{
    if(!box.contains(e.target) && e.target !== input){
      box.style.display = "none";
    }
  });
}

function detectInput(text){
  const lower = text.toLowerCase();

  if(lower.includes("parce") || lower.includes("quiubo") || lower.includes("qué más pues")){
    return "Spanish — Paisa (Medellín)";
  }

  if(lower.includes("che ") || lower.includes("boludo")){
    return "Spanish — Argentine";
  }

  if(lower.includes("órale") || lower.includes("wey")){
    return "Spanish — Mexican";
  }

  if(/[áéíóúñ¿¡]/i.test(text)){
    return "Spanish — LATAM (Neutral)";
  }

  return "English — American";
}

function updateDetection(){
  const text = document.getElementById("userInput")?.value.trim() || "";
  const card = document.getElementById("detectedCard");
  const label = document.getElementById("detectedLanguageDialect");

  if(!card || !label) return;

  if(!text){
    detectedSelection = null;
    card.classList.add("hidden");
    return;
  }

  detectedSelection = detectInput(text);
  label.innerText = (siteLanguage === "es" ? "Idioma y dialecto detectados: " : "Detected Language and Dialect: ") + detectedSelection;
  card.classList.remove("hidden");
}

function keepDetected(){
  document.getElementById("changeDetectedWrap")?.classList.add("hidden");
}

function toggleDetectedChange(){
  document.getElementById("changeDetectedWrap")?.classList.toggle("hidden");
}

async function translateText(){
  const input = document.getElementById("userInput")?.value.trim() || "";
  const target = targetSelection
    ? targetSelection.label
    : (document.getElementById("targetSearch")?.value.trim() || "");

  if(!input || !target){
    alert(siteLanguage === "es" ? "Ingresa texto y elige un idioma." : "Enter text and choose a language.");
    return;
  }

  try{
    const response = await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        source: detectedSelection || ""
      })
    });

    const data = await response.json();

    const output = document.getElementById("output");
    const usageSection = document.getElementById("usageNoteSection");
    const usageBox = document.getElementById("usageNote");
    const pronSection = document.getElementById("pronunciationSection");
    const pronToggle = document.getElementById("pronToggle");
    const pronBox = document.getElementById("pronunciation");

    if(!response.ok){
      if(output) output.value = data.error || "Translation error";
      if(usageSection) usageSection.classList.add("hidden");
      if(pronSection) pronSection.classList.add("hidden");
      return;
    }

    const translation = data.translation_text || "";
    const usageNote = data.usage_note || "";
    const pronunciation = data.pronunciation_guide || "";

    if(output) output.value = translation;

    if(usageSection && usageBox){
      if(data.show_usage_note && usageNote){
        usageBox.value = usageNote;
        usageSection.classList.remove("hidden");
      }else{
        usageBox.value = "";
        usageSection.classList.add("hidden");
      }
    }

    const sourceBase = (detectedSelection || "").split("—")[0].trim().toLowerCase();
    const targetBase = (target || "").split("—")[0].trim().toLowerCase();
    const differentLanguages = sourceBase && targetBase && sourceBase !== targetBase;

    if(pronSection && pronToggle && pronBox){
      if(pronToggle.checked && data.show_pronunciation && differentLanguages){
        pronBox.value = pronunciation;
        pronSection.classList.remove("hidden");
      }else{
        pronBox.value = "";
        pronSection.classList.add("hidden");
      }
    }
  }catch(err){
    const output = document.getElementById("output");
    if(output) output.value = "Network error";
  }
}

function copyTranslation(){
  const output = document.getElementById("output");
  if(!output) return;
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation(){
  const checked = document.getElementById("pronToggle")?.checked;
  const section = document.getElementById("pronunciationSection");
  if(section){
    section.classList.toggle("hidden", !checked);
  }
}

function speak(rate){
  const text = document.getElementById("output")?.value.trim();
  if(!text) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(localStorage.getItem("darkMode") === "on"){
    document.body.classList.add("dark");
  }

  const langSelect = document.getElementById("siteLanguage");
  if(langSelect){
    langSelect.value = siteLanguage;
    langSelect.addEventListener("change", (e)=> applyLanguage(e.target.value));
  }
  applyLanguage(siteLanguage);

  document.getElementById("darkModeButton")?.addEventListener("click", toggleDarkMode);
  document.getElementById("userInput")?.addEventListener("input", updateDetection);
  document.getElementById("translateButton")?.addEventListener("click", translateText);
  document.getElementById("copyButton")?.addEventListener("click", copyTranslation);
  document.getElementById("pronToggle")?.addEventListener("change", togglePronunciation);
  document.getElementById("speakSlowButton")?.addEventListener("click", ()=>speak(0.6));
  document.getElementById("speakNormalButton")?.addEventListener("click", ()=>speak(1));
  document.getElementById("keepDetectedButton")?.addEventListener("click", keepDetected);
  document.getElementById("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);

  setupSearch("targetSearch", "targetSuggestions", (item)=>{ targetSelection = item; });
  setupSearch("detectedSearch", "detectedSuggestions", (item)=>{
    detectedSelection = item.label;
    const label = document.getElementById("detectedLanguageDialect");
    const card = document.getElementById("detectedCard");
    if(label && card){
      label.innerText = (siteLanguage === "es" ? "Idioma y dialecto detectados: " : "Detected Language and Dialect: ") + detectedSelection;
      card.classList.remove("hidden");
    }
    document.getElementById("changeDetectedWrap")?.classList.add("hidden");
  });
});
