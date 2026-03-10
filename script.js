function toggleDark(){
document.body.classList.toggle("dark")
}

function translate(){

let input=document.getElementById("inputText").value

if(!input)return

document.getElementById("outputText").value="Demo translation output"

document.getElementById("detectedLanguage").innerText="Spanish"

document.getElementById("confidence").innerText="92%"
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

alert("manual language selection coming soon")
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
