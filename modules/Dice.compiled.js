// Dice.compiled.js - FORGE Dice Roller Module (Compiled for browser)
// A comprehensive dice rolling system for tabletop gaming

// Import UI components
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";

// Utility functions
const d6 = () => Math.floor(Math.random() * 6) + 1;
const dX = (sides) => Math.floor(Math.random() * sides) + 1;
const rollMultiple = (count, sides) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(dX(sides));
  }
  return results;
};

// Common dice types
const commonDice = [
  { name: "d4", sides: 4, image: "d4.png" },
  { name: "d6", sides: 6, image: "d6_2.png" },
  { name: "d8", sides: 8, image: "d8.png" },
  { name: "d10", sides: 10, image: "d10_2.png" },
  { name: "d12", sides: 12, image: "d12.png" },
  { name: "d20", sides: 20, image: "d20.png" },
  { name: "d100", sides: 100, image: "d10_3.png" } // Using d10_3 image for d100
];

// Main Dice component
function Dice() {
  // Store pending state reference to use for all state initializations
  const pendingState = window._pendingDiceState;
  
  // Initialize state with pending restoration if available
  const [diceTray, setDiceTray] = React.useState(() => {
    // Check for pending state on initialization
    if (pendingState && pendingState.diceTray) {
      return pendingState.diceTray;
    }
    try {
      const saved = localStorage.getItem('dice-tray');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading dice tray from localStorage:', error);
      return {};
    }
  });
  const [lastRoll, setLastRoll] = React.useState(() => {
    // Check for pending state on initialization
    if (pendingState && pendingState.lastRoll) {
      const restored = pendingState.lastRoll;
      return restored;
    }
    return null;
  });
  const [rollHistory, setRollHistory] = React.useState(() => {
    try {
      const saved = localStorage.getItem('dice-history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading dice history from localStorage:', error);
      return [];
    }
  });
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));
  const [showRollAnimation, setShowRollAnimation] = React.useState(false);

  // Clear pending state after all initializations are complete
  React.useEffect(() => {
    if (window._pendingDiceState === pendingState && pendingState) {
      console.log("Clearing pending dice state after initialization");
      window._pendingDiceState = null;
    }
  }, []);

  // Check for pending state restoration on mount (backup - should not be needed now)
  React.useEffect(() => {
    if (window._pendingDiceState && !pendingState) {
      console.log("Restoring pending dice state (backup):", window._pendingDiceState);
      const backupPendingState = window._pendingDiceState;
      
      if (backupPendingState.diceTray) {
        setDiceTray(backupPendingState.diceTray);
      }
      if (backupPendingState.lastRoll) {
        setLastRoll(backupPendingState.lastRoll);
      }
      
      // Clear the pending state
      delete window._pendingDiceState;
    }
  }, []);

  // Store current state globally for saveState function to access
  React.useEffect(() => {
    window._currentDiceState = {
      diceTray,
      lastRoll
    };
    
    // Provide direct update function for faster restoration
    window._currentDiceUpdate = (state) => {
      console.log("Direct dice update with:", state);
      if (state.diceTray) {
        setDiceTray(state.diceTray);
      }
      if (state.lastRoll) {
        setLastRoll(state.lastRoll);
      }
      // Clear pending state after successful update
      window._pendingDiceState = null;
    };
  }, [diceTray, lastRoll]);
  
  // Clean up update function on unmount
  React.useEffect(() => {
    return () => {
      window._currentDiceUpdate = null;
    };
  }, []);

  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('dice-history', JSON.stringify(rollHistory));
    } catch (error) {
      console.error('Error saving dice history to localStorage:', error);
    }
  }, [rollHistory]);
  
  // Preserve state on unmount for saveState to access
  React.useEffect(() => {
    return () => {
      // Keep a copy of the state for saveState to use after unmount
      if (window._currentDiceState) {
        window._preservedDiceState = { ...window._currentDiceState };
      }
    };
  }, []);

  // Listen for dark mode changes
  React.useEffect(() => {
    const handleDarkModeChange = () => {
      setDarkMode(document.body.classList.contains("dark"));
    };
    
    const observer = new MutationObserver(handleDarkModeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Roll animation trigger function (working!)
  const triggerRollAnimation = () => {
    setShowRollAnimation(true);
    setTimeout(() => setShowRollAnimation(false), 500);
  };

  // Roll animation popup
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

  const addDieToTray = (sides) => {
    const die = commonDice.find(d => d.sides === sides);
    setDiceTray(prev => ({
      ...prev,
      [die.name]: (prev[die.name] || 0) + 1
    }));
  };

  const removeDieFromTray = (dieName) => {
    setDiceTray(prev => {
      const newTray = { ...prev };
      if (newTray[dieName] > 1) {
        newTray[dieName] -= 1;
      } else {
        delete newTray[dieName];
      }
      return newTray;
    });
  };

  const clearTray = () => {
    setDiceTray({});
  };

  const rollDiceTray = () => {
    const totalDice = Object.values(diceTray).reduce((sum, count) => sum + count, 0);
    if (totalDice === 0) return;
    
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual roll calculation until after the popup disappears
    setTimeout(() => {
      const results = [];
      Object.entries(diceTray).forEach(([dieName, count]) => {
        const die = commonDice.find(d => d.name === dieName);
        for (let i = 0; i < count; i++) {
          results.push({
            die: dieName,
            result: dX(die.sides)
          });
        }
      });
      
      const total = results.reduce((sum, roll) => sum + roll.result, 0);
      // Group results by die type for display
      const groupedResults = {};
      results.forEach(r => {
        if (!groupedResults[r.die]) groupedResults[r.die] = [];
        groupedResults[r.die].push(r.result);
      });
      const diceDescription = Object.entries(diceTray)
        .map(([dieName, count]) => count > 1 ? `${count}${dieName}` : dieName)
        .join(', ');
      const groupedDisplay = Object.entries(groupedResults)
        .map(([dieName, vals]) => {
          const count = vals.length;
          return `${count > 1 ? count + dieName : dieName}: ${vals.join(',')}`;
        })
        .join('  ');
      
      const rollData = {
        dice: diceDescription,
        groupedDisplay,
        results,
        total,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setLastRoll(rollData);
      setRollHistory(prev => [rollData, ...prev.slice(0, 9)]); // Keep last 10 rolls
    }, 500); // Match the popup duration
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLastRoll(null);
    try {
      localStorage.removeItem('dice-history');
    } catch (error) {
      console.error('Error clearing dice history from localStorage:', error);
    }
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: "favicon.ico",
    alt: "Forge Favicon",
    style: { width: 32, height: 32 }
  }), /*#__PURE__*/React.createElement(CardTitle, null, "FORGE Dice Roller"))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, [
    // Description
    /*#__PURE__*/React.createElement("p", {
      key: "description",
      className: darkMode ? "text-left text-white" : "text-left text-gray-600"
    }, "Roll dice for your tabletop gaming needs."),

    // Common Dice Section
    /*#__PURE__*/React.createElement("div", {
      key: "common-dice",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "common-buttons",
        className: "grid grid-cols-4 gap-2 sm:grid-cols-7"
      }, commonDice.map(dice => 
        /*#__PURE__*/React.createElement("button", {
          key: dice.name,
          className: "w-[50px] h-[50px] bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm flex items-center justify-center",
          onClick: () => addDieToTray(dice.sides),
          title: `Add ${dice.name} to dice tray`
        },        /*#__PURE__*/React.createElement("img", {
          src: dice.image,
          alt: dice.name,
          style: {
            width: "50px",
            height: "50px",
            borderRadius: "0.25rem" // Matches the button's rounded corners
          }
        }))
      ))
    ]),

    // Dice Tray Section
    /*#__PURE__*/React.createElement("div", {
      key: "dice-tray",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "tray-header",
        className: "flex justify-between items-center mb-4"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "tray-title",
          className: "text-lg font-semibold"
        }, "Dice Tray"),
        /*#__PURE__*/React.createElement("div", {
          key: "tray-buttons",
          className: "flex gap-2"
        }, [
          /*#__PURE__*/React.createElement("button", {
            key: "roll-tray",
            className: `px-4 py-2 rounded font-medium text-sm ${Object.keys(diceTray).length === 0 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`,
            onClick: rollDiceTray,
            disabled: Object.keys(diceTray).length === 0
          }, (() => {
            const totalDice = Object.values(diceTray).reduce((sum, count) => sum + count, 0);
            return `Roll ${totalDice > 0 ? `(${totalDice})` : ''}`;
          })()),
          /*#__PURE__*/React.createElement("button", {
            key: "clear-tray",
            className: "px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
            onClick: clearTray
          }, "Clear")
        ])
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "tray-content",
        className: "min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
      }, [
        Object.keys(diceTray).length === 0 ? 
          /*#__PURE__*/React.createElement("div", {
            key: "empty-tray",
            className: "text-center text-gray-500 py-2"
          }, "Click dice to add them to the tray") :
          /*#__PURE__*/React.createElement("div", {
            key: "tray-dice",
            className: "flex flex-wrap gap-2"
          }, Object.entries(diceTray).map(([dieName, count]) => {
            const die = commonDice.find(d => d.name === dieName);
            return /*#__PURE__*/React.createElement("div", {
              key: dieName,
              className: "relative inline-flex items-center bg-gray-100 rounded-lg p-2 border"
            }, [
              /*#__PURE__*/React.createElement("img", {
                key: "die-image",
                src: die.image,
                alt: dieName,
                style: { width: "24px", height: "24px" }
              }),
              /*#__PURE__*/React.createElement("span", {
                key: "die-name",
                className: "ml-2 text-sm font-medium"
              }, count > 1 ? `${count}${dieName}` : dieName),
              /*#__PURE__*/React.createElement("button", {
                key: "remove-die",
                className: "ml-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center",
                onClick: () => removeDieFromTray(dieName),
                title: "Remove one die"
              }, "−")
            ]);
          }))
      ])
    ]),

    // Last Roll Result
    lastRoll && /*#__PURE__*/React.createElement("div", {
      key: "last-roll",
      className: "p-4 border rounded-lg bg-blue-50"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "result-content",
        className: `text-center ${darkMode ? "text-blue-300" : "text-blue-700"}`
      }, [
        lastRoll.results.length > 1 && /*#__PURE__*/React.createElement("p", {
          key: "result-details",
          className: "text-lg mb-2"
        }, Object.entries((() => {
          const groupedResults = {};
          lastRoll.results.forEach(r => {
            if (!groupedResults[r.die]) groupedResults[r.die] = [];
            groupedResults[r.die].push(r.result);
          });
          return groupedResults;
        })()).map(([dieName, vals], index, arr) => /*#__PURE__*/React.createElement("span", {
          key: `${dieName}-group`,
          style: { marginRight: index < arr.length - 1 ? '1rem' : '0' }
        }, [
          /*#__PURE__*/React.createElement("span", {
            key: `${dieName}-label`,
            className: darkMode ? "text-gray-300" : "text-black"
          }, `${vals.length > 1 ? vals.length + dieName : dieName}: `),
          /*#__PURE__*/React.createElement("span", {
            key: `${dieName}-values`,
            className: darkMode ? "text-blue-300" : "text-blue-700"
          }, vals.join(','))
        ]))),
        
        /*#__PURE__*/React.createElement("p", {
          key: "result-total",
          className: "text-4xl font-bold"
        }, `${lastRoll.total}`)
      ])
    ]),

    // History Section
    rollHistory.length > 0 && /*#__PURE__*/React.createElement("div", {
      key: "history-section",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "history-header",
        className: "flex justify-between items-center mb-4"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "history-title",
          className: "text-lg font-semibold"
        }, "Roll History"),
        /*#__PURE__*/React.createElement("button", {
          key: "clear-history",
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
          onClick: clearHistory
        }, "Clear")
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "history-list",
        className: "space-y-2"
      }, rollHistory.map((roll, index) => 
        /*#__PURE__*/React.createElement("div", {
          key: `history-${index}`,
          className: "p-3 border rounded bg-gray-50 text-sm"
        }, [
          /*#__PURE__*/React.createElement("div", {
            key: "roll-result",
            className: "font-medium"
          }, `${roll.total}`),
          /*#__PURE__*/React.createElement("div", {
            key: "roll-details",
            className: "text-gray-500 text-xs mt-1"
          }, `${roll.groupedDisplay || roll.results.map(r => `${r.die}: ${r.result}`).join(', ')} • ${roll.timestamp}`)
        ])
      ))
    ])
  ]))), /*#__PURE__*/React.createElement("div", {
    key: "attributions",
    className: "text-center text-xs text-gray-500 mt-4"
  }, [
    /*#__PURE__*/React.createElement("p", {
      key: "forge-license",
      className: "text-xs mb-2"
    }, [
      "FORGE by Oliver Fradgley is licensed under a Creative Commons Attribution 4.0 International License. 2023",
      /*#__PURE__*/React.createElement("br", null),
      /*#__PURE__*/React.createElement("a", {
        key: "forge-link",
        href: "https://zap-forge.itch.io/forge",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-500 hover:text-blue-700 underline"
      }, "https://zap-forge.itch.io/forge")
    ]),
    /*#__PURE__*/React.createElement("p", {
      key: "attribution-line1",
      className: "text-xs"
    }, "d4, d10, d12 icons created by Skoll under CC BY 3.0"),
    /*#__PURE__*/React.createElement("p", {
      key: "attribution-line2",
      className: "text-xs"
    }, "d6, d8, d20 icons created by Delapouite under CC BY 3.0")
  ]));
}

// Mount function for module loading
function mount(root) {
  if (!root) return;
  
  // Clear content first to avoid React DOM conflicts
  root.innerHTML = "";
  
  // Clean up previous React root properly
  if (root._reactRoot) {
    try {
      // Suppress React DOM errors during unmount
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // More comprehensive error suppression
      console.error = (message, ...args) => {
        // Check if it's a React DOM unmount error
        if (typeof message === 'string' && (
          message.includes('removeChild') || 
          message.includes('NotFoundError') ||
          message.includes('The node to be removed is not a child') ||
          message.includes('Failed to execute \'removeChild\'')
        )) {
          return; // Suppress these errors
        }
        // Also check if it's an Error object with React DOM messages
        if (message instanceof Error && (
          message.message.includes('removeChild') ||
          message.message.includes('NotFoundError') ||
          message.message.includes('The node to be removed is not a child')
        )) {
          return; // Suppress these errors
        }
        originalError(message, ...args);
      };
      
      console.warn = (message, ...args) => {
        if (typeof message === 'string' && message.includes('removeChild')) {
          return; // Suppress removeChild warnings too
        }
        originalWarn(message, ...args);
      };
      
      // Add global error event suppression as backup
      const handleGlobalError = (event) => {
        if (event.error && event.error.message && (
          event.error.message.includes('removeChild') ||
          event.error.message.includes('NotFoundError')
        )) {
          event.preventDefault();
          return false;
        }
      };
      window.addEventListener('error', handleGlobalError);
      
      root._reactRoot.unmount();
      
      // Restore console methods and remove global handler after a brief delay
      setTimeout(() => {
        console.error = originalError;
        console.warn = originalWarn;
        window.removeEventListener('error', handleGlobalError);
      }, 200);
    } catch (e) {
      // Suppress unmount errors - they're expected when switching modules
      console.log("React unmount completed (some errors expected)");
    }
    root._reactRoot = null;
  }
  if (root._reactRootContainer) {
    root._reactRootContainer = null;
  }
  
  // Create fresh React root
  root._reactRoot = window.ReactDOM.createRoot(root);
  root._reactRoot.render(window.React.createElement(Dice));
  
  // Wait a moment for the component to render, then set up state persistence
  setTimeout(() => {
    console.log("Setting up Dice state persistence functions");
    
    window.saveState = () => {
      console.log("Dice saveState called");
      
      // First try current state, then fall back to preserved state
      const currentState = window._currentDiceState || window._preservedDiceState;
      if (!currentState) {
        console.log("No current dice state available");
        return null;
      }
      
      const { diceTray, lastRoll } = currentState;
      
      console.log("Dice state to save:", { diceTray, lastRoll });
      
      if (Object.keys(diceTray).length > 0 || lastRoll) {
        return {
          diceTray,
          lastRoll,
          timestamp: Date.now()
        };
      }
      return null;
    };
    
    window.restoreState = (state) => {
      console.log("Dice restoreState called with:", state);
      if (state && (state.diceTray || state.lastRoll)) {
        console.log("Setting pending Dice state for restoration");
        
        // Try direct state update first - no remounting
        if (root._reactRoot) {
          // Set the pending state for any new component that might mount
          window._pendingDiceState = state;
          
          // Try to update current component directly
          setTimeout(() => {
            if (window._currentDiceUpdate) {
              console.log("Attempting direct dice state update");
              window._currentDiceUpdate(state);
            } else {
              console.log("No direct update available, falling back to remount");
              // Fallback to remount if direct update not available
              root._reactRoot.unmount();
              root._reactRoot = null;
              
              setTimeout(() => {
                root._reactRoot = window.ReactDOM.createRoot(root);
                root._reactRoot.render(window.React.createElement(Dice));
              }, 5);
            }
          }, 10);
        } else {
          console.log("No React root available for Dice restoration");
        }
      } else {
        console.log("No valid Dice state to restore");
      }
    };
    
    console.log("Dice state persistence functions set up");
  }, 10); // Much faster setup - must be faster than main.js restoration delay
}

export { mount };
