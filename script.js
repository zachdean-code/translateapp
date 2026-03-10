const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;

let targetActiveIndex = -1;

function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

function findMatches(value){
  const q=value.trim().toLowerCase();

  if(!q){
    return languageCatalog.slice(0,12);
  }

  return languageCatalog.filter(item=>{
    if(item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some(a=>a.toLowerCase().includes(q));
  }).slice(0,12);
}

function renderSuggestions(container,matches,onPick){
  container.innerHTML="";

  if(!matches.length){
    container.style.display="none";
    return;
  }

  matches.forEach((item,index)=>{
    const div=document.createElement("div");
    div.className="suggestionItem";
    div.innerText=item.label;

    div.onclick=()=>onPick(item);

    container.appendChild(div);
  });

  container.style.display="block";
}

function setupSearch(){
  const input=document.getElementById("targetSearch");
  const box=document.getElementById("targetSuggestions");

  input.addEventListener("focus",()=>{
    renderSuggestions(box,findMatches(input.value),(item)=>{
      targetSelection=item;
      input.value=item.label;
      box.style.display="none";
    });
  });

  input.addEventListener("input",()=>{
    renderSuggestions(box,findMatches(input.value),(item)=>{
      targetSelection=item;
      input.value=item.label;
      box.style.display="none";
    });
  });
}

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

  if(!text){
    card.classList.add("hidden");
    return;
  }

  const detected=detectInput(text);

  document.getElementById("detectedLanguageDialect").innerText=
  "Detected Language and Dialect: "+detected;

  card.classList.remove("hidden");
}

function keepDetected(){
  document.getElementById("changeDetectedWrap").classList.add("hidden");
}

function toggleDetectedChange(){
  const wrap=document.getElementById("changeDetectedWrap");
  wrap.classList.toggle("hidden");
}

async function translateText(){

  const input=document.getElementById("userInput").value.trim();

  const target=targetSelection
  ?targetSelection.label
  :document.getElementById("targetSearch").value.trim();

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

    document.getElementById("output").value=data.output || "";
    document.getElementById("pronunciation").value=data.output || "";

  }catch(err){

    document.getElementById("output").value="Network error";

  }
}

function copyTranslation(){
  const output=document.getElementById("output");
  output.select();
  document.execCommand("copy");
}

function togglePronunciation(){
  const checked=document.getElementById("pronToggle").checked;

  document
  .getElementById("pronunciationSection")
  .classList.toggle("hidden",!checked);
}

function speak(rate){
  const text=document.getElementById("output").value.trim();
  if(!text) return;

  speechSynthesis.cancel();

  const msg=new SpeechSynthesisUtterance(text);
  msg.rate=rate;

  speechSynthesis.speak(msg);
}

document.addEventListener("DOMContentLoaded",()=>{

  document
  .getElementById("darkModeButton")
  .addEventListener("click",toggleDarkMode);

  document
  .getElementById("userInput")
  .addEventListener("input",updateDetection);

  document
  .getElementById("translateButton")
  .addEventListener("click",translateText);

  document
  .getElementById("copyButton")
  .addEventListener("click",copyTranslation);

  document
  .getElementById("pronToggle")
  .addEventListener("change",togglePronunciation);

  document
  .getElementById("speakSlowButton")
  .addEventListener("click",()=>speak(0.6));

  document
  .getElementById("speakNormalButton")
  .addEventListener("click",()=>speak(1));

  document
  .getElementById("keepDetectedButton")
  .addEventListener("click",keepDetected);

  document
  .getElementById("changeDetectedButton")
  .addEventListener("click",toggleDetectedChange);

  setupSearch();

});
