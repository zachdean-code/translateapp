const API_URL = "https://translateapp-1.onrender.com/translate";

async function translateText() {
  const input = document.getElementById("userInput").value.trim();
  const target = document.getElementById("targetSearch").value.trim();

  if (!input || !target) {
    alert("Enter text and choose a language.");
    return;
  }

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

  const translation = data.translation_text || "";
  const usageNote = data.usage_note || "";
  const pronunciation = data.pronunciation_guide || "";

  document.getElementById("output").value = translation;

  const usageSection = document.getElementById("usageNoteSection");
  const usageBox = document.getElementById("usageNote");

  if (data.show_usage_note && usageNote) {
    usageBox.value = usageNote;
    usageSection.classList.remove("hidden");
  } else {
    usageSection.classList.add("hidden");
    usageBox.value = "";
  }

  const pronSection = document.getElementById("pronunciationSection");
  const pronToggle = document.getElementById("pronToggle");

  if (pronToggle.checked && data.show_pronunciation) {
    document.getElementById("pronunciation").value = pronunciation;
    pronSection.classList.remove("hidden");
  } else {
    pronSection.classList.add("hidden");
  }
}

function togglePronunciation() {
  const checked = document.getElementById("pronToggle").checked;
  if (!checked) {
    document.getElementById("pronunciationSection").classList.add("hidden");
  }
}

function copyTranslation() {
  const output = document.getElementById("output");
  output.select();
  document.execCommand("copy");
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

  document.getElementById("translateButton")
  .addEventListener("click", translateText);

  document.getElementById("copyButton")
  .addEventListener("click", copyTranslation);

  document.getElementById("pronToggle")
  .addEventListener("change", togglePronunciation);

  document.getElementById("speakNormalButton")
  .addEventListener("click", () => speak(1.0));

  document.getElementById("speakSlowButton")
  .addEventListener("click", () => speak(0.6));

  document.getElementById("darkModeButton")
  .addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

});
