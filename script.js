function translateText() {
  const input = document.getElementById("userInput").value;

  fetch("https://translateapp-1.onrender.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: input }),
  })
    .then(async (response) => {
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        document.getElementById("output").innerText = data.output || text;
      } catch (e) {
        document.getElementById("output").innerText =
          "Backend returned non-JSON response:\n" + text;
      }
    })
    .catch((error) => {
      document.getElementById("output").innerText =
        "Network error: " + error;
    });
}
