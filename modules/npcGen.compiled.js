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
  const [showRollDropdown, setShowRollDropdown] = React.useState(false);
  const dropdownRef = React.useRef();

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
    setHpOverride(null);
    let occ1 = pick(occupations);
    const scores = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primariesInit = choosePrimaries(occ1, occ1); // Use same occupation twice for consistency with choosePrimaries function
    setPrimaries(new Set(primariesInit));
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
    const weapon = pick(weapons);
    setSelectedWeapon(weapon.name);
    const aRoll = roll2d6();
    const armour = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];
    const hs = roll2d6();
    const hasHelmet = hs >= 6 && hs <= 7 || hs >= 11;
    const hasShield = hs >= 8 && hs <= 10 || hs >= 11;
    const dexMod = 0; // NPCs always have +0 modifier
    let dexBonus = 0; // NPCs get no Dex bonus to AC
    const acBase = armour.ac;
    const acShield = hasShield ? 1 : 0;
    const acDex = dexBonus;
    const ac = acBase + acShield + acDex;
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
    const strengthAttr = attrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check; // Uses check bonus (+1 primary, +0 secondary), not ability modifier
    const equipmentRoll = roll2d6();
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
    
    // Roll for Competence and set Level and Morale based on result
    const competenceRoll = roll2d6();
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
    
    // If level is 0, set all attributes as secondary
    let finalPrimaries = primariesInit;
    if (level === 0) {
      finalPrimaries = new Set(); // No primary attributes for level 0
      setPrimaries(new Set());
    }
    
    // Update attributes with correct primaries based on level
    const finalAttrs = attrs.map(a => ({
      ...a,
      primary: finalPrimaries.has(a.attr),
      check: a.mod + (finalPrimaries.has(a.attr) ? level : Math.floor(level / 2))
    }));
    
    const finalStrengthAttr = finalAttrs.find(a => a.attr === "Strength");
    const finalMaxSlots = 10 + finalStrengthAttr.check;
    
    setPc({
      name: pick(names),
      level: level,
      alignment: alignment,
      occupations: [occ1],
      attrs: finalAttrs,
      maxSlots: finalMaxSlots,
      rawHpPrimary: rawHpPrimaryArr,
      rawHpSecondary: rawHpSecondaryArr,
      ac,
      acBreakdown: { base: acBase, shield: acShield, dex: acDex },
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
  }
  React.useEffect(() => {
    if (!pc) return;
    
    // If level is 0, ensure all attributes are secondary
    let effectivePrimaries = primaries;
    if (pc.level === 0) {
      effectivePrimaries = new Set();
      setPrimaries(new Set());
    }
    
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: effectivePrimaries.has(a.attr),
      check: a.mod + (effectivePrimaries.has(a.attr) ? pc.level : Math.floor(pc.level / 2)) // Same formula as PC but mod is always 0
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({ ...pc, attrs: newAttrs, maxSlots });
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
          rollCharacter("Random");
          setShowRollDropdown(false);
        }
      }, "Random"),
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
      }, "Mercenary")
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
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-center italic text-gray-600"
  }, "Click \u201CNew NPC\u201D to begin.")))));
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
  darkMode // Accept darkMode as a prop
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
    setPc({
      ...pc,
      equipment: e.target.value
    });
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
    setPc({
      ...pc,
      occupations: [e.target.value]
    });
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
      setPrimaries(new Set());
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
  }, /*#__PURE__*/React.createElement(Grid, {
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
      let newVal = pick(occupations);
      setPc({
        ...pc,
        occupations: [newVal]
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
  }))), showOccDropdown1 ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.occupations[0],
    onChange: handleOcc1Change,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowOccDropdown1(false)
  }, occupations.map(o => /*#__PURE__*/React.createElement("option", {
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
  }, "...")), showAlignmentDropdown ? /*#__PURE__*/React.createElement("div", {
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
  }, "Chaotic")), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
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
  }, "Reroll")) : /*#__PURE__*/React.createElement("div", {
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
      const equipmentRoll = roll2d6();
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
      setPc({ ...pc, equipment: newEquipment });
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
      const competenceRoll = roll2d6();
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
  }, pc.competence))), /*#__PURE__*/React.createElement("section", { className: "mt-6" }, /*#__PURE__*/React.createElement("div", {
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
  }, it.name))), /*#__PURE__*/React.createElement("section", { className: "mt-6" }, /*#__PURE__*/React.createElement("h3", {
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
    ) // Close second column div
  ) // Close Grid
  ) // Close Character Details section
  ) // Close main div
  ); // Close return statement
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
