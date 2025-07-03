// app.js — ES‑module, browser‑native JSX (imports bundled React, etc.)
// Requires: index.html with <script type="module" src="app.js"> and
// tables.js exporting *all* data including attributeOrder & OCC_ATTR_MAP.
// -----------------------------------------------------------------------
import React, { useState } from "https://esm.sh/react@18.2.0?bundle";
import { createRoot }       from "https://esm.sh/react-dom@18.2.0/client?bundle";
import { motion }           from "https://cdn.jsdelivr.net/npm/framer-motion@10.18.1/dist/framer-motion.esm.js";

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
  <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" {...props}>{children}</button>
);

const Card         = ({ children }) => <div className="bg-white rounded-xl shadow-md p-4 w-full">{children}</div>;
const CardHeader   = ({ children }) => <div className="flex justify-between items-center mb-4">{children}</div>;
const CardTitle    = ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>;
const CardContent  = ({ children }) => <div>{children}</div>;

/* --------------------------- Helper Utilities --------------------------- */
const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
const d6      = () => Math.floor(Math.random() * 6) + 1;
const roll2d6 = () => d6() + d6();
const roll3d6 = () => d6() + d6() + d6();
const mod     = v => Math.floor((v - 10) / 2);
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

  function rollCharacter() {
    // ---- Occupations (distinct) ----
    let occ1 = pick(occupations), occ2 = pick(occupations);
    while (occ2 === occ1) occ2 = pick(occupations);

    // ---- Attributes ----
    const scores    = Object.fromEntries(attributeOrder.map(a => [a, roll3d6()]));
    const primaries = choosePrimaries(occ1, occ2);
    const attrs     = attributeOrder.map(a => {
      const s = scores[a];
      const m = mod(s);
      return { attr: a, score: s, mod: m, primary: primaries.has(a), check: m + (primaries.has(a) ? 1 : 0) };
    });

    // ---- Gear rolls ----
    const weapon  = pick(weapons);
    const aRoll   = roll2d6();
    const armour  = aRoll <= 4 ? armours[0] : aRoll <= 8 ? armours[1] : aRoll <= 11 ? armours[2] : armours[3];

    const hs         = roll2d6();
    const hasHelmet  = (hs >= 6 && hs <= 7) || hs >= 11;
    const hasShield  = (hs >= 8 && hs <= 10) || hs >= 11;
    const ac         = armour.ac + (hasShield ? 1 : 0) + mod(scores.Dexterity);

    const inventory = [
      { name: `${weapon.name} (${weapon.dmg})`, slots: weapon.slots },
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
    ].flat().filter(Boolean);

    setPc({
      name: pick(names),
      level: 1,
      alignment: pick(["Lawful", "Neutral", "Chaotic"]),
      occupations: [occ1, occ2],
      attrs,
      hp: Math.max(1, d6() + mod(scores.Constitution)),
      ac,
      gold: (d6() + d6()) * 30,
      inventory,
      totalSlots: inventory.reduce((s, i) => s + i.slots, 0),
      appearance: pick(appearances),
      detail:     pick(details),
      clothing:   pick(clothes),
      quirk:      pick(quirks)
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>FORGE Character Generator</CardTitle>
            <Button onClick={rollCharacter}>Roll New Character</Button>
          </CardHeader>
          <CardContent>
            {pc ? <CharacterSheet pc={pc} /> : <p className="text-center italic text-gray-600">Click “Roll New Character” to begin.</p>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* --------------------------- Sub‑components --------------------------- */
const Grid  = ({ cols = 2, children }) => <div className={`grid grid-cols-${cols} gap-4`}>{children}</div>;
const Field = ({ label, value }) => (
  <div>
    <span className="block text-xs uppercase tracking-wide text-gray-500">{label}</span>
    <span className="block font-medium break-words">{value}</span>
  </div>
);
const AttributeBlock = ({ attr, score, mod, primary, check }) => (
  <div className="border rounded-lg p-2 text-center bg-gray-50">
    <div className="text-sm font-semibold uppercase">{attr}{primary ? " *" : ""}</div>
    <div className="text-lg font-bold">{score}</div>
    <div className="text-sm">Mod {fmt(mod)}</div>
    <div className="text-xs text-gray-500">Check {fmt(check)}</div>
  </div>
);

function CharacterSheet({ pc }) {
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
          {pc.attrs.map(a => <AttributeBlock key={a.attr} {...a} />)}
        </div>
      </section>

      <Grid cols={2}>
        <Field label="Hit Points" value={pc.hp} />
        <Field label="Armour Class" value={pc.ac} />
        <Field label="Gold" value={`${pc.gold} gp`} />
      </Grid>

      <section>
        <h3 className="text-xl font-semibold mb-2">Inventory <span className="text-sm text-gray-500">(Total slots: {pc.totalSlots})</span></h3>
        <ul className="list-disc list-inside">
          {pc.inventory.map((it, i) => (
            <li key={i}>{it.name} — <span className="italic text-gray-400">{it.slots} slot{it.slots !== 1 ? "s" : ""}</span></li>
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
