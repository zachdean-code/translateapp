const API_URL="https://translateapp-1.onrender.com/translate";

async function translateText(){
const text=document.getElementById("userInput").value;
const target=document.getElementById("targetLanguage").value;

const res=await fetch(API_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({text:text,target:target})
});

const data=await res.json();
document.getElementById("output").value=data.output||"Error";
}
