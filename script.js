const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let detectedSelection = null;
let confirmedInputSelection = null;
let detectionConfirmed = false;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;
let inputManuallySelected = false;

let targetPreviousValue = "";
let detectedPreviousValue = "";

function el(id){
  return document.getElementById(id);
}

function normalizeText(value){
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .trim();
}

function tokenize(value){
  return normalizeText(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}

function toggleDarkMode(){
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

function scoreLanguageMatch(item,query){
  const q = normalizeText(query);
  if(!q) return 1000;

  const label = normalizeText(item.label);
  const aliases = (item.aliases || []).map(normalizeText);

  if(label === q) return 0;
  if(aliases.includes(q)) return 1;
  if(label.startsWith(q)) return 2;

  for(const a of aliases){
    if(a.startsWith(q)) return 3;
  }

  const words = tokenize(item.label);
  for(const w of words){
    if(w.startsWith(q)) return 4;
  }

  for(const a of aliases){
    const aliasWords = tokenize(a);
    for(const w of aliasWords){
      if(w.startsWith(q)) return 5;
    }
  }

  return 9999;
}

function findMatches(value){
  const q = normalizeText(value);

  if(!q){
    return languageCatalog.slice(0,12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item,q) }))
    .filter(r => r.score < 9999)
    .sort((a,b) => {
      if(a.score !== b.score) return a.score - b.score;
      return a.item.label.localeCompare(b.item.label);
    })
    .map(r => r.item)
    .slice(0,12);
}

function closeSuggestions(container,type){
  if(!container) return;

  container.style.display = "none";

  if(type === "target"){
    targetMatches = [];
    targetActiveIndex = -1;
  }else{
    detectedMatches = [];
    detectedActiveIndex = -1;
  }
}

function highlightActive(container,type){
  const items = container.querySelectorAll(".suggestionItem");
  const idx = type === "target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((node,i) => {
    node.classList.toggle("activeSuggestion", i === idx);
  });

  if(idx >= 0 && items[idx]){
    items[idx].scrollIntoView({ block:"nearest" });
  }
}

function renderSuggestions(container,matches,onPick,type){
  container.innerHTML = "";

  if(!matches.length){
    container.style.display = "none";
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

    div.addEventListener("mousedown",e => {
      e.preventDefault();
      onPick(item);
      container.style.display = "none";
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId,suggestionId,onPick,type){
  const input = el(inputId);
  const box = el(suggestionId);

  if(!input || !box) return;

  input.addEventListener("focus",() => {
    if(type === "target"){
      targetPreviousValue = input.value;
    }else{
      detectedPreviousValue = input.value;
    }

    input.value = "";
    renderSuggestions(box,findMatches(""),onPick,type);
  });

  input.addEventListener("input",() => {
    renderSuggestions(box,findMatches(input.value),onPick,type);
  });

  input.addEventListener("keydown",(e) => {
    const matches = type === "target" ? targetMatches : detectedMatches;

    if(e.key === "ArrowDown"){
      e.preventDefault();

      if(!matches.length){
        renderSuggestions(box,findMatches(input.value),onPick,type);
        return;
      }

      if(type === "target"){
        targetActiveIndex = (targetActiveIndex + 1) % matches.length;
      }else{
        detectedActiveIndex = (detectedActiveIndex + 1) % matches.length;
      }

      highlightActive(box,type);
      return;
    }

    if(e.key === "ArrowUp"){
      e.preventDefault();

      if(!matches.length) return;

      if(type === "target"){
        targetActiveIndex = targetActiveIndex <= 0 ? matches.length - 1 : targetActiveIndex - 1;
      }else{
        detectedActiveIndex = detectedActiveIndex <= 0 ? matches.length - 1 : detectedActiveIndex - 1;
      }

      highlightActive(box,type);
      return;
    }

    if(e.key === "Enter"){
      const idx = type === "target" ? targetActiveIndex : detectedActiveIndex;

      if(matches[idx]){
        e.preventDefault();
        onPick(matches[idx]);
        box.style.display = "none";
      }
      return;
    }

    if(e.key === "Escape"){
      box.style.display = "none";
      if(!input.value.trim()){
        input.value = type === "target" ? targetPreviousValue : detectedPreviousValue;
      }
    }
  });

  input.addEventListener("blur",() => {
    setTimeout(() => {
      if(!input.value.trim()){
        input.value = type === "target" ? targetPreviousValue : detectedPreviousValue;
      }
    }, 120);
  });

  document.addEventListener("click",(e) => {
    if(!input.contains(e.target) && !box.contains(e.target)){
      closeSuggestions(box,type);
    }
  });
}

function detectInput(text){
  const lower = normalizeText(text);
  const tokens = tokenize(text);

  if(/[\u0600-\u06FF]/.test(text)) return { label:"Arabic — Modern Standard" };
  if(/[\u0400-\u04FF]/.test(text)) return { label:"Russian" };
  if(/[\u3040-\u30ff]/.test(text)) return { label:"Japanese" };
  if(/[\u4e00-\u9fff]/.test(text)) return { label:"Chinese — Simplified" };
  if(/[\uAC00-\uD7AF]/.test(text)) return { label:"Korean" };

  if(lower.includes("parce") || lower.includes("parcero") || lower.includes("quiubo") || lower.includes("q'hubo")){
    return { label:"Spanish — Paisa (Medellín)" };
  }

  if(lower.includes("sumercé") || lower.includes("sumerce") || lower.includes("rolo")){
    return { label:"Spanish — Rolo (Bogotá)" };
  }

  const spanishSignals = [
    "hola","como","estas","que","para","porque","por","favor",
    "gracias","buenos","buenas","dias","noches","tardes",
    "amigo","amiga","con","sin","pero","muy","si","tambien",
    "quiero","puedo","necesito","vamos","bien","mal"
  ];

  let count = 0;
  for(const token of tokens){
    if(spanishSignals.includes(token)){
      count += 1;
    }
  }

  if(/[áéíóúñ¿¡]/i.test(text) || count >= 2){
    return { label:"Spanish — LATAM (Neutral)" };
  }

  return { label:"English — American" };
}

function styleChangeButtonAsMini(btn){
  if(!btn) return;
  btn.classList.remove("changeButton");
  btn.style.background = "#6b7280";
  btn.style.color = "white";
  btn.style.padding = "6px 10px";
  btn.style.fontSize = "12px";
  btn.style.lineHeight = "1.2";
}

function styleChangeButtonAsLarge(btn){
  if(!btn) return;
  btn.classList.add("changeButton");
  btn.style.background = "";
  btn.style.color = "";
  btn.style.padding = "";
  btn.style.fontSize = "";
  btn.style.lineHeight = "";
}

function updateDetectionCard(){
  const input = el("userInput");
  const card = el("detectedCard");
  const display = el("detectedLanguageDialect");
  const keepBtn = el("keepDetectedButton");
  const changeBtn = el("changeDetectedButton");

  if(!input || !card || !display) return;

  const text = input.value.trim();

  if(!text){
    card.classList.add("hidden");
    detectedSelection = null;
    confirmedInputSelection = null;
    detectionConfirmed = false;
    return;
  }

  if(!detectionConfirmed){
    detectedSelection = detectInput(text);
    display.innerText = `Input language detected: ${detectedSelection.label}`;

    if(keepBtn) keepBtn.classList.remove("hidden");
    if(changeBtn){
      changeBtn.classList.remove("hidden");
      changeBtn.innerText = "Change";
      styleChangeButtonAsLarge(changeBtn);
    }
  }else if(confirmedInputSelection){
    const wasManualOverride = inputManuallySelected;

    display.innerText = wasManualOverride
      ? `Input language selected: ${confirmedInputSelection.label}`
      : `Input language detected: ${confirmedInputSelection.label}`;

    if(keepBtn) keepBtn.classList.add("hidden");
    if(changeBtn){
      changeBtn.classList.remove("hidden");
      changeBtn.innerText = "Change";
      styleChangeButtonAsMini(changeBtn);
    }
  }

  card.classList.remove("hidden");
}

function confirmDetectedLanguage(){
   if(!detectedSelection) return;

  confirmedInputSelection = { ...detectedSelection };
  detectionConfirmed = true;
  inputManuallySelected = false;
  el("changeDetectedWrap")?.classList.add("hidden");

  updateDetectionCard();
}

function toggleDetectedChange(){
  const wrap = el("changeDetectedWrap");
  const input = el("detectedSearch");
  const box = el("detectedSuggestions");

  if(!wrap || !input || !box) return;

  wrap.classList.toggle("hidden");

  if(!wrap.classList.contains("hidden")){
    input.focus();
    input.value = "";
    renderSuggestions(box,findMatches(""),item => {
      detectedSelection = item;
      confirmedInputSelection = item;
      detectionConfirmed = true;
      inputManuallySelected = true;
      input.value = item.label;
      el("changeDetectedWrap").classList.add("hidden");
      updateDetectionCard();
    },"detected");
  }
}

function togglePronunciation(){
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
}

function buildBasicPronunciation(text){
  return (text || "").trim();
}

async function translateText(){
  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection
    ? targetSelection.label
    : (el("targetSearch")?.value.trim() || "");

  if(!input || !target){
    alert("Enter text and choose a language.");
    return;
  }

  detectedSelection = detectInput(input);

  if(!detectionConfirmed){
    confirmedInputSelection = { ...detectedSelection };
    detectionConfirmed = true;
  }

  updateDetectionCard();

  try{
    const response = await fetch(API_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ text:input, target:target })
    });

  const data = await response.json();

if(!response.ok){
  if(el("output")) el("output").value = data.error || "Translation error";
  return;
}

const translated = data.output || "";

    if(el("output")){
      el("output").value = translated;
    }

    if(el("pronunciation")){
      el("pronunciation").value = buildBasicPronunciation(translated);
    }
  }catch(err){
    if(el("output")) el("output").value = "Network or server error";
  }
}

function copyTranslation(){
  const output = el("output");
  if(!output) return;

  output.select();
  output.setSelectionRange(0,99999);
  document.execCommand("copy");
}


document.addEventListener("DOMContentLoaded",() => {
  if(localStorage.getItem("darkMode") === "on"){
    document.body.classList.add("dark");
  }

  el("siteLanguage")?.addEventListener("change",(e)=>{
    const lang = e.target.value;

    if(lang === "es"){
      document.querySelector('label[for="siteLanguage"]').innerText = "Idioma del sitio";
      el("inputLabel").innerText = "Texto de entrada";

      document.querySelector("h1").innerText = "Traductor Intercultural™";

      document.querySelector(".subtitle").innerText =
        "Más que traducción — comunicación intercultural real";

      document.querySelector(".description").innerText =
        "Traducción con conciencia de dialectos, guía de pronunciación y claridad cultural";

      document.querySelector('label[for="targetSearch"]').innerText = "Traducir a";
      document.querySelector('label[for="output"]').innerText = "Traducción";
      document.querySelector('label[for="pronunciation"]').innerText = "Guía de pronunciación";

      el("translateButton").innerText = "Traducir";
      el("copyButton").innerText = "Copiar";
      el("pronToggleLabel").innerText = "Mostrar pronunciación";

      el("speakNormal").innerText = "Hablar normal";
      el("speakSlow").innerText = "Hablar lento";

      el("darkModeButton").innerText = "🌙 Oscuro";

      const footer = document.querySelector("footer");
      footer.innerHTML = `
<strong>Traductor Intercultural™</strong>

Más que traducción — comunicación intercultural real  
Traducción con conciencia de dialectos • Guía de pronunciación • Claridad cultural  

© 2026 CCTLA-TBD, LLC  
Patente pendiente.
`;
    }else{
      document.querySelector('label[for="siteLanguage"]').innerText = "Site Language";
      el("inputLabel").innerText = "Input Text";

      document.querySelector("h1").innerText = "Cross-Cultural Translator™";

      document.querySelector(".subtitle").innerText =
        "Beyond translation — real cross-cultural communication";

      document.querySelector(".description").innerText =
        "Dialect-aware translation, pronunciation guidance, and cultural clarity";

      document.querySelector('label[for="targetSearch"]').innerText = "Translate To";
      document.querySelector('label[for="output"]').innerText = "Translation";
      document.querySelector('label[for="pronunciation"]').innerText = "Pronunciation Guide";

      el("translateButton").innerText = "Translate";
      el("copyButton").innerText = "Copy";
      el("pronToggleLabel").innerText = "Show Pronunciation";

      el("speakNormal").innerText = "Speak Normally";
      el("speakSlow").innerText = "Speak Slowly";

      el("darkModeButton").innerText = "🌙 Dark";

      const footer = document.querySelector("footer");
      footer.innerHTML = `
<strong>Cross-Cultural Translator™</strong>

Beyond translation — real cross-cultural communication  
Dialect-aware translation • Pronunciation guidance • Cultural clarity  

© 2026 CCTLA-TBD, LLC  
Patent pending.
`;
    }
  });

  function speakText(rate){
    const text = el("output")?.value || "";
    if(!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  el("darkModeButton")?.addEventListener("click",toggleDarkMode);
  el("translateButton")?.addEventListener("click",translateText);
  el("copyButton")?.addEventListener("click",copyTranslation);
  el("pronToggle")?.addEventListener("change",togglePronunciation);

  el("speakNormal")?.addEventListener("click",()=>{
    speakText(1);
  });

  el("speakSlow")?.addEventListener("click",()=>{
    speakText(0.6);
  });

  el("keepDetectedButton")?.addEventListener("click",confirmDetectedLanguage);
  el("changeDetectedButton")?.addEventListener("click",toggleDetectedChange);

  el("userInput")?.addEventListener("input",() => {
    detectionConfirmed = false;
    confirmedInputSelection = null;
    detectedSelection = detectInput(el("userInput").value || "");
    updateDetectionCard();
  });

  setupSearch("targetSearch","targetSuggestions",(item) => {
    targetSelection = item;
    el("targetSearch").value = item.label;
  },"target");

  setupSearch("detectedSearch","detectedSuggestions",(item) => {
    detectedSelection = item;
    confirmedInputSelection = item;
    detectionConfirmed = true;
    inputManuallySelected = true;
    el("detectedSearch").value = item.label;
    el("changeDetectedWrap").classList.add("hidden");
    updateDetectionCard();
  },"detected");

  updateDetectionCard();
});
