// app.js — ES‑module, browser‑native JSX (imports bundled React, etc.)
// Requires: index.html with <script type="module" src="app.js"> and
// tables.js exporting *all* data including attributeOrder & OCC_ATTR_MAP.
// -----------------------------------------------------------------------
const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

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
} from "./tables.js";

/* -------------------------- Minimal UI Primitives ------------------------- */
const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" {...props}>{children}</button>
);

const Card         = ({ children }) => <div className="bg-white rounded-xl shadow-md p-4 w-full">{children}</div>;
const CardHeader   = ({ children }) => <div className="flex justify-between items-center mb-4">{children}</div>;
const CardTitle    = ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>;
const CardContent  = ({ children }) => <div>{children}</div>;

/* --------------------------- Helper Utilities --------------------------- */
const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
const d6      = () => Math.floor(Math.random() * 6) + 1;
const d8      = () => Math.floor(Math.random() * 8) + 1;
const roll2d6 = () => d6() + d6();
const roll3d6 = () => d6() + d6() + d6();
const mod = v => {
  if (v === 1) return -4;
  if (v <= 3)  return -3;
  if (v <= 5)  return -2;
  if (v <= 8)  return -1;
  if (v <= 12) return 0;
  if (v <= 15) return 1;
  if (v <= 17) return 2;
  return 3;
};
const fmt     = n => (n >= 0 ? `+${n}` : `${n}`);

const choosePrimaries = (o1, o2) => {
  const set   = new Set();
  const lower = [o1.toLowerCase(), o2.toLowerCase()];
  for (const { attr, keys } of OCC_ATTR_MAP) {
    if (lower.some(o => keys.some(k => o.includes(k)))) set.add(attr);
    if (set.size === 2) break;
  }
  while (set.size < 2) set.add(pick(attributeOrder));
  return set;
};

/* ------------------------------ Main Component ------------------------------ */
function CharacterGenerator() {
  const [pc, setPc] = useState(null);
  const [primaries, setPrimaries] = useState(new Set());
  const [hpOverride, setHpOverride] = useState(null); // Move hpOverride here
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [swapMode, setSwapMode] = React.useState(false);
  const [swapSelection, setSwapSelection] = React.useState([]);

  function rollCharacter() {
    setHpOverride(null); // <-- Reset HP override on new character roll

    // ---- Occupations (distinct) ----
    let occ1 = pick(occupations), occ2 = pick(occupations);
    while (occ2 === occ1) occ2 = pick(occupations);

    // ---- Attributes ----
    const scores    = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primariesInit = choosePrimaries(occ1, occ2);
    setPrimaries(new Set(primariesInit));
    // Don't set attrs yet, do it below
    // Calculate attrs based on primaries
    const attrs = attributeOrder.map(a => {
      const s = scores[a];
      const m = mod(s);
      return { attr: a, score: s, mod: m, primary: primariesInit.has(a), check: m + (primariesInit.has(a) ? 1 : 0) };
    });

    // Pre-roll HP for both cases
    const rawHpPrimary = d8();
    const rawHpSecondary = d6();
    const conMod = mod(scores.Constitution);
    const hpPrimary = Math.max(1, rawHpPrimary + conMod);
    const hpSecondary = Math.max(1, rawHpSecondary + conMod);

    // ---- Gear rolls ----
    const weapon  = pick(weapons);
    setSelectedWeapon(weapon.name); // Set initial weapon
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

    // Start inventory with weapon
    let inventory = [{ name: weapon.name, slots: weapon.slots }];

    // Add relevant ammo if needed
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
      hpPrimary,
      hpSecondary,
      rawHpPrimary,
      rawHpSecondary,
      // hp will be selected in CharacterSheet based on Constitution primary
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

  // Update attrs and dependent values when primaries change
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
      else if (next.size < 2) next.add(attr); // Only allow 2 primaries
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="w-full max-w-3xl">
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
              <Button onClick={rollCharacter}>Roll New Character</Button>
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
                setPc={setPc} // Pass setPc to CharacterSheet
              />
            ) : (
              <p className="text-center italic text-gray-600">
                Click “Roll New Character” to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const AttributeBlock = ({ attr, score, mod, primary, check, onTogglePrimary }) => (
  <div className="border rounded-lg p-2 text-center bg-gray-50">
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm font-semibold uppercase">{attr}</span>
      <button
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none
          ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`}
        onClick={() => onTogglePrimary(attr)}
        title={primary ? "Unset as primary" : "Set as primary"}
        style={{ minWidth: 24, minHeight: 24 }}
      >
        {primary && <span className="text-white font-bold">P</span>}
      </button>
    </div>
    <div className="text-lg font-bold">{score}</div>
    <div className="text-sm">Mod {fmt(mod)}</div>
    <div className="text-xs text-gray-500">Check {fmt(check)}</div>
  </div>
);

const Grid = ({ cols = 2, children }) => (
  <div className={`grid grid-cols-${cols} gap-2`}>{children}</div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

function CharacterSheet({
  pc, togglePrimary, primaries, hpOverride, setHpOverride,
  selectedWeapon, setSelectedWeapon,
  setPc
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
  const overLimit = pc.totalSlots > pc.maxSlots;
  const conPrimary = primaries.has("Constitution");

  // Determine base HP rolls and raw rolls
  const baseHpPrimary = pc.hpPrimary;
  const baseHpSecondary = pc.hpSecondary;
  const rawHpPrimary = pc.rawHpPrimary;
  const rawHpSecondary = pc.rawHpSecondary;
  const conMod = pc.attrs.find(a => a.attr === "Constitution")?.mod || 0;

  // Calculate HP to display
  let hp = conPrimary
    ? Math.max(baseHpPrimary, baseHpSecondary)
    : baseHpSecondary;

  // If override is set, use it
  if (hpOverride !== null) {
    hp = hpOverride;
  }

  // Show "Take 4" if the RAW die roll is 1 or 2 (before mod)
  const showTake4 =
    ((conPrimary ? rawHpPrimary : rawHpSecondary) <= 2) &&
    (hpOverride === null);

  function handleTake4() {
    const newHp = 4 + conMod;
    setHpOverride(Math.max(1, newHp));
  }

  // Helper to get ammo for a weapon
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
    setPc({ ...pc, occupations: [e.target.value, pc.occupations[1]] });
    setShowOccDropdown1(false);
  }
  function handleOcc2Change(e) {
    if (e.target.value === pc.occupations[0]) return;
    setPc({ ...pc, occupations: [pc.occupations[0], e.target.value] });
    setShowOccDropdown2(false);
  }

  // Build inventory for display
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

  // --- RECALCULATE total slots based on current weapon/ammo selection ---
  const currentSlotsUsed = displayInventory.reduce((sum, item) => sum + (item.slots || 0), 0);

  return (
    <div className="space-y-6">
      <Grid cols={2}>
        <Field label="Name" value={pc.name} />
        <div>
          <div className="flex flex-col items-start gap-1 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Occupations</span>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={() => setShowOccDropdown1(v => !v)}
                style={{ fontSize: "0.75rem" }}
              >
                1
              </button>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={() => setShowOccDropdown2(v => !v)}
                style={{ fontSize: "0.75rem" }}
              >
                2
              </button>
            </div>
            {showOccDropdown1 && (
              <select
                value={pc.occupations[0]}
                onChange={handleOcc1Change}
                className="border rounded px-1 py-0.5 text-sm mt-1"
                autoFocus
                onBlur={() => setShowOccDropdown1(false)}
              >
                {occupations
                  .filter(o => o !== pc.occupations[1])
                  .map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
              </select>
            )}
            {showOccDropdown2 && (
              <select
                value={pc.occupations[1]}
                onChange={handleOcc2Change}
                className="border rounded px-1 py-0.5 text-sm mt-1"
                autoFocus
                onBlur={() => setShowOccDropdown2(false)}
              >
                {occupations
                  .filter(o => o !== pc.occupations[0])
                  .map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
              </select>
            )}
          </div>
          <div className="font-semibold">{pc.occupations.join(" / ")}</div>
        </div>
      </Grid>

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
          >
            Swap
          </button>
          {swapMode && (
            <span className="text-xs text-gray-500">
              {swapSelection.length === 0
                ? "Select first attribute"
                : "Select second attribute"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pc.attrs.map((a, idx) => (
            <div
              key={a.attr}
              className={
                swapMode
                  ? `cursor-pointer border-2 ${swapSelection.includes(idx) ? "border-yellow-500" : "border-transparent"} rounded-lg`
                  : ""
              }
              onClick={() => {
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
                  const temp = { ...newAttrs[i] };
                  newAttrs[i] = { ...newAttrs[j], attr: newAttrs[i].attr };
                  newAttrs[j] = { ...temp, attr: newAttrs[j].attr };
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
                    acBreakdown: { ...pc.acBreakdown, dex: dexBonus },
                    hpPrimary,
                    hpSecondary,
                  });
                  setSwapMode(false);
                  setSwapSelection([]);
                }
              }}
            >
              <AttributeBlock
                {...a}
                onTogglePrimary={togglePrimary}
              />
            </div>
          ))}
        </div>
      </section>

      <Grid cols={2}>
        <Field
          label="Hit Points"
          value={
            <span>
              {hp}
              {showTake4 && (
                <button
                  className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={handleTake4}
                  style={{ fontSize: "0.75rem" }}
                >
                  take 4
                </button>
              )}
            </span>
          }
        />
        <Field
          label="Armour Class"
          value={
            <>
              {pc.ac}{" "}
              <span className="text-xs text-gray-500 italic">
                (
                {pc.acBreakdown.base}
                {" + "}{pc.acBreakdown.shield}
                {" + "}{pc.acBreakdown.dex}
                {" = " + pc.ac}
                )
              </span>
            </>
          }
        />
        <Field label="Gold" value={`${pc.gold} gp`} />
      </Grid>

      <section>
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <h3 className="text-xl font-semibold mb-0">
            Inventory{" "}
            <span className="text-sm text-gray-500">
              (Slots used:{" "}
              <span style={currentSlotsUsed > pc.maxSlots ? { color: "red", fontWeight: "bold" } : {}}>
                {currentSlotsUsed}
              </span>
              /{pc.maxSlots})
            </span>
          </h3>
          <button
            className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
            onClick={() => setShowWeaponDropdown(v => !v)}
            style={{ fontSize: "0.75rem" }}
          >
            Change weapon
          </button>
        </div>
        {showWeaponDropdown && (
          <select
            value={selectedWeapon}
            onChange={handleWeaponChange}
            className="border rounded px-1 py-0.5 text-sm mb-2"
            style={{ minWidth: 120 }}
            autoFocus
            onBlur={() => setShowWeaponDropdown(false)}
          >
            {[...weapons].sort((a, b) => a.name.localeCompare(b.name)).map(w => (
              <option key={w.name} value={w.name}>{w.name}</option>
            ))}
          </select>
        )}
        <ul className="list-disc list-inside">
          {displayInventory.map((it, i) => (
            <li key={i}>
              {it.name} —{" "}
              <span className="italic text-gray-400">
                {it.slots} slot{it.slots !== 1 ? "s" : ""}
              </span>
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
                >
                  Change
                </button>
              </div>
              {showAppearanceDropdown && (
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
              )}
            </div>
            <div className="font-semibold">{pc.appearance}</div>
          </div>
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Detail</span>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => setShowDetailDropdown(v => !v)}
                  style={{ fontSize: "0.75rem" }}
                >
                  Change
                </button>
              </div>
              {showDetailDropdown && (
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
              )}
            </div>
            <div className="font-semibold">{pc.detail}</div>
          </div>
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Clothing</span>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => setShowClothingDropdown(v => !v)}
                  style={{ fontSize: "0.75rem" }}
                >
                  Change
                </button>
              </div>
              {showClothingDropdown && (
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
              )}
            </div>
            <div className="font-semibold">{pc.clothing}</div>
          </div>
          <div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Quirk</span>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => setShowQuirkDropdown(v => !v)}
                  style={{ fontSize: "0.75rem" }}
                >
                  Change
                </button>
              </div>
              {showQuirkDropdown && (
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
              )}
            </div>
            <div className="font-semibold">{pc.quirk}</div>
          </div>
        </Grid>
      </section>
    </div>
  );
}

/* ------------------------------ Render App ------------------------------ */
createRoot(document.getElementById("root")).render(<CharacterGenerator />);
