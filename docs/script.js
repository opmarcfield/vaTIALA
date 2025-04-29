const PLAYERS = ["vaOPA", "vaPEEXI", "vaRautaMake", "vaROSQIS"];

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
  
    // Mapping of leaders to their respective colors
    const leaderColors = {
    "vaOPA": "purple",
    "vaPEEXI": "black",
    "vaRautaMake": "white",
    "vaROSQIS": "blue"
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
    const heading = document.createElement("h2");
    heading.textContent = "Skill Leaders";
    categoryBox.appendChild(heading);
  
    // Add the table inside the box
    categoryBox.appendChild(table);
  
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
            playersData.push({
              name: data.player_name,
              gains,
              skillChanges: getSkillLevelChanges(data.snapshots),
              minigameChanges: getMinigameChanges(data.snapshots)
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
          if (player.skillChanges.length === 0) return;
      
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
        // **Append the skillChangesBox BEFORE you build the tables.**
        container.appendChild(skillChangesBox);
        await displayHighestLevels();
  
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
              if (category === "Clues") title = " 🏆 the CLUE MASTER";
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