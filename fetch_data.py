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
    "LMS - Rank", "PVPARENA", "Soul Wars Zeal", "Rifts closed", "Colosseum Glory", "Collections Logged",
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
    "The Whisperer", "Theatre of Blood", 
    "Theatre of Blood: Hard Mode", "Thermonuclear Smoke Devil", "Tombs of Amascut", "Tombs of Amascut: Expert Mode", "TzKal-Zuk", "TzTok-Jad", 
    "Vardorvis", "Venenatis", "Vet'ion", "Vorkath", "Wintertodt", "Yama", "Zalcano", "Zulrah"
]

# Custom kategoriat jotta voi seurata niide kehitystä, tässä ny molemmat skills ja minigame samassa en jaksanu parantaa toimii näin
CUSTOM_CATEGORIES = {
    "Combat": {
        "skills": ["Attack", "Defence", "Hitpoints", "Magic", "Prayer", "Ranged", "Strength"],
        "minigames": []
    },
    "Gathering": {
        "skills": ["Farming", "Fishing", "Hunter", "Mining", "Woodcutting"],
        "minigames": []
    },
    "Production": {
        "skills": ["Cooking", "Crafting", "Fletching", "Herblore", "Runecraft", "Smithing"],
        "minigames": []
    },
    "Utility": {
        "skills": ["Agility", "Construction", "Firemaking", "Slayer", "Thieving"],
        "minigames": []
    },
    "Bosses": {
        # pelkät OIKEET BOSSIT
        "skills": [],
        "minigames": ["Abyssal Sire", "Alchemical Hydra", "Amoxliatl", "Araxxor", "Artio", "Barrows", "Bryophyta", 
                                    "Callisto", "Calvarion", "Cerberus", "Chaos Elemental", "Chaos Fanatic", 
                                    "Commander Zilyana", "Corporeal Beast", "Crazy Archaeologist", 
                                    "Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme", 
                                    "Deranged Archaeologist", "Duke Sucellus", "General Graardor", 
                                    "Giant Mole", "Grotesque Guardians", "Hespori", "Kalphite Queen", 
                                    "King Black Dragon", "Kraken", "Kree'Arra", "K'ril Tsutsaroth", "Lunar Chests",
                                    "Mimic", "Nex", "Nightmare", "Phosani's Nightmare", "Obor", 
                                    "Phantom Muspah", "Sarachnis", "Scorpia", "Scurrius", "Skotizo", "Sol Heredit", 
                                    "Spindel", "The Gauntlet", "The Corrupted Gauntlet", "The Hueycoatl",
                                    "The Leviathan","The Royal Titans", "The Whisperer", "Thermonuclear Smoke Devil", 
                                    "TzKal-Zuk", "TzTok-Jad", "Vardorvis", "Venenatis", "Vet'ion", "Vorkath", "Yama", "Zulrah"]
    },
    "Clues": {
        # Kaikki cluet samaa
        "skills": [],
        "minigames": ["Clue Scrolls (all)"]
    },
    "Collection log" : {
        "skills": [],
        "minigames": ["Collections Logged"]
    },
    "Minigames" : {
        "skills": [],
        "minigames": ["Tempoross", "Wintertodt", "Rifts closed", "Zalcano"]
    }
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

    # dict jossa parsettu data
    parsed = {
        "player_name": player_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",  # e.g., 2025-02-05T12:34:56Z
        "skills": {},
        "minigames": {},
        "custom_categories": {}
    }

    # --------------------------
    # Parse skills (first 24 lines)
    # Each line: rank, level, experience
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
            parsed["skills"][skill_name] = {
                "rank": -1,
                "level": -1,
                "experience": -1
            }

    # --------------------------
    # Parse minigames (remaining lines)
    # Incl: rank, score
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
    # --------------------------
    for category_name, cat_data in CUSTOM_CATEGORIES.items():
        skill_sum = 0
        for skill_name in cat_data.get("skills", []):
            if skill_name in parsed["skills"]:
                skill_sum += parsed["skills"][skill_name]["experience"]

        minigame_sum = 0
        for mg_name in cat_data.get("minigames", []):
            if mg_name in parsed["minigames"]:
                raw_score = parsed["minigames"][mg_name]["score"]
                # If raw_score is negative, treat as 0
                if raw_score < 0:
                    raw_score = 0
                minigame_sum += raw_score

        # Store the totals in your parsed data.
        parsed["custom_categories"][category_name] = {
            "skills_total_xp": skill_sum,
            "minigames_total_score": minigame_sum
        }

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
    # vaTIALAn pojat
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
