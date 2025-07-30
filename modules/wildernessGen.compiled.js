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
  const [showWeatherDropdown, setShowWeatherDropdown] = React.useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = React.useState(false);
  const [showSeasonInfo, setShowSeasonInfo] = React.useState(false);

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

  // Auto-show dropdown on mount if no weather exists
  React.useEffect(() => {
    console.log("WildernessGen auto-roll effect - weather:", !!wilderness?.weather);
    
    // Auto-roll on mount if no weather exists (similar to other generators)
    const timeoutId = setTimeout(() => {
      if (!wilderness?.weather) {
        console.log("WildernessGen: Auto-rolling new weather");
        generateWeather();
      } else {
        console.log("WildernessGen: Skipping auto-roll, weather exists");
      }
    }, 150); // Delay to let restoration complete first
    
    return () => clearTimeout(timeoutId);
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
    }, skipAnimation ? 50 : 500); // Match the popup duration or use shorter delay
  };

  const rerollWeather = () => {
    generateWeather();
  };

  const rerollSeason = () => {
    const seasons = ["Wet Season", "Dry Season", "Cold Season"];
    const newSeason = pick(seasons);
    setSelectedSeason(newSeason);
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
      }, [
        React.createElement("div", {
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
        ]),
        React.createElement("button", {
          key: "generate-btn",
          className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2",
          onClick: () => generateWeather()
        }, "Generate")
      ]),
      React.createElement(CardContent, {
        key: "card-content"
      }, React.createElement("div", {
        className: "space-y-6"
      }, [
        // Description
        React.createElement("p", {
          key: "description",
          className: darkMode ? "text-center text-white" : "text-center text-gray-600"
        }, !wilderness?.weather ? "Click \"Generate\" to begin." : ""),

        // Weather Fields (directly in CardContent like Quest generator)
        wilderness && React.createElement("div", {
          key: "weather-fields",
          className: "space-y-4"
        }, [
          // 2x1 Grid for weather fields
          React.createElement("div", {
            key: "weather-grid",
            className: "grid grid-cols-2 gap-4"
          }, [
            // Season Field (left)
            React.createElement("div", {
              key: "season-field"
            }, [
              React.createElement("div", {
                key: "season-header",
                className: "flex items-center gap-2 mb-1"
              }, [
                React.createElement("span", {
                  key: "season-label",
                  className: "text-xs text-gray-500"
                }, "Season"),
                React.createElement("button", {
                  key: "season-info-btn",
                  className: "w-4 h-4 rounded-full bg-blue-500 text-white text-xs hover:bg-blue-600 flex items-center justify-center",
                  onClick: () => setShowSeasonInfo(true),
                  style: { fontSize: "0.6rem", fontWeight: "bold" },
                  title: "Season Information"
                }, "i"),
                React.createElement("button", {
                  key: "season-dropdown-btn",
                  className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  onClick: () => setShowSeasonDropdown(v => !v),
                  style: { fontSize: "0.75rem" }
                }, "..."),
                showSeasonDropdown && React.createElement("button", {
                  key: "season-reroll-btn",
                  className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  style: {
                    fontSize: "0.75rem",
                    height: "25px",
                    width: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginLeft: "4px"
                  },
                  type: "button",
                  onMouseDown: e => e.preventDefault(),
                  onClick: rerollSeason,
                  tabIndex: -1
                }, React.createElement("img", {
                  src: "./d6.png",
                  alt: "Reroll",
                  style: {
                    width: "25px",
                    height: "25px",
                    filter: darkMode ? "invert(1)" : "none"
                  }
                }))
              ]),
              showSeasonDropdown ? React.createElement("div", {
                key: "season-dropdown",
                className: "flex items-center gap-2"
              }, React.createElement("select", {
                value: selectedSeason,
                onChange: (e) => setSelectedSeason(e.target.value),
                className: "border rounded px-1 py-0.5 text-sm",
                autoFocus: true,
                onBlur: () => setShowSeasonDropdown(false)
              }, [
                React.createElement("option", { key: "wet", value: "Wet Season" }, "Wet Season"),
                React.createElement("option", { key: "dry", value: "Dry Season" }, "Dry Season"),
                React.createElement("option", { key: "cold", value: "Cold Season" }, "Cold Season")
              ])) : React.createElement("div", {
                key: "season-value",
                className: "font-semibold"
              }, selectedSeason)
            ]),

            // Weather Field (right)
            wilderness?.weather && React.createElement("div", {
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
                React.createElement("button", {
                  key: "weather-dropdown-btn",
                  className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  onClick: toggleWeatherView,
                  style: { fontSize: "0.75rem" }
                }, "..."),
                showWeatherDropdown && React.createElement("button", {
                  key: "weather-reroll-btn",
                  className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  style: {
                    fontSize: "0.75rem",
                    height: "25px",
                    width: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginLeft: "4px"
                  },
                  type: "button",
                  onMouseDown: e => e.preventDefault(),
                  onClick: rerollWeather,
                  tabIndex: -1
                }, React.createElement("img", {
                  src: "./d6.png",
                  alt: "Reroll",
                  style: {
                    width: "25px",
                    height: "25px",
                    filter: darkMode ? "invert(1)" : "none"
                  }
                }))
              ]),
              showWeatherDropdown ? React.createElement("div", {
                key: "weather-dropdown",
                className: "flex items-center gap-2"
              }, React.createElement("select", {
                value: wilderness.weather.result,
                onChange: (e) => {
                  // Find which roll corresponds to this weather result in the current season
                  const weatherTable = weatherTables[selectedSeason];
                  let foundRoll = 7; // default
                  for (const [roll, weather] of Object.entries(weatherTable)) {
                    if (weather === e.target.value) {
                      foundRoll = parseInt(roll);
                      break;
                    }
                  }
                  setWilderness(prev => ({
                    ...prev,
                    weather: {
                      ...prev.weather,
                      result: e.target.value,
                      roll: foundRoll,
                      season: selectedSeason
                    }
                  }));
                },
                className: "border rounded px-1 py-0.5 text-sm",
                autoFocus: true,
                onBlur: () => setShowWeatherDropdown(false)
              }, Object.values(weatherTables[selectedSeason]).filter((value, index, self) => self.indexOf(value) === index).map(weather => 
                React.createElement("option", { key: weather, value: weather }, weather)
              ))) : React.createElement("div", {
                key: "weather-value",
                className: "font-semibold"
              }, wilderness.weather.result)
            ])
          ])
        ])
      ]))
    ]),

    // Season Info Popup Modal
    showSeasonInfo && React.createElement("div", {
      key: "season-info-modal",
      className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
      onClick: () => setShowSeasonInfo(false)
    }, React.createElement("div", {
      className: `${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md mx-4 relative`,
      onClick: (e) => e.stopPropagation()
    }, [
      React.createElement("h3", {
        key: "modal-title",
        className: `text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`
      }, "Season Information"),
      React.createElement("div", {
        key: "modal-content",
        className: `text-sm leading-relaxed mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`
      }, [
        React.createElement("p", {
          key: "season-info-text"
        }, "Season will not change when \"Generate\" is pressed."),
        React.createElement("p", {
          key: "season-info-text-2",
          className: "mt-2"
        }, "In order to randomly choose another Season, click \"...\" followed by the Dice icon.")
      ]),
      React.createElement("button", {
        key: "modal-close",
        className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
        onClick: () => setShowSeasonInfo(false)
      }, "Close")
    ]))
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
