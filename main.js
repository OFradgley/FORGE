// main.js
const root = document.getElementById("root");
const nav = document.getElementById("nav"); // Always use the existing #nav inside #root

const modules = [
  { label: "PC", file: "./modules/charGen.compiled.js" },
  { label: "NPC", file: "./modules/npcGen.compiled.js" }
  // Add more generators here as you create them
  // { label: "Dungeon", file: "./modules/dungeonGen.js" },
];

// Style the nav bar as a cobalt blue box
nav.style.background = "#0047ab"; // cobalt blue
nav.style.padding = "16px 0";
nav.style.display = "flex";
nav.style.justifyContent = "center";
nav.style.alignItems = "center";
nav.style.marginBottom = "40px"; // Increased margin for more separation
nav.style.borderRadius = "12px 12px 12px 12px"; // Rounded all corners for a more distinct look

// Clear nav before adding buttons (prevents duplicates on hot reload)
nav.innerHTML = "";

modules.forEach(({ label, file }, i) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = "px-4 py-2 rounded font-bold text-white shadow-lg";
  btn.style.background = "#0047ab"; // cobalt blue
  btn.style.border = "none";
  btn.style.margin = "0 8px";
  btn.style.fontSize = "1.1rem";
  btn.style.cursor = "pointer";
  btn.onmouseover = () => {
    if (!btn.classList.contains("selected")) btn.style.background = "#2563eb";
  };
  btn.onmouseout = () => {
    if (!btn.classList.contains("selected")) btn.style.background = "#0047ab";
  };
  btn.onclick = () => {
    if (btn.classList.contains("selected")) return; // Prevent reselecting the active app
    // Remove selected from all buttons
    Array.from(nav.children).forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
    loadModule(file);
  };
  // Mark the first as selected by default
  if (i === 0) {
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
  }
  nav.appendChild(btn);
});

loadModule(modules[0].file);

async function loadModule(path) {
  const { default: mount } = await import(path);
  mount(root);
}
