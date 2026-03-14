const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];

let targetActiveIndex = -1;
let detectedActiveIndex = -1;


/* -------------------------
   HELPER
-------------------------- */

function closeSuggestions(container){
  container.style.display = "none";
}

function highlightActive(container, index){
  const items = container.querySelectorAll(".suggestionItem");

  items.forEach((item,i)=>{
    item.classList.toggle("activeSuggestion", i===index);
  });
}


/* -------------------------
   SEARCH MATCHING
-------------------------- */

function findMatches(value){
  const q = value.trim().toLowerCase();

  if(!q){
    return languageCatalog.slice(0,12);
  }

  return languageCatalog.filter(item => {

    if(item.label.toLowerCase().includes(q)){
      return true;
    }

    return item.aliases.some(a => a.toLowerCase().includes(q));

  }).slice(0,12);
}


/* -------------------------
   RENDER SUGGESTIONS
-------------------------- */

function renderSuggestions(container, matches, onPick, type){

  container.innerHTML = "";

  if(!matches.length){
    closeSuggestions(container);
    return;
  }

  if(type==="target"){
    targetMatches = matches;
    targetActiveIndex = -1;
  }else{
    detectedMatches = matches;
    detectedActiveIndex = -1;
  }

  matches.forEach(item=>{

    const div = document.createElement("div");

    div.className = "suggestionItem";
    div.innerText = item.label;

    div.onclick = ()=>onPick(item);

    container.appendChild(div);

  });

  container.style.display="block";
}


/* -------------------------
   SEARCH SETUP
-------------------------- */

function setupSearch(inputId, suggestionId, onPick, type){

  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionId);

  input.addEventListener("focus",()=>{
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input",()=>{

    renderSuggestions(box, findMatches(input.value), onPick, type);

  });

  document.addEventListener("click",(e)=>{

    if(!input.contains(e.target) && !box.contains(e.target)){
      closeSuggestions(box);
    }

  });

}


/* -------------------------
   LANGUAGE DETECTION
-------------------------- */

function detectInput(text){

  const lower = text.toLowerCase();

  if(/[áéíóúñ¿¡]/i.test(text)){
    return {label:"Spanish"};
  }

  return {label:"English"};

}

function updateDetection(){

  const text = document.getElementById("userInput").value.trim();

  const card = document.getElementById("detectedCard");

  if(!text){

    card.classList.add("hidden");

    detectedSelection = null;
    confirmedInputLanguage = null;

    document.getElementById("translateButton").disabled = true;

    return;
  }

  detectedSelection = detectInput(text);

  document.getElementById("detectedLanguageDialect").innerText =
    "Detected Language: " + detectedSelection.label;

  card.classList.remove("hidden");

  document.getElementById("translateButton").disabled = true;

}


/* -------------------------
   DETECTED CONFIRMATION
-------------------------- */

function keepDetected(){

  confirmedInputLanguage = detectedSelection.label;

  document.getElementById("translateButton").disabled = false;

}

function toggleDetectedChange(){

  const wrap = document.getElementById("changeDetectedWrap");

  wrap.classList.toggle("hidden");

  if(!wrap.classList.contains("hidden")){
    document.getElementById("detectedSearch").focus();
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

function buildPronunciation(text,target){

  if(!text) return "";

  const lower = target.toLowerCase();

  if(lower.includes("spanish")){
    return spanishPronunciation(text);
  }

  if(lower.includes("english")){
    return text;
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

  const input = document.getElementById("userInput").value.trim();

  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value;

  if(!input || !target){
    alert("Enter text and choose a language.");
    return;
  }

  try{

    const response = await fetch(API_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        text:input,
        targetLanguage:target,
        sourceLanguage:confirmedInputLanguage
      })
    });

    const data = await response.json();

    const translated = data.output || "";

    document.getElementById("output").value = translated;

    const pron = buildPronunciation(translated,target);

    document.getElementById("pronunciation").value = pron;

  }
  catch(err){

    document.getElementById("output").value = "Network error";

  }

}


/* -------------------------
   COPY
-------------------------- */

function copyTranslation(){

  const box = document.getElementById("output");

  box.select();

  document.execCommand("copy");

}


/* -------------------------
   SPEECH
-------------------------- */

function speak(rate){

  const text = document.getElementById("output").value;

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

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on":"off"
  );

}


/* -------------------------
   STARTUP
-------------------------- */

document.addEventListener("DOMContentLoaded",()=>{

  if(localStorage.getItem("darkMode")==="on"){
    document.body.classList.add("dark");
  }

  document.getElementById("darkModeButton")
    .addEventListener("click",toggleDarkMode);

  document.getElementById("userInput")
    .addEventListener("input",updateDetection);

  document.getElementById("keepDetectedButton")
    .addEventListener("click",keepDetected);

  document.getElementById("changeDetectedButton")
    .addEventListener("click",toggleDetectedChange);

  document.getElementById("translateButton")
    .addEventListener("click",translateText);

  document.getElementById("copyButton")
    .addEventListener("click",copyTranslation);

  document.getElementById("speakNormal")
    .addEventListener("click",()=>speak(1.0));

  document.getElementById("speakSlow")
    .addEventListener("click",()=>speak(0.6));

  setupSearch(
    "targetSearch",
    "targetSuggestions",
    item=>{
      targetSelection=item;
      document.getElementById("targetSearch").value=item.label;
      closeSuggestions(document.getElementById("targetSuggestions"));
    },
    "target"
  );

  setupSearch(
    "detectedSearch",
    "detectedSuggestions",
    item=>{
      confirmedInputLanguage=item.label;
      document.getElementById("detectedSearch").value=item.label;
      closeSuggestions(document.getElementById("detectedSuggestions"));
      document.getElementById("translateButton").disabled=false;
    },
    "detected"
  );

});
