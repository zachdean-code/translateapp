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

function setSectionDisabled(section, disabled) {
  if (!section) return;
  const controls = section.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}
