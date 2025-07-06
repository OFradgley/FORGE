// main.js
const root = document.getElementById("root");
const nav = document.getElementById("nav"); // Always use the existing #nav inside #root

const modules = [
  { label: "PC", file: "./modules/charGen.compiled.js" },
  { label: "NPC", file: "./modules/npcGen.compiled.js" }
  // Add more generators here as you create them
  // { label: "Dungeon", file: "./modules/dungeonGen.js" },
];

// Style the nav bar as a black box (not cobalt blue)
nav.style.background = "#000"; // black
nav.style.padding = "16px 0";
nav.style.display = "flex";
nav.style.justifyContent = "center";
nav.style.alignItems = "center";
nav.style.marginBottom = "40px"; // Increased margin for more separation
nav.style.borderRadius = "0"; // Remove rounded edges

// Clear nav before adding buttons (prevents duplicates on hot reload)
nav.innerHTML = "";

modules.forEach(({ label, file }, i) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = "px-4 py-2 rounded font-bold shadow-lg";
  btn.style.background = i === 0 ? "#0047ab" : "#222"; // cobalt blue for selected, dark grey for inactive
  btn.style.color = "#fff"; // white text for all
  btn.style.border = "none";
  btn.style.margin = "0 8px";
  btn.style.fontSize = "1.1rem";
  btn.style.cursor = "pointer";
  btn.onmouseover = () => {
    if (!btn.classList.contains("selected")) btn.style.background = "#333";
  };
  btn.onmouseout = () => {
    if (!btn.classList.contains("selected")) btn.style.background = "#222";
  };
  btn.onclick = () => {
    if (btn.classList.contains("selected")) return; // Prevent reselecting the active app
    // Remove selected from all buttons and set inactive style
    Array.from(nav.children).forEach((b, idx) => {
      b.classList.remove("selected");
      b.removeAttribute("aria-current");
      b.style.background = "#222";
      b.style.color = "#fff";
    });
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
    btn.style.background = "#0047ab"; // cobalt blue for active
    btn.style.color = "#fff";
    loadModule(file);
  };
  // Mark the first as selected by default
  if (i === 0) {
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
    btn.style.background = "#0047ab";
    btn.style.color = "#fff";
  }
  nav.appendChild(btn);
});

loadModule(modules[0].file);

async function loadModule(path) {
  try {
    const mod = await import(path);
    console.log("Imported module for", path, ":", mod, "mount:", mod.mount);
    if (typeof mod.mount !== "function") {
      throw new Error(`Module at ${path} does not export a 'mount' function.`);
    }
    mod.mount(root);
  } catch (e) {
    console.error("Failed to load module:", path, e);
    root.innerHTML = `<div style=\"color:red\">Failed to load module: ${path}<br>${e.message}</div>`;
  }
}
