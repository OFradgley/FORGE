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
nav.style.position = "sticky"; // Sticky positioning to stay at top
nav.style.top = "0"; // Stick to the top of the viewport
nav.style.zIndex = "1000"; // Ensure it stays above other content
nav.style.overflow = "visible"; // Allow dropdown to extend beyond nav bar

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

// Add the "..." menu button on the right side of the nav bar
const menuContainer = document.createElement("div");
menuContainer.style.position = "absolute";
menuContainer.style.right = "16px";
menuContainer.style.top = "50%";
menuContainer.style.transform = "translateY(-50%)";
menuContainer.style.zIndex = "1000"; // Ensure it's above other content

const menuBtn = document.createElement("button");
menuBtn.textContent = "...";
menuBtn.className = "px-3 py-2 rounded font-bold shadow-lg";
menuBtn.style.background = "#2563eb"; // blue color for visibility
menuBtn.style.color = "#fff";
menuBtn.style.border = "none";
menuBtn.style.fontSize = "1.1rem";
menuBtn.style.cursor = "pointer";
menuBtn.onmouseover = () => menuBtn.style.background = "#1d4ed8";
menuBtn.onmouseout = () => menuBtn.style.background = "#2563eb";

// Create dropdown menu
const dropdown = document.createElement("div");
dropdown.style.display = "none";
dropdown.style.position = "absolute";
dropdown.style.right = "0";
dropdown.style.top = "calc(100% + 8px)";
dropdown.style.background = "#fff";
dropdown.style.border = "1px solid #e5e7eb";
dropdown.style.borderRadius = "8px";
dropdown.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
dropdown.style.minWidth = "120px";
dropdown.style.zIndex = "9999";
dropdown.style.overflow = "visible";

// Create dark mode toggle option
const darkModeOption = document.createElement("button");
darkModeOption.style.width = "100%";
darkModeOption.style.padding = "12px 16px";
darkModeOption.style.background = "none";
darkModeOption.style.border = "none";
darkModeOption.style.textAlign = "left";
darkModeOption.style.cursor = "pointer";
darkModeOption.style.fontSize = "14px";
darkModeOption.style.color = "#374151";
darkModeOption.onmouseover = () => darkModeOption.style.background = "#f3f4f6";
darkModeOption.onmouseout = () => darkModeOption.style.background = "none";

// Check initial dark mode state and set button text
function isDarkMode() {
  return localStorage.getItem("darkMode") === "true" || document.body.classList.contains("dark");
}

function updateDarkModeText() {
  darkModeOption.textContent = isDarkMode() ? "Light Mode" : "Dark Mode";
}

function setDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add("dark");
    localStorage.setItem("darkMode", "true");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
  }
  updateDarkModeText();
}

// Apply initial dark mode state
if (isDarkMode()) {
  document.body.classList.add("dark");
}
updateDarkModeText();

darkModeOption.onclick = () => {
  setDarkMode(!isDarkMode());
  dropdown.style.display = "none";
};

// Toggle dropdown visibility
menuBtn.onclick = (e) => {
  e.stopPropagation();
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
};

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  dropdown.style.display = "none";
});

dropdown.appendChild(darkModeOption);
menuContainer.appendChild(menuBtn);
menuContainer.appendChild(dropdown);
nav.appendChild(menuContainer);

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
