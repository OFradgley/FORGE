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

// Random Event definitions
const eventFocus = [
  "Remote Event",
  "NPC Related", 
  "Quest Related",
  "PC Related",
  "Ambiguous Event",
  "Current Situation"
];

const focusEffect = [
  "Negative Spin", // 1-3
  "Negative Spin",
  "Negative Spin", 
  "Positive Spin", // 4-6
  "Positive Spin",
  "Positive Spin"
];

const verbs = [
  "Abandon", "Abuse", "Activate", "Adapt", "Agree", "Ambush", "Antagonise", "Arrive", "Assist", "Attach", "Attract", "Avenge", "Banish", "Befriend", "Begrudge", "Bestow", "Betray", "Block", "Break", "Carry", "Care", "Celebrate", "Change", "Collaborate", "Communicate", "Control", "Create", "Debase", "Deceive", "Decrease", "Delay", "Desert", "Destroy", "Develop", "Deviate", "Discover", "Dispute", "Disrupt", "Divide", "Dominate", "Drop", "Endure", "Excite", "Expose", "Fail", "Fight", "Finance", "Gratify", "Guide", "Haggle", "Harm", "Heal", "Imprison", "Imitate", "Increase", "Inform", "Inquire", "Inspect", "Inspire", "Judge", "Kill", "Lie", "Love", "Mistrust", "Move", "Navigate", "Neglect", "Oppose", "Oppress", "Open", "Overindulge", "Overthrow", "Persecute", "Postpone", "Preserve", "Proceed", "Procrastinate", "Propose", "Protect", "Provoke", "Pursue", "Praise", "Recruit", "Refuse", "Release", "Return", "Ruin", "Separate", "Spy", "Start", "Stop", "Struggle", "Surrender", "Take", "Thrive", "Throw", "Tolerate", "Transform", "Triumph", "Trick", "Truce", "Trust", "Usurp", "Violate", "Waste", "Work", "Wield", "Yield"
];

const nouns = [
  "Advantage", "Adversity", "Advice", "Agreement", "Ally", "Ambush", "Anger", "Animal", "Art", "Attention", "Balance", "Battle", "Benefit", "Burden", "Bureaucracy", "Business", "Chaos", "Competition", "Danger", "Death", "Defence", "Disadvantage", "Distraction", "Dream", "Element", "Emotion", "Enemy", "Energy", "Environment", "Evil", "Expectation", "Exterior", "Extravagance", "Failure", "Fame", "Fear", "Food", "Freedom", "Friendship", "Goal", "Good", "Group", "Guilty", "Home", "Hope", "Idea", "Illness", "Illusion", "Information", "Innocent", "Inside", "Intellectual", "Invention", "Investment", "Jealousy", "Joy", "Law", "Leadership", "Legal", "Liberty", "Love", "Magic", "Message", "Military", "Misfortune", "Mundane", "Nature", "Neutrality", "Obscurity", "Official", "Opulence", "Outside", "Pain", "Path", "Peace", "Penance", "People", "Physical", "Pleasure", "Plot", "Portal", "Possession", "Poverty", "Power", "Prison", "Project", "Protection", "Reality", "Riches", "Rumour", "Status", "Success", "Suffering", "Support", "Surprise", "Tactic", "Technology", "Tension", "Travel", "Value", "Vehicle", "Victory", "War", "Weapon", "Weather", "Wish", "Work", "Wound"
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
  const [currentModifierRoll, setCurrentModifierRoll] = React.useState(null);
  const [currentVerbNoun, setCurrentVerbNoun] = React.useState(null);
  const [currentVerb, setCurrentVerb] = React.useState(null);
  const [currentNoun, setCurrentNoun] = React.useState(null);
  const [showRandomEvent, setShowRandomEvent] = React.useState(false);
  const [currentRandomEvent, setCurrentRandomEvent] = React.useState(null);
  const [questionHistory, setQuestionHistory] = React.useState(() => {
    try {
      const saved = localStorage.getItem('oracle-history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
      return [];
    }
  });
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));

  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('oracle-history', JSON.stringify(questionHistory));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  }, [questionHistory]);

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
    const modifierRoll = d6();
    const threshold = oracleLikelihoods[likelihood].threshold;
    let answer = roll >= threshold ? "Yes" : "No";
    
    // Apply modifier based on modifier roll
    if (modifierRoll === 1) {
      answer += ", but";
    } else if (modifierRoll === 6) {
      answer += ", and";
    }
    
    setCurrentAnswer(answer);
    setCurrentLikelihood(likelihood);
    setCurrentRoll(roll);
    setCurrentModifierRoll(modifierRoll);
    
    // Check for doubles (same roll on both dice)
    setShowRandomEvent(roll === modifierRoll);
    setCurrentRandomEvent(null); // Reset any previous random event

    // Add to history
    const newEntry = {
      type: "oracle",
      answer,
      likelihood,
      roll,
      modifierRoll,
      threshold,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const rollRandomEvent = () => {
    const focusRoll = d6();
    const effectRoll = d6();
    
    const focus = eventFocus[focusRoll - 1];
    const effect = focusEffect[effectRoll - 1];
    
    const eventResult = `${focus} with a ${effect}`;
    setCurrentRandomEvent(eventResult);
    
    // Add to history
    const newEntry = {
      type: "random-event",
      result: eventResult,
      focusRoll,
      effectRoll,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const getVerbNoun = () => {
    const verb = pick(verbs);
    const noun = pick(nouns);
    setCurrentVerb(verb);
    setCurrentNoun(noun);
    setCurrentVerbNoun(`${verb} ${noun}`);

    // Add to history
    const newEntry = {
      type: "inspiration",
      result: `${verb} ${noun}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const rerollVerb = () => {
    const newVerb = pick(verbs);
    setCurrentVerb(newVerb);
    setCurrentVerbNoun(`${newVerb} ${currentNoun}`);

    // Add to history
    const newEntry = {
      type: "inspiration",
      result: `${newVerb} ${currentNoun} (Re-rolled)`,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const rerollNoun = () => {
    const newNoun = pick(nouns);
    setCurrentNoun(newNoun);
    setCurrentVerbNoun(`${currentVerb} ${newNoun}`);

    // Add to history
    const newEntry = {
      type: "inspiration",
      result: `${currentVerb} ${newNoun} (Re-rolled)`,
      timestamp: new Date().toLocaleTimeString()
    };
    setQuestionHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
  };

  const clearHistory = () => {
    setQuestionHistory([]);
    setCurrentAnswer(null);
    setCurrentLikelihood(null);
    setCurrentRoll(null);
    setCurrentModifierRoll(null);
    setCurrentVerbNoun(null);
    setCurrentVerb(null);
    setCurrentNoun(null);
    setShowRandomEvent(false);
    setCurrentRandomEvent(null);
    // Clear localStorage as well
    try {
      localStorage.removeItem('oracle-history');
    } catch (error) {
      console.error('Error clearing history from localStorage:', error);
    }
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
        className: darkMode ? "text-left text-white" : "text-left text-gray-600"
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
          React.createElement("p", {
            key: "answer-text",
            className: darkMode ? "text-lg text-blue-300 font-semibold" : "text-lg text-blue-700 font-semibold"
          }, currentAnswer),
          React.createElement("p", {
            key: "roll-details",
            className: darkMode ? "text-xs text-gray-300 mt-1" : "text-xs text-blue-600 mt-1"
          }, `${currentLikelihood} - Oracle: ${currentRoll}, Modifier: ${currentModifierRoll}`)
        ]),

        // Random Event Button (appears when doubles are rolled)
        showRandomEvent && !currentRandomEvent && React.createElement("div", {
          key: "random-event-button",
          className: "text-center"
        }, React.createElement("button", {
          key: "event-button",
          className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm",
          onClick: rollRandomEvent
        }, "Random Event - Click to Roll, or Ignore")),

        // Random Event Result
        currentRandomEvent && React.createElement("div", {
          key: "random-event-result",
          className: "p-4 border rounded-lg bg-red-50"
        }, React.createElement("p", {
          key: "event-text",
          className: darkMode ? "text-lg text-red-300 font-semibold" : "text-lg text-red-700 font-semibold"
        }, currentRandomEvent))
      ])
    ]),

    // Verb + Noun Section
    React.createElement(Card, {
      key: "verbnoun",
      className: darkMode ? "bg-gray-800 text-white" : "bg-white"
    }, [
      React.createElement("div", {
        key: "verbnoun-content",
        className: "text-center space-y-4"
      }, [
        React.createElement("h3", {
          key: "verbnoun-title",
          className: "text-lg font-semibold"
        }, "Roll for Inspiration"),
        
        React.createElement("button", {
          key: "verbnoun-button",
          className: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold",
          onClick: getVerbNoun
        }, "Verb + Noun"),

        // Current Verb + Noun
        currentVerbNoun && React.createElement("div", {
          key: "current-verbnoun",
          className: "p-4 border rounded-lg bg-green-50"
        }, [
          React.createElement("div", {
            key: "verbnoun-text",
            className: darkMode ? "text-lg text-green-300" : "text-lg text-green-700",
            style: { 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "10px" 
            }
          }, [
            React.createElement("img", {
              key: "verb-dice",
              src: "./d6.png",
              alt: "Reroll Verb",
              onClick: rerollVerb,
              style: {
                width: "25px",
                height: "25px",
                cursor: "pointer",
                filter: darkMode ? "invert(1)" : "none"
              }
            }),
            React.createElement("span", {
              key: "verb-text"
            }, currentVerb),
            React.createElement("span", {
              key: "space-text"
            }, " "),
            React.createElement("span", {
              key: "noun-text"
            }, currentNoun),
            React.createElement("img", {
              key: "noun-dice",
              src: "./d6.png",
              alt: "Reroll Noun",
              onClick: rerollNoun,
              style: {
                width: "25px",
                height: "25px",
                cursor: "pointer",
                filter: darkMode ? "invert(1)" : "none"
              }
            })
          ])
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
        }, "Recent Rolls"),
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
          key: "entry-result",
          className: "font-medium"
        }, entry.type === "oracle" ? entry.answer : entry.type === "random-event" ? entry.result : entry.result),
        React.createElement("div", {
          key: "entry-details",
          className: "text-gray-500 text-xs mt-1"
        }, entry.type === "oracle" ? 
          `(${entry.likelihood}) Roll: ${entry.roll},${entry.modifierRoll} • ${entry.timestamp}` :
          entry.type === "random-event" ?
          `Random Event • ${entry.timestamp}` :
          `Verb + Noun • ${entry.timestamp}`)
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
        React.createElement("p", { key: "instruction-4" }, "• Use 'Verb + Noun' to generate random action prompts for your game"),
        React.createElement("p", { key: "instruction-5" }, "• Recent rolls are saved to help track your session")
      ])
    ]),

    // Attribution
    React.createElement("div", {
      key: "attribution",
      className: "text-center text-sm mt-4 p-2 bg-gray-100 border border-gray-300 rounded",
      style: { color: "black" }
    }, [
      "FORGE by Oliver Fradgley is licensed under a Creative Commons Attribution 4.0 International License. 2023 ",
      React.createElement("a", {
        key: "forge-link",
        href: "https://zap-forge.itch.io/forge",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-500 hover:text-blue-700 underline"
      }, "https://zap-forge.itch.io/forge")
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
