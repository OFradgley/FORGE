import React, { useState, useEffect } from "react";
import {
  names,
  occupations,
  weapons,
  armours,
  dungeonGear,
  generalGear,
  appearances,
  details,
  clothes,
  quirks,
  helmetItem,
  shieldItem,
  rationItem,
  attributeOrder,
  OCC_ATTR_MAP
} from "./tables";

// -------------------------- Minimal UI Primitives -------------------------
const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors" {...props}>{children}</button>
);

const Card = ({ children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 w-full transition-colors">
    {children}
  </div>
);
const CardHeader = ({ children }) => <div className="flex justify-between items-center mb-4">{children}</div>;
const CardTitle = ({ children }) => <h2 className="text-2xl font-bold dark:text-white">{children}</h2>;
const CardContent = ({ children }) => <div>{children}</div>;

// --------------------------- Helper Utilities ---------------------------
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
const fmt = n => (n >= 0 ? `+${n}` : `${n}`);

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

const AttributeBlock = ({ attr, score, mod, primary, check, onTogglePrimary }) => (
  <div className="border rounded-lg p-2 text-center bg-gray-50 dark:bg-gray-800 transition-colors">
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm font-semibold uppercase dark:text-gray-200">{attr}</span>
      <button
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none
          ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-500"}`}
        onClick={() => onTogglePrimary(attr)}
        title={primary ? "Unset as primary" : "Set as primary"}
        style={{ minWidth: 24, minHeight: 24 }}
      >
        {primary && <span className="text-white font-bold">P</span>}
      </button>
    </div>
    <div className="text-lg font-bold dark:text-white">{score}</div>
    <div className="text-sm dark:text-gray-300">Mod {fmt(mod)}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400">Check {fmt(check)}</div>
  </div>
);

const Grid = ({ cols = 2, children, className = "" }) => (
  <div className={`grid gap-3 ${cols === 2 ? "grid-cols-1 sm:grid-cols-2" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : `grid-cols-${cols}`} ${className}`}>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div className="font-semibold dark:text-white">{value}</div>
  </div>
);

function CharacterGenerator() {
  const [pc, setPc] = useState(null);
  const [primaries, setPrimaries] = useState(new Set());
  const [hpOverride, setHpOverride] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  function rollCharacter() {
    setHpOverride(null);
    let occ1 = pick(occupations), occ2 = pick(occupations);
    while (occ2 === occ1) occ2 = pick(occupations);
    const scores    = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primariesInit = choosePrimaries(occ1, occ2);
    setPrimaries(new Set(primariesInit));
    const attrs = attributeOrder.map(a => {
      const s = scores[a];
      const m = mod(s);
      return { attr: a, score: s, mod: m, primary: primariesInit.has(a), check: m + (primariesInit.has(a) ? 1 : 0) };
    });
    const rawHpPrimary = d8();
    const rawHpSecondary = d6();
    const conMod = mod(scores.Constitution);
    const hpPrimary = Math.max(1, rawHpPrimary + conMod);
    const hpSecondary = Math.max(1, rawHpSecondary + conMod);
    const weapon  = pick(weapons);
    setSelectedWeapon(weapon.name);
    const aRoll   = roll2d6();
    const armour  = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];
    const hs         = roll2d6();
    const hasHelmet  = (hs >= 6 && hs <= 7) || hs >= 11;
    const hasShield  = (hs >= 8 && hs <= 10) || hs >= 11;
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
    let inventory = [{ name: weapon.name, slots: weapon.slots }];
    if (weapon.name === "Sling") {
      inventory.push({ name: "Pouch of Bullets x20", slots: 1 });
    } else if (weapon.name === "Hand Crossbow" || weapon.name === "Crossbow") {
      inventory.push({ name: "Case of Bolts x20", slots: 1 });
    } else if (
      weapon.name === "Shortbow" ||
      weapon.name === "Longbow" ||
      weapon.name === "Warbow"
    ) {
      inventory.push({ name: "Quiver of Arrows x20", slots: 1 });
    }
    inventory.push(
      armour.name !== "No Armour" ? { name: armour.name, slots: armour.slots } : null,
      hasHelmet ? helmetItem : null,
      hasShield ? shieldItem : null,
      pick(dungeonGear),
      (() => {
        let g1 = pick(generalGear), g2 = pick(generalGear);
        while (g2.name === g1.name) g2 = pick(generalGear);
        return [g1, g2];
      })(),
      rationItem, { ...rationItem }
    );
    inventory = inventory.flat().filter(Boolean);
    const strengthAttr = attrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({
      name: pick(names),
      level: 1,
      alignment: pick(["Lawful", "Neutral", "Chaotic"]),
      occupations: [occ1, occ2],
      attrs,
      maxSlots,
      hpPrimary,
      hpSecondary,
      rawHpPrimary,
      rawHpSecondary,
      ac,
      acBreakdown: { base: acBase, shield: acShield, dex: acDex },
      gold: (d6() + d6()) * 30,
      inventory,
      totalSlots: inventory.reduce((s, i) => s + i.slots, 0),
      appearance: pick(appearances),
      detail:     pick(details),
      clothing:   pick(clothes),
      quirk:      pick(quirks)
    });
  }

  useEffect(() => {
    if (!pc) return;
    const newAttrs = pc.attrs.map(a => ({
      ...a,
      primary: primaries.has(a.attr),
      check: a.mod + (primaries.has(a.attr) ? 1 : 0)
    }));
    const strengthAttr = newAttrs.find(a => a.attr === "Strength");
    const maxSlots = 10 + strengthAttr.check;
    setPc({ ...pc, attrs: newAttrs, maxSlots });
  }, [primaries]);

  function togglePrimary(attr) {
    setPrimaries(prev => {
      const next = new Set(prev);
      if (next.has(attr)) next.delete(attr);
      else if (next.size < 2) next.add(attr);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center py-8 transition-colors">
      <div className="w-full max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <img
                src="favicon.ico"
                alt="Forge Favicon"
                style={{ width: 32, height: 32 }}
              />
              <CardTitle>FORGE Character Generator</CardTitle>
            </div>
            <div className="flex flex-col items-center">
              <button
                className="mb-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs dark:text-gray-200"
                onClick={() => setDarkMode(dm => !dm)}
                style={{
                  minWidth: 60,
                  height: "1.5rem",
                  lineHeight: "1rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  border: "none"
                }}
                title="Toggle dark mode"
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <Button onClick={rollCharacter}>Roll New Character</Button>
            </div>
          </CardHeader>
          <CardContent>
            {pc ? (
              <div className="w-full">
                <CharacterSheet
                  pc={pc}
                  togglePrimary={togglePrimary}
                  primaries={primaries}
                  hpOverride={hpOverride}
                  setHpOverride={setHpOverride}
                  selectedWeapon={selectedWeapon}
                  setSelectedWeapon={setSelectedWeapon}
                  setPc={setPc}
                />
              </div>
            ) : (
              <p className="text-center italic text-gray-600 dark:text-gray-400">
                Click “Roll New Character” to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CharacterSheet({
  pc, togglePrimary, primaries, hpOverride, setHpOverride,
  selectedWeapon, setSelectedWeapon,
  setPc
}) {
  const [showWeaponDropdown, setShowWeaponDropdown] = useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = useState(false);
  const [showDetailDropdown, setShowDetailDropdown] = useState(false);
  const [showClothingDropdown, setShowClothingDropdown] = useState(false);
  const [showQuirkDropdown, setShowQuirkDropdown] = useState(false);
  const [showOccDropdown1, setShowOccDropdown1] = useState(false);
  const [showOccDropdown2, setShowOccDropdown2] = useState(false);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSelection, setSwapSelection] = useState([]);
  const overLimit = pc.totalSlots > pc.maxSlots;
  const conPrimary = primaries.has("Constitution");
  const baseHpPrimary = pc.hpPrimary;
  const baseHpSecondary = pc.hpSecondary;
  const rawHpPrimary = pc.rawHpPrimary;
  const rawHpSecondary = pc.rawHpSecondary;
  const conMod = pc.attrs.find(a => a.attr === "Constitution")?.mod || 0;
  let hp = conPrimary
    ? Math.max(baseHpPrimary, baseHpSecondary)
    : baseHpSecondary;
  if (hpOverride !== null) {
    hp = hpOverride;
  }
  const showTake4 =
    ((conPrimary ? rawHpPrimary : rawHpSecondary) <= 2) &&
    (hpOverride === null);
  function handleTake4() {
    const newHp = 4 + conMod;
    setHpOverride(Math.max(1, newHp));
  }
  function getAmmoForWeapon(weaponName) {
    if (weaponName === "Sling") return "Pouch of Bullets x20";
    if (weaponName === "Hand Crossbow" || weaponName === "Crossbow") return "Case of Bolts x20";
    if (
      weaponName === "Shortbow" ||
      weaponName === "Longbow" ||
      weaponName === "Warbow"
    ) return "Quiver of Arrows x20";
    return null;
  }
  const weaponObj = weapons.find(w => w.name === selectedWeapon) || pc.inventory.find(i => weapons.some(w => w.name === i.name));
  const ammoName = getAmmoForWeapon(selectedWeapon);
  function handleWeaponChange(e) {
    setSelectedWeapon(e.target.value);
    setShowWeaponDropdown(false);
  }
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
  function handleOcc1Change(e) {
    if (e.target.value === pc.occupations[1]) return;
    setPc({ ...pc, occupations: [e.target.value, pc.occupations[1]] });
    setShowOccDropdown1(false);
  }
  function handleOcc2Change(e) {
    if (e.target.value === pc.occupations[0]) return;
    setPc({ ...pc, occupations: [pc.occupations[0], e.target.value] });
    setShowOccDropdown2(false);
  }
  const displayInventory = [
    {
      name: (
        <span>
          {selectedWeapon}
          {weaponObj && (
            <>
              {" "}
              <span>({weaponObj.dmg})</span>
            </>
          )}
        </span>
      ),
      slots: weaponObj ? weaponObj.slots : 1
    },
    ...(ammoName ? [{
      name: ammoName,
      slots: 1
    }] : []),
    ...pc.inventory.filter(
      i =>
        !weapons.some(w => w.name === i.name) &&
        i.name !== "Pouch of Bullets x20" &&
        i.name !== "Case of Bolts x20" &&
        i.name !== "Quiver of Arrows x20"
    )
  ];
  const currentSlotsUsed = displayInventory.reduce((sum, item) => sum + (item.slots || 0), 0);
  return (
    <div className="space-y-8 w-full">
      {/* Name & Occupations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto">
        <Field label="Name" value={pc.name} />
        <div>
          <div className="flex flex-col items-start gap-1 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Occupations</span>
              <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowOccDropdown1(v => !v)} style={{ fontSize: "0.75rem" }}>1</button>
              <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowOccDropdown2(v => !v)} style={{ fontSize: "0.75rem" }}>2</button>
            </div>
            {showOccDropdown1 && (
              <select value={pc.occupations[0]} onChange={handleOcc1Change} className="border rounded px-1 py-0.5 text-sm mt-1" autoFocus onBlur={() => setShowOccDropdown1(false)}>
                {occupations.filter(o => o !== pc.occupations[1]).map(o => (<option key={o} value={o}>{o}</option>))}
              </select>
            )}
            {showOccDropdown2 && (
              <select value={pc.occupations[1]} onChange={handleOcc2Change} className="border rounded px-1 py-0.5 text-sm mt-1" autoFocus onBlur={() => setShowOccDropdown2(false)}>
                {occupations.filter(o => o !== pc.occupations[0]).map(o => (<option key={o} value={o}>{o}</option>))}
              </select>
            )}
          </div>
          <div className="font-semibold">{pc.occupations.join(" / ")}</div>
        </div>
      </div>

      {/* Attributes Grid */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold mb-0">Attributes</h3>
          <button className={`px-2 py-1 rounded text-xs ${swapMode ? "bg-yellow-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`} onClick={() => { setSwapMode(v => !v); setSwapSelection([]); }} style={{ fontSize: "0.75rem" }}>Swap</button>
          {swapMode && (
            <span className="text-xs text-gray-500">{swapSelection.length === 0 ? "Select first attribute" : "Select second attribute"}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full mx-auto">
          {pc.attrs.map((a, idx) => (
            <div key={a.attr} className={swapMode ? `cursor-pointer border-2 ${swapSelection.includes(idx) ? "border-yellow-500" : "border-transparent"} rounded-lg` : ""} onClick={() => { if (!swapMode) return; if (swapSelection.includes(idx)) return; if (swapSelection.length < 2) { setSwapSelection(sel => [...sel, idx]); } if (swapSelection.length === 1 && swapSelection[0] !== idx) { const i = swapSelection[0]; const j = idx; const newAttrs = [...pc.attrs]; const temp = { ...newAttrs[i] }; newAttrs[i] = { ...newAttrs[j], attr: newAttrs[i].attr }; newAttrs[j] = { ...temp, attr: newAttrs[j].attr }; [i, j].forEach(k => { newAttrs[k].mod = mod(newAttrs[k].score); newAttrs[k].check = newAttrs[k].mod + (newAttrs[k].primary ? 1 : 0); }); const strengthAttr = newAttrs.find(a => a.attr === "Strength"); const maxSlots = 10 + strengthAttr.check; const dexAttr = newAttrs.find(a => a.attr === "Dexterity"); let dexBonus; if (pc.acBreakdown.base === 14) { dexBonus = Math.min(dexAttr.mod, 2); } else if (pc.acBreakdown.base === 16) { dexBonus = Math.min(dexAttr.mod, 1); } else { dexBonus = dexAttr.mod; } const ac = pc.acBreakdown.base + pc.acBreakdown.shield + dexBonus; const conAttr = newAttrs.find(a => a.attr === "Constitution"); const conMod = conAttr.mod; const hpPrimary = Math.max(1, pc.rawHpPrimary + conMod); const hpSecondary = Math.max(1, pc.rawHpSecondary + conMod); setPc({ ...pc, attrs: newAttrs, maxSlots, ac, acBreakdown: { ...pc.acBreakdown, dex: dexBonus }, hpPrimary, hpSecondary, }); setSwapMode(false); setSwapSelection([]); } }}>
              <AttributeBlock {...a} onTogglePrimary={togglePrimary} />
            </div>
          ))}
        </div>
      </section>

      {/* HP, AC, Gold */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mx-auto">
        <Field label="Hit Points" value={<span>{hp}{showTake4 && (<button className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={handleTake4} style={{ fontSize: "0.75rem" }}>take 4</button>)}</span>} />
        <Field label="Armour Class" value={<>{pc.ac} <span className="text-xs text-gray-500 italic">({pc.acBreakdown.base} + {pc.acBreakdown.shield} + {pc.acBreakdown.dex} = {pc.ac})</span></>} />
        <Field label="Gold" value={`${pc.gold} gp`} />
      </div>

      {/* Inventory Grid */}
      <section>
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <h3 className="text-xl font-semibold mb-0">Inventory <span className="text-sm text-gray-500">(Slots used: <span style={currentSlotsUsed > pc.maxSlots ? { color: "red", fontWeight: "bold" } : {}}>{currentSlotsUsed}</span>/{pc.maxSlots})</span></h3>
          <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowWeaponDropdown(v => !v)} style={{ fontSize: "0.75rem" }}>Change weapon</button>
        </div>
        {showWeaponDropdown && (
          <select value={selectedWeapon} onChange={handleWeaponChange} className="border rounded px-1 py-0.5 text-sm mb-2" style={{ minWidth: 120 }} autoFocus onBlur={() => setShowWeaponDropdown(false)}>
            {[...weapons].sort((a, b) => a.name.localeCompare(b.name)).map(w => (<option key={w.name} value={w.name}>{w.name}</option>))}
          </select>
        )}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 list-disc list-inside w-full mx-auto">
          {displayInventory.map((it, i) => (
            <li key={i}>
              {it.name} —
              <span className="text-xs text-gray-500 italic">
                {it.slots} slot{it.slots !== 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Details Grid */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Character Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full mx-auto">
          {/* Appearance */}
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Appearance</span>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowAppearanceDropdown(v => !v)} style={{ fontSize: "0.75rem" }}>Change</button>
              </div>
              {showAppearanceDropdown && (
                <select value={pc.appearance} onChange={handleAppearanceChange} className="border rounded px-1 py-0.5 text-sm" autoFocus onBlur={() => setShowAppearanceDropdown(false)}>
                  {appearances.map(a => (<option key={a} value={a}>{a}</option>))}
                </select>
              )}
            </div>
            <div className="font-semibold">{pc.appearance}</div>
          </div>
          {/* Detail */}
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Detail</span>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowDetailDropdown(v => !v)} style={{ fontSize: "0.75rem" }}>Change</button>
              </div>
              {showDetailDropdown && (
                <select value={pc.detail} onChange={handleDetailChange} className="border rounded px-1 py-0.5 text-sm" autoFocus onBlur={() => setShowDetailDropdown(false)}>
                  {details.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              )}
            </div>
            <div className="font-semibold">{pc.detail}</div>
          </div>
          {/* Clothing */}
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Clothing</span>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowClothingDropdown(v => !v)} style={{ fontSize: "0.75rem" }}>Change</button>
              </div>
              {showClothingDropdown && (
                <select value={pc.clothing} onChange={handleClothingChange} className="border rounded px-1 py-0.5 text-sm" autoFocus onBlur={() => setShowClothingDropdown(false)}>
                  {clothes.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              )}
            </div>
            <div className="font-semibold">{pc.clothing}</div>
          </div>
          {/* Quirk */}
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Quirk</span>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700" onClick={() => setShowQuirkDropdown(v => !v)} style={{ fontSize: "0.75rem" }}>Change</button>
              </div>
              {showQuirkDropdown && (
                <select value={pc.quirk} onChange={handleQuirkChange} className="border rounded px-1 py-0.5 text-sm" autoFocus onBlur={() => setShowQuirkDropdown(false)}>
                  {quirks.map(q => (<option key={q} value={q}>{q}</option>))}
                </select>
              )}
            </div>
            <div className="font-semibold">{pc.quirk}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CharacterGenerator;
