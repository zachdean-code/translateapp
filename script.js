function translateText() {
  const input = document.getElementById("userInput").value;
  fetch("https://translateapp-1.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: input }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("output").innerText = data.output;
    })
    .catch((error) => {
      document.getElementById("output").innerText = "Error: " + error;
    });
}
