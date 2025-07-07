// modules/npcGen.js
import React, { useState, useEffect, useRef } from "react";
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
function NPCGenerator() {
  const [pc, setPc] = useState(null);
  const [primaries, setPrimaries] = useState(new Set());
  const [hpOverride, setHpOverride] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSelection, setSwapSelection] = useState([]);
  const [darkMode, setDarkMode] = useState(() => document.body.classList.contains("dark"));
  const [showRollDropdown, setShowRollDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
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
  useEffect(() => {
    rollCharacter();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
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
    
    // Roll for Competence (2d6) and set Level and Morale accordingly
    const competenceRoll = roll2d6();
    let competence, level, morale;
    if (competenceRoll <= 3) {
      competence = "A liability (Level 1, ML5)";
      level = 1;
      morale = 5;
    } else if (competenceRoll <= 6) {
      competence = "Average (Level 1, ML6)";
      level = 1;
      morale = 6;
    } else if (competenceRoll <= 9) {
      competence = "Competent (Level 1, ML7)";
      level = 1;
      morale = 7;
    } else if (competenceRoll <= 11) {
      competence = "Very capable (Level 2, ML8)";
      level = 2;
      morale = 8;
    } else {
      competence = "Exceptional (Level 3, ML9)";
      level = 3;
      morale = 9;
    }
    
    const equipmentRoll = roll2d6();
    let equipment;
    if (equipmentRoll <= 3) {
      equipment = "No equipment of their own";
    } else if (equipmentRoll <= 6) {
      equipment = "Equipped for basic travel";
    } else if (equipmentRoll <= 9) {
      equipment = "Equipped for basic combat";
    } else if (equipmentRoll <= 11) {
      equipment = "Equipped for travel & combat";
    } else {
      equipment = "Best equipment money can buy";
    }
    
    setPc({
      name: pick(names),
      level: level,
      alignment: pick(["Lawful", "Neutral", "Chaotic"]),
      occupations: [occ1],
      attrs,
      maxSlots,
      rawHpPrimary: rawHpPrimaryArr,
      rawHpSecondary: rawHpSecondaryArr,
      ac,
      acBreakdown: { base: acBase, shield: acShield, dex: acDex },
      gold: (d6() + d6()) * 30,
      inventory,
      totalSlots: inventory.reduce((s, i) => s + i.slots, 0),
      appearance: pick(appearances),
      detail: pick(details),
      clothing: pick(clothes),
      quirk: pick(quirks),
      morale,
      equipment,
      competence
    });
  }
  useEffect(() => {
    if (!pc) return;
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: primaries.has(a.attr),
      check: a.mod + (primaries.has(a.attr) ? pc.level : Math.floor(pc.level / 2)) // Same formula as PC but mod is always 0
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({ ...pc, attrs: newAttrs, maxSlots });
  }, [primaries]);
  function togglePrimary(attr) {
    setPrimaries(prev => {
      const next = new Set(prev);
      if (next.has(attr)) next.delete(attr); else if (next.size < 2) next.add(attr);
      return next;
    });
  }
  return (
    <div className={`flex flex-col items-center gap-6 p-4${darkMode ? " dark" : ""}`}>
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <img src="favicon.ico" alt="Forge Favicon" style={{ width: 32, height: 32 }} />
              <CardTitle>FORGE NPC Generator</CardTitle>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                onClick={() => setShowRollDropdown(!showRollDropdown)}
              >
                New NPC <span className="text-xs">▼</span>
              </button>
              {showRollDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10 min-w-[140px]">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                    onClick={() => { rollCharacter("Random"); setShowRollDropdown(false); }}
                  >Random</button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                    onClick={() => { rollCharacter("Unskilled"); setShowRollDropdown(false); }}
                  >Unskilled</button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                    onClick={() => { rollCharacter("Skilled"); setShowRollDropdown(false); }}
                  >Skilled</button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                    onClick={() => { rollCharacter("Mercenary"); setShowRollDropdown(false); }}
                  >Mercenary</button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pc ? (
              <CharacterSheet
                pc={pc}
                togglePrimary={togglePrimary}
                primaries={primaries}
                hpOverride={hpOverride}
                setHpOverride={setHpOverride}
                selectedWeapon={selectedWeapon}
                setSelectedWeapon={setSelectedWeapon}
                setPc={setPc}
                darkMode={darkMode}
              />
            ) : (
              <p className="text-center italic text-gray-600">Click “New NPC” to begin.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttributeBlock({ attr, score, mod, primary, check, onTogglePrimary }) {
  return (
    <div className="border rounded-lg p-2 text-center bg-gray-50">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-semibold uppercase">{attr}</span>
        <button
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`}
          onClick={() => onTogglePrimary(attr)}
          title={primary ? "Unset as primary" : "Set as primary"}
          style={{ minWidth: 24, minHeight: 24 }}
        >
          {primary && <span className="text-white font-bold">P</span>}
        </button>
      </div>
      <div className="text-xs text-gray-500">Check {check >= 0 ? `+${check}` : `${check}`}</div>
    </div>
  );
}

function Grid({ cols = 2, children }) {
  return <div className={`grid grid-cols-${cols} gap-2`}>{children}</div>;
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function CharacterSheet({
  pc,
  togglePrimary,
  primaries,
  hpOverride,
  setHpOverride,
  selectedWeapon,
  setSelectedWeapon,
  setPc,
  darkMode
}) {
  const [showWeaponDropdown, setShowWeaponDropdown] = useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = useState(false);
  const [showDetailDropdown, setShowDetailDropdown] = useState(false);
  const [showClothingDropdown, setShowClothingDropdown] = useState(false);
  const [showQuirkDropdown, setShowQuirkDropdown] = useState(false);
  const [showOccDropdown1, setShowOccDropdown1] = useState(false);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSelection, setSwapSelection] = useState([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(pc.name);
  const [levelDropdown, setLevelDropdown] = useState(false);
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

  // Handler for occupation changes
  function handleOcc1Change(e) {
    setPc({
      ...pc,
      occupations: [e.target.value]
    });
    setShowOccDropdown1(false);
  }

  // Build inventory for display
  const displayInventory = [
    {
      name: <span>{selectedWeapon}{weaponObj && <span> ({weaponObj.dmg})</span>}</span>,
      slots: weaponObj ? weaponObj.slots : 1
    },
    ...(ammoName ? [{ name: ammoName, slots: 1 }] : []),
    ...pc.inventory.filter(i => !weapons.some(w => w.name === i.name) && i.name !== "Pouch of Bullets x20" && i.name !== "Case of Bolts x20" && i.name !== "Quiver of Arrows x20")
  ];

  // --- RECALCULATE total slots based on current weapon/ammo selection ---
  const currentSlotsUsed = displayInventory.reduce((sum, item) => sum + (item.slots || 0), 0);

  // Save name on blur or Enter
  useEffect(() => {
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
    });
    setLevelDropdown(false);
  }

  return (
    <div className="space-y-6">
      <Grid cols={2}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">Name</span>
            <button
              className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setShowNameInput(true)}
            >...</button>
          </div>
          {showNameInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="border rounded px-1 py-0.5 text-sm"
                value={nameInputValue}
                autoFocus
                onChange={e => setNameInputValue(e.target.value)}
                onBlur={handleNameInputSave}
                onKeyDown={e => { if (e.key === "Enter") handleNameInputSave(); }}
                style={{ minWidth: 100 }}
              />
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                style={{ fontSize: "0.75rem" }}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  const newName = pick(names);
                  setPc({ ...pc, name: newName });
                  setNameInputValue(newName);
                }}
                tabIndex={-1}
              >Reroll</button>
            </div>
          ) : (
            <div className="font-semibold">{pc.name}</div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div>
              <div className="text-xs text-gray-500">Level</div>
              <div className="font-semibold text-base text-left" style={{ color: darkMode ? '#fff' : '#222', borderRadius: '0.375rem', display: 'block' }}>{pc.level}</div>
            </div>
            <button
              className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setLevelDropdown(v => !v)}
            >...</button>
            {levelDropdown && (
              <select
                value={pc.level}
                onChange={e => handleLevelChange(Number(e.target.value))}
                className="border rounded px-1 py-0.5 text-sm ml-2"
                autoFocus
                onBlur={() => setLevelDropdown(false)}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col items-start gap-1 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Occupation</span>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={() => setShowOccDropdown1(v => !v)}
                style={{ fontSize: "0.75rem" }}
              >...</button>
            </div>
            {showOccDropdown1 && (
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={pc.occupations[0]}
                  onChange={handleOcc1Change}
                  className="border rounded px-1 py-0.5 text-sm"
                  autoFocus
                  onBlur={() => setShowOccDropdown1(false)}
                >
                  {occupations.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  style={{ fontSize: "0.75rem" }}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    let newVal = pick(occupations);
                    setPc({ ...pc, occupations: [newVal] });
                  }}
                  tabIndex={-1}
                >Reroll</button>
              </div>
            )}
            <div className="font-semibold">{pc.occupations[0]}</div>
          </div>
        </div>
        <div>
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold mb-0">Attributes</h3>
              <button
                className={`px-2 py-1 rounded text-xs ${swapMode ? "bg-yellow-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setSwapMode(v => !v);
                  setSwapSelection([]);
                }}
                style={{ fontSize: "0.75rem" }}
              >Swap</button>
              {swapMode && (
                <span className="text-xs text-gray-500">
                  {swapSelection.length === 0 ? "Select first attribute" : "Select second attribute"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pc.attrs.map((a, idx) => (
                <div
                  key={a.attr}
                  className={swapMode ? `cursor-pointer border-2 ${swapSelection.includes(idx) ? "border-yellow-500" : "border-transparent"} rounded-lg` : ""}
                  onClick={() => {
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
                  }}
                >
                  <AttributeBlock {...a} onTogglePrimary={togglePrimary} />
                </div>
              ))}
            </div>
          </section>
          <Grid cols={2}>
            <Field
              label="Hit Points"
              value={
                <>
                  <span>{hp}</span>
                  <span className="text-xs text-gray-500 italic" style={{ marginLeft: 4 }}>(HD = {isConPrimary ? 'd8' : 'd6'})</span>
                  {showTake4 && (
                    <button
                      className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                      onClick={handleTake4}
                      style={{ fontSize: "0.75rem" }}
                    >take 4</button>
                  )}
                </>
              }
            />
            <Field
              label="Armour Class"
              value={
                <>
                  {pc.ac}{" "}
                  <span className="text-xs text-gray-500 italic">
                    ({pc.acBreakdown.base} + {pc.acBreakdown.shield} + {pc.acBreakdown.dex} = {pc.ac})
                  </span>
                </>
              }
            />
            <Field label="Morale" value={pc.morale} />
            <Field label="Equipment" value={pc.equipment} />
            <Field label="Competence" value={pc.competence} />
            <Field label="Gold" value={`${pc.gold} gp`} />
          </Grid>
          <section>
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className="text-xl font-semibold mb-0">Inventory</h3>
              <span className="text-sm text-gray-500">
                (Slots used:{" "}
                <span style={currentSlotsUsed > pc.maxSlots ? { color: "red", fontWeight: "bold" } : {}}>
                  {currentSlotsUsed}
                </span>
                /{pc.maxSlots})
              </span>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={() => setShowWeaponDropdown(v => !v)}
                style={{ fontSize: "0.75rem" }}
              >Change weapon</button>
            </div>
            {showWeaponDropdown && (
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedWeapon}
                  onChange={handleWeaponChange}
                  className="border rounded px-1 py-0.5 text-sm"
                  style={{ minWidth: 120 }}
                  autoFocus
                  onBlur={() => setShowWeaponDropdown(false)}
                >
                  {[...weapons].sort((a, b) => a.name.localeCompare(b.name)).map(w => (
                    <option key={w.name} value={w.name}>{w.name}</option>
                  ))}
                </select>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  style={{ fontSize: "0.75rem" }}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setSelectedWeapon(pick(weapons).name)}
                  tabIndex={-1}
                >Reroll</button>
              </div>
            )}
            <ul className="list-disc list-inside">
              {displayInventory.map((it, i) => (
                <li key={i}>
                  {it.name}
                  <span className="text-xs text-gray-500 italic"> — {it.slots} slot{it.slots !== 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Character Details</h3>
            <Grid cols={2}>
              <div>
                <div className="flex flex-col items-start gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Appearance</span>
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                      onClick={() => setShowAppearanceDropdown(v => !v)}
                      style={{ fontSize: "0.75rem" }}
                    >...</button>
                  </div>
                  {showAppearanceDropdown && (
                    <div className="flex items-center gap-2">
                      <select
                        value={pc.appearance}
                        onChange={handleAppearanceChange}
                        className="border rounded px-1 py-0.5 text-sm"
                        autoFocus
                        onBlur={() => setShowAppearanceDropdown(false)}
                      >
                        {appearances.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        style={{ fontSize: "0.75rem" }}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          let newVal = pick(appearances);
                          pc.appearance = newVal;
                          setPc({ ...pc, appearance: newVal });
                        }}
                        tabIndex={-1}
                      >Reroll</button>
                    </div>
                  )}
                  <div className="font-semibold">{pc.appearance}</div>
                </div>
              </div>
              <div>
                <div className="flex flex-col items-start gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Detail</span>
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                      onClick={() => setShowDetailDropdown(v => !v)}
                      style={{ fontSize: "0.75rem" }}
                    >...</button>
                  </div>
                  {showDetailDropdown && (
                    <div className="flex items-center gap-2">
                      <select
                        value={pc.detail}
                        onChange={handleDetailChange}
                        className="border rounded px-1 py-0.5 text-sm"
                        autoFocus
                        onBlur={() => setShowDetailDropdown(false)}
                      >
                        {details.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        style={{ fontSize: "0.75rem" }}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          let newVal = pick(details);
                          pc.detail = newVal;
                          setPc({ ...pc, detail: newVal });
                        }}
                        tabIndex={-1}
                      >Reroll</button>
                    </div>
                  )}
                  <div className="font-semibold">{pc.detail}</div>
                </div>
              </div>
              <div>
                <div className="flex flex-col items-start gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Clothing</span>
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                      onClick={() => setShowClothingDropdown(v => !v)}
                      style={{ fontSize: "0.75rem" }}
                    >...</button>
                  </div>
                  {showClothingDropdown && (
                    <div className="flex items-center gap-2">
                      <select
                        value={pc.clothing}
                        onChange={handleClothingChange}
                        className="border rounded px-1 py-0.5 text-sm"
                        autoFocus
                        onBlur={() => setShowClothingDropdown(false)}
                      >
                        {clothes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        style={{ fontSize: "0.75rem" }}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          let newVal = pick(clothes);
                          pc.clothing = newVal;
                          setPc({ ...pc, clothing: newVal });
                        }}
                        tabIndex={-1}
                      >Reroll</button>
                    </div>
                  )}
                  <div className="font-semibold">{pc.clothing}</div>
                </div>
              </div>
              <div>
                <div className="flex flex-col items-start gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Quirk</span>
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                      onClick={() => setShowQuirkDropdown(v => !v)}
                      style={{ fontSize: "0.75rem" }}
                    >...</button>
                  </div>
                  {showQuirkDropdown && (
                    <div className="flex items-center gap-2">
                      <select
                        value={pc.quirk}
                        onChange={handleQuirkChange}
                        className="border rounded px-1 py-0.5 text-sm"
                        autoFocus
                        onBlur={() => setShowQuirkDropdown(false)}
                      >
                        {quirks.map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        style={{ fontSize: "0.75rem" }}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          let newVal = pick(quirks);
                          pc.quirk = newVal;
                          setPc({ ...pc, quirk: newVal });
                        }}
                        tabIndex={-1}
                      >Reroll</button>
                    </div>
                  )}
                  <div className="font-semibold">{pc.quirk}</div>
                </div>
              </div>
            </Grid>
          </section>
        </div>
      </Grid>
    </div>
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
