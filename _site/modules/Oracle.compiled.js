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

// Main Oracle component
function Oracle() {
  // Store pending state reference to use for all state initializations
  const pendingState = window._pendingOracleState;
  
  const [currentAnswer, setCurrentAnswer] = React.useState(() => {
    return pendingState ? pendingState.answer : null;
  });
  const [currentLikelihood, setCurrentLikelihood] = React.useState(() => {
    return pendingState ? pendingState.likelihood : null;
  });
  const [currentRoll, setCurrentRoll] = React.useState(() => {
    return pendingState ? pendingState.roll : null;
  });
  const [currentModifierRoll, setCurrentModifierRoll] = React.useState(() => {
    return pendingState ? pendingState.modifierRoll : null;
  });
  const [currentVerbNoun, setCurrentVerbNoun] = React.useState(() => {
    return pendingState ? pendingState.verbNoun : null;
  });
  const [currentVerb, setCurrentVerb] = React.useState(() => {
    return pendingState ? pendingState.verb : null;
  });
  const [currentNoun, setCurrentNoun] = React.useState(() => {
    return pendingState ? pendingState.noun : null;
  });
  const [showRandomEvent, setShowRandomEvent] = React.useState(() => {
    return pendingState ? pendingState.showRandomEvent : false;
  });
  const [currentRandomEvent, setCurrentRandomEvent] = React.useState(() => {
    return pendingState ? pendingState.randomEvent : null;
  });
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

  // Clear pending state after all initializations are complete
  React.useEffect(() => {
    if (window._pendingOracleState === pendingState && pendingState) {
      console.log("Clearing pending Oracle state after initialization");
      window._pendingOracleState = null;
    }
  }, []);
  const [showRollAnimation, setShowRollAnimation] = React.useState(false);

  // Store current state globally for saveState function to access
  React.useEffect(() => {
    window._currentOracleState = {
      currentAnswer,
      currentLikelihood,
      currentRoll,
      currentModifierRoll,
      currentVerbNoun,
      currentVerb,
      currentNoun,
      showRandomEvent,
      currentRandomEvent
    };
    
    // Provide direct update function for faster restoration
    window._currentOracleUpdate = (state) => {
      console.log("Direct Oracle update with:", state);
      if (state.answer !== undefined) setCurrentAnswer(state.answer);
      if (state.likelihood !== undefined) setCurrentLikelihood(state.likelihood);
      if (state.roll !== undefined) setCurrentRoll(state.roll);
      if (state.modifierRoll !== undefined) setCurrentModifierRoll(state.modifierRoll);
      if (state.verbNoun !== undefined) setCurrentVerbNoun(state.verbNoun);
      if (state.verb !== undefined) setCurrentVerb(state.verb);
      if (state.noun !== undefined) setCurrentNoun(state.noun);
      if (state.showRandomEvent !== undefined) setShowRandomEvent(state.showRandomEvent);
      if (state.randomEvent !== undefined) setCurrentRandomEvent(state.randomEvent);
      // Clear pending state after successful update
      window._pendingOracleState = null;
    };
  }, [currentAnswer, currentLikelihood, currentRoll, currentModifierRoll, currentVerbNoun, currentVerb, currentNoun, showRandomEvent, currentRandomEvent]);
  
  // Clean up update function on unmount
  React.useEffect(() => {
    return () => {
      window._currentOracleUpdate = null;
    };
  }, []);

  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('oracle-history', JSON.stringify(questionHistory));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  }, [questionHistory]);
  
  // Preserve state on unmount for saveState to access
  React.useEffect(() => {
    return () => {
      // Keep a copy of the state for saveState to use after unmount
      if (window._currentOracleState) {
        window._preservedOracleState = { ...window._currentOracleState };
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

  // Improved roll animation popup (matching Dice module style)
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

  const triggerRollAnimation = () => {
    setShowRollAnimation(true);
    setTimeout(() => setShowRollAnimation(false), 500);
  };

  const askOracle = (likelihood) => {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual roll calculation until after the popup disappears
    setTimeout(() => {
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
    }, 500); // Match the popup duration
  };

  const getVerbNoun = () => {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual generation until after the popup disappears
    setTimeout(() => {
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
    }, 500); // Match the popup duration
  };

  const rollRandomEvent = () => {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual roll calculation until after the popup disappears
    setTimeout(() => {
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
    }, 500); // Match the popup duration
  };

  const rerollVerb = () => {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual reroll until after the popup disappears
    setTimeout(() => {
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
    }, 500); // Match the popup duration
  };

  const rerollNoun = () => {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual reroll until after the popup disappears
    setTimeout(() => {
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
    }, 500); // Match the popup duration
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

  return /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl relative"
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
          className: "w-[248px] px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm",
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
          className: darkMode ? "text-2xl text-blue-300 font-semibold" : "text-2xl text-blue-700 font-semibold"
        }, currentAnswer),
        /*#__PURE__*/React.createElement("p", {
          key: "roll-details",
          className: "text-xs mt-1"
        }, [
          /*#__PURE__*/React.createElement("span", {
            key: "likelihood-label",
            className: darkMode ? "text-gray-400" : "text-gray-700"
          }, currentLikelihood),
          /*#__PURE__*/React.createElement("span", {
            key: "oracle-label",
            className: darkMode ? "text-gray-400" : "text-gray-700"
          }, " - Oracle: "),
          /*#__PURE__*/React.createElement("span", {
            key: "oracle-roll",
            className: darkMode ? "text-blue-300" : "text-blue-600"
          }, currentRoll),
          /*#__PURE__*/React.createElement("span", {
            key: "modifier-label",
            className: darkMode ? "text-gray-400" : "text-gray-700"
          }, ", Modifier: "),
          /*#__PURE__*/React.createElement("span", {
            key: "modifier-roll",
            className: darkMode ? "text-blue-300" : "text-blue-600"
          }, currentModifierRoll)
        ])
      ]),

      // Random Event Button (appears when doubles are rolled)
      showRandomEvent && !currentRandomEvent && /*#__PURE__*/React.createElement("div", {
        key: "random-event-button",
        className: "text-center"
      }, /*#__PURE__*/React.createElement("button", {
        key: "event-button",
        className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm",
        onClick: rollRandomEvent
      }, "Random Event - Click to Roll, or Ignore")),

      // Random Event Result
      currentRandomEvent && /*#__PURE__*/React.createElement("div", {
        key: "random-event-result",
        className: "p-4 border rounded-lg bg-red-50"
      }, /*#__PURE__*/React.createElement("p", {
        key: "event-text",
        className: darkMode ? "text-lg text-red-300 font-semibold" : "text-lg text-red-700 font-semibold"
      }, currentRandomEvent))
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
          }, entry.type === "oracle" ? entry.answer : entry.type === "random-event" ? entry.result : entry.result),
          /*#__PURE__*/React.createElement("div", {
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
  ]))), /*#__PURE__*/React.createElement("div", {
    key: "attributions",
    className: "text-center text-xs text-gray-500 mt-4"
  }, /*#__PURE__*/React.createElement("p", {
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
  ])));
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
  root._reactRoot.render(window.React.createElement(Oracle));
  
  // Wait a moment for the component to render, then set up state persistence
  setTimeout(() => {
    console.log("Setting up Oracle state persistence functions");
    
    window.saveState = () => {
      console.log("Oracle saveState called");
      
      // First try current state, then fall back to preserved state
      const currentState = window._currentOracleState || window._preservedOracleState;
      if (!currentState) {
        console.log("No current Oracle state available");
        return null;
      }
      
      const { currentAnswer, currentLikelihood, currentRoll, currentModifierRoll, currentVerbNoun, currentVerb, currentNoun, showRandomEvent, currentRandomEvent } = currentState;
      
      console.log("Oracle state to save:", { currentAnswer, currentLikelihood, currentRoll });
      
      if (currentAnswer || currentVerbNoun || currentRandomEvent) {
        return {
          answer: currentAnswer,
          likelihood: currentLikelihood,
          roll: currentRoll,
          modifierRoll: currentModifierRoll,
          verbNoun: currentVerbNoun,
          verb: currentVerb,
          noun: currentNoun,
          showRandomEvent,
          randomEvent: currentRandomEvent,
          timestamp: Date.now()
        };
      }
      return null;
    };
    
    window.restoreState = (state) => {
      console.log("Oracle restoreState called with:", state);
      if (state && (state.answer || state.verbNoun || state.randomEvent)) {
        console.log("Setting pending Oracle state for restoration");
        
        // Try direct state update first - no remounting
        if (root._reactRoot) {
          // Set the pending state for any new component that might mount
          window._pendingOracleState = state;
          
          // Try to update current component directly
          setTimeout(() => {
            if (window._currentOracleUpdate) {
              console.log("Attempting direct Oracle state update");
              window._currentOracleUpdate(state);
            } else {
              console.log("No direct update available, falling back to remount");
              // Fallback to remount if direct update not available
              root._reactRoot.unmount();
              root._reactRoot = null;
              
              setTimeout(() => {
                root._reactRoot = window.ReactDOM.createRoot(root);
                root._reactRoot.render(window.React.createElement(Oracle));
              }, 5);
            }
          }, 10);
        } else {
          console.log("No React root available for Oracle restoration");
        }
      } else {
        console.log("No valid Oracle state to restore");
      }
    };
    
    console.log("Oracle state persistence functions set up");
  }, 10); // Much faster setup - must be faster than main.js restoration delay
}

export { mount };
