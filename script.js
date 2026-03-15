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
    "Mexican Spanish": "Mexican Spanish",
    "LATAM Spanish": "LATAM Spanish",
    "General Colombian Spanish": "General Colombian Spanish",
    "Paisa Spanish (Medellín)": "Paisa Spanish (Medellín)",
    "Rolo Spanish (Bogotá)": "Rolo Spanish (Bogotá)",
    "Cali Spanish": "Cali Spanish",
    "Santander Spanish": "Santander Spanish",
    "Venezuelan Spanish": "Venezuelan Spanish",
    "Chinese": "Chinese",
    "Korean": "Korean",
    "Japanese": "Japanese",
    "Russian": "Russian",
    "English — American": "American English",
    "English — British": "British English",
    "English — Australian": "Australian English",
    "Spanish — LATAM (Neutral)": "LATAM Spanish",
    "Spanish — Mexican": "Mexican Spanish",
    "Spanish — Central American": "Central American Spanish",
    "Spanish — Caribbean": "Caribbean Spanish",
    "Spanish — Peruvian": "Peruvian Spanish",
    "Spanish — Argentine": "Argentine Spanish",
    "Spanish — Chilean": "Chilean Spanish",
    "Spanish — Paisa (Medellín)": "Paisa Spanish (Medellín)",
    "Spanish — Rolo (Bogotá)": "Rolo Spanish (Bogotá)",
    "Spanish — Cali": "Cali Spanish",
    "Spanish — Santander": "Santander Spanish",
    "Spanish — Venezuelan": "Venezuelan Spanish",
    "Spanish — General Colombian": "General Colombian Spanish",
    "Colombian Spanish — Paisa (Medellín)": "Paisa Spanish (Medellín)",
    "Colombian Spanish — Rolo (Bogotá)": "Rolo Spanish (Bogotá)",
    "Colombian Spanish — Cali": "Cali Spanish",
    "Colombian Spanish — Santander": "Santander Spanish",
    "Latin American Spanish (Neutral)": "LATAM Spanish",
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
    "Turkish": "Turkish",
    "Mandarin Chinese": "Mandarin Chinese"
  },
  es: {
    "American English": "Inglés estadounidense",
    "British English": "Inglés británico",
    "Australian English": "Inglés australiano",
    "French": "Francés",
    "German": "Alemán",
    "Italian": "Italiano",
    "Mexican Spanish": "Español mexicano",
    "LATAM Spanish": "Español latinoamericano",
    "General Colombian Spanish": "Español colombiano",
    "Paisa Spanish (Medellín)": "Español paisa (Medellín)",
    "Rolo Spanish (Bogotá)": "Español rolo (Bogotá)",
    "Cali Spanish": "Español caleño",
    "Santander Spanish": "Español santandereano",
    "Venezuelan Spanish": "Español venezolano",
    "Chinese": "Chino",
    "Korean": "Coreano",
    "Japanese": "Japonés",
    "Russian": "Ruso",
    "English — American": "Inglés estadounidense",
    "English — British": "Inglés británico",
    "English — Australian": "Inglés australiano",
    "Spanish — LATAM (Neutral)": "Español latinoamericano",
    "Spanish — Mexican": "Español mexicano",
    "Spanish — Central American": "Español centroamericano",
    "Spanish — Caribbean": "Español caribeño",
    "Spanish — Peruvian": "Español peruano",
    "Spanish — Argentine": "Español argentino",
    "Spanish — Chilean": "Español chileno",
    "Spanish — Paisa (Medellín)": "Español paisa (Medellín)",
    "Spanish — Rolo (Bogotá)": "Español rolo (Bogotá)",
    "Spanish — Cali": "Español caleño",
    "Spanish — Santander": "Español santandereano",
    "Spanish — Venezuelan": "Español venezolano",
    "Spanish — General Colombian": "Español colombiano",
    "Colombian Spanish — Paisa (Medellín)": "Español colombiano — Paisa (Medellín)",
    "Colombian Spanish — Rolo (Bogotá)": "Español colombiano — Rolo (Bogotá)",
    "Colombian Spanish — Cali": "Español colombiano — Cali",
    "Colombian Spanish — Santander": "Español colombiano — Santander",
    "Latin American Spanish (Neutral)": "Español latinoamericano (neutral)",
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
    "Turkish": "Turco",
    "Mandarin Chinese": "Chino mandarín"
  }
};

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

  styleConfirmationRow();
  updateTranslateState();
}

function togglePronunciation() {
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
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

  if (/[\u0600-\u06FF]/.test(text)) return { label: "Modern Standard Arabic" };
  if (/[\u0400-\u04FF]/.test(text)) return { label: "Russian" };
  if (/[\u3040-\u30ff]/.test(text)) return { label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { label: "Mandarin Chinese" };
  if (/[\uAC00-\uD7AF]/.test(text)) return { label: "Korean" };

  if (lower.includes("parce") || lower.includes("parcero") || lower.includes("que mas pues") || lower.includes("quiubo")) {
    return { label: "Colombian Spanish — Paisa (Medellín)" };
  }

  if (lower.includes("sumercé") || lower.includes("sumerce") || lower.includes("bacano")) {
    return { label: "Colombian Spanish — Rolo (Bogotá)" };
  }

  if (lower.includes("orale") || lower.includes("wey") || lower.includes("no manches")) {
    return { label: "Mexican Spanish" };
  }

  const spanishSignals = [
    "hola","como","estas","que","para","porque","por","favor",
    "gracias","buenos","buenas","dias","noches","tardes",
    "amigo","amiga","con","sin","pero","muy","si","tambien",
    "quiero","puedo","necesito","vamos","bien","mal"
  ];

  let count = 0;
  for (const token of tokenize(text)) {
    if (spanishSignals.includes(token)) count += 1;
  }

  if (/[áéíóúñ¿¡]/i.test(text) || count >= 2) {
    return { label: "Latin American Spanish (Neutral)" };
  }

  return { label: "American English" };
}
