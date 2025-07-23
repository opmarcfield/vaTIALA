
const PLAYERS = ["vaOPA", "vaPEEXI", "vaRautaMake", "vaROSQIS"];
const leaderColors = {
  vaOPA:      "purple",
  vaPEEXI:    "black",
  vaRautaMake:"white",
  vaROSQIS:   "blue"
};
const CUSTOM_CATEGORIES = {
  Combat: {
    skills:    ["Attack", "Defence", "Hitpoints", "Magic", "Prayer", "Ranged", "Strength"],
    minigames: []
  },
  Gathering: {
    skills:    ["Farming", "Fishing", "Hunter", "Mining", "Woodcutting"],
    minigames: []
  },
  Production: {
    skills:    ["Cooking", "Crafting", "Fletching", "Herblore", "Runecraft", "Smithing"],
    minigames: []
  },
  Utility: {
    skills:    ["Agility", "Construction", "Firemaking", "Slayer", "Thieving"],
    minigames: []
  },
  Bosses: {
    skills:    [],
    minigames: [
      "Abyssal Sire", "Alchemical Hydra", "Amoxliatl", "Araxxor", "Artio",
      "Barrows", "Bryophyta", "Callisto", "Calvarion", "Cerberus",
      "Chaos Elemental", "Chaos Fanatic", "Commander Zilyana", "Corporeal Beast",
      "Crazy Archaeologist", "Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme",
      "Deranged Archaeologist", "Doom of Mokhaiotl", "Duke Sucellus", "General Graardor", "Giant Mole",
      "Grotesque Guardians", "Hespori", "Kalphite Queen", "King Black Dragon",
      "Kraken", "Kree'Arra", "K'ril Tsutsaroth", "Lunar Chests", "Mimic",
      "Nex", "Nightmare", "Phosani's Nightmare", "Obor", "Phantom Muspah",
      "Sarachnis", "Scorpia", "Scurrius", "Skotizo", "Sol Heredit",
      "Spindel", "The Gauntlet", "The Corrupted Gauntlet", "The Hueycoatl",
      "The Leviathan", "The Royal Titans", "The Whisperer", "Thermonuclear Smoke Devil",
      "TzKal-Zuk", "TzTok-Jad", "Vardorvis", "Venenatis", "Vet'ion",
      "Vorkath", "Yama", "Zulrah"
    ]
  },
  Raids: {
    skills:    [],
    minigames: ["Tombs of Amascut", "Tombs of Amascut - Expert Mode","Chambers of Xeric", "Chambers of Xeric: Challenge Mode", "Theatre of Blood", "Theatre of Blood: Hard Mode"]
  },
  Clues: {
    skills:    [],
    minigames: [
      "Clue Scrolls (all)",
      "Clue Scrolls (beginner)",
      "Clue Scrolls (easy)",
      "Clue Scrolls (medium)",
      "Clue Scrolls (hard)",
      "Clue Scrolls (elite)",
      "Clue Scrolls (master)"
    ]
  },
  "Collection log": {
    skills:    [],
    minigames: ["Collections Logged"]
  },
  Minigames: {
    skills:    [],
    minigames: ["Tempoross", "Wintertodt", "Rifts closed", "Zalcano"]
  }
};


function displayCategoryLeaders(playersData) {
  const categories = ["Bosses", "Clues", "Minigames"];
  const catIcons = {
    Bosses:    "./images/Obor icon.png",
    Clues:     "./images/Clue Scrolls (all) icon.png",
    Minigames: "./images/Tempoross icon.png"
  };

  const table = document.createElement("table");
  table.border = "1";
  table.style.width = "100%";

  // header
  const headerRow = document.createElement("tr");
  ["Category","Leader","Total"].forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // populate rows
  categories.forEach(cat => {
    const ranked = rankPlayersByCategory(playersData, cat);
    if (ranked.length === 0) {
      return;  // <<–– nothing to render here
    }
    const top = ranked[0];
    const row = document.createElement("tr");

    // Category + Icon
    const catCell = document.createElement("td");
    const img = document.createElement("img");
    img.src = catIcons[cat] || "./images/default-icon.png";
    img.alt = cat;
    img.style.width = img.style.height = "24px";
    img.style.marginRight = "6px";
    img.style.verticalAlign = "middle";
    catCell.appendChild(img);
    catCell.appendChild(document.createTextNode(cat));
    row.appendChild(catCell);

    // Leader
    const leaderCell = document.createElement("td");
    leaderCell.textContent = top.name;
    leaderCell.style.color = leaderColors[top.name] || "black";
    leaderCell.style.fontWeight = "bold";
    row.appendChild(leaderCell);

    // Total
    const totalCell = document.createElement("td");
    totalCell.textContent = top.gains[cat].toLocaleString();
    row.appendChild(totalCell);

    table.appendChild(row);
  });

  // wrap in box
  const box = document.createElement("div");
  box.classList.add("category-box");
  const heading = document.createElement("h2");
  heading.textContent = "Category Leaders";
  box.appendChild(heading);
  box.appendChild(table);

  document.getElementById("results").appendChild(box);
}
async function fetchPlayerData(playerName) {
  const url = `./data/${playerName}.json`;  // e.g. ./data/vaPEEXI.json
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();  // returns the parsed JSON object
}

async function getHighestLevels() {
  const playerData = await Promise.all(PLAYERS.map(fetchPlayerData));

  // Extract the latest snapshot for each player
  const latestSnapshots = playerData.map(player => {
    const snapshots = player.snapshots;
    return snapshots[snapshots.length - 1]; // Get the newest snapshot
  });
  
  // Determine the highest level for each skill
  const skills = Object.keys(latestSnapshots[0].skills); // Get all skill names
  const highestLevels = {};

  skills.forEach(skill => {
    let highestLevel = -1;
    let playerWithHighestLevel = "";

    latestSnapshots.forEach((snapshot, index) => {
      const level = snapshot.skills[skill].level;
      if (level > highestLevel) {
        highestLevel = level;
        playerWithHighestLevel = PLAYERS[index];
      }
    });
  
    highestLevels[skill] = {
      player: playerWithHighestLevel,
      level: highestLevel
    };
  });

  return highestLevels;
}

async function displayHighestLevels() {
  const highestLevels = await getHighestLevels();

  // Mapping of skills to their corresponding icons
  const skillIcons = {
    "Overall": "./images/Overall icon.png",
    "Attack": "./images/Attack icon.png",
    "Defence": "./images/Defence icon.png",
    "Strength": "./images/Strength icon.png",
    "Hitpoints": "./images/Hitpoints icon.png",
    "Ranged": "./images/Ranged icon.png",
    "Prayer": "./images/Prayer icon.png",
    "Magic": "./images/Magic icon.png",
    "Cooking": "./images/Cooking icon.png",
    "Woodcutting": "./images/Woodcutting icon.png",
    "Fletching": "./images/Fletching icon.png",
    "Fishing": "./images/Fishing icon.png",
    "Firemaking": "./images/Firemaking icon.png",
    "Crafting": "./images/Crafting icon.png",
    "Smithing": "./images/Smithing icon.png",
    "Mining": "./images/Mining icon.png",
    "Herblore": "./images/Herblore icon.png",
    "Agility": "./images/Agility icon.png",
    "Thieving": "./images/Thieving icon.png",
    "Slayer": "./images/Slayer icon.png",
    "Farming": "./images/Farming icon.png",
    "Runecraft": "./images/Runecraft icon.png",
    "Hunter": "./images/Hunter icon.png",
    "Construction": "./images/Construction icon.png"
    };
  
    // Create the table
    const table = document.createElement("table");
    table.border = "1";
    table.style.width = "100%";
  
    // Create the header row
    const headerRow = document.createElement("tr");
    const skillHeader = document.createElement("th");
    skillHeader.textContent = "Skill";
    const playerHeader = document.createElement("th");
    playerHeader.textContent = "Leader";
    const levelHeader = document.createElement("th");
    levelHeader.textContent = "LVL";
    headerRow.appendChild(skillHeader);
    headerRow.appendChild(playerHeader);
    headerRow.appendChild(levelHeader);
    table.appendChild(headerRow);
  
    // Populate the table with data
    Object.entries(highestLevels).forEach(([skill, data]) => {
      const row = document.createElement("tr");
  
      // Skill cell with icon
      const skillCell = document.createElement("td");
      const skillIcon = document.createElement("img");
      skillIcon.src = skillIcons[skill] || "./images/default-icon.png"; // Use a default icon if no mapping exists
      skillIcon.alt = `${skill} Icon`;
      skillIcon.style.width = "24px";
      skillIcon.style.height = "24px";
      skillIcon.style.verticalAlign = "middle";
      skillIcon.style.marginRight = "8px"; // Space between icon and text
      skillCell.appendChild(skillIcon);
      skillCell.appendChild(document.createTextNode(skill));
      row.appendChild(skillCell);
  
      // Player cell with specific color
      const playerCell = document.createElement("td");
      playerCell.textContent = data.player;
      playerCell.style.color = leaderColors[data.player] || "black"; // Use black as default if no color is defined
      playerCell.style.fontWeight = "bold"; // Make text bold
      row.appendChild(playerCell);
  
      // Level cell
      const levelCell = document.createElement("td");
      levelCell.textContent = data.level;
      row.appendChild(levelCell);
  
      table.appendChild(row);
    });
  
    // Create a wrapper for the highest levels table
    const categoryBox = document.createElement("div");
    categoryBox.classList.add("category-box");
  
    // Add a heading for the highest levels table
    //const heading = document.createElement("h2");
    //heading.textContent = "Skill Leaders";
    //categoryBox.appendChild(heading);
  
    // Add the table inside the box
    //categoryBox.appendChild(table);

    // --- NEW: Side-by-side Skill Table ---
    // Build a table with skills as rows and players as columns
    const playerSkillTable = document.createElement("table");
    playerSkillTable.border = "1";
    playerSkillTable.style.width = "100%";
    playerSkillTable.style.marginTop = "2px";

    // Gather latest skill data for each player
    const playerData = await Promise.all(PLAYERS.map(fetchPlayerData));
    const latestSnapshots = playerData.map(player => player.snapshots[player.snapshots.length - 1]);
    const skillNames = Object.keys(latestSnapshots[0].skills);

    // Header row: first cell empty, then player names
    const headerRow2 = document.createElement("tr");
    headerRow2.appendChild(document.createElement("th")).textContent = "Skill";
    PLAYERS.forEach(player => {
      const th = document.createElement("th");
      th.textContent = player;
      th.style.whiteSpace = "normal"; 
      th.style.wordBreak = "break-word";
      th.style.color = leaderColors[player] || "black";
      headerRow2.appendChild(th);
    });
    playerSkillTable.appendChild(headerRow2);

    // For each skill, add a row
    skillNames.forEach(skill => {
      const row = document.createElement("tr");
      // Skill icon only (no text)
      const skillCell = document.createElement("td");
      const skillIcon = document.createElement("img");
      skillIcon.src = skillIcons[skill] || "./images/default-icon.png";
      skillIcon.alt = `${skill} Icon`;
      skillIcon.style.width = "24px";
      skillIcon.style.height = "24px";
      skillIcon.style.verticalAlign = "middle";
      skillCell.appendChild(skillIcon);
      row.appendChild(skillCell);
      // Find the highest level for this skill
      let maxLevel = -1;
      let maxIndexes = [];
      latestSnapshots.forEach((snap, idx) => {
        const lvl = snap.skills[skill].level;
        if (lvl > maxLevel) {
          maxLevel = lvl;
          maxIndexes = [idx];
        } else if (lvl === maxLevel) {
          maxIndexes.push(idx);
        }
      });
      // Player cells, add crown to highest
      latestSnapshots.forEach((snap, idx) => {
        const td = document.createElement("td");
        td.textContent = snap.skills[skill].level;
        if (maxIndexes.includes(idx)) {
          td.textContent += ' 👑';
        }
        row.appendChild(td);
      });
      playerSkillTable.appendChild(row);
    });

    // Wrapper for the new table
    const scrollContainer = document.createElement("div");
    scrollContainer.style.overflowX = "auto";
    const sideTableBox = document.createElement("div");
    sideTableBox.classList.add("category-box");
    const heading2 = document.createElement("h2");
    heading2.textContent = "Skill Table";
    heading2.style.textAlign = "center";
    sideTableBox.appendChild(heading2);
    scrollContainer.appendChild(playerSkillTable);
    sideTableBox.appendChild(scrollContainer);
    categoryBox.appendChild(sideTableBox);

    // Append the entire category box to the results container
    const resultsContainer = document.getElementById("results");
    resultsContainer.appendChild(categoryBox);
  }
  /**
   * Given the array of snapshots for one player,
   * returns an object with each tier's 'score' from the *latest* snapshot.
   * If the tier is -1 or missing, we'll use 0 as a fallback.
   */
   function getLatestClueTiers(snapshots) {
    // If no snapshots, return zeros
    if (!snapshots || snapshots.length === 0) {
      return {
        all: 0,
        beginner: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        elite: 0,
        master: 0
      };
    }
    // Grab the last snapshot
    const last = snapshots[snapshots.length - 1];
  
    // Access the relevant "Clue Scrolls (X)" data
    // Adjust path if your JSON structure is different
    function getScore(key) {
      // If not found or -1, return 0
      const entry = last.minigames?.[key];
      return (entry && entry.score >= 0) ? entry.score : 0;
    }
  
    return {
      all:      getScore("Clue Scrolls (all)"),
      beginner: getScore("Clue Scrolls (beginner)"),
      easy:     getScore("Clue Scrolls (easy)"),
      medium:   getScore("Clue Scrolls (medium)"),
      hard:     getScore("Clue Scrolls (hard)"),
      elite:    getScore("Clue Scrolls (elite)"),
      master:   getScore("Clue Scrolls (master)")
    };
  }
  function rankPlayersByClues(playersData) {
    // Build an array of { name, cluesData } for each player
    const enriched = playersData.map(player => {
      const { all, beginner, easy, medium, hard, elite, master } = getLatestClueTiers(player.snapshots);
      return {
        name: player.player_name, 
        all, beginner, easy, medium, hard, elite, master
      };
    });
  
    // Sort by total "all" in descending order
    enriched.sort((a, b) => b.all - a.all);
  
    return enriched;
  }
  
  function getSkillLevelChanges(snapshots) {
    if (snapshots.length < 2) {
      return []; // No previous snapshot to compare
    }
    const prev = snapshots[snapshots.length - 2]; // second to last
    const curr = snapshots[snapshots.length - 1]; // last
  
    const changes = [];
    for (const skill in curr.skills) {
      const oldLevel = prev.skills[skill].level;
      const newLevel = curr.skills[skill].level;
      if (newLevel > oldLevel) {
        changes.push({
          skill,
          oldLevel,
          newLevel,
          diff: newLevel - oldLevel
        });
      }
    }
    return changes;
  }

  function getMinigameChanges(snapshots) {
    if (snapshots.length < 2) return [];
    const prev = snapshots[snapshots.length - 2].minigames || {};
    const curr = snapshots[snapshots.length - 1].minigames || {};
    const changes = [];
  
    Object.keys(curr).forEach(key => {
      const oldScore = prev[key]?.score ?? 0;
      const newScore = curr[key]?.score ?? 0;
      if (newScore > oldScore) {
        changes.push({
          name: key,
          oldScore,
          newScore,
          diff: newScore - oldScore
        });
      }
    });
  
    return changes;
  }
  
  
    function calculateGains(snapshots) {
        // If there's only one snapshot, no "earliest" for a difference.
        // We'll just return 0 for the difference-based categories,
        // and the latest value for the "latest-only" categories.
        if (snapshots.length < 2) {
          const only = snapshots.length === 1 ? snapshots[0] : null;
          const cat = only ? only.custom_categories : {};
          return {
            // Difference-based categories -> 0
            Combat: 0,
            Gathering: 0,
            Production: 0,
            Utility: 0,
      
            // Latest-only categories -> just show snapshot's value (if any)
            Bosses: cat?.Bosses?.minigames_total_score ?? 0,
            Minigames: cat?.Minigames?.minigames_total_score ?? 0,
            Clues: cat?.Clues?.minigames_total_score ?? 0
          };
        }
      
        // Otherwise, we have earliest & latest
        const earliest = snapshots[0];
        const latest = snapshots[snapshots.length - 1];
      
        // Helper to safely get a skill XP difference
        function diffXP(categoryName) {
          const e = earliest.custom_categories[categoryName]?.skills_total_xp ?? 0;
          const l = latest.custom_categories[categoryName]?.skills_total_xp ?? 0;
          return l - e;
        }
      
        // For Bosses, Minigames, Clues, we show only the latest minigame score
        function latestScore(categoryName) {
          return latest.custom_categories[categoryName]?.minigames_total_score ?? 0;
        }
      
        return {
          // Show difference in XP for these categories
          Combat: diffXP("Combat"),
          Gathering: diffXP("Gathering"),
          Production: diffXP("Production"),
          Utility: diffXP("Utility"),
      
          // Show latest minigame score for these categories
          Bosses: latestScore("Bosses"),
          Minigames: latestScore("Minigames"),
          Clues: latestScore("Clues")
        };
      }
      
  
    function rankPlayersByCategory(playersData, category) {
        // Sort players in descending order of gains for the category
        return [...playersData].sort((a, b) => b.gains[category] - a.gains[category]);
      }
  
      async function main() {
        // 1. Gather player data
        const playersData = [];
        for (const player of PLAYERS) {
          try {
            const data = await fetchPlayerData(player);
            const gains = calculateGains(data.snapshots);
            const minigameChanges = getMinigameChanges(data.snapshots);
            const lastSnap = data.snapshots[data.snapshots.length - 1];
            playersData.push({
              name: data.player_name,
              gains: calculateGains(data.snapshots),
              skillChanges: getSkillLevelChanges(data.snapshots),
              minigameChanges: getMinigameChanges(data.snapshots),
              latestMinigames: lastSnap.minigames 
            });
          } catch (err) {
            console.error("Error fetching/parsing player:", player, err);
          }
        }
      
        // 2. Reference your main container for dynamic content
        const container = document.getElementById("results");

        // 3. SKILL CHANGES SECTION (place it first, so it appears before tables)
        const skillChangesBox = document.createElement("div");
        skillChangesBox.classList.add("category-box");
      
        const skillChangesHeading = document.createElement("h2");
        skillChangesHeading.textContent = "Daily News";
        skillChangesBox.appendChild(skillChangesHeading);
      
        // If you want a grid or row layout for player boxes
        const gridContainer = document.createElement("div");
        gridContainer.classList.add("skills-changes-grid"); 
        // (Ensure you have .skills-changes-grid in your CSS)
      
        // Build a box for each player's changes
        playersData.forEach((player) => {
          const hasSkillNews    = player.skillChanges.length > 0;
          const hasMinigameNews = player.minigameChanges.length > 0;
          if (!hasSkillNews && !hasMinigameNews) return;
      
          const playerBox = document.createElement("div");
          playerBox.classList.add("player-changes");
      
          const playerHeading = document.createElement("h3");
          playerHeading.textContent = player.name;
          playerBox.appendChild(playerHeading);
      
          const ul = document.createElement("ul");
          player.skillChanges.forEach((change) => {
            const li = document.createElement("li");
            li.innerHTML = `
              <img
                src="./images/${change.skill} icon.png"
                alt="${change.skill} Icon"
                style="width:20px; height:20px; vertical-align:middle; margin:0 5px;"
              />
              ${change.oldLevel} ➾ ${change.newLevel}
            `;
            ul.appendChild(li);
          });
          player.minigameChanges.forEach(change => {
            if (change.name !== "Clue Scrolls (all)") {
              const li = document.createElement("li");
          
              // 1. create the img
              const img = document.createElement("img");
              img.src   = `./images/${change.name} icon.png`;
              img.alt   = `${change.name} Icon`;
              img.title         = `${change.name}`;
              img.style.width          = "20px";
              img.style.height         = "20px";
              img.style.verticalAlign  = "middle";
              img.style.marginRight    = "6px";
          
              // 2. text node + scores
              const span = document.createElement("span");
              span.textContent = `${change.oldScore} ➾ ${change.newScore}`;
          
              // 3. assemble
              li.appendChild(img);
              li.appendChild(span);
              ul.appendChild(li);
            }
          });
          
          playerBox.appendChild(ul);
          gridContainer.appendChild(playerBox);
        });
      
        skillChangesBox.appendChild(gridContainer);
        // **Append the skillChangesBox BEFORE you build the tables.**git
        container.appendChild(skillChangesBox);
        await displayHighestLevels();
        displayCategoryLeaders(playersData);
        /**
 * Renders a box with an <h2>title</h2> and a table of:
 *   Item | Leader | Count
 *
 * @param {string} title       The heading to use ("Boss Leaders", etc.)
 * @param {string[]} items     Array of keys in latestMinigames to show
 * @param {Array} playersData  Your enriched data from main()
 * @param {Object} iconMap     Map itemName → icon URL
 */
function displayItemLeaders(title, items, playersData, iconMap = {}) {
  // build table skeleton
  const tbl = document.createElement("table");
  tbl.border = "1";
  tbl.style.width = "100%";

  const hdr = document.createElement("tr");
  ["Item", "Leader", "Count"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    hdr.appendChild(th);
  });
  tbl.appendChild(hdr);

  // for each boss/minigame/clue
  items.forEach(item => {
    // 1) figure out the top score
    let topCount = -1, topPlayer = null;
    playersData.forEach(p => {
      const count = p.latestMinigames[item]?.score ?? 0;
      if (count > topCount) {
        topCount = count;
        topPlayer = p.name;
      }
    });
    if (topCount <= 0) {
      return;    // <— nothing to render for this item
    }
    // render row
    const row = document.createElement("tr");

    // item + icon
    const cellItem = document.createElement("td");
    const img = document.createElement("img");

    const rawPath = `./images/${item} icon.png`;
    
    img.src = iconMap[item]
              ? iconMap[item]
              : encodeURI(rawPath);
    img.alt = item + " icon";
    img.style.width = img.style.height = "24px";
    img.style.marginRight = "6px";
    img.style.verticalAlign = "middle";
    cellItem.appendChild(img);
    cellItem.appendChild(document.createTextNode(item));
    row.appendChild(cellItem);

    // leader (with color)
    const cellLeader = document.createElement("td");
    cellLeader.textContent = topPlayer || "–";
    cellLeader.style.fontWeight = "bold";
    cellLeader.style.color      = leaderColors[topPlayer] || "black";
    row.appendChild(cellLeader);

    // count
    const cellCount = document.createElement("td");
    cellCount.textContent = topCount.toLocaleString();
    row.appendChild(cellCount);

    tbl.appendChild(row);
  });

  // wrap & append
  const box = document.createElement("div");
  box.classList.add("category-box");
  const h2 = document.createElement("h2");
  h2.textContent = title;
  box.appendChild(h2);
  box.appendChild(tbl);

  document.getElementById("results").appendChild(box);
}
         // **NOW** hand off to the three new renderers:
        displayItemLeaders(
        "Boss Leaders",
        CUSTOM_CATEGORIES.Bosses.minigames,
        playersData
        );

        displayItemLeaders(
          "Raid Leaders",
          CUSTOM_CATEGORIES.Raids.minigames,
          playersData
          );

        displayItemLeaders(
        "Clue Leaders",
        CUSTOM_CATEGORIES.Clues.minigames,
        playersData
        );

        displayItemLeaders(
        "Minigame Leaders",
        CUSTOM_CATEGORIES.Minigames.minigames,
        playersData
        );

        // --- CATEGORY SWITCHER DROPDOWN ---
        // (Only define these variables once, after Skill Leaders table)
        const catSwitcherBox = document.createElement('div');
        catSwitcherBox.style.display = 'flex';
        catSwitcherBox.style.justifyContent = 'center';
        catSwitcherBox.style.alignItems = 'center';
        catSwitcherBox.style.marginBottom = '20px';
        catSwitcherBox.style.gap = '12px';

        const catLabel = document.createElement('label');
        catLabel.textContent = 'Show Category: ';
        catLabel.setAttribute('for', 'category-switcher');
        catLabel.style.fontWeight = 'bold';
        catLabel.style.fontSize = '1.1em';

        const catSelect = document.createElement('select');
        catSelect.id = 'category-switcher';
        catSelect.style.fontSize = '1.1em';
        catSelect.style.padding = '2px 8px';
        catSelect.style.borderRadius = '6px';
        catSelect.style.background = '#e0e0e0';
        catSelect.style.color = '#333';
        catSelect.style.border = '1px solid #8d6e63';

        const catSwitcherOptions = [
          { value: '', label: 'Select Category...', disabled: true, selected: true },
          { value: 'Combat', label: 'Combat' },
          { value: 'Gathering', label: 'Gathering' },
          { value: 'Production', label: 'Production' },
          { value: 'Utility', label: 'Utility' },
          { value: 'Bosses', label: 'Total Boss KC' },
          { value: 'Clues', label: 'Clue Scroll Completions' },
          { value: 'Minigames', label: 'Minigame KC' },
          { value: 'ShowAll', label: 'Show All' }
        ];
        catSwitcherOptions.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          if (opt.disabled) o.disabled = true;
          if (opt.selected) o.selected = true;
          catSelect.appendChild(o);
        });
        catSwitcherBox.appendChild(catLabel);
        catSwitcherBox.appendChild(catSelect);
        // Insert just after Skill Leaders table
        const resultsBox = document.getElementById('results');
        const skillLeadersBox = resultsBox.querySelector('.category-box h2');
        if (skillLeadersBox && skillLeadersBox.textContent.trim() === 'Skill Leaders') {
          resultsBox.insertBefore(catSwitcherBox, skillLeadersBox.parentElement.nextSibling);
        } else {
          resultsBox.appendChild(catSwitcherBox);
        }

        // --- CATEGORY SWITCHER LOGIC ---
        // Hide all relevant tables by default (on page load)
        function hideAllCategoryTables() {
          const map = {
            'Combat': 'Combat XP',
            'Gathering': 'Gathering XP',
            'Production': 'Production XP',
            'Utility': 'Utility XP',
            'Bosses': 'Total Boss KC',
            'Clues': 'Clue Scroll Completions',
            'Minigames': 'Minigame KC'
          };
          const categoryHeadings = Object.values(map);
          const boxes = Array.from(resultsBox.querySelectorAll('.category-box'));
          boxes.forEach(box => {
            const h2 = box.querySelector('h2');
            if (!h2) return;
            const txt = h2.textContent.trim();
            if (categoryHeadings.includes(txt)) {
              box.style.display = 'none';
            }
          });
        }
        // Run after a short delay to ensure all tables are rendered
        setTimeout(hideAllCategoryTables, 0);

        catSelect.addEventListener('change', function() {
          const selected = catSelect.value;
          const map = {
            'Combat': 'Combat XP',
            'Gathering': 'Gathering XP',
            'Production': 'Production XP',
            'Utility': 'Utility XP',
            'Bosses': 'Total Boss KC',
            'Clues': 'Clue Scroll Completions',
            'Minigames': 'Minigame KC'
          };
          const categoryHeadings = Object.values(map);
          const boxes = Array.from(resultsBox.querySelectorAll('.category-box'));
          boxes.forEach(box => {
            const h2 = box.querySelector('h2');
            if (!h2) return;
            const txt = h2.textContent.trim();
            if (selected === 'ShowAll') {
              // Show all
              if (categoryHeadings.includes(txt)) {
                box.style.display = '';
              }
            } else if (selected && map[selected]) {
              // Only show the selected category
              if (txt === map[selected]) {
                box.style.display = '';
              } else if (categoryHeadings.includes(txt)) {
                box.style.display = 'none';
              }
            } else {
              // Hide all relevant tables
              if (categoryHeadings.includes(txt)) {
                box.style.display = 'none';
              }
            }
          });
        });
  
        // 4. CATEGORIES SECTION (your existing code for each table)
        const categories = ["Bosses", "Clues", "Minigames", "Combat", "Gathering", "Production", "Utility"];
        const diffCats = ["Combat", "Gathering", "Production", "Utility"];
      
        categories.forEach((category) => {
          const ranking = rankPlayersByCategory(playersData, category);
      
          // Build the heading
          const heading = document.createElement("h2");
          const headingText = document.createElement("span");
          const categoryHeadings = {
            Combat: "Combat XP",
            Gathering: "Gathering XP",
            Production: "Production XP",
            Utility: "Utility XP",
            Bosses: "Total Boss KC",
            Clues: "Clue Scroll Completions",
            Minigames: "Minigame KC",
          };
          headingText.textContent = categoryHeadings[category] || `${category} XP`;
      
          if (diffCats.includes(category)) {
            const symbolContainer = document.createElement("span");
            symbolContainer.style.marginRight = "8px";
            const symbolSources = {
              Combat: ["./images/Attack icon.png", "./images/Defence icon.png", "./images/Hitpoints icon.png", "./images/Magic icon.png", "./images/Prayer icon.png", "./images/Ranged icon.png", "./images/Strength icon.png"],
              Gathering: ["./images/Farming icon.png", "./images/Fishing icon.png", "./images/Hunter icon.png", "./images/Mining icon.png", "./images/Woodcutting icon.png"],
              Utility: ["./images/Agility icon.png", "./images/Thieving icon.png", "./images/Construction icon.png", "./images/Firemaking icon.png", "./images/Slayer icon.png"],
              Production: ["./images/Crafting icon.png", "./images/Smithing icon.png", "./images/Fletching icon.png", "./images/Herblore icon.png", "./images/Runecraft icon.png", "./images/Cooking icon.png"],
            };
            if (symbolSources[category]) {
              symbolSources[category].forEach((src) => {
                const symbolImg = document.createElement("img");
                symbolImg.src = src;
                symbolImg.alt = `${category} Symbol`;
                symbolImg.style.width = "24px";
                symbolImg.style.height = "24px";
                symbolImg.style.verticalAlign = "middle";
                symbolContainer.appendChild(symbolImg);
              });
            }
            heading.appendChild(symbolContainer);
          }
      
          heading.appendChild(headingText);
      
          // Create a category box
          const categoryBox = document.createElement("div");
          categoryBox.classList.add("category-box");
          categoryBox.appendChild(heading);
      
          // Build the table
          const table = document.createElement("table");
          table.innerHTML = `
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>${diffCats.includes(category) ? `${category} XP Gains` : `${category} Total`}</th>
              </tr>
            </thead>
          `;
          const tbody = document.createElement("tbody");
      
          ranking.forEach((p, index) => {
            const row = document.createElement("tr");
            let displayName = p.name;
      
            if (index === 0) {
              row.style.fontWeight = "bold";
              let title = "";
              if (category === "Clues") title = " 🝆 the CLUE MASTER";
              if (category === "Bosses") title = " 💀 the BOSS KILLER";
              if (category === "Minigames") title = " 🎮 the MINIGAME CHAMP";
              displayName += title;
            }
      
            row.innerHTML = `
              <td>${index + 1}</td>
              <td>${displayName}</td>
              <td>${p.gains[category].toLocaleString()}</td>
            `;
            tbody.appendChild(row);
          });
      
          table.appendChild(tbody);
          categoryBox.appendChild(table);
          container.appendChild(categoryBox);
          
        });
        
      }
      
      main();

  
