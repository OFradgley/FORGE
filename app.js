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

function CharacterSheet({ pc, togglePrimary, primaries, hpOverride, setHpOverride }) {
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

  return (
    <div className="space-y-6">
      <Grid cols={2}>
        <Field label="Name" value={pc.name} />
        <Field label="Level" value={pc.level} />
        <Field label="Alignment" value={pc.alignment} />
        <Field label="Occupations" value={pc.occupations.join(" / ")} />
      </Grid>

      <section>
        <h3 className="text-xl font-semibold mb-2">Attributes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pc.attrs.map(a => (
            <AttributeBlock
              key={a.attr}
              {...a}
              onTogglePrimary={togglePrimary}
            />
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
        <h3 className="text-xl font-semibold mb-2">
          Inventory{" "}
          <span className="text-sm text-gray-500">
            (Slots used:{" "}
            <span style={overLimit ? { color: "red", fontWeight: "bold" } : {}}>
              {pc.totalSlots}
            </span>
            /{pc.maxSlots})
          </span>
        </h3>
        <ul className="list-disc list-inside">
          {pc.inventory.map((it, i) => (
            <li key={i}>
              {(it.name === "Shield" ? "Shield (AC+1)" : it.name)} —{" "}
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
          <Field label="Physical Appearance" value={pc.appearance} />
          <Field label="Notable Detail" value={pc.detail} />
          <Field label="Clothing" value={pc.clothing} />
          <Field label="Quirk" value={pc.quirk} />
        </Grid>
      </section>
    </div>
  );
}

/* ------------------------------ Render App ------------------------------ */
createRoot(document.getElementById("root")).render(<CharacterGenerator />);
