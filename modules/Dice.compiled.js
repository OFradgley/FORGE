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
  { name: "d6", sides: 6, image: "d6_3.png" },
  { name: "d8", sides: 8, image: "d8.png" },
  { name: "d10", sides: 10, image: "d10.png" },
  { name: "d12", sides: 12, image: "d12.png" },
  { name: "d20", sides: 20, image: "d20.png" },
  { name: "d100", sides: 100, image: "d10.png" } // Using d10 image for d100
];

// Main Dice component
function Dice() {
  const [diceTray, setDiceTray] = React.useState([]);
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

  const addDieToTray = (sides) => {
    const die = commonDice.find(d => d.sides === sides);
    const newDie = {
      id: Date.now() + Math.random(), // Unique ID for each die
      name: die.name,
      sides: sides,
      image: die.image
    };
    setDiceTray(prev => [...prev, newDie]);
  };

  const removeDieFromTray = (dieId) => {
    setDiceTray(prev => prev.filter(die => die.id !== dieId));
  };

  const clearTray = () => {
    setDiceTray([]);
  };

  const rollDiceTray = () => {
    if (diceTray.length === 0) return;
    
    const results = diceTray.map(die => ({
      die: die.name,
      result: dX(die.sides)
    }));
    
    const total = results.reduce((sum, roll) => sum + roll.result, 0);
    const diceDescription = diceTray.map(die => die.name).join(', ');
    
    const rollData = {
      dice: diceDescription,
      results,
      total,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setLastRoll(rollData);
    setRollHistory(prev => [rollData, ...prev.slice(0, 9)]); // Keep last 10 rolls
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
            className: `px-4 py-2 rounded font-medium text-sm ${diceTray.length === 0 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`,
            onClick: rollDiceTray,
            disabled: diceTray.length === 0
          }, `Roll ${diceTray.length > 0 ? `(${diceTray.length})` : ''}`),
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
        diceTray.length === 0 ? 
          /*#__PURE__*/React.createElement("div", {
            key: "empty-tray",
            className: "text-center text-gray-500 py-6"
          }, "Click dice above to add them to the tray") :
          /*#__PURE__*/React.createElement("div", {
            key: "tray-dice",
            className: "flex flex-wrap gap-2"
          }, diceTray.map(die => 
            /*#__PURE__*/React.createElement("div", {
              key: die.id,
              className: "relative inline-flex items-center bg-gray-100 rounded-lg p-2 border"
            }, [
              /*#__PURE__*/React.createElement("img", {
                key: "die-image",
                src: die.image,
                alt: die.name,
                style: { width: "24px", height: "24px" }
              }),
              /*#__PURE__*/React.createElement("span", {
                key: "die-name",
                className: "ml-2 text-sm font-medium"
              }, die.name),
              /*#__PURE__*/React.createElement("button", {
                key: "remove-die",
                className: "ml-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center",
                onClick: () => removeDieFromTray(die.id),
                title: "Remove die"
              }, "×")
            ])
          ))
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
          className: "text-xl font-bold"
        }, `${lastRoll.total}`),
        
        lastRoll.results.length > 1 && /*#__PURE__*/React.createElement("p", {
          key: "result-details",
          className: "text-sm mt-1"
        }, `${lastRoll.results.map(r => `${r.die}: ${r.result}`).join(', ')}`)
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
          }, `${roll.results.map(r => `${r.die}: ${r.result}`).join(', ')} • ${roll.timestamp}`)
        ])
      ))
    ])
  ]))));
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
