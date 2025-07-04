// tables.js – FORGE Anniversary Edition full lookup tables (v1.1.2)
// Exported constants for names, occupations, weapons, armours, gear, etc.
// to keep the app.js file lean.

/* ------------------------------------------------------------------
 * NOTE:  The arrays are intentionally long and taken verbatim
 *        from the rule‑book.  Nothing is trimmed.
 * ----------------------------------------------------------------*/

export const attributeOrder = [
  "Strength","Dexterity","Constitution","Intelligence","Wisdom","Charisma"
];

export const OCC_ATTR_MAP = [
  { attr:"Strength",    keys:["barbarian","knight","warrior","mercenary","bodyguard","hunter","woodsman","pit","thug","soldier","bandit","outlaw"]},
  { attr:"Dexterity",   keys:["thief","pickpocket","spy","ranger","acrobat","burglar","assassin","sailor","navigator","courier","smuggler"]},
  { attr:"Constitution",keys:["miner","farmer","butcher","blacksmith","builder","labourer","villager"]},
  { attr:"Intelligence",keys:["wizard","mage","scientist","engineer","scribe","alchemist","inventor","magister","scholar","cartographer"]},
  { attr:"Wisdom",      keys:["cleric","druid","monk","priest","hermit","witch","missionary","reverend"]},
  { attr:"Charisma",    keys:["aristocrat","noble","bard","musician","actor","courtier","merchant","politician","statesman"]}
];

export const names = [
  "Adalyn","Aeddon","Alaric","Alenya","Alethia","Alistair","Alondo","Althea","Althus","Amara","Arasen","Aric","Asher","Astrid","Aveline","Barin","Bas","Bataar","Bellara","Bevan","Brom","Brynn","Caera","Caius","Caldas","Cedric","Celene","Chandra","Cortina","Corwin","Dariel","Davin","Dax","Delos","Dorian","Draven","Driana","Edda","Elara","Eldrin","Elira","Elowen","Elstan","Elyndor","Emrik","Eos","Esra","Evangeline","Evelith","Fanir","Farina","Fendrel","Fenris","Fenwick","Feryn","Flint","Freya","Galen","Garran","Garrick","Ghadon","Gideon","Giselle","Glynn","Gwenna","Hadrik","Haf","Halen","Halric","Helira","Hirsham","Idris","Ilora","Ilyana","Isarn","Ishana","Isolde","Jareth","Jasper","Jebran","Jihan","Jiselle","Jorena","Jorn","Jorven","Jorvik","Kaelith","Kaivan","Kalidas","Karyna","Katana","Kato","Katrin","Keelan","Kelric","Kenrick","Korgan","Kormak","Kunor","Kyler","Kynan","Leela","Lenara","Liorin","Loona","Lorien","Lucan","Lucius","Lyra","Maelis","Mathis","Mattick","Maya","Merrik","Milla","Mirael","Mireth","Morell","Morgana","Mortimer","Myrtle","Nakura","Nanda","Nazmi","Neera","Nekun","Nisus","Nolan","Noric","Norina","Nymeria","Nyssara","Nyx","Olyssa","Ophelin","Oren","Owyn","Padma","Pearce","Pendry","Perella","Perrin","Phyra","Qamar","Quentin","Quinn","Radric","Raelith","Renn","Reva","Roderick","Ronin","Roslyn","Rowan","Sabine","Sadia","Saren","Sariel","Saskia","Segura","Selene","Selira","Seraphina","Shekhar","Silas","Siorra","Solana","Soren","Tahir","Talon","Talyra","Tamara","Tamsin","Tarvin","Temir","Tessa","Thalindra","Tharic","Themon","Theryn","Thorne","Tia","Torgan","Torin","Tristan","Ulfar","Ulissa","Ulric","Ulvanna","Valeri","Varek","Varyn","Vaylen","Venara","Vera","Vesna","Vespera","Veyla","Wrenric","Wylisse","Wynne","Xanath","Xandor","Xyra","Yorath","Yorick","Yselda","Yuda","Zakar","Zane","Zanita","Zayra","Zeke","Zelena","Zephyr","Zorin"
];

export const occupations = [
  "Actor","Architect","Aristocrat","Assassin","Beggar","Cleric","Courtier","Dealer","Engineer","Executioner","Jailer","Jester","Judge","Knight","Locksmith","Mage","Magister","Musician","Noble","Paladin","Pickpocket","Pit‑fighter","Politician","Racketeer","Reverend","Scribe","Servant","Shopkeeper","Spy","Squire","Statesman","Steward","Teacher","Thug","Undertaker","Vagrant","Acolyte","Acrobat","Alchemist","Apothecary","Arbalist","Armorer","Artificer","Blacksmith","Bodyguard","Builder","Burglar","Butcher","Carpenter","Charlatan","Cook","Driver","Duellist","Fence","Fisherman","Gambler","Herald","Hitman","Illusionist","Inventor","Mercenary","Merchant","Preacher","Rogue","Scientist","Scrapper","Shepherd","Sorcerer","Thief","Villager","Warrior","Wizard","Astrologer","Bandit","Barbarian","Cartographer","Chronicler","Courier","Deserter","Drifter","Druid","Dungeoneer","Explorer","Falconer","Gamekeeper","Gardener","Herbalist","Hermit","Highwayman","Hunter","Missionary","Monk","Navigator","Occultist","Outcast","Outlaw","Pilgrim","Ranger","Recluse","Researcher","Sailor","Slaver","Smuggler","Tracker","Trader","Warlock","Witch","Woodsman"
];

export const weapons = [
  {name:"Quarterstaff",dmg:"1d8",slots:2},{name:"Rapier",dmg:"1d6",slots:1},{name:"Dagger",dmg:"1d6",slots:1},{name:"Shortsword",dmg:"1d6",slots:1},{name:"Cudgel",dmg:"1d6",slots:1},{name:"Sickle",dmg:"1d6",slots:1},{name:"Spear",dmg:"1d8",slots:2},{name:"Longsword",dmg:"1d8",slots:2},{name:"Mace",dmg:"1d8",slots:2},{name:"Axe",dmg:"1d8",slots:2},{name:"Flail",dmg:"1d8",slots:2},{name:"Halberd",dmg:"1d10[↑]",slots:3},{name:"Maul",dmg:"1d10[↑]",slots:3},{name:"Greataxe",dmg:"1d10[↑]",slots:3},{name:"Greatsword",dmg:"1d10[↑]",slots:3},{name:"Sling",dmg:"1d4",slots:1},{name:"Hand Crossbow",dmg:"1d4",slots:1},{name:"Shortbow",dmg:"1d4",slots:2},{name:"Longbow",dmg:"1d6",slots:2},{name:"Crossbow",dmg:"1d6",slots:2},{name:"Warbow",dmg:"1d6",slots:2}
];

export const armours = [
  {name:"No Armour",ac:10,slots:0},{name:"Leather Armour (AC12)",ac:12,slots:1},{name:"Chain Armour (AC14)",ac:14,slots:2},{name:"Plate Armour (AC16)",ac:16,slots:3}
];

/* ------------------------------ RAW LISTS ------------------------------ */

const dungeonGearRaw = [
  "Antidote","Bear trap","Pulleys","Candles x5","Chain (Close)","Chalk x10",
  "Chisel","Crowbar","Drill","Empty sack","Grappling hook","Grease","Hammer",
  "Heal potion","Spikes x5","Lantern","Lantern oil","Lens","Ladder",          
  "Manacles","Metal file","Mining pick","Mirror","Nails x10","Net","Poison",
  "10ft pole","Rope (Far)","Runestone (1st)","Sacred writ (1st)","Shovel","Spiked boots",
  "Thieves’ tools","Tinderbox","Torch","Twine (Distant)","Stakes x5"
];

const generalGearRaw = [
  "Air bladder","Bedroll","Bellows","Blank book","Bottle","Bucket","Caltrops",
  "Card deck","Cooking pot","Craft tools","Dice set","Face paint","Fake gems",
  "Fishing rod","Garlic","Glue","Grease","Horn","Hourglass","Incense",
  "Instrument","Loaded dice","Marbles","Padlock","Perfume","Quill and Ink",
  "Saw","Small bell","Soap","Sponge","Spyglass","Tar",
  "Tent (3 Man)","Tent (Personal)",                                             
  "Tongs","Whistle","Wolfsbane"
];

/* --------------------------- SLOT CALCULATOR --------------------------- */

function slotsFor(item) {
  if (/^Whistle$/i.test(item))                  return 0;  // weightless
  if (/^10ft pole$/i.test(item))                return 2;  // long & awkward
  if (/^Ladder$/i.test(item))                   return 3;  // extra-bulky
  if (/^Tent \(3 Man\)$/i.test(item))           return 2;  // heavier tent
  return 1;                                                // everything else
}

/* -------------------------- EXPORTED TABLES --------------------------- */

export const dungeonGear = dungeonGearRaw.map(name => ({
  name,
  slots: slotsFor(name)
}));

export const generalGear = generalGearRaw.map(name => ({
  name,
  slots: slotsFor(name)
}));

export const appearances = ["Angular","Athletic","Bony","Brawny","Broad","Burly","Chubby","Compact","Corpulent","Delicate","Flabby","Gaunt","Handsome","Hideous","Hulking","Lanky","Nimble","Petite","Pudgy","Ripped","Rotund","Rugged","Scrawny","Short","Sinewy","Skeletal","Slender","Statuesque","Stocky","Stout","Taut","Towering","Trim","Weathered","Willowy","Wiry"];
export const details = ["Bald","Battle scar","Big nose","Birthmark","Braided hair","Bristly chin","Broken nose","Burn scar","Curly hair","Dark skin","Dishevelled","Dreadlocks","Full beard","Long beard","Long hair","Lost finger","Makeup","Milky eye","Mohawk","Mustache","Narrow eyes","Oily skin","Pale skin","Pierced ear","Pierced nose","Pockmarked","Rosy cheeks","Short hair","Smells","Sunburned","Tanned","Tattooed","Topknot","Whip scar","Wispy hair","Missing tooth"];
export const clothes = ["Bloody","Burned","Ceremonial","Dated","Decaying","Decorated","Eccentric","Elegant","Embroidered","Exotic","Fashionable","Filthy","Fine","Fitting","Flamboyant","Food‑stained","Foreign","Formal","Frayed","Frumpy","Lacey","Livery","Oversized","Patched","Perfumed","Practical","Rancid","Rumpled","Stained","Striped","Stylish","Subdued","Torn","Undersized","Winter","Worn out"];
export const quirks = ["Anecdotes","Apologises","Breathy","Chews nails","Chuckles","Clumsy","Cracks joints","Cryptic","Deep voice","Drawls","Eye contact","Flexes fingers","Hugs","Interrupts","Knows‑it‑all","Long pauses","Lounges","Motionless","Moves stiffly","Paces","Puffs chest","Rambles","Random facts","Schemes","Smiley","Squeaky voice","Stutters","Talks formally","Talks loudly","Talks quickly","Talks slowly","Talks to self","Tells jokes","Twitches","Whispers","Whistles"];

// Helmet / shield constants exported for reuse
export const helmetItem = { name:"Helmet", slots:1 };
export const shieldItem = { name:"Shield", slots:1 };
export const rationItem  = { name:"Ration", slots:1 };

