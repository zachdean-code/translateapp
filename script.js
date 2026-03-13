function splitIntoSyllables(word) {
  const cleaned = normalizeText(word).replace(/[^a-z]/g, "");
  if (!cleaned) return word;

  return cleaned
    .replace(/ch/g, "ç")
    .replace(/ll/g, "ÿ")
    .replace(/qu/g, "q")
    .replace(/gue/g, "gë")
    .replace(/gui/g, "gï")
    .replace(/([aeiouy]+)([bcdfghjklmnñpqrstvwxyz])/g, "$1-$2")
    .replace(/ç/g, "ch")
    .replace(/ÿ/g, "ll")
    .replace(/q/g, "qu")
    .replace(/gë/g, "gue")
    .replace(/gï/g, "gui");
}

function latinToEnglishReaderPhonetics(text) {
  return text
    .split(/\s+/)
    .map((raw) => {
      let word = raw
        .toLowerCase()
        .replace(/[¡!¿?.,;:()"']/g, "")
        .replace(/á/g, "ah")
        .replace(/é/g, "ay")
        .replace(/í/g, "ee")
        .replace(/ó/g, "oh")
        .replace(/ú/g, "oo")
        .replace(/à|â/g, "ah")
        .replace(/è|ê|ë/g, "eh")
        .replace(/ì|î/g, "ee")
        .replace(/ò|ô/g, "oh")
        .replace(/ù|û/g, "oo")
        .replace(/ñ/g, "ny")
        .replace(/ll/g, "y")
        .replace(/ch/g, "ch")
        .replace(/qu/g, "k")
        .replace(/gue/g, "geh")
        .replace(/gui/g, "gee")
        .replace(/ge/g, "heh")
        .replace(/gi/g, "hee")
        .replace(/j/g, "h")
        .replace(/ce/g, "say")
        .replace(/ci/g, "see")
        .replace(/ç/g, "s")
        .replace(/^hola$/g, "ohlah")
        .replace(/^parce$/g, "parseh")
        .replace(/^parcero$/g, "parseroh")
        .replace(/^que$/g, "kay")
        .replace(/^qué$/g, "kay")
        .replace(/^mas$/g, "mahs")
        .replace(/^más$/g, "mahs");

      return splitIntoSyllables(word);
    })
    .join("   ");
}

function latinToSpanishReaderPhonetics(text) {
  return text
    .split(/\s+/)
    .map((raw) => {
      let word = raw
        .toLowerCase()
        .replace(/[.,;:!?()"']/g, "")
        .replace(/th/g, "d")
        .replace(/sh/g, "sh")
        .replace(/ch/g, "ch")
        .replace(/tion/g, "shon")
        .replace(/ing\b/g, "ing")
        .replace(/oo/g, "u")
        .replace(/ee/g, "i")
        .replace(/igh/g, "ai")
        .replace(/ow/g, "au")
        .replace(/ph/g, "f")
        .replace(/w/g, "u");

      return splitIntoSyllables(word);
    })
    .join("   ");
}

function buildPronunciation(text, inputLabel, targetLabel) {
  const state = getPronunciationPairState(inputLabel, targetLabel);

  if (state.mode !== "supported") return "";

  if (state.inputBase === "english") {
    return latinToEnglishReaderPhonetics(text);
  }

  if (state.inputBase === "spanish") {
    return latinToSpanishReaderPhonetics(text);
  }

  return text;
}

function sanitizeForSpeech(text) {
  return (text || "")
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function translateText() {
  const input = el("userInput")?.value.trim() || "";
  const target = targetSelection
    ? targetSelection.label
    : (el("targetSearch")?.value.trim() || "");

  if (!input || !target) {
    alert("Enter text and choose a language.");
    return;
  }

  detectedSelection = detectInput(input);

  if (!detectionConfirmed) {
    confirmedInputSelection = { ...detectedSelection };
    detectionConfirmed = true;
  }

  updateDetectionCard();
  updatePronunciationAvailability();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        target: target
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (el("output")) el("output").value = data.error || "Translation error";
      return;
    }

    let translated = data.output || "";

    translated = translated
      .replace(/^[A-Za-zÀ-ÿ\s()\-—]+:\s*/, "")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "");

    if (el("output")) {
      el("output").value = translated;
    }

    const state = getPronunciationPairState(confirmedInputSelection.label, target);

    if (state.mode === "supported") {
      const pronunciationText = buildPronunciation(
        translated,
        confirmedInputSelection.label,
        target
      );

      if (el("pronunciation")) {
        el("pronunciation").value = pronunciationText;
      }

      if (el("pronToggle")?.checked) {
        el("pronunciationSection")?.classList.remove("hidden");
      } else {
        el("pronunciationSection")?.classList.add("hidden");
      }
    } else {
      if (el("pronunciation")) el("pronunciation").value = "";
      el("pronunciationSection")?.classList.add("hidden");
    }
  } catch (err) {
    if (el("output")) el("output").value = "Network or server error";
  }
}

function copyTranslation() {
  const output = el("output");
  if (!output) return;
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

function togglePronunciation() {
  const checked = !!el("pronToggle")?.checked;
  el("pronunciationSection")?.classList.toggle("hidden", !checked);
}

function speak(rate) {
  const pronunciation = el("pronunciation")?.value.trim() || "";
  const translation = el("output")?.value.trim() || "";
  const text = sanitizeForSpeech(pronunciation || translation);

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

  const browserLang = navigator.language.slice(0, 2);
  const savedLang =
    localStorage.getItem("siteLanguage") ||
    (browserLang === "es" ? "es" : "en");

  const siteLanguage = el("siteLanguage");
  if (siteLanguage) {
    siteLanguage.value = savedLang;
    siteLanguage.addEventListener("change", (e) => applyLanguage(e.target.value));
  }

  applyLanguage(savedLang);

  el("darkModeButton")?.addEventListener("click", toggleDarkMode);
  el("translateButton")?.addEventListener("click", translateText);
  el("copyButton")?.addEventListener("click", copyTranslation);
  el("pronToggle")?.addEventListener("change", togglePronunciation);
  el("speakNormalButton")?.addEventListener("click", () => speak(1.0));
  el("speakSlowButton")?.addEventListener("click", () => speak(0.6));
  el("keepDetectedButton")?.addEventListener("click", confirmDetectedLanguage);
  el("changeDetectedButton")?.addEventListener("click", toggleDetectedChange);

  el("userInput")?.addEventListener("input", () => {
    detectionConfirmed = false;
    confirmedInputSelection = null;
    detectedSelection = detectInput(el("userInput").value || "");
    updateDetectionCard();
    updatePronunciationAvailability();
  });

  setupSearch("targetSearch", "targetSuggestions", (item) => {
    targetSelection = item;
    if (el("targetSearch")) el("targetSearch").value = item.label;
    updatePronunciationAvailability();
  }, "target");

  setupSearch("detectedSearch", "detectedSuggestions", (item) => {
    detectedSelection = { label: item.label };
    confirmedInputSelection = { label: item.label };
    detectionConfirmed = true;
    if (el("detectedSearch")) el("detectedSearch").value = item.label;
    el("changeDetectedWrap")?.classList.add("hidden");
    updateDetectionCard();
    updatePronunciationAvailability();
  }, "detected");

  updateDetectionCard();
  updatePronunciationAvailability();
});
