/* 0316_1135p_STYLE_FULL_LOCKED */

/* ===== BASE (UNCHANGED) ===== */
*{box-sizing:border-box;}
:focus-visible{outline:3px solid #2563eb;outline-offset:2px;}
body.dark :focus-visible{outline:3px solid #60a5fa;}

body{
  margin:0;
  font-family:Inter,sans-serif;
  background:#f4f6f8;
  color:#111827;
  display:flex;
  justify-content:center;
  padding:20px;
  transition:background .2s ease,color .2s ease;
}
body.dark{background:#111827;color:#f3f4f6;}

.container{
  width:min(1150px,100%);
  background:white;
  padding:28px;
  border-radius:16px;
  box-shadow:0 10px 30px rgba(0,0,0,.08);
}
body.dark .container{background:#1f2937;}

.topBar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px;}
.languageGroup{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}

.darkToggle,.miniSelect{
  padding:8px 10px;border-radius:8px;border:1px solid #d1d5db;
  background:white;font-size:14px;color:#111827;
}
body.dark .darkToggle,body.dark .miniSelect{
  background:#111827;color:#f3f4f6;border-color:#4b5563;
}

h1{text-align:center;margin:10px 0;font-size:3rem;line-height:1.1;}
.subtitle{text-align:center;color:#4b5563;font-size:1.15rem;margin:0 0 8px;}
.description{text-align:center;color:#6b7280;font-size:1.1rem;margin:0 0 28px;}
body.dark .subtitle{color:#d1d5db;}
body.dark .description{color:#9ca3af;}

.translatorRow{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;}
.inputColumn,.outputColumn{display:flex;flex-direction:column;min-width:0;}

label{display:block;font-size:14px;font-weight:600;margin-bottom:8px;}

textarea,input{
  width:100%;padding:12px 14px;margin-bottom:14px;border-radius:10px;
  border:1px solid #d1d5db;font-size:15px;font-family:Inter,sans-serif;
}
textarea{resize:vertical;min-height:95px;}

#userInput,#output{height:95px;}
#pronunciation{height:60px;}

body.dark textarea,body.dark input{
  background:#111827;color:#f3f4f6;border-color:#4b5563;
}

button{
  padding:10px 14px;border-radius:10px;border:none;cursor:pointer;
  font-family:Inter,sans-serif;font-size:14px;
}

.primaryButton{background:#2563eb;color:white;margin-bottom:16px;}
.copyButton{background:#15803d;color:white;margin-bottom:16px;}
.normalButton{background:#f59e0b;color:white;} /* fixed */
.slowButton{background:#dc2626;color:white;}
.keepButton{background:#15803d;color:white;}
.changeButton{background:#b45309;color:white;}

.buttonRow{display:flex;gap:12px;width:100%;}
.buttonRow button{flex:1;}

.hidden{display:none !important;}

/* ===== FIXES ===== */

/* 1 — context toggle */
.contextToggleRow{
  display:flex;
  align-items:center;
  gap:8px;
  margin:6px 0 14px;
}
.contextToggleRow input{width:auto;margin:0;}
.contextToggleRow label{margin:0;}

/* 2 — context fields */
#contextSection{
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:10px 12px;
  margin-bottom:14px;
}
#contextSection label{margin-bottom:4px;}
#contextSection select{margin-bottom:0;}

/* 3 — detected card */
.detectedCard{
  margin-bottom:14px;
  padding:14px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  flex-wrap:nowrap;
}

/* 4 — translation header alignment */
.translationHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.translationHeader .toggleRow{
  margin:0;
  display:flex;
  align-items:center;
  gap:6px;
}
.translationHeader .toggleRow input{margin:0;width:auto;}
.translationHeader label{margin:0;}

/* remove old broken pull */
.toggleRow{margin-top:0;margin-bottom:10px;justify-content:flex-end;}

/* 5 — speak buttons layout */
.buttonRow{margin-top:6px;}

/* ===== MOBILE ===== */
@media (max-width:900px){
  .translatorRow{grid-template-columns:1fr;}
  #contextSection{grid-template-columns:1fr 1fr;}
}
@media (max-width:600px){
  #contextSection{grid-template-columns:1fr;}
}
