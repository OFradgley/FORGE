// main.js
const root = document.getElementById("root");
const nav = document.getElementById("nav"); // Always use the existing #nav inside #root

// Simple state persistence system
const moduleStates = new Map();
let currentModulePath = null;

const modules = [
  { label: "Dice", file: "./modules/Dice.compiled.js" },
  { label: "Oracle", file: "./modules/Oracle.compiled.js" }
  // Add more modules here as you create them
  // { label: "Dungeon", file: "./modules/dungeonGen.js" },
];

const generators = [
  { label: "PC", file: "./modules/charGen.compiled.js" },
  { label: "NPC", file: "./modules/npcGen.compiled.js" },
  { label: "Quest", file: "./modules/questGen.compiled.js" }
  // Add future generators here
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
  btn.style.background = i === 0 ? "#2563eb" : "#222"; // blue-600 for selected, dark grey for inactive
  btn.style.color = "#fff"; // white text for all
  btn.style.border = "none";
  btn.style.margin = "0 5px";
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
      if (b.tagName === 'BUTTON') { // Only process buttons, not container divs
        b.classList.remove("selected");
        b.removeAttribute("aria-current");
        b.style.background = "#222";
        b.style.color = "#fff";
      }
    });
    // Also reset generators button
    generatorsBtn.classList.remove("selected");
    generatorsBtn.removeAttribute("aria-current");
    generatorsBtn.style.background = "#222";
    generatorsBtn.style.color = "#fff";
    
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
    btn.style.background = "#2563eb"; // blue-600 for active
    btn.style.color = "#fff";
    loadModule(file);
  };
  // Mark the first as selected by default
  if (i === 0) {
    btn.classList.add("selected");
    btn.setAttribute("aria-current", "page");
    btn.style.background = "#2563eb";
    btn.style.color = "#fff";
  }
  nav.appendChild(btn);
});

// Add the Generators dropdown button
const generatorsContainer = document.createElement("div");
generatorsContainer.style.position = "relative";
generatorsContainer.style.display = "inline-block";

const generatorsBtn = document.createElement("button");
generatorsBtn.textContent = "Generators ▼";
generatorsBtn.className = "px-4 py-2 rounded font-bold shadow-lg";
generatorsBtn.style.background = "#222"; // dark grey like inactive buttons
generatorsBtn.style.color = "#fff";
generatorsBtn.style.border = "none";
generatorsBtn.style.margin = "0 6px";
generatorsBtn.style.fontSize = "1.1rem";
generatorsBtn.style.cursor = "pointer";

// Create generators dropdown
const generatorsDropdown = document.createElement("div");
generatorsDropdown.style.display = "none";
generatorsDropdown.style.position = "absolute";
generatorsDropdown.style.top = "calc(100% + 8px)";
generatorsDropdown.style.left = "0";
generatorsDropdown.style.borderRadius = "8px";
generatorsDropdown.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
generatorsDropdown.style.minWidth = "150px";
generatorsDropdown.style.zIndex = "9999";
generatorsDropdown.style.overflow = "visible";

// Function to update dropdown styling based on dark mode
function updateGeneratorsDropdownTheme() {
  const isDark = document.body.classList.contains("dark");
  generatorsDropdown.style.background = isDark ? "#374151" : "#fff";
  generatorsDropdown.style.border = isDark ? "1px solid #4b5563" : "1px solid #e5e7eb";
  
  // Update all option colors
  Array.from(generatorsDropdown.children).forEach(option => {
    option.style.color = isDark ? "#f9fafb" : "#374151";
  });
}

// Add generator options to dropdown
generators.forEach(({ label, file }) => {
  const option = document.createElement("button");
  option.textContent = label;
  option.style.width = "100%";
  option.style.padding = "12px 16px";
  option.style.background = "none";
  option.style.border = "none";
  option.style.textAlign = "left";
  option.style.cursor = "pointer";
  option.style.fontSize = "14px";
  option.style.borderRadius = "0";
  
  option.onmouseover = () => {
    option.style.background = "#2563eb"; // Blue-600 highlight in both light and dark mode
    option.style.color = "#fff";
  };
  option.onmouseout = () => {
    const isDark = document.body.classList.contains("dark");
    option.style.background = "none";
    option.style.color = isDark ? "#f9fafb" : "#374151";
  };
  
  option.onclick = (e) => {
    e.stopPropagation();
    // Remove selected from all main nav buttons
    Array.from(nav.children).forEach((b) => {
      if (b.tagName === 'BUTTON') {
        b.classList.remove("selected");
        b.removeAttribute("aria-current");
        b.style.background = "#222";
        b.style.color = "#fff";
      }
    });
    
    // Mark generators button as selected
    generatorsBtn.classList.add("selected");
    generatorsBtn.setAttribute("aria-current", "page");
    generatorsBtn.style.background = "#2563eb";
    generatorsBtn.style.color = "#fff";
    
    loadModule(file);
    generatorsDropdown.style.display = "none";
  };
  
  generatorsDropdown.appendChild(option);
});

// Initial theme setup
updateGeneratorsDropdownTheme();

generatorsBtn.onmouseover = () => {
  if (!generatorsBtn.classList.contains("selected")) generatorsBtn.style.background = "#333";
};
generatorsBtn.onmouseout = () => {
  if (!generatorsBtn.classList.contains("selected")) generatorsBtn.style.background = "#222";
};

// Toggle generators dropdown
generatorsBtn.onclick = (e) => {
  e.stopPropagation();
  const isOpen = generatorsDropdown.style.display === "block";
  generatorsDropdown.style.display = isOpen ? "none" : "block";
  
  // Don't change the button state when just opening/closing dropdown
  // Only change state when an option is actually selected
};

generatorsContainer.appendChild(generatorsBtn);
generatorsContainer.appendChild(generatorsDropdown);
nav.appendChild(generatorsContainer);

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
  updateGeneratorsDropdownTheme();
}

// Apply initial dark mode state
if (isDarkMode()) {
  document.body.classList.add("dark");
}
updateDarkModeText();
updateGeneratorsDropdownTheme(); // Apply initial theme to generators dropdown

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
document.addEventListener("click", (e) => {
  // Close main menu dropdown
  if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
  // Close generators dropdown  
  if (!generatorsContainer.contains(e.target)) {
    generatorsDropdown.style.display = "none";
  }
});

dropdown.appendChild(darkModeOption);
menuContainer.appendChild(menuBtn);
menuContainer.appendChild(dropdown);
nav.appendChild(menuContainer);

// Load default first module (Dice)
loadModule(modules[0].file);

async function loadModule(path) {
  try {
    console.log("Loading module:", path, "Current module:", currentModulePath);
    
    // Save current module state before switching
    if (currentModulePath && window.saveState) {
      console.log("Saving state for:", currentModulePath);
      const state = window.saveState();
      console.log("Saved state:", state);
      if (state) {
        moduleStates.set(currentModulePath, state);
        console.log("State stored for:", currentModulePath);
      }
    }
    
    // Clear previous state functions
    window.saveState = null;
    window.restoreState = null;
    
    // Check if we're returning to a module with saved state
    const hasState = moduleStates.has(path);
    console.log("Module has saved state:", hasState);
    if (hasState) {
      console.log("Saved state for", path, ":", moduleStates.get(path));
    }
    
    // Import and mount the module
    const mod = await import(path);
    console.log("Imported module for", path, ":", mod, "mount:", mod.mount);
    if (typeof mod.mount !== "function") {
      throw new Error(`Module at ${path} does not export a 'mount' function.`);
    }
    
    // Mount the new module
    mod.mount(root);
    
    // Update current module path
    currentModulePath = path;
    
    // Restore state if available and restore function exists
    if (hasState) {
      const state = moduleStates.get(path);
      if (state) {
        console.log("Waiting to restore state...");
        setTimeout(() => {
          console.log("Attempting to restore state, restoreState function exists:", !!window.restoreState);
          if (window.restoreState) {
            console.log("Restoring state:", state);
            window.restoreState(state);
          } else {
            console.log("No restoreState function available");
          }
        }, 20); // Faster restoration - after persistence functions are set up at 10ms
      }
    }
    
  } catch (e) {
    console.error("Failed to load module:", path, e);
    root.innerHTML = `<div style=\"color:red\">Failed to load module: ${path}<br>${e.message}</div>`;
  }
}
