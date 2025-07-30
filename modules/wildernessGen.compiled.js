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

// Terrain Generation Tables
const terrainTypes = ["Plains", "Hills", "Forest", "Swamp", "Desert", "Mountain"];

const nextTerrainTables = {
  "Plains": {
    2: "Swamp", 3: "Swamp", 4: "Swamp",
    5: "Hills", 6: "Hills",
    7: "Plains", 8: "Plains",
    9: "Forest", 10: "Forest",
    11: "Desert", 12: "Desert"
  },
  "Hills": {
    2: "Plains", 3: "Plains", 4: "Plains",
    5: "Forest", 6: "Forest",
    7: "Hills", 8: "Hills",
    9: "Mountain", 10: "Mountain",
    11: "Desert", 12: "Desert"
  },
  "Forest": {
    2: "Hills", 3: "Hills", 4: "Hills",
    5: "Swamp", 6: "Swamp",
    7: "Forest", 8: "Forest",
    9: "Plains", 10: "Plains",
    11: "Mountain", 12: "Mountain"
  },
  "Swamp": {
    2: "Hills", 3: "Hills", 4: "Hills",
    5: "Plains", 6: "Plains",
    7: "Swamp", 8: "Swamp",
    9: "Forest", 10: "Forest",
    11: "Mountain", 12: "Mountain"
  },
  "Desert": {
    2: "Forest", 3: "Forest", 4: "Forest",
    5: "Hills", 6: "Hills",
    7: "Desert", 8: "Desert",
    9: "Plains", 10: "Plains",
    11: "Mountain", 12: "Mountain"
  },
  "Mountain": {
    2: "Plains", 3: "Plains", 4: "Plains",
    5: "Hills", 6: "Hills",
    7: "Mountain", 8: "Mountain",
    9: "Forest", 10: "Forest",
    11: "Desert", 12: "Desert"
  }
};

// Main Wilderness Generator Component
function WildernessGenerator() {
  const [wilderness, setWilderness] = React.useState(() => {
    try {
      const saved = localStorage.getItem('wilderness-data');
      const hasBeenUsed = localStorage.getItem('wilderness-has-been-used');
      
      // If never been used before, return null to trigger first-time generation
      if (!hasBeenUsed) {
        return null;
      }
      
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
      return saved ? JSON.parse(saved) : "Dry Season";
    } catch (error) {
      console.error('Error loading season from localStorage:', error);
      return "Dry Season";
    }
  });

  const [selectedThisTerrain, setSelectedThisTerrain] = React.useState(() => {
    try {
      const saved = localStorage.getItem('wilderness-this-terrain');
      return saved ? JSON.parse(saved) : "Plains";
    } catch (error) {
      console.error('Error loading this terrain from localStorage:', error);
      return "Plains";
    }
  });

  const [showRollAnimation, setShowRollAnimation] = React.useState(false);
  const [showWeatherDropdown, setShowWeatherDropdown] = React.useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = React.useState(false);
  const [showSeasonInfo, setShowSeasonInfo] = React.useState(false);
  const [showThisTerrainDropdown, setShowThisTerrainDropdown] = React.useState(false);
  const [showNextTerrainDropdown, setShowNextTerrainDropdown] = React.useState(false);
  const [showCurrentTerrainInfo, setShowCurrentTerrainInfo] = React.useState(false);

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

  // Save selected this terrain to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedThisTerrain) {
      localStorage.setItem('wilderness-this-terrain', JSON.stringify(selectedThisTerrain));
    }
  }, [selectedThisTerrain]);

  // Auto-regenerate weather when season changes (after initial load)
  React.useEffect(() => {
    if (wilderness?.weather && selectedSeason) {
      console.log("Season changed, regenerating weather for:", selectedSeason);
      generateWeather(true); // Skip animation for automatic updates
    }
  }, [selectedSeason]);

  // Auto-regenerate next terrain when current terrain changes (after initial load)
  React.useEffect(() => {
    if (wilderness?.nextTerrain && selectedThisTerrain) {
      console.log("Current terrain changed, regenerating next terrain for:", selectedThisTerrain);
      generateTerrain(true, true); // Skip animation and keep dropdowns open for automatic updates
    }
  }, [selectedThisTerrain]);

  // Save wilderness data to localStorage whenever it changes
  React.useEffect(() => {
    if (wilderness) {
      try {
        localStorage.setItem('wilderness-data', JSON.stringify(wilderness));
        // Mark that the wilderness module has been used
        localStorage.setItem('wilderness-has-been-used', 'true');
      } catch (error) {
        console.error('Error saving wilderness data to localStorage:', error);
      }
    }
  }, [wilderness]);

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

  // Store current state globally for saveState function to access
  React.useEffect(() => {
    window._currentWildernessState = {
      wilderness,
      selectedSeason,
      selectedThisTerrain
    };
  });

  // Preserve state on unmount for saveState to access
  React.useEffect(() => {
    return () => {
      // Keep a copy of the state for saveState to use after unmount
      if (window._currentWildernessState) {
        window._preservedWildernessState = { ...window._currentWildernessState };
      }
    };
  }, []);

  // Auto-show dropdown on mount if no weather exists
  React.useEffect(() => {
    console.log("WildernessGen auto-roll effect - weather:", !!wilderness?.weather, ", nextTerrain:", !!wilderness?.nextTerrain);
    
    // Check for pending state restoration first
    if (window._pendingWildernessState) {
      console.log("WildernessGen: Restoring pending state:", window._pendingWildernessState);
      const pendingState = window._pendingWildernessState;
      
      // Restore wilderness data
      if (pendingState.wilderness) {
        setWilderness(pendingState.wilderness);
      }
      
      // Restore selected season
      if (pendingState.selectedSeason) {
        setSelectedSeason(pendingState.selectedSeason);
      }
      
      // Restore selected terrain
      if (pendingState.selectedThisTerrain) {
        setSelectedThisTerrain(pendingState.selectedThisTerrain);
      }
      
      // Clear the pending state
      window._pendingWildernessState = null;
      console.log("WildernessGen: State restoration completed");
      return;
    }
    
    // Auto-roll on mount if no weather exists (similar to other generators)
    const timeoutId = setTimeout(() => {
      console.log("WildernessGen: Checking auto-roll conditions - wilderness:", wilderness, "weather:", wilderness?.weather, "nextTerrain:", wilderness?.nextTerrain);
      if (!wilderness?.weather || !wilderness?.nextTerrain) {
        console.log("WildernessGen: Auto-rolling new wilderness features with animation");
        generateWilderness(false); // Explicitly show animation on first load
      } else {
        console.log("WildernessGen: Skipping auto-roll, all features exist");
      }
    }, 150); // Delay to let restoration complete first
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Roll animation trigger function
  const triggerRollAnimation = () => {
    console.log("WildernessGen: triggerRollAnimation called - setting showRollAnimation to true");
    setShowRollAnimation(true);
    setTimeout(() => {
      console.log("WildernessGen: triggerRollAnimation timeout - setting showRollAnimation to false");
      setShowRollAnimation(false);
    }, 500);
  };

  // Roll animation popup (same as Quest Generator)
  React.useEffect(() => {
    console.log("WildernessGen: showRollAnimation useEffect triggered, showRollAnimation:", showRollAnimation);
    if (showRollAnimation) {
      console.log("WildernessGen: Creating rolling popup");
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
    generateWeather(true); // Skip animation for manual rerolls
  };

  const rerollSeason = () => {
    const seasons = ["Wet Season", "Dry Season", "Cold Season"];
    const newSeason = pick(seasons);
    setSelectedSeason(newSeason);
  };

  // Terrain Generation Functions
  const generateTerrain = (skipAnimation = false, keepDropdowns = false) => {
    if (!skipAnimation) {
      triggerRollAnimation();
    }
    
    // Only close dropdowns if not requested to keep them open
    if (!keepDropdowns) {
      setShowThisTerrainDropdown(false);
      setShowNextTerrainDropdown(false);
    }
    
    // Delay the actual terrain generation until after the popup disappears
    setTimeout(() => {
      const die1 = d6();
      const die2 = d6();
      const total = die1 + die2;
      
      // Use the selected "current terrain" to determine next terrain
      const nextTerrainTable = nextTerrainTables[selectedThisTerrain];
      const nextTerrain = nextTerrainTable[total];
      
      const terrainData = {
        nextTerrain: nextTerrain,
        roll: total,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setWilderness(prev => ({
        ...prev,
        nextTerrain: terrainData.nextTerrain,
        terrainRoll: terrainData.roll
      }));
    }, skipAnimation ? 50 : 500); // Match the popup duration or use shorter delay
  };

  const rerollTerrain = () => {
    generateTerrain(true, false); // Skip animation but close dropdowns for manual rerolls
  };

  const rerollNextTerrain = () => {
    // For Next Hex Terrain reroll, keep the dropdown open (like Current Terrain Type)
    const die1 = d6();
    const die2 = d6();
    const total = die1 + die2;
    
    // Use the selected "current terrain" to determine next terrain
    const nextTerrainTable = nextTerrainTables[selectedThisTerrain];
    const nextTerrain = nextTerrainTable[total];
    
    setWilderness(prev => ({
      ...prev,
      nextTerrain: nextTerrain,
      terrainRoll: total
    }));
    // Keep dropdown open after reroll
  };

  const rerollCurrentTerrain = () => {
    const newTerrain = pick(terrainTypes);
    setSelectedThisTerrain(newTerrain);
    // Keep dropdown open after reroll (like Season does)
  };

  // Helper function to get possible next terrain types based on current terrain
  const getPossibleNextTerrains = (currentTerrain) => {
    if (!nextTerrainTables[currentTerrain]) return terrainTypes;
    
    const transitionTable = nextTerrainTables[currentTerrain];
    const possibleTerrains = new Set();
    
    // Get all unique terrain types that can be rolled from the current terrain
    Object.values(transitionTable).forEach(terrain => {
      possibleTerrains.add(terrain);
    });
    
    return Array.from(possibleTerrains).sort();
  };

  // Combined generation function
  const generateWilderness = (skipAnimation = false) => {
    generateWeather(skipAnimation);
    generateTerrain(skipAnimation);
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
          onClick: () => generateWilderness()
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
        }, !wilderness?.weather || !wilderness?.nextTerrain ? "Click \"Generate\" to begin." : ""),

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
          ]),

          // 2x2 Grid for terrain fields (second row)
          React.createElement("div", {
            key: "terrain-grid",
            className: "grid grid-cols-2 gap-4"
          }, [
            // Current Terrain Type Field (left)
            React.createElement("div", {
              key: "this-terrain-field"
            }, [
              React.createElement("div", {
                key: "this-terrain-header",
                className: "flex items-center gap-2 mb-1"
              }, [
                React.createElement("span", {
                  key: "this-terrain-label",
                  className: "text-xs text-gray-500"
                }, "Current Terrain Type"),
                React.createElement("button", {
                  key: "current-terrain-info-btn",
                  className: "w-4 h-4 rounded-full bg-blue-500 text-white text-xs hover:bg-blue-600 flex items-center justify-center",
                  onClick: () => setShowCurrentTerrainInfo(true),
                  style: { fontSize: "0.6rem", fontWeight: "bold" },
                  title: "Current Terrain Type Information"
                }, "i"),
                React.createElement("button", {
                  key: "this-terrain-dropdown-btn",
                  className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  onClick: () => setShowThisTerrainDropdown(v => !v),
                  style: { fontSize: "0.75rem" }
                }, "...")
              ]),
              showThisTerrainDropdown ? React.createElement("div", {
                key: "this-terrain-dropdown",
                className: "flex items-center gap-2"
              }, [
                React.createElement("select", {
                  value: selectedThisTerrain,
                  onChange: (e) => setSelectedThisTerrain(e.target.value),
                  className: "border rounded px-1 py-0.5 text-sm",
                  autoFocus: true,
                  onBlur: () => setShowThisTerrainDropdown(false)
                }, terrainTypes.map(terrain => 
                  React.createElement("option", { key: terrain, value: terrain }, terrain)
                )),
                React.createElement("button", {
                  key: "this-terrain-reroll-btn",
                  className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  style: {
                    fontSize: "0.75rem",
                    height: "25px",
                    width: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0
                  },
                  type: "button",
                  onMouseDown: e => e.preventDefault(),
                  onClick: rerollCurrentTerrain,
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
              ]) : React.createElement("div", {
                key: "this-terrain-value",
                className: "font-semibold"
              }, selectedThisTerrain)
            ]),

            // Next Hex Terrain Type Field (right)
            wilderness?.nextTerrain && React.createElement("div", {
              key: "next-terrain-field"
            }, [
              React.createElement("div", {
                key: "next-terrain-header",
                className: "flex items-center gap-2 mb-1"
              }, [
                React.createElement("span", {
                  key: "next-terrain-label",
                  className: "text-xs text-gray-500"
                }, "Next Hex Terrain Type"),
                React.createElement("button", {
                  key: "next-terrain-dropdown-btn",
                  className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  onClick: () => setShowNextTerrainDropdown(v => !v),
                  style: { fontSize: "0.75rem" }
                }, "...")
              ]),
              showNextTerrainDropdown ? React.createElement("div", {
                key: "next-terrain-dropdown",
                className: "flex items-center gap-2"
              }, [
                React.createElement("select", {
                  value: wilderness.nextTerrain,
                  onChange: (e) => {
                    setWilderness(prev => ({
                      ...prev,
                      nextTerrain: e.target.value
                    }));
                  },
                  className: "border rounded px-1 py-0.5 text-sm",
                  autoFocus: true,
                  onBlur: () => setShowNextTerrainDropdown(false)
                }, getPossibleNextTerrains(selectedThisTerrain).map(terrain => 
                  React.createElement("option", { key: terrain, value: terrain }, terrain)
                )),
                React.createElement("button", {
                  key: "next-terrain-reroll-btn",
                  className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                  style: {
                    fontSize: "0.75rem",
                    height: "25px",
                    width: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0
                  },
                  type: "button",
                  onMouseDown: e => e.preventDefault(),
                  onClick: rerollNextTerrain,
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
              ]) : React.createElement("div", {
                key: "next-terrain-value",
                className: "font-semibold"
              }, wilderness.nextTerrain)
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
    ])),

    // Current Terrain Type Info Popup Modal
    showCurrentTerrainInfo && React.createElement("div", {
      key: "current-terrain-info-modal",
      className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
      onClick: () => setShowCurrentTerrainInfo(false)
    }, React.createElement("div", {
      className: `${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md mx-4 relative`,
      onClick: (e) => e.stopPropagation()
    }, [
      React.createElement("h3", {
        key: "modal-title",
        className: `text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`
      }, "Current Terrain Type Information"),
      React.createElement("div", {
        key: "modal-content",
        className: `text-sm leading-relaxed mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`
      }, [
        React.createElement("p", {
          key: "terrain-info-text"
        }, "Current Terrain Type will not change when \"Generate\" is pressed."),
        React.createElement("p", {
          key: "terrain-info-text-2",
          className: "mt-2"
        }, "In order to randomly choose another Current Terrain Type, click \"...\" followed by the Dice icon.")
      ]),
      React.createElement("button", {
        key: "modal-close",
        className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
        onClick: () => setShowCurrentTerrainInfo(false)
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
      
      // First try current state, then fall back to preserved state
      const currentState = window._currentWildernessState || window._preservedWildernessState;
      if (!currentState) {
        console.log("No current wilderness state available");
        return null;
      }
      
      const { wilderness, selectedSeason, selectedThisTerrain } = currentState;
      
      console.log("Wilderness state to save:", { wilderness, selectedSeason, selectedThisTerrain });
      
      // Only save if there's actual wilderness data
      if (wilderness || selectedSeason || selectedThisTerrain) {
        return {
          wildernessData: currentState,
          timestamp: Date.now()
        };
      }
      return null;
    };
    
    window.restoreState = (state) => {
      console.log("Wilderness restoreState called with:", state);
      if (state && state.wildernessData) {
        console.log("Wilderness Generator restoring state");
        
        const wildernessState = state.wildernessData;
        
        // Store the state for immediate pickup during component initialization
        window._pendingWildernessState = wildernessState;
        
        // Don't re-render, just mount a fresh component that will pick up the pending state
        if (root._reactRoot) {
          // Unmount current component
          root._reactRoot.unmount();
          root._reactRoot = null;
          
          // Create new root and mount with pending state
          setTimeout(() => {
            root._reactRoot = window.ReactDOM.createRoot(root);
            root._reactRoot.render(window.React.createElement(WildernessGenerator));
          }, 5); // Reduced delay for faster restoration
        } else {
          console.log("No React root available for Wilderness restoration");
        }
      } else {
        console.log("No valid Wilderness state to restore");
      }
    };
    
    console.log("Wilderness Generator state persistence functions set up");
  }, 10); // Much faster setup - must be faster than main.js restoration delay
}

export { mount };
