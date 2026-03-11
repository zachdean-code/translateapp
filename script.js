
const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let detectedSelection = null;
let storedPronunciation = "";
let pronunciationAllowed = false;

function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

async function translateText(){

  const input = document.getElementById("userInput").value.trim();
  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if(!input || !target){
    alert("Enter text and choose a language.");
    return;
  }

  const response = await fetch(API_URL,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      text:input,
      target:target,
      source:detectedSelection || ""
    })
  });

  const data = await response.json();

  const translation = data.translation_text || "";
  const usageNote = data.usage_note || "";
  const pronunciation = data.pronunciation_guide || "";

  document.getElementById("output").value = translation;

  storedPronunciation = pronunciation;
  pronunciationAllowed = data.show_pronunciation;

  /* Usage note */

  const usageSection=document.getElementById("usageNoteSection");
  const usageBox=document.getElementById("usageNote");

  if(data.show_usage_note && usageNote){
      usageBox.value = usageNote;
      usageSection.classList.remove("hidden");
  }else{
      usageSection.classList.add("hidden");
      usageBox.value = "";
  }

  updatePronunciationVisibility();
}

function updatePronunciationVisibility(){

  const toggle=document.getElementById("pronToggle");
  const section=document.getElementById("pronunciationSection");
  const box=document.getElementById("pronunciation");

  if(!pronunciationAllowed){
    section.classList.add("hidden");
    return;
  }

  if(toggle.checked){
    box.value = storedPronunciation;
    section.classList.remove("hidden");
  }else{
    section.classList.add("hidden");
  }
}

function togglePronunciation(){
  updatePronunciationVisibility();
}

function copyTranslation(){
  const output=document.getElementById("output");
  output.select();
  document.execCommand("copy");
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

});
