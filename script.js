const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let detectedSelection = null;
let confirmedInputSelection = null;
let detectionConfirmed = false;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

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
    .split(/[\s—()\/,-]+/)
    .filter(Boolean);
}

function toggleDarkMode(){
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on":"off"
  );
}

function scoreLanguageMatch(item,query){

  const q = normalizeText(query);
  if(!q) return 1000;

  const label = normalizeText(item.label);
  const aliases = (item.aliases||[]).map(normalizeText);

  if(label===q) return 0;
  if(aliases.includes(q)) return 1;
  if(label.startsWith(q)) return 2;

  for(const a of aliases){
    if(a.startsWith(q)) return 3;
  }

  const words = tokenize(item.label);

  for(const w of words){
    if(w.startsWith(q)) return 4;
  }

  return 9999;
}

function findMatches(value){

  const q = normalizeText(value);

  if(!q){
    return languageCatalog.slice(0,12);
  }

  return languageCatalog
    .map(item=>({item,score:scoreLanguageMatch(item,q)}))
    .filter(r=>r.score<9999)
    .sort((a,b)=>{
      if(a.score!==b.score) return a.score-b.score;
      return a.item.label.localeCompare(b.item.label);
    })
    .map(r=>r.item)
    .slice(0,12);
}

function closeSuggestions(container,type){

  if(!container) return;

  container.style.display="none";

  if(type==="target"){
    targetMatches=[];
    targetActiveIndex=-1;
  }else{
    detectedMatches=[];
    detectedActiveIndex=-1;
  }

}

function highlightActive(container,type){

  const items = container.querySelectorAll(".suggestionItem");
  const idx = type==="target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((el,i)=>{
    el.classList.toggle("activeSuggestion",i===idx);
  });

}

function renderSuggestions(container,matches,onPick,type){

  container.innerHTML="";

  if(!matches.length){
    container.style.display="none";
    return;
  }

  if(type==="target"){
    targetMatches=matches;
    targetActiveIndex=-1;
  }else{
    detectedMatches=matches;
    detectedActiveIndex=-1;
  }

  matches.forEach(item=>{

    const div=document.createElement("div");
    div.className="suggestionItem";
    div.innerText=item.label;

    div.addEventListener("mousedown",e=>{
      e.preventDefault();
      onPick(item);
      container.style.display="none";
    });

    container.appendChild(div);

  });

  container.style.display="block";

}

function setupSearch(inputId,suggestionId,onPick,type){

  const input=el(inputId);
  const box=el(suggestionId);

  if(!input||!box) return;

  input.addEventListener("focus",()=>{
    renderSuggestions(box,findMatches(input.value),onPick,type);
  });

  input.addEventListener("input",()=>{
    renderSuggestions(box,findMatches(input.value),onPick,type);
  });

  input.addEventListener("keydown",(e)=>{

    const matches = type==="target" ? targetMatches : detectedMatches;

    if(!matches.length) return;

    if(e.key==="ArrowDown"){
      e.preventDefault();
      if(type==="target"){
        targetActiveIndex=(targetActiveIndex+1)%matches.length;
      }else{
        detectedActiveIndex=(detectedActiveIndex+1)%matches.length;
      }
      highlightActive(box,type);
    }

    if(e.key==="ArrowUp"){
      e.preventDefault();
      if(type==="target"){
        targetActiveIndex=(targetActiveIndex<=0?matches.length-1:targetActiveIndex-1);
      }else{
        detectedActiveIndex=(detectedActiveIndex<=0?matches.length-1:detectedActiveIndex-1);
      }
      highlightActive(box,type);
    }

    if(e.key==="Enter"){

      const idx = type==="target" ? targetActiveIndex : detectedActiveIndex;

      if(matches[idx]){
        e.preventDefault();
        onPick(matches[idx]);
        box.style.display="none";
      }

    }

    if(e.key==="Escape"){
      box.style.display="none";
    }

  });

}

function detectInput(text){

  const lower=normalizeText(text);

  if(/[\u0600-\u06FF]/.test(text)) return {label:"Arabic — Modern Standard"};
  if(/[\u0400-\u04FF]/.test(text)) return {label:"Russian"};
  if(/[\u3040-\u30ff]/.test(text)) return {label:"Japanese"};
  if(/[\u4e00-\u9fff]/.test(text)) return {label:"Chinese — Simplified"};
  if(/[\uAC00-\uD7AF]/.test(text)) return {label:"Korean"};

  if(lower.includes("parce")) return {label:"Spanish — Paisa (Medellín)"};
  if(lower.includes("sumercé")||lower.includes("sumerce")) return {label:"Spanish — Rolo (Bogotá)"};

  if(/[áéíóúñ¿¡]/i.test(text)){
    return {label:"Spanish — LATAM (Neutral)"};
  }

  return {label:"English — American"};
}

function confirmDetectedLanguage(){

  if(!detectedSelection) return;

  confirmedInputSelection={...detectedSelection};
  detectionConfirmed=true;

  el("changeDetectedWrap")?.classList.add("hidden");

  el("detectedCard")?.classList.add("hidden");

  updateDetectionCard();

}
function updateDetectionCard(){

  const input=el("userInput");
  const card=el("detectedCard");
  const display=el("detectedLanguageDialect");

  if(!input||!card||!display) return;

  const text=input.value.trim();

  if(!text){
    card.classList.add("hidden");
    detectedSelection=null;
    confirmedInputSelection=null;
    detectionConfirmed=false;
    return;
  }

  if(!detectionConfirmed){
    detectedSelection=detectInput(text);
    display.innerText=`Detected language: ${detectedSelection.label}`;
  }else if(confirmedInputSelection){
    display.innerText=`Input language: ${confirmedInputSelection.label}`;
  }

  card.classList.remove("hidden");

}

function confirmDetectedLanguage(){

  if(!detectedSelection) return;

  confirmedInputSelection={...detectedSelection};
  detectionConfirmed=true;

  el("changeDetectedWrap")?.classList.add("hidden");

  updateDetectionCard();

}

function toggleDetectedChange(){

  const wrap=el("changeDetectedWrap");

  if(!wrap) return;

  wrap.classList.toggle("hidden");

  if(!wrap.classList.contains("hidden")){

    const input=el("detectedSearch");

    if(input){
      input.focus();
      renderSuggestions(
        el("detectedSuggestions"),
        findMatches(input.value),
        (item)=>{
          detectedSelection={label:item.label};
          confirmedInputSelection={label:item.label};
          detectionConfirmed=true;
          el("detectedSearch").value=item.label;
          el("changeDetectedWrap").classList.add("hidden");
          updateDetectionCard();
        },
        "detected"
      );
    }

  }

}

async function translateText(){

  const input=el("userInput")?.value.trim()||"";

  const target=targetSelection
    ?targetSelection.label
    :(el("targetSearch")?.value.trim()||"");

  if(!input||!target){
    alert("Enter text and choose a language.");
    return;
  }

  detectedSelection=detectInput(input);

  if(!detectionConfirmed){
    confirmedInputSelection={...detectedSelection};
    detectionConfirmed=true;
  }

  updateDetectionCard();

  try{

    const response=await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text:input,target:target})
    });

    const data=await response.json();

    if(!response.ok){
      if(el("output")) el("output").value=data.error||"Translation error";
      return;
    }

    if(el("output")){
      el("output").value=data.output||"";
    }

  }catch(err){

    if(el("output")) el("output").value="Network or server error";

  }

}

function copyTranslation(){

  const output=el("output");

  if(!output) return;

  output.select();
  output.setSelectionRange(0,99999);

  document.execCommand("copy");

}

document.addEventListener("DOMContentLoaded",()=>{

  if(localStorage.getItem("darkMode")==="on"){
    document.body.classList.add("dark");
  }

  el("darkModeButton")?.addEventListener("click",toggleDarkMode);
  el("translateButton")?.addEventListener("click",translateText);
  el("copyButton")?.addEventListener("click",copyTranslation);

  el("keepDetectedButton")?.addEventListener("click",confirmDetectedLanguage);
  el("changeDetectedButton")?.addEventListener("click",toggleDetectedChange);

  el("userInput")?.addEventListener("input",()=>{
    detectionConfirmed=false;
    confirmedInputSelection=null;
    detectedSelection=detectInput(el("userInput").value||"");
    updateDetectionCard();
  });

  setupSearch("targetSearch","targetSuggestions",(item)=>{
    targetSelection=item;
    el("targetSearch").value=item.label;
  },"target");

  setupSearch("detectedSearch","detectedSuggestions",(item)=>{
    detectedSelection={label:item.label};
    confirmedInputSelection={label:item.label};
    detectionConfirmed=true;
    el("detectedSearch").value=item.label;
    el("changeDetectedWrap").classList.add("hidden");
    updateDetectionCard();
  },"detected");

  updateDetectionCard();

});
