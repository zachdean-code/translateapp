function toggleDark(){
document.body.classList.toggle("dark")
}

async function translate(){

let text=document.getElementById("inputText").value

let target=document.getElementById("languageSearch").value

if(!text)return

try{

let response=await fetch("https://YOUR-RENDER-SERVICE.onrender.com/translate",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
text:text,
target:target
})

})

let data=await response.json()

document.getElementById("outputText").value=data.translation

document.getElementById("detectedLanguage").innerText="Detected automatically"

document.getElementById("confidence").innerText="—"

}catch(err){

console.error(err)

alert("Translation error")

}

}

function copy(){

let text=document.getElementById("outputText")

text.select()

document.execCommand("copy")

}

function speakSlow(){

console.log("slow speech")

}

function speakNormal(){

console.log("normal speech")

}

function changeDetected(){

alert("Manual language selection coming soon")

}

let search=document.getElementById("languageSearch")

let suggestions=document.getElementById("suggestions")

search.addEventListener("input",function(){

let value=this.value.toLowerCase()

suggestions.innerHTML=""

if(value.length<1)return

languages.forEach(lang=>{

if(lang.toLowerCase().includes(value)){

let div=document.createElement("div")

div.innerText=lang

div.onclick=function(){

search.value=lang

suggestions.innerHTML=""

}

suggestions.appendChild(div)

}

})

})
