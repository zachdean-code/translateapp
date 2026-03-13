
const API_URL = "https://translateapp-1.onrender.com/translate";

let targetSelection = null;
let targetMatches = [];
let targetActiveIndex = -1;

let detectedSelection = null;
let confirmedInputSelection = null;
let detectionConfirmed = false;

const SUPPORTED_PRONUNCIATION_BASES = new Set([
"english",
"spanish",
"italian",
"french",
"german",
"portuguese",
"dutch"
]);

const SUPPORTED_PRONUNCIATION_PAIRS = new Set([
"english|spanish",
"spanish|english",
"english|italian",
"italian|english",
"english|french",
"french|english",
"english|german",
"german|english",
"english|portuguese",
"portuguese|english",
"english|dutch",
"dutch|english"
]);

function el(id){
return document.getElementById(id);
}

function parseBaseLanguage(label){
const s = (label||"").toLowerCase();

if(s.startsWith("english")) return "english";
if(s.startsWith("spanish")) return "spanish";
if(s.startsWith("italian")) return "italian";
if(s.startsWith("french")) return "french";
if(s.startsWith("german")) return "german";
if(s.startsWith("portuguese")) return "portuguese";
if(s.startsWith("dutch")) return "dutch";

return s;
}

function detectInput(text){

const lower = text.toLowerCase();

if(/[\u0600-\u06FF]/.test(text)) return {label:"Arabic"};
if(/[\u0400-\u04FF]/.test(text)) return {label:"Russian"};
if(/[\u3040-\u30ff]/.test(text)) return {label:"Japanese"};
if(/[\u4e00-\u9fff]/.test(text)) return {label:"Chinese"};
if(/[\uAC00-\uD7AF]/.test(text)) return {label:"Korean"};

if(lower.includes("parce") || lower.includes("qué más")){
return {label:"Spanish — Paisa (Medellín)"};
}

if(/[áéíóúñ¿¡]/i.test(text)){
return {label:"Spanish — LATAM"};
}

return {label:"English — American"};

}

function updateDetectionCard(){

const input = el("userInput");
const card = el("detectedCard");

if(!input || !card) return;

const text = input.value.trim();

if(!text){
card.classList.add("hidden");
detectedSelection=null;
confirmedInputSelection=null;
detectionConfirmed=false;
return;
}

if(!detectionConfirmed){
detectedSelection = detectInput(text);
}

const display = el("detectedLanguageDialect");

if(display){

if(detectionConfirmed){
display.innerText="Input language: "+confirmedInputSelection.label;
}else{
display.innerText="Detected language: "+detectedSelection.label;
}

}

card.classList.remove("hidden");

}

function confirmDetectedLanguage(){

if(!detectedSelection) return;

confirmedInputSelection = detectedSelection;
detectionConfirmed = true;

updateDetectionCard();

}

function setupSearch(inputId,suggestionId,onPick){

const input = el(inputId);
const box = el(suggestionId);

if(!input || !box) return;

input.addEventListener("input",()=>{

const q = input.value.toLowerCase();

const matches = languageCatalog
.filter(item=>{
return item.label.toLowerCase().includes(q)
|| item.aliases.some(a=>a.toLowerCase().includes(q));
})
.slice(0,12);

box.innerHTML="";

targetMatches = matches;
targetActiveIndex = -1;

matches.forEach((item,index)=>{

const div = document.createElement("div");
div.className="suggestionItem";
div.innerText=item.label;

div.addEventListener("mousedown",(e)=>{
e.preventDefault();
onPick(item);
box.style.display="none";
});

box.appendChild(div);

});

box.style.display = matches.length ? "block":"none";

});

input.addEventListener("keydown",(e)=>{

if(!targetMatches.length) return;

if(e.key==="ArrowDown"){
e.preventDefault();
targetActiveIndex=(targetActiveIndex+1)%targetMatches.length;
highlight(box);
}

if(e.key==="ArrowUp"){
e.preventDefault();
targetActiveIndex=(targetActiveIndex<=0)?targetMatches.length-1:targetActiveIndex-1;
highlight(box);
}

if(e.key==="Enter"){
e.preventDefault();
const item = targetMatches[targetActiveIndex];
if(item){
onPick(item);
box.style.display="none";
}
}

});

function highlight(box){

const items = box.querySelectorAll(".suggestionItem");

items.forEach((item,i)=>{
item.classList.toggle("activeSuggestion",i===targetActiveIndex);
});

}

}

function getPronunciationPairState(inputLabel,targetLabel){

const inputBase = parseBaseLanguage(inputLabel);
const targetBase = parseBaseLanguage(targetLabel);

if(inputBase===targetBase){
return {mode:"hidden"};
}

const key=inputBase+"|"+targetBase;

const supported =
SUPPORTED_PRONUNCIATION_BASES.has(inputBase)
&& SUPPORTED_PRONUNCIATION_BASES.has(targetBase)
&& SUPPORTED_PRONUNCIATION_PAIRS.has(key);

return supported ? {mode:"supported"} : {mode:"unsupported"};

}

function spanishToEnglishPhonetics(text){

const words=text.split(/\s+/);

return words.map(word=>{

let w=word
.toLowerCase()
.replace(/[¡!¿?.,;:()"']/g,"")
.replace(/á/g,"ah")
.replace(/é/g,"ay")
.replace(/í/g,"ee")
.replace(/ó/g,"oh")
.replace(/ú/g,"oo")
.replace(/ñ/g,"ny")
.replace(/ll/g,"y")
.replace(/qu/g,"k")
.replace(/j/g,"h");

return w;

}).join("   ");

}

function englishToSpanishReader(text){

return text.split(/\s+/).map(w=>{

return w
.toLowerCase()
.replace(/th/g,"d")
.replace(/oo/g,"u")
.replace(/ee/g,"i")
.replace(/igh/g,"ai");

}).join("   ");

}

function buildPronunciation(text,inputLabel,targetLabel){

const state=getPronunciationPairState(inputLabel,targetLabel);

if(state.mode!=="supported") return "";

const inputBase=parseBaseLanguage(inputLabel);
const targetBase=parseBaseLanguage(targetLabel);

if(inputBase==="english" && targetBase==="spanish"){
return spanishToEnglishPhonetics(text);
}

if(inputBase==="spanish" && targetBase==="english"){
return englishToSpanishReader(text);
}

return text;

}

async function translateText(){

const input = el("userInput").value.trim();

const target = targetSelection
? targetSelection.label
: el("targetSearch").value.trim();

if(!input || !target){
alert("Enter text and choose a language.");
return;
}

if(!confirmedInputSelection){
confirmedInputSelection = detectInput(input);
detectionConfirmed=true;
updateDetectionCard();
}

const response=await fetch(API_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({text:input,target:target})
});

const data=await response.json();

let translated=data.output||"";

translated=translated
.replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/,"")
.trim();

el("output").value=translated;

const pron=buildPronunciation(
translated,
confirmedInputSelection.label,
target
);

el("pronunciation").value=pron;

}

function copyTranslation(){

const output=el("output");

output.select();
document.execCommand("copy");

}

document.addEventListener("DOMContentLoaded",()=>{

el("darkModeButton")?.addEventListener("click",()=>{
document.body.classList.toggle("dark");
});

el("translateButton")?.addEventListener("click",translateText);

el("copyButton")?.addEventListener("click",copyTranslation);

el("keepDetectedButton")?.addEventListener("click",confirmDetectedLanguage);

el("userInput")?.addEventListener("input",()=>{
updateDetectionCard();
});

setupSearch(
"targetSearch",
"targetSuggestions",
item=>{
targetSelection=item;
el("targetSearch").value=item.label;
}
);

setupSearch(
"detectedSearch",
"detectedSuggestions",
item=>{
detectedSelection=item;
confirmedInputSelection=item;
detectionConfirmed=true;
updateDetectionCard();
}
);

});
