// Oracle.compiled.js - FORGE Oracle Module (Compiled for browser)
// A simple oracle system for answering questions and providing inspiration

// Import UI components
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";

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

const verbs = [
  "Abandon", "Abuse", "Activate", "Adapt", "Agree", "Ambush", "Antagonise", "Arrive", "Assist", "Attach", "Attract", "Avenge", "Banish", "Befriend", "Begrudge", "Bestow", "Betray", "Block", "Break", "Carry", "Care", "Celebrate", "Change", "Collaborate", "Communicate", "Control", "Create", "Debase", "Deceive", "Decrease", "Delay", "Desert", "Destroy", "Develop", "Deviate", "Discover", "Dispute", "Disrupt", "Divide", "Dominate", "Drop", "Endure", "Excite", "Expose", "Fail", "Fight", "Finance", "Gratify", "Guide", "Haggle", "Harm", "Heal", "Imprison", "Imitate", "Increase", "Inform", "Inquire", "Inspect", "Inspire", "Judge", "Kill", "Lie", "Love", "Mistrust", "Move", "Navigate", "Neglect", "Oppose", "Oppress", "Open", "Overindulge", "Overthrow", "Persecute", "Postpone", "Preserve", "Proceed", "Procrastinate", "Propose", "Protect", "Provoke", "Pursue", "Praise", "Recruit", "Refuse", "Release", "Return", "Ruin", "Separate", "Spy", "Start", "Stop", "Struggle", "Surrender", "Take", "Thrive", "Throw", "Tolerate", "Transform", "Triumph", "Trick", "Truce", "Trust", "Usurp", "Violate", "Waste", "Work", "Wield", "Yield"
];

const nouns = [
  "Advantage", "Adversity", "Advice", "Agreement", "Ally", "Ambush", "Anger", "Animal", "Art", "Attention", "Balance", "Battle", "Benefit", "Burden", "Bureaucracy", "Business", "Chaos", "Competition", "Danger", "Death", "Defence", "Disadvantage", "Distraction", "Dream", "Element", "Emotion", "Enemy", "Energy", "Environment", "Evil", "Expectation", "Exterior", "Extravagance", "Failure", "Fame", "Fear", "Food", "Freedom", "Friendship", "Goal", "Good", "Group", "Guilty", "Home", "Hope", "Idea", "Illness", "Illusion", "Information", "Innocent", "Inside", "Intellectual", "Invention", "Investment", "Jealousy", "Joy", "Law", "Leadership", "Legal", "Liberty", "Love", "Magic", "Message", "Military", "Misfortune", "Mundane", "Nature", "Neutrality", "Obscurity", "Official", "Opulence", "Outside", "Pain", "Path", "Peace", "Penance", "People", "Physical", "Pleasure", "Plot", "Portal", "Possession", "Poverty", "Power", "Prison", "Project", "Protection", "Reality", "Riches", "Rumour", "Status", "Success", "Suffering", "Support", "Surprise", "Tactic", "Technology", "Tension", "Travel", "Value", "Vehicle", "Victory", "War", "Weapon", "Weather", "Wish", "Work", "Wound"
];

// Main Oracle component
function Oracle() {
  const [currentAnswer, setCurrentAnswer] = React.useState(null);
  const [currentLikelihood, setCurrentLikelihood] = React.useState(null);
  const [currentRoll, setCurrentRoll] = React.useState(null);
  const [currentModifierRoll, setCurrentModifierRoll] = React.useState(null);
  const [currentVerbNoun, setCurrentVerbNoun] = React.useState(null);
  const [currentVerb, setCurrentVerb] = React.useState(null);
  const [currentNoun, setCurrentNoun] = React.useState(null);
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
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: "favicon.ico",
    alt: "Forge Favicon",
    style: {
      width: 32,
      height: 32
    }
  }), /*#__PURE__*/React.createElement(CardTitle, null, "FORGE Oracle"))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, [
    // Description
    /*#__PURE__*/React.createElement("p", {
      key: "description",
      className: darkMode ? "text-left text-white" : "text-left text-gray-600"
    }, "Ask questions, get answers, find inspiration for your game."),

    // Oracle Section
    /*#__PURE__*/React.createElement("div", {
      key: "oracle-section",
      className: "text-center space-y-4 p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "oracle-title",
        className: "text-lg font-semibold"
      }, "Ask the Oracle"),
      
      /*#__PURE__*/React.createElement("div", {
        key: "oracle-buttons",
        className: "space-y-2"
      }, [
        // Top row - Certain and Likely
        /*#__PURE__*/React.createElement("div", {
          key: "row-1",
          className: "flex justify-center gap-2"
        }, ["Certain", "Likely"].map(likelihood =>
          /*#__PURE__*/React.createElement("button", {
            key: likelihood,
            className: "flex-1 max-w-[120px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
            onClick: () => askOracle(likelihood)
          }, likelihood)
        )),
        
        // Middle row - Even Odds
        /*#__PURE__*/React.createElement("div", {
          key: "row-2",
          className: "flex justify-center"
        }, /*#__PURE__*/React.createElement("button", {
          key: "Even Odds",
          className: "w-[248px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
          onClick: () => askOracle("Even Odds")
        }, "Even Odds")),
        
        // Bottom row - Unlikely and Impossible
        /*#__PURE__*/React.createElement("div", {
          key: "row-3",
          className: "flex justify-center gap-2"
        }, ["Unlikely", "Impossible"].map(likelihood =>
          /*#__PURE__*/React.createElement("button", {
            key: likelihood,
            className: "flex-1 max-w-[120px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
            onClick: () => askOracle(likelihood)
          }, likelihood)
        ))
      ]),

      // Current Answer
      currentAnswer && /*#__PURE__*/React.createElement("div", {
        key: "current-answer",
        className: "p-4 border rounded-lg bg-blue-50"
      }, [
        /*#__PURE__*/React.createElement("p", {
          key: "answer-text",
          className: darkMode ? "text-lg text-blue-300 font-semibold" : "text-lg text-blue-700 font-semibold"
        }, currentAnswer),
        /*#__PURE__*/React.createElement("p", {
          key: "roll-details",
          className: darkMode ? "text-xs text-gray-300 mt-1" : "text-xs text-blue-600 mt-1"
        }, `${currentLikelihood} - Oracle: ${currentRoll}, Modifier: ${currentModifierRoll}`)
      ])
    ]),

    // Verb + Noun Section
    /*#__PURE__*/React.createElement("div", {
      key: "verbnoun-section",
      className: "text-center space-y-4 p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "verbnoun-title",
        className: "text-lg font-semibold"
      }, "Roll for Inspiration"),
      
      /*#__PURE__*/React.createElement("button", {
        key: "verbnoun-button",
        className: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold",
        onClick: getVerbNoun
      }, "Verb + Noun"),

      // Current Verb + Noun
      currentVerbNoun && /*#__PURE__*/React.createElement("div", {
        key: "current-verbnoun",
        className: "p-4 border rounded-lg bg-green-50"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "verbnoun-text",
          className: darkMode ? "text-lg text-green-300" : "text-lg text-green-700",
          style: { 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "10px" 
          }
        }, [
          /*#__PURE__*/React.createElement("img", {
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
          /*#__PURE__*/React.createElement("span", {
            key: "verb-text"
          }, currentVerb),
          /*#__PURE__*/React.createElement("span", {
            key: "space-text"
          }, " "),
          /*#__PURE__*/React.createElement("span", {
            key: "noun-text"
          }, currentNoun),
          /*#__PURE__*/React.createElement("img", {
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
    ]),

    // History Section
    questionHistory.length > 0 && /*#__PURE__*/React.createElement("div", {
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
        }, "Recent Rolls"),
        /*#__PURE__*/React.createElement("button", {
          key: "clear-button",
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
          onClick: clearHistory
        }, "Clear")
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "history-list",
        className: "space-y-2"
      },      questionHistory.map((entry, index) => 
        /*#__PURE__*/React.createElement("div", {
          key: `history-${index}`,
          className: "p-3 border rounded bg-gray-50 text-sm"
        }, [
          /*#__PURE__*/React.createElement("div", {
            key: "entry-result",
            className: "font-medium"
          }, entry.type === "oracle" ? entry.answer : entry.result),
          /*#__PURE__*/React.createElement("div", {
            key: "entry-details",
            className: "text-gray-500 text-xs mt-1"
          }, entry.type === "oracle" ? 
            `(${entry.likelihood}) Roll: ${entry.roll},${entry.modifierRoll} • ${entry.timestamp}` :
            `Verb + Noun • ${entry.timestamp}`)
        ])
      ))
    ]),

    // Instructions
    /*#__PURE__*/React.createElement("div", {
      key: "instructions-section",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "instructions-title",
        className: "text-lg font-semibold mb-3"
      }, "How to Use"),
      /*#__PURE__*/React.createElement("div", {
        key: "instructions-content",
        className: "space-y-2 text-sm"
      }, [
        /*#__PURE__*/React.createElement("p", { key: "instruction-1" }, "• Choose a likelihood and click the button to ask the Oracle"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-2" }, "• Each likelihood has different chances: Impossible (1/6), Unlikely (2/6), Even Odds (3/6), Likely (4/6), Certain (5/6)"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-3" }, "• The Oracle rolls 1d6 and compares to the threshold for Yes/No"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-4" }, "• Use 'Verb + Noun' to generate random action prompts for your game"),
        /*#__PURE__*/React.createElement("p", { key: "instruction-5" }, "• Recent rolls are saved to help track your session")
      ])
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
  root._reactRoot.render(window.React.createElement(Oracle));
}

export { mount };
