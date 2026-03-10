const API_URL = "https://translateapp-1.onrender.com/translate";

let detectedSelection = null;
let targetSelection = null;

let targetActiveIndex = -1;
let detectedActiveIndex = -1;

function detectInput(text) {
  const lower = text.toLowerCase();

  if (/[\u0600-\u06FF]/.test(text)) {
    return { label: "Arabic — Modern Standard" };
  }

  if (/[\u0400-\u04FF]/.test(text)) {
    return { label: "Russian" };
  }

  if (/[\u3040-\u30ff]/.test(text)) {
    return { label: "Japanese" };
  }

  if (/[\u4e00-\u9fff]/.test(text)) {
    return { label: "Chinese — Mandarin" };
  }

  if (/[\uAC00-\uD7AF]/.test(text)) {
    return { label: "Korean" };
  }

  if (
    lower.includes("parce") ||
    lower.includes("quiubo") ||
    lower.includes("qué más pues")
  ) {
    return { label: "Spanish — Paisa (Medellín)" };
  }

  if (
    lower.includes("che ") ||
    lower.includes("boludo") ||
    lower.includes("vení") ||
    lower.includes("sos ")
  ) {
    return { label: "Spanish — Argentine" };
  }

  if (
    lower.includes("weón") ||
    lower.includes(" po ")
  ) {
    return { label: "Spanish — Chilean" };
  }

  if (
    lower.includes("órale") ||
    lower.includes("wey") ||
    lower.includes("no manches")
  ) {
    return { label: "Spanish — Mexican" };
  }

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return { label: "Spanish — LATAM" };
  }

  return { label: "English — American" };
}

function updateDetection() {
  const text = document.getElementById("userInput").value.trim();
  const card = document.getElementById("detectedCard");

  if (!text) {
    card.classList.add("hidden");
    detectedSelection = null;
    return;
  }

  if (!detectedSelection) {
    detectedSelection = detectInput(text);
  }

  document.getElementById("detectedLanguageDialect").innerText =
    "Detected Language and Dialect: " + detectedSelection.label;

  card.classList.remove("hidden");
}

function keepDetected() {
  document.getElementById("changeDetectedWrap").classList.add("hidden");
}

function toggleDetectedChange() {
  const wrap = document.getElementById("changeDetectedWrap");
  wrap.classList.toggle("hidden");
}

async function translateText() {
  const input = document.getElementById("userInput").value.trim();

  const target = targetSelection
    ? targetSelection.label
    : document.getElementById("targetSearch").value.trim();

  if (!input || !target) {
    alert("Enter text and choose a language.");
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
      document.getElementById("output").value =
        data.error || "Translation error";
      return;
    }

    document.getElementById("output").value = data.output || "";
    document.getElementById("pronunciation").value = data.output || "";

  } catch (err) {
    document.getElementById("output").value = "Network error";
  }
}

function copyTranslation() {
  const output = document.getElementById("output");
  output.select();
  document.execCommand("copy");
}

function togglePronunciation() {
  const checked = document.getElementById("pronToggle").checked;
  document
    .getElementById("pronunciationSection")
    .classList.toggle("hidden", !checked);
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

  document.getElementById("userInput").addEventListener("input", () => {
    detectedSelection = null;
    updateDetection();
  });

  document
    .getElementById("translateButton")
    .addEventListener("click", translateText);

  document
    .getElementById("copyButton")
    .addEventListener("click", copyTranslation);

  document
    .getElementById("pronToggle")
    .addEventListener("change", togglePronunciation);

  document
    .getElementById("speakSlowButton")
    .addEventListener("click", () => speak(0.6));

  document
    .getElementById("speakNormalButton")
    .addEventListener("click", () => speak(1.0));

  document
    .getElementById("keepDetectedButton")
    .addEventListener("click", keepDetected);

  document
    .getElementById("changeDetectedButton")
    .addEventListener("click", toggleDetectedChange);
});
