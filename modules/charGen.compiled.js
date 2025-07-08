function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// modules/charGen.js
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";
import { names, occupations, weapons, armours, dungeonGear, generalGear, appearances, details, clothes, quirks, helmetItem, shieldItem, rationItem, attributeOrder, OCC_ATTR_MAP } from "../tables.js";

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
function CharacterGenerator() {
  const [pc, setPc] = React.useState(null);
  const [primaries, setPrimaries] = React.useState(new Set());
  const [hpOverride, setHpOverride] = React.useState(null); // Move hpOverride here
  const [selectedWeapon, setSelectedWeapon] = React.useState(null);
  const [swapMode, setSwapMode] = React.useState(false);
  const [swapSelection, setSwapSelection] = React.useState([]);
  const [darkMode, setDarkMode] = React.useState(() => document.body.classList.contains("dark"));

  React.useEffect(() => {
    // Listen for changes to dark mode (in case nav toggles it)
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    // Also check on mount
    setDarkMode(document.body.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  // Auto-roll character on component mount
  React.useEffect(() => {
    rollCharacter();
  }, []);
  function rollCharacter() {
    setHpOverride(null); // <-- Reset HP override on new character roll
    // ---- Occupations (distinct) ----
    let occ1 = pick(occupations),
      occ2 = pick(occupations);
    while (occ2 === occ1) occ2 = pick(occupations);
    // ---- Attributes ----
    const scores = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primariesInit = choosePrimaries(occ1, occ2);
    setPrimaries(new Set(primariesInit));
    // Don't set attrs yet, do it below
    // Calculate attrs based on primaries
    const attrs = attributeOrder.map(a => {
      const s = scores[a];
      const m = mod(s);
      return {
        attr: a,
        score: s,
        mod: m,
        primary: primariesInit.has(a),
        check: m + (primariesInit.has(a) ? 1 : 0)
      };
    });
    // Pre-roll HP for both cases (10 rolls each)
    const rawHpPrimaryArr = Array.from({
      length: 10
    }, d8);
    const rawHpSecondaryArr = Array.from({
      length: 10
    }, d6);
    const conMod = mod(scores.Constitution);
    // ---- Gear rolls ----
    const weapon = pick(weapons);
    setSelectedWeapon(weapon.name); // Set initial weapon
    const aRoll = roll2d6();
    const armour = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];
    const hs = roll2d6();
    const hasHelmet = hs >= 6 && hs <= 7 || hs >= 11;
    const hasShield = hs >= 8 && hs <= 10 || hs >= 11;
    const dexMod = mod(scores.Dexterity);
    let dexBonus;
    if (armour.name === "Chain Armour (AC14)") {
      dexBonus = Math.min(dexMod, 2);
    } else if (armour.name === "Plate Armour (AC16)") {
      dexBonus = Math.min(dexMod, 1);
    } else {
      dexBonus = dexMod;
    }
    const acBase = armour.ac;
    const acShield = hasShield ? 1 : 0;
    const acDex = dexBonus;
    const ac = acBase + acShield + acDex;
    // Start inventory with weapon
    let inventory = [{
      name: weapon.name,
      slots: weapon.slots
    }];
    // Add relevant ammo if needed
    if (weapon.name === "Sling") {
      inventory.push({
        name: "Pouch of Bullets x20",
        slots: 1
      });
    } else if (weapon.name === "Hand Crossbow" || weapon.name === "Crossbow") {
      inventory.push({
        name: "Case of Bolts x20",
        slots: 1
      });
    } else if (weapon.name === "Shortbow" || weapon.name === "Longbow" || weapon.name === "Warbow") {
      inventory.push({
        name: "Quiver of Arrows x20",
        slots: 1
      });
    }
    inventory.push(armour.name !== "No Armour" ? {
      name: armour.name,
      slots: armour.slots
    } : null, hasHelmet ? helmetItem : null, hasShield ? shieldItem : null, pick(dungeonGear), (() => {
      let g1 = pick(generalGear),
        g2 = pick(generalGear);
      while (g2.name === g1.name) g2 = pick(generalGear);
      return [g1, g2];
    })(), rationItem, {
      ...rationItem
    });
    // Flatten and filter out nulls
    inventory = inventory.flat().filter(Boolean);
    // Calculate max slots
    const strengthAttr = attrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({
      name: pick(names),
      level: 1,
      alignment: pick(["Lawful", "Neutral", "Chaotic"]),
      occupations: [occ1, occ2],
      attrs,
      maxSlots,
      rawHpPrimary: rawHpPrimaryArr,
      // Array of 10 d8 rolls
      rawHpSecondary: rawHpSecondaryArr,
      // Array of 10 d6 rolls
      // hp will be selected in CharacterSheet based on Constitution primary
      ac,
      acBreakdown: {
        base: acBase,
        shield: acShield,
        dex: acDex
      },
      gold: (d6() + d6()) * 30,
      inventory,
      totalSlots: inventory.reduce((s, i) => s + i.slots, 0),
      appearance: pick(appearances),
      detail: pick(details),
      clothing: pick(clothes),
      quirk: pick(quirks)
    });
  }

  // Update attrs and dependent values when primaries change
  React.useEffect(() => {
    if (!pc) return;
    // Use correct check bonus formula: primary = mod + level, secondary = mod + Math.floor(level/2)
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: primaries.has(a.attr),
      check: a.mod + (primaries.has(a.attr) ? pc.level : Math.floor(pc.level / 2))
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({
      ...pc,
      attrs: newAttrs,
      maxSlots
    });
  }, [primaries]);
  function togglePrimary(attr) {
    setPrimaries(prev => {
      const next = new Set(prev);
      if (next.has(attr)) next.delete(attr);else if (next.size < 2) next.add(attr); // Only allow 2 primaries
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
  }), /*#__PURE__*/React.createElement(CardTitle, null, "FORGE PC Generator")), /*#__PURE__*/React.createElement(Button, {
    onClick: rollCharacter
  }, "New Character")), /*#__PURE__*/React.createElement(CardContent, null, pc ? /*#__PURE__*/React.createElement(CharacterSheet, {
    pc: pc,
    togglePrimary: togglePrimary,
    primaries: primaries,
    hpOverride: hpOverride,
    setHpOverride: setHpOverride,
    selectedWeapon: selectedWeapon,
    setSelectedWeapon: setSelectedWeapon,
    setPc: setPc // Pass setPc to CharacterSheet
    ,
    darkMode: darkMode // Pass darkMode as a prop
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-center italic text-gray-600"
  }, "Click \u201CNew Character\u201D to begin.")))));
}

// Replace CharacterSheet with the original, pixel-perfect version from app.js
// (copied from your archived app.js)
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
  className: `w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none
          ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`,
  onClick: () => onTogglePrimary(attr),
  title: primary ? "Unset as primary" : "Set as primary",
  style: {
    minWidth: 24,
    minHeight: 24
  }
}, primary && /*#__PURE__*/React.createElement("span", {
  className: "text-white font-bold"
}, "P"))), /*#__PURE__*/React.createElement("div", {
  className: "text-lg font-bold"
}, score), /*#__PURE__*/React.createElement("div", {
  className: "text-sm"
}, "Mod ", fmt(mod)), /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-gray-500"
}, "Check ", fmt(check)));
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
  darkMode // Accept darkMode as a prop
}) {
  const [showWeaponDropdown, setShowWeaponDropdown] = React.useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = React.useState(false);
  const [showDetailDropdown, setShowDetailDropdown] = React.useState(false);
  const [showClothingDropdown, setShowClothingDropdown] = React.useState(false);
  const [showQuirkDropdown, setShowQuirkDropdown] = React.useState(false);
  const [showOccDropdown1, setShowOccDropdown1] = React.useState(false);
  const [showOccDropdown2, setShowOccDropdown2] = React.useState(false);
  const [swapMode, setSwapMode] = React.useState(false);
  const [swapSelection, setSwapSelection] = React.useState([]);
  const [showNameInput, setShowNameInput] = React.useState(false);
  const [nameInputValue, setNameInputValue] = React.useState(pc.name);
  const [levelDropdown, setLevelDropdown] = React.useState(false);
  const overLimit = pc.totalSlots > pc.maxSlots;
  const conPrimary = primaries.has("Constitution");

  // Determine base HP rolls and raw rolls
  const baseHpPrimary = pc.hpPrimary;
  const baseHpSecondary = pc.hpSecondary;
  const rawHpPrimary = pc.rawHpPrimary;
  const rawHpSecondary = pc.rawHpSecondary;
  const conMod = pc.attrs.find(a => a.attr === "Constitution")?.mod || 0;

  // Calculate HP to display (using pre-rolled arrays)
  const minConMod = Math.max(conMod, -3);
  const level = pc.level;
  const isConPrimary = primaries.has("Constitution");
  // For each level, HP = die + minConMod, min 1 per level
  function calcHp(arr) {
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
    // If you want to persist, call setPc({...pc, appearance: e.target.value});
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

  // Handler for occupation changes
  function handleOcc1Change(e) {
    // Prevent duplicate occupations
    if (e.target.value === pc.occupations[1]) return;
    setPc({
      ...pc,
      occupations: [e.target.value, pc.occupations[1]]
    });
    setShowOccDropdown1(false);
  }
  function handleOcc2Change(e) {
    if (e.target.value === pc.occupations[0]) return;
    setPc({
      ...pc,
      occupations: [pc.occupations[0], e.target.value]
    });
    setShowOccDropdown2(false);
  }

  // Build inventory for display
  const displayInventory = [{
    name: /*#__PURE__*/React.createElement("span", null, selectedWeapon, weaponObj && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", null, "(", weaponObj.dmg, ")"))),
    slots: weaponObj ? weaponObj.slots : 1
  }, ...(ammoName ? [{
    name: ammoName,
    slots: 1
  }] : []), ...pc.inventory.filter(i => !weapons.some(w => w.name === i.name) && i.name !== "Pouch of Bullets x20" && i.name !== "Case of Bolts x20" && i.name !== "Quiver of Arrows x20")];

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

  // Add this function inside CharacterSheet:
  function handleLevelChange(newLevel) {
    // Recalculate attribute checks: primary = mod + level, secondary = mod + Math.floor(level/2)
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      check: a.mod + (a.primary ? newLevel : Math.floor(newLevel / 2))
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({
      ...pc,
      level: newLevel,
      attrs: newAttrs,
      maxSlots
      // HP is now always calculated from pre-rolled arrays
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
  }, "Name"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setShowNameInput(true)
  }, "..."), showNameInput && /*#__PURE__*/React.createElement("button", {
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
  }))), showNameInput ? /*#__PURE__*/React.createElement("input", {
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
  }, pc.name), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Level"), levelDropdown ? /*#__PURE__*/React.createElement("select", {
    value: pc.level,
    onChange: e => handleLevelChange(Number(e.target.value)),
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setLevelDropdown(false)
  }, [...Array(10)].map((_, i) => /*#__PURE__*/React.createElement("option", {
    key: i + 1,
    value: i + 1
  }, i + 1))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-base text-left",
    style: {
      color: darkMode ? '#fff' : '#222',
      borderRadius: '0.375rem',
      display: 'block'
    }
  }, pc.level)), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setLevelDropdown(v => !v)
  }, "..."))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Occupations"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowOccDropdown1(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "1"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowOccDropdown2(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "2")), showOccDropdown1 && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-1"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.occupations[0],
    onChange: handleOcc1Change,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowOccDropdown1(false)
  }, occupations.filter(o => o !== pc.occupations[1]).map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let options = occupations.filter(o => o !== pc.occupations[1]);
      let newVal = pick(options);
      setPc({
        ...pc,
        occupations: [newVal, pc.occupations[1]]
      });
    },
    tabIndex: -1
  }, "Reroll")), showOccDropdown2 && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-1"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.occupations[1],
    onChange: handleOcc2Change,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowOccDropdown2(false)
  }, occupations.filter(o => o !== pc.occupations[0]).map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let options = occupations.filter(o => o !== pc.occupations[0]);
      let newVal = pick(options);
      setPc({
        ...pc,
        occupations: [pc.occupations[0], newVal]
      });
    },
    tabIndex: -1
  }, "Reroll"))), /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.occupations.join(" / ")))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
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
        // Perform swap
        const i = swapSelection[0];
        const j = idx;
        const newAttrs = [...pc.attrs];
        // Swap score and mod, recalc check
        const temp = {
          ...newAttrs[i]
        };
        newAttrs[i] = {
          ...newAttrs[j],
          attr: newAttrs[i].attr
        };
        newAttrs[j] = {
          ...temp,
          attr: newAttrs[j].attr
        };
        // Recalculate check for both
        [i, j].forEach(k => {
          newAttrs[k].mod = mod(newAttrs[k].score);
          newAttrs[k].check = newAttrs[k].mod + (newAttrs[k].primary ? 1 : 0);
        });
        // Update PC and recalc maxSlots, AC, HP, etc.
        const strengthAttr = newAttrs.find(a => a.attr === "Strength");
        const maxSlots = 10 + strengthAttr.check;
        // Recalculate AC
        const dexAttr = newAttrs.find(a => a.attr === "Dexterity");
        let dexBonus;
        if (pc.acBreakdown.base === 14) {
          dexBonus = Math.min(dexAttr.mod, 2);
        } else if (pc.acBreakdown.base === 16) {
          dexBonus = Math.min(dexAttr.mod, 1);
        } else {
          dexBonus = dexAttr.mod;
        }
        const ac = pc.acBreakdown.base + pc.acBreakdown.shield + dexBonus;
        // Recalculate HP
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
  }, /*#__PURE__*/React.createElement(AttributeBlock, _extends({}, a, {
    onTogglePrimary: togglePrimary
  })))))), /*#__PURE__*/React.createElement(Grid, {
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
    label: "Gold",
    value: `${pc.gold} gp`
  })), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center flex-wrap gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-semibold mb-0"
  }, "Inventory", " ", /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "(Slots:", " ", /*#__PURE__*/React.createElement("span", {
    style: currentSlotsUsed > pc.maxSlots ? {
      color: "red",
      fontWeight: "bold"
    } : {}
  }, currentSlotsUsed), "/", pc.maxSlots, ")")), /*#__PURE__*/React.createElement("button", {
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
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => setSelectedWeapon(pick(weapons).name),
    tabIndex: -1
  }, "Reroll")), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc list-inside"
  }, displayInventory.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, it.name, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500 italic"
  }, " \u2014 ", it.slots, " slot", it.slots !== 1 ? "s" : ""))))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-semibold mb-2"
  }, "Character Details"), /*#__PURE__*/React.createElement(Grid, {
    cols: 2
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Appearance"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowAppearanceDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "...")), showAppearanceDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.appearance,
    onChange: handleAppearanceChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowAppearanceDropdown(false)
  }, appearances.map(a => /*#__PURE__*/React.createElement("option", {
    key: a,
    value: a
  }, a))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let newVal = pick(appearances);
      pc.appearance = newVal;
      setPc({
        ...pc,
        appearance: newVal
      });
    },
    tabIndex: -1
  }, "Reroll")) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.appearance)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Detail"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowDetailDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "...")), showDetailDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.detail,
    onChange: handleDetailChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowDetailDropdown(false)
  }, details.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let newVal = pick(details);
      pc.detail = newVal;
      setPc({
        ...pc,
        detail: newVal
      });
    },
    tabIndex: -1
  }, "Reroll")) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.detail)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Clothing"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowClothingDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "...")), showClothingDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.clothing,
    onChange: handleClothingChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowClothingDropdown(false)
  }, clothes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let newVal = pick(clothes);
      pc.clothing = newVal;
      setPc({
        ...pc,
        clothing: newVal
      });
    },
    tabIndex: -1
  }, "Reroll")) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.clothing)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Quirk"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    onClick: () => setShowQuirkDropdown(v => !v),
    style: {
      fontSize: "0.75rem"
    }
  }, "...")), showQuirkDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.quirk,
    onChange: handleQuirkChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowQuirkDropdown(false)
  }, quirks.map(q => /*#__PURE__*/React.createElement("option", {
    key: q,
    value: q
  }, q))), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    type: "button",
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      let newVal = pick(quirks);
      pc.quirk = newVal;
      setPc({
        ...pc,
        quirk: newVal
      });
    },
    tabIndex: -1
  }, "Reroll")) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.quirk)))));
}

// Remove any internal call to mount or mountCharGen. Only export the mount function.
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
  root._reactRoot.render(window.React.createElement(CharacterGenerator));
}
export { mount };
