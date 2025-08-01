// modules/questGen.compiled.js - FORGE Quest Generator Module
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";
import { names, occupations, weapons, armours, dungeonGear, generalGear, appearances, details, clothes, quirks, personalities, conversationInterests, helmetItem, shieldItem, rationItem, attributeOrder, OCC_ATTR_MAP } from "../tables.js";

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

// Quest Actions for Character Based quests
const characterActions = [
  "Arrest", "Assassinate", "Avenge", "Befriend", "Bribe", "Bring message", "Capture", "Conceal", 
  "Decoy", "Deliver", "Discredit", "Distract", "Entrap", "Expose", "Extort", "Find", "Frame", 
  "Get help from", "Guard", "Identify", "Incriminate", "Infiltrate", "Intimidate", "Kidnap", 
  "Kill", "Negotiate", "Protect", "Rescue", "Sabotage", "Silence", "Smuggle", "Spy on", 
  "Steal from", "Track", "Transport", "Waylay"
];

// Quest Actions for Item Based quests
const itemActions = [
  "Acquire", "Bury", "Conceal", "Consume", "Counterfeit", "Decode", "Defend", "Deliver", 
  "Destroy", "Extract", "Fabricate", "Find", "Forge", "Guard", "Hide", "Hijack", "Inscribe", 
  "Plant", "Protect", "Purify", "Replace", "Replicate", "Repossess", "Restore", "Retake", 
  "Sabotage", "Smuggle", "Steal from place", "Steal in transit", "Stop delivery", "Stop heist", 
  "Stop sabotage", "Study", "Trade", "Transport", "Unearth"
];

// Quest Actions for Location Based quests
const locationActions = [
  "Assault", "Barricade", "Break siege", "Cleanse", "Collapse", "Conceal", "Defend", "Desecrate", 
  "Destroy", "Dismantle", "Escape", "Evacuate", "Exorcise", "Explore", "Find", "Fortify", 
  "Garrison", "Get supplies to", "Investigate", "Liberate", "Locate intruder", "Loot", "Map out", 
  "Occupy", "Protect", "Purify", "Raid", "Rebuild", "Refurbish", "Reinforce", "Rescue hostages", 
  "Retake", "Return item to", "Sabotage", "Survey", "Take item from"
];

// Quest Subjects for Item Based quests
const itemSubjects = [
  "Armour", "Cargo", "Clue", "Corpse", "Crystal", "Deed", "Map", "Evidence of innocence", 
  "Furniture", "Gem", "Gold", "Heirloom", "Idol", "Ingredient", "Jewellery", "Key", "Livestock", 
  "Magic item", "Manuscript", "Evidence of crime", "Medicine", "Message", "Monster", "Painting", 
  "Potion", "Prisoner", "Recipe", "Religious item", "Sealed container", "Ship", "Statue", 
  "Symbol of authority", "Tome", "Unusual animal", "Vehicle", "Weapon"
];

// Quest Subjects for Location Based quests
const locationSubjects = [
  "Dungeon Location", "Wilderness Location", "Another Settlement", 
  "Slums Location", "Public Location", "Elite Location"
];

// Quest Subjects for Character Based quests
const questSubjects = {
  1: "Urban Character",
  2: "Urban Character",
  3: "Rural Character", 
  4: "Rural Character",
  5: "Wilderness Character",
  6: "Wilderness Character"
};

// Function to roll Location Based quest subjects
function rollLocationSubject() {
  const firstRoll = Math.floor(Math.random() * 6) + 1;
  
  if (firstRoll <= 2) {
    return "Dungeon Location";
  } else if (firstRoll <= 4) {
    return "Wilderness Location";
  } else {
    // Settlement Location - requires second d6 roll
    const secondRoll = Math.floor(Math.random() * 6) + 1;
    if (secondRoll <= 2) {
      return "Another Settlement";
    } else if (secondRoll === 3) {
      return "Slums Location";
    } else if (secondRoll <= 5) {
      return "Public Location";
    } else {
      return "Elite Location";
    }
  }
}

// Direction and Distance tables for location-based quests
const directions = {
  1: "North-east (NE)",
  2: "East (E)",
  3: "South-east (SE)",
  4: "South-west (SW)",
  5: "West (W)",
  6: "North-west (NW)"
};

const distances = {
  1: "1 hex (~6 miles)",
  2: "2 hexes (~12 miles)",
  3: "3 hexes (~18 miles)",
  4: "4 hexes (~24 miles)",
  5: "5 hexes (~30 miles)",
  6: "6 hexes (~36 miles)"
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
  const [showQuestTypeDropdown, setShowQuestTypeDropdown] = React.useState(false);
  const [showRewardDropdown, setShowRewardDropdown] = React.useState(false);
  const [showRewardInfo, setShowRewardInfo] = React.useState(false);
  const [showQuestActionDropdown, setShowQuestActionDropdown] = React.useState(false);
  const [showQuestSubjectDropdown, setShowQuestSubjectDropdown] = React.useState(false);
  const [showLocationDirectionDistanceDropdown, setShowLocationDirectionDistanceDropdown] = React.useState(false);
  const [locationDirectionDistance, setLocationDirectionDistance] = React.useState(() => {
    // Check for pending state on initialization
    return pendingState && pendingState.locationDirectionDistance ? pendingState.locationDirectionDistance : null;
  });
  const [generatedCharacter, setGeneratedCharacter] = React.useState(() => {
    // Check for pending state on initialization
    return pendingState && pendingState.generatedCharacter ? pendingState.generatedCharacter : null;
  });
  const [preGeneratedNPC, setPreGeneratedNPC] = React.useState(() => {
    // Check for pending state on initialization
    return pendingState && pendingState.preGeneratedNPC ? pendingState.preGeneratedNPC : null;
  });

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
      if (backupPendingState.locationDirectionDistance !== undefined) {
        setLocationDirectionDistance(backupPendingState.locationDirectionDistance);
      }
      if (backupPendingState.generatedCharacter !== undefined) {
        setGeneratedCharacter(backupPendingState.generatedCharacter);
      }
      if (backupPendingState.preGeneratedNPC !== undefined) {
        setPreGeneratedNPC(backupPendingState.preGeneratedNPC);
      }
      
      // Clear the pending state
      delete window._pendingQuestState;
    }
  }, []);

  // Store current state globally for saveState function to access
  React.useEffect(() => {
    window._currentQuestState = {
      quest,
      savedQuests,
      locationDirectionDistance,
      generatedCharacter,
      preGeneratedNPC
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
      if (state.locationDirectionDistance !== undefined) {
        setLocationDirectionDistance(state.locationDirectionDistance);
      }
      if (state.generatedCharacter !== undefined) {
        setGeneratedCharacter(state.generatedCharacter);
      }
      if (state.preGeneratedNPC !== undefined) {
        setPreGeneratedNPC(state.preGeneratedNPC);
      }
      // Clear pending state after successful update
      window._pendingQuestState = null;
    };
  }, [quest, savedQuests, locationDirectionDistance, generatedCharacter, preGeneratedNPC]);
  
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

      // Add contextual Quest Action and Subject for Character Based quests
      if (questType === "Character Based") {
        const questAction = pick(characterActions);
        const questSubjectRoll = d6();
        const questSubject = questSubjects[questSubjectRoll];
        
        newQuest.questAction = questAction;
        newQuest.questSubject = questSubject;
        newQuest.questSubjectRoll = questSubjectRoll;
      }
      
      // Add contextual Quest Action and Subject for Item Based quests
      if (questType === "Item Based") {
        const questAction = pick(itemActions);
        const questSubject = pick(itemSubjects);
        
        newQuest.questAction = questAction;
        newQuest.questSubject = questSubject;
      }
      
      // Add contextual Quest Action and Subject for Location Based quests
      if (questType === "Location Based") {
        const questAction = pick(locationActions);
        const questSubject = rollLocationSubject();
        
        newQuest.questAction = questAction;
        newQuest.questSubject = questSubject;
      }
      
      setQuest(newQuest);
      // Reset location direction and distance for new quest
      setLocationDirectionDistance(null);
      // Reset generated character for new quest
      setGeneratedCharacter(null);
      setPreGeneratedNPC(null);
    }, skipAnimation ? 50 : 500); // Match the popup duration or use shorter delay
  }

  const rerollQuestType = () => {
    if (!quest) return;
    const questTypeRoll = d6();
    const questType = questTypes[questTypeRoll];
    
    // Generate new contextual Quest Action and Subject for the new quest type
    let newQuest = {
      ...quest,
      questType,
      questTypeRoll
    };

    // Add contextual Quest Action and Subject based on new quest type
    if (questType === "Character Based") {
      const questAction = pick(characterActions);
      const questSubjectRoll = d6();
      const questSubject = questSubjects[questSubjectRoll];
      
      newQuest.questAction = questAction;
      newQuest.questSubject = questSubject;
      newQuest.questSubjectRoll = questSubjectRoll;
    } else if (questType === "Item Based") {
      const questAction = pick(itemActions);
      const questSubject = pick(itemSubjects);
      
      newQuest.questAction = questAction;
      newQuest.questSubject = questSubject;
      // Remove questSubjectRoll for item-based quests as they don't use it
      delete newQuest.questSubjectRoll;
    } else if (questType === "Location Based") {
      const questAction = pick(locationActions);
      const questSubject = rollLocationSubject();
      
      newQuest.questAction = questAction;
      newQuest.questSubject = questSubject;
      // Remove questSubjectRoll for location-based quests as they use complex rolling
      delete newQuest.questSubjectRoll;
    }
    
    setQuest(newQuest);
    // Reset generated character when quest type changes
    setGeneratedCharacter(null);
    setPreGeneratedNPC(null);
  };

  const rerollReward = () => {
    if (!quest) return;
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
    
    setQuest(prev => ({
      ...prev,
      reward,
      rewardRoll
    }));
  };

  const rerollQuestAction = () => {
    if (!quest) return;
    
    let questAction;
    if (quest.questType === "Character Based") {
      questAction = pick(characterActions);
    } else if (quest.questType === "Item Based") {
      questAction = pick(itemActions);
    } else if (quest.questType === "Location Based") {
      questAction = pick(locationActions);
    } else {
      return; // No action for other quest types
    }
    
    setQuest(prev => ({
      ...prev,
      questAction
    }));
  };

  const rerollQuestSubject = () => {
    if (!quest) return;
    
    if (quest.questType === "Character Based") {
      const questSubjectRoll = d6();
      const questSubject = questSubjects[questSubjectRoll];
      setQuest(prev => ({
        ...prev,
        questSubject,
        questSubjectRoll
      }));
      // Reset generated character when subject changes
      setGeneratedCharacter(null);
      setPreGeneratedNPC(null);
    } else if (quest.questType === "Item Based") {
      const questSubject = pick(itemSubjects);
      setQuest(prev => ({
        ...prev,
        questSubject
      }));
    } else if (quest.questType === "Location Based") {
      const questSubject = rollLocationSubject();
      setQuest(prev => ({
        ...prev,
        questSubject
      }));
    }
  };

  const rollLocationDirectionDistance = () => {
    const directionRoll = d6();
    const distanceRoll = d6();
    const direction = directions[directionRoll];
    const distance = distances[distanceRoll];
    
    setLocationDirectionDistance(`${direction}, ${distance}`);
  };

  const generateCharacterForQuest = (questSubject) => {
    // Define occupation arrays for each character type
    const urbanOccupations = [
      "Actor", "Architect", "Aristocrat", "Assassin", "Beggar", "Cleric", "Courtier", "Dealer", 
      "Engineer", "Executioner", "Jailer", "Jester", "Judge", "Knight", "Locksmith", "Mage", 
      "Magister", "Musician", "Noble", "Paladin", "Pickpocket", "Pit-fighter", "Politician", 
      "Racketeer", "Reverend", "Scribe", "Servant", "Shopkeeper", "Spy", "Squire", "Statesman", 
      "Steward", "Teacher", "Thug", "Undertaker", "Vagrant"
    ];

    const ruralOccupations = [
      "Acolyte", "Acrobat", "Alchemist", "Apothecary", "Arbalist", "Armorer", "Artificer", 
      "Blacksmith", "Bodyguard", "Builder", "Burglar", "Butcher", "Carpenter", "Charlatan", 
      "Cook", "Driver", "Duellist", "Fence", "Fisherman", "Gambler", "Herald", "Hitman", 
      "Illusionist", "Inventor", "Mercenary", "Merchant", "Preacher", "Rogue", "Scientist", 
      "Scrapper", "Shepherd", "Sorcerer", "Thief", "Villager", "Warrior", "Wizard"
    ];

    const wildernessOccupations = [
      "Astrologer", "Bandit", "Barbarian", "Cartographer", "Chronicler", "Courier", "Deserter", 
      "Drifter", "Druid", "Dungeoneer", "Explorer", "Falconer", "Gamekeeper", "Gardener", 
      "Herbalist", "Hermit", "Highwayman", "Hunter", "Missionary", "Monk", "Navigator", 
      "Occultist", "Outcast", "Outlaw", "Pilgrim", "Ranger", "Recluse", "Researcher", "Sailor", 
      "Slaver", "Smuggler", "Tracker", "Trader", "Warlock", "Witch", "Woodsman"
    ];

    // Select appropriate occupation array based on quest subject
    let occupationArray;
    if (questSubject === "Urban Character") {
      occupationArray = urbanOccupations;
    } else if (questSubject === "Rural Character") {
      occupationArray = ruralOccupations;
    } else if (questSubject === "Wilderness Character") {
      occupationArray = wildernessOccupations;
    } else {
      console.error("Unknown quest subject:", questSubject);
      return;
    }

    // Helper functions (copied exactly from NPC generator)
    const mod = v => {
      if (v === 1) return -4;
      if (v <= 3) return -3;
      if (v <= 5) return -2;
      if (v <= 8) return -1;
      if (v <= 12) return 0;
      if (v <= 15) return 1;
      if (v <= 17) return 2;
      return 3;
    };

    const choosePrimaries = (o1, o2) => {
      const set = new Set();
      const lower = [o1.toLowerCase(), o2.toLowerCase()];
      for (const { attr, keys } of OCC_ATTR_MAP) {
        if (lower.some(o => keys.some(k => o.includes(k)))) set.add(attr);
        if (set.size === 2) break;
      }
      while (set.size < 2) set.add(pick(attributeOrder));
      return set;
    };

    const roll3d6 = () => d6() + d6() + d6();
    const roll2d6 = () => d6() + d6();
    const d8 = () => Math.floor(Math.random() * 8) + 1;

    // Generate full NPC character using exact NPC generator logic
    console.log("Generating full NPC character in background for quest...");

    // Generate character name and occupation
    const characterName = pick(names);
    const characterOccupation = pick(occupationArray);
    
    // Get second occupation from full list for diversity
    let occ2 = pick(occupations);
    while (occ2 === characterOccupation) occ2 = pick(occupations);

    // Generate attributes (exact copy from NPC generator)
    const scores = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primariesInit = choosePrimaries(characterOccupation, occ2);
    
    const attrs = attributeOrder.map(a => {
      const s = scores[a];
      const m = 0; // NPCs always have +0 modifier
      return {
        attr: a,
        score: s,
        mod: m,
        primary: primariesInit.has(a),
        check: m + (primariesInit.has(a) ? 1 : Math.floor(1 / 2)) // level 1: primary = +1, secondary = +0
      };
    });

    // Generate HP arrays
    const rawHpPrimaryArr = Array.from({ length: 10 }, d8);
    const rawHpSecondaryArr = Array.from({ length: 10 }, d6);

    // EXACT COPY OF NPC GENERATOR ARMOR/SHIELD LOGIC
    // Handle armor and shield generation (no npcType restrictions for quest NPCs)
    const aRoll = roll2d6();
    let armour = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];
    const hs = roll2d6();
    const hasHelmet = hs >= 6 && hs <= 7 || hs >= 11;
    let hasShield = hs >= 8 && hs <= 10 || hs >= 11;

    const dexMod = 0; // NPCs always have +0 modifier
    const strengthAttr = attrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.mod; // Use mod temporarily, will be recalculated later
    
    let equipmentRoll = roll2d6();
    
    let equipment;
    if (equipmentRoll <= 3) {
      equipment = "Nothing";
    } else if (equipmentRoll <= 6) {
      equipment = "Basic travel";
    } else if (equipmentRoll <= 9) {
      equipment = "Basic combat";
    } else if (equipmentRoll <= 11) {
      equipment = "Travel & combat";
    } else {
      equipment = "Anything";
    }
    
    // Adjust armor based on equipment type (exact copy from NPC generator)
    if (equipment === "Basic combat") {
      // Limit Basic combat to leather armor or no armor (AC 10-12)
      if (armour.ac > 12) {
        armour = Math.random() < 0.5 ? armours[0] : armours[1]; // 50/50 chance of no armor vs leather
        hasShield = false; // Basic combat doesn't get shields
      }
    } else if (equipment === "Anything") {
      // For "Anything" equipment, set armor to either chain or plate
      armour = Math.random() < 0.5 ? armours[2] : armours[3]; // 50/50 chance of chain vs plate
    }
    
    // Recalculate AC after potential armor adjustment (exact copy)
    const acBase = armour.ac;
    const acShield = hasShield ? 1 : 0;
    const acDex = 0; // NPCs get no Dex bonus to AC
    const ac = acBase + acShield + acDex;
    
    // Select weapon based on equipment type (exact copy)
    let availableWeapons = weapons;
    if (equipment === "Basic combat") {
      availableWeapons = weapons.filter(w => w.slots === 1);
    }
    const weapon = pick(availableWeapons);
    
    // Create inventory with the selected weapon (exact copy from NPC generator)
    let inventory = [{ name: weapon.name, slots: weapon.slots }];
    if (weapon.name === "Sling") {
      inventory.push({ name: "Pouch of Bullets x20", slots: 1 });
    } else if (weapon.name === "Hand Crossbow" || weapon.name === "Crossbow") {
      inventory.push({ name: "Case of Bolts x20", slots: 1 });
    } else if (weapon.name === "Shortbow" || weapon.name === "Longbow" || weapon.name === "Warbow") {
      inventory.push({ name: "Quiver of Arrows x20", slots: 1 });
    }
    inventory.push(
      armour.name !== "No Armour" ? { name: armour.name, slots: armour.slots } : null,
      hasHelmet ? helmetItem : null,
      hasShield ? shieldItem : null,
      pick(dungeonGear),
      (() => { let g1 = pick(generalGear), g2 = pick(generalGear); while (g2.name === g1.name) g2 = pick(generalGear); return [g1, g2]; })(),
      rationItem,
      { ...rationItem }
    );
    inventory = inventory.flat().filter(Boolean);
    
    // Roll for Competence and set Level and Morale (exact copy)
    let competenceRoll = roll2d6();
    
    let competence, level, morale;
    if (competenceRoll <= 3) {
      competence = "A liability";
      level = 0;
      morale = 5;
    } else if (competenceRoll <= 6) {
      competence = "Average";
      level = 1;
      morale = 6;
    } else if (competenceRoll <= 9) {
      competence = "Competent";
      level = 1;
      morale = 7;
    } else if (competenceRoll <= 11) {
      competence = "Very capable";
      level = 2;
      morale = 8;
    } else {
      competence = "Exceptional";
      level = 3;
      morale = 9;
    }
    
    // Roll for Alignment (exact copy)
    const alignmentRoll = d6();
    let alignment;
    if (alignmentRoll <= 2) {
      alignment = "Lawful";
    } else if (alignmentRoll <= 5) {
      alignment = "Neutral";
    } else {
      alignment = "Chaotic";
    }
    
    // Calculate wage based on level (exact copy)
    let wage;
    if (level === 0) {
      wage = "2gp";
    } else if (level === 1) {
      wage = "5gp";
    } else if (level === 2) {
      wage = "15gp";
    } else if (level === 3) {
      wage = "25gp";
    } else {
      wage = "1/2 Share";
    }

    // Update attributes with correct primaries based on level (exact copy from NPC generator)
    const finalAttrs = attrs.map(a => ({
      ...a,
      mod: 0, // Ensure NPCs always have +0 modifier
      primary: primariesInit.has(a.attr),
      check: 0 + (primariesInit.has(a.attr) ? level : Math.floor(level / 2)) // NPCs: mod is always 0
    }));

    // If level is 0, all attributes are secondary (exact copy)
    if (level === 0) {
      finalAttrs.forEach(a => {
        a.primary = false;
        a.mod = 0; // Ensure NPCs always have +0 modifier
        a.check = 0; // Level 0 NPCs get +0 to all checks
      });
    }

    // Override AC if equipment is "Nothing" or "Basic travel" (exact copy from NPC generator)
    let finalAc = ac;
    let finalAcBreakdown = { base: acBase, shield: acShield, dex: acDex };
    if (equipment === "Nothing" || equipment === "Basic travel") {
      finalAc = 10;
      finalAcBreakdown = { base: 10, shield: 0, dex: 0 };
    }

    const finalStrengthAttr = finalAttrs.find(a => a.attr === "Strength");
    const finalMaxSlots = 10 + finalStrengthAttr.check;

    // Create complete NPC character object (exact copy structure from NPC generator)
    const fullNPCCharacter = {
      name: characterName,
      level: level,
      alignment: alignment,
      occupations: [characterOccupation],
      attrs: finalAttrs,
      maxSlots: finalMaxSlots,
      rawHpPrimary: rawHpPrimaryArr,
      rawHpSecondary: rawHpSecondaryArr,
      ac: finalAc,
      acBreakdown: finalAcBreakdown,
      inventory,
      totalSlots: inventory.reduce((s, i) => s + i.slots, 0),
      appearance: pick(appearances),
      detail: pick(details),
      clothing: pick(clothes),
      quirk: pick(quirks),
      personality: pick(personalities),
      conversationInterest: pick(conversationInterests),
      morale,
      wage,
      equipment,
      competence
    };

    // Store both the simple character summary and full NPC data
    const characterSummary = {
      name: characterName,
      occupation: characterOccupation
    };

    setGeneratedCharacter(characterSummary);
    setPreGeneratedNPC(fullNPCCharacter);
    
    console.log("Generated character summary:", characterSummary);
    console.log("Pre-generated full NPC:", fullNPCCharacter);
  };

  const viewCharacterDetails = () => {
    if (!generatedCharacter || !preGeneratedNPC) return;

    // Save current quest generator state
    if (window.saveState) {
      const currentState = window.saveState();
      if (currentState) {
        sessionStorage.setItem('questGeneratorState', JSON.stringify(currentState));
      }
    }

    // Store the complete pre-generated NPC character for direct loading
    sessionStorage.setItem('preGeneratedNPCData', JSON.stringify(preGeneratedNPC));
    sessionStorage.setItem('returnToQuestGenerator', 'true');

    // Navigate to NPC generator
    if (window.loadModule) {
      window.loadModule('./modules/npcGen.compiled.js');
    } else {
      console.error("loadModule function not available");
    }
  };

  const saveQuest = () => {
    if (!quest) return;
    
    const questToSave = {
      ...quest,
      locationDirectionDistance, // Include location direction and distance
      generatedCharacter, // Include generated character information
      preGeneratedNPC, // Include full pre-generated NPC data
      id: Date.now() + Math.random(), // Unique ID for each saved quest
      savedAt: new Date().toLocaleDateString()
    };
    
    setSavedQuests(prev => [questToSave, ...prev.slice(0, 9)]); // Keep last 10 quests
  };

  const loadQuest = (savedQuest) => {
    // Create a copy without the savedAt and id fields for the current quest
    const questToLoad = {
      questType: savedQuest.questType,
      reward: savedQuest.reward,
      questTypeRoll: savedQuest.questTypeRoll,
      rewardRoll: savedQuest.rewardRoll,
      timestamp: savedQuest.timestamp
    };
    
    // Include new fields if they exist
    if (savedQuest.questAction) {
      questToLoad.questAction = savedQuest.questAction;
    }
    if (savedQuest.questSubject) {
      questToLoad.questSubject = savedQuest.questSubject;
      questToLoad.questSubjectRoll = savedQuest.questSubjectRoll;
    }
    
    setQuest(questToLoad);
    
    // Also restore location direction and distance if it exists
    if (savedQuest.locationDirectionDistance) {
      setLocationDirectionDistance(savedQuest.locationDirectionDistance);
    } else {
      setLocationDirectionDistance(null);
    }
    
    // Also restore generated character if it exists
    if (savedQuest.generatedCharacter) {
      setGeneratedCharacter(savedQuest.generatedCharacter);
    } else {
      setGeneratedCharacter(null);
    }
    
    // Also restore pre-generated NPC if it exists
    if (savedQuest.preGeneratedNPC) {
      setPreGeneratedNPC(savedQuest.preGeneratedNPC);
    } else {
      setPreGeneratedNPC(null);
    }
  };

  const deleteQuest = (questId) => {
    setSavedQuests(prev => prev.filter(quest => quest.id !== questId));
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl space-y-4"
  }, [
    /*#__PURE__*/React.createElement(Card, {
      key: "main-card"
    }, [
      /*#__PURE__*/React.createElement(CardHeader, {
        key: "card-header"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "header-content",
          className: "flex items-center gap-3"
        }, [
          /*#__PURE__*/React.createElement("img", {
            key: "favicon",
            src: "favicon.ico",
            alt: "Forge Favicon",
            style: {
              width: 32,
              height: 32
            }
          }),
          /*#__PURE__*/React.createElement(CardTitle, {
            key: "card-title"
          }, "FORGE Quest Generator")
        ]),
        /*#__PURE__*/React.createElement("button", {
          key: "new-quest-btn",
          className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2",
          onClick: () => rollQuest()
        }, "New Quest")
      ]),
      /*#__PURE__*/React.createElement(CardContent, {
        key: "card-content"
      }, /*#__PURE__*/React.createElement("div", {
        className: "space-y-6"
      }, [
        // Description
        /*#__PURE__*/React.createElement("p", {
          key: "description",
          className: darkMode ? "text-center text-white" : "text-center text-gray-600"
        }, !quest ? "Click \"New Quest\" to begin." : ""),

        // Quest Fields (directly in CardContent like NPC generator)
        quest && /*#__PURE__*/React.createElement("div", {
          key: "quest-fields",
          className: "space-y-4"
        }, [
          // 2x2 Grid for main quest fields
          /*#__PURE__*/React.createElement("div", {
            key: "quest-grid",
            className: "grid grid-cols-2 gap-4"
          }, [
            // Quest Type Field (top left)
            /*#__PURE__*/React.createElement("div", {
              key: "quest-type-field"
            }, [
            /*#__PURE__*/React.createElement("div", {
              key: "quest-type-header",
              className: "flex items-center gap-2 mb-1"
            }, [
              /*#__PURE__*/React.createElement("span", {
                key: "quest-type-label",
                className: "text-xs text-gray-500"
              }, "Quest Type"),
              /*#__PURE__*/React.createElement("button", {
                key: "quest-type-dropdown-btn",
                className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                onClick: () => setShowQuestTypeDropdown(v => !v),
                style: { fontSize: "0.75rem" }
              }, "..."),
              showQuestTypeDropdown && /*#__PURE__*/React.createElement("button", {
                key: "quest-type-reroll-btn",
                className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                style: {
                  fontSize: "0.75rem",
                  height: "25px",
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: "4px"
                },
                type: "button",
                onMouseDown: e => e.preventDefault(),
                onClick: rerollQuestType,
                tabIndex: -1
              }, /*#__PURE__*/React.createElement("img", {
                src: "./d6.png",
                alt: "Reroll",
                style: {
                  width: "25px",
                  height: "25px",
                  filter: darkMode ? "invert(1)" : "none"
                }
              }))
            ]),
            showQuestTypeDropdown ? /*#__PURE__*/React.createElement("div", {
              key: "quest-type-dropdown",
              className: "flex items-center gap-2"
            }, /*#__PURE__*/React.createElement("select", {
              value: quest.questType,
              onChange: (e) => {
                const selectedType = e.target.value;
                // Find the roll number for this type
                const rollNum = Object.keys(questTypes).find(key => questTypes[key] === selectedType);
                
                // Generate new contextual Quest Action and Subject for the selected quest type
                let newQuest = {
                  ...quest,
                  questType: selectedType,
                  questTypeRoll: parseInt(rollNum)
                };

                // Add contextual Quest Action and Subject based on selected quest type
                if (selectedType === "Character Based") {
                  const questAction = pick(characterActions);
                  const questSubjectRoll = d6();
                  const questSubject = questSubjects[questSubjectRoll];
                  
                  newQuest.questAction = questAction;
                  newQuest.questSubject = questSubject;
                  newQuest.questSubjectRoll = questSubjectRoll;
                } else if (selectedType === "Item Based") {
                  const questAction = pick(itemActions);
                  const questSubject = pick(itemSubjects);
                  
                  newQuest.questAction = questAction;
                  newQuest.questSubject = questSubject;
                  // Remove questSubjectRoll for item-based quests as they don't use it
                  delete newQuest.questSubjectRoll;
                } else if (selectedType === "Location Based") {
                  const questAction = pick(locationActions);
                  const questSubject = rollLocationSubject();
                  
                  newQuest.questAction = questAction;
                  newQuest.questSubject = questSubject;
                  // Remove questSubjectRoll for location-based quests as they use complex rolling
                  delete newQuest.questSubjectRoll;
                }
                
                setQuest(newQuest);
              },
              className: "border rounded px-1 py-0.5 text-sm",
              autoFocus: true,
              onBlur: () => setShowQuestTypeDropdown(false)
            }, [
              /*#__PURE__*/React.createElement("option", { key: "character", value: "Character Based" }, "Character Based"),
              /*#__PURE__*/React.createElement("option", { key: "item", value: "Item Based" }, "Item Based"),
              /*#__PURE__*/React.createElement("option", { key: "location", value: "Location Based" }, "Location Based")
            ])) : /*#__PURE__*/React.createElement("div", {
              key: "quest-type-value",
              className: "font-semibold"
            }, quest.questType)
          ]),

          // Reward Field (top right)
          /*#__PURE__*/React.createElement("div", {
            key: "reward-field"
          }, [
            /*#__PURE__*/React.createElement("div", {
              key: "reward-header",
              className: "flex items-center gap-2 mb-1"
            }, [
              /*#__PURE__*/React.createElement("span", {
                key: "reward-label",
                className: "text-xs text-gray-500"
              }, "Reward"),
              /*#__PURE__*/React.createElement("button", {
                key: "reward-info-btn",
                className: "w-4 h-4 rounded-full bg-blue-500 text-white text-xs hover:bg-blue-600 flex items-center justify-center",
                onClick: () => setShowRewardInfo(true),
                style: { fontSize: "0.6rem", fontWeight: "bold" },
                title: "Reward Information"
              }, "i"),
              /*#__PURE__*/React.createElement("button", {
                key: "reward-dropdown-btn",
                className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                onClick: () => setShowRewardDropdown(v => !v),
                style: { fontSize: "0.75rem" }
              }, "..."),
              showRewardDropdown && /*#__PURE__*/React.createElement("button", {
                key: "reward-reroll-btn",
                className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                style: {
                  fontSize: "0.75rem",
                  height: "25px",
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: "4px"
                },
                type: "button",
                onMouseDown: e => e.preventDefault(),
                onClick: rerollReward,
                tabIndex: -1
              }, /*#__PURE__*/React.createElement("img", {
                src: "./d6.png",
                alt: "Reroll",
                style: {
                  width: "25px",
                  height: "25px",
                  filter: darkMode ? "invert(1)" : "none"
                }
              }))
            ]),
            showRewardDropdown ? /*#__PURE__*/React.createElement("div", {
              key: "reward-dropdown",
              className: "flex items-center gap-2"
            }, /*#__PURE__*/React.createElement("select", {
              value: quest.reward,
              onChange: (e) => {
                const selectedReward = e.target.value;
                // Find the roll number for this reward
                let rollNum = Object.keys(rewards).find(key => rewards[key] === selectedReward);
                // Handle special cases for gold/gems
                if (selectedReward === "XP in the form of gold") rollNum = "3";
                if (selectedReward === "XP in the form of gems") rollNum = "4";
                setQuest(prev => ({
                  ...prev,
                  reward: selectedReward,
                  rewardRoll: parseInt(rollNum)
                }));
              },
              className: "border rounded px-1 py-0.5 text-sm",
              autoFocus: true,
              onBlur: () => setShowRewardDropdown(false)
            }, [
              /*#__PURE__*/React.createElement("option", { key: "no-reward", value: "No monetary reward, just XP" }, "No monetary reward, just XP"),
              /*#__PURE__*/React.createElement("option", { key: "gold", value: "XP in the form of gold" }, "XP in the form of gold"),
              /*#__PURE__*/React.createElement("option", { key: "gems", value: "XP in the form of gems" }, "XP in the form of gems"),
              /*#__PURE__*/React.createElement("option", { key: "item", value: "XP plus an Item" }, "XP plus an Item")
            ])) : /*#__PURE__*/React.createElement("div", {
              key: "reward-value",
              className: "font-semibold"
            }, quest.reward)
          ]),

          // Quest Action Field (bottom left - for Character Based, Item Based, and Location Based quests)
          (quest.questType === "Character Based" || quest.questType === "Item Based" || quest.questType === "Location Based") && quest.questAction && /*#__PURE__*/React.createElement("div", {
            key: "quest-action-field"
          }, [
            /*#__PURE__*/React.createElement("div", {
              key: "quest-action-header",
              className: "flex items-center gap-2 mb-1"
            }, [
              /*#__PURE__*/React.createElement("span", {
                key: "quest-action-label",
                className: "text-xs text-gray-500"
              }, "Quest Action"),
              /*#__PURE__*/React.createElement("button", {
                key: "quest-action-dropdown-btn",
                className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                onClick: () => setShowQuestActionDropdown(v => !v),
                style: { fontSize: "0.75rem" }
              }, "..."),
              showQuestActionDropdown && /*#__PURE__*/React.createElement("button", {
                key: "quest-action-reroll-btn",
                className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                style: {
                  fontSize: "0.75rem",
                  height: "25px",
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: "4px"
                },
                type: "button",
                onMouseDown: e => e.preventDefault(),
                onClick: rerollQuestAction,
                tabIndex: -1
              }, /*#__PURE__*/React.createElement("img", {
                src: "./d6.png",
                alt: "Reroll",
                style: {
                  width: "25px",
                  height: "25px",
                  filter: darkMode ? "invert(1)" : "none"
                }
              }))
            ]),
            showQuestActionDropdown ? /*#__PURE__*/React.createElement("div", {
              key: "quest-action-dropdown",
              className: "flex items-center gap-2"
            }, /*#__PURE__*/React.createElement("select", {
              value: quest.questAction,
              onChange: (e) => {
                setQuest(prev => ({
                  ...prev,
                  questAction: e.target.value
                }));
              },
              className: "border rounded px-1 py-0.5 text-sm",
              autoFocus: true,
              onBlur: () => setShowQuestActionDropdown(false)
            }, (quest.questType === "Character Based" ? characterActions : 
                quest.questType === "Item Based" ? itemActions : 
                locationActions).map(action => /*#__PURE__*/React.createElement("option", { 
              key: action, 
              value: action 
            }, action)))) : /*#__PURE__*/React.createElement("div", {
              key: "quest-action-value",
              className: "font-semibold"
            }, quest.questAction)
          ]),

          // Quest Subject Field (bottom right - for Character Based, Item Based, and Location Based quests)
          (quest.questType === "Character Based" || quest.questType === "Item Based" || quest.questType === "Location Based") && quest.questSubject && /*#__PURE__*/React.createElement("div", {
            key: "quest-subject-field"
          }, [
            /*#__PURE__*/React.createElement("div", {
              key: "quest-subject-header",
              className: "flex items-center gap-2 mb-1"
            }, [
              /*#__PURE__*/React.createElement("span", {
                key: "quest-subject-label",
                className: "text-xs text-gray-500"
              }, "Quest Subject"),
              /*#__PURE__*/React.createElement("button", {
                key: "quest-subject-dropdown-btn",
                className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                onClick: () => setShowQuestSubjectDropdown(v => !v),
                style: { fontSize: "0.75rem" }
              }, "..."),
              showQuestSubjectDropdown && /*#__PURE__*/React.createElement("button", {
                key: "quest-subject-reroll-btn",
                className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                style: {
                  fontSize: "0.75rem",
                  height: "25px",
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: "4px"
                },
                type: "button",
                onMouseDown: e => e.preventDefault(),
                onClick: rerollQuestSubject,
                tabIndex: -1
              }, /*#__PURE__*/React.createElement("img", {
                src: "./d6.png",
                alt: "Reroll",
                style: {
                  width: "25px",
                  height: "25px",
                  filter: darkMode ? "invert(1)" : "none"
                }
              }))
            ]),
            showQuestSubjectDropdown ? /*#__PURE__*/React.createElement("div", {
              key: "quest-subject-dropdown",
              className: "flex items-center gap-2"
            }, /*#__PURE__*/React.createElement("select", {
              value: quest.questSubject,
              onChange: (e) => {
                const selectedSubject = e.target.value;
                if (quest.questType === "Character Based") {
                  // Find the roll number for character subjects
                  const rollNum = Object.keys(questSubjects).find(key => questSubjects[key] === selectedSubject);
                  setQuest(prev => ({
                    ...prev,
                    questSubject: selectedSubject,
                    questSubjectRoll: parseInt(rollNum)
                  }));
                  // Reset generated character when subject changes via dropdown
                  setGeneratedCharacter(null);
                  setPreGeneratedNPC(null);
                } else {
                  // For item subjects, no roll number needed
                  setQuest(prev => ({
                    ...prev,
                    questSubject: selectedSubject
                  }));
                }
              },
              className: "border rounded px-1 py-0.5 text-sm",
              autoFocus: true,
              onBlur: () => setShowQuestSubjectDropdown(false)
            }, quest.questType === "Character Based" ? [
              /*#__PURE__*/React.createElement("option", { key: "urban", value: "Urban Character" }, "Urban Character"),
              /*#__PURE__*/React.createElement("option", { key: "rural", value: "Rural Character" }, "Rural Character"),
              /*#__PURE__*/React.createElement("option", { key: "wilderness", value: "Wilderness Character" }, "Wilderness Character")
            ] : quest.questType === "Item Based" ? itemSubjects.map(subject => /*#__PURE__*/React.createElement("option", { 
              key: subject, 
              value: subject 
            }, subject)) : locationSubjects.map(subject => /*#__PURE__*/React.createElement("option", { 
              key: subject, 
              value: subject 
            }, subject)))) : /*#__PURE__*/React.createElement("div", {
              key: "quest-subject-value",
              className: "font-semibold"
            }, quest.questSubject),
            
            // Generate Character Button or Character Summary (directly below Quest Subject for Character Based quests only)
            quest.questType === "Character Based" && quest.questSubject && /*#__PURE__*/React.createElement("div", {
              key: "generate-character-section",
              className: "mt-3"
            }, generatedCharacter ? 
              // Show character summary with Full Details button if character has been generated
              /*#__PURE__*/React.createElement("div", {
                key: "character-summary",
                className: "p-3 rounded border-l-4 border-blue-600"
              }, [
                /*#__PURE__*/React.createElement("div", {
                  key: "character-name",
                  className: darkMode ? "font-semibold text-lg text-blue-300 mb-2" : "font-semibold text-lg text-blue-700 mb-2"
                }, `${generatedCharacter.name} the ${generatedCharacter.occupation}`),
                /*#__PURE__*/React.createElement("button", {
                  key: "full-details-btn",
                  className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs",
                  onClick: viewCharacterDetails
                }, "Full Details")
              ]) :
              // Show generate button if no character has been generated
              /*#__PURE__*/React.createElement("button", {
                key: "generate-character-btn",
                className: "px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm",
                style: { width: '175px' },
                onClick: () => generateCharacterForQuest(quest.questSubject)
              }, "Generate Character"))
          ])
          ]),

          // Location Direction and Distance Field (independent of quest type)
          /*#__PURE__*/React.createElement("div", {
            key: "location-direction-distance-field"
          }, [
            /*#__PURE__*/React.createElement("div", {
              key: "location-direction-distance-header",
              className: "flex items-center gap-2 mb-1"
            }, [
              /*#__PURE__*/React.createElement("span", {
                key: "location-direction-distance-label",
                className: "text-xs text-gray-500"
              }, "Location Direction and Distance"),
              locationDirectionDistance && /*#__PURE__*/React.createElement("button", {
                key: "location-direction-distance-dropdown-btn",
                className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                onClick: () => setShowLocationDirectionDistanceDropdown(v => !v),
                style: { fontSize: "0.75rem" }
              }, "..."),
              showLocationDirectionDistanceDropdown && /*#__PURE__*/React.createElement("button", {
                key: "location-direction-distance-reroll-btn",
                className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
                style: {
                  fontSize: "0.75rem",
                  height: "25px",
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  marginLeft: "4px"
                },
                type: "button",
                onMouseDown: e => e.preventDefault(),
                onClick: rollLocationDirectionDistance,
                tabIndex: -1
              }, /*#__PURE__*/React.createElement("img", {
                src: "./d6.png",
                alt: "Reroll",
                style: {
                  width: "25px",
                  height: "25px",
                  filter: darkMode ? "invert(1)" : "none"
                }
              }))
            ]),
            showLocationDirectionDistanceDropdown ? /*#__PURE__*/React.createElement("div", {
              key: "location-direction-distance-dropdown",
              className: "flex items-center gap-2"
            }, /*#__PURE__*/React.createElement("select", {
              value: locationDirectionDistance || "",
              onChange: (e) => {
                setLocationDirectionDistance(e.target.value);
              },
              className: "border rounded px-1 py-0.5 text-sm",
              autoFocus: true,
              onBlur: () => setShowLocationDirectionDistanceDropdown(false)
            }, [
              /*#__PURE__*/React.createElement("option", { key: "empty", value: "" }, "Select Direction and Distance"),
              ...Object.keys(directions).flatMap(dirKey => 
                Object.keys(distances).map(distKey => {
                  const option = `${directions[dirKey]}, ${distances[distKey]}`;
                  return /*#__PURE__*/React.createElement("option", { 
                    key: `${dirKey}-${distKey}`, 
                    value: option 
                  }, option);
                })
              )
            ])) : locationDirectionDistance ? /*#__PURE__*/React.createElement("div", {
              key: "location-direction-distance-value",
              className: "font-semibold"
            }, locationDirectionDistance) : /*#__PURE__*/React.createElement("button", {
              key: "roll-direction-distance-btn",
              className: "px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm",
              onClick: rollLocationDirectionDistance
            }, "Roll if Required")
          ])
        ])
      ]))
    ]),

    // Save Quest Button (outside main container, like NPC generator)
    quest && /*#__PURE__*/React.createElement("div", {
      key: "save-button-container",
      className: "text-center"
    }, /*#__PURE__*/React.createElement("button", {
      key: "save-button",
      onClick: saveQuest,
      className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
    }, "Save Quest")),

    // Saved Quests Section
    savedQuests.length > 0 && /*#__PURE__*/React.createElement("div", {
      key: "saved-quests",
      className: "w-full border rounded-lg p-4"
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "saved-title",
        className: "text-lg font-semibold mb-3"
      }, "Saved Quests"),
      /*#__PURE__*/React.createElement("div", {
        key: "saved-list",
        className: "space-y-2"
      }, savedQuests.map(savedQuest => /*#__PURE__*/React.createElement("div", {
        key: savedQuest.id,
        className: "flex items-center justify-between p-3 border rounded bg-gray-50 text-sm"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "quest-info",
          className: "flex-1"
        }, [
          /*#__PURE__*/React.createElement("div", {
            key: "quest-summary",
            className: "font-semibold"
          }, savedQuest.questAction && savedQuest.questSubject ? 
            // For Character Based quests, use generated character name if available
            (savedQuest.questType === "Character Based" && savedQuest.generatedCharacter) ?
              `${savedQuest.questAction} ${savedQuest.generatedCharacter.name} the ${savedQuest.generatedCharacter.occupation}` :
              `${savedQuest.questAction} ${savedQuest.questSubject}` 
            : `${savedQuest.questType} Quest`),
          /*#__PURE__*/React.createElement("div", {
            key: "quest-details",
            className: darkMode ? "text-gray-300" : "text-gray-600"
          }, `Reward: ${savedQuest.reward} • Saved ${savedQuest.savedAt}`)
        ]),
        /*#__PURE__*/React.createElement("div", {
          key: "quest-actions",
          className: "flex gap-2"
        }, [
          /*#__PURE__*/React.createElement("button", {
            key: "load-btn",
            onClick: () => loadQuest(savedQuest),
            className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          }, "Load"),
          /*#__PURE__*/React.createElement("button", {
            key: "delete-btn",
            onClick: () => deleteQuest(savedQuest.id),
            className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
          }, "Delete")
        ])
      ])))
    ]),

    // Reward Info Popup Modal
    showRewardInfo && /*#__PURE__*/React.createElement("div", {
      key: "reward-info-modal",
      className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
      onClick: () => setShowRewardInfo(false)
    }, /*#__PURE__*/React.createElement("div", {
      className: `${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md mx-4 relative`,
      onClick: (e) => e.stopPropagation()
    }, [
      /*#__PURE__*/React.createElement("h3", {
        key: "modal-title",
        className: `text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`
      }, "Quest Reward Guidelines"),
      /*#__PURE__*/React.createElement("div", {
        key: "modal-content",
        className: `text-sm leading-relaxed mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`
      }, [
        /*#__PURE__*/React.createElement("p", {
          key: "first-paragraph",
          className: "mb-3"
        }, "Suggested quest reward XP is equal to 10% of the base XP to reach the next level, split evenly among the party."),
        /*#__PURE__*/React.createElement("p", {
          key: "second-paragraph", 
          className: "mb-3"
        }, "Example: a party of two PCs, one level 1 and one level 3, earn (2000/10) + (4000/10) = 600 XP total, split evenly for 300 XP each."),
        /*#__PURE__*/React.createElement("p", {
          key: "third-paragraph"
        }, "Only one item may be given to the party, and they gain no further XP by selling reward items or gems.")
      ]),
      /*#__PURE__*/React.createElement("button", {
        key: "modal-close",
        className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
        onClick: () => setShowRewardInfo(false)
      }, "Close")
    ])),

    /*#__PURE__*/React.createElement("div", {
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
    ])
  ]);
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
      
      // Only save if there's actual quest data
      if (quest) {
        return {
          questData: currentState,
          timestamp: Date.now()
        };
      }
      return null;
    };
    
    window.restoreState = (state) => {
      console.log("Quest restoreState called with:", state);
      if (state && (state.questData || state.quest)) {
        console.log("Quest Generator restoring state");
        
        // Handle both old and new state formats
        let questState;
        if (state.questData) {
          questState = state.questData;
        } else {
          // Handle old format
          questState = {
            quest: state.quest,
            savedQuests: state.savedQuests || []
          };
        }
        
        // Store the state for immediate pickup during component initialization
        window._pendingQuestState = questState;
        
        // Don't re-render, just mount a fresh component that will pick up the pending state
        if (root._reactRoot) {
          // Unmount current component
          root._reactRoot.unmount();
          root._reactRoot = null;
          
          // Create new root and mount with pending state
          setTimeout(() => {
            root._reactRoot = window.ReactDOM.createRoot(root);
            root._reactRoot.render(window.React.createElement(QuestGenerator));
          }, 5); // Reduced delay for faster restoration
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
