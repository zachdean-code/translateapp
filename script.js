function translateText() {
  const input = document.getElementById("userInput").value;
  const targetLanguage = document.getElementById("targetLanguage").value;

  fetch("https://translateapp-1.onrender.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input,
      targetLanguage: targetLanguage,
    }),
  })
    .then(async (response) => {
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        document.getElementById("output").value = data.output || "";
        const pronunciationBox = document.getElementById("pronunciation");
        if (pronunciationBox) {
          pronunciationBox.value = data.pronunciation || "";
        }
      } catch (e) {
        document.getElementById("output").value =
          "Backend returned non-JSON response:\n" + text;
        const pronunciationBox = document.getElementById("pronunciation");
        if (pronunciationBox) {
          pronunciationBox.value = "";
        }
      }
    })
    .catch((error) => {
      document.getElementById("output").value = "Error: " + error;
      const pronunciationBox = document.getElementById("pronunciation");
      if (pronunciationBox) {
        pronunciationBox.value = "";
      }
    });
}

function copyOutput() {
  const output = document.getElementById("output");
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");
}
