// modules/npcGen.js
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.js";
import {
  names, occupations, weapons, armours, dungeonGear, generalGear,
  appearances, details, clothes, quirks, helmetItem, shieldItem, rationItem,
  attributeOrder, OCC_ATTR_MAP
} from "../tables.js";

// Helper Utilities
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

// ------------------------------ Main Component ------------------------------
function NPCGenerator() {
  // ...existing code...
  return (
    <div className={`flex flex-col items-center gap-6 p-4${darkMode ? " dark" : ""}`}>
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <img
                src="favicon.ico"
                alt="Forge Favicon"
                style={{ width: 32, height: 32 }}
              />
              <CardTitle>FORGE NPC Generator</CardTitle>
            </div>
            <div className="flex flex-col items-center">
              <button
                className="mb-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs"
                onClick={() => setDarkMode(dm => !dm)}
                style={{
                  minWidth: 60,
                  color: "#d1d5db", // Tailwind's text-gray-300
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
              <Button onClick={rollCharacter}>Roll New NPC</Button>
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
                darkMode={darkMode} // Pass darkMode as a prop
              />
            ) : (
              <p className="text-center italic text-gray-600">
                Click “Roll New NPC” to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NPCGenerator;
