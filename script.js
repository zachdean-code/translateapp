const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;
let targetActiveIndex = -1;

/* ---------- DARK MODE ---------- */

function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

/* ---------- LANGUAGE SEARCH ---------- */

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

function renderSuggestions(container,matches,onPick){

  if(!container) return;

  container.innerHTML="";

  if(!matches.length){
    container.style.display="none";
    return;
  }

  matches.forEach(item=>{
    const div=document.createElement("div");
    div.className="suggestionItem";
    div.innerText=item.label;

    div.onclick=()=>{
      onPick(item);
    };

    container.appendChild(div);
  });

  container.style.display="block";
}

function setupSearch(){

  const input=document.getElementById("targetSearch");
  const box=document.getElementById("targetSuggestions");

  if(!input) return;

  input.addEventListener("focus",()=>{
    renderSuggestions(box,findMatches(input.value),(item)=>{
      targetSelection=item;
      input.value=item.label;
      if(box) box.style.display="none";
    });
  });

  input.addEventListener("input",()=>{
    renderSuggestions(box,findMatches(input.value),(item)=>{
      targetSelection=item;
      input.value=item.label;
      if(box) box.style.display="none";
    });
  });
}

/* ---------- INPUT LANGUAGE DETECTION ---------- */

function detectInput(text){

  const lower=text.toLowerCase();

  if(
    lower.includes("parce") ||
    lower.includes("quiubo") ||
    lower.includes("qué más pues")
  ){
    return "Spanish — Paisa (Medellín)";
  }

  if(
    lower.includes("che ") ||
    lower.includes("boludo")
  ){
    return "Spanish — Argentine";
  }

  if(
    lower.includes("órale") ||
    lower.includes("wey")
  ){
    return "Spanish — Mexican";
  }

  if(/[áéíóúñ¿¡]/i.test(text)){
    return "Spanish — LATAM";
  }

  return "English — American";
}

function updateDetection(){

  const text=document.getElementById("userInput").value.trim();
  const card=document.getElementById("detectedCard");

  if(!card) return;

  if(!text){
    card.classList.add("hidden");
    return;
  }

  const detected=detectInput(text);

  const label=document.getElementById("detectedLanguageDialect");
  if(label){
    label.innerText="Detected Language and Dialect: "+detected;
  }

  card.classList.remove("hidden");
}

function keepDetected(){
  const wrap=document.getElementById("changeDetectedWrap");
  if(wrap) wrap.classList.add("hidden");
}

function toggleDetectedChange(){
  const wrap=document.getElementById("changeDetectedWrap");
  if(wrap) wrap.classList.toggle("hidden");
}

/* ---------- TRANSLATION ---------- */

async function translateText(){

  const input=document.getElementById("userInput").value.trim();

  const target=targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if(!input || !target){
    alert("Enter text and choose a language.");
    return;
  }

  try{

    const response=await fetch(API_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        text:input,
        target:target
      })
    });

    const data=await response.json();

    if(!response.ok){
      document.getElementById("output").value=data.error || "Translation error";
      return;
    }

    const translation=data.translation_text || data.output || "";
    const usageNote=data.usage_note || "";
    const pronunciation=data.pronunciation_guide || "";

    document.getElementById("output").value=translation;

    /* Usage note */

    const usageSection=document.getElementById("usageNoteSection");
    const usageBox=document.getElementById("usageNote");

    if(usageSection && usageBox){
      if(data.show_usage_note && usageNote){
        usageBox.value=usageNote;
        usageSection.classList.remove("hidden");
      }else{
        usageSection.classList.add("hidden");
        usageBox.value="";
      }
    }

    /* Pronunciation */

    const pronSection=document.getElementById("pronunciationSection");
    const pronToggle=document.getElementById("pronToggle");

    if(pronSection && pronToggle){
      if(pronToggle.checked && data.show_pronunciation){
        document.getElementById("pronunciation").value=pronunciation;
        pronSection.classList.remove("hidden");
      }else{
        pronSection.classList.add("hidden");
      }
    }

  }catch(err){
    document.getElementById("output").value="Network error";
  }
}

/* ---------- COPY ---------- */

function copyTranslation(){
  const output=document.getElementById("output");
  if(!output) return;

  output.select();
  document.execCommand("copy");
}

/* ---------- PRONUNCIATION ---------- */

function togglePronunciation(){

  const checked=document.getElementById("pronToggle").checked;

  const section=document.getElementById("pronunciationSection");

  if(section){
    section.classList.toggle("hidden",!checked);
  }
}

function speak(rate){

  const text=document.getElementById("output").value.trim();

  if(!text) return;

  speechSynthesis.cancel();

  const msg=new SpeechSynthesisUtterance(text);
  msg.rate=rate;

  speechSynthesis.speak(msg);
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded",()=>{

  const darkBtn=document.getElementById("darkModeButton");
  if(darkBtn) darkBtn.addEventListener("click",toggleDarkMode);

  const inputBox=document.getElementById("userInput");
  if(inputBox) inputBox.addEventListener("input",updateDetection);

  const translateBtn=document.getElementById("translateButton");
  if(translateBtn) translateBtn.addEventListener("click",translateText);

  const copyBtn=document.getElementById("copyButton");
  if(copyBtn) copyBtn.addEventListener("click",copyTranslation);

  const pronToggle=document.getElementById("pronToggle");
  if(pronToggle) pronToggle.addEventListener("change",togglePronunciation);

  const slowBtn=document.getElementById("speakSlowButton");
  if(slowBtn) slowBtn.addEventListener("click",()=>speak(0.6));

  const normalBtn=document.getElementById("speakNormalButton");
  if(normalBtn) normalBtn.addEventListener("click",()=>speak(1));

  const keepBtn=document.getElementById("keepDetectedButton");
  if(keepBtn) keepBtn.addEventListener("click",keepDetected);

  const changeBtn=document.getElementById("changeDetectedButton");
  if(changeBtn) changeBtn.addEventListener("click",toggleDetectedChange);

  setupSearch();

});
