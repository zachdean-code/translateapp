const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;

let targetActiveIndex = -1;
let detectedActiveIndex = -1;

function applyLanguage(lang) {
  document.documentElement.lang = lang;

  document.getElementById("uiLanguageLabel").innerText = t("uiLanguageLabel", lang);
  document.getElementById("darkModeButton").innerText = t("darkModeButton", lang);
  document.getElementById("pageTitle").innerText = t("pageTitle", lang);
  document.getElementById("pageSubtitle").innerText = t("pageSubtitle", lang);
  document.getElementById("pageDescription").innerText = t("pageDescription", lang);
  document.getElementById("inputLabel").innerText = t("inputLabel", lang);
  document.getElementById("detectedLanguageLabel").innerText = t("detectedLanguageLabel", lang);
  document.getElementById("detectedDialectLabel").innerText = t("detectedDialectLabel", lang);
  document.getElementById("confidenceLabel").innerText = t("confidenceLabel", lang);
  document.getElementById("keepDetectedButton").innerText = t("keepDetectedButton", lang);
  document.getElementById("changeDetectedButton").innerText = t("changeDetectedButton", lang);
  document.getElementById("changeDetectedLabel").innerText = t("changeDetectedLabel", lang);
  document.getElementById("translateToLabel").innerText = t("translateToLabel", lang);
  document.getElementById("translateButton").innerText = t("translateButton", lang);
  document.getElementById("translationLabel").innerText = t("translationLabel", lang);
  document.getElementById("copyButton").innerText = t("copyButton", lang);
  document.getElementById("pronunciationToggleLabel").innerText = t("pronunciationToggleLabel", lang);
  document.getElementById("pronunciationLabel").innerText = t("pronunciationLabel", lang);
  document.getElementById("speakSlowButton").innerText = t("speakSlowButton", lang);
  document.getElementById("speakNormalButton").innerText = t("speakNormalButton", lang);
  document.getElementById("footerProduct").innerText = t("footerProduct", lang);
  document.getElementById("footerTagline").innerText = t("footerTagline", lang);
  document.getElementById("footerDescriptor").innerText = t("footerDescriptor", lang);
  document.getElementById("footerCopyright").innerText = t("footerCopyright", lang);
  document.getElementById("footerPatent").innerText = t("footerPatent", lang);

  localStorage.setItem("siteLanguage", lang);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
}

function findMatches(value) {
  const q = value.trim().toLowerCase();

  if (!q) {
    return languageCatalog.slice(0, 12);
  }

  return languageCatalog.filter((item) => {
    if (item.label.toLowerCase().includes(q)) return true;
    return item.aliases.some((alias) => alias.toLowerCase().includes(q));
  }).slice(0, 12);
}

function renderSuggestions(container, matches, onPick, type) {
  container.innerHTML = "";

  if (!matches.length) {
    container.style.display = "none";
    if (type === "target") targetActiveIndex = -1;
    if (type === "detected") detectedActiveIndex = -1;
    return;
  }

  matches.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "suggestionItem";
    div.innerText = item.label;
    div.dataset.index = String(index);

    div.onclick = () => onPick(item);

    div.onmouseenter = () => {
      if (type === "target") targetActiveIndex = index;
      if (type === "detected") detectedActiveIndex = index;
      highlightActiveSuggestion(container, type);
    };

    container.appendChild(div);
  });

  container.style.display = "block";

  if (type === "target") {
    targetActiveIndex = -1;
  }
  if (type === "detected") {
    detectedActiveIndex = -1;
  }
}

function highlightActiveSuggestion(container, type) {
  const items = container.querySelectorAll(".suggestionItem");
  const activeIndex = type === "target" ? targetActiveIndex : detectedActiveIndex;

  items.forEach((item, index) => {
    if (index === activeIndex) {
      item.style.background = document.body.classList.contains("dark") ? "#3a3a3a" : "#e8eef8";
    } else {
      item.style.background = "";
    }
  });

  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

function closeSuggestions(container, type) {
  container.style.display = "none";
  if (type === "target") targetActiveIndex = -1;
  if (type === "detected") detectedActiveIndex = -1;
}

function setupSearch(inputId, suggestionId, onPick, type) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionId);

  input.addEventListener("focus", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("input", () => {
    renderSuggestions(box, findMatches(input.value), onPick, type);
  });

  input.addEventListener("keydown", (e) => {
    const matches = findMatches(input.value);
    const isTarget = type === "target";

    if (box.style.display !== "block" && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      renderSuggestions(box, matches, onPick, type);
    }

    if (!matches.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isTarget) {
        targetActiveIndex = (targetActiveIndex + 1) % matches.length;
      } else {
        detectedActiveIndex = (detectedActiveIndex + 1) % matches.length;
      }
      highlightActiveSuggestion(box, type);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isTarget) {
        targetActiveIndex = targetActiveIndex <= 0 ? matches.length - 1 : targetActiveIndex - 1;
      } else {
        detectedActiveIndex = detectedActiveIndex <= 0 ? matches.length - 1 : detectedActiveIndex - 1;
      }
      highlightActiveSuggestion(box, type);
    }

    if (e.key === "Enter") {
      const activeIndex = isTarget ? targetActiveIndex : detectedActiveIndex;
      if (box.style.display === "block" && activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        onPick(matches[activeIndex]);
      }
    }

    if (e.key === "Escape") {
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
  const lower = text.toLowerCase();

  if (/[\u0600-\u06FF]/.test(text)) {
    return { language: "Arabic", dialect: "Arabic — Modern Standard", confidence: "91%" };
  }
  if (/[\u0400-\u04FF]/.test(text)) {
    return { language: "Russian", dialect: "Russian", confidence: "95%" };
  }
  if (/[\u3040-\u30ff]/.test(text)) {
    return { language: "Japanese", dialect: "Japanese", confidence: "97%" };
  }
  if (/[\u4e00-\u9fff]/.test(text)) {
    return { language: "Chinese", dialect: "Chinese", confidence: "96%" };
  }
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return { language: "Korean", dialect: "Korean", confidence: "97%" };
  }
  if (
    lower.includes("parce") ||
    lower.includes("quiubo") ||
    lower.includes("qué más pues")
  ) {
    return { language: "Spanish", dialect: "Spanish — Paisa (Medellín)", confidence: "94%" };
  }
  if (
    lower.includes("che ") ||
    lower.includes("boludo") ||
    lower.includes("vení") ||
    lower.includes("sos ")
  ) {
    return { language: "Spanish", dialect: "Spanish — Argentine", confidence: "93%" };
  }
  if (
    lower.includes("weón") ||
    lower.includes("huevon") ||
    lower.includes(" po ") ||
    lower.endsWith(" po")
  ) {
    return { language: "Spanish", dialect: "Spanish — Chilean", confidence: "88%" };
  }
  if (
    lower.includes("órale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { language: "Spanish", dialect: "Spanish — Mexican", confidence: "91%" };
  }
  if (lower.includes("bacano") || lower.includes("qué más")) {
    return { language: "Spanish", dialect: "Spanish — LATAM (Neutral)", confidence: "74%" };
  }
  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { language: "Spanish", dialect: "Spanish — LATAM (Neutral)", confidence: "78%" };
  }

  return { language: "English", dialect: "English — American", confidence: "63%" };
}

function updateDetection() {
  const text = document.getElementById("userInput").value.trim();
  const card = document.getElementById("detectedCard");

  if (!text) {
    card.classList.add("hidden");
    document.getElementById("changeDetectedWrap").classList.add("hidden");
    detectedSelection = null;
    return;
  }

  if (!detectedSelection) {
    detectedSelection = detectInput(text);
  }

  document.getElementById("detectedLanguageValue").innerText = detectedSelection.language;
  document.getElementById("detectedDialectValue").innerText = detectedSelection.dialect;
  document.getElementById("detectedConfidenceValue").innerText = detectedSelection.confidence;

  card.classList.remove("hidden");
}

function keepDetected() {
  document.getElementById("changeDetectedWrap").classList.add("hidden");
  document.getElementById("detectedSearch").value = "";
  closeSuggestions(document.getElementById("detectedSuggestions"), "detected");
  updateDetection();
}

function toggleDetectedChange() {
  const wrap = document.getElementById("changeDetectedWrap");
  wrap.classList.toggle("hidden");

  if (!wrap.classList.contains("hidden")) {
    document.getElementById("detectedSearch").focus();
  } else {
    document.getElementById("detectedSearch").value = "";
    closeSuggestions(document.getElementById("detectedSuggestions"), "detected");
  }
}

async function translateText() {
  const input = document.getElementById("userInput").value.trim();
  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if (!input || !target) {
    alert("Please enter text and choose a target language.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("output").value = data.error || "Translation error";
      return;
    }

    document.getElementById("output").value = data.output || data.translation || "";
    document.getElementById("pronunciation").value = data.output || data.translation || "";
  } catch (err) {
    document.getElementById("output").value = "Network or server error";
  }
}

function copyTranslation() {
  const output = document.getElementById("output");
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation() {
  const isChecked = document.getElementById("pronToggle").checked;
  document.getElementById("pronunciationSection").classList.toggle("hidden", !isChecked);
}

function speak(rate) {
  const text = document.getElementById("output").value.trim();
  if (!text) return;

  speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = rate;
  speechSynthesis.speak(msg);
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
  }

  const savedLang = localStorage.getItem("siteLanguage") || "en";
  document.getElementById("siteLanguage").value = savedLang;
  applyLanguage(savedLang);

  document.getElementById("siteLanguage").addEventListener("change", (e) => applyLanguage(e.target.value));
  document.getElementById("darkModeButton").addEventListener("click", toggleDarkMode);

  document.getElementById("userInput").addEventListener("input", () => {
    detectedSelection = null;
    updateDetection();
  });

  document.getElementById("keepDetectedButton").addEventListener("click", keepDetected);
  document.getElementById("changeDetectedButton").addEventListener("click", toggleDetectedChange);
  document.getElementById("translateButton").addEventListener("click", translateText);
  document.getElementById("copyButton").addEventListener("click", copyTranslation);
  document.getElementById("pronToggle").addEventListener("change", togglePronunciation);
  document.getElementById("speakSlowButton").addEventListener("click", () => speak(0.6));
  document.getElementById("speakNormalButton").addEventListener("click", () => speak(1.0));

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    document.getElementById("targetSearch").value = item.label;
    closeSuggestions(document.getElementById("targetSuggestions"), "target");
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = {
      language: item.label.split(" — ")[0] || item.label,
      dialect: item.label,
      confidence: "Manual"
    };

    document.getElementById("detectedSearch").value = item.label;
    closeSuggestions(document.getElementById("detectedSuggestions"), "detected");
    updateDetection();
    document.getElementById("changeDetectedWrap").classList.add("hidden");
  }, "detected");
});
