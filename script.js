
const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let targetActiveIndex = -1;
let storedPronunciation = "";
let pronunciationAllowed = false;

/* ---------- DARK MODE ---------- */

function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

/* ---------- LANGUAGE SEARCH ---------- */

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

  matches.forEach(item=>{
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

  if(!input || !box) return;

  input.addEventListener("focus",()=>{
    const matches=findMatches(input.value);
    renderSuggestions(box,matches,pickItem);
    targetActiveIndex=-1;
  });

  input.addEventListener("input",()=>{
    const matches=findMatches(input.value);
    renderSuggestions(box,matches,pickItem);
    targetActiveIndex=-1;
  });

  input.addEventListener("keydown",(e)=>{

    const items=box.querySelectorAll(".suggestionItem");
    if(!items.length) return;

    if(e.key==="ArrowDown"){
      e.preventDefault();
      targetActiveIndex++;
      if(targetActiveIndex>=items.length){
        targetActiveIndex=0;
      }
      highlight(items);
    }

    if(e.key==="ArrowUp"){
      e.preventDefault();
      targetActiveIndex--;
      if(targetActiveIndex<0){
        targetActiveIndex=items.length-1;
      }
      highlight(items);
    }

    if(e.key==="Enter"){
      if(targetActiveIndex>=0){
        e.preventDefault();
        items[targetActiveIndex].click();
      }
    }

  });

  function pickItem(item){
    targetSelection=item;
    input.value=item.label;
    box.style.display="none";
  }

  function highlight(items){
    items.forEach(i=>i.classList.remove("active"));
    if(items[targetActiveIndex]){
      items[targetActiveIndex].classList.add("active");
    }
  }
}

/* ---------- TRANSLATION ---------- */

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

    const translation=data.translation_text || "";
    const pronunciation=data.pronunciation_guide || "";

    document.getElementById("output").value=translation;

    /* Disable usage note */

    const usageSection=document.getElementById("usageNoteSection");
    if(usageSection){
      usageSection.classList.add("hidden");
    }

    storedPronunciation=pronunciation;
    pronunciationAllowed=!!data.show_pronunciation;

    updatePronunciationVisibility();

  }catch(err){

    document.getElementById("output").value="Network error";

  }
}

/* ---------- PRONUNCIATION ---------- */

function updatePronunciationVisibility(){

  const pronSection=document.getElementById("pronunciationSection");
  const pronToggle=document.getElementById("pronToggle");
  const pronBox=document.getElementById("pronunciation");

  if(!pronSection || !pronToggle || !pronBox) return;

  if(!pronunciationAllowed){
    pronSection.classList.add("hidden");
    pronBox.value="";
    return;
  }

  if(pronToggle.checked){
    pronBox.value=storedPronunciation || "";
    pronSection.classList.remove("hidden");
  }else{
    pronSection.classList.add("hidden");
  }
}

function togglePronunciation(){
  updatePronunciationVisibility();
}

/* ---------- COPY ---------- */

function copyTranslation(){
  const output=document.getElementById("output");
  if(!output) return;

  output.select();
  document.execCommand("copy");
}

/* ---------- SPEAK ---------- */

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

  /* Hide detected language UI */

  const detectedCard=document.getElementById("detectedCard");
  if(detectedCard) detectedCard.style.display="none";

  const changeDetected=document.getElementById("changeDetectedWrap");
  if(changeDetected) changeDetected.style.display="none";

  document
  .getElementById("darkModeButton")
  ?.addEventListener("click",toggleDarkMode);

  document
  .getElementById("translateButton")
  ?.addEventListener("click",translateText);

  document
  .getElementById("copyButton")
  ?.addEventListener("click",copyTranslation);

  document
  .getElementById("pronToggle")
  ?.addEventListener("change",togglePronunciation);

  document
  .getElementById("speakSlowButton")
  ?.addEventListener("click",()=>speak(0.6));

  document
  .getElementById("speakNormalButton")
  ?.addEventListener("click",()=>speak(1));

  setupSearch();

});
