function translateText(){

const input=document.getElementById("userInput").value
const target=document.getElementById("targetLanguage").value

fetch("https://translateapp-1.onrender.com/translate",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
text:input,
targetLanguage:target
})

})

.then(async response=>{

const text=await response.text()

try{

const data=JSON.parse(text)

document.getElementById("output").value=data.output||""

document.getElementById("pronunciation").value=data.pronunciation||""

}

catch(e){

document.getElementById("output").value=text

}

})

.catch(err=>{
document.getElementById("output").value="Error: "+err
})

}


function copyTranslation(){

const box=document.getElementById("output")

box.select()

document.execCommand("copy")

}


function speakSlow(){

const text=document.getElementById("output").value

if(!text)return

const msg=new SpeechSynthesisUtterance(text)

msg.rate=0.6

speechSynthesis.speak(msg)

}


function speakNormal(){

const text=document.getElementById("output").value

if(!text)return

const msg=new SpeechSynthesisUtterance(text)

msg.rate=1.0

speechSynthesis.speak(msg)

}
