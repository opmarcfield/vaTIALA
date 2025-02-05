import requests
import json
import os
from datetime import datetime

# The order of SKILLS in index_lite data (first 24 lines)
SKILLS = [
    "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged", 
    "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
    "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility", 
    "Thieving", "Slayer", "Farming", "Runecraft", "Hunter", "Construction"
]

# Minigames (remaining lines after the first 24)
MINIGAMES = [
    "BH1","BH2","BH3","BH4","BH5","BH6","Clue Scrolls (all)", 
    "Clue Scrolls (beginner)", "Clue Scrolls (easy)", "Clue Scrolls (medium)", 
    "Clue Scrolls (hard)", "Clue Scrolls (elite)", "Clue Scrolls (master)", 
    "LMS - Rank", "PVPARENA", "Soul Wars Zeal", "Rifts closed", "Colosseum Glory",
    "Abyssal Sire", "Alchemical Hydra", "Amoxliatl", "Araxxor", "Artio", 
    "Barrows", "Bryophyta", "Callisto", "Calvarion", "Cerberus", 
    "Chambers of Xeric", "Chambers of Xeric: Challenge Mode", "Chaos Elemental", 
    "Chaos Fanatic", "Commander Zilyana", "Corporeal Beast", 
    "Crazy Archaeologist", "Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme", 
    "Deranged Archaeologist", "Duke Sucellus", "General Graardor", "Giant Mole", 
    "Grotesque Guardians", "Hespori", "Kalphite Queen", "King Black Dragon", 
    "Kraken", "Kree'Arra", "K'ril Tsutsaroth", "Lunar Chests", "Mimic", "Nex", 
    "Nightmare", "Phosani's Nightmare", "Obor", "Phantom Muspah", "Sarachnis", 
    "Scorpia", "Scurrius", "Skotizo", "Sol Heredit", "Spindel", "Tempoross", 
    "The Gauntlet", "The Corrupted Gauntlet", "The Hueycoatl", "The Leviathan", "The Royal Titans", 
    "The Whisperer", "Thermonuclear Smoke Devil", "TzKal-Zuk", "TzTok-Jad", 
    "Vardorvis", "Venenatis", "Vet'ion", "Vorkath", "Wintertodt", "Zalcano", "Zulrah"
]

# Example of a custom categories definition:
#   "alchemy": sum of Herblore + Magic experience
# You can add more categories and skill mappings if needed.
CUSTOM_CATEGORIES = {
    "Combat": [
        "Attack",
        "Defence",
        "Hitpoints",
        "Magic",
        "Prayer",
        "Ranged",
        "Strength"
    ],
    "Gathering": [
        "Farming",
        "Fishing",
        "Hunter",
        "Mining",
        "Woodcutting"
    ],
    "Production": [
        "Cooking",
        "Crafting",
        "Fletching",
        "Herblore",
        "Runecraft",
        "Smithing"
    ],
    "Utility": [
        "Agility",
        "Construction",
        "Firemaking",
        "Slayer",
        "Thieving"
    ]
}


def fetch_player_data(player_name):
    """
    Fetches raw hiscore text data from the index_lite endpoint.
    Returns the text if successful, or None if there's an error.
    """
    url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player={player_name}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        print(f"Error fetching data for player: {player_name}")
        return None

def parse_player_data(player_name, raw_data):
    """
    Parses the raw index_lite data into a structured dictionary.
    Splits out the first 24 lines as SKILLS, remainder as MINIGAMES.
    Also computes custom categories (e.g., 'alchemy').
    """
    lines = raw_data.strip().split("\n")

    # Dictionary to hold parsed data
    parsed = {
        "player_name": player_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",  # e.g., 2025-02-05T12:34:56Z
        "skills": {},
        "minigames": {},
        "custom_categories": {}
    }

    # --------------------------
    # Parse skills (first 24 lines)
    # Each line typically: rank, level, experience
    # e.g. "1587765,1306,6338822"
    # --------------------------
    for i, line in enumerate(lines[:24]):
        skill_name = SKILLS[i]
        parts = line.split(',')
        if len(parts) >= 3:
            rank, level, experience = parts[:3]
            rank = int(rank) if rank.isdigit() else -1
            level = int(level) if level.isdigit() else -1
            experience = int(experience) if experience.isdigit() else -1
            parsed["skills"][skill_name] = {
                "rank": rank,
                "level": level,
                "experience": experience
            }
        else:
            # If the line is malformed
            parsed["skills"][skill_name] = {
                "rank": -1,
                "level": -1,
                "experience": -1
            }

    # --------------------------
    # Parse minigames (remaining lines)
    # Typically: rank, score
    # e.g. "100,15"
    # --------------------------
    minigame_lines = lines[24:]
    for i, line in enumerate(minigame_lines):
        if i < len(MINIGAMES):
            minigame_name = MINIGAMES[i]
            parts = line.split(',')
            if len(parts) >= 2:
                rank, score = parts[:2]
                rank = int(rank) if rank.isdigit() else -1
                score = int(score) if score.isdigit() else -1
                parsed["minigames"][minigame_name] = {
                    "rank": rank,
                    "score": score
                }
            else:
                parsed["minigames"][minigame_name] = {
                    "rank": -1,
                    "score": -1
                }

    # --------------------------
    # Compute custom categories
    # Example: 'alchemy' = sum of Herblore + Magic XP
    # --------------------------
    for category_name, skill_list in CUSTOM_CATEGORIES.items():
        total_xp = 0
        for skill in skill_list:
            if skill in parsed["skills"]:
                total_xp += parsed["skills"][skill]["experience"]
        parsed["custom_categories"][category_name] = total_xp

    return parsed

def save_player_data_to_json(player_data):
    """
    Appends the new 'snapshot' (skills, minigames, custom_categories, and timestamp)
    to an existing JSON file if it exists, or creates a new file if not.
    """
    player_name = player_data["player_name"].replace(" ", "_")
    filename = f"docs/data/{player_name}.json"

    # If the file already exists, load its contents
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    else:
        # If no file exists yet, create a new structure
        existing_data = {
            "player_name": player_data["player_name"],
            "snapshots": []
        }

    # Create a snapshot object from the latest parse
    snapshot = {
        "timestamp": player_data["timestamp"],
        "skills": player_data["skills"],
        "minigames": player_data["minigames"],
        "custom_categories": player_data["custom_categories"]
    }

    # Append this snapshot to the existing 'snapshots' array
    existing_data["snapshots"].append(snapshot)

    # Save back to the same JSON file
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2)

    print(f"Appended new daily snapshot to {filename}")


def main():
    # The players for whom we want to fetch data
    player_names = ["vaOPA", "vaPEEXI", "vaRautaMake", "vaROSQIS"]

    # For each player, fetch and parse data, then store in a JSON file
    for player_name in player_names:
        raw_data = fetch_player_data(player_name)
        if raw_data:
            parsed_data = parse_player_data(player_name, raw_data)
            save_player_data_to_json(parsed_data)
        else:
            print(f"Failed to fetch or parse data for {player_name}.")

if __name__ == "__main__":
    main()
