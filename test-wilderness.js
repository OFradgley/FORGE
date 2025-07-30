// Test script for Wilderness module debugging
// Run this in browser console to test different scenarios

// Function to clear all wilderness-related localStorage
function clearWildernessStorage() {
  localStorage.removeItem('wilderness-data');
  localStorage.removeItem('wilderness-season'); 
  localStorage.removeItem('wilderness-this-terrain');
  console.log("Cleared all wilderness localStorage");
}

// Function to check current localStorage state
function checkLocalStorage() {
  console.log("Current wilderness localStorage:");
  console.log("  wilderness-data:", localStorage.getItem('wilderness-data'));
  console.log("  wilderness-season:", localStorage.getItem('wilderness-season'));
  console.log("  wilderness-this-terrain:", localStorage.getItem('wilderness-this-terrain'));
}

// Function to check global state
function checkGlobalState() {
  console.log("Current global state:");
  console.log("  window._currentWildernessState:", window._currentWildernessState);
  console.log("  window._pendingWildernessState:", window._pendingWildernessState);
  console.log("  window._preservedWildernessState:", window._preservedWildernessState);
}

// Test sequence 1: Clear everything and reload module
function testFreshLoad() {
  console.log("=== Testing Fresh Load ===");
  clearWildernessStorage();
  checkLocalStorage();
  checkGlobalState();
  console.log("Now navigate to Wilderness module to test");
}

// Test sequence 2: Check current state
function testCurrentState() {
  console.log("=== Current State ===");
  checkLocalStorage();
  checkGlobalState();
}

console.log("Wilderness test functions loaded:");
console.log("- clearWildernessStorage() - Clear localStorage");
console.log("- checkLocalStorage() - Check localStorage contents");
console.log("- checkGlobalState() - Check global variables");
console.log("- testFreshLoad() - Clear everything and test");
console.log("- testCurrentState() - Check current state");
