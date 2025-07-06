// modules/npcGen.js
// Temporary: duplicate of charGen.js for NPC generator placeholder
import charGen from "./charGen.compiled.js";
export default charGen;
function NPCGenerator() {
  // ...existing code...
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
    className: "flex flex-col items-center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "mb-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs",
    onClick: () => setDarkMode(dm => !dm),
    style: {
      minWidth: 60,
      color: "#d1d5db",
      // Tailwind's text-gray-300
      height: "1.5rem",
      lineHeight: "1rem",
      fontSize: "0.8rem",
      fontWeight: 500,
      border: "none"
    },
    title: "Toggle dark mode"
  }, darkMode ? "Light Mode" : "Dark Mode"), /*#__PURE__*/React.createElement(Button, {
    onClick: rollCharacter
  }, "Roll New NPC"))), /*#__PURE__*/React.createElement(CardContent, null, pc ? /*#__PURE__*/React.createElement(CharacterSheet, {
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
  }, "Click \u201CRoll New NPC\u201D to begin.")))));
}
