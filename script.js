const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let confirmedInputLanguage = null;
let confirmationMode = null; // "detected" or "chosen"
let targetSelection = null;

let targetMatches = [];
let detectedMatches = [];
let targetActiveIndex = -1;
let detectedActiveIndex = -1;

// TEMP: move these labels into frontend catalog files later
const TARGET_LANGUAGE_TRANSLATIONS = {
  en: {
    "American English": "American English",
    "British English": "British English",
    "Australian English": "Australian English",
    "French": "French",
    "German": "German",
    "Italian": "Italian",

    "Spanish — LATAM (Neutral)": "Spanish — LATAM (Neutral)",
    "Spanish — Mexican": "Spanish — Mexican",
    "Spanish — Central American": "Spanish — Central American",
    "Spanish — Caribbean": "Spanish — Caribbean",
    "Spanish — Peruvian": "Spanish — Peruvian",
    "Spanish — Argentine": "Spanish — Argentine",
    "Spanish — Chilean": "Spanish — Chilean",
    "Spanish — General Colombian": "Spanish — General Colombian",
    "Spanish — Venezuelan": "Spanish — Venezuelan",

    "Colombian Spanish — Paisa (Medellín)": "Colombian Spanish — Paisa (Medellín)",
    "Colombian Spanish — Rolo (Bogotá)": "Colombian Spanish — Rolo (Bogotá)",
    "Colombian Spanish — Cali": "Colombian Spanish — Cali",
    "Colombian Spanish — Santander": "Colombian Spanish — Santander",

    "Mexican Spanish": "Spanish — Mexican",
    "LATAM Spanish": "Spanish — LATAM (Neutral)",
    "General Colombian Spanish": "Spanish — General Colombian",
    "Paisa Spanish (Medellín)": "Colombian Spanish — Paisa (Medellín)",
    "Rolo Spanish (Bogotá)": "Colombian Spanish — Rolo (Bogotá)",
    "Cali Spanish": "Colombian Spanish — Cali",
    "Santander Spanish": "Colombian Spanish — Santander",
    "Venezuelan Spanish": "Spanish — Venezuelan",
    "Latin American Spanish (Neutral)": "Spanish — LATAM (Neutral)",
    "Colombian Spanish": "Spanish — General Colombian",

    "Chinese": "Mandarin Chinese",
    "Korean": "Korean",
    "Japanese": "Japanese",
    "Russian": "Russian",
    "Mandarin Chinese": "Mandarin Chinese",

    "English — American": "American English",
    "English — British": "British English",
    "English — Australian": "Australian English",

    "Brazilian Portuguese": "Brazilian Portuguese",
    "European Portuguese": "European Portuguese",
    "Modern Standard Arabic": "Modern Standard Arabic",
    "Egyptian Arabic": "Egyptian Arabic",
    "Iranian Persian — Farsi": "Iranian Persian — Farsi",
    "Afghan Persian — Dari": "Afghan Persian — Dari",
    "Tajik Persian — Tajik": "Tajik Persian — Tajik",
    "Hindi": "Hindi",
    "Indonesian": "Indonesian",
    "Filipino (Tagalog)": "Filipino (Tagalog)",
    "Swahili": "Swahili",
    "Amharic": "Amharic",
    "Turkish": "Turkish"
  },
  es: {
    "American English": "Inglés estadounidense",
    "British English": "Inglés británico",
    "Australian English": "Inglés australiano",
    "French": "Francés",
    "German": "Alemán",
    "Italian": "Italiano",

    "Spanish — LATAM (Neutral)": "Español latinoamericano (neutral)",
    "Spanish — Mexican": "Español mexicano",
    "Spanish — Central American": "Español centroamericano",
    "Spanish — Caribbean": "Español caribeño",
    "Spanish — Peruvian": "Español peruano",
    "Spanish — Argentine": "Español argentino",
    "Spanish — Chilean": "Español chileno",
    "Spanish — General Colombian": "Español colombiano general",
    "Spanish — Venezuelan": "Español venezolano",

    "Colombian Spanish — Paisa (Medellín)": "Español colombiano — Paisa (Medellín)",
    "Colombian Spanish — Rolo (Bogotá)": "Español colombiano — Rolo (Bogotá)",
    "Colombian Spanish — Cali": "Español colombiano — Cali",
    "Colombian Spanish — Santander": "Español colombiano — Santander",

    "Mexican Spanish": "Español mexicano",
    "LATAM Spanish": "Español latinoamericano",
    "General Colombian Spanish": "Español colombiano general",
    "Paisa Spanish (Medellín)": "Español colombiano — Paisa (Medellín)",
    "Rolo Spanish (Bogotá)": "Español colombiano — Rolo (Bogotá)",
    "Cali Spanish": "Español colombiano — Cali",
    "Santander Spanish": "Español colombiano — Santander",
    "Venezuelan Spanish": "Español venezolano",
    "Latin American Spanish (Neutral)": "Español latinoamericano (neutral)",
    "Colombian Spanish": "Español colombiano general",

    "Chinese": "Chino",
    "Korean": "Coreano",
    "Japanese": "Japonés",
    "Russian": "Ruso",
    "Mandarin Chinese": "Chino mandarín",

    "English — American": "Inglés estadounidense",
    "English — British": "Inglés británico",
    "English — Australian": "Inglés australiano",

    "Brazilian Portuguese": "Portugués brasileño",
    "European Portuguese": "Portugués europeo",
    "Modern Standard Arabic": "Árabe estándar moderno",
    "Egyptian Arabic": "Árabe egipcio",
    "Iranian Persian — Farsi": "Persa iraní — Farsi",
    "Afghan Persian — Dari": "Persa afgano — Dari",
    "Tajik Persian — Tajik": "Persa tayiko — Tayiko",
    "Hindi": "Hindi",
    "Indonesian": "Indonesio",
    "Filipino (Tagalog)": "Filipino (Tagalo)",
    "Swahili": "Suajili",
    "Amharic": "Amhárico",
    "Turkish": "Turco"
  }
};

const languageCatalog = [
  { label: "American English", aliases: ["English", "English — American"] },
  { label: "British English", aliases: ["English — British"] },
  { label: "Australian English", aliases: ["English — Australian"] },

  { label: "Spanish — LATAM (Neutral)", aliases: ["Spanish", "LATAM Spanish", "Latin American Spanish", "Latin American Spanish (Neutral)"] },
  { label: "Spanish — Mexican", aliases: ["Mexican Spanish"] },
  { label: "Spanish — Central American", aliases: ["Central American Spanish"] },
  { label: "Spanish — Caribbean", aliases: ["Caribbean Spanish"] },
  { label: "Spanish — Peruvian", aliases: ["Peruvian Spanish"] },
  { label: "Spanish — Argentine", aliases: ["Argentine Spanish"] },
  { label: "Spanish — Chilean", aliases: ["Chilean Spanish"] },

  { label: "Spanish — General Colombian", aliases: ["General Colombian Spanish", "Colombian Spanish"] },
  { label: "Colombian Spanish — Paisa (Medellín)", aliases: ["Paisa Spanish (Medellín)", "Spanish — Paisa (Medellín)", "Paisa Colombian Spanish", "Medellín Spanish"] },
  { label: "Colombian Spanish — Rolo (Bogotá)", aliases: ["Rolo Spanish (Bogotá)", "Spanish — Rolo (Bogotá)", "Bogotá Spanish"] },
  { label: "Colombian Spanish — Cali", aliases: ["Cali Spanish", "Spanish — Cali"] },
  { label: "Colombian Spanish — Santander", aliases: ["Santander Spanish", "Spanish — Santander"] },
  { label: "Spanish — Venezuelan", aliases: ["Venezuelan Spanish"] },

  { label: "French", aliases: [] },
  { label: "German", aliases: [] },
  { label: "Italian", aliases: [] },

  { label: "Brazilian Portuguese", aliases: [] },
  { label: "European Portuguese", aliases: [] },

  { label: "Modern Standard Arabic", aliases: ["Arabic"] },
  { label: "Egyptian Arabic", aliases: [] },

  { label: "Iranian Persian — Farsi", aliases: ["Farsi", "Persian"] },
  { label: "Afghan Persian — Dari", aliases: ["Dari"] },
  { label: "Tajik Persian — Tajik", aliases: ["Tajik"] },

  { label: "Hindi", aliases: [] },
  { label: "Indonesian", aliases: [] },
  { label: "Filipino (Tagalog)", aliases: ["Tagalog"] },
  { label: "Swahili", aliases: [] },
  { label: "Amharic", aliases: [] },
  { label: "Turkish", aliases: [] },

  { label: "Mandarin Chinese", aliases: ["Chinese"] },
  { label: "Korean", aliases: [] },
  { label: "Japanese", aliases: [] },
  { label: "Russian", aliases: [] }
];

function el(id) {
  return document.getElementById(id);
}

function isSpanishUI() {
  return (el("siteLanguage")?.value || "en").startsWith("es");
}

function localizeLanguageLabel(label) {
  const lang = isSpanishUI() ? "es" : "en";
  return TARGET_LANGUAGE_TRANSLATIONS[lang][label] || label;
}

function safeTextById(id, value) {
  const node = el(id);
  if (node) node.innerText = value;
}

function safeTextBySelector(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.innerText = value;
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}

function sanitizeForSpeech(text) {
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/[.,;:!?()"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePronunciationStyle(text) {
  return (text || "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function updateAdditionalInfo(text) {
  const box = el("additionalInfo");
  const section = el("additionalInfoSection");
  if (!box || !section) return;

  const value = (text || "").trim();

  if (value) {
    box.value = value;
    section.classList.remove("hidden");
  } else {
    box.value = "";
    section.classList.add("hidden");
  }
}

function setDetectedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;
  display.innerText =
    (isSpanishUI() ? "Idioma detectado: " : "Detected language: ") +
        localizeLanguageLabel(label);
}

function setConfirmedDisplay(label) {
  const display = el("detectedLanguageDialect");
  if (!display) return;

  if (confirmationMode === "chosen") {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada elegido: " : "Input language chosen: ") +
      localizeLanguageLabel(label);
  } else {
    display.innerText =
      (isSpanishUI() ? "Idioma de entrada detectado: " : "Input language detected: ") +
      localizeLanguageLabel(label);
  }
}

function styleConfirmationRow() {
  const keepBtn = el("keepDetectedButton");
  const changeBtn = el("changeDetectedButton");
  const row = document.querySelector(".detectedButtons");
  const card = el("detectedCard");
  if (!keepBtn || !changeBtn || !row || !card) return;

  row.style.display = "flex";
  row.style.width = "100%";
  row.style.alignItems = "center";

   if (confirmedInputLanguage) {
    card.classList.add("confirmed");
    keepBtn.classList.add("hidden");
    row.style.justifyContent = "flex-end";
    row.style.gap = "10px";
    row.style.marginTop = "0";
    changeBtn.style.padding = "6px 12px";
    changeBtn.style.fontSize = "12px";
    changeBtn.style.lineHeight = "1.2";
    changeBtn.style.background = "#6b7280";
    changeBtn.style.color = "white";
    changeBtn.style.borderRadius = "8px";
    card.style.paddingTop = "10px";
    card.style.paddingBottom = "10px";
  } else {
    card.classList.remove("confirmed");
    keepBtn.classList.remove("hidden");
    row.style.justifyContent = "flex-start";
    row.style.gap = "10px";
    row.style.marginTop = "10px";
    changeBtn.style.padding = "";
    changeBtn.style.fontSize = "";
    changeBtn.style.lineHeight = "";
    changeBtn.style.background = "";
    changeBtn.style.color = "";
    changeBtn.style.borderRadius = "";
    card.style.paddingTop = "";
    card.style.paddingBottom = "";
  }
}

function updateTranslateState() {
  const button = el("translateButton");
  if (!button) return;

  const hasInput = !!el("userInput")?.value.trim();
  const hasConfirmedLanguage = !!confirmedInputLanguage;
  const hasTarget = !!targetSelection?.label;

  button.disabled = !(hasInput && hasConfirmedLanguage && hasTarget);
}

function resetConfirmedLanguage() {
  confirmedInputLanguage = null;
  confirmationMode = null;

  el("changeDetectedWrap")?.classList.add("hidden");

  if (el("detectedSearch")) el("detectedSearch").value = "";
  if (el("pronunciation")) el("pronunciation").value = "";
  if (el("pronToggle")) el("pronToggle").checked = false;
  el("pronunciationSection")?.classList.add("hidden");

 updateAdditionalInfo("");
  styleConfirmationRow();
  updateTranslateState();
  updatePronunciationAvailability();
}

function updatePronunciationAvailability() {
  const source = (confirmedInputLanguage || "").toLowerCase();
  const target = (targetSelection?.label || "").toLowerCase();

  const section = el("pronunciationSection");
  const toggleWrap = el("pronToggle")?.closest(".toggleRow");
  const box = el("pronunciation");
  const header = document.querySelector(".translationHeader");
  const unavailableId = "pronunciationUnavailableMessage";

  if (!section || !toggleWrap || !box || !header) return;

  if (!source || !target) {
    section.classList.add("hidden");
    toggleWrap.classList.add("hidden");
    box.value = "";
    if (el("pronToggle")) el("pronToggle").checked = false;

    const existingMsg = document.getElementById("pronunciationUnavailableMessage");
    if (existingMsg) existingMsg.remove();
    return;
  }

  const isEnglishSpanish =
    (source.includes("english") && target.includes("spanish")) ||
    (source.includes("spanish") && target.includes("english"));

  const isSameLanguage =
    (source.includes("english") && target.includes("english")) ||
    (source.includes("spanish") && target.includes("spanish"));

  let msg = document.getElementById(unavailableId);

  // SAME LANGUAGE: show nothing at all
  if (isSameLanguage) {
    section.classList.add("hidden");
    toggleWrap.classList.add("hidden");
    box.value = "";
    if (el("pronToggle")) el("pronToggle").checked = false;
    if (msg) msg.remove();
    return;
  }

  // ENGLISH ↔ SPANISH: normal pronunciation flow
  if (isEnglishSpanish) {
    toggleWrap.classList.remove("hidden");
    if (msg) msg.remove();

    if (el("pronToggle")?.checked) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
    return;
  }

  // ALL OTHER PAIRS: hide pronunciation UI, show only small message by Translation
  section.classList.add("hidden");
  toggleWrap.classList.add("hidden");
  box.value = "";
  if (el("pronToggle")) el("pronToggle").checked = false;

  if (!msg) {
    msg = document.createElement("span");
    msg.id = unavailableId;
    msg.style.fontSize = "14px";
    msg.style.fontWeight = "600";
    msg.style.color = "#d1d5db";
    msg.style.marginLeft = "12px";
    header.appendChild(msg);
  }

  msg.innerText = isSpanishUI()
    ? "La pronunciación aún no está disponible para este par de idiomas."
    : "Pronunciation not available for this language pair yet.";
}

function togglePronunciation() {
  const checked = !!el("pronToggle")?.checked;
  const source = (confirmedInputLanguage || "").toLowerCase();
  const target = (targetSelection?.label || "").toLowerCase();
  const section = el("pronunciationSection");

  if (!section) return;

  const isEnglishSpanish =
    (source.includes("english") && target.includes("spanish")) ||
    (source.includes("spanish") && target.includes("english"));

  const isSameLanguage =
    (source.includes("english") && target.includes("english")) ||
    (source.includes("spanish") && target.includes("spanish"));

  updatePronunciationAvailability();

  if (isSameLanguage) {
    section.classList.add("hidden");
    return;
  }

  if (!isEnglishSpanish) {
    section.classList.add("hidden");
    return;
  }

  section.classList.toggle("hidden", !checked);
}

function scoreLanguageMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findMatches(value) {
  const q = normalize(value);

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog
    .map(item => ({ item, score: scoreLanguageMatch(item, q) }))
    .filter(row => row.score < 9999)
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label))
    .map(row => row.item)
    .slice(0, 12);
}
function closeSuggestions(container, type) {
  if (!container) return;
  container.style.display = "none";

  if (type === "target") {
    targetMatches = [];
    targetActiveIndex = -1;
  } else {
    detectedMatches = [];
    detectedActiveIndex = -1;
  }
}

function highlightActive(container, type) {
  const items = container.querySelectorAll(".suggestionItem");
  const activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((item, i) => {
    item.classList.toggle("activeSuggestion", i === activeIndex);
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function renderSuggestions(container, matches, onPick, type) {
  if (!container) return;
  container.innerHTML = "";

  if (!matches.length) {
    closeSuggestions(container, type);
    return;
  }

  if (type === "target") {
    targetMatches = matches;
    targetActiveIndex = -1;
  } else {
    detectedMatches = matches;
    detectedActiveIndex = -1;
  }

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = localizeLanguageLabel(item.label);

    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(item);
      closeSuggestions(container, type);
    });

    container.appendChild(div);
  });

  container.style.display = "block";
}

function setupSearch(inputId, suggestionId, onPick, type) {
  const input = el(inputId);
    const box = el(suggestionId);
  if (!input || !box) return;

  input.addEventListener("focus", () => {
    input.value = "";
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("click", () => {
    input.value = "";
    renderSuggestions(box, findMatches(""), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      closeSuggestions(box, type);

      if (type === "target" && !input.value.trim() && targetSelection) {
        input.value = localizeLanguageLabel(targetSelection.label);
      }

      if (type === "detected") {
        if (!input.value.trim() && confirmedInputLanguage) {
          input.value = localizeLanguageLabel(confirmedInputLanguage);
        } else if (!input.value.trim() && detectedSelection) {
          input.value = localizeLanguageLabel(detectedSelection.label);
        }
      }
    }, 120);
  });

  input.addEventListener("keydown", (e) => {
    let matches = type === "target" ? targetMatches : detectedMatches;
    let activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (!matches.length) {
        renderSuggestions(box, findMatches(input.value), onPick, type);
        matches = type === "target" ? targetMatches : detectedMatches;
        if (!matches.length) return;
      }

      activeIndex = (activeIndex + 1) % matches.length;
      if (type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;

      highlightActive(box, type);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!matches.length) return;

      activeIndex = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
      if (type === "target") targetActiveIndex = activeIndex;
      else detectedActiveIndex = activeIndex;

      highlightActive(box, type);
    }

    if (e.key === "Enter") {
      const idx = type === "target" ? targetActiveIndex : detectedActiveIndex;
      const currentMatches = type === "target" ? targetMatches : detectedMatches;

      if (currentMatches[idx]) {
        e.preventDefault();
        onPick(currentMatches[idx]);
        closeSuggestions(box, type);
      }
    }

    if (e.key === "Escape" || e.key === "Tab") {
      closeSuggestions(box, type);
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      closeSuggestions(box, type);
    }
  });
}

function detectInput(text) {
  const lower = normalize(text);
  const tokens = tokenize(text);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("fag") ||
    lower.includes("bloody") ||
    lower.includes("cheers") ||
    lower.includes("knackered") ||
    lower.includes("loo") ||
    lower.includes("uni") ||
    lower.includes("flat") ||
    lower.includes("lift") ||
    lower.includes("holiday") ||
    lower.includes("mum") ||
    lower.includes("petrol")
  ) {
    return { label: "British English" };
  }

  if (
    lower.includes("arvo") ||
    lower.includes("brekkie") ||
    lower.includes("servo") ||
    lower.includes("no worries")
  ) {
    return { label: "Australian English" };
  }

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (
    lower.includes("orale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { label: "Spanish — Mexican" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
       if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  if (tokens.length < 2 && lower.length < 6) {
    return null;
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = el("userInput")?.value.trim() || "";
  const card = el("detectedCard");

  resetConfirmedLanguage();

  if (!text) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  const detected = detectInput(text);

  if (!detected) {
    detectedSelection = null;
    card?.classList.add("hidden");
    return;
  }

  detectedSelection = detected;
  setDetectedDisplay(detectedSelection.label);
  card?.classList.remove("hidden");
  styleConfirmationRow();
}

function keepDetected() {
  if (!detectedSelection) return;

  confirmedInputLanguage = detectedSelection.label;
  confirmationMode = "detected";
  setConfirmedDisplay(confirmedInputLanguage);
  el("changeDetectedWrap")?.classList.add("hidden");
  styleConfirmationRow();
  updateTranslateState();
  togglePronunciation();
}
  
function toggleDetectedChange() {
  const wrap = el("changeDetectedWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    const input = el("detectedSearch");
    if (input) {
      input.focus();
      renderSuggestions(el("detectedSuggestions"), findMatches(""), (item) => {
        confirmedInputLanguage = item.label;
        confirmationMode = "chosen";
        detectedSelection = { label: item.label };
        input.value = localizeLanguageLabel(item.label);
        wrap.classList.add("hidden");
        setConfirmedDisplay(item.label);
        styleConfirmationRow();
        updateTranslateState();
        togglePronunciation();
      }, "detected");
    }
  }
}
    
function englishPronunciationForSpanishReader(text) {
  const specialWords = {
    "how": "jau",
    "are": "ar",
    "you": "yu",
    "hello": "jelou",
    "friend": "frend",
    "weather": "ueder",
    "today": "tudei",
    "what": "uat",
    "is": "is",
    "the": "de"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
            const clean = normalize(word).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/tion/g, "shon")
        .replace(/sion/g, "shon")
        .replace(/ough/g, "ou")
        .replace(/augh/g, "au")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/ph/g, "f")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/ea/g, "i");
    })
    .filter(Boolean)
    .join(" ");
}

function spanishPronunciationForEnglishReader(text) {
  const specialWords = {
    "hola": "oh-LAH",
    "parcero": "par-SEH-roh",
    "gracias": "GRAH-syahs",
    "donde": "DOHN-deh",
    "esta": "ehs-TAH",
    "el": "ehl",
    "bano": "BAHN-yoh",
    "necesito": "neh-seh-SEE-toh",
    "hablar": "ah-BLAR",
    "contigo": "kohn-TEE-goh",
    "como": "KOH-moh",
    "estas": "ehs-TAHS",
    "clima": "KLEE-mah",
    "hoy": "oy",
    "puedo": "pweh-DOH",
    "tener": "teh-NEHR",
    "una": "oo-nah",
    "mejora": "meh-HOH-rah"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const raw = word.replace(/[^\p{L}]/gu, "");
      const clean = normalize(raw).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      let out = clean
        .replace(/que/g, "keh")
        .replace(/qui/g, "kee")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/ll/g, "y")
        .replace(/ñ/g, "ny")
        .replace(/ch/g, "ch")
        .replace(/j/g, "h")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");

      out = out
        .replace(/([a-z]{2,})(ah|eh|ee|oh|oo)/gi, "$1-$2")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      return out;
    })
    .filter(Boolean)
    .join(" ");
}
function buildPronunciation(translatedText, sourceLanguage, targetLanguage) {
  if (!translatedText) return "";

  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(translatedText);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return ""; 
}

async function translateText() {
  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? "Confirma primero el idioma detectado." : "Please confirm the detected language first.");
    return;
  }

  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection?.label || "";

  if (!input || !target) {
    alert(isSpanishUI() ? "Escribe texto y elige un idioma." : "Enter text and choose a language.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target,
        targetLanguage: target,
        sourceLanguage: confirmedInputLanguage,
        contextAudience: el("contextAudience")?.value || "",
        contextTone: el("contextTone")?.value || "",
        contextSituation: el("contextSituation")?.value || "",
        enhancedContextMode: !!el("contextToggle")?.checked
      })
    });

    const data = await response.json();
    console.log("API response:", data);

    const translated = data.output || "";
    const additionalInfo =
      data.additional_information ||
      data.additionalInfo ||
      data.context_note ||
      data.usage_note ||
      data.additionalNotes ||
      "";

    if (el("output")) el("output").value = translated;

    if (el("pronunciation")) {
      const rawPronunciation = buildPronunciation(translated, confirmedInputLanguage, target);
      el("pronunciation").value = normalizePronunciationStyle(rawPronunciation);
    }

    updatePronunciationAvailability();
    updateAdditionalInfo(additionalInfo);
  } catch (err) {
    if (el("output")) el("output").value = "Network error";
    if (el("pronunciation")) el("pronunciation").value = "";
    updatePronunciationAvailability();
    updateAdditionalInfo("");
  }
}

function updateAdditionalInfo(additionalInfo) {
  const section = document.getElementById("additionalInfoSection");
  const box = document.getElementById("additionalInfo");

  if (!section || !box) return;

  if (additionalInfo && additionalInfo.trim() !== "") {
    box.value = additionalInfo;
    section.classList.remove("hidden");
  } else {
    section.classList.add("hidden");
    box.value = "";
  }
}

function copyTranslation() {
  const box = el("output");
  if (!box) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(box.value).catch(() => {});
  } else {
    box.select();
    document.execCommand("copy");
  }
}

function speak(rate) {
  const pronunciationText = sanitizeForSpeech(el("pronunciation")?.value || "");
  const translationText = sanitizeForSpeech(el("output")?.value || "");
  const text = pronunciationText || translationText;

  if (!text) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");

  const btn = el("darkModeButton");
  if (btn) {
    btn.innerText = isDark
      ? (isSpanishUI() ? "🌙 Oscuro" : "🌙 Dark")
      : (isSpanishUI() ? "☀️ Claro" : "☀️ Light");
  }
}

function applySiteLanguage(lang) {
  const isSpanish = lang.startsWith("es");

  if (isSpanish) {
    safeTextBySelector('label[for="siteLanguage"]', "Idioma del sitio");
    safeTextBySelector("h1", "Traductor Intercultural™");
    safeTextBySelector(".subtitle", "Más que traducción — comunicación intercultural real");
    safeTextBySelector(".description", "Traducción con sensibilidad dialectal, guía de pronunciación y claridad cultural");
    safeTextById("inputLabel", "Texto de entrada");
    safeTextById("keepDetectedButton", "Mantener");
    safeTextById("changeDetectedButton", "Cambiar");
    safeTextBySelector('label[for="detectedSearch"]', "Cambiar idioma de entrada a:");
    safeTextBySelector('label[for="targetSearch"]', "Traducir a");
    safeTextById("translateButton", "Traducir");
    safeTextBySelector('label[for="output"]', "Traducción");
    safeTextById("copyButton", "Copiar");
    safeTextById("pronToggleLabel", "Mostrar pronunciación");
    safeTextBySelector('label[for="pronunciation"]', "Guía de pronunciación");
    safeTextBySelector('label[for="additionalInfo"]', "Información adicional");
    safeTextById("speakNormal", "Hablar normal");
    safeTextById("speakSlow", "Hablar lento");
  } else {
    safeTextBySelector('label[for="siteLanguage"]', "Site Language");
    safeTextBySelector("h1", "Cross-Cultural Translator™");
    safeTextBySelector(".subtitle", "Beyond translation — real cross-cultural communication");
    safeTextBySelector(".description", "Dialect-aware translation, pronunciation guidance, and cultural clarity");
    safeTextById("inputLabel", "Input Text");
    safeTextById("keepDetectedButton", "Keep");
    safeTextById("changeDetectedButton", "Change");
    safeTextBySelector('label[for="detectedSearch"]', "Change input language to:");
    safeTextBySelector('label[for="targetSearch"]', "Translate To");
    safeTextById("translateButton", "Translate");
    safeTextBySelector('label[for="output"]', "Translation");
    safeTextById("copyButton", "Copy");
    safeTextById("pronToggleLabel", "Show Pronunciation");
    safeTextBySelector('label[for="pronunciation"]', "Pronunciation Guide");
    safeTextBySelector('label[for="additionalInfo"]', "Additional Information");
    safeTextById("speakNormal", "Speak Normally");
    safeTextById("speakSlow", "Speak Slowly");
  }

  const btn = el("darkModeButton");
  if (btn) {
    const isDark = document.body.classList.contains("dark");
    btn.innerText = isDark
      ? (isSpanish ? "🌙 Oscuro" : "🌙 Dark")
      : (isSpanish ? "☀️ Claro" : "☀️ Light");
  }

  if (targetSelection && el("targetSearch")) {
    el("targetSearch").value = localizeLanguageLabel(targetSelection.label);
  }

  if (confirmedInputLanguage) {
    setConfirmedDisplay(confirmedInputLanguage);
  } else if (detectedSelection) {
    setDetectedDisplay(detectedSelection.label);
  }

  styleConfirmationRow();
  updatePronunciationAvailability();

  const footer = document.querySelector("footer");
  if (footer) {
    footer.innerHTML = isSpanish
      ? `<strong>Traductor Intercultural™</strong>
Más que traducción — comunicación intercultural real<br>
Traducción con sensibilidad dialectal • Guía de pronunciación • Claridad cultural<br>
© 2026 CCTLA-TBD, LLC<br>
Patente pendiente.`
      : `<strong>Cross-Cultural Translator™</strong>
Beyond translation — real cross-cultural communication<br>
Dialect-aware translation • Pronunciation guidance • Cultural clarity<br>
© 2026 CCTLA-TBD, LLC<br>
Patent pending.`;
  }

  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  const isDark = localStorage.getItem("darkMode") === "on";

  if (isDark) {
    document.body.classList.add("dark");
  }

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applySiteLanguage(e.target.value));
  }

  applySiteLanguage(savedLang);

  el("userInput")?.addEventListener("input", updateDetection);
  el("keepDetectedButton")?.addEventListener("click", keepDetected);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("pronToggle")?.addEventListener("change", togglePronunciation);
  el("speakNormal")?.addEventListener("click", () => speak(.70));
  el("speakSlow")?.addEventListener("click", () => speak(0.2));

  const contextToggle = el("contextToggle");

  if (contextToggle) {
    el("contextSection")?.classList.toggle("hidden", !contextToggle.checked);

    contextToggle.addEventListener("change", (e) => {
      el("contextSection")?.classList.toggle("hidden", !e.target.checked);
    });
  }
  
  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    el("targetSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("targetSuggestions"), "target");
    updateTranslateState();
    togglePronunciation();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    confirmedInputLanguage = item.label;
    confirmationMode = "chosen";
    detectedSelection = { label: item.label };
    el("detectedSearch").value = localizeLanguageLabel(item.label);
    closeSuggestions(el("detectedSuggestions"), "detected");
    el("changeDetectedWrap")?.classList.add("hidden");
    setConfirmedDisplay(item.label);
    styleConfirmationRow();
    updateTranslateState();
    togglePronunciation();
  }, "detected");

if (el("translateButton")) el("translateButton").disabled = true;
if (el("pronunciationSection")) el("pronunciationSection").classList.add("hidden");
if (el("additionalInfoSection")) el("additionalInfoSection").classList.add("hidden");
styleConfirmationRow();
updatePronunciationAvailability();
registerPeriodicSync();
});

async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported in this browser.');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    console.log('Notification permission not granted.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY_HERE'
  });

  console.log('Push subscription:', JSON.stringify(subscription));
}

async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if ('sync' in registration) {
    await registration.sync.register('retry-translation-request');
    console.log('Background sync registered.');
  } else {
    console.log('Background sync not supported.');
  }
}

async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if ('periodicSync' in registration) {
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync'
      });

      if (status.state === 'granted') {
        await registration.periodicSync.register('refresh-language-data', {
          minInterval: 24 * 60 * 60 * 1000
        });

        console.log('Periodic background sync registered.');
      } else {
        console.log('Periodic background sync permission not granted.');
      }
    } catch (error) {
      console.log('Periodic background sync failed:', error);
    }
  } else {
    console.log('Periodic background sync not supported.');
  }
}const contextOutput = document.getElementById("contextOutput");

const additionalInfoSection = document.getElementById("additionalInfoSection");
const additionalInfo = document.getElementById("additionalInfo");

// === STATE ===
let detectedSelection = null;
let confirmedInputLanguage = null;
let targetMatches = [];
let targetActiveIndex = -1;

// === LANGUAGE CATALOG ===
const targetCatalog = [
  { label: "American English", aliases: ["english", "en", "english american"] },
  { label: "British English", aliases: ["english british"] },
  { label: "Australian English", aliases: ["english australian"] },

  { label: "Spanish — LATAM (Neutral)", aliases: ["spanish", "espanol", "español", "es", "latam", "latam spanish", "latin american spanish"] },
  { label: "Spanish — Mexican", aliases: ["mexican spanish"] },
  { label: "Spanish — Central American", aliases: ["central american spanish"] },
  { label: "Spanish — Caribbean", aliases: ["caribbean spanish"] },
  { label: "Spanish — Peruvian", aliases: ["peruvian spanish"] },
  { label: "Spanish — Argentine", aliases: ["argentine spanish"] },
  { label: "Spanish — Chilean", aliases: ["chilean spanish"] },
  { label: "Spanish — General Colombian", aliases: ["general colombian spanish", "colombian spanish"] },
  { label: "Spanish — Venezuelan", aliases: ["venezuelan spanish"] },

  { label: "Colombian Spanish — Paisa (Medellín)", aliases: ["paisa", "paisa spanish", "paisa spanish medellin", "medellin spanish"] },
  { label: "Colombian Spanish — Rolo (Bogotá)", aliases: ["rolo", "rolo spanish", "bogota spanish"] },
  { label: "Colombian Spanish — Cali", aliases: ["cali", "cali spanish"] },
  { label: "Colombian Spanish — Santander", aliases: ["santander", "santander spanish"] },

  { label: "French", aliases: ["francais", "français", "fr"] },
  { label: "German", aliases: ["deutsch", "de"] },
  { label: "Italian", aliases: ["italiano", "it"] },

  { label: "Brazilian Portuguese", aliases: ["portuguese brazil", "brazilian portuguese"] },
  { label: "European Portuguese", aliases: ["portuguese portugal", "european portuguese"] },

  { label: "Modern Standard Arabic", aliases: ["arabic", "msa", "modern standard arabic"] },
  { label: "Egyptian Arabic", aliases: ["egyptian arabic"] },

  { label: "Iranian Persian — Farsi", aliases: ["farsi", "persian"] },
  { label: "Afghan Persian — Dari", aliases: ["dari"] },
  { label: "Tajik Persian — Tajik", aliases: ["tajik"] },

  { label: "Hindi", aliases: ["hi"] },
  { label: "Indonesian", aliases: ["id"] },
  { label: "Filipino (Tagalog)", aliases: ["filipino", "tagalog", "tl"] },
  { label: "Swahili", aliases: ["sw"] },
  { label: "Amharic", aliases: ["am"] },
  { label: "Turkish", aliases: ["tr"] },
  { label: "Russian", aliases: ["ru"] },
  { label: "Japanese", aliases: ["ja"] },
  { label: "Korean", aliases: ["ko"] },
  { label: "Mandarin Chinese", aliases: ["chinese", "zh", "mandarin"] }
];

// === HELPERS ===
function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/[\s—()\/,.:;!?-]+/)
    .filter(Boolean);
}

function showElement(el, displayValue = "block") {
  if (!el) return;
  el.classList.remove("hidden");
  el.hidden = false;
  el.style.display = displayValue;
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.hidden = true;
  el.style.display = "none";
}

function setTextareaValue(el, value) {
  if (!el) return;
  el.value = value || "";
}

function clearSuggestions(el) {
  if (!el) return;
  el.innerHTML = "";
  hideElement(el);
}

function setSectionDisabled(section, disabled) {
  if (!section) return;
  const controls = section.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function isSpanishUI() {
  return (siteLanguage?.value || "en") === "es";
}

function sanitizeForSpeech(text) {
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/[.,;:!?()"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePronunciationStyle(text) {
  return (text || "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function setAdditionalInfo(text) {
  const clean = (text || "").trim();
  additionalInfo.value = clean;

  if (clean) {
    showElement(additionalInfoSection, "flex");
  } else {
    hideElement(additionalInfoSection);
  }
}

function clearResults() {
  output.value = "";
  contextOutput.value = "";
  pronunciation.value = "";
  additionalInfo.value = "";

  hideElement(contextOutputSection);
  hideElement(pronunciationSection);
  hideElement(additionalInfoSection);
}

function updateTranslateButtonState() {
  const hasInput = !!(userInput?.value || "").trim();
  const hasTarget = !!(targetSearch?.value || "").trim();
  const hasDetected = !!confirmedInputLanguage;

  if (translateButton) {
    translateButton.disabled = !(hasInput && hasTarget && hasDetected);
  }
}

// === TARGET SEARCH ===
function scoreTargetMatch(item, query) {
  const q = normalize(query);
  if (!q) return 1000;

  const label = normalize(item.label);
  const aliases = (item.aliases || []).map(normalize);

  if (label === q) return 0;
  if (aliases.includes(q)) return 1;
  if (label.startsWith(q)) return 2;

  for (const alias of aliases) {
    if (alias.startsWith(q)) return 3;
  }

  for (const word of tokenize(item.label)) {
    if (word.startsWith(q)) return 4;
  }

  for (const alias of aliases) {
    for (const word of tokenize(alias)) {
      if (word.startsWith(q)) return 5;
    }
  }

  if (label.includes(q)) return 6;

  for (const alias of aliases) {
    if (alias.includes(q)) return 7;
  }

  return 9999;
}

function findTargetMatches(value) {
  const q = normalize(value);

  if (!q) return targetCatalog.slice(0, 12);

  return targetCatalog
    .map((item) => ({ item, score: scoreTargetMatch(item, q) }))
    .filter((row) => row.score < 9999)
    .sort((a, b) => (a.score !== b.score ? a.score - b.score : a.item.label.localeCompare(b.item.label)))
    .map((row) => row.item)
    .slice(0, 12);
}

function renderTargetSuggestions(matches) {
  if (!targetSuggestions) return;

  targetSuggestions.innerHTML = "";

  if (!matches.length) {
    clearSuggestions(targetSuggestions);
    return;
  }

  targetMatches = matches;
  targetActiveIndex = -1;

  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.textContent = item.label;

    div.addEventListener("mousedown", (event) => {
      event.preventDefault();
      targetSearch.value = item.label;
      clearSuggestions(targetSuggestions);
      updateTranslateButtonState();
    });

    targetSuggestions.appendChild(div);
  });

  showElement(targetSuggestions, "block");
}

function highlightTargetSuggestion() {
  const items = targetSuggestions?.querySelectorAll(".suggestionItem") || [];
  items.forEach((item, index) => {
    item.classList.toggle("activeSuggestion", index === targetActiveIndex);
  });

  if (targetActiveIndex >= 0 && items[targetActiveIndex]) {
    items[targetActiveIndex].scrollIntoView({ block: "nearest" });
  }
}

function initTargetSuggestions() {
  if (!targetSearch) return;

  targetSearch.addEventListener("focus", () => {
    renderTargetSuggestions(findTargetMatches(targetSearch.value));
  });

  targetSearch.addEventListener("click", () => {
    renderTargetSuggestions(findTargetMatches(targetSearch.value));
  });

  targetSearch.addEventListener("input", () => {
    renderTargetSuggestions(findTargetMatches(targetSearch.value));
    updateTranslateButtonState();
  });

  targetSearch.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!targetMatches.length) {
        renderTargetSuggestions(findTargetMatches(targetSearch.value));
      }
      if (!targetMatches.length) return;
      targetActiveIndex = (targetActiveIndex + 1) % targetMatches.length;
      highlightTargetSuggestion();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!targetMatches.length) return;
      targetActiveIndex = targetActiveIndex <= 0 ? targetMatches.length - 1 : targetActiveIndex - 1;
      highlightTargetSuggestion();
    }

    if (event.key === "Enter") {
      if (targetMatches[targetActiveIndex]) {
        event.preventDefault();
        targetSearch.value = targetMatches[targetActiveIndex].label;
        clearSuggestions(targetSuggestions);
        updateTranslateButtonState();
      }
    }

    if (event.key === "Escape") {
      clearSuggestions(targetSuggestions);
    }
  });

  targetSearch.addEventListener("blur", () => {
    setTimeout(() => clearSuggestions(targetSuggestions), 120);
  });
}

// === TARGET LANGUAGE / DIALECT MAPPING ===
function getTargetConfig(raw) {
  const value = normalize(raw);

  const map = {
    english: { targetLanguage: "English", dialect: "American English" },
    en: { targetLanguage: "English", dialect: "American English" },
    "american english": { targetLanguage: "English", dialect: "American English" },
    "british english": { targetLanguage: "English", dialect: "British English" },
    "australian english": { targetLanguage: "English", dialect: "Australian English" },

    spanish: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    es: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    espanol: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    español: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    latam: { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latam spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "latin american spanish": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },
    "spanish — latam (neutral)": { targetLanguage: "Spanish", dialect: "Spanish — LATAM (Neutral)" },

    "spanish — mexican": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "mexican spanish": { targetLanguage: "Spanish", dialect: "Spanish — Mexican" },
    "spanish — central american": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "central american spanish": { targetLanguage: "Spanish", dialect: "Spanish — Central American" },
    "spanish — caribbean": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "caribbean spanish": { targetLanguage: "Spanish", dialect: "Spanish — Caribbean" },
    "spanish — peruvian": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "peruvian spanish": { targetLanguage: "Spanish", dialect: "Spanish — Peruvian" },
    "spanish — argentine": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "argentine spanish": { targetLanguage: "Spanish", dialect: "Spanish — Argentine" },
    "spanish — chilean": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "chilean spanish": { targetLanguage: "Spanish", dialect: "Spanish — Chilean" },
    "spanish — general colombian": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "general colombian spanish": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "colombian spanish": { targetLanguage: "Spanish", dialect: "Spanish — General Colombian" },
    "spanish — venezuelan": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },
    "venezuelan spanish": { targetLanguage: "Spanish", dialect: "Spanish — Venezuelan" },

    "colombian spanish — paisa (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "paisa spanish (medellin)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    "medellin spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },
    paisa: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Paisa (Medellín)" },

    "colombian spanish — rolo (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "rolo spanish (bogota)": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    "bogota spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },
    rolo: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Rolo (Bogotá)" },

    "colombian spanish — cali": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    "cali spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },
    cali: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Cali" },

    "colombian spanish — santander": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    "santander spanish": { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },
    santander: { targetLanguage: "Spanish", dialect: "Colombian Spanish — Santander" },

    french: { targetLanguage: "French", dialect: "Standard" },
    german: { targetLanguage: "German", dialect: "Standard" },
    italian: { targetLanguage: "Italian", dialect: "Standard" },

    portuguese: { targetLanguage: "Portuguese", dialect: "Standard" },
    "brazilian portuguese": { targetLanguage: "Portuguese", dialect: "Brazilian Portuguese" },
    "european portuguese": { targetLanguage: "Portuguese", dialect: "European Portuguese" },

    arabic: { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "modern standard arabic": { targetLanguage: "Arabic", dialect: "Modern Standard Arabic" },
    "egyptian arabic": { targetLanguage: "Arabic", dialect: "Egyptian Arabic" },

    farsi: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    persian: { targetLanguage: "Persian", dialect: "Iranian Persian — Farsi" },
    dari: { targetLanguage: "Persian", dialect: "Afghan Persian — Dari" },
    tajik: { targetLanguage: "Persian", dialect: "Tajik Persian — Tajik" },

    hindi: { targetLanguage: "Hindi", dialect: "Standard" },
    indonesian: { targetLanguage: "Indonesian", dialect: "Standard" },
    filipino: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    tagalog: { targetLanguage: "Tagalog", dialect: "Filipino (Tagalog)" },
    swahili: { targetLanguage: "Swahili", dialect: "Standard" },
    amharic: { targetLanguage: "Amharic", dialect: "Standard" },
    turkish: { targetLanguage: "Turkish", dialect: "Standard" },
    russian: { targetLanguage: "Russian", dialect: "Standard" },
    japanese: { targetLanguage: "Japanese", dialect: "Standard" },
    korean: { targetLanguage: "Korean", dialect: "Standard" },
    chinese: { targetLanguage: "Chinese", dialect: "Mandarin Chinese" },
    "mandarin chinese": { targetLanguage: "Chinese", dialect: "Mandarin Chinese" }
  };

  return map[value] || {
    targetLanguage: raw.trim() || "English",
    dialect: "Standard"
  };
}

// === CONTEXT MAPPING ===
function getToneValue() {
  if (!contextToggle?.checked) return "natural";

  const map = {
    casual: "casual and natural",
    formal: "formal and polished",
    respectful: "respectful and clear",
    playful: "playful and natural",
    urgent: "urgent and direct"
  };

  return map[contextTone?.value] || "natural";
}

function getAudienceValue() {
  if (!contextToggle?.checked) return "general";

  const map = {
    friend: "friend",
    romantic: "romantic interest",
    professional: "boss or professional contact",
    stranger: "stranger",
    service: "service employee"
  };

  return map[contextAudience?.value] || "general";
}

function getGoalValue() {
  if (!contextToggle?.checked) return "translate accurately";

  const map = {
    travel: "communicate clearly for travel or logistics",
    business: "communicate professionally and clearly",
    social: "communicate naturally and smoothly",
    conflict: "resolve tension clearly and effectively",
    flirting: "communicate with chemistry and natural attraction"
  };

  return map[contextSituation?.value] || "translate accurately";
}

// === THEME ===
function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  if (darkModeButton) {
    if (isSpanishUI()) {
      darkModeButton.textContent = isDark ? "☀️ Claro" : "🌙 Oscuro";
    } else {
      darkModeButton.textContent = isDark ? "☀️ Light" : "🌙 Dark";
    }
  }

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  darkModeButton?.addEventListener("click", () => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    applyTheme(currentlyDark ? "light" : "dark");
  });
}

// === CONTEXT UI ===
function updateContextVisibility() {
  if (contextToggle?.checked) {
    showElement(contextSection, "grid");
    setSectionDisabled(contextSection, false);
  } else {
    hideElement(contextSection);
    setSectionDisabled(contextSection, true);
    contextAudience.value = "";
    contextTone.value = "";
    contextSituation.value = "";
  }
}

// === PRONUNCIATION ===
function englishPronunciationForSpanishReader(text) {
  const specialWords = {
    how: "jau",
    are: "ar",
    you: "yu",
    hello: "jelou",
    friend: "frend",
    weather: "ueder",
    today: "tudei",
    what: "uat",
    is: "is",
    the: "de"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const clean = normalize(word).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      return clean
        .replace(/tion/g, "shon")
        .replace(/sion/g, "shon")
        .replace(/ough/g, "ou")
        .replace(/augh/g, "au")
        .replace(/th/g, "d")
        .replace(/ph/g, "f")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/ea/g, "i");
    })
    .filter(Boolean)
    .join(" ");
}

function spanishPronunciationForEnglishReader(text) {
  const specialWords = {
    hola: "oh-LAH",
    parcero: "par-SEH-roh",
    gracias: "GRAH-syahs",
    donde: "DOHN-deh",
    esta: "ehs-TAH",
    el: "ehl",
    bano: "BAHN-yoh",
    necesito: "neh-seh-SEE-toh",
    hablar: "ah-BLAR",
    contigo: "kohn-TEE-goh",
    como: "KOH-moh",
    estas: "ehs-TAHS",
    clima: "KLEE-mah",
    hoy: "oy",
    puedo: "pweh-DOH",
    tener: "teh-NEHR",
    una: "oo-nah",
    mejora: "meh-HOH-rah"
  };

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const raw = word.replace(/[^\p{L}]/gu, "");
      const clean = normalize(raw).replace(/[^a-z]/g, "");
      if (!clean) return "";
      if (specialWords[clean]) return specialWords[clean];

      let out = clean
        .replace(/que/g, "keh")
        .replace(/qui/g, "kee")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/ce/g, "seh")
        .replace(/ci/g, "see")
        .replace(/ll/g, "y")
        .replace(/ñ/g, "ny")
        .replace(/ch/g, "ch")
        .replace(/j/g, "h")
        .replace(/a/g, "ah")
        .replace(/e/g, "eh")
        .replace(/i/g, "ee")
        .replace(/o/g, "oh")
        .replace(/u/g, "oo");

      out = out
        .replace(/([a-z]{2,})(ah|eh|ee|oh|oo)/gi, "$1-$2")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      return out;
    })
    .filter(Boolean)
    .join(" ");
}

function buildPronunciation(translatedText, sourceLanguage, targetLanguage) {
  const source = normalize(sourceLanguage || "");
  const target = normalize(targetLanguage || "");

  if (!translatedText) return "";

  if (source.includes("spanish") && target.includes("english")) {
    return englishPronunciationForSpanishReader(translatedText);
  }

  if (source.includes("english") && target.includes("spanish")) {
    return spanishPronunciationForEnglishReader(translatedText);
  }

  return "";
}

function updatePronunciationVisibility() {
  const shouldShow = !!pronToggle?.checked && !!output?.value.trim();

  if (shouldShow) {
    showElement(pronunciationSection, "flex");
    speakNormal.disabled = false;
    speakSlow.disabled = false;
  } else {
    hideElement(pronunciationSection);
    speakNormal.disabled = true;
    speakSlow.disabled = true;
  }
}

// === DETECTION ===
function detectInput(text) {
  const lower = normalize(text);
  const tokens = normalize(text).split(/[\s—()\/,.:;!?-]+/).filter(Boolean);

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (
    lower.includes("parce") ||
    lower.includes("parcero") ||
    lower.includes("que mas pues") ||
    lower.includes("quiubo")
  ) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("sumercé") ||
    lower.includes("sumerce") ||
    lower.includes("bacano")
  ) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  const spanishSignals = [
    "hola", "como", "estas", "que", "para", "porque", "por", "favor",
    "gracias", "buenos", "buenas", "dias", "noches", "tardes",
    "amigo", "amiga", "con", "sin", "pero", "muy", "si", "tambien",
    "quiero", "puedo", "necesito", "vamos", "bien", "mal"
  ];

  let count = 0;
  for (const token of tokens) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 1) {
    return { label: "Spanish — LATAM (Neutral)" };
  }

  return { label: "American English" };
}

function updateDetection() {
  const text = userInput?.value.trim() || "";

  detectedSelection = null;
  confirmedInputLanguage = null;
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  if (!text) {
    updateTranslateButtonState();
    return;
  }

  detectedSelection = detectInput(text);

  detectedLanguageDialect.textContent = isSpanishUI()
    ? `Idioma detectado: ${detectedSelection.label}`
    : `Detected language: ${detectedSelection.label}`;

  showElement(detectedCard, "block");
  updateTranslateButtonState();
}

function initDetectedLanguageUI() {
  hideElement(detectedCard);
  hideElement(changeDetectedWrap);

  keepDetectedButton?.addEventListener("click", () => {
    if (!detectedSelection) return;
    confirmedInputLanguage = detectedSelection.label;

    detectedLanguageDialect.textContent = isSpanishUI()
      ? `Idioma confirmado: ${confirmedInputLanguage}`
      : `Input language confirmed: ${confirmedInputLanguage}`;

    hideElement(changeDetectedWrap);
    updateTranslateButtonState();
  });

  changeDetectedButton?.addEventListener("click", () => {
    showElement(changeDetectedWrap, "block");
    detectedSearch?.focus();
  });

  detectedSearch?.addEventListener("input", () => {
    const entered = detectedSearch.value.trim();
    if (!entered) return;

    confirmedInputLanguage = entered;

    detectedLanguageDialect.textContent = isSpanishUI()
      ? `Idioma elegido: ${confirmedInputLanguage}`
      : `Input language chosen: ${confirmedInputLanguage}`;

    showElement(detectedCard, "block");
    updateTranslateButtonState();
  });
}

// === TRANSLATE ===
function buildRequestPayload() {
  const targetRaw = targetSearch?.value.trim() || "";
  const targetConfig = getTargetConfig(targetRaw);
  const enhanced = !!contextToggle?.checked;

  return {
    text: userInput?.value.trim() || "",
    target: targetRaw,
    targetLanguage: targetConfig.targetLanguage,
    dialect: targetConfig.dialect,
    sourceLanguage: confirmedInputLanguage || "",
    tone: enhanced ? getToneValue() : "natural",
    audience: enhanced ? getAudienceValue() : "general",
    goal: enhanced ? getGoalValue() : "translate accurately",
    includeAdditionalInformation: true
  };
}

async function translateText() {
  const input = userInput?.value.trim();
  const target = targetSearch?.value.trim();

  if (!confirmedInputLanguage) {
    alert(isSpanishUI() ? "Confirma primero el idioma de entrada." : "Confirm input language first");
    return;
  }

  if (!input || !target) {
    alert(isSpanishUI() ? "Escribe texto y elige un idioma." : "Enter text and choose a language");
    return;
  }

  const button = translateButton;

  try {
    button.disabled = true;
    button.innerText = isSpanishUI() ? "Traduciendo..." : "Translating...";

    clearResults();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestPayload())
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Request failed");

    output.value = data.output || "";

    const info = data.additional_information || "";
    setAdditionalInfo(info);

    const targetConfig = getTargetConfig(target);
    const pron = buildPronunciation(output.value, confirmedInputLanguage, targetConfig.targetLanguage);
    pronunciation.value = normalizePronunciationStyle(pron);
    updatePronunciationVisibility();

  } catch (err) {
    console.error(err);
    output.value = "Error";
  } finally {
    button.disabled = false;
    button.innerText = isSpanishUI() ? "Traducir" : "Translate";
    updateTranslateButtonState();
  }
}

// === COPY ===
async function copyTranslation() {
  const text = output?.value || "";
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied translation.");
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// === INIT ===
function init() {
  initTheme();
  initDetectedLanguageUI();
  initTargetSuggestions();
  updateContextVisibility();
  updatePronunciationVisibility();
  clearResults();

  setSectionDisabled(contextSection, true);
  speakNormal.disabled = true;
  speakSlow.disabled = true;

  contextToggle?.addEventListener("change", updateContextVisibility);
  pronToggle?.addEventListener("change", updatePronunciationVisibility);

  translateButton?.addEventListener("click", translateText);
  copyButton?.addEventListener("click", copyTranslation);

  speakNormal?.addEventListener("click", () => {
    const text = sanitizeForSpeech(pronunciation?.value || output?.value || "");
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  });

  speakSlow?.addEventListener("click", () => {
    const text = sanitizeForSpeech(pronunciation?.value || output?.value || "");
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.2;
    window.speechSynthesis.speak(utterance);
  });

  userInput?.addEventListener("input", () => {
    clearResults();
    updateDetection();
  });

  userInput?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      translateText();
    }
  });

  targetSearch?.addEventListener("input", updateTranslateButtonState);
  detectedSearch?.addEventListener("input", updateTranslateButtonState);

  siteLanguage?.addEventListener("change", () => {
    applyTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  updateTranslateButtonState();
}

document.addEventListener("DOMContentLoaded", init);
