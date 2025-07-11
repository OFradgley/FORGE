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
  { name: "d4", sides: 4 },
  { name: "d6", sides: 6 },
  { name: "d8", sides: 8 },
  { name: "d10", sides: 10 },
  { name: "d12", sides: 12 },
  { name: "d20", sides: 20 },
  { name: "d100", sides: 100 }
];

// Main Dice component
function Dice() {
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
  const [customDice, setCustomDice] = React.useState({ count: 1, sides: 6 });
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

  const rollDice = (count, sides, label) => {
    const results = rollMultiple(count, sides);
    const total = results.reduce((sum, roll) => sum + roll, 0);
    
    const rollData = {
      label,
      count,
      sides,
      results,
      total,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setLastRoll(rollData);
    setRollHistory(prev => [rollData, ...prev.slice(0, 9)]); // Keep last 10 rolls
  };

  const rollCommonDice = (sides) => {
    const diceName = commonDice.find(d => d.sides === sides)?.name || `d${sides}`;
    rollDice(1, sides, diceName);
  };

  const rollCustomDice = () => {
    const label = customDice.count === 1 ? `d${customDice.sides}` : `${customDice.count}d${customDice.sides}`;
    rollDice(customDice.count, customDice.sides, label);
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
      /*#__PURE__*/React.createElement("h3", {
        key: "common-title",
        className: "text-lg font-semibold mb-4"
      }, "Common Dice"),
      
      /*#__PURE__*/React.createElement("div", {
        key: "common-buttons",
        className: "grid grid-cols-4 gap-2 sm:grid-cols-7"
      }, commonDice.map(dice => 
        /*#__PURE__*/React.createElement("button", {
          key: dice.name,
          className: "px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
          onClick: () => rollCommonDice(dice.sides)
        }, dice.name)
      ))
    ]),

    // Custom Dice Section
    /*#__PURE__*/React.createElement("div", {
      key: "custom-dice",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "custom-title",
        className: "text-lg font-semibold mb-4"
      }, "Custom Dice"),
      
      /*#__PURE__*/React.createElement("div", {
        key: "custom-controls",
        className: "flex items-center gap-4 mb-4"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "count-control",
          className: "flex items-center gap-2"
        }, [
          /*#__PURE__*/React.createElement("label", {
            key: "count-label",
            className: "text-sm font-medium"
          }, "Count:"),
          /*#__PURE__*/React.createElement("input", {
            key: "count-input",
            type: "number",
            min: "1",
            max: "20",
            value: customDice.count,
            onChange: (e) => setCustomDice(prev => ({ ...prev, count: parseInt(e.target.value) || 1 })),
            className: "w-16 px-2 py-1 border rounded text-center"
          })
        ]),
        
        /*#__PURE__*/React.createElement("div", {
          key: "sides-control",
          className: "flex items-center gap-2"
        }, [
          /*#__PURE__*/React.createElement("label", {
            key: "sides-label",
            className: "text-sm font-medium"
          }, "Sides:"),
          /*#__PURE__*/React.createElement("input", {
            key: "sides-input",
            type: "number",
            min: "2",
            max: "1000",
            value: customDice.sides,
            onChange: (e) => setCustomDice(prev => ({ ...prev, sides: parseInt(e.target.value) || 6 })),
            className: "w-20 px-2 py-1 border rounded text-center"
          })
        ]),
        
        /*#__PURE__*/React.createElement("button", {
          key: "roll-custom",
          className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium",
          onClick: rollCustomDice
        }, `Roll ${customDice.count}d${customDice.sides}`)
      ])
    ]),

    // Last Roll Result
    lastRoll && /*#__PURE__*/React.createElement("div", {
      key: "last-roll",
      className: "p-4 border rounded-lg bg-blue-50"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "result-title",
        className: "text-lg font-semibold mb-2"
      }, "Last Roll"),
      
      /*#__PURE__*/React.createElement("div", {
        key: "result-content",
        className: darkMode ? "text-blue-300" : "text-blue-700"
      }, [
        /*#__PURE__*/React.createElement("p", {
          key: "result-label",
          className: "text-xl font-bold"
        }, `${lastRoll.label}: ${lastRoll.total}`),
        
        lastRoll.results.length > 1 && /*#__PURE__*/React.createElement("p", {
          key: "result-details",
          className: "text-sm mt-1"
        }, `Individual rolls: [${lastRoll.results.join(', ')}]`)
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
          }, `${roll.label}: ${roll.total}`),
          /*#__PURE__*/React.createElement("div", {
            key: "roll-details",
            className: "text-gray-500 text-xs mt-1"
          }, `${roll.results.length > 1 ? `[${roll.results.join(', ')}]` : ''} • ${roll.timestamp}`)
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
