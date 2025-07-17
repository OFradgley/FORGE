// Test if the Dice module can be loaded
console.log("Testing Dice module import...");

try {
  // This would normally be done by your main app
  const diceModule = await import('./modules/Dice.compiled.js');
  console.log("Dice module imported successfully:", diceModule);
  
  // Test mounting
  const testDiv = document.createElement('div');
  document.body.appendChild(testDiv);
  
  if (diceModule.mount) {
    diceModule.mount(testDiv);
    console.log("Dice module mounted successfully");
  } else {
    console.error("No mount function found in dice module");
  }
} catch (error) {
  console.error("Error importing/mounting Dice module:", error);
}
