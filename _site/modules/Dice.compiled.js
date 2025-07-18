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
  const [diceTray, setDiceTray] = React.useState({}); // Changed to object for grouping
  const [lastRoll, setLastRoll] = React.useState(null);
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

  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('dice-history', JSON.stringify(rollHistory));
    } catch (error) {
      console.error('Error saving dice history to localStorage:', error);
    }
  }, [rollHistory]);

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
        .join(', ');
      
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
        className: "min-h-[80px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
      }, [
        Object.keys(diceTray).length === 0 ? 
          /*#__PURE__*/React.createElement("div", {
            key: "empty-tray",
            className: "text-center text-gray-500 py-6"
          }, "Click dice above to add them to the tray") :
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
        /*#__PURE__*/React.createElement("p", {
          key: "result-total",
          className: "text-4xl font-bold"
        }, `${lastRoll.total}`),
        
        lastRoll.results.length > 1 && /*#__PURE__*/React.createElement("p", {
          key: "result-details",
          className: "text-lg mt-1"
        }, `${lastRoll.groupedDisplay}`)
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
  if (root._reactRoot) {
    root._reactRoot.unmount();
    root._reactRoot = null;
  }
  // Forcibly clear React 18's internal root container if present
  if (root._reactRootContainer) {
    root._reactRootContainer = null;
  }
  root.innerHTML = "";
  root._reactRoot = window.ReactDOM.createRoot(root);
  root._reactRoot.render(window.React.createElement(Dice));
}

export { mount };
