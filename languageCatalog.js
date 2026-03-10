const languageCatalog=[
"American English",
"British English",
"LATAM Spanish",
"French",
"German",
"Italian",
"Portuguese",
"Chinese",
"Japanese",
"Korean",
"Russian"
];

document.addEventListener("DOMContentLoaded",()=>{
const select=document.getElementById("targetLanguage");
languageCatalog.forEach(lang=>{
let opt=document.createElement("option");
opt.value=lang;
opt.textContent=lang;
select.appendChild(opt);
});
});
