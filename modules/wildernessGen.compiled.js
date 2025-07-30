// modules/wildernessGen.compiled.js - FORGE Wilderness Generator Module
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";

// Helper Utilities
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const d6 = () => Math.floor(Math.random() * 6) + 1;
const roll2d6 = () => d6() + d6();

// Weather Generation Tables
const weatherTables = {
  "Wet Season": {
    2: "Sleet, wind",
    3: "Sleet, wind",
    4: "Fog, still",
    5: "Fog, still",
    6: "Light rain",
    7: "Clear, chilly",
    8: "Steady rain",
    9: "Cold, wind",
    10: "Cold, wind",
    11: "Rainstorm",
    12: "Rainstorm"
  },
  "Dry Season": {
    2: "Cool, wind",
    3: "Cool, wind",
    4: "Light rain",
    5: "Light rain",
    6: "Overcast, humid",
    7: "Clear, warm",
    8: "Hot, wind",
    9: "Boiling, still",
    10: "Boiling, still",
    11: "Thunderstorm",
    12: "Thunderstorm"
  },
  "Cold Season": {
    2: "Hail, wind",
    3: "Hail, wind",
    4: "Icy mist, still",
    5: "Icy mist, still",
    6: "Icy wind, dry",
    7: "Clear, cold",
    8: "Light snow",
    9: "Steady snow",
    10: "Steady snow",
    11: "Snowstorm",
    12: "Snowstorm"
  }
};

// Main Wilderness Generator Component
function WildernessGenerator() {
  const [wilderness, setWilderness] = React.useState(() => {
    try {
      const saved = localStorage.getItem('wilderness-data');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading wilderness data from localStorage:', error);
      return null;
    }
  });

  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));
  
  const [selectedSeason, setSelectedSeason] = React.useState(() => {
    try {
      const saved = localStorage.getItem('wilderness-season');
      return saved ? JSON.parse(saved) : "Wet Season";
    } catch (error) {
      console.error('Error loading season from localStorage:', error);
      return "Wet Season";
    }
  });

  const [showRollAnimation, setShowRollAnimation] = React.useState(false);
  const [showWeatherDropdown, setShowWeatherDropdown] = React.useState(() => {
    // Show dropdown by default if no weather exists, otherwise show results
    try {
      const saved = localStorage.getItem('wilderness-data');
      const savedData = saved ? JSON.parse(saved) : null;
      return !savedData?.weather; // Show dropdown if no weather exists
    } catch (error) {
      return true; // Default to showing dropdown
    }
  });

  // Save wilderness data to localStorage whenever it changes
  React.useEffect(() => {
    if (wilderness) {
      localStorage.setItem('wilderness-data', JSON.stringify(wilderness));
    }
  }, [wilderness]);

  // Save selected season to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedSeason) {
      localStorage.setItem('wilderness-season', JSON.stringify(selectedSeason));
    }
  }, [selectedSeason]);

  // Dark mode detection
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setDarkMode(document.body.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Roll animation trigger function
  const triggerRollAnimation = () => {
    setShowRollAnimation(true);
    setTimeout(() => setShowRollAnimation(false), 500);
  };

  // Roll animation popup (same as Quest Generator)
  React.useEffect(() => {
    if (showRollAnimation) {
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        border: 2px solid white;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      `;
      popup.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border: 3px solid #333;
          border-top: 3px solid #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <span style="font-size: 16px; font-weight: bold;">Rolling...</span>
      `;
      
      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(popup);
      
      setTimeout(() => {
        document.body.removeChild(popup);
        document.head.removeChild(style);
      }, 500);
    }
  }, [showRollAnimation]);

  // Weather Generation Function
  const generateWeather = (skipAnimation = false) => {
    // Trigger roll animation first (unless skipping for restoration)
    if (!skipAnimation) {
      triggerRollAnimation();
    }
    
    // Delay the actual weather generation until after the popup disappears
    setTimeout(() => {
      const die1 = d6();
      const die2 = d6();
      const total = die1 + die2;
      const weather = weatherTables[selectedSeason][total];
      
      const weatherData = {
        season: selectedSeason,
        roll: total,
        result: weather,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setWilderness(prev => ({
        ...prev,
        weather: weatherData
      }));
      
      // Hide dropdown and show results after generating
      setShowWeatherDropdown(false);
    }, skipAnimation ? 50 : 500); // Match the popup duration or use shorter delay
  };

  const rerollWeather = () => {
    generateWeather();
  };

  const toggleWeatherView = () => {
    setShowWeatherDropdown(v => !v);
  };

  return React.createElement("div", {
    className: "w-full max-w-3xl space-y-4"
  }, [
    React.createElement(Card, {
      key: "main-card"
    }, [
      React.createElement(CardHeader, {
        key: "card-header"
      }, React.createElement("div", {
        key: "header-content",
        className: "flex items-center gap-3"
      }, [
        React.createElement("img", {
          key: "favicon",
          src: "favicon.ico",
          alt: "Forge Favicon",
          style: {
            width: 32,
            height: 32
          }
        }),
        React.createElement(CardTitle, {
          key: "card-title"
        }, "FORGE Wilderness Generator")
      ])),
      React.createElement(CardContent, {
        key: "card-content"
      }, React.createElement("div", {
        className: "space-y-6"
      }, [
        // Description
        React.createElement("p", {
          key: "description",
          className: darkMode ? "text-center text-white" : "text-center text-gray-600"
        }, !wilderness?.weather && showWeatherDropdown ? "Select a season and click \"Generate\" to begin." : ""),

        // Weather Field (always visible, either showing dropdown or results)
        React.createElement("div", {
          key: "weather-field"
        }, [
          React.createElement("div", {
            key: "weather-header",
            className: "flex items-center gap-2 mb-1"
          }, [
            React.createElement("span", {
              key: "weather-label",
              className: "text-xs text-gray-500"
            }, "Weather"),
            // Only show "..." button if weather exists AND we're showing results
            wilderness?.weather && !showWeatherDropdown && React.createElement("button", {
              key: "weather-dropdown-btn",
              className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
              onClick: toggleWeatherView,
              style: { fontSize: "0.75rem" }
            }, "...")
          ]),
          showWeatherDropdown ? React.createElement("div", {
            key: "weather-dropdown",
            className: "flex items-center gap-2"
          }, [
            React.createElement("select", {
              key: "season-select",
              value: selectedSeason,
              onChange: (e) => setSelectedSeason(e.target.value),
              className: `px-3 py-2 border rounded-md font-medium ${
                darkMode 
                  ? "bg-gray-800 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              }`
            }, [
              React.createElement("option", { key: "wet", value: "Wet Season" }, "Wet Season"),
              React.createElement("option", { key: "dry", value: "Dry Season" }, "Dry Season"),
              React.createElement("option", { key: "cold", value: "Cold Season" }, "Cold Season")
            ]),
            React.createElement("button", {
              key: "generate-btn",
              className: "px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700",
              onClick: () => generateWeather()
            }, "Generate")
          ]) : wilderness?.weather && React.createElement("div", {
            key: "weather-value",
            className: "font-semibold"
          }, [
            React.createElement("div", {
              key: "weather-result-text"
            }, wilderness.weather.result),
            React.createElement("div", {
              key: "weather-season",
              className: "text-sm text-gray-500 mt-1"
            }, `(${wilderness.weather.season})`)
          ])
        ])
      ]))
    ])
  ]);
}

// Mount function for module loading
function mount(root) {
  if (!root) return;
  
  // Clear content first to avoid React DOM conflicts
  root.innerHTML = "";
  
  // Clean up previous React root properly
  if (root._reactRoot) {
    try {
      root._reactRoot.unmount();
    } catch (e) {
      console.log("React unmount completed (some errors expected)");
    }
    root._reactRoot = null;
  }
  if (root._reactRootContainer) {
    root._reactRootContainer = null;
  }
  
  // Create fresh React root
  root._reactRoot = window.ReactDOM.createRoot(root);
  root._reactRoot.render(window.React.createElement(WildernessGenerator));
  
  // Set up state persistence functions
  setTimeout(() => {
    console.log("Setting up Wilderness Generator state persistence functions");
    
    window.saveState = () => {
      console.log("Wilderness saveState called");
      return null; // No state persistence needed for now
    };
    
    window.restoreState = (state) => {
      console.log("Wilderness restoreState called with:", state);
      // No state restoration needed for now
    };
    
    console.log("Wilderness Generator state persistence functions set up");
  }, 10);
}

export { mount };
