// Oracle.compiled.js - FORGE Oracle Module (Compiled for browser)
// A simple oracle system for answering questions and providing inspiration

// Utility functions
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const d6 = () => Math.floor(Math.random() * 6) + 1;
const roll2d6 = () => d6() + d6();

// Oracle tables
const oracleAnswers = [
  "Yes, absolutely",
  "Yes, but with a complication",
  "Yes, and something unexpected happens",
  "Likely yes",
  "Possibly, depends on circumstances",
  "Unclear, ask again differently",
  "Unlikely",
  "No, but there's an alternative",
  "No, and there's a negative consequence",
  "Absolutely not"
];

const complications = [
  "But it attracts unwanted attention",
  "But it costs more than expected",
  "But it takes longer than anticipated",
  "But someone gets hurt",
  "But it creates a new problem",
  "But it alerts enemies",
  "But it damages equipment",
  "But it exhausts resources",
  "But it reveals a secret",
  "But it angers someone important",
  "But it breaks something valuable",
  "But it causes a misunderstanding"
];

const inspirations = [
  "Ancient ruins",
  "Mysterious stranger",
  "Hidden treasure",
  "Urgent message",
  "Dangerous creature",
  "Lost artifact",
  "Secret door",
  "Abandoned camp",
  "Strange weather",
  "Unusual sound",
  "Flickering light",
  "Foul odor",
  "Fresh tracks",
  "Broken weapon",
  "Torn clothing",
  "Spilled blood",
  "Carved symbol",
  "Glowing crystal",
  "Whispered voice",
  "Sudden silence"
];

// Card styling component
const Card = ({ children, className = "", style = {} }) => {
  return /*#__PURE__*/React.createElement("div", {
    className: `bg-white rounded-lg shadow-lg p-6 ${className}`,
    style: {
      border: "1px solid #e5e7eb",
      ...style
    }
  }, children);
};

const CardTitle = ({ children }) => {
  return /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold mb-4 text-center"
  }, children);
};

// Main Oracle component
function Oracle() {
  const [currentAnswer, setCurrentAnswer] = React.useState(null);
  const [currentComplication, setCurrentComplication] = React.useState(null);
  const [currentInspiration, setCurrentInspiration] = React.useState(null);
  const [questionHistory, setQuestionHistory] = React.useState([]);
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));

  // Listen for dark mode changes
  React.useEffect(() => {
    const handleDarkModeChange = () => {
      setDarkMode(document.body.classList.contains("dark"));
    };
    
    const observer = new MutationObserver(handleDarkModeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const askOracle = () => {
    const roll = roll2d6();
    let answer;
    
    if (roll <= 2) {
      answer = oracleAnswers[0]; // "Yes, absolutely"
    } else if (roll <= 3) {
      answer = oracleAnswers[1]; // "Yes, but with a complication"
    } else if (roll <= 4) {
      answer = oracleAnswers[2]; // "Yes, and something unexpected happens"
    } else if (roll <= 5) {
      answer = oracleAnswers[3]; // "Likely yes"
    } else if (roll <= 6) {
      answer = oracleAnswers[4]; // "Possibly, depends on circumstances"
    } else if (roll <= 7) {
      answer = oracleAnswers[5]; // "Unclear, ask again differently"
    } else if (roll <= 8) {
      answer = oracleAnswers[6]; // "Unlikely"
    } else if (roll <= 9) {
      answer = oracleAnswers[7]; // "No, but there's an alternative"
    } else if (roll <= 10) {
      answer = oracleAnswers[8]; // "No, and there's a negative consequence"
    } else {
      answer = oracleAnswers[9]; // "Absolutely not"
    }

    setCurrentAnswer(answer);
    
    // Add complication if answer includes "but" or "and"
    if (answer.includes("but") || answer.includes("and")) {
      setCurrentComplication(pick(complications));
    } else {
      setCurrentComplication(null);
    }

    // Add to history
    const newEntry = {
      answer,
      roll,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const getInspiration = () => {
    setCurrentInspiration(pick(inspirations));
  };

  const clearHistory = () => {
    setQuestionHistory([]);
    setCurrentAnswer(null);
    setCurrentComplication(null);
    setCurrentInspiration(null);
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto p-6 space-y-6"
  }, [
    // Header
    /*#__PURE__*/React.createElement(Card, {
      key: "header",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      /*#__PURE__*/React.createElement(CardTitle, { key: "title" }, "FORGE Oracle"),
      /*#__PURE__*/React.createElement("p", {
        key: "description",
        className: "text-center text-gray-600"
      }, "Ask questions, get answers, find inspiration for your game.")
    ]),

    // Main Oracle Section
    /*#__PURE__*/React.createElement(Card, {
      key: "oracle",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "oracle-content",
        className: "text-center space-y-6"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "oracle-title",
          className: "text-lg font-semibold"
        }, "Ask the Oracle"),
        
        /*#__PURE__*/React.createElement("button", {
          key: "ask-button",
          className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg",
          onClick: askOracle
        }, "Ask Question"),

        // Current Answer
        currentAnswer && /*#__PURE__*/React.createElement("div", {
          key: "current-answer",
          className: "p-4 border rounded-lg bg-blue-50"
        }, [
          /*#__PURE__*/React.createElement("h4", {
            key: "answer-title",
            className: "font-semibold text-blue-800"
          }, "Oracle Says:"),
          /*#__PURE__*/React.createElement("p", {
            key: "answer-text",
            className: "text-lg text-blue-700 mt-2"
          }, currentAnswer),
          
          // Complication if present
          currentComplication && /*#__PURE__*/React.createElement("p", {
            key: "complication",
            className: "text-sm text-blue-600 mt-2 italic"
          }, currentComplication)
        ])
      ])
    ]),

    // Inspiration Section
    /*#__PURE__*/React.createElement(Card, {
      key: "inspiration",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "inspiration-content",
        className: "text-center space-y-4"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "inspiration-title",
          className: "text-lg font-semibold"
        }, "Get Inspiration"),
        
        /*#__PURE__*/React.createElement("button", {
          key: "inspire-button",
          className: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold",
          onClick: getInspiration
        }, "Inspire Me"),

        // Current Inspiration
        currentInspiration && /*#__PURE__*/React.createElement("div", {
          key: "current-inspiration",
          className: "p-4 border rounded-lg bg-green-50"
        }, [
          /*#__PURE__*/React.createElement("h4", {
            key: "inspiration-label",
            className: "font-semibold text-green-800"
          }, "Inspiration:"),
          /*#__PURE__*/React.createElement("p", {
            key: "inspiration-text",
            className: "text-lg text-green-700 mt-2"
          }, currentInspiration)
        ])
      ])
    ]),

    // History Section
    questionHistory.length > 0 && /*#__PURE__*/React.createElement(Card, {
      key: "history",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "history-header",
        className: "flex justify-between items-center mb-4"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "history-title",
          className: "text-lg font-semibold"
        }, "Recent Questions"),
        /*#__PURE__*/React.createElement("button", {
          key: "clear-button",
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
          onClick: clearHistory
        }, "Clear")
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "history-list",
        className: "space-y-2"
      }, questionHistory.map((entry, index) => 
        /*#__PURE__*/React.createElement("div", {
          key: `history-${index}`,
          className: "p-3 border rounded bg-gray-50 text-sm"
        }, [
          /*#__PURE__*/React.createElement("div", {
            key: "entry-answer",
            className: "font-medium"
          }, entry.answer),
          /*#__PURE__*/React.createElement("div", {
            key: "entry-details",
            className: "text-gray-500 text-xs mt-1"
          }, `Roll: ${entry.roll} • ${entry.timestamp}`)
        ])
      ))
    ]),

    // Instructions
    /*#__PURE__*/React.createElement(Card, {
      key: "instructions",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "instructions-title",
        className: "text-lg font-semibold mb-3"
      }, "How to Use"),
      /*#__PURE__*/React.createElement("div", {
        key: "instructions-content",
        className: "space-y-2 text-sm"
      }, [
        /*#__PURE__*/React.createElement("p", { key: "instruction-1" }, "• Ask yes/no questions and click 'Ask Question' for guidance"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-2" }, "• Use 'Inspire Me' when you need creative ideas for your game"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-3" }, "• The Oracle provides answers based on 2d6 rolls"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-4" }, "• Some answers include complications or additional effects"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-5" }, "• Recent questions are saved to help track your session")
      ])
    ])
  ]);
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
  root._reactRoot.render(window.React.createElement(Oracle));
}

export { mount };
