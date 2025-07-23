function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// modules/charGen.js
import { Button, Card, CardHeader, CardTitle, CardContent } from "../ui.compiled.js";
import { names, occupations, weapons, armours, dungeonGear, generalGear, appearances, details, clothes, quirks, personalities, helmetItem, shieldItem, rationItem, attributeOrder, OCC_ATTR_MAP } from "../tables.js";

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
  const [showRollAnimation, setShowRollAnimation] = React.useState(false);
  const [savedCharacters, setSavedCharacters] = React.useState(() => {
    try {
      const saved = localStorage.getItem('saved-characters');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved characters:', error);
      return [];
    }
  });

  // Save characters to localStorage whenever the list changes
  React.useEffect(() => {
    try {
      localStorage.setItem('saved-characters', JSON.stringify(savedCharacters));
    } catch (error) {
      console.error('Error saving characters to localStorage:', error);
    }
  }, [savedCharacters]);

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

  // Roll animation trigger function
  const triggerRollAnimation = () => {
    setShowRollAnimation(true);
    setTimeout(() => setShowRollAnimation(false), 500);
  };

  // Roll animation popup
  React.useEffect(() => {
    if (showRollAnimation) {
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        border: 2px solid white;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      `;
      popup.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border: 3px solid #333;
          border-top: 3px solid #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <span style="font-size: 16px; font-weight: bold;">Rolling...</span>
      `;
      
      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(popup);
      
      setTimeout(() => {
        document.body.removeChild(popup);
        document.head.removeChild(style);
      }, 500);
    }
  }, [showRollAnimation]);

  // Auto-roll character on component mount
  React.useEffect(() => {
    rollCharacter();
  }, []);
  function rollCharacter() {
    // Trigger roll animation first
    triggerRollAnimation();
    
    // Delay the actual character generation until after the popup disappears
    setTimeout(() => {
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
      quirk: pick(quirks),
      personality: pick(personalities),
      spellPowerType: "None"  // Default to "None" instead of random selection
    });
    }, 500); // Match the popup duration
  }

  // Character save/load/delete functions
  const saveCharacter = () => {
    if (!pc) return;
    const characterData = {
      id: Date.now(),
      name: pc.name,
      level: pc.level,
      occupation: pc.occupations ? `${pc.occupations[0]}/${pc.occupations[1]}` : 'Unknown',
      savedAt: new Date().toLocaleDateString(),
      data: pc
    };
    setSavedCharacters(prev => [characterData, ...prev]);
  };

  const loadCharacter = (characterData) => {
    setPc(characterData.data);
    const primariesFromData = new Set(characterData.data.attrs.filter(a => a.primary).map(a => a.attr));
    setPrimaries(primariesFromData);
    setHpOverride(null);
    
    // Restore the character's weapon from their inventory
    // Find the first weapon in the character's inventory
    const characterWeapon = characterData.data.inventory?.find(item => 
      weapons.some(w => w.name === item.name)
    );
    setSelectedWeapon(characterWeapon ? characterWeapon.name : null);
    
    setSwapMode(false);
    setSwapSelection([]);
  };

  const deleteCharacter = (characterId) => {
    setSavedCharacters(prev => prev.filter(char => char.id !== characterId));
  };

  // PDF Export function using true FDF approach for perfect formatting preservation
  const exportToPDF = async () => {
    if (!pc) {
      alert('No character to export!');
      return;
    }

    try {
      // Check if PDF-lib is available
      if (typeof PDFLib === 'undefined') {
        throw new Error('PDF-lib library not loaded. Please refresh the page and try again.');
      }

      // Step 1: Load the new non-calculating PDF template
      const response = await fetch('./Character Sheet Template (01-01-25).pdf');
      if (!response.ok) {
        throw new Error('Could not load PDF template');
      }
      
      const originalPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
      
      // Step 2: Set field values using low-level PDF operations to preserve formatting
      await setFieldValuesPreservingFormat(pdfDoc, pc, selectedWeapon);
      
      // Step 3: Save and download the completed PDF
      const finalPdfBytes = await pdfDoc.save();
      
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pc.name || 'character'}-sheet.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`Error exporting to PDF: ${error.message}`);
    }
  };

  // Function to set field values while preserving original formatting completely
  const setFieldValuesPreservingFormat = async (pdfDoc, character, selectedWeapon) => {
    // Get the AcroForm dictionary
    const catalog = pdfDoc.catalog;
    const acroForm = catalog.lookup(PDFLib.PDFName.of('AcroForm'));
    
    if (!acroForm) {
      throw new Error('PDF does not contain form fields');
    }

    // Ensure NeedAppearances is set to true - this is crucial for format preservation
    acroForm.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.True);

    // Helper function to sanitize text for PDF encoding
    const sanitizeForPDF = (text) => {
      if (!text) return '';
      // Replace problematic characters that can't be encoded in WinAnsi
      return text.toString()
        .replace(/[ˇ]/g, '') // Remove caron/háček
        .replace(/[ăâäàáåāæ]/gi, 'a') // Replace accented a
        .replace(/[ĕêëèéē]/gi, 'e') // Replace accented e
        .replace(/[ĭîïìíī]/gi, 'i') // Replace accented i
        .replace(/[ŏôöòóōø]/gi, 'o') // Replace accented o
        .replace(/[ŭûüùúū]/gi, 'u') // Replace accented u
        .replace(/[ćčç]/gi, 'c') // Replace accented c
        .replace(/[ñń]/gi, 'n') // Replace accented n
        .replace(/[ß]/g, 'ss') // Replace German eszett
        .replace(/[ł]/gi, 'l') // Replace Polish l
        .replace(/[š]/gi, 's') // Replace s with caron
        .replace(/[ž]/gi, 'z') // Replace z with caron
        .replace(/[đ]/gi, 'd') // Replace d with stroke
        .replace(/[–—]/g, '-') // Replace em/en dashes with hyphen
        .replace(/['']/g, "'") // Replace smart quotes with straight quotes
        .replace(/[""]/g, '"') // Replace smart double quotes
        .replace(/[…]/g, '...') // Replace ellipsis
        // Remove any remaining non-ASCII characters
        .replace(/[^\x00-\x7F]/g, '');
    };

    // Character data mapping with sanitized values
    const characterLevel = character.level || 1;
    const fieldValues = {
      'Name': sanitizeForPDF(character.name) || '',
      'Level': characterLevel.toString(),
      'Level_Mod_P': characterLevel.toString(),  // Primary level modifier = full level
      'Level_Mod_S': Math.floor(characterLevel / 2).toString(),  // Secondary level modifier = half level (rounded down)
      'Occupation1': sanitizeForPDF(character.occupations ? character.occupations[0] : '') || '',
      'Occupation2': sanitizeForPDF(character.occupations ? character.occupations[1] : '') || '',
      'Alignment': sanitizeForPDF(character.alignment) || '',
      'HP_Max': character.hp?.toString() || '',
      'HP_Current': character.hp?.toString() || '',
      'Hit_Die_Type': sanitizeForPDF(character.hitDie) || '',
      'Armour': sanitizeForPDF(character.armour?.name) || '',
      'Shield': character.hasShield ? 'Shield' : '',
      'Move_Speed': 'N',
      'Appearance': sanitizeForPDF(character.appearance) || '',
      'Detail': sanitizeForPDF(character.detail) || '',
      'Clothing': sanitizeForPDF(character.clothing) || '',
      'Quirk': sanitizeForPDF(character.quirk) || '',
      'Gold': character.gold?.toString() || '0'
    };

    // Add attributes with all calculated values (scores, modifiers, and check bonuses)
    if (character.attrs) {
      character.attrs.forEach(attr => {
        const attrName = attr.attr;
        
        // Export attribute score
        fieldValues[`${attrName}_Score`] = attr.score?.toString() || '';
        
        // Export attribute modifier (no + for positive values)
        fieldValues[`${attrName}_Mod`] = attr.mod?.toString() || '';
        
        // Calculate and export check bonus (attribute modifier + level modifier)
        // Level modifier = full level for primary attributes, half level (rounded down) for secondary
        const characterLevel = character.level || 1;
        const levelModifier = attr.primary ? characterLevel : Math.floor(characterLevel / 2);
        const checkBonus = attr.mod + levelModifier;
        fieldValues[`${attrName}_Check_Bonus`] = checkBonus.toString();
      });
    }

    // Get the selected weapon object for proper handling
    const selectedWeaponObj = weapons.find(w => w.name === selectedWeapon);
    
    // Add weapon fields (Requirement 2: Weapon1 and Weapon_Damage1 fields)
    if (selectedWeaponObj) {
      fieldValues['Weapon1'] = sanitizeForPDF(`${selectedWeaponObj.name} (${selectedWeaponObj.dmg})`);
      fieldValues['Weapon_Damage1'] = sanitizeForPDF(selectedWeaponObj.dmg);
    }

    // Add inventory slots with proper weapon slot handling (Requirement 3)
    if (character.inventory) {
      let slotIndex = 1;
      
      character.inventory.forEach((item) => {
        if (slotIndex > 26) return; // Max 26 slots
        
        // Check if this item is the selected weapon
        const isSelectedWeapon = selectedWeaponObj && item.name === selectedWeaponObj.name;
        
        if (isSelectedWeapon) {
          // Requirement 1 & 3: Show weapon with damage in brackets for first slot
          fieldValues[`Slot${slotIndex}`] = sanitizeForPDF(`${selectedWeaponObj.name} (${selectedWeaponObj.dmg})`);
          slotIndex++;
          
          // Requirement 3: Handle multi-slot weapons with continuation indicators
          const weaponSlots = selectedWeaponObj.slots || 1;
          for (let i = 1; i < weaponSlots && slotIndex <= 26; i++) {
            fieldValues[`Slot${slotIndex}`] = '" "'; // Continuation indicator
            slotIndex++;
          }
        } else {
          // Regular inventory item
          fieldValues[`Slot${slotIndex}`] = sanitizeForPDF(item.name) || '';
          slotIndex++;
          
          // Handle multi-slot items (if they have slots property)
          const itemSlots = item.slots || 1;
          for (let i = 1; i < itemSlots && slotIndex <= 26; i++) {
            fieldValues[`Slot${slotIndex}`] = '" "'; // Continuation indicator
            slotIndex++;
          }
        }
      });
    }

    // Create checkbox values mapping for primary attributes
    const checkboxValues = {};
    if (character.attrs) {
      const primaryAttrs = new Set();
      character.attrs.forEach(attr => {
        if (attr.primary) {
          primaryAttrs.add(attr.attr);
        }
      });
      
      console.log('Primary attributes:', Array.from(primaryAttrs));
      
      // Set checkbox values for all attributes (including clearing defaults)
      const attributeNames = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
      attributeNames.forEach(attrName => {
        const checkboxFieldName = `${attrName}_P`;
        // Use 'Yes' for checked (we know this works), 'Off' for unchecked
        checkboxValues[checkboxFieldName] = primaryAttrs.has(attrName) ? 'Yes' : 'Off';
      });
    }

    // Handle spell power checkboxes based on character's spell power type
    console.log('🔍 Spell Power Debug:', character.spellPowerType);
    if (character.spellPowerType === "None") {
      console.log('  Setting both Arcane and Divine to Off (None selected)');
      checkboxValues['Arcane'] = 'Off';  // Neither checked when None selected
      checkboxValues['Divine'] = 'Off';  
    } else if (character.spellPowerType === "Arcane") {
      console.log('  Setting Arcane to Yes, Divine to Off');
      checkboxValues['Arcane'] = 'Yes';  // Check Arcane, uncheck Divine
      checkboxValues['Divine'] = 'Off';  
    } else if (character.spellPowerType === "Divine") {
      console.log('  Setting Arcane to Off, Divine to Yes');
      checkboxValues['Arcane'] = 'Off';  // Uncheck Arcane, check Divine
      checkboxValues['Divine'] = 'Yes';  
    } else {
      console.log('  Unexpected spellPowerType value, defaulting both to Off:', character.spellPowerType);
      // Fallback: default to both unchecked if unexpected value
      checkboxValues['Arcane'] = 'Off';  
      checkboxValues['Divine'] = 'Off';  
    }
    
    console.log('All checkbox values to set:', checkboxValues);

    // PURE FDF APPROACH - Handle ALL fields using low-level dictionary manipulation
    const fieldsArray = acroForm.lookup(PDFLib.PDFName.of('Fields'));
    if (!fieldsArray) {
      throw new Error('No form fields found');
    }

    console.log('=== PURE FDF FIELD HANDLING ===');
    // Process each field in the PDF using pure FDF approach
    for (let i = 0; i < fieldsArray.size(); i++) {
      const fieldRef = fieldsArray.get(i);
      const field = pdfDoc.context.lookup(fieldRef);
      
      if (field && field instanceof PDFLib.PDFDict) {
        const fieldName = field.lookup(PDFLib.PDFName.of('T'));
        
        if (fieldName && fieldName instanceof PDFLib.PDFString) {
          const fieldNameStr = fieldName.decodeText();
          
          // Handle text fields
          if (fieldValues.hasOwnProperty(fieldNameStr)) {
            const value = fieldValues[fieldNameStr];
            if (value) {
              console.log(`Setting text field ${fieldNameStr} = "${value}"`);
              // Set the field value using PDFString - this preserves original formatting
              field.set(PDFLib.PDFName.of('V'), PDFLib.PDFString.of(value));
              // Don't set appearance - let the viewer generate it using original formatting
              // This is key to preserving Garamond Bold and size 16 with auto-sizing
            }
          }
          
          // Handle checkbox fields using pure FDF with proper appearance states
          if (checkboxValues.hasOwnProperty(fieldNameStr)) {
            const checkboxValue = checkboxValues[fieldNameStr];
            console.log(`Setting checkbox ${fieldNameStr} = "${checkboxValue}"`);
            
            // SPECIAL DEBUG: Show detailed info for spell power checkboxes
            if (fieldNameStr === 'Arcane' || fieldNameStr === 'Divine') {
              console.log(`🔥 SPELL POWER FIELD DEBUG: ${fieldNameStr}`);
              console.log(`  Value to set: ${checkboxValue}`);
              console.log(`  Field type: ${field.lookup(PDFLib.PDFName.of('FT'))?.toString()}`);
              console.log(`  Current V: ${field.lookup(PDFLib.PDFName.of('V'))?.toString()}`);
              console.log(`  Current AS: ${field.lookup(PDFLib.PDFName.of('AS'))?.toString()}`);
            }
            
            try {
              // Get the checkbox widget to understand its appearance states
              const kids = field.lookup(PDFLib.PDFName.of('Kids'));
              if (kids && kids instanceof PDFLib.PDFArray && kids.size() > 0) {
                const widgetRef = kids.get(0);
                const widget = pdfDoc.context.lookup(widgetRef);
                
                if (widget && widget instanceof PDFLib.PDFDict) {
                  // Get the appearance dictionary to find the correct 'On' state name
                  const ap = widget.lookup(PDFLib.PDFName.of('AP'));
                  if (ap && ap instanceof PDFLib.PDFDict) {
                    const n = ap.lookup(PDFLib.PDFName.of('N'));
                    if (n && n instanceof PDFLib.PDFDict) {
                      // Find the 'On' state (it might not be 'Yes')
                      const keys = n.keys();
                      let onStateName = 'Yes'; // default
                      
                      for (const key of keys) {
                        const keyStr = key.toString();
                        if (keyStr !== '/Off') {
                          onStateName = keyStr.substring(1); // remove the '/' prefix
                          break;
                        }
                      }
                      
                      if (checkboxValue === 'Yes') {
                        // Set checkbox to checked state
                        field.set(PDFLib.PDFName.of('V'), PDFLib.PDFName.of(onStateName));
                        widget.set(PDFLib.PDFName.of('AS'), PDFLib.PDFName.of(onStateName));
                        console.log(`  ✓ Checked ${fieldNameStr} using state '${onStateName}'`);
                      } else {
                        // Set checkbox to unchecked state
                        field.set(PDFLib.PDFName.of('V'), PDFLib.PDFName.of('Off'));
                        widget.set(PDFLib.PDFName.of('AS'), PDFLib.PDFName.of('Off'));
                        console.log(`  ○ Unchecked ${fieldNameStr}`);
                      }
                    }
                  }
                }
              } else {
                // Fallback for checkboxes without kids (direct field) - use same logic as primary attributes
                if (checkboxValue === 'Yes') {
                  // Both Arcane and Divine use '/1' for checked, '/Off' for unchecked
                  field.set(PDFLib.PDFName.of('V'), PDFLib.PDFName.of('1'));
                  field.set(PDFLib.PDFName.of('AS'), PDFLib.PDFName.of('1'));
                  console.log(`  ✓ Checked ${fieldNameStr} (fallback method using '/1')`);
                } else {
                  field.set(PDFLib.PDFName.of('V'), PDFLib.PDFName.of('Off'));
                  field.set(PDFLib.PDFName.of('AS'), PDFLib.PDFName.of('Off'));
                  console.log(`  ○ Unchecked ${fieldNameStr} (fallback method)`);
                }
              }
            } catch (checkboxError) {
              console.warn(`Failed to set checkbox ${fieldNameStr}:`, checkboxError.message);
            }
          }
        }
      }
    }
    
    // CRITICAL: Never access pdfDoc.getForm() - this preserves all original formatting
    // CRITICAL: Never call updateFieldAppearances() - this preserves text formatting
    // CRITICAL: Never flatten the form - this keeps fields editable with original appearance
    
    console.log('=== END PURE FDF HANDLING ===');
  };

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
    darkMode: darkMode,
    saveCharacter: saveCharacter,
    savedCharacters: savedCharacters,
    loadCharacter: loadCharacter,
    deleteCharacter: deleteCharacter
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-center italic text-gray-600"
  }, "Click \u201CNew Character\u201D to begin.")))), pc && /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl"
  }, /*#__PURE__*/React.createElement("div", {
    key: "save-button-container",
    className: "text-center mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 justify-center"
  }, /*#__PURE__*/React.createElement("button", {
    key: "save-button",
    onClick: saveCharacter,
    className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
  }, "Save Character"), /*#__PURE__*/React.createElement("button", {
    key: "export-pdf-button",
    onClick: exportToPDF,
    className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
  }, "Export to PDF")))), savedCharacters.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl"
  }, /*#__PURE__*/React.createElement("div", {
    key: "saved-characters",
    className: "border rounded-lg p-4"
  }, [
    /*#__PURE__*/React.createElement("h3", {
      key: "saved-title",
      className: "text-lg font-semibold mb-3"
    }, "Saved Characters"),
    /*#__PURE__*/React.createElement("div", {
      key: "saved-list",
      className: "space-y-2"
    }, savedCharacters.map(char => /*#__PURE__*/React.createElement("div", {
      key: char.id,
      className: "flex items-center justify-between p-3 border rounded bg-gray-50 text-sm"
    }, [
      /*#__PURE__*/React.createElement("div", {
        key: "char-info",
        className: "flex-1"
      }, [
        /*#__PURE__*/React.createElement("div", {
          key: "char-name",
          className: "font-semibold"
        }, char.name),
        /*#__PURE__*/React.createElement("div", {
          key: "char-details",
          className: "text-gray-600"
        }, `Level ${char.level} ${char.occupation} • Saved ${char.savedAt}`)
      ]),
      /*#__PURE__*/React.createElement("div", {
        key: "char-actions",
        className: "flex gap-2"
      }, [
        /*#__PURE__*/React.createElement("button", {
          key: "load-btn",
          onClick: () => loadCharacter(char),
          className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        }, "Load"),
        /*#__PURE__*/React.createElement("button", {
          key: "delete-btn",
          onClick: () => deleteCharacter(char.id),
          className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
        }, "Delete")
      ])
    ])))
  ])));
}
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
  darkMode,
  saveCharacter,
  savedCharacters,
  loadCharacter,
  deleteCharacter
}) {
  const [showWeaponDropdown, setShowWeaponDropdown] = React.useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = React.useState(false);
  const [showDetailDropdown, setShowDetailDropdown] = React.useState(false);
  const [showClothingDropdown, setShowClothingDropdown] = React.useState(false);
  const [showQuirkDropdown, setShowQuirkDropdown] = React.useState(false);
  const [showAlignmentDropdown, setShowAlignmentDropdown] = React.useState(false);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = React.useState(false);
  const [showSpellPowerDropdown, setShowSpellPowerDropdown] = React.useState(false);
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

  // Handler for alignment changes
  function handleAlignmentChange(e) {
    setPc({
      ...pc,
      alignment: e.target.value
    });
    setShowAlignmentDropdown(false);
  }

  // Handler for personality changes
  function handlePersonalityChange(e) {
    pc.personality = e.target.value;
    setShowPersonalityDropdown(false);
  }

  // Handler for spell power type changes
  function handleSpellPowerChange(e) {
    setPc({
      ...pc,
      spellPowerType: e.target.value
    });
    setShowSpellPowerDropdown(false);
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
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Level"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setLevelDropdown(v => !v)
  }, "...")), levelDropdown ? /*#__PURE__*/React.createElement("select", {
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
  }, pc.level)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      let options = occupations.filter(o => o !== pc.occupations[1]);
      let newVal = pick(options);
      setPc({
        ...pc,
        occupations: [newVal, pc.occupations[1]]
      });
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
  }))), showOccDropdown2 && /*#__PURE__*/React.createElement("div", {
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
      let options = occupations.filter(o => o !== pc.occupations[0]);
      let newVal = pick(options);
      setPc({
        ...pc,
        occupations: [pc.occupations[0], newVal]
      });
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
  })))), /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Spell Power (Pick if caster)",
    value: /*#__PURE__*/React.createElement(React.Fragment, null, (() => {
      const intAttr = pc.attrs.find(a => a.attr === "Intelligence");
      const wisAttr = pc.attrs.find(a => a.attr === "Wisdom");
      if (pc.spellPowerType === "None") {
        return 0;
      }
      const spellPower = pc.spellPowerType === "Arcane" ? intAttr.check + 10 : wisAttr.check + 10;
      return spellPower;
    })(), " ", /*#__PURE__*/React.createElement("select", {
      value: pc.spellPowerType,
      onChange: handleSpellPowerChange,
      className: "ml-1 px-1 rounded text-xs border"
    }, /*#__PURE__*/React.createElement("option", {
      value: "None"
    }, "None"), /*#__PURE__*/React.createElement("option", {
      value: "Arcane"
    }, "Arcane"), /*#__PURE__*/React.createElement("option", {
      value: "Divine"
    }, "Divine")))
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
    onClick: () => setSelectedWeapon(pick(weapons).name),
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("img", {
    src: "./d6.png",
    alt: "Reroll",
    style: {
      width: "25px",
      height: "25px",
      filter: darkMode ? "invert(1)" : "none"
    }
  }))), /*#__PURE__*/React.createElement("ul", {
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
  }, "..."), showAppearanceDropdown && /*#__PURE__*/React.createElement("button", {
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
      let newVal = pick(appearances);
      pc.appearance = newVal;
      setPc({
        ...pc,
        appearance: newVal
      });
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
  }))), showAppearanceDropdown ? /*#__PURE__*/React.createElement("div", {
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
  }, a)))) : /*#__PURE__*/React.createElement("div", {
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
  }, "..."), showDetailDropdown && /*#__PURE__*/React.createElement("button", {
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
      let newVal = pick(details);
      pc.detail = newVal;
      setPc({
        ...pc,
        detail: newVal
      });
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
  }))), showDetailDropdown ? /*#__PURE__*/React.createElement("div", {
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
  }, d)))) : /*#__PURE__*/React.createElement("div", {
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
  }, "..."), showClothingDropdown && /*#__PURE__*/React.createElement("button", {
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
      let newVal = pick(clothes);
      pc.clothing = newVal;
      setPc({
        ...pc,
        clothing: newVal
      });
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
  }))), showClothingDropdown ? /*#__PURE__*/React.createElement("div", {
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
  }, c)))) : /*#__PURE__*/React.createElement("div", {
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
  }, "..."), showQuirkDropdown && /*#__PURE__*/React.createElement("button", {
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
      let newVal = pick(quirks);
      pc.quirk = newVal;
      setPc({
        ...pc,
        quirk: newVal
      });
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
  }))), showQuirkDropdown ? /*#__PURE__*/React.createElement("div", {
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
  }, q)))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.quirk)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Alignment"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setShowAlignmentDropdown(v => !v)
  }, "..."), showAlignmentDropdown && /*#__PURE__*/React.createElement("button", {
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
      const alignmentRoll = d6();
      let newAlignment;
      if (alignmentRoll <= 2) {
        newAlignment = "Lawful";
      } else if (alignmentRoll <= 5) {
        newAlignment = "Neutral";
      } else {
        newAlignment = "Chaotic";
      }
      setPc({ ...pc, alignment: newAlignment });
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
  }))), showAlignmentDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.alignment,
    onChange: handleAlignmentChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowAlignmentDropdown(false)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Lawful"
  }, "Lawful"), /*#__PURE__*/React.createElement("option", {
    value: "Neutral"
  }, "Neutral"), /*#__PURE__*/React.createElement("option", {
    value: "Chaotic"
  }, "Chaotic"))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.alignment)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-start gap-1 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, "Personality"), /*#__PURE__*/React.createElement("button", {
    className: "px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700",
    style: {
      fontSize: "0.75rem"
    },
    onClick: () => setShowPersonalityDropdown(v => !v)
  }, "..."), showPersonalityDropdown && /*#__PURE__*/React.createElement("button", {
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
      const newPersonality = pick(personalities);
      setPc({
        ...pc,
        personality: newPersonality
      });
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
  }))), showPersonalityDropdown ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: pc.personality,
    onChange: handlePersonalityChange,
    className: "border rounded px-1 py-0.5 text-sm",
    autoFocus: true,
    onBlur: () => setShowPersonalityDropdown(false)
  }, personalities.map(p => /*#__PURE__*/React.createElement("option", {
    key: p,
    value: p
  }, p)))) : /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, pc.personality)))), /*#__PURE__*/React.createElement("div", {
    key: "attributions",
    className: "text-center text-xs text-gray-500 mt-4"
  }, /*#__PURE__*/React.createElement("p", {
    key: "forge-license",
    className: "text-xs mb-2"
  }, "")));
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
