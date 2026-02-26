// =============================================================================
// CONFIG — edit here to add/remove players or change colours
// =============================================================================
const MAX_OSRS_LEVEL = 126;
const RUNNER_UP_COUNT = 4; // how many runner-ups to show per leader row
const IMAGE_BASE = "./images/";

const PLAYERS_CONFIG = [
  { name: "vaOPA",       color: "purple" },
  { name: "vaPEEXI",    color: "black"  },
  { name: "vaRautaMake", color: "white"  },
  { name: "vaROSQIS",   color: "blue"   },
];

// Derived from config — no need to maintain separately
const PLAYER_NAMES  = PLAYERS_CONFIG.map(p => p.name);
const LEADER_COLORS = Object.fromEntries(PLAYERS_CONFIG.map(p => [p.name, p.color]));

// =============================================================================
// DISPLAY NAME OVERRIDES
// =============================================================================
const DISPLAY_NAME = { "PVPARENA": "PvP Arena - Rank" };
const prettyName = name => DISPLAY_NAME[name] || name;

// =============================================================================
// CATEGORY HEADING MAP  (single source of truth — used by switcher + renderer)
// =============================================================================
const CATEGORY_HEADING = {
  Combat:     "Combat XP",
  Gathering:  "Gathering XP",
  Production: "Production XP",
  Utility:    "Utility XP",
  Bosses:     "Total Boss KC",
  Clues:      "Clue Scroll Completions",
  Minigames:  "Minigame KC",
};
const SWITCHABLE_HEADINGS = new Set(Object.values(CATEGORY_HEADING));

// =============================================================================
// SKILL ICONS  (top-level constant, used in multiple places)
// =============================================================================
const SKILL_ICONS = {
  Overall: "Overall icon.png", Attack: "Attack icon.png",
  Defence: "Defence icon.png", Strength: "Strength icon.png",
  Hitpoints: "Hitpoints icon.png", Ranged: "Ranged icon.png",
  Prayer: "Prayer icon.png", Magic: "Magic icon.png",
  Cooking: "Cooking icon.png", Woodcutting: "Woodcutting icon.png",
  Fletching: "Fletching icon.png", Fishing: "Fishing icon.png",
  Firemaking: "Firemaking icon.png", Crafting: "Crafting icon.png",
  Smithing: "Smithing icon.png", Mining: "Mining icon.png",
  Herblore: "Herblore icon.png", Agility: "Agility icon.png",
  Thieving: "Thieving icon.png", Slayer: "Slayer icon.png",
  Farming: "Farming icon.png", Runecraft: "Runecraft icon.png",
  Hunter: "Hunter icon.png", Construction: "Construction icon.png",
  Sailing: "Sailing icon.png",
};
const skillIcon = skill =>
  IMAGE_BASE + (SKILL_ICONS[skill] || "default-icon.png");

// Category icon overrides
const CAT_ICONS = {
  Bosses:    IMAGE_BASE + "Obor icon.png",
  Clues:     IMAGE_BASE + "Clue Scrolls (all) icon.png",
  Minigames: IMAGE_BASE + "Tempoross icon.png",
};

// Icons shown in category section headings
const CATEGORY_SKILL_ICONS = {
  Combat:     ["Attack","Defence","Hitpoints","Magic","Prayer","Ranged","Strength"],
  Gathering:  ["Farming","Fishing","Hunter","Mining","Woodcutting"],
  Utility:    ["Agility","Thieving","Construction","Firemaking","Slayer"],
  Production: ["Crafting","Smithing","Fletching","Herblore","Runecraft","Cooking"],
};

// =============================================================================
// OSRS VIRTUAL LEVEL HELPERS
// =============================================================================
function buildXpThresholds(maxLevel = MAX_OSRS_LEVEL) {
  const thresholds = [0, 0]; // thresholds[1] = 0 XP
  let points = 0;
  for (let lvl = 2; lvl <= maxLevel; lvl++) {
    points += Math.floor((lvl - 1) + 300 * Math.pow(2, (lvl - 1) / 7));
    thresholds[lvl] = Math.floor(points / 4);
  }
  return thresholds;
}
const OSRS_XP_THRESHOLDS = buildXpThresholds();

// Binary search — faster than the original linear scan
function xpToVirtualLevel(xp) {
  let lo = 1, hi = OSRS_XP_THRESHOLDS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (xp >= OSRS_XP_THRESHOLDS[mid]) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function getDisplayedLevel(skillName, storedLevel, storedXp) {
  if (skillName === "Overall") return storedLevel;
  return xpToVirtualLevel(storedXp);
}

// =============================================================================
// DATA FETCHING  (all players fetched in parallel, once)
// =============================================================================
async function fetchPlayerData(playerName) {
  const url = `./data/${playerName}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

// =============================================================================
// DOM HELPERS
// =============================================================================
function icon(src, alt, size = "24px") {
  const img = document.createElement("img");
  img.src = src; img.alt = alt;
  img.style.cssText = `width:${size};height:${size};vertical-align:middle;margin-right:6px;`;
  return img;
}

function makeTable(headers) {
  const table = document.createElement("table");
  table.border = "1";
  table.style.width = "100%";
  const hr = document.createElement("tr");
  headers.forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    hr.appendChild(th);
  });
  table.appendChild(hr);
  return table;
}

function makeCategoryBox(titleText, dataCategory = null) {
  const box = document.createElement("div");
  box.classList.add("category-box");
  if (dataCategory) box.dataset.category = dataCategory;
  const h2 = document.createElement("h2");
  h2.textContent = titleText;
  h2.classList.add("collapsible-header");
  h2.addEventListener("click", () => {
    const content = h2.nextElementSibling;
    if (content) content.classList.toggle("collapsed");
  });
  box.appendChild(h2);

  // Override appendChild so any content added after h2 auto-gets collapsible-content
  const _appendChild = box.appendChild.bind(box);
  box.appendChild = (child) => {
    if (child !== h2) child.classList?.add("collapsible-content");
    return _appendChild(child);
  };

  return box;
}

/**
 * Builds a leader row + hidden runner-up row — used by both category leaders
 * and item leaders. scoreLabel is the 3rd column header text.
 */
function makeLeaderWithRunnerUps(table, labelCell, leaderName, scoreText, runnerUps, scoreLabel = "Score") {
  // Leader row
  const row = document.createElement("tr");
  row.style.cursor = "pointer";
  row.title = "Click to see runner-ups";
  row.appendChild(labelCell);

  const leaderCell = document.createElement("td");
  leaderCell.style.fontWeight = "bold";
  leaderCell.style.color = LEADER_COLORS[leaderName] || "black";
  leaderCell.textContent = leaderName;
  row.appendChild(leaderCell);

  const scoreCell = document.createElement("td");
  scoreCell.textContent = scoreText;
  row.appendChild(scoreCell);

  // Runner-up detail row
  const detailRow = document.createElement("tr");
  detailRow.style.display = "none";
  const detailCell = document.createElement("td");
  detailCell.colSpan = 3;
  detailCell.innerHTML = `
    <div style="padding:8px 12px;background:rgba(0,0,0,0.03);border-left:3px solid #ddd">
      <table style="width:100%;font-size:0.95em">
        <tr><th>#</th><th>Player</th><th>${scoreLabel}</th></tr>
        ${runnerUps.map((p, i) => `
          <tr>
            <td>${i + 2}</td>
            <td style="font-weight:500;color:${LEADER_COLORS[p.name || p.player] || "black"}">${p.name || p.player}</td>
            <td>${p.scoreText}</td>
          </tr>`).join("")}
      </table>
    </div>`;
  detailRow.appendChild(detailCell);

  row.addEventListener("click", () => {
    detailRow.style.display = detailRow.style.display === "none" ? "" : "none";
  });

  table.appendChild(row);
  table.appendChild(detailRow);
}

// =============================================================================
// GAME DATA COMPUTATIONS
// =============================================================================
function getLatestClueTiers(snapshots) {
  const tiers = ["all","beginner","easy","medium","hard","elite","master"];
  const empty = Object.fromEntries(tiers.map(t => [t, 0]));
  if (!snapshots?.length) return empty;

  const last = snapshots[snapshots.length - 1];
  const getScore = key => {
    const e = last.minigames?.[key];
    return (e && e.score >= 0) ? e.score : 0;
  };
  return {
    all:      getScore("Clue Scrolls (all)"),
    beginner: getScore("Clue Scrolls (beginner)"),
    easy:     getScore("Clue Scrolls (easy)"),
    medium:   getScore("Clue Scrolls (medium)"),
    hard:     getScore("Clue Scrolls (hard)"),
    elite:    getScore("Clue Scrolls (elite)"),
    master:   getScore("Clue Scrolls (master)"),
  };
}

function rankPlayersByClues(playersData) {
  return playersData
    .map(player => ({
      name: player.player_name,
      ...getLatestClueTiers(player.snapshots),
    }))
    .sort((a, b) => b.all - a.all);
}

function getSkillLevelChanges(snapshots) {
  if (snapshots.length < 2) return [];
  const prev = snapshots[snapshots.length - 2];
  const curr = snapshots[snapshots.length - 1];
  return Object.keys(curr.skills).reduce((acc, skill) => {
    const oldLevel = getDisplayedLevel(skill, prev.skills[skill].level, prev.skills[skill].experience);
    const newLevel = getDisplayedLevel(skill, curr.skills[skill].level, curr.skills[skill].experience);
    if (newLevel > oldLevel) acc.push({ skill, oldLevel, newLevel, diff: newLevel - oldLevel });
    return acc;
  }, []);
}

function getMinigameChanges(snapshots) {
  if (snapshots.length < 2) return [];
  const prev = snapshots[snapshots.length - 2].minigames || {};
  const curr = snapshots[snapshots.length - 1].minigames || {};
  return Object.keys(curr).reduce((acc, key) => {
    const oldScore = prev[key]?.score ?? 0;
    const newScore = curr[key]?.score ?? 0;
    if (newScore > oldScore) acc.push({ name: key, oldScore, newScore, diff: newScore - oldScore });
    return acc;
  }, []);
}

function calculateGains(snapshots) {
  if (snapshots.length < 2) {
    const cat = snapshots[0]?.custom_categories || {};
    return {
      Combat: 0, Gathering: 0, Production: 0, Utility: 0,
      Bosses:    cat?.Bosses?.minigames_total_score    ?? 0,
      Minigames: cat?.Minigames?.minigames_total_score ?? 0,
      Clues:     cat?.Clues?.minigames_total_score     ?? 0,
    };
  }
  const earliest = snapshots[0];
  const latest   = snapshots[snapshots.length - 1];
  const diffXP  = cat => (latest.custom_categories[cat]?.skills_total_xp   ?? 0)
                       - (earliest.custom_categories[cat]?.skills_total_xp  ?? 0);
  const latestScore = cat =>  latest.custom_categories[cat]?.minigames_total_score ?? 0;
  return {
    Combat:     diffXP("Combat"),
    Gathering:  diffXP("Gathering"),
    Production: diffXP("Production"),
    Utility:    diffXP("Utility"),
    Bosses:     latestScore("Bosses"),
    Minigames:  latestScore("Minigames"),
    Clues:      latestScore("Clues"),
  };
}

function rankPlayersByCategory(playersData, category) {
  return [...playersData].sort((a, b) => b.gains[category] - a.gains[category]);
}

function computeTopNForItem(itemName, playersData, N = RUNNER_UP_COUNT + 1) {
  return playersData
    .map(p => ({ player: p.name, score: p.latestMinigames?.[itemName]?.score ?? 0 }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || (a.player > b.player ? 1 : -1))
    .slice(0, N);
}

// =============================================================================
// RENDERERS
// =============================================================================

/** Side-by-side Skill Table (receives already-fetched data) */
function displayHighestLevels(latestSnapshots) {
  const skillNames = Object.keys(latestSnapshots[0].skills);

  // --- Side-by-side skill table ---
  const sideTable = makeTable(["Skill", ...PLAYER_NAMES]);
  // Colour player header cells
  const headerCells = sideTable.querySelector("tr").querySelectorAll("th");
  PLAYER_NAMES.forEach((name, i) => {
    headerCells[i + 1].style.color = LEADER_COLORS[name] || "black";
  });

  skillNames.forEach(skill => {
    const row = document.createElement("tr");
    const skillCell = document.createElement("td");
    skillCell.appendChild(icon(skillIcon(skill), `${skill} Icon`));
    row.appendChild(skillCell);

    let maxLevel = -1, maxIndexes = [];
    latestSnapshots.forEach((snap, idx) => {
      const lvl = getDisplayedLevel(skill, snap.skills[skill].level, snap.skills[skill].experience);
      if (lvl > maxLevel) { maxLevel = lvl; maxIndexes = [idx]; }
      else if (lvl === maxLevel) maxIndexes.push(idx);
    });

    latestSnapshots.forEach((snap, idx) => {
      const td = document.createElement("td");
      const vLvl = getDisplayedLevel(skill, snap.skills[skill].level, snap.skills[skill].experience);
      td.textContent = vLvl;
      if (maxIndexes.includes(idx)) {
        const crown = document.createElement("span");
        crown.textContent = "\uD83D\uDC51";
        crown.setAttribute("aria-label", "leader");
        crown.style.marginLeft = "6px";
        td.appendChild(crown);
      }
      row.appendChild(td);
    });
    sideTable.appendChild(row);
  });

  const scrollContainer = document.createElement("div");
  scrollContainer.classList.add("collapsible-content");
  scrollContainer.style.overflowX = "auto";
  scrollContainer.appendChild(sideTable);

  const sideBox = makeCategoryBox("Skill Table");
  sideBox.appendChild(scrollContainer);

  document.getElementById("results").appendChild(sideBox);
}

/** Category Leaders summary table (Bosses / Clues / Minigames totals) */
function displayCategoryLeaders(playersData) {
  const categories = ["Bosses", "Clues", "Minigames"];
  const table = makeTable(["Category", "Leader", "Total"]);

  categories.forEach(cat => {
    const ranked = rankPlayersByCategory(playersData, cat);
    if (!ranked.length) return;

    const top = ranked[0];

    const catCell = document.createElement("td");
    catCell.appendChild(icon(CAT_ICONS[cat] || IMAGE_BASE + "default-icon.png", cat));
    catCell.appendChild(document.createTextNode(cat));

    const runnerUps = ranked.slice(1, RUNNER_UP_COUNT + 1).map(p => ({
      name: p.name,
      scoreText: p.gains[cat].toLocaleString(),
    }));
    makeLeaderWithRunnerUps(table, catCell, top.name, top.gains[cat].toLocaleString(), runnerUps, "Total");
  });

  const box = makeCategoryBox("Category Leaders");
  box.appendChild(table);
  document.getElementById("results").appendChild(box);
}

/** Generic item leaders table (bosses, minigames, clues, etc.) */
function displayItemLeaders(title, items, playersData, iconMap = {}) {
  const tbl = makeTable(["Item", "Leader", "Score"]);

  items.forEach(item => {
    const topN = computeTopNForItem(item, playersData);
    if (!topN.length) return;
    const leader = topN[0];

    const rawPath = IMAGE_BASE + `${item} icon.png`;
    const imgSrc = iconMap[item] ? iconMap[item] : encodeURI(rawPath);

    const cellItem = document.createElement("td");
    cellItem.appendChild(icon(imgSrc, prettyName(item) + " icon"));
    cellItem.appendChild(document.createTextNode(prettyName(item)));

    const runnerUps = topN.slice(1).map(e => ({
      player: e.player,
      scoreText: e.score.toLocaleString(),
    }));
    makeLeaderWithRunnerUps(tbl, cellItem, leader.player, leader.score.toLocaleString(), runnerUps, "Score");
  });

  const box = makeCategoryBox(title);
  box.appendChild(tbl);
  document.getElementById("results").appendChild(box);
}

/** Daily News — skill and minigame changes between last two snapshots */
function displayDailyNews(playersData, container) {
  const skillChangesBox = makeCategoryBox("Daily News");
  const gridContainer = document.createElement("div");
  gridContainer.classList.add("skills-changes-grid");

  const arrow = () => {
    const s = document.createElement("span");
    s.textContent = "\u27BE";
    s.setAttribute("aria-hidden", "true");
    s.style.margin = "0 4px";
    return s;
  };

  playersData.forEach(player => {
    if (!player.skillChanges.length && !player.minigameChanges.length) return;
    const playerBox = document.createElement("div");
    playerBox.classList.add("player-changes");
    const h3 = document.createElement("h3");
    h3.textContent = player.name;
    playerBox.appendChild(h3);

    const ul = document.createElement("ul");

    player.skillChanges.forEach(change => {
      const li = document.createElement("li");
      li.appendChild(icon(`${IMAGE_BASE}${change.skill} icon.png`, `${change.skill} Icon`, "20px"));
      li.appendChild(document.createTextNode(`${change.oldLevel} `));
      li.appendChild(arrow());
      li.appendChild(document.createTextNode(`${change.newLevel}`));
      ul.appendChild(li);
    });

    player.minigameChanges.forEach(change => {
      if (change.name === "Clue Scrolls (all)") return;
      const li = document.createElement("li");
      li.appendChild(icon(`${IMAGE_BASE}${change.name} icon.png`, prettyName(change.name), "20px"));
      li.appendChild(document.createTextNode(`${change.oldScore} `));
      li.appendChild(arrow());
      li.appendChild(document.createTextNode(`${change.newScore}`));
      ul.appendChild(li);
    });

    playerBox.appendChild(ul);
    gridContainer.appendChild(playerBox);
  });

  skillChangesBox.appendChild(gridContainer);
  container.appendChild(skillChangesBox);
}

/** Category switcher dropdown + all XP / KC category tables */
function displayCategorySection(playersData, container, CUSTOM_CATEGORIES) {
  // --- Dropdown ---
  const catSwitcherBox = document.createElement("div");
  Object.assign(catSwitcherBox.style, { display:"flex", justifyContent:"center", alignItems:"center", marginBottom:"20px", gap:"12px" });

  const catLabel = document.createElement("label");
  catLabel.textContent = "Show Category: ";
  catLabel.setAttribute("for", "category-switcher");
  Object.assign(catLabel.style, { fontWeight:"bold", fontSize:"1.1em" });

  const catSelect = document.createElement("select");
  catSelect.id = "category-switcher";
  Object.assign(catSelect.style, { fontSize:"1.1em", padding:"2px 8px", borderRadius:"6px", background:"#e0e0e0", color:"#333", border:"1px solid #8d6e63" });

  [
    { value: "",         label: "Select Category...", disabled: true, selected: true },
    { value: "Combat",   label: "Combat" },
    { value: "Gathering",label: "Gathering" },
    { value: "Production",label:"Production" },
    { value: "Utility",  label: "Utility" },
    { value: "Bosses",   label: "Total Boss KC" },
    { value: "Clues",    label: "Clue Scroll Completions" },
    { value: "Minigames",label: "Minigame KC" },
    { value: "ShowAll",  label: "Show All" },
  ].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value; o.textContent = opt.label;
    if (opt.disabled) o.disabled = true;
    if (opt.selected) o.selected = true;
    catSelect.appendChild(o);
  });

  catSwitcherBox.appendChild(catLabel);
  catSwitcherBox.appendChild(catSelect);
  document.getElementById("results").appendChild(catSwitcherBox);

  // Cache the switchable boxes (by data-category attribute set at creation time)
  // They don't exist yet, so we wire the listener after building them.

  // --- Category Tables ---
  const categories = ["Bosses", "Clues", "Minigames", "Combat", "Gathering", "Production", "Utility"];
  const diffCats   = new Set(["Combat", "Gathering", "Production", "Utility"]);
  const categoryBoxes = [];

  categories.forEach(category => {
    const ranking = rankPlayersByCategory(playersData, category);
    const heading = document.createElement("h2");
    heading.classList.add("collapsible-header");
    heading.addEventListener("click", () => {
      const c = heading.nextElementSibling;
      if (c) c.classList.toggle("collapsed");
    });

    if (CATEGORY_SKILL_ICONS[category]) {
      const symbolContainer = document.createElement("span");
      symbolContainer.style.marginRight = "8px";
      CATEGORY_SKILL_ICONS[category].forEach(skillName => {
        symbolContainer.appendChild(icon(skillIcon(skillName), `${category} Symbol`));
      });
      heading.appendChild(symbolContainer);
    }
    const headingText = document.createElement("span");
    headingText.textContent = CATEGORY_HEADING[category] || `${category} XP`;
    heading.appendChild(headingText);

    const categoryBox = document.createElement("div");
    categoryBox.classList.add("category-box");
    categoryBox.dataset.category = category;
    categoryBox.appendChild(heading);

    const table = document.createElement("table");
    table.classList.add("collapsible-content");
    table.border = "1"; table.style.width = "100%";
    table.innerHTML = `
      <thead><tr>
        <th>Rank</th><th>Player</th>
        <th>${diffCats.has(category) ? `${category} XP Gains` : `${category} Total`}</th>
      </tr></thead>`;
    const tbody = document.createElement("tbody");

    ranking.forEach((p, index) => {
      const row = document.createElement("tr");
      let displayName = p.name;
      if (index === 0) {
        row.style.fontWeight = "bold";
        if (category === "Clues")     displayName += " 🗺 the CLUE MASTER";
        if (category === "Bosses")    displayName += " ☠ the BOSS KILLER";
        if (category === "Minigames") displayName += " 🎮 the MINIGAME CHAMP";
      }
      row.innerHTML = `<td>${index + 1}</td><td>${displayName}</td><td>${p.gains[category].toLocaleString()}</td>`;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    categoryBox.appendChild(table);
    container.appendChild(categoryBox);
    categoryBoxes.push(categoryBox);
  });

  // --- Switcher logic (now that boxes exist) ---
  // Hide all by default
  categoryBoxes.forEach(b => b.style.display = "none");

  catSelect.addEventListener("change", function () {
    const selected = this.value;
    categoryBoxes.forEach(box => {
      if (selected === "ShowAll") {
        box.style.display = "";
      } else if (selected && CATEGORY_HEADING[selected]) {
        box.style.display = box.dataset.category === selected ? "" : "none";
      } else {
        box.style.display = "none";
      }
    });
  });
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  // Fetch everything in parallel — gamedata + all players at once
  const [CUSTOM_CATEGORIES, ...rawPlayerData] = await Promise.all([
    fetch("./data/gamedata.json").then(r => r.json()),
    ...PLAYER_NAMES.map(fetchPlayerData),
  ]);

  // Enrich player data — compute once, reuse everywhere
  const latestSnapshots = [];
  const playersData = rawPlayerData.map(data => {
    const lastSnap = data.snapshots[data.snapshots.length - 1];
    latestSnapshots.push(lastSnap);
    return {
      name:            data.player_name,
      gains:           calculateGains(data.snapshots),
      skillChanges:    getSkillLevelChanges(data.snapshots),
      minigameChanges: getMinigameChanges(data.snapshots),
      latestMinigames: lastSnap.minigames,
    };
  });

  const container = document.getElementById("results");

  // 1. Daily News
  displayDailyNews(playersData, container);

  // 2. Skill Leaders + Skill Table (pass already-fetched snapshots — no second fetch)
  displayHighestLevels(latestSnapshots);

  // 3. Category Leaders summary
  displayCategoryLeaders(playersData);

  // 4. Item leader tables
  displayItemLeaders("Boss Leaders",     CUSTOM_CATEGORIES.Bosses.minigames,    playersData);
  displayItemLeaders("Raid Leaders",     CUSTOM_CATEGORIES.Raids.minigames,     playersData);
  displayItemLeaders("Clue Leaders",     CUSTOM_CATEGORIES.Clues.minigames,     playersData);
  displayItemLeaders("Other Leaders",    CUSTOM_CATEGORIES.Others.minigames,    playersData);
  displayItemLeaders("Minigame Leaders", CUSTOM_CATEGORIES.Minigames.minigames, playersData);

  // 5. Category switcher + XP/KC tables
  displayCategorySection(playersData, container, CUSTOM_CATEGORIES);
}

main();
// Collapsible is now built into makeCategoryBox — no post-render pass needed
