// modules/questGen.compiled.js - FORGE Quest Generator Module
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";

// Helper Utilities
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const d6 = () => Math.floor(Math.random() * 6) + 1;

// Quest Generation Tables
const questTypes = {
  1: "Character Based",
  2: "Character Based", 
  3: "Item Based",
  4: "Item Based",
  5: "Location Based",
  6: "Location Based"
};

const rewards = {
  1: "No monetary reward, just XP",
  2: "No monetary reward, just XP",
  3: "XP in the form of gold",
  4: "XP in the form of gems", 
  5: "XP plus an Item",
  6: "XP plus an Item"
};

// ------------------------------ Main Component ------------------------------
function QuestGenerator() {
  // Store pending state reference to use for all state initializations
  const pendingState = window._pendingQuestState;
  
  const [quest, setQuest] = React.useState(() => {
    // Check for pending state on initialization
    return pendingState && pendingState.quest ? pendingState.quest : null;
  });
  
  const [savedQuests, setSavedQuests] = React.useState(() => {
    // Check for pending state on initialization
    if (pendingState && pendingState.savedQuests) {
      return pendingState.savedQuests;
    }
    try {
      const saved = localStorage.getItem('saved-quests');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved quests from localStorage:', error);
      return [];
    }
  });
  
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));
  const [showRollAnimation, setShowRollAnimation] = React.useState(false);

  // Clear pending state after all initializations are complete
  React.useEffect(() => {
    if (window._pendingQuestState === pendingState && pendingState) {
      console.log("Clearing pending quest state after initialization");
      window._pendingQuestState = null;
    }
  }, []);

  // Check for pending state restoration on mount (backup - should not be needed now)
  React.useEffect(() => {
    if (window._pendingQuestState && !pendingState) {
      console.log("Restoring pending quest state (backup):", window._pendingQuestState);
      const backupPendingState = window._pendingQuestState;
      
      if (backupPendingState.quest) {
        setQuest(backupPendingState.quest);
      }
      if (backupPendingState.savedQuests) {
        setSavedQuests(backupPendingState.savedQuests);
      }
      
      // Clear the pending state
      delete window._pendingQuestState;
    }
  }, []);

  // Store current state globally for saveState function to access
  React.useEffect(() => {
    window._currentQuestState = {
      quest,
      savedQuests
    };
    
    // Provide direct update function for faster restoration
    window._currentQuestUpdate = (state) => {
      console.log("Direct quest update with:", state);
      if (state.quest !== undefined) {
        setQuest(state.quest);
      }
      if (state.savedQuests) {
        setSavedQuests(state.savedQuests);
      }
      // Clear pending state after successful update
      window._pendingQuestState = null;
    };
  }, [quest, savedQuests]);
  
  // Clean up update function on unmount
  React.useEffect(() => {
    return () => {
      window._currentQuestUpdate = null;
    };
  }, []);

  // Save quests to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('saved-quests', JSON.stringify(savedQuests));
    } catch (error) {
      console.error('Error saving quests to localStorage:', error);
    }
  }, [savedQuests]);
  
  // Preserve state on unmount for saveState to access
  React.useEffect(() => {
    return () => {
      // Keep a copy of the state for saveState to use after unmount
      if (window._currentQuestState) {
        window._preservedQuestState = { ...window._currentQuestState };
      }
    };
  }, []);

  // Listen for dark mode changes
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Auto-roll on mount if no quest exists (similar to other generators)
  React.useEffect(() => {
    console.log("QuestGen auto-roll effect - quest:", !!quest, "pendingState:", !!window._pendingQuestState);
    
    // Wait longer to allow restoration to complete before deciding to auto-roll
    const timeoutId = setTimeout(() => {
      // Check again after waiting - restoration might have happened
      const hasQuestNow = !!quest;
      const hasPendingState = !!window._pendingQuestState;
      
      console.log("QuestGen auto-roll decision - quest now:", hasQuestNow, "pendingState now:", hasPendingState);
      
      // Only roll if we don't have a quest already (either from state or restored)
      if (!hasQuestNow && !hasPendingState) {
        console.log("QuestGen: Auto-rolling new quest");
        rollQuest();
      } else {
        console.log("QuestGen: Skipping auto-roll, quest exists or pending state available");
      }
    }, 150); // Longer delay to let restoration complete first
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Roll animation trigger function
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

  function rollQuest(skipAnimation = false) {
    // Trigger roll animation first (unless skipping for restoration)
    if (!skipAnimation) {
      triggerRollAnimation();
    }
    
    // Delay the actual quest generation until after the popup disappears
    // Use shorter delay if skipping animation
    setTimeout(() => {
      // Roll for Quest Type
      const questTypeRoll = d6();
      const questType = questTypes[questTypeRoll];
      
      // Roll for Reward
      const rewardRoll = d6();
      let reward = rewards[rewardRoll];
      
      // Handle special case for XP in the form of gold/gems
      if (rewardRoll === 3 || rewardRoll === 4) {
        const currencyRoll = d6();
        if (currencyRoll <= 2) {
          reward = "XP in the form of gold";
        } else {
          reward = "XP in the form of gems";
        }
      }
      
      const newQuest = {
        questType,
        reward,
        questTypeRoll,
        rewardRoll,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setQuest(newQuest);
    }, skipAnimation ? 50 : 500); // Match the popup duration or use shorter delay
  }

  const saveQuest = () => {
    if (!quest) return;
    
    const questToSave = {
      ...quest,
      savedAt: new Date().toLocaleDateString()
    };
    
    setSavedQuests(prev => [questToSave, ...prev.slice(0, 9)]); // Keep last 10 quests
  };

  const deleteQuest = (index) => {
    setSavedQuests(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllQuests = () => {
    setSavedQuests([]);
    try {
      localStorage.removeItem('saved-quests');
    } catch (error) {
      console.error('Error clearing saved quests from localStorage:', error);
    }
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
  }), /*#__PURE__*/React.createElement(CardTitle, null, "FORGE Quest Generator")), /*#__PURE__*/React.createElement("button", {
    className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2",
    onClick: () => rollQuest()
  }, "New Quest")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, [
    // Description
    /*#__PURE__*/React.createElement("p", {
      key: "description",
      className: darkMode ? "text-center text-white" : "text-center text-gray-600"
    }, !quest ? "Click \"New Quest\" to begin." : "Your generated quest details:"),

    // Quest Display
    quest && /*#__PURE__*/React.createElement("div", {
      key: "quest-display",
      className: "p-6 border rounded-lg bg-blue-50"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "quest-content",
        className: "space-y-4"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "quest-type",
          className: "text-center"
        }, [
          /*#__PURE__*/React.createElement("h3", {
            key: "quest-type-label",
            className: "text-lg font-semibold text-gray-700 mb-2"
          }, "Quest Type"),
          /*#__PURE__*/React.createElement("p", {
            key: "quest-type-value",
            className: "text-2xl font-bold text-blue-700"
          }, quest.questType),
          /*#__PURE__*/React.createElement("p", {
            key: "quest-type-roll",
            className: "text-sm text-gray-500 mt-1"
          }, `(Rolled: ${quest.questTypeRoll})`)
        ]),
        
        /*#__PURE__*/React.createElement("div", {
          key: "quest-reward",
          className: "text-center"
        }, [
          /*#__PURE__*/React.createElement("h3", {
            key: "reward-label",
            className: "text-lg font-semibold text-gray-700 mb-2"
          }, "Reward"),
          /*#__PURE__*/React.createElement("p", {
            key: "reward-value",
            className: "text-xl font-semibold text-green-700"
          }, quest.reward),
          /*#__PURE__*/React.createElement("p", {
            key: "reward-roll",
            className: "text-sm text-gray-500 mt-1"
          }, `(Rolled: ${quest.rewardRoll})`)
        ])
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "quest-actions",
        className: "flex justify-center gap-3 mt-6"
      }, [
        /*#__PURE__*/React.createElement("button", {
          key: "save-quest",
          className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm",
          onClick: saveQuest
        }, "Save Quest"),
        /*#__PURE__*/React.createElement("button", {
          key: "new-quest",
          className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm",
          onClick: () => rollQuest()
        }, "New Quest")
      ])
    ]),

    // Saved Quests Section
    savedQuests.length > 0 && /*#__PURE__*/React.createElement("div", {
      key: "saved-quests",
      className: "p-4 border rounded-lg"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "saved-header",
        className: "flex justify-between items-center mb-4"
      }, [
        /*#__PURE__*/React.createElement("h3", {
          key: "saved-title",
          className: "text-lg font-semibold"
        }, "Saved Quests"),
        /*#__PURE__*/React.createElement("button", {
          key: "clear-all",
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
          onClick: clearAllQuests
        }, "Clear All")
      ]),
      
      /*#__PURE__*/React.createElement("div", {
        key: "saved-list",
        className: "space-y-3"
      }, savedQuests.map((savedQuest, index) => 
        /*#__PURE__*/React.createElement("div", {
          key: `saved-${index}`,
          className: "p-3 border rounded bg-gray-50 flex justify-between items-start"
        }, [
          /*#__PURE__*/React.createElement("div", {
            key: "quest-info",
            className: "flex-1"
          }, [
            /*#__PURE__*/React.createElement("div", {
              key: "quest-summary",
              className: "font-medium text-sm"
            }, `${savedQuest.questType} Quest`),
            /*#__PURE__*/React.createElement("div", {
              key: "quest-details",
              className: darkMode ? "text-gray-300 text-xs mt-1" : "text-gray-600 text-xs mt-1"
            }, `Reward: ${savedQuest.reward} • Saved ${savedQuest.savedAt}`)
          ]),
          /*#__PURE__*/React.createElement("button", {
            key: "delete-quest",
            className: "ml-3 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs",
            onClick: () => deleteQuest(index)
          }, "×")
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
    ])
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
  root._reactRoot.render(window.React.createElement(QuestGenerator));
  
  // Wait a moment for the component to render, then set up state persistence
  setTimeout(() => {
    console.log("Setting up Quest Generator state persistence functions");
    
    window.saveState = () => {
      console.log("Quest saveState called");
      
      // First try current state, then fall back to preserved state
      const currentState = window._currentQuestState || window._preservedQuestState;
      if (!currentState) {
        console.log("No current quest state available");
        return null;
      }
      
      const { quest, savedQuests } = currentState;
      
      console.log("Quest state to save:", { quest, savedQuests });
      
      if (quest || (savedQuests && savedQuests.length > 0)) {
        return {
          quest,
          savedQuests,
          timestamp: Date.now()
        };
      }
      return null;
    };
    
    window.restoreState = (state) => {
      console.log("Quest restoreState called with:", state);
      if (state && (state.quest || state.savedQuests)) {
        console.log("Setting pending Quest state for restoration");
        
        // Try direct state update first - no remounting
        if (root._reactRoot) {
          // Set the pending state for any new component that might mount
          window._pendingQuestState = state;
          
          // Try to update current component directly
          setTimeout(() => {
            if (window._currentQuestUpdate) {
              console.log("Attempting direct quest state update");
              window._currentQuestUpdate(state);
            } else {
              console.log("No direct update available, falling back to remount");
              // Fallback to remount if direct update not available
              root._reactRoot.unmount();
              root._reactRoot = null;
              
              setTimeout(() => {
                root._reactRoot = window.ReactDOM.createRoot(root);
                root._reactRoot.render(window.React.createElement(QuestGenerator));
              }, 5);
            }
          }, 10);
        } else {
          console.log("No React root available for Quest restoration");
        }
      } else {
        console.log("No valid Quest state to restore");
      }
    };
    
    console.log("Quest Generator state persistence functions set up");
  }, 10); // Much faster setup - must be faster than main.js restoration delay
}

export { mount };
