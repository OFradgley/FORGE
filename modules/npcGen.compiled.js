// modules/npcGen.js
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";
import { names, occupations, weapons, armours, dungeonGear, generalGear, appearances, details, clothes, quirks, personalities, conversationInterests, equipmentTypes, competenceTypes, helmetItem, shieldItem, rationItem, attributeOrder, OCC_ATTR_MAP } from "../tables.js";

// Helper Utilities
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const d6 = () => Math.floor(Math.random() * 6) + 1;
const d8 = () => Math.floor(Math.random() * 8) + 1;
const roll2d6 = () => d6() + d6();
const roll3d6 = () => d6() + d6() + d6();
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
const fmt = n => n >= 0 ? `+${n}` : `${n}`;
const choosePrimaries = (o1, o2) => {
  const set = new Set();
  const lower = [o1.toLowerCase(), o2.toLowerCase()];
  for (const {
    attr,
    keys
  } of OCC_ATTR_MAP) {
    if (lower.some(o => keys.some(k => o.includes(k)))) set.add(attr);
    if (set.size === 2) break;
  }
  while (set.size < 2) set.add(pick(attributeOrder));
  return set;
};

// ------------------------------ Main Component ------------------------------
function NPCGenerator() {
  const [pc, setPc] = React.useState(null);
  const [primaries, setPrimaries] = React.useState(new Set());
  const [hpOverride, setHpOverride] = React.useState(null);
  const [selectedWeapon, setSelectedWeapon] = React.useState(null);
  const [swapMode, setSwapMode] = React.useState(false);
  const [swapSelection, setSwapSelection] = React.useState([]);
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));
  const [showRollAnimation, setShowRollAnimation] = React.useState(false);
  const [showRollDropdown, setShowRollDropdown] = React.useState(false);
  const [currentNpcType, setCurrentNpcType] = React.useState(null);
  const dropdownRef = React.useRef();
  const [savedCharacters, setSavedCharacters] = React.useState(() => {
    try {
      const saved = localStorage.getItem('saved-npcs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved NPCs:', error);
      return [];
    }
  });

  // Save NPCs to localStorage whenever the list changes
  React.useEffect(() => {
    try {
      localStorage.setItem('saved-npcs', JSON.stringify(savedCharacters));
    } catch (error) {
      console.error('Error saving NPCs to localStorage:', error);
    }
  }, [savedCharacters]);

  React.useEffect(() => {
    // Listen for changes to dark mode (in case nav toggles it)
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    // Also check on mount
    setDarkMode(document.body.classList.contains("dark"));
    // No need for injected CSS - using inline styles instead
    return () => observer.disconnect();
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

  // Auto-roll character on component mount
  React.useEffect(() => {
    rollCharacter();
  }, []);

  // Handle click outside dropdown
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRollDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  function rollCharacter(npcType = null) {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual character generation until after the popup disappears
    setTimeout(() => {
      setHpOverride(null);
      setCurrentNpcType(npcType); // Track the current NPC type
      
      // Define unskilled occupations list
      const unskilledOccupations = [
        "Beggar", "Charlatan", "Courier", "Deserter", "Drifter", "Gambler", 
        "Hermit", "Recluse", "Servant", "Shepherd", "Outcast", "Thug", 
        "Vagrant", "Villager"
      ];
      
      // Define skilled occupations list
      const skilledOccupations = [
        "Acolyte", "Acrobat", "Actor", "Alchemist", "Apothecary", "Architect", "Armorer", "Artificer", "Assassin", "Astrologer", "Barbarian", "Blacksmith", "Bodyguard", "Builder", "Burglar", "Butcher", "Carpenter", "Cartographer", "Chronicler", "Cleric", "Cook", "Courtier", "Dealer", "Driver", "Druid", "Duellist", "Dungeoneer", "Engineer", "Executioner", "Explorer", "Falconer", "Fence", "Fisherman", "Gamekeeper", "Gardener", "Herald", "Herbalist", "Hitman", "Hunter", "Illusionist", "Inventor", "Jailer", "Jester", "Judge", "Locksmith", "Mage", "Magister", "Merchant", "Missionary", "Monk", "Musician", "Navigator", "Occultist", "Paladin", "Pickpocket", "Pit-fighter", "Politician", "Preacher", "Racketeer", "Ranger", "Researcher", "Reverend", "Rogue", "Sailor", "Scientist", "Scrapper", "Scribe", "Shopkeeper", "Slaver", "Smuggler", "Sorcerer", "Spy", "Statesman", "Steward", "Teacher", "Thief", "Tracker", "Trader", "Undertaker", "Warlock", "Warrior", "Witch", "Wizard", "Woodsman"
      ];
      
      // Select occupation based on NPC type
      const availableOccupations = npcType === "Unskilled" ? unskilledOccupations : 
                                    npcType === "Skilled" ? skilledOccupations : 
                                    npcType === "Mercenary" ? ["Mercenary"] :
                                    occupations;
      let occ1 = pick(availableOccupations);
      const scores = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
      
      // Special handling for Mercenary NPCs - randomize first primary between Strength and Dexterity
      let primariesInit;
      if (npcType === "Mercenary") {
        const firstPrimary = pick(["Strength", "Dexterity"]);
        const secondPrimary = pick(attributeOrder.filter(a => a !== firstPrimary));
        primariesInit = new Set([firstPrimary, secondPrimary]);
      } else {
        primariesInit = choosePrimaries(occ1, occ1); // Use same occupation twice for consistency with choosePrimaries function
      }
    
    setPrimaries(primariesInit);
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
    const rawHpPrimaryArr = Array.from({ length: 10 }, d8);
    const rawHpSecondaryArr = Array.from({ length: 10 }, d6);
    const conMod = 0; // NPCs always have +0 modifier
    
    // Handle armor and shield generation based on NPC type
    let armour, hasHelmet, hasShield;
    if (npcType === "Unskilled") {
      // Unskilled NPCs get no armor and no shield
      armour = armours[0]; // "No Armour" (AC 10)
      hasHelmet = false;
      hasShield = false;
    } else {
      // All other NPCs roll for armor and shield normally
      const aRoll = roll2d6();
      armour = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];
      const hs = roll2d6();
      hasHelmet = hs >= 6 && hs <= 7 || hs >= 11;
      hasShield = hs >= 8 && hs <= 10 || hs >= 11;
    }
    const dexMod = 0; // NPCs always have +0 modifier
    let dexBonus = 0; // NPCs get no Dex bonus to AC
    const strengthAttr = attrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check; // Uses check bonus (+1 primary, +0 secondary), not ability modifier
    let equipmentRoll = roll2d6();
    
    // If "Unskilled" is selected, cap the equipment roll at 6 (max "Basic travel")
    if (npcType === "Unskilled") {
      equipmentRoll = Math.min(equipmentRoll, 6);
    }
    
    // If "Mercenary" is selected, ensure minimum "Basic combat" (min roll 7)
    if (npcType === "Mercenary") {
      equipmentRoll = Math.max(equipmentRoll, 7);
    }
    
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
    
    // Adjust armor based on equipment type
    if (equipment === "Basic combat") {
      // Limit Basic combat to leather armor or no armor (AC 10-12)
      if (armour.ac > 12) {
        // If current armor is better than leather, downgrade to leather or no armor
        armour = Math.random() < 0.5 ? armours[0] : armours[1]; // 50/50 chance of no armor vs leather
        hasShield = false; // Basic combat doesn't get shields
      }
    } else if (equipment === "Anything") {
      // For "Anything" equipment, set armor to either chain or plate
      armour = Math.random() < 0.5 ? armours[2] : armours[3]; // 50/50 chance of chain vs plate
    }
    
    // Recalculate AC after potential armor adjustment
    const acBase = armour.ac;
    const acShield = hasShield ? 1 : 0;
    const acDex = 0; // NPCs get no Dex bonus to AC
    const ac = acBase + acShield + acDex;
    
    // Select weapon based on equipment type
    let availableWeapons = weapons;
    if (equipment === "Basic combat") {
      // Limit to 1-slot weapons for Basic combat
      availableWeapons = weapons.filter(w => w.slots === 1);
    }
    const weapon = pick(availableWeapons);
    setSelectedWeapon(weapon.name);
    
    // Create inventory with the selected weapon
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
    
    // Roll for Competence and set Level and Morale based on result
    let competenceRoll = roll2d6();
    
    // If "Unskilled" is selected, cap the competence roll at 3 (always "A liability")
    if (npcType === "Unskilled") {
      competenceRoll = Math.min(competenceRoll, 3);
    }
    // If "Skilled" is selected, limit competence roll to 4-9 (Average to Competent)
    else if (npcType === "Skilled") {
      competenceRoll = Math.max(4, Math.min(competenceRoll, 9));
    }
    
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
    
    // Roll for Alignment (d6)
    const alignmentRoll = d6();
    let alignment;
    if (alignmentRoll <= 2) {
      alignment = "Lawful";
    } else if (alignmentRoll <= 5) {
      alignment = "Neutral";
    } else {
      alignment = "Chaotic";
    }
    
    // Calculate wage based on level
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
    
    // Override wage for Skilled NPCs
    if (npcType === "Skilled") {
      wage = "15gp";
    }
    
    // If level is 0, set all attributes as secondary
    let finalPrimaries = primariesInit;
    if (level === 0) {
      finalPrimaries = new Set(); // No primary attributes for level 0
      // Note: Don't clear the component's primaries state here as it affects subsequent generations
    }
    
    // Update attributes with correct primaries based on level
    const finalAttrs = attrs.map(a => ({
      ...a,
      primary: finalPrimaries.has(a.attr),
      check: a.mod + (finalPrimaries.has(a.attr) ? level : Math.floor(level / 2))
    }));
    
    const finalStrengthAttr = finalAttrs.find(a => a.attr === "Strength");
    const finalMaxSlots = 10 + finalStrengthAttr.check;
    
    // Override AC if equipment is "Nothing" or "Basic travel"
    let finalAc = ac;
    let finalAcBreakdown = { base: acBase, shield: acShield, dex: acDex };
    if (equipment === "Nothing" || equipment === "Basic travel") {
      finalAc = 10;
      finalAcBreakdown = { base: 10, shield: 0, dex: 0 };
    }
    
    setPc({
      name: pick(names),
      level: level,
      alignment: alignment,
      occupations: [occ1],
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
    });
    }, 500); // Match the popup duration
  }

  // NPC save/load/delete functions
  const saveCharacter = () => {
    if (!pc) return;
    const characterData = {
      id: Date.now(),
      name: pc.name,
      level: pc.level,
      occupation: pc.occupations[0],
      savedAt: new Date().toLocaleDateString(),
      data: pc
    };
    setSavedCharacters(prev => [characterData, ...prev]);
  };

  const loadCharacter = (characterData) => {
    setPc(characterData.data);
    const primariesFromData = new Set(characterData.data.attrs.filter(a => a.primary).map(a => a.attr));
    setPrimaries(primariesFromData);
    setHpOverride(null);
    setSelectedWeapon(null);
    setSwapMode(false);
    setSwapSelection([]);
  };

  const deleteCharacter = (characterId) => {
    setSavedCharacters(prev => prev.filter(char => char.id !== characterId));
  };
  React.useEffect(() => {
    if (!pc) return;
    
    // If level is 0, ensure all attributes are secondary
    let effectivePrimaries = primaries;
    if (pc.level === 0) {
      effectivePrimaries = new Set();
      // Note: Don't clear the component's primaries state here as it affects subsequent generations
    }
    
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: effectivePrimaries.has(a.attr),
      check: a.mod + (effectivePrimaries.has(a.attr) ? pc.level : Math.floor(pc.level / 2)) // Same formula as PC but mod is always 0
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc(prevPc => ({ ...prevPc, attrs: newAttrs, maxSlots }));
  }, [primaries]);
  function togglePrimary(attr) {
    // Don't allow setting primary attributes for level 0 NPCs
    if (pc && pc.level === 0) {
      return;
    }
    
    setPrimaries(prev => {
      const next = new Set(prev);
      if (next.has(attr)) next.delete(attr); else if (next.size < 2) next.add(attr);
      return next;
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `flex flex-col items-center gap-6 p-4${darkMode ? " dark" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement(CardTitle, null, "FORGE NPC Generator")), /*#__PURE__*/React.createElement("div", {
    className: "relative",
    ref: dropdownRef
  }, /*#__PURE__*/React.createElement("button", {
    className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2",
    onClick: () => setShowRollDropdown(!showRollDropdown)
  }, "New NPC", /*#__PURE__*/React.createElement("span", {
    className: "text-xs"
  }, "▼")),    showRollDropdown && /*#__PURE__*/React.createElement("div", {
      className: `absolute top-full left-0 mt-1 border rounded shadow-lg z-10 min-w-[140px] ${darkMode ? 'bg-gray-800' : 'bg-white'}`
    },
      /*#__PURE__*/React.createElement("button", {
        className: `w-full px-4 py-2 text-left`,
        style: {
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onFocus: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onBlur: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onClick: () => {
          rollCharacter("Unskilled");
          setShowRollDropdown(false);
        }
      }, "Unskilled"),
      /*#__PURE__*/React.createElement("button", {
        className: `w-full px-4 py-2 text-left`,
        style: {
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onFocus: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onBlur: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onClick: () => {
          rollCharacter("Skilled");
          setShowRollDropdown(false);
        }
      }, "Skilled"),
      /*#__PURE__*/React.createElement("button", {
        className: `w-full px-4 py-2 text-left`,
        style: {
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onFocus: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onBlur: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onClick: () => {
          rollCharacter("Mercenary");
          setShowRollDropdown(false);
        }
      }, "Mercenary"),
      /*#__PURE__*/React.createElement("button", {
        className: `w-full px-4 py-2 text-left`,
        style: {
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onFocus: (e) => {
          e.target.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
          e.target.style.color = '#fff';
        },
        onBlur: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#fff' : '#000';
        },
        onClick: () => {
          rollCharacter("Random");
          setShowRollDropdown(false);
        }
      }, "Random")
    ))), /*#__PURE__*/React.createElement(CardContent, null, pc ? /*#__PURE__*/React.createElement(CharacterSheet, {
    pc: pc,
    togglePrimary: togglePrimary,
    primaries: primaries,
    hpOverride: hpOverride,
    setHpOverride: setHpOverride,
    selectedWeapon: selectedWeapon,
    setSelectedWeapon: setSelectedWeapon,
    setPc: setPc // Pass setPc to CharacterSheet
    ,
    setPrimaries: setPrimaries // Pass setPrimaries to CharacterSheet
    ,
    darkMode: darkMode // Pass darkMode as a prop
    ,
    currentNpcType: currentNpcType // Pass currentNpcType to CharacterSheet
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-center italic text-gray-600"
  }, "Click \u201CNew NPC\u201D to begin.")))), pc && /*#__PURE__*/React.createElement("div", {
    key: "save-button-container",
    className: "text-center mb-4"
  }, /*#__PURE__*/React.createElement("button", {
    key: "save-button",
    onClick: saveCharacter,
    className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
  }, "Save NPC")), savedCharacters.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl"
  }, /*#__PURE__*/React.createElement("div", {
    key: "saved-characters",
    className: "w-full border rounded-lg p-4"
  }, [
    /*#__PURE__*/React.createElement("h3", {
      key: "saved-title",
      className: "text-lg font-semibold mb-3"
    }, "Saved NPCs"),
    /*#__PURE__*/React.createElement("div", {
      key: "saved-list",
      className: "space-y-2"
    }, savedCharacters.map(char => /*#__PURE__*/React.createElement("div", {
      key: char.id,
      className: "flex items-center justify-between p-3 border rounded bg-gray-50 text-sm"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "char-info",
        className: "flex-1"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "char-name",
          className: "font-semibold"
        }, char.name),
        /*#__PURE__*/React.createElement("div", {
          key: "char-details",
          className: "text-gray-600"
        }, `Level ${char.level} ${char.occupation} • Saved ${char.savedAt}`)
      ]),
      /*#__PURE__*/React.createElement("div", {
        key: "char-actions",
        className: "flex gap-2"
      }, [
        /*#__PURE__*/React.createElement("button", {
          key: "load-btn",
          onClick: () => loadCharacter(char),
          className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        }, "Load"),
        /*#__PURE__*/React.createElement("button", {
          key: "delete-btn",
          onClick: () => deleteCharacter(char.id),
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
        }, "Delete")
      ])
    ])))
  ])), /*#__PURE__*/React.createElement("div", {
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

const AttributeBlock = ({
  attr,
  score,
  mod,
  primary,
  check,
  onTogglePrimary
}) => /*#__PURE__*/React.createElement("div", {
  className: "border rounded-lg p-2 text-center bg-gray-50"
}, /*#__PURE__*/React.createElement("div", {
  className: "flex items-center justify-center gap-2"
}, /*#__PURE__*/React.createElement("span", {
  className: "text-sm font-semibold uppercase"
}, attr), /*#__PURE__*/React.createElement("button", {
  className: `w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none\n          ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`,
  onClick: () => onTogglePrimary(attr),
  title: primary ? "Unset as primary" : "Set as primary",
  style: {
    minWidth: 24,
    minHeight: 24
  }
}, primary && /*#__PURE__*/React.createElement("span", {
  className: "text-white font-bold"
}, "P"))), /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-gray-500"
}, "Check ", check >= 0 ? `+${check}` : `${check}`));
const Grid = ({
  cols = 2,
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: `grid grid-cols-${cols} gap-2`
}, children);
const Field = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-gray-500"
}, label), /*#__PURE__*/React.createElement("div", {
  className: "font-semibold"
}, value));
function CharacterSheet({
  pc,
  togglePrimary,
  primaries,
  hpOverride,
  setHpOverride,
  selectedWeapon,
  setSelectedWeapon,
  setPc,
  setPrimaries, // Accept setPrimaries as a prop
  darkMode, // Accept darkMode as a prop
  currentNpcType // Accept currentNpcType as a prop
}) {
  const [showWeaponDropdown, setShowWeaponDropdown] = React.useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = React.useState(false);
  const [showDetailDropdown, setShowDetailDropdown] = React.useState(false);
  const [showClothingDropdown, setShowClothingDropdown] = React.useState(false);
  const [showQuirkDropdown, setShowQuirkDropdown] = React.useState(false);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = React.useState(false);
  const [showConversationInterestDropdown, setShowConversationInterestDropdown] = React.useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = React.useState(false);
  const [showCompetenceDropdown, setShowCompetenceDropdown] = React.useState(false);
  const [showOccDropdown1, setShowOccDropdown1] = React.useState(false);
  const [swapMode, setSwapMode] = React.useState(false);
  const [swapSelection, setSwapSelection] = React.useState([]);
  const [showNameInput, setShowNameInput] = React.useState(false);
  const [nameInputValue, setNameInputValue] = React.useState(pc.name);
  const [levelDropdown, setLevelDropdown] = React.useState(false);
  const [showAlignmentDropdown, setShowAlignmentDropdown] = React.useState(false);
  const overLimit = pc.totalSlots > pc.maxSlots;
  const conPrimary = primaries.has("Constitution");

  // Define unskilled occupations list for dropdowns and rerolls
  const unskilledOccupations = [
    "Beggar", "Charlatan", "Courier", "Deserter", "Drifter", "Gambler", 
    "Hermit", "Recluse", "Servant", "Shepherd", "Outcast", "Thug", 
    "Vagrant", "Villager"
  ];
  
  // Define skilled occupations list for dropdowns and rerolls
  const skilledOccupations = [
    "Acolyte", "Acrobat", "Actor", "Alchemist", "Apothecary", "Architect", "Armorer", "Artificer", "Assassin", "Astrologer", "Barbarian", "Blacksmith", "Bodyguard", "Builder", "Burglar", "Butcher", "Carpenter", "Cartographer", "Chronicler", "Cleric", "Cook", "Courtier", "Dealer", "Driver", "Druid", "Duellist", "Dungeoneer", "Engineer", "Executioner", "Explorer", "Falconer", "Fence", "Fisherman", "Gamekeeper", "Gardener", "Herald", "Herbalist", "Hitman", "Hunter", "Illusionist", "Inventor", "Jailer", "Jester", "Judge", "Locksmith", "Mage", "Magister", "Merchant", "Missionary", "Monk", "Musician", "Navigator", "Occultist", "Paladin", "Pickpocket", "Pit-fighter", "Politician", "Preacher", "Racketeer", "Ranger", "Researcher", "Reverend", "Rogue", "Sailor", "Scientist", "Scrapper", "Scribe", "Shopkeeper", "Slaver", "Smuggler", "Sorcerer", "Spy", "Statesman", "Steward", "Teacher", "Thief", "Tracker", "Trader", "Undertaker", "Warlock", "Warrior", "Witch", "Wizard", "Woodsman"
  ];
  
  const availableOccupations = currentNpcType === "Unskilled" ? unskilledOccupations : 
                                currentNpcType === "Skilled" ? skilledOccupations : 
                                currentNpcType === "Mercenary" ? ["Mercenary"] :
                                occupations;

  // Determine base HP rolls and raw rolls
  const baseHpPrimary = pc.hpPrimary;
  const baseHpSecondary = pc.hpSecondary;
  const rawHpPrimary = pc.rawHpPrimary;
  const rawHpSecondary = pc.rawHpSecondary;
  const conMod = 0; // NPCs always have +0 modifier

  // Calculate HP to display (using pre-rolled arrays)
  const minConMod = 0; // NPCs get no Con modifier to HP
  const level = pc.level;
  const isConPrimary = primaries.has("Constitution");
  // For each level, HP = die + minConMod, min 1 per level
  function calcHp(arr) {
    // If level is 0, HP is always 1
    if (level === 0) {
      return 1;
    }
    
    let total = 0;
    for (let i = 0; i < level; i++) {
      const hp = Math.max(1, arr[i] + minConMod);
      total += hp;
    }
    return total;
  }
  const hpPrimary = calcHp(pc.rawHpPrimary);
  const hpSecondary = calcHp(pc.rawHpSecondary);
  let hp = isConPrimary ? Math.max(hpPrimary, hpSecondary) : hpSecondary;
  if (hpOverride !== null) {
    hp = hpOverride;
  }
  // Show "Take 4" if the RAW die roll is 1 or 2 (before mod) for level 1
  const showTake4 = (isConPrimary ? pc.rawHpPrimary[0] : pc.rawHpSecondary[0]) <= 2 && hpOverride === null && level === 1;
  function handleTake4() {
    // Overwrite the first roll in the relevant array with 4
    if (isConPrimary) {
      const newRaw = [...pc.rawHpPrimary];
      newRaw[0] = 4;
      setPc({
        ...pc,
        rawHpPrimary: newRaw
      });
    } else {
      const newRaw = [...pc.rawHpSecondary];
      newRaw[0] = 4;
      setPc({
        ...pc,
        rawHpSecondary: newRaw
      });
    }
    setHpOverride(null); // Remove any manual override
  }

  // Helper to get ammo for a weapon
  function getAmmoForWeapon(weaponName) {
    if (weaponName === "Sling") return "Pouch of Bullets x20";
    if (weaponName === "Hand Crossbow" || weaponName === "Crossbow") return "Case of Bolts x20";
    if (weaponName === "Shortbow" || weaponName === "Longbow" || weaponName === "Warbow") return "Quiver of Arrows x20";
    return null;
  }

  // Find the weapon object
  const weaponObj = weapons.find(w => w.name === selectedWeapon) || pc.inventory.find(i => weapons.some(w => w.name === i.name));
  const ammoName = getAmmoForWeapon(selectedWeapon);

  // Handler for changing weapon
  function handleWeaponChange(e) {
    setSelectedWeapon(e.target.value);
    setShowWeaponDropdown(false);
  }

  // --- APPEARANCE, DETAIL, CLOTHING, QUIRK HANDLERS ---
  function handleAppearanceChange(e) {
    pc.appearance = e.target.value;
    setShowAppearanceDropdown(false);
  }
  function handleDetailChange(e) {
    pc.detail = e.target.value;
    setShowDetailDropdown(false);
  }
  function handleClothingChange(e) {
    pc.clothing = e.target.value;
    setShowClothingDropdown(false);
  }
  function handleQuirkChange(e) {
    pc.quirk = e.target.value;
    setShowQuirkDropdown(false);
  }
  function handlePersonalityChange(e) {
    pc.personality = e.target.value;
    setShowPersonalityDropdown(false);
  }
  function handleConversationInterestChange(e) {
    pc.conversationInterest = e.target.value;
    setShowConversationInterestDropdown(false);
  }
  function handleEquipmentChange(e) {
    const newEquipment = e.target.value;
    
    let updatedPc = {
      ...pc,
      equipment: newEquipment
    };
    
    // If equipment is "Nothing" or "Basic travel", set AC to 10 (no armor, no shield)
    if (newEquipment === "Nothing" || newEquipment === "Basic travel") {
      updatedPc.ac = 10;
      updatedPc.acBreakdown = { base: 10, shield: 0, dex: 0 };
    }
    
    // If equipment is "Basic combat", ensure weapon is 1-slot and limit armor
    if (newEquipment === "Basic combat") {
      const oneSlotWeapons = weapons.filter(w => w.slots === 1);
      const currentWeapon = weapons.find(w => w.name === selectedWeapon);
      
      // If current weapon is not 1-slot, select a new one
      if (!currentWeapon || currentWeapon.slots !== 1) {
        const newWeapon = pick(oneSlotWeapons);
        setSelectedWeapon(newWeapon.name);
        
        // Update inventory to replace the weapon
        const newInventory = updatedPc.inventory.map(item => {
          if (weapons.some(w => w.name === item.name)) {
            return { name: newWeapon.name, slots: newWeapon.slots };
          }
          return item;
        });
        updatedPc.inventory = newInventory;
        updatedPc.totalSlots = newInventory.reduce((s, i) => s + i.slots, 0);
      }
      
      // Recalculate AC based on actual armor in inventory for Basic combat
      const armorInInventory = updatedPc.inventory.find(item => 
        armours.some(a => a.name === item.name)
      );
      const actualArmor = armorInInventory ? 
        armours.find(a => a.name === armorInInventory.name) : 
        armours[0]; // Default to "No Armour"
      
      const hasShieldInInventory = updatedPc.inventory.some(item => item.name === "Shield");
      
      // Limit armor to leather or no armor (AC 10-12) and no shield for Basic combat
      if (actualArmor.ac > 12 || hasShieldInInventory) {
        // If current armor is better than leather or has shield, downgrade
        const newArmor = Math.random() < 0.5 ? armours[0] : armours[1]; // 50/50 chance
        updatedPc.ac = newArmor.ac;
        updatedPc.acBreakdown = { base: newArmor.ac, shield: 0, dex: 0 };
        
        // Update inventory to remove better armor and shield
        updatedPc.inventory = updatedPc.inventory.filter(item => {
          return !(armours.some(a => a.name === item.name && a.ac > 12)) && // Remove heavy armor
                 item.name !== "Shield"; // Remove shield
        });
        
        // Add new armor if it's not "No Armour" and not already in inventory
        if (newArmor.name !== "No Armour" && !updatedPc.inventory.some(item => item.name === newArmor.name)) {
          updatedPc.inventory.push({ name: newArmor.name, slots: newArmor.slots });
        }
        
        updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
      } else {
        // Armor is acceptable for Basic combat, restore proper AC calculation
        const shieldBonus = hasShieldInInventory ? 1 : 0;
        updatedPc.ac = actualArmor.ac + shieldBonus;
        updatedPc.acBreakdown = { base: actualArmor.ac, shield: shieldBonus, dex: 0 };
        
        // Remove shield if present (Basic combat doesn't allow shields)
        if (hasShieldInInventory) {
          updatedPc.inventory = updatedPc.inventory.filter(item => item.name !== "Shield");
          updatedPc.ac = actualArmor.ac;
          updatedPc.acBreakdown = { base: actualArmor.ac, shield: 0, dex: 0 };
          updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
        }
      }
    }
    
    // If equipment is "Anything", set armor to either chain or plate
    if (newEquipment === "Anything") {
      const newArmor = Math.random() < 0.5 ? armours[2] : armours[3]; // 50/50 chance of chain vs plate
      updatedPc.ac = newArmor.ac;
      updatedPc.acBreakdown = { base: newArmor.ac, shield: 0, dex: 0 };
      
      // Update inventory to remove current armor and add new armor
      updatedPc.inventory = updatedPc.inventory.filter(item => {
        return !armours.some(a => a.name === item.name);
      });
      
      // Add the new armor
      updatedPc.inventory.push({ name: newArmor.name, slots: newArmor.slots });
      updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
    }
    
    setPc(updatedPc);
    setShowEquipmentDropdown(false);
  }
  function handleCompetenceChange(e) {
    const newCompetence = e.target.value;
    // Map simplified competence values to level and morale
    let level, morale;
    if (newCompetence === "A liability") {
      level = 0;
      morale = 5;
    } else if (newCompetence === "Average") {
      level = 1;
      morale = 6;
    } else if (newCompetence === "Competent") {
      level = 1;
      morale = 7;
    } else if (newCompetence === "Very capable") {
      level = 2;
      morale = 8;
    } else if (newCompetence === "Exceptional") {
      level = 3;
      morale = 9;
    }
    
    // Update competence, level, and morale, and recalculate dependent values
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      check: a.mod + (primaries.has(a.attr) ? level : Math.floor(level / 2))
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    
    // Calculate wage based on new level
    let newWage;
    if (level === 0) {
      newWage = "2gp";
    } else if (level === 1) {
      newWage = "5gp";
    } else if (level === 2) {
      newWage = "15gp";
    } else if (level === 3) {
      newWage = "25gp";
    } else {
      newWage = "1/2 Share";
    }
    
    setPc({
      ...pc,
      competence: newCompetence,
      level,
      morale,
      attrs: newAttrs,
      maxSlots,
      wage: newWage
    });
    setShowCompetenceDropdown(false);
  }

  // Handler for occupation changes
  function handleOcc1Change(e) {
    const newOccupation = e.target.value;
    setPc(prevPc => ({
      ...prevPc,
      occupations: [newOccupation]
    }));
    setShowOccDropdown1(false);
  }

  // Handler for alignment changes
  function handleAlignmentChange(e) {
    setPc({
      ...pc,
      alignment: e.target.value
    });
    setShowAlignmentDropdown(false);
  }

  // Build inventory for display
  const displayInventory = [
    {
      name: /*#__PURE__*/React.createElement("span", null, selectedWeapon, weaponObj && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", null, "(", weaponObj.dmg, ")")))
    },
    ...(ammoName ? [{ name: ammoName }] : []),
    ...pc.inventory.filter(i =>
      (armours.some(a => a.name === i.name) ||
      i.name === helmetItem.name ||
      i.name === shieldItem.name)
      // Exclude weapon if it matches selectedWeapon
      && i.name !== selectedWeapon
    )
  ];

  // --- RECALCULATE total slots based on current weapon/ammo selection ---
  const currentSlotsUsed = displayInventory.reduce((sum, item) => sum + (item.slots || 0), 0);

  // Save name on blur or Enter
  React.useEffect(() => {
    setNameInputValue(pc.name);
  }, [pc.name]);
  function handleNameInputSave() {
    setPc({
      ...pc,
      name: nameInputValue.trim() || pc.name
    });
    setShowNameInput(false);
  }

  function handleLevelChange(newLevel) {
    // If level is 0, set all attributes as secondary
    let newPrimaries = primaries;
    if (newLevel === 0) {
      newPrimaries = new Set(); // No primary attributes for level 0
      // Note: Don't clear the component's primaries state here as it affects subsequent generations
    }
    
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: newPrimaries.has(a.attr),
      check: a.mod + (newPrimaries.has(a.attr) ? newLevel : Math.floor(newLevel / 2))
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    
    // Calculate wage based on new level
    let newWage;
    if (newLevel === 0) {
      newWage = "2gp";
    } else if (newLevel === 1) {
      newWage = "5gp";
    } else if (newLevel === 2) {
      newWage = "15gp";
    } else if (newLevel === 3) {
      newWage = "25gp";
    } else {
      newWage = "1/2 Share";
    }
    
    setPc({
      ...pc,
      level: newLevel,
      attrs: newAttrs,
      maxSlots,
      wage: newWage
    });
    setLevelDropdown(false);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "NPC Type")), /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, currentNpcType || "Random")), /*#__PURE__*/React.createElement(Grid, {
    cols: 2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Name"),
  /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setShowNameInput(v => !v)
  }, "..."),
  showNameInput && /*#__PURE__*/React.createElement("button", {
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
    onClick: () => {
      const newName = pick(names);
      setPc({
        ...pc,
        name: newName
      });
      setNameInputValue(newName);
    },
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
), showNameInput ? /*#__PURE__*/React.createElement("input", {
  type: "text",
  className: "border rounded px-1 py-0.5 text-sm",
  value: nameInputValue,
  autoFocus: true,
  onChange: e => setNameInputValue(e.target.value),
  onBlur: handleNameInputSave,
  onKeyDown: e => {
    if (e.key === "Enter") handleNameInputSave();
  },
  style: {
    minWidth: 120,
    maxWidth: 120
  }
}) : /*#__PURE__*/React.createElement("div", {
  className: "font-semibold"
}, pc.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Occupation"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowOccDropdown1(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "..."), showOccDropdown1 && /*#__PURE__*/React.createElement("button", {
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
    onClick: () => {
      let newVal = pick(availableOccupations);
      setPc(prevPc => ({
        ...prevPc,
        occupations: [newVal]
      }));
    },
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), showOccDropdown1 ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.occupations[0],
    onChange: handleOcc1Change,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowOccDropdown1(false)
  }, availableOccupations.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.occupations[0])), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Level"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setLevelDropdown(v => !v)
  }, "...")), levelDropdown ? /*#__PURE__*/React.createElement("select", {
    value: pc.level,
    onChange: e => handleLevelChange(Number(e.target.value)),
    className: "border rounded px-1 py-0.5 text-sm ml-2",
    autoFocus: true,
    onBlur: () => setLevelDropdown(false)
  }, [...Array(11)].map((_, i) => /*#__PURE__*/React.createElement("option", {
    key: i,
    value: i
  }, i))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-base text-left",
    style: {
      color: darkMode ? '#fff' : '#222',
      borderRadius: '0.375rem',
      display: 'block'
    }
  }, pc.level)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Alignment"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setShowAlignmentDropdown(v => !v)
  }, "..."), showAlignmentDropdown && /*#__PURE__*/React.createElement("button", {
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
    onClick: () => {
      const alignmentRoll = d6();
      let newAlignment;
      if (alignmentRoll <= 2) {
        newAlignment = "Lawful";
      } else if (alignmentRoll <= 5) {
        newAlignment = "Neutral";
      } else {
        newAlignment = "Chaotic";
      }
      setPc({ ...pc, alignment: newAlignment });
    },
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), showAlignmentDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.alignment,
    onChange: handleAlignmentChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowAlignmentDropdown(false)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Lawful"
  }, "Lawful"), /*#__PURE__*/React.createElement("option", {
    value: "Neutral"
  }, "Neutral"), /*#__PURE__*/React.createElement("option", {
    value: "Chaotic"
  }, "Chaotic"))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-base text-left",
    style: {
      color: darkMode ? '#fff' : '#222',
      borderRadius: '0.375rem',
      display: 'block'
    }
  }, pc.alignment))),
  /*#__PURE__*/React.createElement("section", { className: "mt-6" }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-semibold mb-0"
  }, "Attributes"), /*#__PURE__*/React.createElement("button", {
    className: `px-2 py-1 rounded text-xs ${swapMode ? "bg-yellow-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`,
    onClick: () => {
      setSwapMode(v => !v);
      setSwapSelection([]);
    },
    style: {
      fontSize: "0.75rem"
    }
  }, "Swap"), swapMode && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, swapSelection.length === 0 ? "Select first attribute" : "Select second attribute")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-2"
  }, pc.attrs.map((a, idx) => /*#__PURE__*/React.createElement("div", {
    key: a.attr,
    className: swapMode ? `cursor-pointer border-2 ${swapSelection.includes(idx) ? "border-yellow-500" : "border-transparent"} rounded-lg` : "",
    onClick: () => {
      if (!swapMode) return;
      if (swapSelection.includes(idx)) return;
      if (swapSelection.length < 2) {
        setSwapSelection(sel => [...sel, idx]);
      }
      if (swapSelection.length === 1 && swapSelection[0] !== idx) {
        const i = swapSelection[0];
        const j = idx;
        const newAttrs = [...pc.attrs];
        const temp = { ...newAttrs[i] };
        newAttrs[i] = { ...newAttrs[j], attr: newAttrs[i].attr };
        newAttrs[j] = { ...temp, attr: newAttrs[j].attr };
        [i, j].forEach(k => {
          newAttrs[k].mod = 0; // NPCs always have +0 modifier
          newAttrs[k].check = newAttrs[k].mod + (newAttrs[k].primary ? pc.level : Math.floor(pc.level / 2)); // Same formula as PC
        });
        const strengthAttr = newAttrs.find(a => a.attr === "Strength");
        const maxSlots = 10 + strengthAttr.check;
        let dexBonus;
        const dexAttr = newAttrs.find(a => a.attr === "Dexterity");
        if (pc.acBreakdown.base === 14) {
          dexBonus = Math.min(dexAttr.mod, 2);
        } else if (pc.acBreakdown.base === 16) {
          dexBonus = Math.min(dexAttr.mod, 1);
        } else {
          dexBonus = dexAttr.mod;
        }
        const ac = pc.acBreakdown.base + pc.acBreakdown.shield + dexBonus;
        const conAttr = newAttrs.find(a => a.attr === "Constitution");
        const conMod = conAttr.mod;
        const hpPrimary = Math.max(1, pc.rawHpPrimary + conMod);
        const hpSecondary = Math.max(1, pc.rawHpSecondary + conMod);
        setPc({
          ...pc,
          attrs: newAttrs,
          maxSlots,
          ac,
          acBreakdown: {
            ...pc.acBreakdown,
            dex: dexBonus
          },
          hpPrimary,
          hpSecondary
        });
        setSwapMode(false);
        setSwapSelection([]);
      }
    }
  }, /*#__PURE__*/React.createElement(AttributeBlock, Object.assign({}, a, {
    onTogglePrimary: togglePrimary
  })))))),  /*#__PURE__*/React.createElement(Grid, {
    cols: 2
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Hit Points",
    value: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, hp), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-gray-500 italic",
      style: {
        marginLeft: 4
      }
    }, "(HD = ", isConPrimary ? 'd8' : 'd6', ")"), showTake4 && /*#__PURE__*/React.createElement("button", {
      className: "ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
      onClick: handleTake4,
      style: {
        fontSize: "0.75rem"
      }
    }, "take 4"))
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Armour Class",
    value: /*#__PURE__*/React.createElement(React.Fragment, null, pc.ac, " ", /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-gray-500 italic"
    }, "(", pc.acBreakdown.base, " + ", pc.acBreakdown.shield, " + ", pc.acBreakdown.dex, " = " + pc.ac, ")"))
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Morale",
    value: pc.morale
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Wage",
    value: pc.wage
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Equipped for:"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowEquipmentDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "..."), showEquipmentDropdown && /*#__PURE__*/React.createElement("button", {
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
    onClick: () => {
      let equipmentRoll = roll2d6();
      
      // If current NPC type is "Unskilled", cap the equipment roll at 6
      if (currentNpcType === "Unskilled") {
        equipmentRoll = Math.min(equipmentRoll, 6);
      }
      
      // If current NPC type is "Mercenary", ensure minimum "Basic combat" (min roll 7)
      if (currentNpcType === "Mercenary") {
        equipmentRoll = Math.max(equipmentRoll, 7);
      }
      
      let newEquipment;
      if (equipmentRoll <= 3) {
        newEquipment = "Nothing";
      } else if (equipmentRoll <= 6) {
        newEquipment = "Basic travel";
      } else if (equipmentRoll <= 9) {
        newEquipment = "Basic combat";
      } else if (equipmentRoll <= 11) {
        newEquipment = "Travel & combat";
      } else {
        newEquipment = "Anything";
      }
      
      let updatedPc = {
        ...pc,
        equipment: newEquipment
      };
      
      // If equipment is "Nothing" or "Basic travel", set AC to 10 (no armor, no shield)
      if (newEquipment === "Nothing" || newEquipment === "Basic travel") {
        updatedPc.ac = 10;
        updatedPc.acBreakdown = { base: 10, shield: 0, dex: 0 };
      }
      
      // If equipment is "Basic combat", ensure weapon is 1-slot
      if (newEquipment === "Basic combat") {
        const oneSlotWeapons = weapons.filter(w => w.slots === 1);
        const currentWeapon = weapons.find(w => w.name === selectedWeapon);
        
        // If current weapon is not 1-slot, select a new one
        if (!currentWeapon || currentWeapon.slots !== 1) {
          const newWeapon = pick(oneSlotWeapons);
          setSelectedWeapon(newWeapon.name);
          
          // Update inventory to replace the weapon
          const newInventory = updatedPc.inventory.map(item => {
            if (weapons.some(w => w.name === item.name)) {
              return { name: newWeapon.name, slots: newWeapon.slots };
            }
            return item;
          });
          updatedPc.inventory = newInventory;
          updatedPc.totalSlots = newInventory.reduce((s, i) => s + i.slots, 0);
        }
        
        // Recalculate AC based on actual armor in inventory for Basic combat
        const armorInInventory = updatedPc.inventory.find(item => 
          armours.some(a => a.name === item.name)
        );
        const actualArmor = armorInInventory ? 
          armours.find(a => a.name === armorInInventory.name) : 
          armours[0]; // Default to "No Armour"
        
        const hasShieldInInventory = updatedPc.inventory.some(item => item.name === "Shield");
        
        // Limit armor to leather or no armor (AC 10-12) and no shield for Basic combat
        if (actualArmor.ac > 12 || hasShieldInInventory) {
          // If current armor is better than leather or has shield, downgrade
          const newArmor = Math.random() < 0.5 ? armours[0] : armours[1]; // 50/50 chance
          updatedPc.ac = newArmor.ac;
          updatedPc.acBreakdown = { base: newArmor.ac, shield: 0, dex: 0 };
          
          // Update inventory to remove better armor and shield
          updatedPc.inventory = updatedPc.inventory.filter(item => {
            return !(armours.some(a => a.name === item.name && a.ac > 12)) && // Remove heavy armor
                   item.name !== "Shield"; // Remove shield
          });
          
          // Add new armor if it's not "No Armour" and not already in inventory
          if (newArmor.name !== "No Armour" && !updatedPc.inventory.some(item => item.name === newArmor.name)) {
            updatedPc.inventory.push({ name: newArmor.name, slots: newArmor.slots });
          }
          
          updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
        } else {
          // Armor is acceptable for Basic combat, restore proper AC calculation
          const shieldBonus = hasShieldInInventory ? 1 : 0;
          updatedPc.ac = actualArmor.ac + shieldBonus;
          updatedPc.acBreakdown = { base: actualArmor.ac, shield: shieldBonus, dex: 0 };
          
          // Remove shield if present (Basic combat doesn't allow shields)
          if (hasShieldInInventory) {
            updatedPc.inventory = updatedPc.inventory.filter(item => item.name !== "Shield");
            updatedPc.ac = actualArmor.ac;
            updatedPc.acBreakdown = { base: actualArmor.ac, shield: 0, dex: 0 };
            updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
          }
        }
      }
      
      // If equipment is "Anything", set armor to either chain or plate
      if (newEquipment === "Anything") {
        const newArmor = Math.random() < 0.5 ? armours[2] : armours[3]; // 50/50 chance of chain vs plate
        updatedPc.ac = newArmor.ac;
        updatedPc.acBreakdown = { base: newArmor.ac, shield: 0, dex: 0 };
        
        // Update inventory to remove current armor and add new armor
        updatedPc.inventory = updatedPc.inventory.filter(item => {
          return !armours.some(a => a.name === item.name);
        });
        
        // Add the new armor
        updatedPc.inventory.push({ name: newArmor.name, slots: newArmor.slots });
        updatedPc.totalSlots = updatedPc.inventory.reduce((s, i) => s + i.slots, 0);
      }
      
      setPc(updatedPc);
    },
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), showEquipmentDropdown ? /*#__PURE__*/React.createElement("select", {
    value: pc.equipment,
    onChange: handleEquipmentChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowEquipmentDropdown(false)
  }, equipmentTypes.map(e => /*#__PURE__*/React.createElement("option", {
    key: e,
    value: e
  }, e))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.equipment)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Competence"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowCompetenceDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "..."), showCompetenceDropdown && /*#__PURE__*/React.createElement("button", {
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
    onClick: () => {
      let competenceRoll = roll2d6();
      
      // If current NPC type is "Unskilled", cap the competence roll at 3
      if (currentNpcType === "Unskilled") {
        competenceRoll = Math.min(competenceRoll, 3);
      }
      // If current NPC type is "Skilled", limit competence roll to 4-9 (Average to Competent)
      else if (currentNpcType === "Skilled") {
        competenceRoll = Math.max(4, Math.min(competenceRoll, 9));
      }
      
      let newCompetence, level, morale;
      if (competenceRoll <= 3) {
        newCompetence = "A liability";
        level = 0;
        morale = 5;
      } else if (competenceRoll <= 6) {
        newCompetence = "Average";
        level = 1;
        morale = 6;
      } else if (competenceRoll <= 9) {
        newCompetence = "Competent";
        level = 1;
        morale = 7;
      } else if (competenceRoll <= 11) {
        newCompetence = "Very capable";
        level = 2;
        morale = 8;
      } else {
        newCompetence = "Exceptional";
        level = 3;
        morale = 9;
      }
      
      // Update all dependent values
      const newAttrs = pc.attrs.map(a => ({
        ...a,
        check: a.mod + (primaries.has(a.attr) ? level : Math.floor(level / 2))
      }));
      const strengthAttr = newAttrs.find(a => a.attr === "Strength");
      const maxSlots = 10 + strengthAttr.check;
      
      let newWage;
      if (level === 0) {
        newWage = "2gp";
      } else if (level === 1) {
        newWage = "5gp";
      } else if (level === 2) {
        newWage = "15gp";
      } else if (level === 3) {
        newWage = "25gp";
      } else {
        newWage = "1/2 Share";
      }
      
      setPc({
        ...pc,
        competence: newCompetence,
        level,
        morale,
        attrs: newAttrs,
        maxSlots,
        wage: newWage
      });
    },
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), showCompetenceDropdown ? /*#__PURE__*/React.createElement("select", {
    value: pc.competence,
    onChange: handleCompetenceChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowCompetenceDropdown(false)
  }, competenceTypes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.competence))), (currentNpcType !== "Unskilled" && pc.equipment !== "Nothing" && pc.equipment !== "Basic travel") && /*#__PURE__*/React.createElement("section", { className: "mt-6" }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center flex-wrap gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-semibold mb-0"
  }, "Inventory"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowWeaponDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "Change weapon")), showWeaponDropdown && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedWeapon,
    onChange: handleWeaponChange,
    className: "border rounded px-1 py-0.5 text-sm",
    style: {
      minWidth: 120
    },
    autoFocus: true,
    onBlur: () => setShowWeaponDropdown(false)
  }, [...weapons].sort((a, b) => a.name.localeCompare(b.name)).map(w => /*#__PURE__*/React.createElement("option", {
    key: w.name,
    value: w.name
  }, w.name))), /*#__PURE__*/React.createElement("button", {
    className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem",
      height: "25px",
      width: "25px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => setSelectedWeapon(pick(weapons).name),
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc list-inside"
  }, displayInventory.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, it.name)))), /*#__PURE__*/React.createElement("section", { className: "mt-6" }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-semibold mb-2"
  }, "Character Details"), /*#__PURE__*/React.createElement(Grid, {
    cols: 2
  },
    // Column 1
    /*#__PURE__*/React.createElement("div", { className: "space-y-4" },
      // Row 1: Appearance
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Appearance"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowAppearanceDropdown(v => !v), style: { fontSize: "0.75rem" } }, "..."),
          showAppearanceDropdown && /*#__PURE__*/React.createElement("button", {
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
            onClick: () => {
              let newVal = pick(appearances);
              pc.appearance = newVal;
              setPc({ ...pc, appearance: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))),
        showAppearanceDropdown ? /*#__PURE__*/React.createElement("select", { value: pc.appearance, onChange: handleAppearanceChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowAppearanceDropdown(false) }, appearances.map(a => /*#__PURE__*/React.createElement("option", { key: a, value: a }, a))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.appearance)
      ),
      // Row 2: Clothing
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Clothing"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowClothingDropdown(v => !v), style: { fontSize: "0.75rem" } }, "..."),
          showClothingDropdown && /*#__PURE__*/React.createElement("button", {
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
            onClick: () => {
              let newVal = pick(clothes);
              pc.clothing = newVal;
              setPc({ ...pc, clothing: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))),
        showClothingDropdown ? /*#__PURE__*/React.createElement("select", { value: pc.clothing, onChange: handleClothingChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowClothingDropdown(false) }, clothes.map(c => /*#__PURE__*/React.createElement("option", { key: c, value: c }, c))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.clothing)
      ),
      // Row 3: Personality
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Personality"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowPersonalityDropdown(v => !v), style: { fontSize: "0.75rem" } }, "..."),
          showPersonalityDropdown && /*#__PURE__*/React.createElement("button", {
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
            onClick: () => {
              let newVal = pick(personalities);
              pc.personality = newVal;
              setPc({ ...pc, personality: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))),
        showPersonalityDropdown ? /*#__PURE__*/React.createElement("select", { value: pc.personality, onChange: handlePersonalityChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowPersonalityDropdown(false) }, personalities.map(p => /*#__PURE__*/React.createElement("option", { key: p, value: p }, p))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.personality)
      )
    ),
    // Column 2
    /*#__PURE__*/React.createElement("div", { className: "space-y-4" },
      // Row 1: Detail
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Detail"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowDetailDropdown(v => !v), style: { fontSize: "0.75rem" } }, "..."),
          showDetailDropdown && /*#__PURE__*/React.createElement("button", {
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
            onClick: () => {
              let newVal = pick(details);
              pc.detail = newVal;
              setPc({ ...pc, detail: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))),
        showDetailDropdown ? /*#__PURE__*/React.createElement("select", { value: pc.detail, onChange: handleDetailChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowDetailDropdown(false) }, details.map(d => /*#__PURE__*/React.createElement("option", { key: d, value: d }, d))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.detail)
      ),
      // Row 2: Quirk
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Quirk"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowQuirkDropdown(v => !v), style: { fontSize: "0.75rem" } }, "..."),
          showQuirkDropdown && /*#__PURE__*/React.createElement("button", {
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
            onClick: () => {
              let newVal = pick(quirks);
              pc.quirk = newVal;
              setPc({ ...pc, quirk: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))),
        showQuirkDropdown ? /*#__PURE__*/React.createElement("select", { value: pc.quirk, onChange: handleQuirkChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowQuirkDropdown(false) }, quirks.map(q => /*#__PURE__*/React.createElement("option", { key: q, value: q }, q))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.quirk)
      ),
      // Row 3: Conversation Interest (special case - dice button stays with dropdown)
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2 mb-1" },
          /*#__PURE__*/React.createElement("span", { className: "text-xs text-gray-500" }, "Conversation Interest"),
          /*#__PURE__*/React.createElement("button", { className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700", onClick: () => setShowConversationInterestDropdown(v => !v), style: { fontSize: "0.75rem" } }, "...")),
        showConversationInterestDropdown ? /*#__PURE__*/React.createElement("div", { className: "flex items-center gap-2" },
          /*#__PURE__*/React.createElement("select", { value: pc.conversationInterest, onChange: handleConversationInterestChange, className: "border rounded px-1 py-0.5 text-sm", autoFocus: true, onBlur: () => setShowConversationInterestDropdown(false) }, conversationInterests.map(ci => /*#__PURE__*/React.createElement("option", { key: ci, value: ci }, ci))),
          /*#__PURE__*/React.createElement("button", {
            className: "rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
            style: {
              fontSize: "0.75rem",
              height: "25px",
              width: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            },
            type: "button",
            onMouseDown: e => e.preventDefault(),
            onClick: () => {
              let newVal = pick(conversationInterests);
              pc.conversationInterest = newVal;
              setPc({ ...pc, conversationInterest: newVal });
            },
            tabIndex: -1
          }, /*#__PURE__*/React.createElement("img", {
            src: "./d6.png",
            alt: "Reroll",
            style: {
              width: "25px",
              height: "25px",
              filter: darkMode ? "invert(1)" : "none"
            }
          }))) : /*#__PURE__*/React.createElement("div", { className: "font-semibold" }, pc.conversationInterest)
      )
      )
    )
  )
  );
}

// Only one export for mount is needed. Remove duplicate export.
export function mount(root) {
  if (!root) return;
  // Use window.ReactDOM for compatibility with browser global ReactDOM
  if (root._reactRoot) {
    root._reactRoot.unmount();
    root._reactRoot = null;
  }
  if (root._reactRootContainer) {
    root._reactRootContainer = null;
  }
  root.innerHTML = "";
  root._reactRoot = window.ReactDOM.createRoot(root);
  root._reactRoot.render(window.React.createElement(NPCGenerator));
}
