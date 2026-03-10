const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;

function applyLanguage(lang){
  document.documentElement.lang = lang;
  document.getElementById("uiLanguageLabel").innerText = t("uiLanguageLabel", lang);
  document.getElementById("darkModeButton").innerText = t("darkModeButton", lang);
  document.getElementById("pageTitle").innerText = t("pageTitle", lang);
  document.getElementById("pageSubtitle").innerText = t("pageSubtitle", lang);
  document.getElementById("pageDescription").innerText = t("pageDescription", lang);
  document.getElementById("inputLabel").innerText = t("inputLabel", lang);
  document.getElementById("detectedLanguageLabel").innerText = t("detectedLanguageLabel", lang);
  document.getElementById("detectedDialectLabel").innerText = t("detectedDialectLabel", lang);
  document.getElementById("confidenceLabel").innerText = t("confidenceLabel", lang);
  document.getElementById("keepDetectedButton").innerText = t("keepDetectedButton", lang);
  document.getElementById("changeDetectedButton").innerText = t("changeDetectedButton", lang);
  document.getElementById("changeDetectedLabel").innerText = t("changeDetectedLabel", lang);
  document.getElementById("translateToLabel").innerText = t("translateToLabel", lang);
  document.getElementById("translateButton").innerText = t("translateButton", lang);
  document.getElementById("translationLabel").innerText = t("translationLabel", lang);
  document.getElementById("copyButton").innerText = t("copyButton", lang);
  document.getElementById("pronunciationToggleLabel").innerText = t("pronunciationToggleLabel", lang);
  document.getElementById("pronunciationLabel").innerText = t("pronunciationLabel", lang);
  document.getElementById("speakSlowButton").innerText = t("speakSlowButton", lang);
  document.getElementById("speakNormalButton").innerText = t("speakNormalButton", lang);
  document.getElementById("footerProduct").innerText = t("footerProduct", lang);
  document.getElementById("footerTagline").innerText = t("footerTagline", lang);
  document.getElementById("footerDescriptor").innerText = t("footerDescriptor", lang);
  document.getElementById("footerCopyright").innerText = t("footerCopyright", lang);
  document.getElementById("footerPatent").innerText = t("footerPatent", lang);
  localStorage.setItem("siteLanguage", lang);
}

function toggleDarkMode(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}

function findMatches(value){
  const q = value.trim().toLowerCase();
  if(!q) return languageCatalog.slice(0, 12);
  return languageCatalog.filter(item => {
    if(item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some(alias => alias.toLowerCase().includes(q));
  }).slice(0, 12);
}

function renderSuggestions(container, matches, onPick){
  container.innerHTML = "";
  if(!matches.length){
    container.style.display = "none";
    return;
  }
  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;
    div.onclick = () => onPick(item);
    container.appendChild(div);
  });
  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick){
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionId);

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick);
  });

  document.addEventListener("click", (e) => {
    if(!input.contains(e.target) && !box.contains(e.target)){
      box.style.display = "none";
    }
  });
}

function detectInput(text){
  const lower = text.toLowerCase();

  if(/[\u0600-\u06FF]/.test(text)){
    return { language: "Arabic", dialect: "Arabic — Modern Standard", confidence: "91%" };
  }
  if(/[\u0400-\u04FF]/.test(text)){
    return { language: "Russian", dialect: "Russian", confidence: "95%" };
  }
  if(/[\u3040-\u30ff]/.test(text)){
    return { language: "Japanese", dialect: "Japanese", confidence: "97%" };
  }
  if(/[\u4e00-\u9fff]/.test(text)){
    return { language: "Chinese", dialect: "Chinese", confidence: "96%" };
  }
  if(/[\uAC00-\uD7AF]/.test(text)){
    return { language: "Korean", dialect: "Korean", confidence: "97%" };
  }
  if(lower.includes("parce") || lower.includes("quiubo") || lower.includes("qué más pues")){
    return { language: "Spanish", dialect: "Spanish — Paisa (Medellín)", confidence: "94%" };
  }
  if(lower.includes("che ") || lower.includes("boludo") || lower.includes("vení") || lower.includes("sos ")){
    return { language: "Spanish", dialect: "Spanish — Argentine", confidence: "93%" };
  }
  if(lower.includes("weón") || lower.includes("huevon") || lower.includes("po ")){
    return { language: "Spanish", dialect: "Spanish — Chilean", confidence: "88%" };
  }
  if(lower.includes("órale") || lower.includes("wey") || lower.includes("no manches")){
    return { language: "Spanish", dialect: "Spanish — Mexican", confidence: "91%" };
  }
  if(lower.includes("bacano") || lower.includes("qué más")){
    return { language: "Spanish", dialect: "Spanish — LATAM (Neutral)", confidence: "74%" };
  }
  if(/[áéíóúñ¿¡]/i.test(text)){
    return { language: "Spanish", dialect: "Spanish — LATAM (Neutral)", confidence: "78%" };
  }
  return { language: "English", dialect: "English — American", confidence: "63%" };
}

function updateDetection(){
  const text = document.getElementById("userInput").value.trim();
  const card = document.getElementById("detectedCard");
  if(!text){
    card.classList.add("hidden");
    return;
  }
  if(!detectedSelection){
    detectedSelection = detectInput(text);
  }
  document.getElementById("detectedLanguageValue").innerText = detectedSelection.language;
  document.getElementById("detectedDialectValue").innerText = detectedSelection.dialect;
  document.getElementById("detectedConfidenceValue").innerText = detectedSelection.confidence;
  card.classList.remove("hidden");
}

function toggleDetectedChange(){
  document.getElementById("changeDetectedWrap").classList.toggle("hidden");
}

function keepDetected(){
  document.getElementById("changeDetectedWrap").classList.add("hidden");
}

async function translateText(){
  const input = document.getElementById("userInput").value.trim();
  const target = targetSelection ? targetSelection.label : document.getElementById("targetSearch").value.trim();

  if(!input || !target){
    alert("Please enter text and choose a target language.");
    return;
  }

  try{
    const response = await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await response.json();
    document.getElementById("output").value = data.output || data.translation || "Translation error";
    document.getElementById("pronunciation").value = document.getElementById("output").value || "";
  }catch(err){
    document.getElementById("output").value = "Translation error";
  }
}

function copyTranslation(){
  const output = document.getElementById("output");
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation(){
  document.getElementById("pronunciationSection").classList.toggle("hidden", !document.getElementById("pronToggle").checked);
}

function speak(rate){
  const text = document.getElementById("output").value.trim();
  if(!text) return;
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

document.addEventListener("DOMContentLoaded", () => {
  if(localStorage.getItem("darkMode") === "on"){
    document.body.classList.add("dark");
  }
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  document.getElementById("siteLanguage").value = savedLang;
  applyLanguage(savedLang);

  document.getElementById("siteLanguage").addEventListener("change", (e) => applyLanguage(e.target.value));
  document.getElementById("darkModeButton").addEventListener("click", toggleDarkMode);
  document.getElementById("userInput").addEventListener("input", () => {
    detectedSelection = null;
    updateDetection();
  });
  document.getElementById("keepDetectedButton").addEventListener("click", keepDetected);
  document.getElementById("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  document.getElementById("translateButton").addEventListener("click", translateText);
  document.getElementById("copyButton").addEventListener("click", copyTranslation);
  document.getElementById("pronToggle").addEventListener("change", togglePronunciation);
  document.getElementById("speakSlowButton").addEventListener("click", () => speak(0.6));
  document.getElementById("speakNormalButton").addEventListener("click", () => speak(1.0));

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    document.getElementById("targetSearch").value = item.label;
    document.getElementById("targetSuggestions").style.display = "none";
  });

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = {
      language: item.label.split(" — ")[0] || item.label,
      dialect: item.label,
      confidence: "Manual"
    };
    document.getElementById("detectedSearch").value = item.label;
    document.getElementById("detectedSuggestions").style.display = "none";
    updateDetection();
    document.getElementById("changeDetectedWrap").classList.add("hidden");
  });
});
