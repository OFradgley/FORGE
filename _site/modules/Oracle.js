// Oracle.js - FORGE Oracle Module
// A simple oracle system for answering questions and providing inspiration

// Utility functions
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const d6 = () => Math.floor(Math.random() * 6) + 1;

// Oracle likelihood definitions
const oracleLikelihoods = {
  "Impossible": { threshold: 6, description: "1/6 chance for Yes" },
  "Unlikely": { threshold: 5, description: "2/6 chance for Yes" },
  "Even Odds": { threshold: 4, description: "3/6 chance for Yes" },
  "Likely": { threshold: 3, description: "4/6 chance for Yes" },
  "Certain": { threshold: 2, description: "5/6 chance for Yes" }
};

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
  return React.createElement("div", {
    className: `bg-white rounded-lg shadow-lg p-6 ${className}`,
    style: {
      border: "1px solid #e5e7eb",
      ...style
    }
  }, children);
};

const CardTitle = ({ children }) => {
  return React.createElement("h2", {
    className: "text-xl font-bold mb-4 text-center"
  }, children);
};

// Main Oracle component
function Oracle() {
  const [currentAnswer, setCurrentAnswer] = React.useState(null);
  const [currentLikelihood, setCurrentLikelihood] = React.useState(null);
  const [currentRoll, setCurrentRoll] = React.useState(null);
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

  const askOracle = (likelihood) => {
    const roll = d6();
    const threshold = oracleLikelihoods[likelihood].threshold;
    const answer = roll >= threshold ? "Yes" : "No";
    
    setCurrentAnswer(answer);
    setCurrentLikelihood(likelihood);
    setCurrentRoll(roll);

    // Add to history
    const newEntry = {
      answer,
      likelihood,
      roll,
      threshold,
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
    setCurrentLikelihood(null);
    setCurrentRoll(null);
    setCurrentInspiration(null);
  };

  return React.createElement("div", {
    className: "max-w-4xl mx-auto p-6 space-y-6"
  }, [
    // Header
    React.createElement(Card, {
      key: "header",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement(CardTitle, { key: "title" }, "FORGE Oracle"),
      React.createElement("p", {
        key: "description",
        className: "text-center text-gray-600"
      }, "Ask questions, get answers, find inspiration for your game.")
    ]),

    // Main Oracle Section
    React.createElement(Card, {
      key: "oracle",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement("div", {
        key: "oracle-content",
        className: "text-center space-y-6"
      }, [
        React.createElement("h3", {
          key: "oracle-title",
          className: "text-lg font-semibold"
        }, "Ask the Oracle"),
        
        React.createElement("div", {
          key: "oracle-buttons",
          className: "space-y-2"
        }, [
          // Top row - Certain and Likely
          React.createElement("div", {
            key: "row-1",
            className: "flex justify-center gap-2"
          }, ["Certain", "Likely"].map(likelihood =>
            React.createElement("button", {
              key: likelihood,
              className: "flex-1 max-w-[120px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
              onClick: () => askOracle(likelihood)
            }, likelihood)
          )),
          
          // Middle row - Even Odds
          React.createElement("div", {
            key: "row-2",
            className: "flex justify-center"
          }, React.createElement("button", {
            key: "Even Odds",
            className: "w-[248px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
            onClick: () => askOracle("Even Odds")
          }, "Even Odds")),
          
          // Bottom row - Unlikely and Impossible
          React.createElement("div", {
            key: "row-3",
            className: "flex justify-center gap-2"
          }, ["Unlikely", "Impossible"].map(likelihood =>
            React.createElement("button", {
              key: likelihood,
              className: "flex-1 max-w-[120px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
              onClick: () => askOracle(likelihood)
            }, likelihood)
          ))
        ]),

        // Current Answer
        currentAnswer && React.createElement("div", {
          key: "current-answer",
          className: "p-4 border rounded-lg bg-blue-50"
        }, [
          React.createElement("h4", {
            key: "answer-title",
            className: "font-semibold text-blue-800"
          }, "Oracle Says:"),
          React.createElement("p", {
            key: "answer-text",
            className: "text-lg text-blue-700 mt-2"
          }, currentAnswer),
          React.createElement("p", {
            key: "roll-details",
            className: "text-sm text-blue-600 mt-1"
          }, `${currentLikelihood} (${currentRoll}/6 needed ≥${oracleLikelihoods[currentLikelihood].threshold})`)
        ])
      ])
    ]),

    // Inspiration Section
    React.createElement(Card, {
      key: "inspiration",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement("div", {
        key: "inspiration-content",
        className: "text-center space-y-4"
      }, [
        React.createElement("h3", {
          key: "inspiration-title",
          className: "text-lg font-semibold"
        }, "Get Inspiration"),
        
        React.createElement("button", {
          key: "inspire-button",
          className: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold",
          onClick: getInspiration
        }, "Inspire Me"),

        // Current Inspiration
        currentInspiration && React.createElement("div", {
          key: "current-inspiration",
          className: "p-4 border rounded-lg bg-green-50"
        }, [
          React.createElement("h4", {
            key: "inspiration-label",
            className: "font-semibold text-green-800"
          }, "Inspiration:"),
          React.createElement("p", {
            key: "inspiration-text",
            className: "text-lg text-green-700 mt-2"
          }, currentInspiration)
        ])
      ])
    ]),

    // History Section
    questionHistory.length > 0 && React.createElement(Card, {
      key: "history",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement("div", {
        key: "history-header",
        className: "flex justify-between items-center mb-4"
      }, [
        React.createElement("h3", {
          key: "history-title",
          className: "text-lg font-semibold"
        }, "Recent Questions"),
        React.createElement("button", {
          key: "clear-button",
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
          onClick: clearHistory
        }, "Clear")
      ]),
      
      React.createElement("div", {
        key: "history-list",
        className: "space-y-2"
      }, questionHistory.map((entry, index) => 
        React.createElement("div", {
          key: `history-${index}`,
          className: "p-3 border rounded bg-gray-50 text-sm"
        }, [        React.createElement("div", {
          key: "entry-answer",
          className: "font-medium"
        }, `${entry.answer} (${entry.likelihood})`),
        React.createElement("div", {
          key: "entry-details",
          className: "text-gray-500 text-xs mt-1"
        }, `Roll: ${entry.roll}/${entry.threshold} • ${entry.timestamp}`)
        ])
      ))
    ]),

    // Instructions
    React.createElement(Card, {
      key: "instructions",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement("h3", {
        key: "instructions-title",
        className: "text-lg font-semibold mb-3"
      }, "How to Use"),
      React.createElement("div", {
        key: "instructions-content",
        className: "space-y-2 text-sm"
      }, [
        React.createElement("p", { key: "instruction-1" }, "• Choose a likelihood and click the button to ask the Oracle"),
        React.createElement("p", { key: "instruction-2" }, "• Each likelihood has different chances: Impossible (1/6), Unlikely (2/6), Even Odds (3/6), Likely (4/6), Certain (5/6)"),
        React.createElement("p", { key: "instruction-3" }, "• The Oracle rolls 1d6 and compares to the threshold for Yes/No"),
        React.createElement("p", { key: "instruction-4" }, "• Use 'Inspire Me' when you need creative ideas for your game"),
        React.createElement("p", { key: "instruction-5" }, "• Recent questions are saved to help track your session")
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
